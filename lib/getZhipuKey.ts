import { getZhipuApiKey } from "./guest/db";

/** The user's Zhipu AI API key, saved locally via Settings → API Keys. */
export async function getZhipuKeyForUser(): Promise<string | null> {
  return getZhipuApiKey();
}
