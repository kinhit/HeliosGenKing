import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { GENERATION_INSERT_SQL } from "../lib/guest/generationSql.ts";

test("generation INSERT has one placeholder for every listed column", () => {
  const columns = GENERATION_INSERT_SQL.match(/\(([^)]+)\)\s*VALUES/s)?.[1]
    .split(",")
    .map((column) => column.trim());
  const placeholders = GENERATION_INSERT_SQL.match(/VALUES\s*\(([^)]+)\)/s)?.[1]
    .split(",")
    .map((value) => value.trim());

  assert.equal(columns?.length, 23);
  assert.equal(placeholders?.length, columns?.length);
  assert.ok(placeholders?.every((value) => value === "?"));
});

test("generation INSERT executes against the current SQLite schema", () => {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE generations (
      id TEXT PRIMARY KEY, user_id TEXT, task_id TEXT UNIQUE,
      provider_task_id TEXT, provider_status_endpoint TEXT, provider TEXT,
      generation_type TEXT, status TEXT, prompt TEXT, model TEXT,
      aspect_ratio TEXT, quality TEXT, azure_resolution TEXT, duration INTEGER,
      kling_mode TEXT, sound INTEGER, reference_image_urls TEXT,
      image_url TEXT, image_urls TEXT, video_url TEXT, error_msg TEXT,
      created_at TEXT, updated_at TEXT
    )
  `);

  assert.doesNotThrow(() => database.prepare(GENERATION_INSERT_SQL).run(
    "id", "guest", "task", null, null, "magnific", "image", "pending",
    "prompt", "model", "1:1", "1k", null, null, null, 0, null,
    null, null, null, null, "created", "updated",
  ));
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM generations").get().count,
    1,
  );
  database.close();
});
