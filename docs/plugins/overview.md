---
sidebar_position: 1
---

# Plugin Development Overview

Skydimo's plugin system lets you extend the application with custom hardware drivers, lighting effects, and background services — all written in **Lua 5.4**.

:::info Version
The workflow described on this page is supported since **`3.0.0-dev.4`**.
:::

## Plugin Types

| Type | Directory Pattern | Purpose |
|------|-------------------|---------|
| **Controller** | `controller.<id>/` | Hardware device drivers (serial, HID, mDNS) |
| **Effect** | `effect.<id>/` | Visual lighting patterns and animations |
| **Extension** | `extension.<id>/` | Background services, protocol bridges, custom UI |

## Recommended Workflow (3.0.0-dev.4+)

Instead of editing files directly under the runtime plugin storage, use the import workflow:

- Put plugin folders under **import queue**
- Trigger **Refresh Plugins** in UI (or restart Core)
- Verify the plugin in the plugin list

Why this is recommended:

- More predictable install/update behavior
- Better separation between plugin code and runtime data
- Clear source provenance (built-in, import, import-dev, download, manual)

See [Plugin Management](plugin-management) for complete operational details.

## Plugin Package Layout

Your source package should still use a standard plugin folder layout:

```
<type>.<id>/
├── manifest.json
├── main.lua / init.lua
├── lib/            # optional
├── locales/        # optional
├── data/           # optional initial data
└── page/           # extension only, optional
```

## Runtime Storage (Managed by Core)

At runtime, plugin files and plugin data are managed by Core and can be opened from the plugin management UI.

> Treat runtime paths as managed internals: do not hardcode or rely on directory naming conventions.

For extension/plugin code, always use host APIs (for example `ext.data_dir`) instead of constructing paths manually.

## High-Level Loading Flow

1. Core resolves plugin sources (built-in + user-installed)
2. Core loads plugin manifests and metadata
3. Core initializes plugin runtimes by type
4. UI receives plugin metadata via `get_plugins`
5. Plugin operations (refresh/delete/reset/install) trigger runtime refresh

## Installation Sources in UI/API

Each plugin reports an installation source:

| Source | Meaning |
|--------|---------|
| `built-in` | Bundled with application |
| `import` | Imported from user import queue |
| `import-dev` | Imported from development queue (source kept) |
| `download` | Installed from download flow |
| `manual` | Manually introduced/legacy source |

This is useful for support, migration, and deciding whether to **delete** or **reset**.

## What “Reset” Means

- If a plugin has a bundled default version, **Reset** removes user override and falls back to bundled one.
- Optional plugin data cleanup can be performed during reset.
- Built-in plugins are resettable, not directly deletable.

## What “Delete” Means

- Removes the installed plugin copy.
- Optional plugin data cleanup can be performed during delete.
- For development import sources, deleting installed copy does not remove your development source package.

## Next Steps

- [Getting Started](getting-started) — create and iterate on your first plugin
- [Plugin Management](plugin-management) — import, refresh, delete, reset, and troubleshooting
- [Manifest Reference](manifest) — full `manifest.json` specification
- [Controller Plugin Guide](controller-plugin)
- [Effect Plugin Guide](effect-plugin)
- [Extension Plugin Guide](extension-plugin)

## Legacy Note

Older docs or examples may show direct `plugins/<type>.<id>/` development as the default operational path. This is no longer the recommended production workflow after `3.0.0-dev.4`.
