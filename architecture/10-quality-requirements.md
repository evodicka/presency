# 10. Quality Requirements

## Quality Tree

```
Quality
├── Simplicity
│   ├── Zero-configuration startup
│   └── No network dependency
├── Correctness
│   ├── Accurate working-time calculation
│   └── Correct Bavarian holiday recognition
├── Data Safety
│   ├── Automatic persistence on every change
│   └── No data loss on crash
├── Cross-platform Reliability
│   └── Identical behaviour on macOS, Windows, Linux
└── Responsiveness
    ├── Immediate UI feedback on day click
    └── Immediate stats update on status change
```

## Quality Scenarios

### Simplicity

| # | Stimulus | Response |
|---|---------|---------|
| S-01 | User launches the application for the first time on a new machine | Application opens immediately displaying the current month with all days defaulting to home-office. No setup wizard, login, or configuration required. |
| S-02 | User is offline or on a network with no internet access | Application starts and operates fully; no error dialogs or degraded functionality. |

**Architectural support:** Electron bundles all dependencies; no network calls are made; `presence-data.json` defaults to `{}` on first run.

---

### Correctness

| # | Stimulus | Response |
|---|---------|---------|
| C-01 | User navigates to April 2026, which contains Easter Monday (6 Apr) and no other holidays | The calendar marks 6 April as a holiday; working-day count is 21 (22 weekdays − 1 holiday); on-site percentage denominator excludes the holiday. |
| C-02 | User sets all working days of a month as absent | Total working time = 0; on-site percentage = 0%; no division-by-zero error. |
| C-03 | User navigates to a year 50 years in the future | Bavarian public holidays are correctly computed; no hardcoded year limit is hit. |
| C-04 | User marks 5 of 19 non-holiday non-absent weekdays as on-site (10 home-office, 4 absent) | On-site % = 5/15 × 100 = 33.3%; denominator is 15, not 19. |
| C-05 | User marks days so that on-site % = exactly 40% — GoalIndicator is green. User removes one on-site day, dropping percentage below 40% | GoalIndicator immediately switches to warning color. |
| C-06 | With 3 on-site days, 7 home-office days, and 2 absent days | On-site % = 3/10 × 100 = 30%; home-office % = 7/10 × 100 = 70%; sum = 100%. Absent days do not appear in either percentage. |

**Architectural support:** `HolidayService` uses Computus (no year limit); `WorkingTimeCalculator` explicitly excludes absent days from denominator with a zero-guard.

---

### Data Safety

| # | Stimulus | Response |
|---|---------|---------|
| D-01 | User clicks a day cell to change its status | The change is written asynchronously to `presence-data.json`; under normal desktop I/O conditions the write completes within milliseconds. Multiple rapid status changes may result in overlapping writes; the last write wins (see R-03). |
| D-02 | Application crashes immediately after a status change | On next launch, the status that was changed is displayed correctly (data was written to disk). |
| D-03 | `presence-data.json` does not exist on launch | Application starts with an empty data set; all days default to home-office; file is created on the first status change. |
| D-04 | User sets a day back to home-office | The key for that date is removed from the JSON file (sparse model enforced); the file does not grow with default-value entries. |

**Architectural support:** Save is fire-and-forget triggered synchronously on every status change; sparse model removes keys on revert to home-office.

---

### Cross-platform Reliability

| # | Stimulus | Response |
|---|---------|---------|
| P-01 | User launches the `.app` bundle on macOS | Application runs without external server or internet; all features function identically to Windows and Linux builds. |
| P-02 | User launches the `.exe` on Windows | Same as P-01. |
| P-03 | User launches the AppImage on Linux | Same as P-01. |

**Architectural support:** Electron bundles Chromium; platform-specific differences are contained to the packaging layer handled by `electron-builder`.

---

### Responsiveness

| # | Stimulus | Response |
|---|---------|---------|
| R-01 | User clicks a day cell | The cell's color and the overview panel stats update within one rendered frame (~16 ms); no loading indicator is shown. |
| R-02 | User clicks the month navigation arrow | The calendar grid repaints to the new month within one rendered frame. |

**Architectural support:** All computation is synchronous and O(days-in-month); React's reconciler updates only changed DOM nodes; IPC save is asynchronous and does not block the render.
