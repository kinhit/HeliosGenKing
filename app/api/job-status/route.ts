import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";
import { resumeKieJob } from "@/lib/kieJobPoller";
import { resumeMagnificJob } from "@/lib/magnificJobPoller";
import * as guestDb from "@/lib/guest/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function recoverJob(taskId: string): "done" | "error" | "pending" | "not_found" {
  const gen = guestDb.recoverJob(taskId);
  if (!gen) return "not_found";
  if (gen.status === "done") {
    const result = gen.video_url
      ? { status: "done" as const, videoUrl: gen.video_url }
      : { status: "done" as const, imageUrl: gen.image_url ?? undefined, imageUrls: gen.image_urls ?? undefined };
    jobStore.set(taskId, result);
    return "done";
  }
  if (gen.status === "error") {
    jobStore.set(taskId, { status: "error", error: gen.error_msg ?? "Generation failed" });
    return "error";
  }
  return "pending";
}

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const result = jobStore.get(taskId);
  const storedGeneration = guestDb.recoverJob(taskId);

  // Task known to local store — return as-is, no kie.ai polling
  if (result) {
    // If a restart killed the background poller for a job that's still pending,
    // restart it so the result can still land.
    if (result.status === "pending") {
      if (taskId.startsWith("magnific-") && storedGeneration?.provider_task_id && storedGeneration.model) {
        resumeMagnificJob(
          taskId,
          storedGeneration.provider_task_id,
          storedGeneration.model,
          result.type === "video" ? "video" : "image",
          storedGeneration.user_id,
          storedGeneration.provider_status_endpoint,
        );
      } else if (!taskId.startsWith("azure-") && !taskId.startsWith("magnific-")) {
        resumeKieJob(taskId, result.type === "video" ? "video" : "image");
      }
    }
    return NextResponse.json(result);
  }

  // Task not in local store (server restarted / cold start).
  // Azure jobs have no DB record and can't be recovered.
  if (taskId.startsWith("azure-")) {
    return NextResponse.json({ status: "not_found" });
  }

  if (taskId.startsWith("magnific-")) {
    if (!storedGeneration?.provider_task_id || !storedGeneration.model) {
      return NextResponse.json({ status: "not_found" });
    }
    const type = storedGeneration.generation_type === "video" ? "video" : "image";
    jobStore.set(taskId, { status: "pending", type, userId: storedGeneration.user_id ?? undefined });
    resumeMagnificJob(
      taskId,
      storedGeneration.provider_task_id,
      storedGeneration.model,
      type,
      storedGeneration.user_id,
      storedGeneration.provider_status_endpoint,
    );
    return NextResponse.json({ status: "pending", type });
  }

  const recovered = recoverJob(taskId);

  if (recovered === "done" || recovered === "error") {
    return NextResponse.json(jobStore.get(taskId)!);
  }

  if (recovered === "pending") {
    return NextResponse.json({ status: "pending" });
  }

  return NextResponse.json({ status: "not_found" });
}
