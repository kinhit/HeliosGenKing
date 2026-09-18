import { jobStore } from "@/lib/jobStore";
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
const MAX_POLLS = 180; // up to roughly 20 minutes with the backoff below

type PollOptions = {
  localTaskId: string;
  remoteTaskId: string;
  modelId: string;
  type: "image" | "video";
  userId?: string | null;
};

async function fetchResult(url: string, apiKey: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "x-magnific-api-key": apiKey },
    cache: "no-store",
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

async function mirrorGenerated(url: string, type: "image" | "video"): Promise<string> {
  const response = await fetch(url, { cache: "no-store" });
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

  const endpoint = options.type === "image"
    ? (model as ImageModel).magnific?.endpoint
    : (model as VideoModel).magnific?.statusEndpoint;
  if (!endpoint) throw new Error(`Magnific status endpoint is missing for ${options.modelId}`);

  const url = `${MAGNIFIC_BASE}${endpoint.replace(/\/$/, "")}/${encodeURIComponent(options.remoteTaskId)}`;
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    const payload = await fetchResult(url, apiKey);
    const status = statusFromResponse(payload);
    const generated = generatedUrlsFromResponse(payload);

    // The API examples include placeholder URLs while a task is still CREATED.
    // Only mirror output after a terminal success status is reported.
    if (["COMPLETED", "SUCCEEDED", "SUCCESS", "DONE"].includes(status)) {
      const stored = await Promise.all(generated.map((item) => mirrorGenerated(item, options.type)));
      if (stored.length === 0) throw new Error("Magnific completed without an output URL");

      if (options.type === "video") {
        jobStore.set(options.localTaskId, { status: "done", videoUrl: stored[0] });
        guestDb.updateGeneration(options.localTaskId, { status: "done", video_url: stored[0] });
      } else {
        jobStore.set(options.localTaskId, { status: "done", imageUrl: stored[0], imageUrls: stored });
        guestDb.updateGeneration(options.localTaskId, { status: "done", image_url: stored[0], image_urls: stored });
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
  }

  throw new Error("Magnific task timed out while waiting for a result");
}

function start(options: PollOptions): void {
  if (activeJobs.has(options.localTaskId)) return;
  activeJobs.add(options.localTaskId);
  void runPoll(options)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[magnific-poller]", options.localTaskId, message);
      jobStore.set(options.localTaskId, { status: "error", error: message });
      guestDb.updateGeneration(options.localTaskId, { status: "error", error_msg: message });
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
): void {
  if (!remoteTaskId || !modelId) return;
  start({ localTaskId, remoteTaskId, modelId, type, userId });
}
