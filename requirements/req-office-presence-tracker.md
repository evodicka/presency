# Office Presence Tracker -- Requirements Document

*Note: This tool is a planning tool. All day statuses (home-office, on-site, absent) represent planned intent, not confirmed actuals. Calculations and indicators reflect the user's plan for the month, not a record of what has occurred.*

|| Suggested Build Order || ID || Title || Type || Priority || Notes ||
| 1 | REQ-008 | Electron Desktop Application | Story | Must | Decided: Electron with file-based JSON persistence |
| 2 | REQ-007 | Data Persistence | Story | Must | Resolved: local JSON file via Electron fs API |
| 3 | REQ-006 | Bavarian Public Holiday Support | Story | Must | |
| 4 | REQ-001 | Calendar View with Month Navigation | Story | Must | |
| 5 | REQ-002 | Day Status Management | Story | Must | |
| 6 | REQ-003 | Working Time Calculation | Story | Must | |
| 7 | REQ-004 | Monthly Overview Panel | Story | Must | |
| 8 | REQ-005 | 40% Office Presence Goal Indicator | Story | Must | |
| 9 | REQ-009 | Fresh and Intuitive UI Design | Story | Should | |

---

h2. [REQ-001] Calendar View with Month Navigation

*Type:* Story
*Priority:* Must
*Labels:* ui, calendar, navigation

h3. Description
As a user, I want to see a calendar grid for a given month so that I can view and plan my office presence for that month.

The calendar displays a standard Monday-to-Sunday grid layout showing all days of the selected month. The user can navigate forward and backward between months without restriction. The current month is shown by default on application start. Days from the previous or next month that fall within the displayed weeks should be shown in a muted/disabled style to provide visual context.

h3. Acceptance Criteria
* *AC1:* Given the application is opened, when the calendar loads, then it displays the current month and year as a header (e.g., "April 2026").
* *AC2:* Given the calendar is showing any month, when the user clicks the forward navigation control, then the calendar advances to the next month.
* *AC3:* Given the calendar is showing any month, when the user clicks the backward navigation control, then the calendar moves to the previous month.
* *AC4:* Given any month is displayed, then the calendar renders a Monday-to-Sunday grid with abbreviated day-of-week headers (Mon, Tue, Wed, Thu, Fri, Sat, Sun).
* *AC5:* Given the calendar is displayed, then weekend days (Saturday, Sunday) are visually distinct from weekdays (e.g., greyed out or muted) and are not interactive for status changes.
* *AC6:* Given the calendar is displayed, then days belonging to adjacent months that appear in the first or last week row are shown in a muted/disabled style and are not interactive.

h3. Assumptions
* The calendar follows the ISO 8601 convention: weeks start on Monday.
* Month navigation is unrestricted -- the user can navigate arbitrarily far into the past or future. This is a deliberate scope decision to keep the application simple and avoid artificial limits.

h3. Dependencies
* None

h3. Notes
* The mockup shows a clean card-based calendar with left/right arrows flanking the month/year header.

---

h2. [REQ-002] Day Status Management

*Type:* Story
*Priority:* Must
*Labels:* ui, calendar, status

h3. Description
As a user, I want to set the planned status of each working day so that I can plan where I intend to work.

Each working day (Monday to Friday, excluding public holidays) can be assigned one of three statuses: *home-office* (default), *on-site*, or *absent*. All statuses represent planned intent, not confirmed actuals. The status is indicated by a distinct background color on the calendar day cell. Clicking a day cycles through the statuses.

h3. Click-to-Cycle Order Rationale
The cycle order is: home-office -> on-site -> absent -> home-office. The rationale is that home-office is the default state, and the most common action is to mark a day as on-site (the first click from the default). The second click marks absent, the least common action. This ordering minimizes clicks for the most frequent use case: planning on-site days.

h3. Acceptance Criteria
* *AC1:* Given a working day with no prior status set, then it is displayed with the "home-office" status and its corresponding color.
* *AC2:* Given a working day, when the user clicks on it, then the status changes to the next status in the cycle: home-office -> on-site -> absent -> home-office.
* *AC3:* Given a day has a status, then the day cell is colored according to its status: home-office (default/light), on-site (blue/highlighted), absent (distinct third color).
* *AC4:* Given a weekend day or public holiday, when the user attempts to click it, then no status change occurs.
* *AC5:* Given the calendar view, then a legend is displayed showing the color mapping for each status (home-office, on-site, absent).

h3. Assumptions
* Three statuses are sufficient; no additional statuses (e.g., "travel", "half-day") are required.
* Clicking is the primary interaction; no drag-select or bulk-edit is required.

