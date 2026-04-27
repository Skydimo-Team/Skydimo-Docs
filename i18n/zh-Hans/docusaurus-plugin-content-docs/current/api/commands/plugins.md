---
sidebar_position: 5
---

# 插件命令

用于管理插件（控制器、灯效、扩展）的命令。

:::info 版本说明
本页补充的扩展管理命令与元数据字段在 **`3.0.0-dev.4`** 及之后版本可用。
:::

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

### 新增元数据字段

  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `pluginDir` | string | 插件运行时目录 |
  | `dataDir` | string \| null | 插件数据目录（若存在） |
  | `builtIn` | boolean | 是否为内置插件 |
  | `installSource` | string | `built-in` \| `import` \| `import-dev` \| `download` \| `manual` |

  ---

  ## refresh_plugins

  刷新插件状态并处理导入队列。

  **参数**：无

  ```json
  → {"jsonrpc":"2.0","method":"refresh_plugins","id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  通常会触发：导入队列处理、插件重载、运行时刷新、UI 插件变更通知。

  ---

  ## open_plugin_dir

  在系统文件管理器中打开插件目录。

  **参数**：

  | 字段 | 类型 | 必填 | 说明 |
  |------|------|:----:|------|
  | `pluginId` | string | ❌ | 传入时打开指定插件目录；不传时打开插件总目录 |

  ```json
  → {"jsonrpc":"2.0","method":"open_plugin_dir","params":{"pluginId":"rainbow"},"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  ---

  ## open_plugin_data_dir

  在系统文件管理器中打开指定插件的数据目录。

  **参数**：

  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `pluginId` | string | 插件 ID |

  ```json
  → {"jsonrpc":"2.0","method":"open_plugin_data_dir","params":{"pluginId":"rainbow"},"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  ---

  ## delete_plugin

  删除已安装插件副本。

  **参数**：

  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `pluginId` | string | 插件 ID |
  | `deleteData` | boolean | 是否同时删除插件数据目录 |

  ```json
  → {"jsonrpc":"2.0","method":"delete_plugin","params":{
    "pluginId":"my_effect",
    "deleteData":true
  },"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  :::caution
  内置插件不可直接删除，需使用 [`reset_plugin`](#reset_plugin)。
  :::

  ---

  ## reset_plugin

  重置插件：移除用户覆盖副本并回到默认（若有内置版本）。

  **参数**：

  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `pluginId` | string | 插件 ID |
  | `resetData` | boolean | 是否同时重置插件数据 |

  ```json
  → {"jsonrpc":"2.0","method":"reset_plugin","params":{
    "pluginId":"rainbow",
    "resetData":false
  },"id":1}
  ← {"jsonrpc":"2.0","result":null,"id":1}
  ```

  ---

  ## get_plugin_dir

  获取插件总目录路径。

  **参数**：无

  ```json
  → {"jsonrpc":"2.0","method":"get_plugin_dir","id":1}
  ← {"jsonrpc":"2.0","result":"C:/.../plugins","id":1}
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

## set_effect_plugins_enabled

启用或禁用灯效插件。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `pluginIds` | string[] | 灯效插件 ID 列表 |
| `enabled` | boolean | `true` 启用，`false` 禁用 |

```json
→ {"jsonrpc":"2.0","method":"set_effect_plugins_enabled","params":{
  "pluginIds":["rainbow"],
  "enabled":true
},"id":1}
```

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

---

## 插件下载会话命令

用于下载并安装插件的会话流程：

### start_download_plugin_session

从远程来源创建下载会话。

### install_from_plugin_session

从会话中选择插件并安装到托管插件存储。

### cancel_download_plugin_session

取消并清理下载会话。

:::note
开发版本中的精确请求/响应结构可能迭代。做工具接入时，请以目标构建版本的数据类型文档为准。
:::
