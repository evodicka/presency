# ADR-005: React as UI Framework

**Status:** Proposed
**Date:** 2026-04-10

## Context

The renderer UI requires reactive updates: every day-cell click must immediately repaint that cell and recalculate the entire overview panel. Options considered:

1. **Vanilla JavaScript with direct DOM manipulation** — no build dependency; maximum control; but requires manual DOM diffing and event wiring that becomes error-prone as component count grows.
2. **React** — declarative, component-based; state changes automatically propagate to dependent components; excellent ecosystem.
3. **Vue** — similar reactive model to React; smaller bundle; less common in Electron examples.
4. **Svelte** — compile-time reactivity; minimal runtime; less mature Electron tooling.

## Decision

Use **React** as the UI framework for the renderer process.

## Consequences

**Positive:**
- Declarative component model maps naturally to the calendar grid (each `DayCell` is a self-contained component with status-derived styling).
- React's re-render model ensures the overview panel updates automatically when `App` state changes, without manual event subscriptions.
- Strong TypeScript support.
- Mature Electron + React integration (Electron Forge, Vite + electron-vite, etc.).
- Widely known; lowers the barrier for future contributors.

**Negative:**
- Adds a build step and a runtime dependency (~40 KB gzipped) that vanilla JS would not require.
- Slightly heavier than Svelte or Vue for a simple application.

For an application of this complexity, React's productivity benefits outweigh the marginal overhead.
