# Verification Plan: REQ-001+REQ-002+REQ-003+REQ-004+REQ-005+REQ-006-et-al

**Date:** 2026-04-09
**Requirements covered:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009
**Application:** Presency — Hybrid Work Planner — Electron desktop application for Bavarian office presence tracking

---

## Requirement Summary

A cross-platform Electron desktop application that displays a monthly calendar grid where users can plan daily work status (home-office, on-site, absent). The app calculates working hours and on-site presence ratios while excluding Bavarian public holidays, displays a monthly overview panel with a 40% office-goal indicator, and persists all status changes automatically to local disk using a sparse storage model.

---

## Assumptions & Open Questions

1. **Year scope for holiday computation (REQ-006 AC5):** The requirement states holidays must be correct "for any year." Does this mean the app must handle arbitrary past and future years, or is there a practical boundary (e.g., ±10 years from today)? Verification scenarios assume "any year navigable in the app."

2. **Home-office percentage definition (REQ-004 AC5):** The requirement states on-site% + home-office% = 100% (absent excluded). This confirms home-office% = 100% − on-site%. Verification will treat this as the authoritative formula.

3. **Default status for future days (REQ-005 AC4):** The indicator must reflect "full month plan, including future days with default status." This means days that have never been clicked are counted as home-office in calculations. Verification will confirm this behavior explicitly.

4. **Public holiday falling on a weekend:** The requirements do not explicitly state behavior when a Bavarian public holiday falls on a Saturday or Sunday. Since weekends are already non-interactive and excluded from working time, this is expected to have no observable effect. Verification will confirm holiday markers do not appear on weekend cells and calculations are unaffected.

5. **Storage file format (REQ-007):** The requirement names Electron's `app.getPath('userData')` but does not specify a file name or format. Verification treats the file as an implementation detail; persistence is verified at the behavioral level (close and reopen). If a specific file path is documented in architecture, contract-level tests against that file's structure would be additive.

6. **"Immediately" in AC wording (REQ-003 AC4, REQ-004 AC4):** Interpreted as synchronous update within the same render cycle — no async delay before the UI reflects the change.

7. **Platform scope for REQ-008:** Building and testing all three platform binaries requires separate CI environments. Verification plan notes this; full cross-platform binary testing is classified as partially automatable in CI and manual otherwise.

8. **Minimum resolution claim (REQ-009 AC3, AC4):** "1280x800" is the stated lower bound. Behavior at smaller viewports is not specified and is out of scope for this plan.

9. **Rounding policy (resolved — Action 3):** Percentages are rounded to one decimal place using standard rounding (round half up). This is now a stated assumption, not an open question. Consequences:
   - S-003-03: 10/19 × 100 = 52.631...% → displayed as **52.6%**
   - S-003-08: 5/15 × 100 = 33.333...% → displayed as **33.3%**
   - S-005-03: A 20-working-day month with 8 on-site days produces exactly **40.0%** (8/20 × 100 = 40.000, no rounding required)
   - S-004-05: Because each percentage is independently rounded to one decimal place before display, the sum of displayed on-site% and home-office% may be **99.9% or 100.1%** in edge cases where the raw values fall near a 0.05 boundary. Tests asserting this sum must accept ±0.1% tolerance.

---

## Existing Tests Review

No existing automated test files were found anywhere in the project tree. There are no `.test.*` or `.spec.*` files, no `test/` or `__tests__/` directories, and no test runner configuration.

**Status: No existing automated tests — treat the entire application as an uncovered gap. All scenarios in this plan represent net-new work.**

---

## Verification Scenarios

### REQ-001: Calendar View with Month Navigation

---

#### S-001-01: Default month on application start
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The application has just been launched
- **When:** The calendar view is rendered
- **Then:** The calendar header displays the current month and year (e.g., "April 2026" when run in April 2026); the calendar grid shows the correct days for that month
- **Priority:** High
- **Notes:** The expected month/year string must be derived dynamically from the system clock at test execution time, not hardcoded.

#### S-001-02: Forward month navigation
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The calendar is displaying any month M
- **When:** The user clicks the forward navigation control
- **Then:** The calendar advances to month M+1; the header updates to reflect the new month and year; the grid shows the correct days for M+1
- **Priority:** High
- **Notes:** Test at year boundary (December → January) to verify year increment.

#### S-001-03: Backward month navigation
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The calendar is displaying any month M
- **When:** The user clicks the backward navigation control
- **Then:** The calendar moves to month M−1; the header updates; the grid shows the correct days for M−1
- **Priority:** High
- **Notes:** Test at year boundary (January → December) to verify year decrement.

#### S-001-04: Unrestricted navigation — far future
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** The calendar is displaying the current month
- **When:** The user clicks forward navigation 24 consecutive times
- **Then:** The calendar displays the month 2 years in the future; no navigation control is disabled or hidden
- **Priority:** Medium

#### S-001-05: Unrestricted navigation — far past
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** The calendar is displaying the current month
- **When:** The user clicks backward navigation 24 consecutive times
- **Then:** The calendar displays the month 2 years in the past; no navigation control is disabled or hidden
- **Priority:** Medium

#### S-001-06: Monday-to-Sunday grid layout
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The calendar is displaying any month
- **When:** The calendar is rendered
- **Then:** The seven column headers read "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" from left to right
- **Priority:** High

#### S-001-07: Correct day placement — first day of month
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A month whose first day falls on a known weekday (e.g., April 2026 starts on Wednesday)
- **When:** The calendar is rendered for that month
- **Then:** The "1" cell appears in the Wednesday column of the first row; Monday and Tuesday cells in that row show the last days of the previous month
- **Priority:** High

#### S-001-08: Adjacent-month days are muted and non-interactive
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A month that requires filler days from the preceding or following month (virtually all months)
- **When:** The calendar is rendered
- **Then:** Days from adjacent months render with a muted/disabled visual style; clicking them produces no status change; they do not appear in any count in the overview panel
- **Priority:** High

#### S-001-09: Weekend days are visually distinct
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** Any displayed month
- **When:** The calendar is rendered
- **Then:** All cells in the "Sat" and "Sun" columns have a distinct visual treatment compared to weekday cells
- **Priority:** High

