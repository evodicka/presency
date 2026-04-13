# 11. Risks & Technical Debt

## Risks

### R-01: Electron Security — Outdated Bundled Chromium

| Attribute | Detail |
|-----------|--------|
| **Description** | Electron bundles a specific version of Chromium. If the application is not updated, the bundled Chromium may contain known security vulnerabilities. |
| **Likelihood** | Medium (Chromium vulnerabilities are found regularly) |
| **Impact** | Medium (the application is a local planning tool with no network access, reducing exploitability, but it is still a vector if combined with malicious local files) |
| **Mitigation** | Keep the Electron dependency current; adopt Electron LTS releases; establish a policy of updating within N weeks of a security advisory. |

---

### R-02: Computus Algorithm Correctness

| Attribute | Detail |
|-----------|--------|
| **Description** | The holiday service implements the Computus algorithm inline. A subtle implementation error could silently produce wrong Easter dates, causing incorrect holiday exclusions in working-time calculations. |
| **Likelihood** | Low (algorithm is well-documented and short) |
| **Impact** | Medium (incorrect working-time totals or percentage calculations without any visible error) |
| **Mitigation** | Unit-test `HolidayService` against known Easter dates for at least 10 years spanning past and future. Cross-reference at least three independent published Easter date tables. |

---

### R-03: File Write Race Condition on Rapid Status Changes

| Attribute | Detail |
|-----------|--------|
| **Description** | Status changes trigger an immediate fire-and-forget `fs.writeFile`. If the user clicks rapidly, multiple overlapping writes may occur. The last write wins, but an out-of-order completion could theoretically overwrite a newer state with an older one. |
| **Likelihood** | Low (Node.js `fs.writeFile` is fast relative to click speed; file writes typically complete in < 5 ms) |
| **Impact** | Low (at worst, one status change is lost and the user would click again) |
| **Mitigation** | For v1, accepted as a known limitation. For v2, implement a write queue (pending write cancels previous pending write) or use rename-based atomic writes. |

---

### R-04: No Data Backup or Recovery

| Attribute | Detail |
|-----------|--------|
| **Description** | The single JSON file is the only copy of the user's planning data. If it is accidentally deleted or corrupted, all data is lost permanently. |
| **Likelihood** | Low (the file lives in the OS user-data directory, which is rarely manually cleaned) |
| **Impact** | Medium (user loses planning history; data for open months must be re-entered) |
| **Mitigation** | Document the file location in the application's About or Help section. Consider a rolling backup (keep last 3 versions) in a future version. |

---

### R-05: Bavarian Holiday Rule Changes

| Attribute | Detail |
|-----------|--------|
| **Description** | The list of Bavarian public holidays is hardcoded in `HolidayService`. If Bavaria adds, removes, or changes a public holiday, the application will produce incorrect results until updated. |
| **Likelihood** | Very low (Bavarian holiday list has been stable for decades) |
| **Impact** | Low (incorrect day count or percentage for affected dates) |
| **Mitigation** | Accept for v1. Document the holiday list in the source code with a reference to the legal basis. Review if the list changes. |

## Technical Debt

### TD-01: No Atomic File Writes

The current design calls `fs.writeFile` directly. This is not atomic: a crash mid-write could produce a corrupted JSON file. The recommended pattern is to write to a temp file and `fs.rename` to replace the target. Deferred to a future version (see R-03).

### TD-02: No File Format Version

The JSON file has no schema version field. If the data model ever changes (e.g., adding a new status or storing additional metadata), there is no migration path. Adding a `{ version: 1, data: {...} }` envelope in a future version would enable forward-compatible migrations.

### TD-03: Hours vs Days — Resolved

**Resolved in architecture:** hours are used internally to define a working day (8 h/day per REQ-003) but the `MonthStats` type uses day counts only. The UI shows day counts, not hours. REQ-003's hour-based acceptance criteria (176 h = 22 × 8 h) are equivalent to the day count and are satisfied by displaying 22 working days. `WorkingTimeCalculator` exposes `totalWorkingDays: number` only; no hours field is present in `MonthStats`.
