---
sidebar_position: 1
description: Install, import, enable, update, reset, and remove Skydimo plugins.
---

# Plugin Management

Open **Plugins** from the sidebar. Advanced mode provides Marketplace, Effects,
Controllers, and Extensions tabs.

## Marketplace

The Marketplace opens on the latest list. Search by name or keywords, then use:

- **Download and install** for a new plugin;
- **Update** when a newer package is available; or
- the installed indicator when no action is required.

Installation downloads the package, scans its manifests, and installs the
selected plugin IDs. The current UI shows a limited latest/search result set;
pagination, a load-more control, and a separate plugin detail page are not
implemented.

## Import a package

1. Select **Import Plugin**.
2. Choose a `.skyplugin` package.
3. Wait for the package scan.
4. Select one or more discovered plugins.
5. Select **Install**.

The package may contain effects, controllers, extensions, or a pack that lists
child plugins. Installation is disabled in the Simple profile.

## Enable or disable plugins

Use the Effects, Controllers, or Extensions tab to search installed plugins.
Toggle one plugin directly, or enter multi-select mode for a bulk enable/disable
operation.

- Disabling an effect removes it from new effect selections.
- Disabling a controller can remove devices that depend on it.
- Disabling an extension stops its background runtime, removes its registered
  devices, releases its LED locks, and closes its resources.

Plugin changes can trigger a device rescan and restart active runners.

## Extension pages

An enabled extension may expose:

- a bundled local `page`, hosted by the desktop application; or
- an external HTTPS/HTTP `page_url`.

Local pages are desktop-only. External pages may work in desktop and browser
mode. The page exchanges data with its extension through the same Core
WebSocket connection.

Extension page shortcuts appear in the sidebar and can be pinned or unpinned.
If an active extension is disabled or removed, the UI returns to the plugin
overview.

## Context actions

Right-click a local plugin to access actions such as:

- copy plugin ID;
- multi-select;
- open plugin directory;
- open plugin data directory;
- delete an installed plugin; or
- restore the bundled/default version.

**Delete** removes an installed package. **Restore default** removes a user
override when a bundled version exists. Both actions can optionally remove the
plugin's data. Development plugins are loaded directly and may reappear after a
refresh if their source directory still exists.

## Refresh

Use **Refresh** after changing a development plugin. Refresh stops and restarts
extensions, rebuilds plugin registries, rescans hardware, and restarts active
device runners. Brief lighting interruption is expected.

For plugin authors, continue with the
[Plugin Development Overview](../plugins/overview).