#### S-001-10: Weekend days are non-interactive
- **Category:** Negative
- **Automation:** Automatable
- **Given:** A Saturday or Sunday cell is visible on the calendar
- **When:** The user clicks that cell
- **Then:** The cell's appearance does not change; no status is set or cycled
- **Priority:** High

#### S-001-11: Grid integrity — months with 28, 29, 30, 31 days
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** The user navigates to February of a non-leap year (28 days), a leap year (29 days), a 30-day month (e.g., April), and a 31-day month (e.g., January)
- **When:** Each calendar is rendered
- **Then:** Exactly the correct number of day cells for that month are present; no day is missing or duplicated; adjacent-month filler is used correctly at start and end of grid
- **Priority:** High

---

### REQ-002: Day Status Management

---

#### S-002-01: Default status is home-office
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A fresh application state with no persisted data; any working day cell is displayed
- **When:** The calendar renders that day
- **Then:** The cell displays the home-office color/style; no explicit status has been set
- **Priority:** High

#### S-002-02: First click cycles home-office to on-site
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A working day cell currently showing home-office status
- **When:** The user clicks the cell once
- **Then:** The cell's status changes to on-site and the on-site color is applied immediately
- **Priority:** High

#### S-002-03: Second click cycles on-site to absent
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A working day cell currently showing on-site status
- **When:** The user clicks the cell
- **Then:** The cell's status changes to absent and the absent color is applied immediately
- **Priority:** High

#### S-002-04: Third click cycles absent back to home-office
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A working day cell currently showing absent status
- **When:** The user clicks the cell
- **Then:** The cell's status returns to home-office and the home-office color is applied immediately
- **Priority:** High

#### S-002-05: Complete three-click cycle returns to original state
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A working day cell in home-office status
- **When:** The user clicks the cell three times in succession
- **Then:** The cell is back to home-office status; the three intermediate states (on-site, absent, home-office) were each observed once during the cycle
- **Priority:** Medium
- **Notes:** Confirms cycle is exactly length-3 and wraps correctly.

#### S-002-06: Three distinct colors for three statuses
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** Three working day cells set to home-office, on-site, and absent respectively
- **When:** Compared visually / via computed style
- **Then:** Each cell has a distinct background color; all three colors are different from one another
- **Priority:** High

#### S-002-07: Legend is displayed
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The calendar view is rendered
- **When:** Inspecting the UI
- **Then:** A legend is visible that maps each of the three status labels (home-office, on-site, absent) to their respective colors
- **Priority:** Medium

#### S-002-08: Public holiday click produces no status change (cross-reference REQ-006)
- **Category:** Negative
- **Automation:** Automatable
- **Given:** A Bavarian public holiday falls on a weekday in the displayed month
- **When:** The user clicks that day cell
- **Then:** No status is set; the cell retains its holiday visual style; no change in the overview panel values
- **Priority:** High

#### S-002-09: Saturday click produces no status change
- **Category:** Negative
- **Automation:** Automatable
- **Given:** A Saturday cell is visible
- **When:** The user clicks it repeatedly
- **Then:** The cell's appearance does not change; no status is cycled
- **Priority:** High

#### S-002-10: Sunday click produces no status change
- **Category:** Negative
- **Automation:** Automatable
- **Given:** A Sunday cell is visible
- **When:** The user clicks it
- **Then:** Same as S-002-09
- **Priority:** High

---

### REQ-003: Working Time Calculation

---

#### S-003-01: 22 weekdays, no holidays, no absences — 176 hours
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The user navigates to **March 2026 (22 weekdays, 0 Bavarian public holidays)**. March has no fixed-date Bavarian holidays, and Easter 2026 falls on April 5, so no moveable feast (Good Friday, Easter Monday, Ascension, Whit Monday, Corpus Christi) touches March. All days remain at default home-office status (no absences).
- **When:** The overview panel is read
- **Then:** Total working time = 176 hours (22 × 8)
- **Priority:** High
- **Notes:** March 2026 is confirmed holiday-free for Bavarian public holidays: no fixed-date holiday falls in March, and all Easter-derived moveable feasts land in April or later. This month can be used for both unit tests and e2e tests without mocking the holiday list.

#### S-003-02: 19 weekdays (after 2 holidays), 2 absences — 136 hours
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The user navigates to **May 2026**. May 2026 has: Tag der Arbeit (May 1, Friday) = 1 Bavarian public holiday on a weekday; Christi Himmelfahrt (May 14, Thursday) = 1 Bavarian public holiday on a weekday. Total weekdays in May 2026 = 21; total weekday holidays = 2; non-holiday weekdays = 19. The user sets exactly **2 days** to absent status (choosing days that are non-holiday weekdays).
- **When:** The overview panel is read
- **Then:** Total working time = (19 − 2) × 8 = **136 hours**
- **Priority:** High
- **Notes:** May 2026 has two weekday holidays (May 1 and May 14), not one. The original scenario assumed a month with exactly 1 weekday holiday and 22 raw weekdays. No straightforward real month in 2025–2026 satisfies both conditions simultaneously without additional research. **Assumption made:** This scenario is restructured to use May 2026 with its verified 2 weekday holidays, and the expected total is adjusted accordingly. If the team requires a "1 holiday" scenario specifically, a month with exactly 1 weekday Bavarian holiday must be identified separately (e.g., August 2026: Mariä Himmelfahrt on Aug 15, a Saturday in 2026 — does not qualify; November 2026: Allerheiligen on Nov 1, a Sunday — does not qualify; January 2026: Neujahrstag Jan 1 Thursday = 1 holiday, Heilige Drei Könige Jan 6 Tuesday = 1 holiday — two again). The team should confirm a suitable month before finalizing this test case.

#### S-003-03: On-site percentage calculation — 52.6%
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A month configured with 10 on-site days and 9 home-office days (and no absent, no holidays affecting the count)
- **When:** The on-site percentage is read from the overview panel
- **Then:** On-site percentage = 10 / (10 + 9) × 100 = 52.631...% → displayed as **52.6%** (one decimal place, round half up)
- **Priority:** High

