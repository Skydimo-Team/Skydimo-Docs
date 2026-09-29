---
sidebar_position: 5
---

# 插件命令

用于查询插件元数据、导入 `.skyplugin` 包、修改启用状态，以及向扩展页面发送消息的命令。

:::info 版本
本页中的包导入与扩展管理命令自 **`3.0.0-dev.4`** 起支持。
:::

## 启动就绪状态

会修改插件文件或启用状态的管理命令要求插件启动流程已经完成。如果 `get_startup_status().plugins.state` 仍为 `pending` 或 `running`，Core 会返回：

```text
Plugin initialization is still in progress. Please wait a moment and try again.
```

## get_plugins

返回所有已加载 effect、controller 和 extension 插件的元数据。

**参数**：无

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

插件条目可包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 插件 ID |
| `name` | LocalizedText | 显示名称 |
| `enabled` | boolean | 是否启用 |
| `description` | LocalizedText? | 可选 manifest 描述 |
| `permissions` | string[] | 声明的权限 |
| `version` | string | Manifest 版本 |
| `publisher` | string | Manifest 发布者 |
| `language` | string | 运行时语言，如 `lua` 或 `native-c` |
| `abi` | string? | native-c 插件的 ABI 标识符 |
| `repository` | string? | 源仓库 URL |
| `license` | string? | 许可证标识符 |
| `pluginDir` | string | Core 实际加载的插件目录 |
| `dataDir` | string? | 运行时数据目录，若已存在 |
| `bundled` | boolean | 当前来源是否为打包插件 |
| `installSource` | string | 当前运行来源通常为 `bundled`、`import-dev` 或 `package` |
| `reimportsOnRefresh` | boolean | 当前扫描来源固定为 `false` |
| `page` | object? | 扩展页面来源，包含 `type`（`path` 或 `url`）和 `value` 字符串 |

---

## get_plugin_dir

获取用户插件根目录路径。

```json
→ {"jsonrpc":"2.0","method":"get_plugin_dir","id":1}
← {"jsonrpc":"2.0","result":"C:/.../plugins","id":1}
```

---

## open_plugin_dir

在系统文件管理器中打开插件根目录或指定插件的解析目录。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `pluginId` | string | 否 | 打开指定插件目录；不传则打开插件根目录 |

```json
→ {"jsonrpc":"2.0","method":"open_plugin_dir","params":{"pluginId":"rainbow"},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## open_plugin_data_dir

在系统文件管理器中打开插件运行时数据目录。Core 会先确保目录存在。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `pluginId` | string | 是 | 插件 ID |

```json
→ {"jsonrpc":"2.0","method":"open_plugin_data_dir","params":{"pluginId":"rainbow"},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## import_plugin_package

从 `.skyplugin` 或 `.zip` 压缩包创建导入会话。压缩包字节以 base64 传入。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `fileName` | string | 是 | 原始包文件名，用于显示和日志 |
| `data` | string | 是 | base64 编码后的包字节 |

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
Simple 模式禁用该命令。
:::

---

## install_plugins

从活动导入会话安装选中的插件 ID。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `sessionId` | string | 是 | `import_plugin_package` 返回的会话 ID |
| `pluginIds` | string[] | 是 | 要安装的插件 ID |

```json
→ {"jsonrpc":"2.0","method":"install_plugins","params":{
  "sessionId":"pkg-19af...",
  "pluginIds":["rainbow"]
},"id":1}
← {"jsonrpc":"2.0","result":["rainbow"],"id":1}
```

Core 会在替换文件前释放相同 ID 的已有插件，重载插件注册表，恢复更新插件之前的启用状态，启动已启用扩展，刷新设备，重启活跃 runner，并发送 `plugins-changed`。

:::caution
简单模式下此命令不可用。
:::

---

## cancel_plugin_import

取消并清理活动包导入会话。

```json
→ {"jsonrpc":"2.0","method":"cancel_plugin_import","params":{"sessionId":"pkg-19af..."},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## refresh_plugins

重载插件注册表并刷新运行时状态。

```json
→ {"jsonrpc":"2.0","method":"refresh_plugins","id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

刷新会停止正在运行的扩展、重新扫描所有活动来源、再次启动已启用扩展、重新扫描设备、重启活跃 runner，并发送 `plugins-changed`。

---

## delete_plugin

删除已安装的包插件副本。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `pluginId` | string | 是 | 插件 ID |
| `deleteData` | boolean | 否 | 是否同时删除插件数据目录 |

```json
→ {"jsonrpc":"2.0","method":"delete_plugin","params":{
  "pluginId":"my_effect",
  "deleteData":true
},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

只有当前来源为 `package` 的插件可删除。打包插件和开发插件不能通过该命令删除。

---

## reset_plugin

移除已安装的包覆盖副本，并回退到其他可用来源，例如打包插件。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `pluginId` | string | 是 | 插件 ID |
| `resetData` | boolean | 否 | 是否同时删除插件数据目录 |

```json
→ {"jsonrpc":"2.0","method":"reset_plugin","params":{
  "pluginId":"rainbow",
  "resetData":false
},"id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## set_controller_plugins_enabled

启用或禁用 controller 插件。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `pluginIds` | string[] | 是 | Controller 插件 ID |
| `enabled` | boolean | 是 | `true` 启用，`false` 禁用 |

```json
→ {"jsonrpc":"2.0","method":"set_controller_plugins_enabled","params":{
  "pluginIds":["skydimo_serial"],
  "enabled":false
},"id":1}
```

禁用 controller 插件会断开当前由它管理的设备；启用会触发设备发现。

---

## set_effect_plugins_enabled

启用或禁用 effect 插件。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `pluginIds` | string[] | 是 | Effect 插件 ID |
| `enabled` | boolean | 是 | `true` 启用，`false` 禁用 |

```json
→ {"jsonrpc":"2.0","method":"set_effect_plugins_enabled","params":{
  "pluginIds":["rainbow"],
  "enabled":true
},"id":1}
```

---

## set_extension_plugins_enabled

启用或禁用 extension 插件。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `pluginIds` | string[] | 是 | Extension 插件 ID |
| `enabled` | boolean | 是 | `true` 启用，`false` 禁用 |

```json
→ {"jsonrpc":"2.0","method":"set_extension_plugins_enabled","params":{
  "pluginIds":["openrgb"],
  "enabled":false
},"id":1}
```

禁用会停止扩展运行时；启用会在扩展管理器可用时启动扩展。

---

## ext_page_send

向正在运行的扩展发送 JSON 消息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `extId` | string | 是 | 扩展插件 ID |
| `data` | any | 否 | 任意 JSON 数据，默认 `null` |

```json
→ {"jsonrpc":"2.0","method":"ext_page_send","params":{
  "extId":"openrgb",
  "data":{"action":"refresh"}
},"id":1}
```

Lua 扩展通过 `on_page_message(data)` 接收；native-c 扩展通过 `on_page_message_json` 接收。
