# Office Presence Tracker

A desktop application for planning your office and home-office days. Track your planned presence across months, see working time statistics at a glance, and ensure you meet the 40% on-site presence goal.

Built with Electron, React, and TypeScript.

## Features

- **Monthly calendar view** with Monday-to-Sunday grid and unrestricted month navigation
- **Day status management** — click to cycle through home-office, on-site, and absent
- **Bavarian public holiday support** — all 13 holidays automatically computed for any year (including Easter-based moveable feasts)
- **Working time calculation** — real-time statistics with correct handling of absences and holidays
- **40% on-site goal indicator** — green when met, orange when below threshold
- **Automatic persistence** — planned statuses saved to a local JSON file on every change

## Screenshot

See [ideas/screen_example.png](ideas/screen_example.png) for the UI mockup the application follows.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This launches the Electron app with hot module replacement for the renderer.

### Run Tests

The project has two separate test suites with enforced coverage gates:

**Unit tests** — services, persistence, and UI component logic. Requires ≥ 90% coverage on the measured files.

```bash
npm test
```

**Renderer integration tests** — renders the full `App` component in a jsdom environment (via React Testing Library) with a mocked `presenceAPI`. Covers end-to-end data flows: load + validation, status cycling (sparse persistence model), and month navigation. Requires ≥ 80% coverage on the renderer source.

```bash
npm run test:integration
```

Test files live under `src/**/__tests__/` (unit) and `src/**/__integration__/` (integration). Both suites use [vitest](https://vitest.dev/); each has its own config (`vitest.config.ts` and `vitest.integration.config.ts`).

To run with a coverage report:

```bash
npm test -- --coverage
npm run test:integration -- --coverage
```

### Build for Production

```bash
npm run build
```

This compiles the application via electron-vite into the `out/` directory.

### Package Platform-Specific Binaries

After building, use electron-builder to produce distributable binaries:

```bash
# Package for the current platform
npx electron-builder

# Package for a specific platform
npx electron-builder --mac          # macOS → .dmg containing .app bundle
npx electron-builder --win          # Windows → .exe installer (NSIS)
npx electron-builder --linux        # Linux → AppImage
```

Output binaries are placed in the `dist/` directory. The configuration in `package.json` under the `"build"` key controls the app ID, product name, and platform-specific targets.

> **Note:** Cross-compilation has limitations. Building a `.dmg` requires macOS, and building an `.exe` works best on Windows. For full cross-platform builds, use CI with platform-specific runners.

## Architecture

The project follows an arc42 documentation structure. All architecture documents are in the [`architecture/`](architecture/) directory:

| Document | Description |
|----------|-------------|
| [01 — Introduction & Goals](architecture/01-introduction-goals.md) | Business context and quality goals |
| [02 — Constraints](architecture/02-constraints.md) | Technical, organisational, and scope constraints |
| [03 — Context & Scope](architecture/03-context-scope.md) | System boundary and external interfaces |
| [04 — Solution Strategy](architecture/04-solution-strategy.md) | Core architectural approach and key decisions |
| [05 — Building Block View](architecture/05-building-block-view.md) | Component decomposition and data model |
| [06 — Runtime View](architecture/06-runtime-view.md) | Key interaction scenarios (startup, status change, navigation) |
| [07 — Deployment View](architecture/07-deployment-view.md) | Build pipeline, distribution targets, data location |
| [08 — Crosscutting Concepts](architecture/08-crosscutting-concepts.md) | State management, persistence, error handling, testing |
| [09 — Architecture Decisions](architecture/09-decisions/) | Individual ADRs (Electron, JSON persistence, React, etc.) |
| [10 — Quality Requirements](architecture/10-quality-requirements.md) | Quality scenarios and acceptance criteria |
| [11 — Risks & Technical Debt](architecture/11-risks-technical-debt.md) | Known risks and planned mitigations |
| [12 — Glossary](architecture/12-glossary.md) | Domain terms |

## Project Structure

```
src/
  main/             Electron main process (window management, file I/O)
  preload/          contextBridge preload script (IPC API)
  renderer/
    src/
      components/   React UI components (CalendarView, DayCell, MonthlyOverviewPanel, ...)
      services/     Domain logic (HolidayService, WorkingTimeCalculator, StatusCycler)
      types.ts      Shared type definitions
      App.tsx        Root component with state management
```

## Data Storage

Day statuses are persisted as a local JSON file at the OS user-data directory (`app.getPath('userData')/presence-data.json`). Only non-default statuses are stored (sparse model — home-office is the implicit default).

## Requirements

The full requirements specification is in [`requirements/req-office-presence-tracker.md`](requirements/req-office-presence-tracker.md).