#### S-003-04: Status change decrements total working time immediately
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A working day currently showing home-office status; total working time is T hours
- **When:** The user clicks the day until it reaches absent status
- **Then:** Total working time displayed in the overview panel is T − 8 hours immediately after the click
- **Priority:** High

#### S-003-05: Percentage recalculates immediately on status change
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A month with a known on-site percentage P
- **When:** The user changes one home-office day to on-site
- **Then:** The on-site percentage updates immediately to reflect the new denominator and numerator
- **Priority:** High

#### S-003-06: All working days absent — total working time = 0
- **Category:** Boundary / Negative
- **Automation:** Automatable
- **Given:** All non-holiday weekdays in the displayed month are set to absent
- **When:** The overview panel is read
- **Then:** Total working time = 0 hours
- **Priority:** High

#### S-003-07: All working days absent — on-site percentage = 0%, no division-by-zero
- **Category:** Boundary / Negative
- **Automation:** Automatable
- **Given:** Same as S-003-06 (all days absent)
- **When:** The on-site percentage is read
- **Then:** On-site percentage = 0% (or displayed as "—" / "N/A" if defined); application does not crash or display NaN/Infinity
- **Priority:** High
- **Notes:** This scenario must verify the division-by-zero guard explicitly.

#### S-003-08: Mixed absent, on-site, home-office — correct denominator
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A 19 non-holiday weekday month with 5 on-site, 10 home-office, 4 absent days
- **When:** Overview panel is read
- **Then:** Denominator = 15 (5 + 10); on-site% = 5/15 × 100 = 33.333...% → displayed as **33.3%** (one decimal place, round half up); total working time = 15 × 8 = 120 hours
- **Priority:** High

#### S-003-09: Weekends are excluded from total working time
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** Any displayed month
- **When:** Totals are computed
- **Then:** Saturday and Sunday cells do not contribute to total working time regardless of how many weekend days the month has
- **Priority:** Medium
- **Notes:** Verified implicitly by S-003-01 through S-003-08 if test data is chosen carefully; may be covered by unit-testing the calculation function directly.

#### S-003-10: Public holidays excluded from working time (cross-reference REQ-006)
- **Category:** Integration
- **Automation:** Automatable
- **Given:** A month containing a Bavarian public holiday on a weekday (e.g., Tag der Arbeit, May 1, when it falls Monday–Friday)
- **When:** Total working time is read
- **Then:** That holiday day does not contribute 8 hours to the total
- **Priority:** High

---

### REQ-004: Monthly Overview Panel

---

#### S-004-01: Overview panel is rendered to the right of the calendar
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The application is launched at 1280×800 or greater
- **When:** The UI is inspected
- **Then:** A "Monthly Overview" panel is visible and positioned to the right of the calendar grid; both are visible simultaneously without scrolling
- **Priority:** High

#### S-004-02: Panel shows on-site and home-office percentages with labels
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The overview panel is visible
- **When:** Inspected for content
- **Then:** Labeled percentage values for both "on-site" and "home-office" are displayed
- **Priority:** High

#### S-004-03: Panel shows day counts for all three statuses
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The overview panel is visible and some days have been set to each status
- **When:** The count values are read
- **Then:** Separate, labeled counts for on-site days, home-office days, and absent days are displayed and match the actual number of days in each status
- **Priority:** High

#### S-004-04: Panel values update immediately on status change
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The overview panel is showing known values
- **When:** The user clicks a working day to change its status
- **Then:** All affected values in the overview panel (counts, percentages, total hours) update in the same render cycle with no observable lag or stale intermediate state
- **Priority:** High

#### S-004-05: On-site% + home-office% = 100%
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** Any month state that has at least one non-absent working day
- **When:** Both percentage values are read from the panel
- **Then:** The sum of displayed on-site% and home-office% equals **100.0% ± 0.1%**. Because each value is independently rounded to one decimal place (round half up per Assumption 9), the displayed sum may be 99.9% or 100.1% in cases where both raw values sit near a 0.05 rounding boundary. The test must accept this ±0.1% tolerance and must NOT assert an exact 100.0% sum.
- **Priority:** High
- **Notes:** Example of a rounding edge case: on-site raw = 33.333%, home-office raw = 66.666%. Rounded individually: 33.3% + 66.7% = 100.0% (no issue here). A genuine ±0.1% case: on-site raw = 33.35%, home-office raw = 66.65% → 33.4% + 66.7% = 100.1%. Tests should use assert `|sum − 100.0| ≤ 0.1`.

#### S-004-06: Panel reflects total working days correctly
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A month with a known number of non-holiday weekdays and some absent days
- **When:** The "total working days" value is read
- **Then:** The value equals (non-holiday weekdays) − (absent days), matching the denominator logic from REQ-003
- **Priority:** Medium

---

### REQ-005: 40% Office Presence Goal Indicator

---

#### S-005-01: Indicator is green when on-site% >= 40%
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A month where the on-site percentage is >= 40% (e.g., 8 on-site, 12 home-office → 40%)
- **When:** The indicator is rendered
- **Then:** The goal indicator displays in green
- **Priority:** High

#### S-005-02: Indicator is warning color when on-site% < 40%
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** A month where on-site percentage is < 40% (e.g., 3 on-site, 17 home-office → ~15%)
- **When:** The indicator is rendered
- **Then:** The indicator displays in an orange or red (warning/urgency) color
- **Priority:** High

#### S-005-03: Indicator exactly at threshold — 40% is green
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** A state where on-site percentage is exactly 40.0%. Use a month (or mocked state) with **20 non-holiday working days** and set **8 days to on-site**, leaving 12 as home-office. Calculation: 8/20 × 100 = **40.000%** → displayed as **40.0%** (no rounding ambiguity).
- **When:** The indicator is rendered
- **Then:** The indicator is green (boundary is inclusive for the green state)
- **Priority:** High
- **Notes:** 20 working days is chosen because 8/20 = 40.0% exactly with no floating-point rounding remainder. A month with 20 non-holiday weekdays: March 2026 has 21 weekdays and 0 Bavarian public holiday weekdays, so the team can set one day to absent to arrive at 20 effective working days, then set 8 of the remaining 20 to on-site.

