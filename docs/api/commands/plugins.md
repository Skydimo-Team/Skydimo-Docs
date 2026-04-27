---
sidebar_position: 5
---

# Plugin Commands

Commands for managing plugins (controllers, effects, extensions).

:::info Version
The extended management commands and metadata on this page are supported since **`3.0.0-dev.4`**.
:::

## get_plugins

Returns metadata for all installed plugins.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_plugins","id":1}
← {"jsonrpc":"2.0","result":{
  "effects": [
    {
      "id": "rainbow",
      "name": "Rainbow",
      "version": "1.0.0",
      "publisher": "Skydimo",
      "language": "lua",
      "pluginDir": "...",
      "dataDir": "...",
      "builtIn": false,
      "installSource": "import-dev"
    }
  ],
  "controllers": [
    {
      "id": "skydimo_serial",
      "name": "Skydimo Serial",
      "version": "1.0.0",
      "enabled": true
    }
  ],
  "extensions": [
    {
      "id": "openrgb",
      "name": "OpenRGB Bridge",
      "version": "1.0.0",
      "enabled": true,
      "hasPage": true
    }
  ]
},"id":1}
```

### Additional Metadata Fields

  Each plugin item can include:

  | Field | Type | Description |
  |-------|------|-------------|
  | `pluginDir` | string | Resolved runtime plugin directory |
  | `dataDir` | string \| null | Plugin data directory (if exists) |
  | `builtIn` | boolean | Whether plugin is bundled with app |
  | `installSource` | string | `built-in` \| `import` \| `import-dev` \| `download` \| `manual` |

  ---

  ## refresh_plugins

  Refresh plugin state and apply pending imports.

  **Parameters**: none

  ```json
  → {"jsonrpc":"2.0","method":"refresh_plugins","id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  Typical effects of refresh:

  - Import queued plugins
  - Reload plugin registries
  - Refresh runtime state so plugin updates are picked up
  - Emit plugin-changed event to UI

  ---

  ## open_plugin_dir

  Open plugin directory in system file manager.

  **Parameters**:

  | Field | Type | Required | Description |
  |-------|------|:--------:|-------------|
  | `pluginId` | string | ❌ | If provided, opens this plugin's resolved directory; otherwise opens plugin root directory |

  ```json
  → {"jsonrpc":"2.0","method":"open_plugin_dir","params":{"pluginId":"rainbow"},"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  ---

  ## open_plugin_data_dir

  Open a plugin's data directory in system file manager.

  **Parameters**:

  | Field | Type | Description |
  |-------|------|-------------|
  | `pluginId` | string | Plugin ID |

  ```json
  → {"jsonrpc":"2.0","method":"open_plugin_data_dir","params":{"pluginId":"rainbow"},"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  ---

  ## delete_plugin

  Delete an installed plugin copy.

  **Parameters**:

  | Field | Type | Description |
  |-------|------|-------------|
  | `pluginId` | string | Plugin ID |
  | `deleteData` | boolean | Whether to delete plugin data directory too |

  ```json
  → {"jsonrpc":"2.0","method":"delete_plugin","params":{
    "pluginId":"my_effect",
    "deleteData":true
  },"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  :::caution
  Built-in plugins cannot be deleted directly. Use [`reset_plugin`](#reset_plugin) instead.
  :::

  ---

  ## reset_plugin

  Reset a plugin to default bundled state by removing user override copy.

  **Parameters**:

  | Field | Type | Description |
  |-------|------|-------------|
  | `pluginId` | string | Plugin ID |
  | `resetData` | boolean | Whether to also reset plugin data |

  ```json
  → {"jsonrpc":"2.0","method":"reset_plugin","params":{
    "pluginId":"rainbow",
    "resetData":false
  },"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  ---

  ## get_plugin_dir

  Get plugin root directory path as string.

  **Parameters**: none

  ```json
  → {"jsonrpc":"2.0","method":"get_plugin_dir","id":1}
  ← {"jsonrpc":"2.0","result":"C:/.../plugins","id":1}
  ```

---

## set_controller_plugins_enabled

Enable or disable controller plugins.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `pluginIds` | string[] | List of controller plugin IDs |
| `enabled` | boolean | `true` to enable, `false` to disable |

```json
→ {"jsonrpc":"2.0","method":"set_controller_plugins_enabled","params":{
  "pluginIds":["skydimo_serial"],
  "enabled":true
},"id":1}
```

:::info
Disabling a controller plugin will disconnect all devices currently managed by that plugin.
:::

---

## set_effect_plugins_enabled

Enable or disable effect plugins.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `pluginIds` | string[] | List of effect plugin IDs |
| `enabled` | boolean | `true` to enable, `false` to disable |

```json
→ {"jsonrpc":"2.0","method":"set_effect_plugins_enabled","params":{
  "pluginIds":["rainbow"],
  "enabled":true
},"id":1}
```

---

## set_extension_plugins_enabled

Enable or disable extension plugins.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `pluginIds` | string[] | List of extension plugin IDs |
| `enabled` | boolean | `true` to enable, `false` to disable |

```json
→ {"jsonrpc":"2.0","method":"set_extension_plugins_enabled","params":{
  "pluginIds":["openrgb"],
  "enabled":false
},"id":1}
```

---

## ext_page_send

Send a message to an extension's embedded HTML page.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `extId` | string | Extension plugin ID |
| `data` | any | Arbitrary JSON data to send |

```json
→ {"jsonrpc":"2.0","method":"ext_page_send","params":{
  "extId":"openrgb",
  "data":{"action":"refresh"}
},"id":1}
```

The extension receives this via its `on_page_message(data)` callback.

---

## Plugin Download Session Commands

These commands support download-and-install flows from remote sources.

### start_download_plugin_session

Start a server-side download session from a source URL.

### install_from_plugin_session

Install selected plugin IDs from a session into managed plugin storage.

### cancel_download_plugin_session

Cancel and clean up a download session.

:::note
Exact payload schemas may evolve across development builds. Prefer checking current API data types in your target build when integrating tooling.
:::
