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
  return error;
}
