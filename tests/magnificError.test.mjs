import assert from "node:assert/strict";
import test from "node:test";
import { magnificErrorMessage } from "../lib/magnificError.ts";

test("preserves Magnific validation field details without echoing request input", () => {
  const message = magnificErrorMessage({
    message: "Validation error",
    errors: [{
      loc: ["body", "reference_images", 0, "mime_type"],
      msg: "Field required",
      input: { image: "https://signed.example.com/private?token=secret" },
    }],
  });

  assert.equal(message, "Validation error: body.reference_images.0.mime_type: Field required");
  assert.doesNotMatch(message, /token=secret/);
});
