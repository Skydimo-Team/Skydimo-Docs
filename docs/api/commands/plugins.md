---
sidebar_position: 5
---

# Plugin Commands

Commands for querying plugin metadata, importing `.skyplugin` packages, changing enabled state, and sending extension-page messages.

:::info Version
The package import and extended management commands on this page are supported since **`3.0.0-dev.4`**.
:::

## Startup Readiness

Plugin management commands that mutate installed plugins or enabled state require plugin startup to have finished. If `get_startup_status().plugins.state` is `pending` or `running`, Core returns:

```text
Plugin initialization is still in progress. Please wait a moment and try again.
```

## get_plugins

Returns metadata for all loaded effect, controller, and extension plugins.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_plugins","id":1}
← {"jsonrpc":"2.0","result":{
  "effects": [
    {
      "id": "rainbow",
      "name": {"raw": "Rainbow", "byLocale": {"zh-CN": "彩虹"}},
      "enabled": true,
      "description": {"raw": "Flowing rainbow animation"},
      "icon": "Waves",
      "permissions": ["log"],
      "version": "1.0.0",
      "publisher": "Skydimo",
      "language": "native-c",
      "abi": "skydimo-effect-c-v3",
      "repository": "https://github.com/...",
      "license": "MIT",
      "params": [],
      "pluginDir": "C:/.../plugins/8f1d...",
      "dataDir": "C:/.../data/8f1d...",
      "bundled": false,
      "installSource": "package",
      "reimportsOnRefresh": false
    }
  ],
  "controllers": [],
  "extensions": []
},"id":1}
```

Each plugin item can include:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Plugin ID |
| `name` | LocalizedText | Display name |
| `enabled` | boolean | Whether the plugin is enabled |
| `description` | LocalizedText? | Optional manifest description |
| `permissions` | string[] | Declared permissions |
| `version` | string | Manifest version |
| `publisher` | string | Manifest publisher |
| `language` | string | Runtime language, such as `lua` or `native-c` |
| `abi` | string? | Native ABI identifier for native-c plugins |
| `repository` | string? | Source repository URL |
| `license` | string? | License identifier |
| `pluginDir` | string | Resolved plugin directory actually loaded by Core |
| `dataDir` | string? | Runtime data directory if it exists |
| `bundled` | boolean | Whether the active source is bundled |
| `installSource` | string | `bundled`, `import-dev`, or `package` for current runtime sources |
| `reimportsOnRefresh` | boolean | Currently `false` for scanned runtime sources |
| `page` | object? | Extension page source with `type` set to `path` or `url`, plus a `value` string |

---

## get_plugin_dir

Get the user plugin root directory path.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_plugin_dir","id":1}
← {"jsonrpc":"2.0","result":"C:/.../plugins","id":1}
```

---

## open_plugin_dir

Open the plugin root directory or one plugin's resolved directory in the system file manager.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pluginId` | string | no | Open this plugin's resolved directory; omitted opens the plugin root |

```json
→ {"jsonrpc":"2.0","method":"open_plugin_dir","params":{"pluginId":"rainbow"},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## open_plugin_data_dir

Open a plugin's runtime data directory in the system file manager. Core creates the directory first if needed.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pluginId` | string | yes | Plugin ID |

