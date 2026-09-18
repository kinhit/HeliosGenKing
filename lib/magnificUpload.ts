/**
 * Make local HeliosGen media reachable by Magnific's URL-based endpoints.
 *
 * Magnific's upload API gives us a short-lived public asset URL.  We keep that
 * URL request-scoped instead of persisting it because the URL expires after
 * roughly one day.
 */
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { MEDIA_DIR } from "@/lib/guest/paths";
import { MAGNIFIC_BASE } from "@/lib/magnific";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};

type MediaBytes = { bytes: Buffer; contentType: string };

function mimeFromPath(path: string): string {
  const extension = path.split(/[.?]/)[0].split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[extension] ?? "application/octet-stream";
}

async function readMedia(url: string): Promise<MediaBytes> {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/i);
    if (!match) throw new Error("Invalid data URL");
    const bytes = match[2]
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]), "utf8");
    return { bytes, contentType: match[1] || "application/octet-stream" };
  }

  if (url.startsWith("/generated/")) {
    const relative = normalize(decodeURIComponent(url.slice("/generated/".length).split(/[?#]/)[0]));
    if (relative.startsWith("..") || relative.includes("\0")) {
      throw new Error("Invalid local media path");
    }
    const mediaPath = join(MEDIA_DIR, relative);
    if (!mediaPath.startsWith(normalize(MEDIA_DIR))) {
      throw new Error("Invalid local media path");
    }
    return { bytes: await readFile(mediaPath), contentType: mimeFromPath(mediaPath) };
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to read media (${response.status})`);
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type")?.split(";")[0].trim() || mimeFromPath(url),
  };
}

type UploadTicket = {
  upload_url?: unknown;
  headers?: unknown;
  asset_url?: unknown;
};

/** Upload one local or remote media URL and return Magnific's temporary asset URL. */
export async function uploadMagnificAsset(inputUrl: string, apiKey: string): Promise<string> {
  const { bytes, contentType } = await readMedia(inputUrl);
  const ticketResponse = await fetch(`${MAGNIFIC_BASE}/v1/ai/uploads/request-url`, {
    method: "POST",
    headers: { "x-magnific-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ files: [{ content_type: contentType }] }),
  });
  const ticketText = await ticketResponse.text();
  let ticketPayload: unknown = null;
  try { ticketPayload = ticketText ? JSON.parse(ticketText) : null; } catch { /* handled below */ }

  const ticket = (ticketPayload as { files?: UploadTicket[] })?.files?.[0];
  if (!ticketResponse.ok || !ticket || typeof ticket.upload_url !== "string" || typeof ticket.asset_url !== "string") {
    const message = (ticketPayload as { message?: string; error?: string })?.message
      ?? (ticketPayload as { message?: string; error?: string })?.error
      ?? ticketText.slice(0, 500);
    throw new Error(`Magnific upload ticket failed (${ticketResponse.status}): ${message || "request failed"}`);
  }

  const uploadHeaders: Record<string, string> = { "Content-Type": contentType };
  if (ticket.headers && typeof ticket.headers === "object") {
    for (const [key, value] of Object.entries(ticket.headers as Record<string, unknown>)) {
      if (typeof value === "string") uploadHeaders[key] = value;
    }
  }
  const uploadResponse = await fetch(ticket.upload_url, {
    method: "PUT",
    headers: uploadHeaders,
    body: bytes as unknown as BodyInit,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Magnific media upload failed (${uploadResponse.status})`);
  }

  return ticket.asset_url;
}
