# ADR-006: Business Logic in Renderer Process

**Status:** Proposed
**Date:** 2026-04-10

## Context

In an Electron application, computations can run in the main process (Node.js) or the renderer process (Chromium). The business logic in question — working-time calculation, holiday derivation, status cycling — is pure computation with no I/O and no platform-specific requirements. Placing it in the main process would require additional IPC calls for every calculation.

## Decision

Place all **business logic** (holiday service, working-time calculator, status cycler) in the **renderer process** as pure TypeScript modules. The main process handles only window management and file I/O.

## Consequences

**Positive:**
- Eliminates IPC round-trips for every day-click or month-navigation event; all computation is synchronous and local to the React render cycle.
- Pure functions are easy to unit-test without an Electron environment (standard Jest/Vitest suffices).
- Keeps the main process minimal and focused on its responsibilities (window lifecycle, file I/O).
- Simpler mental model: the renderer is the complete application; the main process is a thin host.

**Negative:**
- If computations became CPU-intensive, they could block the renderer thread and cause UI jank. For this application (≤ 31 days per month, 13 holidays per year), this is not a concern.
- Business logic is not accessible from the main process for background tasks (not a requirement for this application).