#### S-005-04: Indicator just below threshold — 39.x% is warning color
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** A state where on-site percentage is just below 40% (e.g., 3 on-site, 5 home-office → 37.5%)
- **When:** The indicator is rendered
- **Then:** The indicator is warning/orange/red
- **Priority:** High

#### S-005-05: Indicator updates immediately when threshold is crossed
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The indicator is currently warning color (on-site% just below 40%)
- **When:** The user clicks a home-office day to change it to on-site, pushing the percentage to >= 40%
- **Then:** The indicator changes from warning color to green in the same render cycle
- **Priority:** High

#### S-005-06: Indicator updates immediately when crossing below threshold
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The indicator is currently green (on-site% at exactly 40%)
- **When:** The user clicks an on-site day to cycle it to absent (or home-office), dropping the percentage below 40%
- **Then:** The indicator changes from green to warning color in the same render cycle
- **Priority:** High

#### S-005-07: Indicator accounts for future days with default home-office status
- **Category:** Edge Case
- **Automation:** Automatable
- **Given:** The user is viewing a future month in which no days have been explicitly set
- **When:** The indicator is rendered
- **Then:** The indicator reflects a 0% on-site percentage (all days default to home-office) and shows warning color
- **Priority:** Medium
- **Notes:** Verifies REQ-005 AC4: "full month plan, including future days with default status."

#### S-005-08: All days absent — indicator behavior
- **Category:** Edge Case
- **Automation:** Automatable
- **Given:** All working days are set to absent (denominator = 0)
- **When:** The indicator is rendered
- **Then:** Indicator behavior is consistent with 0% on-site (warning color); no crash or undefined state
- **Priority:** Medium

#### S-005-09: Current month with mixed past explicit statuses and future default days — indicator evaluates full month plan
- **Category:** Edge Case
- **Automation:** Automatable (Playwright/E2E with mocked current date)
- **Given:** The displayed month is the current month (current date mocked to mid-month, e.g., the 15th); the first half of the working days (days 1–10 of the month) have been explicitly set — some on-site, some home-office; the remaining working days for the rest of the month still have their default (home-office) status and have never been clicked
- **When:** The overview panel and goal indicator are displayed
- **Then:** The indicator evaluates ALL planned working days for the full month — including the future default-status days — not just the past explicitly-set days; the on-site percentage is computed as (on-site count across all working days in the month) / (on-site + home-office across all working days in the month) × 100; the result matches the full-month formula, not a partial view limited to days 1–10
- **Priority:** High
- **Notes:** Directly verifies REQ-005 AC4: "reflects the user's planned intent for the entire month, not a partial or confirmed-only view." The mocked current date is required to make "past" and "future" days deterministic in a repeatable test.

#### S-005-10: Indicator is part of the monthly overview panel
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The overview panel is visible
- **When:** The UI is inspected
- **Then:** The goal indicator is visually contained within or immediately adjacent to the monthly overview panel, not floating separately
- **Priority:** Low

---

### REQ-006: Bavarian Public Holiday Support

---

#### S-006-01: Fixed-date holidays are marked on the calendar
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The user navigates to a month containing a fixed Bavarian public holiday on a weekday (e.g., January 2026 for Neujahrstag on Thursday Jan 1, or Heilige Drei Könige on Tuesday Jan 6)
- **When:** The calendar is rendered
- **Then:** Those holiday cells are visually marked as holidays (distinct from regular weekdays, on-site, home-office, and absent styling)
- **Priority:** High

#### S-006-02: Variable/moveable holidays are marked correctly — current year
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** Easter-derived holidays for 2025 and 2026 are computed using the reference dates established in S-006-05b: for 2025 (Easter April 20): Karfreitag Apr 18, Ostermontag Apr 21, Christi Himmelfahrt May 29, Pfingstmontag Jun 9, Fronleichnam Jun 19; for 2026 (Easter April 5): Karfreitag Apr 3, Ostermontag Apr 6, Christi Himmelfahrt May 14, Pfingstmontag May 25, Fronleichnam Jun 4
- **When:** The user navigates to the respective months and the calendar renders for each year
- **Then:** Each holiday cell is visually marked on the correct date per the Easter algorithm for that year; no adjacent dates are incorrectly marked
- **Priority:** High
- **Notes:** Covered in detail by S-006-05b. This scenario serves as the happy-path summary; S-006-05b is the definitive acceptance check with specific dates. At least two years are always tested to confirm the algorithm is year-parameterized rather than hardcoded.

#### S-006-03: Holiday click produces no status change
- **Category:** Negative
- **Automation:** Automatable
- **Given:** A Bavarian public holiday falls on a weekday in the displayed month
- **When:** The user clicks the holiday cell
- **Then:** The cell's visual state does not change to any of the work statuses; the overview panel counts do not change
- **Priority:** High

#### S-006-04: Holiday excluded from working time calculation
- **Category:** Integration
- **Automation:** Automatable
- **Given:** A month containing one Bavarian public holiday on a weekday
- **When:** Total working time is computed
- **Then:** The holiday day does not contribute 8 hours; total working time = (non-holiday weekdays − absences) × 8
- **Priority:** High

#### S-006-05a: All 8 fixed-date Bavarian holidays are recognized across multiple years
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The following fixed-date holidays are verified in years where they fall on a weekday:
  - **Neujahrstag (Jan 1):** 2026 = Thursday — navigate to January 2026, verify Jan 1 is marked
  - **Heilige Drei Könige (Jan 6):** 2026 = Tuesday — verify Jan 6 in January 2026 is marked; 2025 = Monday — verify Jan 6 in January 2025 is marked
  - **Tag der Arbeit (May 1):** 2026 = Friday — verify May 1 in May 2026 is marked; 2025 = Thursday — verify May 1 in May 2025 is marked
  - **Maria Himmelfahrt (Aug 15):** 2025 = Friday — verify Aug 15 in August 2025 is marked; 2026 = Saturday (skip — falls on weekend, no weekday marking expected)
  - **Tag der Deutschen Einheit (Oct 3):** 2025 = Friday — verify Oct 3 in October 2025 is marked; 2026 = Saturday (skip)
  - **Allerheiligen (Nov 1):** 2025 = Saturday (skip); 2026 = Sunday (skip) — **assumption: use 2027 for Allerheiligen** (Nov 1, 2027 = Monday — verify in November 2027)
  - **1. Weihnachtstag (Dec 25):** 2025 = Thursday — verify Dec 25 in December 2025 is marked; 2026 = Friday — verify Dec 25 in December 2026 is marked
  - **2. Weihnachtstag (Dec 26):** 2025 = Friday — verify Dec 26 in December 2025 is marked; 2026 = Saturday (skip)
