# ADR-010: Per-Day Office Hours for On-Site Days

**Status:** Accepted  
**Date:** 2026-06-19

## Context

The original model counted every working day as a flat 8 hours. Users wanted to track the actual
time spent in the office on a given day and have the monthly goal calculation reflect those actuals.

## Decision

Add a `hours` field to on-site entries. The in-memory state changes from
`Record<string, DayStatus>` to `Record<string, DayEntry>` where
`DayEntry = { status: DayStatus; hours: number }`.

The on-disk format extends the existing sparse model (ADR-003) with a two-tier value:
- `"absent"` — bare string (unchanged).
- `"on-site"` — bare string when hours equals the 8h default.
- `{ "status": "on-site", "hours": <n> }` — object when hours differ from the default.

This preserves backward compatibility: legacy files with bare `"on-site"` strings load
correctly (interpreted as 8h). The sparse sparseness invariant is maintained — home-office
days still have no key.

The monthly goal calculation becomes hours-based:
- `onSiteHours` = sum of actual logged hours across on-site days.
- `effectiveHours` = `onSiteHours + homeOfficeDays × 8`.
- `onSitePercentage = onSiteHours / effectiveHours × 100`.
- `targetOnSiteHours = 40% × effectiveHours`.

The UI adds `−` / `+` buttons (15-minute steps, 0–24h clamp) to on-site day tiles only.
Adjustments apply and persist immediately, mirroring the existing click-to-cycle pattern.
Cycling an on-site day away and back resets hours to the 8h default (no remembered value).

## Consequences

**Positive:**
- Actual office time is reflected in the goal progress and hours-to-goal figure.
- On-disk format is fully backward-compatible; no migration script is needed.
- The sparse invariant is preserved; new months and all-home-office months produce no file entries.

**Negative:**
- The flat `HOURS_PER_WORKING_DAY × days` formula is no longer sufficient; consumers of
  `calculateMonthStats` must supply `Record<string, DayEntry>` instead of `Record<string, DayStatus>`.
- The distinction between bare-string and object values in the JSON requires normalisation on load.
- `totalWorkingHours` remains a nominal capacity figure (`totalWorkingDays × 8`), not the sum of
  actuals, to avoid a circular denominator. This is intentional.
