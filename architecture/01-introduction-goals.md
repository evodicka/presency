# 1. Introduction & Goals

## Purpose

The Office Presence Tracker is a personal desktop planning tool. Its sole purpose is to help a single user plan which working days of each month they intend to spend on-site, so they can verify that their plan meets the company's 40% on-site presence requirement. All statuses represent *planned intent*, not confirmed actuals.

## Key Requirements

| ID | Summary |
|----|---------|
| REQ-001 | Calendar grid view with month navigation (Monday-to-Sunday, ISO 8601) |
| REQ-002 | Click-to-cycle day status: home-office → on-site → absent → home-office |
| REQ-003 | Working time calculation: 8 h/day, exclude weekends, Bavarian holidays, and absent days |
| REQ-004 | Monthly overview panel with on-site %, home-office %, and day counts |
| REQ-005 | Visual 40% on-site goal indicator (green ≥ 40%, warning colour < 40%) |
| REQ-006 | Automatic Bavarian public holiday recognition including moveable feasts |
| REQ-007 | Automatic local JSON persistence (sparse model, no explicit save action) |
| REQ-008 | Electron desktop application for macOS, Windows, and Linux |
| REQ-009 | Fresh, intuitive UI: calendar on the left, overview panel on the right |

## Top Quality Goals

Listed in priority order:

1. **Simplicity** — The application must be straightforward to use with no setup, no login, and no server. A user should be productive within seconds of launching it.
2. **Correctness** — Working-time and on-site percentage calculations must be accurate. Public holiday recognition must be correct for all navigable years.
3. **Data safety** — User planning data must survive application restarts without any explicit save action. The sparse JSON model must not corrupt or lose entries on status changes.
4. **Cross-platform reliability** — The application must run identically on macOS, Windows, and Linux through the bundled Chromium runtime.
5. **Responsiveness** — All UI updates (status changes, month navigation, recalculations) must be immediate and perceptibly instant.

## Stakeholders

| Role | Concern |
|------|---------|
| User (single individual) | Accurate planning of on-site days; clear visual feedback on goal compliance |
| Developer / maintainer | Straightforward codebase that is easy to extend (e.g., additional holiday regions) |
