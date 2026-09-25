# Changelog

## 1.6.0 - 2026-09-25

- Added Magnific Qwen Image 3.0 and Qwen Image 3.0 Pro, including reference-image and resolution controls.
- Added Magnific Wan 3.0 and Wan 3.0 Prime with 2–30 second durations, up to 10 image references, 5 video references, and 5 audio references.
- Added Magnific MiniMax H3, H3 Max, and H3 Max Turbo with model-specific resolution tiers, reference media controls, and 5–15 second durations.
- Added Seedance 2.5 Draft (480p), routed through Magnific's documented 480p endpoint and constrained to 480p while Draft is selected.
- Added Magnific credit estimates to image and video model menus and generation controls; video estimates recalculate from resolution and duration, and unpublished prices are identified instead of guessed.
- Documented new model availability caveats and public reference pricing in both READMEs.

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
