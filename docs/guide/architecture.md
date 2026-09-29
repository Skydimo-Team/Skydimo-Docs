---
sidebar_position: 1
---

# Architecture

Skydimo adopts a **Core + UI separation** architecture, where all business logic lives in a standalone native executable, and the UI is a purely presentational frontend.

## Design Principles

1. **Backend Authority** — The Core is the single source of truth for device state, effect capabilities, and all business logic.
2. **Frontend Agnosticism** — The UI is a dynamic renderer that requires minimal changes to support new Core features. Core can run headless (without any UI).
3. **Open/Closed Principle** — New effects, controllers, and extensions can be added through plugin runtimes without modifying core logic.

## Process Model

```
┌─────────────────────────────────┐
│  Core Process (core.exe)        │
│  ├─ Main Thread: event loop     │
│  │   + system tray              │
│  └─ Async Runtime:              │
│     ├─ LightingManager          │
│     ├─ Plugin Manager           │
│     │  (Lua + native-c runtime) │
│     ├─ WebSocket Server         │
│     └─ Control Socket (38967)   │
└──────────┬──────────────────────┘
           │ WebSocket JSON-RPC 2.0
           │ (local-only + events)
┌──────────▼──────────────────────┐
│  UI Process (Desktop / Browser) │
│  └─ React SPA                   │
└─────────────────────────────────┘
```

## Single Instance Control

Core listens on `127.0.0.1:38967` TCP to prevent multiple instances. The
listener uses a shared control token for runtime details and commands. When a
compatible duplicate Core starts, it prints the existing Core's
`CORE_PORT=<port>` and exits; opening the UI is handled by the desktop shell
and tray paths.

## Lifecycle

1. Starting with `3.0.0-dev.3`, Core always binds an automatically assigned local WebSocket port and outputs `CORE_PORT=<port>` to stdout.
2. The desktop UI reads that value and connects via WebSocket on `127.0.0.1`; browser mode must be pointed at the running Core explicitly via `?ws=ws://127.0.0.1:<port>`.
3. When the UI closes, it can either keep Core running (minimize to tray) or shut down both processes.

## Scope Configuration System

Skydimo uses a hierarchical scope system for configuration:

```
Device → Output → Segment
```

Each scope level can have its own:
- **ModeConfig** — effect selection + parameters
- **PowerConfig** — on/off state
- **Brightness** — brightness level
- **Screen/Audio source** — display and audio device selection

Child scopes inherit from parent scopes but can independently override any setting.

## Hardware Discovery

Skydimo supports multiple hardware discovery methods:

- **Serial** — USB serial devices matched by VID/PID
- **HID** — USB HID devices matched by VID/PID
- **mDNS** — Network devices via service discovery

USB hot-plug is automatically handled on all supported platforms (Windows, macOS, Linux).

## Plugin Runtime Dispatch

Plugin metadata is resolved from `manifest.json`, then Core dispatches by `language`:

| Runtime | Status | Purpose |
|---------|--------|---------|
| `lua` | Supported | Sandboxed Lua 5.4 plugins for controllers, effects, and extensions |
| `native-c` | Supported | In-process native shared libraries loaded through the Skydimo C ABI |
| `wasm` | Reserved | Future WebAssembly runtime |
| `abi-stable` | Reserved | Future Rust-oriented ABI experiment |
| `process` | Reserved | Future out-of-process plugin runtime |

Only supported runtimes are registered for a plugin type. Unsupported or reserved runtimes are ignored by the active registries.
