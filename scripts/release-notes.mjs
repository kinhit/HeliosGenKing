// Build a release body from the curated CHANGELOG entry plus the exact git
// range being released. GitHub Actions writes the result to the Release page
// so every release has a readable Full Changelog without manual copy/paste.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME ?? "";
const normalizedTag = tag.startsWith("v") ? tag : `v${tag}`;

if (!/^v\d+\.\d+\.\d+$/.test(normalizedTag)) {
  throw new Error(`Expected a release tag such as v1.5.1, received "${tag}"`);
}

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const tags = git(["tag", "--sort=-version:refname"])
  .split("\n")
  .filter((value) => /^v\d+\.\d+\.\d+$/.test(value));
const previousTag = tags[tags.indexOf(normalizedTag) + 1] ?? "";
const tagExists = Boolean(git(["rev-parse", "--verify", `${normalizedTag}^{commit}`]));
const range = previousTag
  ? `${previousTag}..${tagExists ? normalizedTag : "HEAD"}`
  : tagExists
    ? normalizedTag
    : "HEAD";
const commits = git(["log", "--no-merges", "--format=%h%x09%s", range])
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [hash, ...subject] = line.split("\t");
    return `- \`${hash}\` ${subject.join("\t")}`;
  });
const changedFiles = git(["diff", "--stat", "--oneline", range])
  .split("\n")
  .filter(Boolean);

let curated = "";
const changelogPath = join(ROOT, "CHANGELOG.md");
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, "utf8");
  const version = normalizedTag.slice(1).replaceAll(".", "\\.");
  const header = new RegExp(`^## \\s*(?:\\*\\*)?${version}(?:\\*\\*)?[^\\n]*\\n`, "m").exec(changelog);
  if (header) {
    const afterHeader = changelog.slice(header.index + header[0].length);
    const nextHeading = /^## /m.exec(afterHeader);
    curated = (nextHeading ? afterHeader.slice(0, nextHeading.index) : afterHeader).trim();
  }
}

const compare = previousTag
  ? `https://github.com/kinhit/HeliosGenKing/compare/${previousTag}...${normalizedTag}`
  : `https://github.com/kinhit/HeliosGenKing/releases/tag/${normalizedTag}`;

const sections = [
  `# HeliosGenKing ${normalizedTag}`,
  "",
  "## 本次更新",
  "",
  curated || "本版本的详细变更见下方提交记录。",
  "",
  "## 完整提交记录",
  "",
  ...(commits.length ? commits : ["- 未读取到提交记录，请查看下方对比链接。"]),
  "",
  "## 文件变更摘要",
  "",
  "```text",
  ...(changedFiles.length ? changedFiles : ["No file statistics available."]),
  "```",
  "",
  `## Full Changelog\n\n[查看 ${previousTag || "本次版本"} 到 ${normalizedTag} 的完整差异](${compare})`,
  "",
];

process.stdout.write(sections.join("\n"));
