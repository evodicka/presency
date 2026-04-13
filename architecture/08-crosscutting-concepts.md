# 8. Crosscutting Concepts

## State Management

Application state is held in the root `App` component using React's built-in `useState` hook. There is no external state management library (Redux, Zustand, etc.); the data volume is trivial (≤ a few hundred date keys over a year) and a single shared root state is sufficient.

State flows top-down via props. Events flow bottom-up via callback props. No context provider or shared mutable store is used in v1.

## Persistence Strategy

Every status change triggers an immediate, unconditional asynchronous write of the full `dayStatuses` object to disk. There is no debouncing or batching. Given the trivial data size (a few dozen bytes to a few kilobytes), the asynchronous overhead of a file write is negligible and simplifies error handling. `fs.writeFile` (async, non-blocking) is used to avoid blocking the main process.

The **sparse model** is the single source of truth for defaults: any date absent from the JSON object is treated as `home-office`. This means the JSON file grows only when the user marks days as `on-site` or `absent`, and shrinks when they are reverted. When a day's new status is `home-office`, its key is removed from the `dayStatuses` map before the save call — this ensures `home-office` entries are never written to disk (ADR-003).

## Error Handling

| Scenario | Handling |
|---------|---------|
| `presence-data.json` does not exist on first launch | `PersistenceHandler` returns an empty object `{}`; application starts with all days defaulting to home-office |
| File read error (permissions, corruption) | Log the error to the Electron main process console; renderer receives `{}` and starts fresh. A user-visible warning may be shown in a future version. |
| Corrupted or unparseable JSON file | `JSON.parse` throws in the main process; `PersistenceHandler` catches the error, logs it, and returns `{}` to the renderer; application starts with all days defaulting to home-office (see Scenario 4 in Section 06). |
| File write error | The `saveData` IPC contract returns a rejectable Promise to enable future error handling. In v1 the error is logged only. The in-memory state remains valid; data may be lost only if the application crashes before a successful write. No user-visible feedback in v1 (write failures are rare in normal desktop use). |
| Division by zero in percentage calculation | `WorkingTimeCalculator` explicitly guards the case where all working days are absent: returns 0% without throwing |

## Security

The renderer runs with `nodeIntegration: false` (default Electron secure configuration). All file-system access is mediated through the main process via `contextBridge`. The preload script exposes only two narrow IPC calls (`loadData`, `saveData`) — no arbitrary Node.js APIs are exposed to the renderer.

No user-generated content is executed as code. No network requests are made. The attack surface is minimal.

## Date and Time Handling

All dates are represented as ISO 8601 strings (`YYYY-MM-DD`). The application operates in the user's local time zone (dates are derived from `new Date()` and local calendar arithmetic). No UTC normalisation is required because the application deals only with calendar dates, not timestamps.

Month navigation uses simple arithmetic (increment/decrement month, wrap year), not `Date` object mutation, to avoid daylight-saving-time edge cases.

## Holiday Computation

The `HolidayService` module computes Bavarian public holidays algorithmically for any year, with no hardcoded year-specific lookup tables. The Computus algorithm derives Easter Sunday; all other moveable feasts are fixed offsets from Easter Sunday:

| Holiday | Offset from Easter Sunday |
|---------|--------------------------|
| Good Friday (Karfreitag) | −2 days |
| Easter Monday (Ostermontag) | +1 day |
| Ascension Day (Christi Himmelfahrt) | +39 days |
| Whit Monday (Pfingstmontag) | +50 days |
| Corpus Christi (Fronleichnam) | +60 days |

> **Note:** All offsets are calendar days added to Easter Sunday's date. Easter Sunday = Day 0 (e.g., Easter Sunday + 1 day = Easter Monday).

Fixed-date holidays are hardcoded as month/day pairs:

| Holiday | Date |
|---------|------|
| Neujahrstag (New Year's Day) | January 1 |
| Heilige Drei Könige (Epiphany) | January 6 |
| Tag der Arbeit (Labour Day) | May 1 |
| Maria Himmelfahrt (Assumption of Mary) | August 15 |
| Tag der Deutschen Einheit (German Unity Day) | October 3 |
| Allerheiligen (All Saints' Day) | November 1 |
| 1. Weihnachtstag (Christmas Day) | December 25 |
| 2. Weihnachtstag (Boxing Day) | December 26 |

## UI Conventions

- **Color coding**: Three distinct, accessible colors for home-office (neutral/light), on-site (blue), and absent (distinct third color, e.g., amber or grey). Weekend and adjacent-month days use a muted palette. Holidays use a visually distinct marker (color or icon).
- **Interactivity**: Only valid working days (Monday–Friday, not a public holiday, in the current displayed month) respond to click events.
- **Real-time feedback**: All recalculations and re-renders happen synchronously on the React state update; there are no loading states or spinners for local operations.

## Testing Strategy

Domain services (`HolidayService`, `WorkingTimeCalculator`, `StatusCycler`) are pure functions and should be unit-tested in isolation. UI components are tested with a React testing library for interaction flows (click cycling, navigation). The main-process `PersistenceHandler` is tested with a mock `fs` module or by pointing to a temp directory.

Integration tests covering the full Electron IPC round-trip (load → display → change → persist) are deferred to a future version.