h3. Dependencies
* REQ-001 (calendar view must exist)
* REQ-006 (public holidays must be identified to prevent status assignment)

h3. Notes
* The mockup shows a legend row above the calendar with colored indicators for each status.

---

h2. [REQ-003] Working Time Calculation

*Type:* Story
*Priority:* Must
*Labels:* calculation, business-logic

h3. Description
As a user, I want the system to correctly calculate total planned working time and the breakdown by status so that I can understand my planned office presence ratio.

The system calculates working time based on the following rules:
* Each working day (Monday-Friday) counts as 8 hours.
* Weekends are excluded from total working time.
* Bavarian public holidays are excluded from total working time.
* Days marked as "absent" are excluded from both the numerator and the denominator of the on-site percentage calculation (i.e., absent days reduce the total working time base).
* Only "home-office" and "on-site" days contribute to total working time.
* The on-site percentage is calculated as: (on-site days) / (on-site days + home-office days) * 100.

h3. Acceptance Criteria
* *AC1:* Given a month with 22 weekdays, 0 public holidays, and 0 absences, then the total working time is 22 * 8 = 176 hours.
* *AC2:* Given a month with 22 weekdays, 1 public holiday, and 2 absences, then the total working time is (22 - 1 - 2) * 8 = 152 hours.
* *AC3:* Given 10 on-site days and 9 home-office days (19 total working days), then the on-site percentage is 10/19 * 100 = 52.6%.
* *AC4:* Given a day's status changes from home-office to absent, then the total working time decreases by 8 hours and the on-site percentage recalculates immediately.
* *AC5:* Given all working days are marked as absent, then the total working time is 0 and the on-site percentage displays as 0% (no division-by-zero error).
* *AC6:* Given 5 on-site days, 10 home-office days, and 4 absent days in a month with 19 non-holiday weekdays, then the on-site percentage denominator is 15 (5 + 10), not 19, and the on-site percentage is 5/15 * 100 = 33.3%.

h3. Assumptions
* All working days are exactly 8 hours; part-time or variable schedules are out of scope.
* "Absent" means the full day is absent (no half-day absences).
* All statuses represent planned intent, not confirmed actuals.

h3. Dependencies
* REQ-002 (day statuses must be set)
* REQ-006 (public holidays must be known)

h3. Notes
* The calculation updates in real time as the user changes day statuses.

---

h2. [REQ-004] Monthly Overview Panel

*Type:* Story
*Priority:* Must
*Labels:* ui, overview, statistics

h3. Description
As a user, I want to see a summary panel next to the calendar showing key statistics for the selected month so that I can quickly understand my planned presence distribution.

The overview panel displays:
* On-site presence percentage
* Home-office percentage
* Number of on-site days
* Number of home-office days
* Number of absent days
* Total working days in the month

h3. Acceptance Criteria
* *AC1:* Given the calendar is displayed for a month, then a "Monthly Overview" panel is shown alongside (to the right of) the calendar.
* *AC2:* Given the overview panel is displayed, then it shows the on-site percentage and home-office percentage, each clearly labeled.
* *AC3:* Given the overview panel is displayed, then it shows the count of on-site days, home-office days, and absent days.
* *AC4:* Given a user changes a day's status, then all values in the overview panel update immediately without requiring a page reload or manual refresh.
* *AC5:* Given the overview panel is displayed, then the on-site percentage and home-office percentage are shown as separate values that together account for all non-absent working days (i.e., they sum to 100% because absent days are excluded from the working time base per REQ-003).

h3. Assumptions
* The panel is always visible alongside the calendar (not in a separate tab or modal).

h3. Dependencies
* REQ-001 (calendar view)
* REQ-003 (working time calculation)

h3. Notes
* The mockup shows the overview as a card to the right of the calendar, with percentages displayed prominently and day counts listed below.

---

h2. [REQ-005] 40% Office Presence Goal Indicator

*Type:* Story
*Priority:* Must
*Labels:* ui, goal, indicator

h3. Description
As a user, I want a visual indicator that shows whether my planned on-site presence meets the 40% goal so that I can quickly see if my planning meets the requirement.

All day statuses represent planned intent, not confirmed actuals. The 40% indicator therefore reflects whether the user's current plan for the month meets the goal, not whether the goal has been achieved in practice. This is true regardless of whether the month is in the past, present, or future.

When the calculated on-site percentage meets or exceeds 40%, the indicator turns green. When below 40%, it is shown in a warning/urgency color (e.g., orange or red) to draw the user's attention to the shortfall.

