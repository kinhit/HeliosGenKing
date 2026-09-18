import { extname } from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};

/** MIME types accepted by Magnific's Upload Files API. */
export const MAGNIFIC_SUPPORTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
]);

export function normaliseMimeType(value: string | null | undefined): string | undefined {
  const mime = value?.split(";", 1)[0]?.trim().toLowerCase();
  return mime || undefined;
}

/**
 * Infer a media MIME type from a path or URL without confusing its extension
 * with a query string. The old splitter cut at the first dot, turning every
 * local .png/.jpg reference into application/octet-stream.
 */
export function mimeFromPath(path: string): string | undefined {
  const cleanPath = path.split(/[?#]/, 1)[0];
  const extension = extname(cleanPath).slice(1).toLowerCase();
  return MIME_BY_EXT[extension];
}

/** Prefer a valid HTTP header, then use the file extension as a safe fallback. */
export function resolveMagnificMimeType(header: string | null | undefined, path: string): string {
  const headerType = normaliseMimeType(header);
  if (headerType && MAGNIFIC_SUPPORTED_MIME_TYPES.has(headerType)) return headerType;
  // A concrete server-provided MIME type is more reliable than a filename.
  // Only replace generic binary headers, which are common for CDN downloads.
  if (headerType && headerType !== "application/octet-stream" && headerType !== "binary/octet-stream") {
    return headerType;
  }
  return mimeFromPath(path) ?? headerType ?? "application/octet-stream";
}

export function assertMagnificSupportedMimeType(contentType: string | undefined): asserts contentType is string {
  if (contentType && MAGNIFIC_SUPPORTED_MIME_TYPES.has(contentType)) return;
  const received = contentType || "unknown";
  throw new Error(
    `Unsupported Magnific media type: ${received}. Supported types are PNG, JPEG, WebP, MP4, WebM, MOV, MP3, WAV, M4A, and OGG.`,
  );
}
