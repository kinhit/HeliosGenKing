import { IMAGE_MODELS, VIDEO_MODELS, type ImageModel, type VideoModel } from "@/lib/modelConfig";
import type { MagnificReferenceImage } from "@/lib/magnificMime";

export const MAGNIFIC_BASE = "https://api.magnific.com";

const IMAGE_RATIOS: Record<string, string> = {
  "auto": "auto",
  "1:1": "square_1_1",
  "16:9": "widescreen_16_9",
  "9:16": "social_story_9_16",
  "4:3": "classic_4_3",
  "3:4": "traditional_3_4",
  "2:3": "portrait_2_3",
  "3:2": "standard_3_2",
  "21:9": "horizontal_2_1",
  "5:4": "social_5_4",
  "4:5": "social_post_4_5",
};

const VIDEO_RATIOS: Record<string, string> = {
  "adaptive": "adaptive",
  "auto": "adaptive",
  "21:9": "film_horizontal_21_9",
  "1:1": "square_1_1",
  "16:9": "widescreen_16_9",
  "9:16": "social_story_9_16",
  "4:3": "classic_4_3",
  "3:4": "traditional_3_4",
  "9:21": "film_vertical_9_21",
};

export type MagnificModel = ImageModel | VideoModel;

export function getMagnificModel(modelId: string): MagnificModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId && m.backend === "magnific")
    ?? VIDEO_MODELS.find((m) => m.id === modelId && m.backend === "magnific");
}

export function magnificImageAspectRatio(value: string): string {
  return IMAGE_RATIOS[value] ?? "square_1_1";
}

export function magnificVideoAspectRatio(value: string): string {
  return VIDEO_RATIOS[value] ?? (value === "adaptive" || value === "auto" ? "adaptive" : "widescreen_16_9");
}

export function magnificResolution(value: string): string {
  return value === "1k" ? "1k" : value === "4k" ? "4k" : value;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function stringValue(...values: unknown[]): string | null {
  const value = values.find((item) => typeof item === "string" && item.trim().length > 0);
  return typeof value === "string" ? value.trim() : null;
}

function responseRecords(payload: unknown): JsonRecord[] {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const task = asRecord(data?.task) ?? asRecord(root?.task);
  const result = asRecord(data?.result) ?? asRecord(root?.result);
  return [root, data, task, result].filter((value): value is JsonRecord => value !== null);
}

export function taskIdFromResponse(payload: unknown): string | null {
  const records = responseRecords(payload);
  return stringValue(...records.flatMap((record) => [record.task_id, record.taskId, record.id]))
    ?? stringValue(...records.map((record) => record.task));
}

function urlsFromValue(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) return value.flatMap(urlsFromValue);
  const record = asRecord(value);
  if (!record) return [];
  return [record.url, record.video_url, record.videoUrl, record.image_url, record.imageUrl]
    .flatMap(urlsFromValue);
}

export function generatedUrlsFromResponse(payload: unknown): string[] {
  const records = responseRecords(payload);
  const urls = records.flatMap((record) => [
    record.generated,
    record.output,
    record.outputs,
    record.url,
    record.video_url,
    record.videoUrl,
    record.image_url,
    record.imageUrl,
  ]).flatMap(urlsFromValue);
  return [...new Set(urls)];
}

export function statusFromResponse(payload: unknown): string {
  const records = responseRecords(payload);
  const status = stringValue(...records.flatMap((record) => [record.status, record.state, record.task_status, record.taskStatus]));
  return status?.toUpperCase() ?? "UNKNOWN";
}

export function buildMagnificImageInput(
  model: ImageModel,
  prompt: string,
  aspectRatio: string,
  quality: string,
  referenceImages: MagnificReferenceImage[] = [],
): Record<string, unknown> {
  const qualityKey = model.apiInput.qualityKey ?? "resolution";
  const mappedQuality = model.apiInput.qualityMap?.[quality] ?? magnificResolution(quality);
  const qualityValue = model.magnific?.qualityFormat === "upper" ? mappedQuality.toUpperCase() : mappedQuality;
  const aspectRatioValue = model.magnific?.aspectRatioFormat === "raw"
    ? aspectRatio
    : magnificImageAspectRatio(aspectRatio);
  const input: Record<string, unknown> = {
    prompt: prompt.slice(0, model.apiInput.promptMaxLength),
    aspect_ratio: aspectRatioValue,
  };

  input[qualityKey] = qualityValue;
  if (model.magnific?.model) input.model = model.magnific.model;

  const imageInputKey = model.magnific?.imageInputKey ?? model.apiInput.imageInputKey;
  if (imageInputKey && referenceImages.length > 0) {
    input[imageInputKey] = model.magnific?.imageInputObjects
      ? referenceImages
      : referenceImages.map(({ image }) => image);
  }

  Object.assign(input, model.magnific?.extra ?? {});
  return input;
}

export function buildMagnificVideoInput(opts: {
  model: VideoModel;
  prompt?: string;
  startFrameUrl?: string;
  endFrameUrl?: string;
  referenceImageUrls?: string[];
  referenceVideoUrls?: string[];
  referenceAudioUrls?: string[];
  aspectRatio: string;
  duration: number;
  resolution: string;
  sound: boolean;
  seed?: number;
  fps?: number;
  mode?: string;
}): Record<string, unknown> {
  const { model } = opts;
  const magnific = model.magnific;
  if (!magnific) throw new Error(`Magnific configuration missing for ${model.id}`);

  const input: Record<string, unknown> = {
    prompt: (opts.prompt ?? "").slice(0, magnific.promptMaxLength ?? model.apiInput.promptMaxLength ?? 2500),
    duration: opts.duration,
  };

  input[magnific.soundKey ?? "generate_audio"] = model.sound ? Boolean(opts.sound) : false;
  if (magnific.includeResolution !== false) input.resolution = opts.resolution;

  const hasFrameInput = Boolean(opts.startFrameUrl || opts.endFrameUrl);
  if (magnific.inputMode === "image-to-video" && opts.startFrameUrl) {
    input[magnific.imageInputKey ?? "image_url"] = opts.startFrameUrl;
  }
  if (magnific.inputMode === "image-to-video" && opts.endFrameUrl) {
    input[magnific.endImageInputKey ?? "last_frame_url"] = opts.endFrameUrl;
  }
  if (model.apiInput.referenceImagesKey && opts.referenceImageUrls?.length && !hasFrameInput) {
    input[model.apiInput.referenceImagesKey] = opts.referenceImageUrls;
  }
  if (model.apiInput.referenceVideosKey && opts.referenceVideoUrls?.length && !hasFrameInput) {
    input[model.apiInput.referenceVideosKey] = opts.referenceVideoUrls;
  }
  if (
    model.apiInput.referenceAudiosKey
    && opts.referenceAudioUrls?.length
    && (!hasFrameInput || model.referencePolicy?.audioExclusiveWithFrames === false)
  ) {
    input[model.apiInput.referenceAudiosKey] = opts.referenceAudioUrls;
  }

  // Magnific's current Seedance documentation exposes seed on some routes,
  // but HeliosGen intentionally keeps it disabled for these provider models to
  // match the Kie.ai model controls and avoid sending unsupported parameters.
  if (model.supportsSeeds && opts.seed !== undefined && Number.isFinite(opts.seed)) input.seed = opts.seed;
  if (magnific.includeAspectRatio) input.aspect_ratio = magnificVideoAspectRatio(opts.aspectRatio);
  if (magnific.includeFps) input.fps = opts.fps ?? magnific.defaultFps ?? 25;

  return input;
}