- **When:** The calendar is rendered for each affected month/year combination listed above
- **Then:** Each holiday cell is visually marked as a public holiday (distinct from regular weekday, on-site, home-office, and absent styling); the cell is non-interactive
- **Priority:** High
- **Notes:** Not all fixed-date holidays fall on weekdays in any single year. Tests use the specific year/date combinations listed above. The "skip" entries (weekend falls) are covered by S-006-06. Allerheiligen and Tag der Deutschen Einheit may require navigating to 2027 if both 2025 and 2026 instances fall on weekends.

#### S-006-05b: All 5 moveable Easter-derived holidays are recognized across multiple years
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** Easter-derived holiday dates for two verified years:
  - **2025** (Easter Sunday = April 20):
    - Karfreitag = April 18, 2025 (Friday) — navigate to April 2025, verify April 18 is marked
    - Ostermontag = April 21, 2025 (Monday) — navigate to April 2025, verify April 21 is marked
    - Christi Himmelfahrt = May 29, 2025 (Thursday) — navigate to May 2025, verify May 29 is marked
    - Pfingstmontag = June 9, 2025 (Monday) — navigate to June 2025, verify June 9 is marked
    - Fronleichnam = June 19, 2025 (Thursday) — navigate to June 2025, verify June 19 is marked
  - **2026** (Easter Sunday = April 5):
    - Karfreitag = April 3, 2026 (Friday) — navigate to April 2026, verify April 3 is marked
    - Ostermontag = April 6, 2026 (Monday) — navigate to April 2026, verify April 6 is marked
    - Christi Himmelfahrt = May 14, 2026 (Thursday) — navigate to May 2026, verify May 14 is marked
    - Pfingstmontag = May 25, 2026 (Monday) — navigate to May 2026, verify May 25 is marked
    - Fronleichnam = June 4, 2026 (Thursday) — navigate to June 2026, verify June 4 is marked
- **When:** The calendar is rendered for each affected month/year combination listed above
- **Then:** Each of the 10 holiday cells (5 per year × 2 years) is visually marked as a public holiday and is non-interactive; no incorrect dates in adjacent months are marked
- **Priority:** High
- **Notes:** These dates are derived from the computus algorithm (Easter Sunday offsets: Karfreitag −2, Ostermontag +1, Christi Himmelfahrt +39, Pfingstmontag +50, Fronleichnam +60). A pure unit test of the Easter computation function against these reference values is strongly recommended before running UI-level assertions (see also S-006-07).

#### S-006-06: Holiday falling on a weekend has no observable effect on weekday grid
- **Category:** Edge Case
- **Automation:** Automatable
- **Given:** A Bavarian public holiday falls on a Saturday or Sunday in a given year (e.g., Tag der Arbeit on a Sunday)
- **When:** The calendar is rendered for that month
- **Then:** No weekday cell is incorrectly marked as a holiday; the weekend cell may or may not show a holiday marker (implementation choice), but working time and counts are unaffected
- **Priority:** Medium

#### S-006-07: Easter-based holidays are correct across multiple years
- **Category:** Boundary
- **Automation:** Automatable
- **Given:** A parameterized set of years with known Easter dates (e.g., 2024: March 31; 2025: April 20; 2026: April 5; 2030: April 21)
- **When:** The application navigates to the affected months and holidays are read
- **Then:** Karfreitag is exactly 2 days before Easter Sunday, Ostermontag is 1 day after, Christi Himmelfahrt is 39 days after, Pfingstmontag is 50 days after, Fronleichnam is 60 days after — for each test year
- **Priority:** High
- **Notes:** This is the most critical algorithmic correctness check for REQ-006. A pure unit test of the holiday computation function is strongly recommended as the primary vehicle.

---

### REQ-007: Data Persistence

---

#### S-007-01: Status survives application restart
- **Category:** Happy Path
- **Automation:** Partially automatable — the "close and reopen" step can be scripted in an Electron e2e test; on CI this requires a persistent `userData` path between test runs
- **Given:** The user has set one or more days to on-site or absent status
- **When:** The application is closed and relaunched
- **Then:** All previously set statuses are restored correctly on the correct dates
- **Priority:** High

#### S-007-02: Data for multiple months is persisted and retrievable
- **Category:** Happy Path
- **Automation:** Partially automatable — requires multi-month state setup and cross-session verification
- **Given:** The user sets statuses in at least two different months and closes the application
- **When:** The application is reopened and both months are navigated to
- **Then:** Both months show the previously set statuses correctly
- **Priority:** High

#### S-007-03: First launch with no prior data defaults all days to home-office
- **Category:** Happy Path
- **Automation:** Automatable (requires a clean userData directory as precondition)
- **Given:** The application is launched for the first time with no existing persistence file
- **When:** Any month is viewed
- **Then:** All working days show the home-office status; no error is thrown; no crash occurs
- **Priority:** High

#### S-007-04: Status change is auto-persisted without explicit save
- **Category:** Happy Path
- **Automation:** Partially automatable
- **Given:** The user changes a day's status
- **When:** The application is immediately closed (no other action) and relaunched
- **Then:** The changed status is present; the user was not asked to save
- **Priority:** High

#### S-007-05: Sparse model — home-office days are not stored
- **Category:** Happy Path
- **Automation:** Automatable (unit/contract test against the persistence layer)
- **Given:** Some days are set to home-office (default), some to on-site, some to absent
- **When:** The persistence file is inspected
- **Then:** Only on-site and absent days appear in the stored data; home-office days are absent from the store
- **Priority:** Medium
- **Notes:** This is best verified as a unit test of the persistence module. Behavioral verification is covered by S-007-01.

