# ADR-008: electron-vite as Build Toolchain

**Status:** Proposed
**Date:** 2026-04-10

## Context

The project requires a build toolchain to bundle TypeScript source (main process, renderer/React, and preload script) into a deployable Electron application. The three candidate approaches evaluated were:

- **Webpack + Electron Forge** — the traditional Electron packaging setup; mature but verbose configuration; slow cold builds; no native Vite DX.
- **Vite (standalone)** — excellent developer experience for renderer code, but does not natively handle Electron's multi-entry-point build (main / renderer / preload are compiled separately with different module formats and targets).
- **electron-vite** — a Vite-based build tool designed specifically for Electron; handles main/renderer/preload compilation in a single configuration with correct targets for each.

## Decision

Use **electron-vite** as the build toolchain.

## Rationale

| Criterion | Webpack / Electron Forge | electron-vite |
|-----------|--------------------------|---------------|
| Renderer DX (HMR) | Limited; requires plugin config | Native Vite HMR out of the box |
| Main / preload compilation | Separate config or plugin | First-class: separate compilation with correct Node.js / ESM targets per entry |
| TypeScript support | Via ts-loader or babel-loader | Native via esbuild |
| Configuration overhead | High | Low (single `electron.vite.config.ts`) |
| Build speed | Slow (Webpack bundling) | Fast (esbuild + Rollup) |
| Ecosystem compatibility | Mature | Actively maintained; aligned with Vite ecosystem |

The key advantage of electron-vite over standalone Vite is that it correctly separates compilation of the main process (CommonJS, Node.js APIs), the preload script (CommonJS, limited Node APIs), and the renderer (ESM, browser APIs + React). This prevents target mismatches that cause runtime failures in Electron.

Over Electron Forge + Webpack, electron-vite provides substantially faster build and hot-reload cycles, which improves developer productivity without sacrificing correctness.

## Consequences

- `npm run dev` starts electron-vite in watch mode with HMR for the renderer.
- `npm run build` compiles all three entry points and produces the bundled output for electron-builder to package.
- `electron.vite.config.ts` is the single source of build configuration.
- The `package.json` `main` field must point to the electron-vite output directory (e.g., `out/main/index.js`).
