# 4. Solution Strategy

## Core Approach

The application follows a **two-process Electron architecture** with a thin main process and a self-contained renderer application. Business logic and UI state live entirely in the renderer; the main process is responsible only for window management and file-system I/O. The two processes communicate exclusively via Electron's IPC mechanism exposed through a `contextBridge`.

Within the renderer, a **layered component architecture** separates concerns:

1. **UI components** (React) — render state, fire events
2. **Domain services** (pure functions) — holiday computation, working-time calculation, status cycling
3. **Persistence IPC client** — calls the main process to load/save data

This separation keeps domain logic testable in isolation from Electron and React, while React's reactive model ensures the UI always reflects the current state without manual DOM manipulation.

## Key Architectural Decisions

| # | Decision | Choice | Rationale |
|---|---------|--------|-----------|
| ADR-001 | Desktop framework | Electron | Mandated by REQ-008; provides full Node.js API access for filesystem persistence |
| ADR-002 | Persistence storage | Local JSON file via Node.js `fs` | Mandated by REQ-007; human-readable, trivial data volume, no external database needed |
| ADR-003 | Persistence model | Sparse (only non-defaults stored) | Mandated by REQ-007; minimises file size; home-office is the implicit default |
| ADR-004 | IPC pattern | `contextBridge` preload | Secure, recommended Electron pattern; eliminates `nodeIntegration` exposure in renderer |
| ADR-005 | UI framework | React | Reactive state management fits the real-time update requirement; component model maps cleanly to calendar cells and overview panel |
| ADR-006 | Logic placement | Business logic in renderer | Keeps calculation and holiday logic co-located with the UI; avoids unnecessary IPC round-trips for pure computation |
| ADR-007 | Holiday computation | Computus algorithm (inline) | No external dependency; Easter-based moveable feasts are derivable from a well-known algorithm |

## How the Strategy Addresses Quality Goals

| Quality Goal | Architectural Response |
|-------------|----------------------|
| **Simplicity** | Two-process Electron model; no server, no network, no login; launch-and-use |
| **Correctness** | Domain services are pure functions, independently testable; Computus algorithm is well-understood |
| **Data safety** | Save triggered on every status change; sparse JSON model removes entries cleanly when reverting to default |
| **Cross-platform reliability** | Electron bundles Chromium; identical rendering on macOS, Windows, Linux |
| **Responsiveness** | All calculation is synchronous and O(n) where n = days in month (≤ 31); React re-renders only affected components |
