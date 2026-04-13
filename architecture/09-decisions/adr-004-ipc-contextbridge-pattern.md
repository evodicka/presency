# ADR-004: IPC via contextBridge Preload

**Status:** Proposed
**Date:** 2026-04-10

## Context

The renderer process needs to trigger file-system reads and writes, which must be performed in the main process (Node.js). Two Electron patterns exist for this:

1. **`nodeIntegration: true`** — grants the renderer full Node.js access, allowing direct `fs` calls. Simple to implement but deprecated as a security anti-pattern; it exposes the entire Node.js API to renderer code and any content it loads.
2. **`contextBridge` preload script** — the main process registers IPC handlers; a preload script uses `contextBridge.exposeInMainWorld` to expose a narrow, named API to the renderer. `nodeIntegration` stays `false`.

## Decision

Use the **`contextBridge` preload pattern**. The preload script exposes exactly two methods to the renderer: `window.presenceAPI.loadData()` and `window.presenceAPI.saveData(data)`. All file I/O is handled by IPC handlers in the main process.

## Consequences

**Positive:**
- Follows Electron's recommended security model; `nodeIntegration` remains `false`.
- The surface area exposed to the renderer is minimal and explicit — no accidental exposure of Node.js APIs.
- Easier to audit: the preload script is the single definition of what the renderer can do.
- Forward-compatible: Electron's security model evolves toward this pattern.

**Negative:**
- Slightly more boilerplate than `nodeIntegration: true`; requires a preload script and IPC channel definitions.
- IPC is asynchronous (`ipcMain.handle` / `ipcRenderer.invoke`), so the renderer must handle Promises for load/save.

The modest complexity cost is justified by the security benefit and alignment with Electron best practices.
