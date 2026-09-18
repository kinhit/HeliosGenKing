import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

/** Convert provider configuration errors returned by the API into the active UI language. */
export function localizeGenerationError(locale: Locale, error: string): string {
  const normalized = error.toLowerCase();
  if (normalized.includes("kie.ai api key") || normalized.includes("kie.ai api token")) {
    return translate(locale, "generation.kieKeyMissing", error);
  }
  if (normalized.includes("magnific api key")) {
    return translate(locale, "generation.magnificKeyMissing", error);
  }
  if (normalized.includes("unsupported magnific media type")) {
    return translate(locale, "generation.magnificUnsupportedMedia", error);
  }
  const referenceLimit = error.match(/reference image limit exceeded:.*?up to\s+(\d+)/i);
  if (referenceLimit) {
    return locale === "zh-CN"
      ? `该模型最多支持 ${referenceLimit[1]} 张参考图，请移除多余连接后重试。`
      : `This model supports up to ${referenceLimit[1]} reference images. Remove extra connections and try again.`;
  }
  if (normalized.includes("unable to prepare") && normalized.includes("reference image")) {
    return translate(locale, "generation.referenceImagePreparationFailed", error);
  }
  if (normalized.includes("reference images cannot be combined with a start or end frame")) {
    return translate(locale, "generation.frameReferenceConflict", error);
  }
  if (normalized.includes("operation timed out") || normalized.includes("timed out while reading streamed response")) {
    return translate(locale, "generation.connectionTimedOut", error);
  }
  return error;
}