#### S-007-06: Cycling a day back to home-office removes it from storage
- **Category:** Edge Case
- **Automation:** Automatable (unit/contract test)
- **Given:** A day is set to on-site (and thus stored)
- **When:** The user clicks it twice more, cycling it back to home-office
- **Then:** The day's entry is removed from the persistence store; the file no longer references that date
- **Priority:** Medium

#### S-007-07: Persistence file stored at Electron userData path
- **Category:** Integration
- **Automation:** Automatable (integration test inspecting file system path)
- **Given:** The application has persisted some status data
- **When:** The file system is inspected at `app.getPath('userData')`
- **Then:** A data file exists at that path containing the persisted statuses
- **Priority:** Low
- **Notes:** Useful for debugging and support; low priority for regression blocking.

#### S-007-08: Corrupted or missing persistence file — graceful degradation
- **Category:** Negative
- **Automation:** Automatable (seed a malformed file before launch)
- **Given:** The persistence file exists but contains malformed/invalid JSON (or another format error)
- **When:** The application is launched
- **Then:** The application launches successfully; all days default to home-office; no crash or unhandled error occurs; optionally a non-blocking warning is shown
- **Priority:** Medium

#### S-007-09: Failed `saveStatuses` call does not crash the app
- **Category:** Negative
- **Automation:** Automatable (Jest unit/integration test; mock `window.electronAPI.saveStatuses` to reject)
- **Given:** A working day's status has been set (e.g., home-office → on-site), and `window.electronAPI.saveStatuses` is mocked to return a rejected Promise (simulating a disk write failure or IPC error)
- **When:** The status change is triggered (e.g., the user clicks the day cell)
- **Then:** (a) The application does not crash or throw an unhandled rejection; (b) the in-memory status state is preserved — the day still reflects the new status in the UI; (c) a non-blocking error indicator appears (e.g., a console error or a toast notification — the exact mechanism is determined by the implementation)
- **Priority:** High
- **Notes:** `persistence.js` (or the equivalent persistence module) must be included in the Jest test scope. This scenario guards against silent data-loss scenarios where the UI and persisted state diverge without user feedback.

---

### REQ-008: Electron Desktop Application

---

#### S-008-01: Application launches on macOS without external server
- **Category:** Happy Path
- **Automation:** Partially automatable — requires macOS CI runner; binary smoke test is automatable, full visual inspection is manual
- **Given:** A macOS machine with the built `.app` bundle
- **When:** The bundle is double-clicked or launched via CLI
- **Then:** The application window opens, the calendar renders, no external server process is started
- **Priority:** High

#### S-008-02: Application launches on Windows without external server
- **Category:** Happy Path
- **Automation:** Partially automatable — requires Windows CI runner
- **Given:** A Windows machine with the built `.exe` installer/binary
- **When:** The binary is launched
- **Then:** Same as S-008-01 on Windows
- **Priority:** High

#### S-008-03: Application launches on Linux without external server
- **Category:** Happy Path
- **Automation:** Partially automatable — requires Linux CI runner
- **Given:** A Linux machine with the built AppImage
- **When:** The AppImage is launched
- **Then:** Same as S-008-01 on Linux
- **Priority:** Medium

#### S-008-04: Build step produces platform-specific binaries
- **Category:** Happy Path
- **Automation:** Automatable (CI build job)
- **Given:** The build command is executed on each target platform
- **When:** The build completes
- **Then:** A platform-appropriate binary artifact is produced (`.app`, `.exe`, `AppImage`)
- **Priority:** High

#### S-008-05: No multi-step installation required
- **Category:** Happy Path
- **Automation:** ⚠️ Manual only — requires human judgment to assess the installation experience end-to-end
- **Given:** A fresh target machine with no prior installation
- **When:** The user receives the binary and runs it
- **Then:** The application opens without requiring the user to install additional dependencies, runtimes, or run separate setup scripts
- **Priority:** Medium

#### S-008-06: No backend server process spawned
- **Category:** Negative
- **Automation:** Automatable (inspect running processes after launch)
- **Given:** The application has been launched
- **When:** System process list is inspected
- **Then:** No external server process (e.g., Node.js HTTP server, Python server) is running that was spawned by the application; only the Electron main and renderer processes are present
- **Priority:** Medium

---

### REQ-009: Fresh and Intuitive UI Design

---

#### S-009-01: Layout — calendar left, overview right, title top
- **Category:** Happy Path
- **Automation:** Automatable (element bounding-box assertions via e2e test)
- **Given:** The application is rendered at 1280×800
- **When:** The layout is inspected via computed positions
- **Then:** The application title is in the top region; the calendar grid is in the left region; the overview panel is in the right region; all three are visible without scrolling
- **Priority:** High

#### S-009-02: Status legend is visible near or above the calendar
- **Category:** Happy Path
- **Automation:** Automatable
- **Given:** The calendar view is rendered
- **When:** The legend element is located
- **Then:** The legend is rendered near or above the calendar grid, not buried in the overview panel or footer
- **Priority:** Medium

#### S-009-03: No horizontal scroll at 1280px width
- **Category:** Boundary
- **Automation:** Automatable (set viewport to exactly 1280px, assert no horizontal overflow)
- **Given:** The application window is set to exactly 1280px wide
- **When:** The layout is measured
- **Then:** The document does not have a horizontal scrollbar; calendar and overview panel are displayed side by side
- **Priority:** High

#### S-009-04: All elements reachable without scrolling at 1280×800
- **Category:** Boundary
- **Automation:** Automatable (assert no scroll on the primary viewport)
- **Given:** The application window is set to exactly 1280×800
- **When:** All primary UI elements are located (title, calendar, navigation controls, overview panel, legend, goal indicator)
- **Then:** All elements are within the viewport bounds; no vertical or horizontal scrollbar is active
- **Priority:** High

