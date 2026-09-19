import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMagnificSupportedMimeType,
  mimeFromPath,
  resolveMagnificMimeType,
  toMagnificReferenceImage,
} from "../lib/magnificMime.ts";

test("infers supported MIME types from local paths and URL query strings", () => {
  assert.equal(mimeFromPath("/generated/references/portrait.png"), "image/png");
  assert.equal(mimeFromPath("https://cdn.example.com/a.photo.JPEG?download=1"), "image/jpeg");
  assert.equal(mimeFromPath("/generated/videos/clip.mov#preview"), "video/quicktime");
});

test("includes the required MIME type in Magnific reference image objects", () => {
  assert.deepEqual(
    toMagnificReferenceImage("https://assets.example.com/reference", "image/jpeg"),
    { image: "https://assets.example.com/reference", mime_type: "image/jpeg" },
  );
  assert.throws(
    () => toMagnificReferenceImage("https://assets.example.com/reference", "image/gif"),
    /Unsupported Magnific reference image type/,
  );
});

test("uses a valid extension when a CDN reports generic binary content", () => {
  assert.equal(
    resolveMagnificMimeType("application/octet-stream", "https://cdn.example.com/reference.webp?token=abc"),
    "image/webp",
  );
  assert.equal(resolveMagnificMimeType("image/jpeg; charset=binary", "https://cdn.example.com/file"), "image/jpeg");
});

test("rejects media types that Magnific's upload endpoint cannot accept", () => {
  assert.equal(
    resolveMagnificMimeType("image/gif", "https://cdn.example.com/reference.png"),
    "image/gif",
  );
  assert.throws(
    () => assertMagnificSupportedMimeType("image/gif"),
    /Unsupported Magnific media type: image\/gif/,
  );
});
