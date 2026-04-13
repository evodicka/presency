# ADR-002: Local JSON File Persistence

**Status:** Accepted
**Date:** 2026-04-10

## Context

User planning data (day statuses) must survive application restarts. The application runs as an Electron desktop app with no backend server and no cloud connectivity. Options considered: browser `localStorage`, `IndexedDB`, a local SQLite database, or a local JSON file via Node.js `fs`.

`localStorage` and `IndexedDB` are renderer-side browser APIs and are not suitable for an Electron app that uses `nodeIntegration: false`; they also complicate access from the main process. SQLite provides querying capabilities unnecessary for this data structure. A plain JSON file is the simplest option that meets all requirements.

## Decision

Persist all user data as a single **local JSON file** using Node.js `fs` in the Electron main process. The file is stored at `app.getPath('userData')/presence-data.json`.

## Consequences

**Positive:**
- Simple implementation; no ORM, migration scripts, or schema management.
- Human-readable format aids debugging and potential future manual editing.
- Trivial data volume (at most a few kilobytes even over many years of use).
- The `app.getPath('userData')` location is OS-appropriate and survives application updates.

**Negative:**
- Not suitable if data volume grew to thousands of entries (not a concern for this application).
- Concurrent access from multiple application instances could corrupt the file (not a concern; single-user desktop app).
- No query capability; the entire file is read and written on every operation (acceptable given data size).

This decision was explicitly specified in REQ-007 and is not open for reconsideration.