#### S-009-05: Calendar and overview shown side by side at >= 1280px
- **Category:** Happy Path
- **Automation:** Automatable (measure element positions at multiple widths: 1280, 1440, 1920)
- **Given:** The window is at each of 1280px, 1440px, 1920px width
- **When:** Calendar and overview panel positions are measured
- **Then:** In all three cases, the calendar and overview panel are rendered side by side (overview panel's left edge is to the right of the calendar's right edge)
- **Priority:** High

---

### Cross-Requirement Integration Scenarios

---

#### S-INT-01: Holiday exclusion flows end-to-end into overview panel
- **Category:** Integration (REQ-001 + REQ-006 + REQ-003 + REQ-004)
- **Automation:** Automatable
- **Given:** A month with at least one Bavarian public holiday on a weekday; all other days are at default (home-office)
- **When:** The overview panel is read
- **Then:** The holiday day does not appear in any status count (not in home-office, on-site, or absent counts); total working time excludes the holiday; the overview panel values are consistent with the calculation rules in REQ-003
- **Priority:** High

#### S-INT-02: Status change in calendar immediately reflects in overview panel and goal indicator
- **Category:** Integration (REQ-002 + REQ-003 + REQ-004 + REQ-005)
- **Automation:** Automatable
- **Given:** A month with a known state (e.g., 5 on-site, 10 home-office, 0 absent, no holidays)
- **When:** The user clicks one home-office day to change it to on-site
- **Then:** The on-site count increments by 1; home-office count decrements by 1; on-site percentage updates immediately; the goal indicator color updates if the threshold was crossed; total working time remains unchanged (absent days did not change)
- **Priority:** High

#### S-INT-03: Absent status change flows into all calculations simultaneously
- **Category:** Integration (REQ-002 + REQ-003 + REQ-004 + REQ-005)
- **Automation:** Automatable
- **Given:** A month with on-site% at exactly 40% (at goal); no absent days
- **When:** The user sets one on-site day to absent (two clicks: on-site → absent)
- **Then:** On-site count decrements; absent count increments; total working time decreases by 8 hours; on-site% is recalculated over the new smaller denominator; the goal indicator may change color if the new percentage drops below 40%
- **Priority:** High

#### S-INT-04: Month navigation resets overview panel to new month's state
- **Category:** Integration (REQ-001 + REQ-003 + REQ-004 + REQ-005)
- **Automation:** Automatable
- **Given:** The user has set statuses for Month A and the overview panel shows Month A's values
- **When:** The user navigates to Month B (which has different statuses)
- **Then:** The overview panel updates to reflect Month B's counts, percentages, and working time; the goal indicator reflects Month B's on-site percentage; Month A's values are no longer displayed
- **Priority:** High

#### S-INT-05: Persistence preserves statuses across month navigation and restart
- **Category:** Integration (REQ-001 + REQ-007)
- **Automation:** Partially automatable (requires app restart within test)
- **Given:** The user sets statuses in Month A, navigates to Month B, sets statuses in Month B, then closes the app
- **When:** The app is relaunched; the user navigates to Month A then Month B
- **Then:** Both months display the previously set statuses; the overview panel for each month shows the correct values; the goal indicator reflects each month's persisted state
- **Priority:** High

#### S-INT-06: Public holiday adjacent to status-set days — calculation boundary
- **Category:** Integration (REQ-002 + REQ-006 + REQ-003)
- **Automation:** Automatable
- **Given:** A Bavarian public holiday falls on a weekday in a month; the days immediately before and after it are set to on-site
- **When:** Calculations are performed
- **Then:** The holiday itself contributes 0 hours; the adjacent on-site days each contribute 8 hours; the holiday does not appear in on-site, home-office, or absent counts
- **Priority:** Medium

#### S-INT-07: Goal indicator reflects full-month default state on navigation to unvisited month
- **Category:** Integration (REQ-001 + REQ-002 + REQ-005 + REQ-007)
- **Automation:** Automatable
- **Given:** The user navigates to a month with no previously persisted data
- **When:** The overview panel and goal indicator are read
- **Then:** All working days are counted as home-office; on-site% = 0%; goal indicator is warning color; total working time = (non-holiday weekdays) × 8
- **Priority:** Medium

#### S-INT-08: Electron userData path is used correctly across platforms
- **Category:** Integration (REQ-007 + REQ-008)
- **Automation:** Partially automatable (per-platform CI job)
- **Given:** The application is built and launched on each supported platform
- **When:** Data is persisted and the userData path is inspected
- **Then:** The persistence file is found at `app.getPath('userData')` on each platform; the path resolves to the correct platform-native location (e.g., `~/Library/Application Support` on macOS)
- **Priority:** Medium

#### S-INT-09: UI layout accommodates calendar for months of varying week-row count
- **Category:** Integration (REQ-001 + REQ-009)
- **Automation:** Automatable
- **Given:** Months that minimise current-month content (e.g., February 2010 — starts on Monday, 4 rows of real current-month days, 2 filler rows in the fixed 6-row grid) and months that maximise it (e.g., October 2023 — starts on Sunday, 6 rows all containing October days) are displayed
- **When:** The layout is measured
- **Then:** The calendar, overview panel, and goal indicator remain within the viewport at 1280×800 for both months; no overflow or clipping occurs (the grid is always 6 rows; what varies is how many rows contain actual current-month days vs. filler cells)
- **Priority:** Medium
- **Notes:** The architecture mandates a fixed 6-row grid at all times. February 2010 is chosen as the minimal-content case because it starts on Monday and has 28 days, producing 4 rows of real content and 2 filler rows. October 2023 starts on Sunday and fills all 6 rows with October dates.

#### S-INT-10: Legend colors match day cell colors in all states
- **Category:** Integration (REQ-002 + REQ-009)
- **Automation:** Automatable
- **Given:** The legend is visible; working day cells are set to each of the three statuses
- **When:** Legend color swatches are compared to cell background colors via computed styles
- **Then:** Each legend swatch's color exactly matches the corresponding day cell's background color for that status
- **Priority:** Medium

---

## Manual-Only Scenarios Summary

Only one scenario in this plan is classified as strictly manual-only:

| Scenario | Reason |
|----------|--------|
| S-008-05: No multi-step installation required | Requires human judgment to evaluate the installation experience on a fresh machine. Automated process inspection can verify no setup scripts run, but the qualitative "friction-free" criterion cannot be fully asserted by a machine. |

