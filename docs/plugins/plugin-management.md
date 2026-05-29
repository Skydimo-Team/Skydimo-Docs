---
sidebar_position: 3
---

# Plugin Management

This page explains operational plugin workflows: where plugins are loaded from, how `.skyplugin` packages are imported, and what refresh/delete/reset do to the running Core.

:::info Version
The package import, managed plugin storage, and extended plugin metadata described here are supported since **`3.0.0-dev.4`**.
:::

## Runtime Sources

Core scans different plugin roots depending on the plugin mode.

### Full Mode

Full mode loads:

| Priority | Source | Purpose |
|----------|--------|---------|
| 1 | `<config_dir>/plugins/` | User-installed package copies, stored under hashed directories |
| 2 | `<config_dir>/plugins/dev/` | Development plugins loaded directly from their folders |
| 3 | `<exe_dir>/plugins/` | Bundled application plugins |
| 4 | `<exe_dir>/plugins/built-in/` | Shared built-in baseline plugins |

Earlier sources win when duplicate plugin IDs exist. A package installed into `<config_dir>/plugins/` can override a bundled plugin; `reset_plugin` removes that override.

### Simple Mode

Simple mode loads only bundled plugins:

| Priority | Source | Purpose |
|----------|--------|---------|
| 1 | `<exe_dir>/plugins/simple/` | Simple-mode plugin set |
| 2 | `<exe_dir>/plugins/built-in/` | Shared built-in baseline plugins |

User package import and installation are disabled in simple mode.

## Package Import Flow

Skydimo imports `.skyplugin` files through a short-lived server-side session:

1. The client sends package bytes with `import_plugin_package`.
2. Core extracts the archive into a temporary directory and scans `manifest.json` files.
3. The client chooses which scanned plugin IDs to install.
4. Core installs the selected plugins with `install_plugins`.
5. The import session is consumed and the temporary directory is cleaned up.

Installed code is copied to `<config_dir>/plugins/<hash(plugin_id)>`. A package-level `data/` directory is merged into `<config_dir>/data/<hash(plugin_id)>` instead of being copied beside plugin code.

Use `cancel_plugin_import` if the user abandons the session before installation.

## Development Plugins

Put development plugins under:

```text
<config_dir>/plugins/dev/<type>.<id>/
```

Development plugins are loaded directly from that directory; they are not copied into hashed managed storage. Their runtime data directory resolves to the plugin's own `data/` folder.

Refresh after changing a development plugin so Core reloads manifests and restarts affected runtime pieces.

## Refresh Behavior

`refresh_plugins` does the runtime-safe refresh sequence:

- Ensures plugin roots exist in full mode.
- Stops running extensions before the registry reload.
- Re-scans all active plugin sources.
- Starts enabled extensions again.
- Runs a hotplug scan, restarts active runners, and emits `plugins-changed`.

If an extension calls plugin-admin APIs that would restart itself, Core defers that extension's restart briefly so the current call can return cleanly.

## Enable State

Each plugin type has its own enable map:

| Plugin type | Command/API |
|-------------|-------------|
| Controller | `set_controller_plugins_enabled` |
| Effect | `set_effect_plugins_enabled` |
| Extension | `set_extension_plugins_enabled` |

Disabling a controller plugin disconnects devices managed by that plugin. Disabling an extension stops its runtime thread. Enabling a controller triggers device discovery; enabling an extension starts it immediately.

## Delete vs Reset

### Delete

Use `delete_plugin` to remove a user-installed package copy.

- Only plugins whose active source is `package` can be deleted.
- The plugin is disabled and released before its files are removed.
- `deleteData: true` also removes its runtime data directory.
- On failure, Core attempts to restore the plugin's previous enabled state.

Bundled and development plugins are not deleted through this operation.

### Reset

Use `reset_plugin` to remove a user-installed override and fall back to another available source, usually a bundled plugin.

- Removes the managed package copy for the plugin ID.
- `resetData: true` also removes its runtime data directory.
- If the plugin existed and was enabled before reset, Core restores that enabled state after reload.

## Operational Metadata

`get_plugins` returns metadata meant for UI and tooling:

| Field | Meaning |
|-------|---------|
| `pluginDir` | Actual directory Core loaded for this plugin |
| `dataDir` | Runtime data directory if it already exists |
| `bundled` | Whether the active source is bundled |
| `installSource` | `bundled`, `import-dev`, or `package` for current runtime sources |
| `reimportsOnRefresh` | Currently always `false` for scanned runtime sources |

Use these fields instead of guessing paths.

## `.skyignore`

Package installation respects `.skyignore` rules from the plugin directory. The syntax is `.gitignore`-style, with `.git/` always skipped implicitly.

```text
target/
bin/
obj/
node_modules/
*.tmp
*.log
!keep-this.log
```

For native-c packages, keep the compiled artifact under the `entry` path declared in `manifest.json` and exclude build caches.

## Troubleshooting

### Package import scans zero plugins

- Confirm the archive contains at least one `manifest.json`.
- Confirm archive entries do not use absolute paths or `..` components.
- Confirm the plugin's `type`, `language`, and `entry` are valid.

### Installed plugin does not appear

- Make sure `install_plugins` was called with the ID returned by `import_plugin_package`.
- Check `get_startup_status`; plugin initialization must not be `pending` or `running`.
- Run `refresh_plugins` and inspect Core logs for manifest/runtime errors.

### Wrong version is active

Check `installSource` and `pluginDir` from `get_plugins`. Source priority means a user package can override bundled plugins, while a development plugin can override lower-priority bundled sources.

### Plugin files are removed but data remains

Delete/reset only removes data when `deleteData` or `resetData` is `true`.

## Related References

- [Plugin Commands](../api/commands/plugins)
- [Extension API Reference](api/extension-api)
- [Native-C API Reference](api/native-c-api)
- [Manifest Reference](manifest)
