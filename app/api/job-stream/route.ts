import { NextRequest } from "next/server";
import { jobStore, type JobResult } from "@/lib/jobStore";
import { jobEvents } from "@/lib/jobEvents";
import { resumeKieJob } from "@/lib/kieJobPoller";
import { resumeMagnificJob } from "@/lib/magnificJobPoller";
import { ASYNC_GENERATION_TIMEOUT_MS } from "@/lib/jobTiming";
import * as guestDb from "@/lib/guest/db";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
};

function immediate(payload: JobResult): Response {
  return new Response(`data: ${JSON.stringify(payload)}\n\n`, { headers: SSE_HEADERS });
}

function recoverJob(taskId: string): JobResult | null {
  const gen = guestDb.recoverJob(taskId);
  if (gen?.status === "done") {
    return gen.video_url
      ? { status: "done", videoUrl: gen.video_url }
      : { status: "done", imageUrl: gen.image_url ?? undefined, imageUrls: gen.image_urls ?? undefined };
  }
  if (gen?.status === "error") {
    return { status: "error", error: gen.error_msg ?? "Generation failed" };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) return new Response("taskId required", { status: 400 });

  const persisted = guestDb.recoverJob(taskId);
  let existing = jobStore.get(taskId);

  // Already settled in jobStore — respond immediately, no stream needed.
  if (existing && existing.status !== "pending") {
    return immediate(existing);
  }

  if (!existing) {
    const recovered = recoverJob(taskId);
    if (recovered) {
      jobStore.set(taskId, recovered);
      return immediate(recovered);
    }
    if (!persisted || persisted.status !== "pending") {
      return immediate({ status: "error", error: "Job not found" });
    }
    existing = {
      status: "pending",
      type: persisted.generation_type === "video" ? "video" : "image",
      userId: persisted.user_id ?? undefined,
    };
    jobStore.set(taskId, existing);
  }

  // Restart the correct provider poller if a server restart lost it.
  if ((persisted?.provider === "magnific" || taskId.startsWith("magnific-"))
      && persisted?.provider_task_id && persisted.model) {
    resumeMagnificJob(
      taskId,
      persisted.provider_task_id,
      persisted.model,
      persisted.generation_type === "video" ? "video" : "image",
      persisted.user_id,
      persisted.provider_status_endpoint,
    );
  } else if (!taskId.startsWith("azure-")) {
    resumeKieJob(taskId, existing.type === "video" ? "video" : "image");
  }

  // Job is pending — open an SSE stream and wait for the poller/callback to fire
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      let closed = false;
      const eventName = `job:${taskId}`;

      const send = (payload: JobResult) => {
        if (closed) return;
        controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
        close();
      };

      const close = () => {
        if (closed) return;
        closed = true;
        jobEvents.off(eventName, send);
        clearInterval(heartbeat);
        clearTimeout(timeout);
        controller.close();
      };

      // Keepalive comment every 25 s (proxies drop idle SSE connections)
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(enc.encode(": ping\n\n"));
      }, 25_000);

      // Hard cap — emit error if callback never arrives
      const timeout = setTimeout(() => {
        send({ status: "error", error: "Generation timed out" });
      }, ASYNC_GENERATION_TIMEOUT_MS);

      jobEvents.on(eventName, send);

      // The poller may have completed between the initial check and listener
      // registration. Re-read after subscribing so that completion cannot be lost.
      const latest = jobStore.get(taskId);
      if (latest && latest.status !== "pending") send(latest);

      req.signal.addEventListener("abort", () => {
        close();
      });
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