```json
→ {"jsonrpc":"2.0","method":"open_plugin_data_dir","params":{"pluginId":"rainbow"},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## import_plugin_package

Start a package import session from a `.skyplugin` or `.zip` archive. The archive bytes are sent as base64.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `fileName` | string | yes | Original package file name; used for display/logging |
| `data` | string | yes | Base64-encoded package bytes |

```json
→ {"jsonrpc":"2.0","method":"import_plugin_package","params":{
  "fileName":"effect.rainbow.skyplugin",
  "data":"UEsDB..."
},"id":1}
← {"jsonrpc":"2.0","result":{
  "sessionId":"pkg-19af...",
  "sourceName":"effect.rainbow",
  "plugins":[
    {
      "id":"rainbow",
      "name":{"raw":"Rainbow"},
      "pluginType":"effect",
      "version":"1.0.0",
      "publisher":"Skydimo"
    }
  ]
},"id":1}
```

:::caution
This command is disabled in simple mode.
:::

---

## install_plugins

Install selected plugin IDs from an active import session.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `sessionId` | string | yes | Session returned by `import_plugin_package` |
| `pluginIds` | string[] | yes | Plugin IDs to install |

```json
→ {"jsonrpc":"2.0","method":"install_plugins","params":{
  "sessionId":"pkg-19af...",
  "pluginIds":["rainbow"]
},"id":1}
← {"jsonrpc":"2.0","result":["rainbow"],"id":1}
```

Core disables and releases existing plugins with the same ID before replacing files, reloads plugin registries, restores the previous enabled state for updated plugins, starts enabled extensions, refreshes devices, restarts active runners, and emits `plugins-changed`.

:::caution
This command is disabled in simple mode.
:::

---

## cancel_plugin_import

Cancel and clean up an active package import session.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `sessionId` | string | yes | Import session ID |

```json
→ {"jsonrpc":"2.0","method":"cancel_plugin_import","params":{"sessionId":"pkg-19af..."},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## refresh_plugins

Reload plugin registries and refresh runtime state.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"refresh_plugins","id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

Refresh stops running extensions, reloads all active scan sources, starts enabled extensions again, rescans devices, restarts active runners, and emits `plugins-changed`.

---

## delete_plugin

Delete an installed package plugin copy.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pluginId` | string | yes | Plugin ID |
| `deleteData` | boolean | no | Also remove the plugin data directory |

```json
→ {"jsonrpc":"2.0","method":"delete_plugin","params":{
  "pluginId":"my_effect",
  "deleteData":true
},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

Only plugins whose active source is `package` can be deleted. Bundled and development plugins are not deleted through this command.

---

## reset_plugin

Remove an installed package override and fall back to another available source, such as a bundled plugin.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pluginId` | string | yes | Plugin ID |
| `resetData` | boolean | no | Also remove the plugin data directory |

```json
→ {"jsonrpc":"2.0","method":"reset_plugin","params":{
  "pluginId":"rainbow",
  "resetData":false
},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## set_controller_plugins_enabled

Enable or disable controller plugins.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pluginIds` | string[] | yes | Controller plugin IDs |
| `enabled` | boolean | yes | `true` to enable, `false` to disable |

```json
→ {"jsonrpc":"2.0","method":"set_controller_plugins_enabled","params":{
  "pluginIds":["skydimo_serial"],
  "enabled":false
},"id":1}
```

Disabling a controller plugin disconnects devices currently managed by that plugin. Enabling one triggers device discovery.

---

## set_effect_plugins_enabled

Enable or disable effect plugins.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pluginIds` | string[] | yes | Effect plugin IDs |
| `enabled` | boolean | yes | `true` to enable, `false` to disable |

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

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `pluginIds` | string[] | yes | Extension plugin IDs |
| `enabled` | boolean | yes | `true` to enable, `false` to disable |

```json
→ {"jsonrpc":"2.0","method":"set_extension_plugins_enabled","params":{
  "pluginIds":["openrgb"],
  "enabled":false
},"id":1}
```

Disabling stops the extension runtime. Enabling starts the extension if the extension manager is available.

---

## ext_page_send

Send a JSON message to a running extension.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `extId` | string | yes | Extension plugin ID |
| `data` | any | no | Arbitrary JSON data, defaults to `null` |

```json
→ {"jsonrpc":"2.0","method":"ext_page_send","params":{
  "extId":"openrgb",
  "data":{"action":"refresh"}
},"id":1}
```

Lua extensions receive this through `on_page_message(data)`. Native-c extensions receive it through `on_page_message_json`.
