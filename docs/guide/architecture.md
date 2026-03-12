---
sidebar_position: 1
---

# Architecture

Skydimo adopts a **Core + UI separation** architecture, where all business logic lives in a standalone Rust executable, and the UI is a purely presentational React frontend.

## Design Principles

1. **Backend Authority** — The Rust Core is the single source of truth for device state, effect capabilities, and all business logic.
2. **Frontend Agnosticism** — The UI is a dynamic renderer that requires minimal changes to support new Core features. Core can run headless (without any UI).
3. **Open/Closed Principle** — New effects, controllers, and extensions can be added via Lua plugins without modifying core logic.

## Process Model

```
┌─────────────────────────────────┐
│  Core Process (core.exe)        │
│  ├─ Main Thread: tao event      │
│  │   loop + system tray         │
│  └─ Tokio Runtime:              │
│     ├─ LightingManager          │
│     ├─ Lua Plugin Manager       │
│     ├─ WebSocket Server         │
│     └─ Control Socket (38967)   │
└──────────┬──────────────────────┘
           │ WebSocket JSON-RPC 2.0
           │ (auth + events)
┌──────────▼──────────────────────┐
│  UI Process (Tauri / Browser)   │
│  ├─ React SPA                   │
│  └─ Tauri Shell (optional)      │
└─────────────────────────────────┘
```

## Single Instance Control

Core listens on `127.0.0.1:38967` TCP to prevent multiple instances. If a new instance starts, it sends an `OpenUi` command to the existing one, which brings the UI window to the foreground.

## Lifecycle

1. Core starts and outputs `CORE_PORT=<port>` and `CORE_AUTH=<secret>` to stdout.
2. The UI process reads these values and connects via WebSocket.
3. When the UI closes, it can either keep Core running (minimize to tray) or shut down both processes.

## Core Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| `interface` | `core/src/interface/` | Core trait definitions (Controller, Effect) and shared data types |
| `plugin` | `core/src/plugin/` | Lua plugin loading, lifecycle, Host API |
| `resource` | `core/src/resource/` | Built-in implementations + platform resources (audio, screen, USB, serial) |
| `manager` | `core/src/manager/` | Central coordinator — device management, runner, config, scheduling |
| `api` | `core/src/api/` | DTO definitions (serialization protocol) |
| `server` | `core/src/server/` | WebSocket JSON-RPC 2.0 server + event broadcasting |
| `runtime` | `core/src/runtime/` | Single-instance socket + UI launcher |
| `tray` | `core/src/tray/` | System tray (tao + tray-icon) |

## Dependency Direction

```
resource/ → interface/
plugin/  → interface/
manager/ → interface/ + resource/ + plugin/
api/     → (DTO only)
server/  → manager/ + api/
runtime/ → server/ + manager/
tray/    → runtime/
```

**Forbidden**: `interface/` must never depend on `manager/`, `server/`, or `plugin/`.

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

Platform-specific USB hot-plug detection:
- **Windows**: `WM_DEVICECHANGE` messages
- **macOS**: IOKit notifications
- **Linux**: Netlink socket