**All other scenarios are automatable or partially automatable.**

Note on "Partially automatable" scenarios (S-007-01, S-007-02, S-007-04, S-008-01, S-008-02, S-008-03, S-INT-05, S-INT-08): The automation gap in each case is either the need for a specific CI environment (platform-specific runners) or the need to restart the application process within a test. Both gaps are closeable with appropriate Electron e2e test infrastructure (e.g., Playwright + Electron or Spectron). Until that infrastructure exists, the restart-dependent scenarios should be tested manually at each release.

---

## Test Data Requirements

1. **Months for S-003-01 (22 weekdays, 0 holidays):** March 2026 — confirmed to have exactly 22 weekdays and zero Bavarian public holidays on weekdays (no fixed-date holiday falls in March; Easter 2026 is April 5, so all moveable feasts fall in April or later). Suitable for both unit tests and e2e tests without mocking the holiday list.

2. **Months for S-003-02 (calculation with holidays and absences):** May 2026 is used: 21 weekdays, 2 weekday holidays (May 1 and May 14), 19 non-holiday weekdays. Setting 2 absent days yields (19 − 2) × 8 = 136 hours.

3. **Known Easter dates for multiple years:** 2025: Easter April 20; 2026: Easter April 5; 2030: Easter April 21. Derived holiday dates for 2025 and 2026 are fully enumerated in S-006-05b and S-006-02. Used for S-006-07 and parameterized unit tests.

4. **Months for S-INT-09 (minimal vs. maximal current-month row fill in the fixed 6-row grid):** February 2010 (starts Monday, 28 days, 4 rows of real current-month days, 2 filler rows) and October 2023 (starts Sunday, all 6 rows contain October dates). The grid is always 6 rows; these months represent the extremes of how many rows carry actual current-month content.

5. **Clean userData directory:** A mechanism to launch the application with an isolated, empty userData directory for S-007-03 and S-007-08.

6. **Malformed persistence file fixture:** A pre-authored file containing invalid JSON or schema-violating data, used for S-007-08.

7. **Exact 40% scenario (S-005-03):** March 2026 has 21 weekdays and 0 Bavarian weekday holidays. Set 1 day to absent → 20 effective working days. Set 8 of the remaining 20 to on-site. Calculation: 8/20 × 100 = 40.0% exactly. Used for S-005-03 and S-INT-03.

8. **Holiday weekday coverage across years (S-006-05a, S-006-05b):** Specific year/date combinations are enumerated directly in the scenario Given clauses. No additional research needed beyond what is documented there. For Allerheiligen, 2027 (Monday Nov 1) may be required if both 2025 and 2026 instances fall on weekends.

---

## Dependencies & Preconditions

1. **Electron build environment:** Electron and all Node.js dependencies must be installed; the application must be buildable before any e2e scenarios can run.

2. **E2e test framework:** An Electron-compatible e2e framework (e.g., Playwright with Electron support, or equivalent) is required to automate click interactions, element inspection, and process lifecycle management.

3. **Unit test framework:** A JavaScript/TypeScript unit test runner (e.g., Vitest, Jest) is required for calculation logic tests (REQ-003), holiday computation (REQ-006), and persistence layer tests (REQ-007).

4. **Platform-specific CI agents:** Scenarios S-008-01 through S-008-04 require macOS, Windows, and Linux CI runners respectively.

5. **System clock control:** Scenario S-001-01 requires either freezing the system clock at a known date or parameterizing the expected header value dynamically. A test utility for mocking `Date.now()` or equivalent is needed for repeatability.

6. **Isolated userData directory:** Tests involving persistence (REQ-007) must run with a controlled, isolated userData path to avoid cross-test contamination. Each test run should start from a clean state.

---

## Risks & Considerations

1. **Easter algorithm correctness is high-risk and hard to spot visually.** A one-day error in the Easter computation will silently misplace 5 holidays. The pure calculation function should be unit-tested against a reference table of known Easter dates before any UI tests run against it.

2. **Rounding of percentages (resolved).** Percentages are rounded to one decimal place using standard rounding (round half up) per Assumption 9. S-003-03 asserts 52.6%, S-003-08 asserts 33.3%, and S-004-05 accepts ±0.1% tolerance on the sum. The threshold boundary for REQ-005 at 40.0% is chosen to be an exact representable value (8/20) with no rounding ambiguity. No further clarification is needed unless the implementation team adopts a different rounding rule.

3. **Cross-platform file path differences for userData.** `app.getPath('userData')` resolves differently on macOS (`~/Library/Application Support/<AppName>`), Windows (`%APPDATA%\<AppName>`), and Linux (`~/.config/<AppName>`). The persistence tests (S-007-07, S-INT-08) must account for this.

4. **Partially automatable restart scenarios are regression risks.** Until full Electron e2e infrastructure is in place, scenarios S-007-01, S-007-02, and S-007-04 will only be verified manually. Any refactoring of the persistence layer must be accompanied by a manual regression pass.

5. **Six-row months and layout stability.** The grid is always 6 rows (fixed). What varies is how many of those rows contain actual current-month days vs. filler cells. If the layout uses a fixed-height container sized for fewer rows, filler-row rendering may cause unexpected spacing. This is tested in S-INT-09 using February 2010 (minimal fill, 4 real rows) and October 2023 (maximum fill, 6 real rows).

6. **"Immediately" is environment-dependent.** Synchronous-update assertions in REQ-003 AC4, REQ-004 AC4, and REQ-005 AC3 require that tests not introduce artificial async delays that mask latency. Tests must assert the post-click state in the same logical frame.

7. **Holiday-on-weekend edge case is underspecified.** The requirements do not explicitly define whether a weekend cell should display a holiday marker when a public holiday falls on that day. This should be clarified to prevent inconsistent implementation and flaky visual tests.

8. **No existing tests — high initial investment.** The entire test suite is net-new. The team should prioritize: (1) unit tests for the calculation engine (REQ-003) and holiday algorithm (REQ-006), then (2) e2e happy-path scenarios for status cycling and panel updates, then (3) persistence and cross-platform scenarios.
