---
sidebar_position: 1
description: Code-backed orientation to the Skydimo architecture, terminology, and documentation set.
---

# Project Knowledge Base

This knowledge base explains the current Skydimo implementation for
maintainers, integrators, support engineers, and plugin authors. It is derived
from the working source tree rather than only from historical design notes.

## What Skydimo is

Skydimo is a cross-platform RGB lighting system with:

- a standalone Rust Core that owns device state and rendering;
- Advanced and Simple React user interfaces;
- optional Tauri desktop shells;
- a localhost WebSocket JSON-RPC API;
- Lua and native-C plugin runtimes; and
- separate runtime profiles that protect Advanced and Simple configuration.

The central rule is **backend authority**: the Core process is the source of
truth for devices, effective Scope state, rendering, plugin runtime state, and
business operations. Frontends query that state and render it.

## Evidence hierarchy

When two descriptions disagree, use this order:

1. Runtime behavior and tests
2. Rust/TypeScript/Lua implementation
3. Serialized DTO definitions and manifests
4. This documentation
5. Historical plans, roadmaps, README text, and comments

Important source anchors:

| Question | Primary source |
|---|---|
| Which WebSocket methods exist? | `core/src/server/handler.rs`, `core/src/server/plugin_rpc.rs` |
| How does the frontend call Core? | `src/services/api.ts`, `src/services/transport.ts` |
| What is persisted? | `core/src/manager/store.rs`, `persisted.rs`, `core/src/profile.rs` |
| How are Scope values resolved? | `core/src/manager/config.rs`, `scope.rs` |
| How does rendering work? | `core/src/manager/runner.rs`, `demand.rs` |
| Which plugins are loaded? | `core/src/plugin/mod.rs`, `catalog/`, `runtime/` |
| What is desktop-only? | `src-tauri/src/`, `simple/src-tauri/src/` |
| What does the UI expose? | `src/App.tsx`, `src/features/`, `src/hooks/` |

## Architecture principles

- **Core is framework-independent.** `core/` contains no Tauri dependency.
- **Business and shell APIs are distinct.** WebSocket methods control Core;
  Tauri invoke commands provide local desktop integration.
- **Capabilities drive UI.** Devices advertise editable outputs and settings;
  effects advertise parameters and resource permissions.
- **Plugins extend registries.** Lua and native-C controllers, effects, and
  extensions are discovered at runtime.
- **Profiles isolate mutable state.** Advanced and Simple configuration lives
  under separate profile roots.
- **Events invalidate cached views.** Clients should re-query authoritative
  snapshots when an event is missed or ambiguous.

## Glossary

| Term | Meaning |
|---|---|
| Core | Standalone Rust process containing device, plugin, rendering, API, and tray runtimes |
| Shell | Tauri desktop process hosting a React UI and OS integration |
| Advanced | Full plugin and device-management runtime profile |
| Simple | Reduced profile with bundled plugins and constrained settings |
| Scope | A Device, Output, or Segment target |
| Controller | Hardware driver that exposes outputs and accepts device frames |
| Effect | Renderer that fills a logical color buffer |
| Extension | Background integration that can register devices, lock LEDs, and expose a page |
| Runner | Per-device rendering thread, created only while there is demand |
| Selected state | A value explicitly stored at a Scope |
| Effective state | The value resolved after canonicalization and inheritance |
| LED lock | Extension-owned color override for selected physical LEDs |

## Knowledge base map

- [System architecture](system-architecture)
- [State, discovery, and rendering](state-and-rendering)
- [Frontend architecture](frontend-architecture)
- [Plugin system](plugin-system)
- [Codebase map](codebase-map)
- [Development workflow](development-workflow)
- [WebSocket API](../api/websocket-overview)
- [Plugin development reference](../plugins/overview)

:::caution Documentation drift
Older descriptions may still say that plugins must use `<type>.<id>` directory
names, that Lua is the only active runtime, that the LED stream is about 30
FPS, or that the frontend decodes LED frames in a Web Worker. Those statements
do not match the current implementation.
:::

