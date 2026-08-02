---
sidebar_position: 6
description: Repository directory map and the source files to change for common features.
---

# Codebase Map

## Repository roots

| Path | Responsibility |
|---|---|
| `core/` | Standalone Rust backend and public Core library |
| `src/` | Advanced React frontend |
| `src-tauri/` | Advanced Tauri shell and system integration |
| `simple/src/` | Simple React frontend |
| `simple/src-tauri/` | Simple Tauri shell |
| `launcher/` | Windows autostart helper |
| `plugins/` | Bundled, Simple, development, private, and submodule plugin sources |
| `docs/` | Docusaurus documentation submodule |
| `scripts/` | Build, release, validation, and packaging scripts |
| `script/` | Plugin, launcher, bundling, migration, and diagnostic utilities |
| `dev/` | Design notes, roadmaps, and project-maintainer material |
| `data/`, `import/` | Workspace development/runtime inputs |

The root Cargo workspace contains `core`, `src-tauri`, `simple/src-tauri`, and
`launcher`. The root npm package builds the Advanced frontend; `simple/` has
its own package.

## Core map

```text
core/src/
├─ api/          serialized public DTOs
├─ interface/    Controller/Effect contracts and common hardware types
├─ manager/      state, discovery, persistence, runners, locks, layouts
├─ plugin/       catalog, import/admin, host APIs, Lua/native-C runtimes
├─ resource/     audio, screen, media, system state, discovery, drivers
├─ runtime/      single-instance control and UI launcher
├─ server/       WebSocket server, RPC dispatcher, event broadcaster
├─ shortcut/     global shortcuts
├─ telemetry/    consent, queueing, upload, exception handling
├─ tray/         Core tray and event loop
├─ event.rs      event names and EventBroadcaster
├─ profile.rs    Advanced/Simple path split and migration
└─ main.rs       Core composition root
```

## Advanced frontend map

```text
src/
├─ features/
│  ├─ home/
│  ├─ devices/
│  ├─ plugins/
│  ├─ settings/
│  └─ layout/
├─ components/ui/   reusable UI wrappers
├─ hooks/           backend snapshots, events, platform and app state
├─ services/        API, transport, config, logging, diagnostics
├─ types/           frontend DTO contracts
├─ i18n/            locale resources and LocalizedText resolution
├─ styles/          Chakra theme and CSS variables
├─ motion/          shared animation tokens
├─ App.tsx          page/dialog composition
└─ main.tsx         application bootstrap
```

## Change map

### Add or change a WebSocket operation

1. Implement manager/resource/plugin behavior.
2. Add dispatch and validation in `core/src/server/handler.rs` or
   `plugin_rpc.rs`.
3. Add/update serialized DTOs.
4. Add the typed wrapper in `src/services/api.ts`.
5. Synchronize `src/types/` (and Simple types/API if it consumes the method).
6. Add tests and update `docs/docs/api/`.

### Add an event

1. Declare a stable name in `core/src/event.rs` when it is a Core-wide event.
2. Emit through `EventBroadcaster`.
3. Define the payload DTO and schema/version when needed.
4. Subscribe in a hook/service rather than a leaf component.
5. Decide whether the event is an invalidation or contains a complete snapshot.
6. Document recovery after missed events.

### Add an effect parameter type

1. Extend Core effect parameter types and manifest parser.
2. Extend API serialization.
3. Synchronize `src/types/effect.ts`.
4. Add a renderer under `features/devices/components/params/`.
5. Update `ParamRenderer`, tests, Simple UI if applicable, and plugin docs.

### Add desktop-only behavior

1. Keep business logic in Core when it must work headlessly.
2. Put OS/window/file-dialog behavior in the appropriate Tauri shell.
3. Expose a narrow Tauri command.
4. Gate the frontend through `isTauri`.
5. Define the browser fallback or hide the control.

### Add a Lua host API

1. Choose controller, effect, or extension ownership.
2. Implement it in `core/src/plugin/runtime/lua/`.
3. Apply explicit permission checks where the capability is sensitive.
4. Mirror it in native-C only when the public runtime contract requires parity.
5. Add tests and update the relevant plugin API page.

## DTO warning

Do not assume every serialized field is camelCase. Request parameters are
usually camelCase, but Device/Output/Segment/Scope responses contain
snake_case fields such as `active_controller_id`, `output_id`, and
`selected_effect_id`. Verify each Rust `serde` declaration and real response.

## Submodules and working trees

`docs/` and several plugin directories are Git submodules. Some submodules can
be intentionally uninitialized. Before editing:

- inspect the parent repository status;
- inspect the target submodule status separately;
- preserve unrelated user changes; and
- do not infer that every `.gitmodules` entry is available locally.

