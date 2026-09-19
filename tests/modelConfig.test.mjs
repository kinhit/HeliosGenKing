import assert from "node:assert/strict";
import test from "node:test";
import { IMAGE_MODELS, VIDEO_MODELS } from "../lib/modelConfig.ts";

const image = (id) => IMAGE_MODELS.find((model) => model.id === id);
const video = (id) => VIDEO_MODELS.find((model) => model.id === id);

test("removes deprecated Magnific Mystic, LTX, and Kling models", () => {
  const removed = [
    "magnific-mystic-realism",
    "magnific-mystic-fluid",
    "magnific-mystic-flexible",
    "magnific-mystic-zen",
    "magnific-ltx-2-pro-t2v",
    "magnific-ltx-2-pro-i2v",
    "magnific-kling-2-6-pro",
  ];
  const ids = new Set([...IMAGE_MODELS, ...VIDEO_MODELS].map((model) => model.id));
  for (const id of removed) assert.equal(ids.has(id), false, `${id} should be removed`);
});

test("exposes both GPT Image 2.5 variants with edit endpoints", () => {
  const flare = image("magnific-gpt-image-2-5");
  const sunburst = image("magnific-gpt-image-2-5-sunburst");
  assert.equal(flare?.magnific?.extra?.variant, "flare");
  assert.equal(sunburst?.magnific?.extra?.variant, "sunburst");
  for (const model of [flare, sunburst]) {
    assert.equal(model?.supportsImages, true);
    assert.equal(model?.maxImages, 16);
    assert.equal(model?.magnific?.endpoint, "/v1/ai/text-to-image/gpt-image-2-5");
    assert.equal(model?.magnific?.referenceEndpoint, "/v1/ai/text-to-image/gpt-image-2-5-edit");
  }
});

test("keeps Magnific Google reference-image limits aligned with the API", () => {
  const nano2 = image("magnific-google-nano-banana-2");
  const pro = image("magnific-google-nano-banana-pro");
  assert.equal(nano2?.maxImages, 3);
  assert.equal(nano2?.magnific?.imageInputObjects, true);
  assert.equal(pro?.maxImages, 14);
  assert.equal(pro?.magnific?.imageInputObjects, true);
});

test("configures complete Magnific Seedance multimodal reference support", () => {
  const cases = [
    ["magnific-seedance-2-5", 30, 10, 10, false],
    ["magnific-seedance-2-0", 9, 3, 3, true],
    ["magnific-seedance-2-0-fast", 9, 3, 3, true],
    ["magnific-seedance-2-mini", 9, 3, 3, true],
  ];
  for (const [id, images, videos, audios, audioExclusive] of cases) {
    const model = video(id);
    assert.ok(model, `${id} should exist`);
    assert.equal(model.maxResources, images);
    assert.equal(model.maxReferenceVideos, videos);
    assert.equal(model.maxReferenceAudios, audios);
    assert.equal(model.apiInput.referenceImagesKey, "reference_images");
    assert.equal(model.apiInput.referenceVideosKey, "reference_videos");
    assert.equal(model.apiInput.referenceAudiosKey, "reference_audios");
    assert.equal(model.referencePolicy?.audioExclusiveWithFrames, audioExclusive);
    assert.equal(model.resourceTagFormat, "magnific");
  }
});
