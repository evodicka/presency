# 12. Glossary

| Term | Definition |
|------|-----------|
| **absent** | A day status indicating the user plans to be absent from work entirely. Absent days are excluded from both the numerator and denominator of the on-site percentage calculation. |
| **contextBridge** | An Electron API that safely exposes a limited set of functions from the preload script to the renderer process without enabling full Node.js access in the renderer. |
| **Computus** | The algorithm used to compute the date of Easter Sunday for any given year. All moveable Bavarian public holidays are derived as fixed offsets from Easter Sunday. |
| **day status** | One of three values assigned to a working day: `home-office`, `on-site`, or `absent`. Represents the user's planned intent for that day. |
| **dense model** | A persistence model in which every day's status is explicitly stored, regardless of whether it equals the default. Contrast with sparse model. |
| **home-office** | The default day status, indicating the user plans to work from home. Home-office days contribute to the denominator of the on-site percentage but not the numerator. |
| **IPC** | Inter-Process Communication. In Electron, the mechanism by which the main process and renderer process exchange messages and invoke each other's handlers. |
| **main process** | The Node.js process in an Electron application. Responsible for window lifecycle management and file-system I/O. There is exactly one main process per application instance. |
| **MonthStats** | The computed summary object for a given month: `{ totalWorkingDays, onSiteDays, homeOfficeDays, absentDays, onSitePercentage, homeOfficePercentage }`. |
| **moveable feast** | A public holiday whose date varies by year because it is calculated relative to Easter Sunday (e.g., Easter Monday, Ascension Day, Whit Monday, Corpus Christi). |
| **on-site** | A day status indicating the user plans to work from the company's physical office location. On-site days contribute to both the numerator and denominator of the on-site percentage. |
| **on-site percentage** | `onSiteDays / (onSiteDays + homeOfficeDays) × 100`. Absent days are excluded from both numerator and denominator. Returns 0 when the denominator is zero. |
| **planned intent** | All day statuses represent what the user intends to do, not what has been confirmed or occurred. The tool is a planning aid, not an attendance record. |
| **preload script** | A JavaScript file that runs in the renderer context but before web content loads, with access to the Electron API. Used to set up the `contextBridge` and expose a controlled API to the renderer. |
| **renderer process** | The Chromium-based process in an Electron application that renders the UI. Runs JavaScript/TypeScript with web APIs but without direct Node.js access (when `nodeIntegration: false`). |
| **sparse model** | A persistence model in which only days whose status differs from the default (`home-office`) are stored. Absent entries are implicitly `home-office`. See ADR-003. |
| **userData directory** | The OS-specific application data directory returned by Electron's `app.getPath('userData')`. On macOS: `~/Library/Application Support/<AppName>`; Windows: `%APPDATA%\<AppName>`; Linux: `~/.config/<AppName>`. |
| **working day** | A Monday-to-Friday day that is not a Bavarian public holiday. The basis for all working-time calculations. |
| **40% goal** | The company requirement that at least 40% of the user's planned working days (excluding absent days) must be spent on-site. Visualised by the `GoalIndicator` component. |
