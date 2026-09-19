import { IMAGE_MODELS, VIDEO_MODELS, type ImageModel, type VideoModel } from "@/lib/modelConfig";
import type { MagnificReferenceImage } from "@/lib/magnificMime";

export const MAGNIFIC_BASE = "https://api.magnific.com";

const IMAGE_RATIOS: Record<string, string> = {
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
  return VIDEO_RATIOS[value] ?? "widescreen_16_9";
}

export function magnificResolution(value: string): string {
  return value === "1k" ? "1k" : value === "4k" ? "4k" : value;
}

export function taskIdFromResponse(payload: unknown): string | null {
  const data = (payload as { data?: { task_id?: unknown; taskId?: unknown; id?: unknown } })?.data;
  const taskId = data?.task_id ?? data?.taskId ?? data?.id;
  return typeof taskId === "string" && taskId ? taskId : null;
}

export function generatedUrlsFromResponse(payload: unknown): string[] {
  const generated = (payload as { data?: { generated?: unknown } })?.data?.generated;
  return Array.isArray(generated) ? generated.filter((url): url is string => typeof url === "string" && url.length > 0) : [];
}

export function statusFromResponse(payload: unknown): string {
  const status = (payload as { data?: { status?: unknown } })?.data?.status;
  return typeof status === "string" ? status.toUpperCase() : "UNKNOWN";
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

  if (model.id === "magnific-kling-2-6-pro") {
    input.aspect_ratio = magnificVideoAspectRatio(opts.aspectRatio);
    const parsedCfgScale = Number(opts.mode);
    input.cfg_scale = Number.isFinite(parsedCfgScale) ? Math.max(0, Math.min(1, parsedCfgScale)) : 0.5;
  } else {
    if (opts.seed !== undefined && Number.isFinite(opts.seed)) input.seed = opts.seed;
    if (magnific.includeAspectRatio) input.aspect_ratio = magnificVideoAspectRatio(opts.aspectRatio);
    if (magnific.includeFps) input.fps = opts.fps ?? magnific.defaultFps ?? 25;
  }

  return input;
}