h3. Acceptance Criteria
* *AC1:* Given the on-site percentage is 40% or above, then the on-site percentage value and/or its surrounding indicator is displayed in green.
* *AC2:* Given the on-site percentage is below 40%, then the on-site percentage value and/or its surrounding indicator is displayed in a warning/urgency color (e.g., orange or red) to signal that the goal is not met.
* *AC3:* Given a user changes a day status causing the on-site percentage to cross the 40% threshold (in either direction), then the indicator color updates immediately.
* *AC4:* The indicator reflects the user's planned intent for the entire month, not a partial or confirmed-only view. Mid-month, the indicator evaluates all planned statuses for the full month.

h3. Assumptions
* The 40% threshold is fixed and not user-configurable.
* The indicator is part of the monthly overview panel, not a separate component.
* The indicator always evaluates the full month plan, including future days that still have their default (home-office) status.

h3. Dependencies
* REQ-003 (working time calculation)
* REQ-004 (monthly overview panel)

h3. Notes
* Consider also showing a progress bar or similar visual element to make the distance to the goal intuitive.

---

h2. [REQ-006] Bavarian Public Holiday Support

*Type:* Story
*Priority:* Must
*Labels:* business-logic, holidays, germany

h3. Description
As a user, I want Bavarian (Germany/Bavaria) public holidays to be automatically recognized so that they are excluded from working time calculations and cannot be assigned a work status.

The system must contain or derive the official public holidays for the German state of Bavaria for any displayed year. Public holidays should be visually distinct on the calendar.

