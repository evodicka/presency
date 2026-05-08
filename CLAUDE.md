# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # install dependencies
npm run dev              # run in development mode (Electron + HMR)
npm run build            # compile via electron-vite into out/
npm run test             # run unit tests once (vitest run) — enforces 90% coverage gate
npm run test:watch       # run unit tests in watch mode
npm run test:integration # run renderer integration tests — enforces 80% coverage gate
npx electron-builder     # package for current platform (requires build first)
```

Run a single test file:
```bash
npx vitest run src/path/to/__tests__/foo.test.ts
```

### Test layout

There are two test suites, each with its own vitest config:

| Suite | Location pattern | Config | Coverage gate |
|-------|-----------------|--------|--------------|
| Unit | `src/**/__tests__/**/*.test.{ts,tsx}` | `vitest.config.ts` | 90% |
| Integration | `src/**/__integration__/**/*.test.tsx` | `vitest.integration.config.ts` | 80% |

**Unit tests** cover pure service functions (`HolidayService`, `WorkingTimeCalculator`, `StatusCycler`), persistence I/O, and the `GoalIndicator` component. They run in the Node environment except for `.tsx` files which declare `// @vitest-environment jsdom` at the top.

**Integration tests** render the full `App` component in jsdom via React Testing Library with a mocked `window.presenceAPI`. They verify data-loading validation, the sparse persistence model, status cycling, and year-boundary month navigation. The config is `vitest.integration.config.ts`.

## Architecture

This is an **Electron + React + TypeScript** desktop app using `electron-vite` as the build toolchain.

### Process boundary

The app has two processes separated by Electron's IPC boundary:

- **Main process** (`src/main/`) — window management (`AppWindow`) and file I/O (`PersistenceHandler`). No business logic lives here. IPC channels: `load-data` and `save-data`.
- **Preload** (`src/preload/`) — exposes `window.presenceAPI.{loadData, saveData}` via `contextBridge`. The renderer TypeScript declaration for this lives at `src/renderer/preload.d.ts`.
- **Renderer** (`src/renderer/src/`) — the complete React application. All business logic lives here as pure functions.

### Renderer structure

- `App.tsx` — root component, owns **all** application state (`currentMonth`, `dayStatuses`, `holidays`). Orchestrates persistence on every status change.
- `components/` — stateless/controlled UI components: `CalendarView`, `MonthNavigator`, `DayCell`, `StatusLegend`, `MonthlyOverviewPanel`, `GoalIndicator`.
- `services/` — pure function modules: `HolidayService`, `WorkingTimeCalculator`, `StatusCycler`.
- `types.ts` — shared type definitions including `DayStatus = 'home-office' | 'on-site' | 'absent'`.

### Key design rules

- **Sparse persistence model** (ADR-003): only `'on-site'` and `'absent'` entries are written to `presence-data.json`. `'home-office'` is the implicit default (absence of a key). When a day reverts to `home-office`, its key is deleted from `dayStatuses` before saving.
- **`DayCell` is fully controlled** — it emits `onStatusChange(date)` up to `App`; `App.onStatusChange` calls `StatusCycler.nextStatus` and updates state. `DayCell` never calls domain services.
- **No state management library** — plain `useState` and prop drilling. State flows down as props; events flow up as callbacks.
- **Renderer alias** — `@` maps to `src/renderer/src` (configured in `electron.vite.config.ts`).

### Persistence

Data is stored at `app.getPath('userData')/presence-data.json`. The pure I/O functions (`loadData`, `saveData`) in `src/main/persistence.ts` accept a file path parameter so they can be unit-tested without mocking Electron APIs.

### Holiday computation

`HolidayService.getBavarianHolidays(year)` computes all 13 Bavarian public holidays algorithmically. Moveable feasts are offsets from Easter Sunday computed by the Computus algorithm (`computeEaster` is exported for direct unit testing). Month and year are 1-indexed throughout (`month: 1–12`).

## Architecture documentation

Full arc42 documentation is in `architecture/`. ADRs are in `architecture/09-decisions/`.
