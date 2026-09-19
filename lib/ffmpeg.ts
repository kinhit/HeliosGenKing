import { existsSync } from "node:fs";
import { delimiter } from "node:path";
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
  const candidates = [
    process.env.HELIOS_FFMPEG_PATH,
    process.env.FFMPEG_PATH,
    ffmpegStatic,
    ...pathEntries.map((entry) => `${entry}/ffmpeg`),
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ];
  const resolved = candidates
    .filter((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0)
    .find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error("Video processing requires ffmpeg. The bundled ffmpeg binary was not found.");
  }
  return resolved;
}
