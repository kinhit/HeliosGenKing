import { writeFile, readFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import sharp from "sharp";
import { getFfmpegPath } from "@/lib/ffmpeg";

const execFileAsync = promisify(execFile);

/** Strip EXIF/IPTC/XMP (images) or metadata tags (video) from a buffer before storage. */
export async function stripMetadata(buffer: Buffer, contentType: string): Promise<Buffer> {
  if (contentType.startsWith("image/")) {
    return sharp(buffer).toBuffer();
  }
  if (contentType.startsWith("video/")) {
    const extension = contentType.includes("webm") ? "webm" : "mp4";
    const tmpDir = await mkdtemp(join(tmpdir(), "strip-meta-"));
    const inputPath  = join(tmpDir, `input.${extension}`);
    const outputPath = join(tmpDir, `output.${extension}`);
    try {
      await writeFile(inputPath, buffer);
      try {
        await execFileAsync(getFfmpegPath(), [
          "-i", inputPath,
          "-map_metadata", "-1",
          "-c", "copy",
          "-y", outputPath,
        ]);
        return await readFile(outputPath);
      } catch (error) {
        // Metadata stripping is best-effort. A generated video is still valid
        // without this cleanup step, so never turn a completed provider task
        // into a failed generation just because ffmpeg is unavailable or a
        // particular container rejects stream-copying.
        console.warn("[media] video metadata cleanup skipped:", error instanceof Error ? error.message : error);
        return buffer;
      }
    } finally {
      await Promise.all([
        unlink(inputPath).catch(() => {}),
        unlink(outputPath).catch(() => {}),
      ]);
    }
  }
  return buffer;
}
