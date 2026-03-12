---
sidebar_position: 5
---

# 插件命令

用于管理插件（控制器、灯效、扩展）的命令。

## get_plugins

返回所有已安装插件的元数据。

**参数**：无

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

启用或禁用控制器插件。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `pluginIds` | string[] | 控制器插件 ID 列表 |
| `enabled` | boolean | `true` 启用，`false` 禁用 |

```json
→ {"jsonrpc":"2.0","method":"set_controller_plugins_enabled","params":{
  "pluginIds":["skydimo_serial"],
  "enabled":true
},"id":1}
```

:::info
禁用控制器插件将断开所有当前由该插件管理的设备。
:::

---

## set_extension_plugins_enabled

启用或禁用扩展插件。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `pluginIds` | string[] | 扩展插件 ID 列表 |
| `enabled` | boolean | `true` 启用，`false` 禁用 |

```json
→ {"jsonrpc":"2.0","method":"set_extension_plugins_enabled","params":{
  "pluginIds":["openrgb"],
  "enabled":false
},"id":1}
```

---

## ext_page_send

向扩展插件的内嵌 HTML 页面发送消息。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `extId` | string | 扩展插件 ID |
| `data` | any | 要发送的任意 JSON 数据 |

```json
→ {"jsonrpc":"2.0","method":"ext_page_send","params":{
  "extId":"openrgb",
  "data":{"action":"refresh"}
},"id":1}
```

扩展插件将通过其 `on_page_message(data)` 回调接收该消息。
