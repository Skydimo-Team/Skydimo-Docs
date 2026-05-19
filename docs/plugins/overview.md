---
sidebar_position: 1
---

# Plugin Development Overview

Skydimo's plugin system lets you extend the application with custom hardware drivers, lighting effects, and background services. The current production runtimes are **Lua 5.4** and **native-c**.

:::info Version
The workflow described on this page is supported since **`3.0.0-dev.4`**.
:::

## Plugin Types

| Type | Directory Pattern | Purpose |
|------|-------------------|---------|
| **Controller** | `controller.<id>/` | Hardware device drivers (serial, HID, mDNS) |
| **Effect** | `effect.<id>/` | Visual lighting patterns and animations |
| **Extension** | `extension.<id>/` | Background services, protocol bridges, custom UI |

## Runtime Choices

| Runtime | `language` | Best for |
|---------|------------|----------|
| Lua | `"lua"` | Fast iteration, small integrations, device protocol glue |
| Native C ABI | `"native-c"` | High-performance effects/controllers/extensions built from the public C, Rust, C#, C++, Zig, or other C ABI-capable SDK packages |

`native-c` plugins are shared libraries loaded in the Core process. Use [Native-C Plugin Runtime](native-c-plugin) when you need native performance or one of the public SDK language packages.

## Recommended Workflow (3.0.0-dev.4+)

Instead of editing files directly under the runtime plugin storage, use the import workflow:

- Put plugin folders under **import queue**
- Trigger **Refresh Plugins** in UI (or restart Core)
- Verify the plugin in the plugin list

Why this is recommended:

- More predictable install/update behavior
- Better separation between plugin code and runtime data
- Clear source provenance (bundled, import, import-dev, package, manual)

See [Plugin Management](plugin-management) for complete operational details.

## Plugin Package Layout

Your source package should still use a standard plugin folder layout:

```
<type>.<id>/
├── manifest.json
├── main.lua / init.lua      # Lua plugins
├── native/<platform>/       # native-c shared libraries
├── lib/            # optional
├── locales/        # optional
├── data/           # optional initial data
└── page/           # extension only, optional
```

Native-c source projects can live in the same source package during development, but the installable package must include the compiled library referenced by `entry`.

## Plugin Packs

A package directory can also be a **pack manifest** with `"type": "pack"` and a `plugins` list. A pack does not load a runtime by itself; it groups child plugin folders:

```json
{
  "id": "my_effect_pack",
  "version": "1.0.0",
  "name": "My Effect Pack",
  "publisher": "Example",
  "type": "pack",
  "plugins": [
    "Rainbow",
    { "path": "Audio/Bars" }
  ]
}
```

Pack entries must point to child directories inside the pack. Nested packs are not supported.

## Runtime Storage (Managed by Core)

At runtime, plugin files and plugin data are managed by Core and can be opened from the plugin management UI.

> Treat runtime paths as managed internals: do not hardcode or rely on directory naming conventions.

For extension/plugin code, always use host APIs (for example `ext.data_dir`) instead of constructing paths manually.

## High-Level Loading Flow

1. Core resolves plugin sources (bundled + user-installed)
2. Core loads plugin manifests and metadata
3. Core initializes plugin runtimes by type
4. UI receives plugin metadata via `get_plugins`
5. Plugin operations (refresh/delete/reset/install) trigger runtime refresh

## Installation Sources in UI/API

Each plugin reports an installation source:

| Source | Meaning |
|--------|---------|
| `bundled` | Bundled with application |
| `import` | Imported from user import queue |
| `import-dev` | Imported from development queue (source kept) |
| `package` | Installed from package import flow |
| `manual` | Manually introduced/legacy source |

This is useful for support, migration, and deciding whether to **delete** or **reset**.

## What “Reset” Means

- If a plugin has a bundled default version, **Reset** removes user override and falls back to bundled one.
- Optional plugin data cleanup can be performed during reset.
- Bundled plugins are resettable, not directly deletable.

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
- [Native-C Plugin Runtime](native-c-plugin)

## Legacy Note

Older docs or examples may show direct `plugins/<type>.<id>/` development as the default operational path. This is no longer the recommended production workflow after `3.0.0-dev.4`.
