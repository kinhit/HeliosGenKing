import { accessSync, constants, existsSync } from "node:fs";
import { delimiter, join } from "node:path";
import ffmpegStatic from "ffmpeg-static";

/**
 * Resolve the media processor used by server routes.
 *
 * Desktop builds ship ffmpeg-static, while local/server deployments may opt
 * into an explicit binary or use a system installation. Resolving this in one
 * place prevents packaged apps from depending on the user's PATH.
 */
export function getFfmpegPath(): string {
  const pathEntries = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  const cwd = process.cwd();
  const candidates = [
    process.env.HELIOS_FFMPEG_PATH,
    process.env.FFMPEG_PATH,
    ffmpegStatic,
    // The desktop sidecar runs with the staged server as its cwd. Keep these
    // explicit fallbacks for npm-installed and bundled desktop layouts even
    // when the package resolver returns null on an unsupported host arch.
    join(cwd, "node_modules", "ffmpeg-static", "ffmpeg"),
    join(cwd, "..", "node_modules", "ffmpeg-static", "ffmpeg"),
    ...pathEntries.map((entry) => `${entry}/ffmpeg`),
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ];
  const resolved = candidates
    .filter((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0)
    .find((candidate) => {
      if (!existsSync(candidate)) return false;
      try {
        accessSync(candidate, constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
  if (!resolved) {
    throw new Error("Video processing requires ffmpeg. The bundled ffmpeg binary was not found.");
  }
  return resolved;
}
