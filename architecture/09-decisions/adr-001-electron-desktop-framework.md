# ADR-001: Electron as Desktop Framework

**Status:** Accepted
**Date:** 2026-04-10

## Context

The application must run as a native desktop application on macOS, Windows, and Linux without requiring an external server or internet connectivity. It needs access to the local file system to persist user data. Several cross-platform desktop frameworks were available: Electron, Tauri, NW.js, or a plain HTML file opened locally.

## Decision

Use **Electron** as the desktop application framework.

## Consequences

**Positive:**
- Full Node.js API access in the main process enables straightforward file-system persistence via the `fs` module (required by REQ-007).
- Bundled Chromium eliminates all cross-browser rendering concerns; the UI behaves identically on all platforms.
- Mature ecosystem with `electron-builder` providing well-tested packaging for macOS (`.app`), Windows (`.exe`), and Linux (AppImage).
- Large community and extensive documentation.

**Negative:**
- Binary size is significantly larger than alternatives (typically 100–200 MB) due to the bundled Chromium. This is an accepted trade-off per REQ-008 notes.
- Electron must be kept reasonably current to receive Chromium security patches.
- Higher memory footprint than lighter alternatives (Tauri).

This decision was explicitly specified in REQ-008 and is not open for reconsideration.
