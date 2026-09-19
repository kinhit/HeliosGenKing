# Changelog

## 1.5.1 - 2026-09-19

- Fixed completed video generations being marked as failed when optional local ffmpeg metadata cleanup was unavailable.
- Explicitly passed the bundled ffmpeg binary path from the macOS Tauri shell and verified it during desktop staging.
- Kept video generation results usable when a specific container cannot be processed with stream-copy metadata cleanup.
- Reworked the chat model picker into a viewport-aware, scrollable portal so all models remain selectable inside the app window.
- Completed the Simplified Chinese README with download, setup, build, Codex CLI, contribution, and upstream-sync documentation.
- Replaced generic GitHub-generated release notes with automatic Full Changelog notes containing curated changes, commits, file statistics, and a comparison link.

## 1.5.0 - 2026-09-19

- Bundled arm64 ffmpeg for desktop video frame extraction, trimming, and metadata processing.
- Hardened Kie.ai and Magnific asynchronous video polling and result parsing.
- Removed Seed controls from Magnific Seedance 2.5, 2.0, 2.0 Fast, and 2.0 Mini.
- Added visible application version labels in the sidebar and Settings.
- Made the chat model picker scrollable and prevented stale job-status responses.

## 1.3.0 - 2026-09-18

- Added Magnific Google Nano Banana 2 and Google Nano Banana Pro image entries.
- Added Magnific GPT Image 2 and GPT Image 2.5 image entries using their official API endpoints.
- Added Magnific Seedance 2.5, 2.0, 2.0 Fast, and 2.0 Mini video entries.
- Added Magnific reference-image upload handling for image models.
- Added synchronized semantic-version bump commands for desktop release files.
