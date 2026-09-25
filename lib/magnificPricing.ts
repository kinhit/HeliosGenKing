import type { ImageModel, VideoModel } from "@/lib/modelConfig";

export const MAGNIFIC_IMAGE_CREDITS_URL = "https://www.magnific.com/ai/docs/ai-image-generator-credits";
export const MAGNIFIC_VIDEO_CREDITS_URL = "https://www.magnific.com/ai/docs/ai-video-generator-credits";

type Locale = "en" | "zh-CN";
type CreditValue = number | { min: number; max: number };

function amount(value: CreditValue, locale: Locale): string {
  if (typeof value === "number") return new Intl.NumberFormat(locale).format(value);
  return `${new Intl.NumberFormat(locale).format(value.min)}–${new Intl.NumberFormat(locale).format(value.max)}`;
}

function unknownLabel(locale: Locale): string {
  return locale === "zh-CN" ? "费用未公开" : "Rate not published";
}

function priceDisclaimer(locale: Locale): string {
  return locale === "zh-CN"
    ? "Magnific 公开参考价；实际扣费可能因 API 账户、方案或促销而不同。"
    : "Public Magnific reference rate; actual API billing may vary by account, plan, or promotion.";
}

export function magnificImageCreditLabel(model: ImageModel, quality: string, locale: Locale): { label: string; detail: string } | null {
  if (model.backend !== "magnific") return null;
  const pricing = model.magnificCredits;
  const value = pricing?.unit === "image"
    ? pricing.byResolution?.[quality] ?? pricing.perImage
    : undefined;
  if (value === undefined) {
    return {
      label: unknownLabel(locale),
      detail: `${unknownLabel(locale)}. ${priceDisclaimer(locale)}`,
    };
  }
  return {
    label: locale === "zh-CN" ? `≈${amount(value, locale)} 积分/张` : `≈${amount(value, locale)} credits/image`,
    detail: locale === "zh-CN"
      ? `公开参考价：${amount(value, locale)} 积分/张。${priceDisclaimer(locale)}`
      : `Public reference rate: ${amount(value, locale)} credits/image. ${priceDisclaimer(locale)}`,
  };
}

export function magnificVideoRateLabel(model: VideoModel, resolution: string, locale: Locale): string | null {
  if (model.backend !== "magnific" || model.magnificCredits?.unit !== "second") return null;
  const rate = model.magnificCredits.byResolution[resolution];
  if (rate === undefined) return unknownLabel(locale);
  return locale === "zh-CN" ? `≈${amount(rate, locale)} 积分/秒` : `≈${amount(rate, locale)} credits/s`;
}

export function magnificVideoCreditEstimate(
  model: VideoModel,
  resolution: string,
  duration: number,
  mode: string,
  locale: Locale,
): { label: string; detail: string } | null {
  if (model.backend !== "magnific" || model.magnificCredits?.unit !== "second") return null;
  const rate = model.magnificCredits.byResolution[resolution];
  if (rate === undefined) {
    return { label: unknownLabel(locale), detail: `${unknownLabel(locale)}. ${priceDisclaimer(locale)}` };
  }
  const modeLabel = mode === "draft" ? (locale === "zh-CN" ? "草稿模式" : "Draft mode") : "";
  const referenceBillingNote = model.id === "magnific-seedance-2-5"
    ? (locale === "zh-CN" ? "；参考视频时长也可能计入计费时长" : "; reference-video duration may also be billable")
    : "";
  if (typeof rate !== "number") {
    return {
      label: locale === "zh-CN" ? `≈${amount(rate, locale)} 积分/秒` : `≈${amount(rate, locale)} credits/s`,
      detail: locale === "zh-CN"
        ? `${modeLabel ? `${modeLabel} · ` : ""}${amount(rate, locale)} 积分/秒 × ${duration} 秒${referenceBillingNote}。${priceDisclaimer(locale)}`
        : `${modeLabel ? `${modeLabel} · ` : ""}${amount(rate, locale)} credits/s × ${duration}s${referenceBillingNote}. ${priceDisclaimer(locale)}`,
    };
  }
  const total = rate * duration;
  return {
    label: locale === "zh-CN" ? `≈${amount(total, locale)} 积分/次` : `≈${amount(total, locale)} credits/run`,
    detail: locale === "zh-CN"
      ? `${modeLabel ? `${modeLabel} · ` : ""}${amount(rate, locale)} 积分/秒 × ${duration} 秒 = ${amount(total, locale)} 积分${referenceBillingNote}。${priceDisclaimer(locale)}`
      : `${modeLabel ? `${modeLabel} · ` : ""}${amount(rate, locale)} credits/s × ${duration}s = ${amount(total, locale)} credits${referenceBillingNote}. ${priceDisclaimer(locale)}`,
  };
}
