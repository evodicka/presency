# 2. Constraints

## Technical Constraints

| Constraint | Source | Impact |
|-----------|--------|--------|
| **Electron framework** | REQ-008 (explicit requirement) | Mandates Node.js + Chromium runtime; no alternative desktop framework (Tauri, NW.js) is permitted |
| **Local JSON persistence via Node.js `fs`** | REQ-007 (explicit requirement) | All persistence must use Electron's `fs` module; no browser-side storage (localStorage, IndexedDB) |
| **Storage path via `app.getPath('userData')`** | REQ-007 (explicit requirement) | The JSON file must be placed at the OS user-data directory provided by Electron |
| **Sparse persistence model** | REQ-007 (explicit requirement) | Only non-home-office day statuses are stored; home-office is the implicit default |
| **Bavarian public holidays only** | REQ-006 (explicit requirement) | Holiday logic covers only the German state of Bavaria; other regions are out of scope |
| **Fixed 8-hour working day** | REQ-003 (explicit requirement) | No support for part-time or variable schedules |
| **Fixed 40% goal threshold** | REQ-005 (explicit requirement) | The threshold is not user-configurable |
| **Three statuses only** | REQ-002 (explicit requirement) | home-office, on-site, absent — no additional statuses (travel, half-day, etc.) |
| **Bundled Chromium** | REQ-008 | No cross-browser compatibility concerns; the rendering engine is fixed |

## Organisational Constraints

| Constraint | Source | Impact |
|-----------|--------|--------|
| **No cloud sync** | REQ-007 assumption | No multi-device or collaborative use cases; single-machine, single-user only |
| **No import/export** | REQ-007 assumption | No data migration tooling required for v1 |
| **No explicit save action** | REQ-007 AC4 | Every status change must trigger an automatic write to disk |
| **No backend server** | REQ-008 AC5 | All application logic runs inside the Electron process; no HTTP server or daemon required |

## Scope Constraints

| Constraint | Source |
|-----------|--------|
| Desktop only — no mobile or web app | REQ-008 |
| No accessibility requirements stated for v1 | Requirements assumption |
| English UI language | Requirements assumption (no language requirement stated; defaulting to English) |
| Month navigation is unrestricted (no min/max year) | REQ-001 assumption |
