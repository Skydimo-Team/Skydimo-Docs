---
sidebar_position: 2
description: Process model, startup sequence, IPC boundaries, profiles, and shutdown behavior.
---

# System Architecture

## Process model

```text
Optional autostart launcher
        │
        ▼
Tauri shell (Advanced or Simple) ── local invoke ── OS integrations
        │
        │ WebSocket JSON-RPC 2.0
        ▼
Core process
├─ main thread: tao event loop + Core tray
└─ core-runtime thread: Tokio multi-thread runtime
   ├─ WebSocket server on 127.0.0.1:<dynamic>
   ├─ control server on 127.0.0.1:38967
   ├─ LightingManager and device discovery
   ├─ plugin catalogs and ExtensionManager
   ├─ media/system-state watchers
   ├─ member authentication and telemetry
   └─ per-device Runner threads
```

Core can run without a UI. Closing the shell does not inherently destroy Core.

## Startup sequence

### Core

1. Parse `--app-id`, `--simple`, and diagnostic flags.
2. Resolve shared configuration and log directories.
3. Attempt an authenticated ping to an existing Core.
4. Acquire the global control listener on `127.0.0.1:38967`.
5. Prepare shared and profile-specific paths.
6. Start the `core-runtime` thread and Tokio runtime.
7. Create the manager, broadcaster, watchers, authentication, and extension
   manager.
8. Bind the WebSocket server to `127.0.0.1:0`.
9. Print `CORE_PORT=<port>`.
10. In the background, initialize plugins, restore linked control, perform
    initial device discovery, and start extensions.
11. Run the tray/event loop on the main thread.

The WebSocket is intentionally available before background initialization
finishes. `get_startup_status` and `startup-status-changed` provide readiness
by subsystem.

If a compatible Core already owns the control socket, a second Core prints the
existing port and exits. It does not itself send `OpenUi`; reopening the UI is
handled by the tray/shell paths.

### Tauri shell

The shell first tries to authenticate and attach to an existing matching Core.
Otherwise it starts the sibling `skydimo-core` executable, parses the announced
port, and verifies that the control socket reports the same port and runtime
profile.

Even a `--ws-port` supplied by Core is verified. This prevents an Advanced
frontend from silently attaching to a Simple Core, or the reverse.

## Three local communication boundaries

| Boundary | Purpose | Scope |
|---|---|---|
| Core control TCP | Single instance, ping, open UI, shutdown | Local-loopback only |
| Core WebSocket (dynamic port) | Device, effect, plugin, configuration RPC and events | Local-loopback only |
| Tauri invoke | Window, autostart, local presets, feedback, extension-page hosting | In-process shell boundary |

The frontend performs `get_runtime_profile` as its first WebSocket RPC before
exposing the connection to the app. That is a compatibility check, not
WebSocket authentication.

## JSON-RPC behavior

Requests and responses use JSON-RPC-like envelopes:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "get_devices",
  "params": {}
}
```

Current dispatcher details:

- parse error: `-32700`;
- missing method: `-32600`;
- unknown methods and most business failures: `-1`;
- `jsonrpc` is not strictly validated;
- a request without `id` still receives a response with `id: null`.

Events use:

```json
{
  "jsonrpc": "2.0",
  "method": "event",
  "params": {
    "event": "devices-changed",
    "data": []
  }
}
```

Event delivery is bounded. Slow clients can lose old broadcast messages and
must re-query snapshots; events are invalidation signals, not a durable log.

## Runtime profiles and paths

Core creates a shared root and two mutable profile roots:

```text
<config-root>/
├─ app.json
├─ control.token
├─ authentication / telemetry state
└─ profiles/
   ├─ profile-split-v1.json
   ├─ advanced/
   └─ simple/
```

The one-time profile migration copies legacy state without deleting or moving
the legacy entries, verifies fingerprints, and publishes a marker only after
the profile structure is durable.

## Core modules

| Module | Responsibility |
|---|---|
| `interface/` | Controller/effect contracts and hardware-facing shared types |
| `manager/` | Devices, Scope state, persistence, discovery, runners, locks, previews |
| `plugin/` | Catalog, import/admin operations, Lua and native-C runtimes |
| `resource/` | Screen, audio, media, system state, discovery, built-in resources |
| `server/` | WebSocket server, dispatcher, plugin RPC, event broadcaster |
| `runtime/` | Core control socket and UI launcher |
| `shortcut/` | Global shortcut state and execution |
| `telemetry/` | Consent, diagnostics, buffering, upload, and exception reports |
| `tray/` | Core-owned tray and tao event loop |
| `api/` | Shared serialized DTOs used by the public surface |

The desired dependency boundaries still hold at the framework level: Core has
no Tauri dependency; `interface` does not depend on manager/server/plugin; and
`resource` does not depend on server. The internal module graph is otherwise
more connected than older simplified diagrams suggest.

## Shutdown

Core shutdown can come from Ctrl+C, the authenticated control socket, or the
tray. Core requests any running UI instance to exit, flushes telemetry,
stops extensions and their resources, aborts the control task, and lets manager
drop stop device runners.

For **Close to tray**, the Tauri UI exits while Core remains. For **Exit
application**, the shell requests Core shutdown and only falls back to
terminating a child it owns when graceful shutdown fails.

