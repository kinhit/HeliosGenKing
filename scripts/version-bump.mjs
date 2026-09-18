// Keep every release-bearing version file synchronized.
//
// Usage:
//   pnpm version:patch
//   pnpm version:minor
//   pnpm version:major
//   pnpm version:bump 1.4.0
//
// The Tauri manifest is the canonical source. This script updates the package
// manifest and Rust package metadata, then runs the existing consistency check.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`version bump failed: ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

function parseVersion(raw) {
  const match = String(raw).trim().replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) fail(`invalid version "${raw}"; expected X.Y.Z`);
  return match.slice(1).map(Number);
}

function nextVersion(current, requested) {
  if (/^v?\d+\.\d+\.\d+$/.test(requested)) return parseVersion(requested).join(".");
  const [major, minor, patch] = parseVersion(current);
  if (requested === "major") return `${major + 1}.0.0`;
  if (requested === "minor") return `${major}.${minor + 1}.0`;
  if (requested === "patch") return `${major}.${minor}.${patch + 1}`;
  fail(`expected patch, minor, major, or an explicit X.Y.Z; received "${requested}"`);
}

function updateJsonVersion(relativePath, version) {
  const absolutePath = join(ROOT, relativePath);
  const value = readJson(relativePath);
  value.version = version;
  writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function updateTextVersion(relativePath, pattern, replacement, description) {
  const absolutePath = join(ROOT, relativePath);
  const source = readFileSync(absolutePath, "utf8");
  const updated = source.replace(pattern, replacement);
  if (updated === source) fail(`could not update ${description} in ${relativePath}`);
  writeFileSync(absolutePath, updated);
}

const requested = process.argv[2] ?? "patch";
const current = readJson("src-tauri/tauri.conf.json").version;
const version = nextVersion(current, requested);

updateJsonVersion("src-tauri/tauri.conf.json", version);
updateJsonVersion("package.json", version);
updateTextVersion(
  "src-tauri/Cargo.toml",
  /(^\s*version\s*=\s*")[^"]+(")/m,
  `$1${version}$2`,
  "Cargo.toml package version",
);
updateTextVersion(
  "src-tauri/Cargo.lock",
  /(name = "heliosgen-desktop"\nversion = ")[^\"]+(")/,
  `$1${version}$2`,
  "Cargo.lock package version",
);

const check = spawnSync(process.execPath, [join(ROOT, "scripts/desktop/check-version.mjs"), version], {
  cwd: ROOT,
  stdio: "inherit",
});
if (check.status !== 0) process.exit(check.status ?? 1);

console.log(`\nVersion bumped: ${current} → ${version}`);
