---
sidebar_position: 1
slug: /intro
---

# Welcome to Skydimo

Skydimo is a cross-platform RGB lighting application. Its standalone Core owns device state, lighting effects, plugins, and persistence; the React UI connects to it over local WebSocket JSON-RPC.

## Choose your path

| I want to… | Start here |
|---|---|
| Install and use the app | [User manual](./user-guide/overview.md) |
| Understand the project and its architecture | [Project knowledge base](./knowledge-base/overview.md) |
| Integrate with the local Core | [WebSocket API](./api/websocket-overview.md) |
| Build a device driver, effect, or extension | [Plugin development](./plugins/overview.md) |

## Architecture at a glance

```text
Core process
├─ Lighting manager and render runners
├─ Lua and native-C plugin runtimes
├─ Device discovery and platform resources
├─ Local WebSocket JSON-RPC server
└─ System tray and single-instance control
               │
               │ JSON-RPC requests + events
               ▼
React UI (Tauri desktop shell or browser)
```

Core is the source of truth. The frontend discovers available devices, effects, parameters, and capabilities from Core instead of hard-coding product-specific behavior.

## Documentation scope

The documentation is maintained alongside the source code. It covers:

- everyday workflows in the desktop and browser UI;
- Advanced and Simple profile differences;
- configuration inheritance and the lighting render pipeline;
- frontend, Core, plugin, and repository architecture;
- JSON-RPC commands, events, data types, and plugin host APIs.

When behavior and documentation disagree, treat the current source code as authoritative and open a documentation update with the corresponding code change.