h3. Acceptance Criteria
* *AC1:* Given a month containing a Bavarian public holiday that falls on a weekday, then that day is visually marked as a holiday on the calendar (e.g., distinct color or icon).
* *AC2:* Given a Bavarian public holiday, when the user attempts to click it, then no status change occurs.
* *AC3:* Given a Bavarian public holiday on a weekday, then it is excluded from the total working time calculation.
* *AC4:* The system correctly identifies all official Bavarian public holidays, including those with variable dates (e.g., Easter Monday, Ascension Day, Whit Monday, Corpus Christi). The following holidays must be supported:
** Neujahrstag (New Year's Day) -- January 1
** Heilige Drei Konige (Epiphany) -- January 6
** Karfreitag (Good Friday) -- variable
** Ostermontag (Easter Monday) -- variable
** Tag der Arbeit (Labour Day) -- May 1
** Christi Himmelfahrt (Ascension Day) -- variable
** Pfingstmontag (Whit Monday) -- variable
** Fronleichnam (Corpus Christi) -- variable
** Maria Himmelfahrt (Assumption Day) -- August 15
** Tag der Deutschen Einheit (German Unity Day) -- October 3
** Allerheiligen (All Saints' Day) -- November 1
** 1. Weihnachtstag (Christmas Day) -- December 25
** 2. Weihnachtstag (St. Stephen's Day) -- December 26
* *AC5:* Given the user navigates to any year, then public holidays for that year are correctly computed (including moveable feasts based on Easter).

h3. Assumptions
* Only Bavarian public holidays are required; no support for other German states or countries.
* Maria Himmelfahrt (August 15) is included as it is a public holiday in predominantly Catholic communities in Bavaria, which covers the majority of Bavarian municipalities.

h3. Dependencies
* None

h3. Notes
* Easter date computation can use the Computus algorithm or a library. Variable holidays are typically offset from Easter Sunday.

---

h2. [REQ-007] Data Persistence

*Type:* Story
*Priority:* Must
*Labels:* persistence, storage, data, electron

h3. Description
As a user, I want my planned day status entries to be saved automatically so that my planning data is retained when I close and reopen the application.

The application persists all user-entered day statuses to a local JSON file on the filesystem using Electron's Node.js `fs` module. The storage location is the OS-appropriate user data directory, obtained via `app.getPath('userData')`. On application start, previously saved data is loaded from this file and displayed.

h3. Persistence Model
The application uses a *sparse persistence model*: only days whose status differs from the default (home-office) are stored. Days with no persisted entry are treated as home-office on load. When a day is set back to home-office, its entry is removed from storage. This minimizes storage footprint and simplifies data management.

h3. Acceptance Criteria
* *AC1:* Given the user sets a day status and closes the application, when the application is reopened, then the previously set status is displayed correctly.
* *AC2:* Given the user has data for multiple months, then all months' data is persisted and retrievable by navigating to the respective month.
* *AC3:* Given the application is opened for the first time (no prior data), then all working days default to "home-office" status and no data file exists yet (or the file is empty/contains an empty structure).
* *AC4:* Given a user changes a day's status, then the change is persisted automatically to the JSON file without requiring an explicit "save" action.
* *AC5:* Given a day is set to on-site or absent, then that day's status is stored. Given a day is set back to home-office, then its entry is removed from storage (sparse model).

h3. Assumptions
* Persistence uses a local JSON file written via Electron's `fs` module to the path returned by `app.getPath('userData')`.
* No cloud sync or multi-device sharing is required.
* No import/export functionality is required.
* Sparse persistence: only days differing from the home-office default are stored.
* Since the application runs as an Electron app, there are no browser `localStorage` or `file://` URL concerns.

h3. Dependencies
* REQ-002 (day status management)
* REQ-008 (Electron desktop application provides the Node.js runtime and fs API)

h3. Notes
* The JSON file should use a human-readable structure (e.g., keyed by "YYYY-MM-DD") to aid debugging and potential future import/export.
* Assumption: atomic writes (write to temp file, then rename) are not required for v1, but may be considered if data corruption becomes a concern.

---

h2. [REQ-008] Electron Desktop Application

*Type:* Story
*Priority:* Must
*Labels:* architecture, platform, deployment, electron

h3. Description
As a user, I want to run the application as a native desktop application on macOS, Windows, or Linux without needing a server, so that the tool is simple to use and does not depend on network connectivity.

The application is built using Electron, which bundles Chromium and Node.js into a self-contained desktop application. It is distributed as a native binary: `.app` on macOS, `.exe` on Windows, and AppImage on Linux. Because Electron bundles its own Chromium, there is no browser compatibility concern -- the rendering engine is fixed and controlled by the application.

h3. Acceptance Criteria
* *AC1:* Given a user on macOS, when they launch the `.app` bundle, then the application runs without requiring an external server or internet connection.
* *AC2:* Given a user on Windows, when they launch the `.exe`, then the application runs without requiring an external server or internet connection.
* *AC3:* Given a user on Linux, when they launch the AppImage, then the application runs without requiring an external server or internet connection.
* *AC4:* Given the application is distributed, then the user can launch it by double-clicking the native binary. No multi-step installation process is required.
* *AC5:* Given the application is running, then no backend server process is required beyond the bundled Electron runtime (all logic runs within the Electron process).
* *AC6:* Given the application is built, then a build step (e.g., `npm run build` or `electron-builder`) produces platform-specific binaries for macOS, Windows, and Linux.

h3. Assumptions
* Electron is the chosen framework; alternatives (Tauri, plain HTML file, etc.) are out of scope.
* The bundled Chromium eliminates browser compatibility concerns.
* A build step is required; the user runs the packaged binary, not raw source files.
* The Electron version should be kept reasonably current to receive security patches for the bundled Chromium.

h3. Dependencies
* None

h3. Notes
* Electron adds significant binary size (typically 100-200 MB) due to the bundled Chromium. This is an accepted trade-off for reliable cross-platform behavior and full Node.js API access (especially filesystem access for REQ-007).
* Consider using `electron-builder` or `electron-forge` for packaging and distribution.

---

h2. [REQ-009] Fresh and Intuitive UI Design

*Type:* Story
*Priority:* Should
*Labels:* ui, design, ux

h3. Description
As a user, I want the application to have a visually appealing and intuitive user interface so that planning my office presence is a pleasant experience.

The UI should follow the general layout shown in the mockup: a calendar card on the left, a monthly overview card on the right, with a clean color palette, rounded corners, subtle shadows, and clear typography. The design should feel lightweight and fresh.

h3. Acceptance Criteria
* *AC1:* Given the application is opened, then the layout matches the general structure of the mockup: calendar on the left, overview panel on the right, application title at the top.
* *AC2:* Given the application is displayed, then a status legend (home-office, on-site, absent with their respective colors) is shown near or above the calendar.
* *AC3:* Given the application is displayed on a standard desktop screen (1280x800 resolution or greater), then all interactive elements (navigation controls, day cells, legend, overview panel) are reachable without scrolling.
* *AC4:* Given the application is displayed on a standard desktop screen (1280px width or greater), then the calendar and overview panel are shown side by side without horizontal scrolling.

h3. Assumptions
* Mobile/responsive design is not required, but the layout should not break on reasonable desktop resolutions.
* The exact colors and styling can deviate from the mockup as long as the general look-and-feel is visually appealing and consistent.
* Since the application runs in Electron's bundled Chromium, there are no cross-browser rendering concerns.

h3. Dependencies
* REQ-001 (calendar view)
* REQ-004 (monthly overview panel)

h3. Notes
* The mockup reference image is located at ideas/screen_example.png.
