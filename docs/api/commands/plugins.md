---
sidebar_position: 5
---

# Plugin Commands

Commands for managing plugins (controllers, effects, extensions).

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
      "language": "lua"
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
