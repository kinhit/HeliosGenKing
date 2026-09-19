import { jobStore } from "@/lib/jobStore";
import { jobEvents } from "@/lib/jobEvents";
import { ASYNC_GENERATION_TIMEOUT_MS } from "@/lib/jobTiming";
import { uploadBuffer } from "@/lib/storage";
import { getMagnificKeyForUser } from "@/lib/getMagnificKey";
import { type ImageModel, type VideoModel } from "@/lib/modelConfig";
import {
  MAGNIFIC_BASE,
  getMagnificModel,
  generatedUrlsFromResponse,
  statusFromResponse,
} from "@/lib/magnific";
import * as guestDb from "@/lib/guest/db";

const activeJobs = new Set<string>();
type PollOptions = {
  localTaskId: string;
  remoteTaskId: string;
  modelId: string;
  type: "image" | "video";
  userId?: string | null;
  statusEndpoint?: string;
};

async function fetchResult(url: string, apiKey: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "x-magnific-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { /* handled below */ }
  if (!response.ok) {
    const message = (payload as { message?: string; error?: string })?.message
      ?? (payload as { message?: string; error?: string })?.error
      ?? text.slice(0, 500);
    throw new Error(`Magnific status ${response.status}: ${message || "request failed"}`);
  }
  return payload;
}

function isRetryableStatusError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return !/Magnific status (400|401|403|404)/i.test(message);
}

async function mirrorGenerated(url: string, type: "image" | "video"): Promise<string> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10 * 60 * 1000),
  });
  if (!response.ok) throw new Error(`Magnific output download failed (${response.status})`);
  const contentType = response.headers.get("content-type")
    ?? (type === "video" ? "video/mp4" : "image/jpeg");
  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadBuffer(buffer, contentType, "generated");
}

async function runPoll(options: PollOptions): Promise<void> {
  const model = getMagnificModel(options.modelId);
  if (!model) throw new Error(`Unknown Magnific model: ${options.modelId}`);
  const apiKey = await getMagnificKeyForUser();
  if (!apiKey) throw new Error("Magnific API key is not configured. Add it in Settings.");

  const endpoint = options.statusEndpoint ?? (options.type === "image"
    ? (model as ImageModel).magnific?.endpoint
    : (model as VideoModel).magnific?.statusEndpoint);
  if (!endpoint) throw new Error(`Magnific status endpoint is missing for ${options.modelId}`);

  const url = `${MAGNIFIC_BASE}${endpoint.replace(/\/$/, "")}/${encodeURIComponent(options.remoteTaskId)}`;
  const deadline = Date.now() + ASYNC_GENERATION_TIMEOUT_MS;
  let attempt = 0;
  while (Date.now() < deadline) {
    let payload: unknown;
    try {
      payload = await fetchResult(url, apiKey);
    } catch (error) {
      if (!isRetryableStatusError(error)) throw error;
      console.warn("[magnific-poller] transient status error", options.localTaskId, error instanceof Error ? error.message : error);
      await new Promise((resolve) => setTimeout(resolve, Math.min(15_000, 2_000 + attempt * 500)));
      attempt += 1;
      continue;
    }
    const status = statusFromResponse(payload);
    const generated = generatedUrlsFromResponse(payload);

    // The API examples include placeholder URLs while a task is still CREATED.
    // Only mirror output after a terminal success status is reported.
    if (["COMPLETED", "SUCCEEDED", "SUCCESS", "DONE"].includes(status)) {
      const stored = await Promise.all(generated.map((item) => mirrorGenerated(item, options.type)));
      if (stored.length === 0) throw new Error("Magnific completed without an output URL");

      if (options.type === "video") {
        const result = { status: "done" as const, videoUrl: stored[0] };
        jobStore.set(options.localTaskId, result);
        guestDb.updateGeneration(options.localTaskId, { status: "done", video_url: stored[0] });
        jobEvents.emit(`job:${options.localTaskId}`, result);
      } else {
        const result = { status: "done" as const, imageUrl: stored[0], imageUrls: stored };
        jobStore.set(options.localTaskId, result);
        guestDb.updateGeneration(options.localTaskId, { status: "done", image_url: stored[0], image_urls: stored });
        jobEvents.emit(`job:${options.localTaskId}`, result);
      }
      return;
    }

    if (["FAILED", "ERROR", "CANCELLED", "CANCELED", "REJECTED"].includes(status)) {
      const message = (payload as { data?: { error?: string; message?: string }; error?: string })?.data?.error
        ?? (payload as { data?: { error?: string; message?: string }; error?: string })?.data?.message
        ?? (payload as { error?: string })?.error
        ?? `Magnific task ${status.toLowerCase()}`;
      throw new Error(message);
    }

    await new Promise((resolve) => setTimeout(resolve, Math.min(10_000, 2_000 + attempt * 250)));
    attempt += 1;
  }

  throw new Error(`Magnific ${model.name} task timed out while waiting for a result`);
}

function start(options: PollOptions): void {
  if (activeJobs.has(options.localTaskId)) return;
  activeJobs.add(options.localTaskId);
  void runPoll(options)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[magnific-poller]", options.localTaskId, message);
      const result = { status: "error" as const, error: message };
      jobStore.set(options.localTaskId, result);
      guestDb.updateGeneration(options.localTaskId, { status: "error", error_msg: message });
      jobEvents.emit(`job:${options.localTaskId}`, result);
    })
    .finally(() => activeJobs.delete(options.localTaskId));
}

export function pollMagnificJob(options: PollOptions): void {
  start(options);
}

export function resumeMagnificJob(
  localTaskId: string,
  remoteTaskId: string,
  modelId: string,
  type: "image" | "video",
  userId?: string | null,
  statusEndpoint?: string,
): void {
  if (!remoteTaskId || !modelId) return;
  start({ localTaskId, remoteTaskId, modelId, type, userId, statusEndpoint });
}
