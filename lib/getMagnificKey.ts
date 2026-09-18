import { getMagnificApiKey } from "./guest/db";

/** The user's Magnific API key, saved locally via Settings → API Keys. */
export async function getMagnificKeyForUser(..._args: unknown[]): Promise<string | null> {
  return getMagnificApiKey();
}

