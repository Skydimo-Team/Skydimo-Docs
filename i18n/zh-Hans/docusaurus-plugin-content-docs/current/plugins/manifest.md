---
sidebar_position: 3
---

# Manifest 参考

每个插件都需要在根目录下提供一个 `manifest.json` 文件。本页记录了所有可用字段。

## 基础字段（所有插件类型通用）

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | string | ✅ | 唯一插件标识符（必须与目录后缀匹配） |
| `version` | string | ✅ | 语义版本号（如 `"1.0.0"`） |
| `name` | string | ✅ | 显示名称（或 i18n 键，如 `"meta.name"`） |
| `type` | string | ✅ | 插件类型：`"controller"`、`"effect"` 或 `"extension"` |
| `language` | string | ✅ | 始终为 `"lua"` |
| `entry` | string | ✅ | 入口脚本文件名（如 `"main.lua"` 或 `"init.lua"`） |
| `permissions` | string[] | ❌ | 所需权限列表 |
| `publisher` | string | ❌ | 作者或组织名称 |
| `description` | string | ❌ | 人类可读描述（或 i18n 键） |
| `repository` | string | ❌ | 源仓库 URL |
| `license` | string | ❌ | 许可证标识符（如 `"MIT"`） |

### 示例（基础）

```json
{
  "id": "my_plugin",
  "version": "1.0.0",
  "name": "My Plugin",
  "type": "effect",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["log"],
  "publisher": "Your Name",
  "description": "A cool plugin",
  "license": "MIT"
}
```

---

## 控制器特有字段

### match

定义控制器如何匹配硬件设备。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `match.protocol` | string | ✅ | `"serial"`、`"hid"` 或 `"mdns"` |
| `match.rules` | MatchRule[] | ✅ | USB 匹配规则 |
| `match.baud_rate` | number | ❌ | 串口波特率（仅 serial） |
| `match.timeout_ms` | number | ❌ | I/O 超时（毫秒） |

### MatchRule

| 字段 | 类型 | 说明 |
|------|------|------|
| `vid` | string | USB 供应商 ID，十六进制（如 `"0x1A86"`） |
| `pid` | string | USB 产品 ID，十六进制（如 `"0x7523"`） |

### 示例（控制器）

```json
{
  "id": "skydimo_serial",
  "version": "1.0.0",
  "name": "Skydimo Serial Controller",
  "type": "controller",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["serial:read", "serial:write", "log"],
  "match": {
    "protocol": "serial",
    "baud_rate": 115200,
    "timeout_ms": 200,
    "rules": [
      { "vid": "0x1A86", "pid": "0x7523" }
    ]
  }
}
```

---

## 灯效特有字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `category` | string | ❌ | 灯效分类（用于排序，或 i18n 键） |
| `icon` | string | ❌ | Lucide 图标名称（如 `"Waves"`、`"Zap"`、`"Music"`） |
| `params` | ParamDefinition[] | ❌ | 可配置参数列表 |

### ParamDefinition

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `key` | string | ✅ | 参数标识符 |
| `label` | string | ✅ | 显示标签（或 i18n 键） |
| `kind` | string | ✅ | `"slider"`、`"select"`、`"toggle"`、`"color"`、`"multi-color"` |
| `default` | any | ❌ | 默认值 |
| `group` | string | ❌ | UI 分组标签 |
| `dependency` | Dependency | ❌ | 条件可见性 |

**Kind 特有字段：**

| Kind | 额外字段 |
|------|---------|
| `slider` | `min`、`max`、`step` |
| `select` | `options: [{label, value}]` |
| `toggle` | （无） |
| `color` | （无） |
| `multi-color` | `fixedCount`、`minCount`、`maxCount` |

### Dependency（依赖条件）

控制参数何时显示或启用：

```json
{
  "key": "preset",
  "equals": 0,
  "behavior": "hide"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 依赖的参数键名 |
| `equals` | any | 仅当依赖项等于此值时显示 |
| `not_equals` | any | 仅当依赖项不等于此值时显示 |
| `behavior` | string | `"hide"` 或 `"disable"` |

### 示例（灯效）

```json
{
  "id": "rainbow",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "effect",
  "language": "lua",
  "entry": "main.lua",
  "category": "meta.category",
  "icon": "Waves",
  "permissions": ["log"],
  "params": [
    {
      "key": "speed",
      "label": "params.speed",
      "group": "params.groups.animation",
      "kind": "slider",
      "default": 2.5,
      "min": 0.0,
      "max": 5.0,
      "step": 0.1
    },
    {
      "key": "preset",
      "label": "params.preset",
      "kind": "select",
      "default": 0,
      "options": [
        {"label": "Custom", "value": 0},
        {"label": "Rainbow", "value": 1}
      ]
    },
    {
      "key": "colors",
      "label": "params.colors",
      "kind": "multi-color",
      "default": ["#FF0000", "#00FF00", "#0000FF"],
      "minCount": 2,
      "maxCount": 16,
      "dependency": {
        "key": "preset",
        "equals": 0,
        "behavior": "hide"
      }
    }
  ]
}
```

---

## 扩展特有字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | string | ❌ | 内嵌 HTML 页面的路径（如 `"page/dist/index.html"`） |

### 示例（扩展）

```json
{
  "id": "openrgb",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["network:tcp", "process", "log"],
  "publisher": "Skydimo",
  "page": "page/dist/index.html"
}
```

---

## 国际化（i18n）键

`name`、`description`、`label`、`category` 和 `group` 等字段可使用 i18n 键代替字面字符串。使用键值时，Skydimo 会从插件的 `locales/` 目录中解析翻译。

详情请参阅[国际化](i18n)。
