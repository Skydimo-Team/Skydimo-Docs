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
| `type` | string | ✅ | 插件类型：`"controller"`、`"effect"`、`"extension"` 或 `"pack"` |
| `language` | string | 运行时插件必填 | 运行时语言。使用 `"lua"` 或 `"native-c"`；Core 也接受 `"c-abi"`、`"native"` 作为 native-c 别名。 |
| `abi` | string | native-c 必填 | 原生 ABI 标识符，例如 `"skydimo-effect-c-v3"` |
| `entry` | string 或 object | 运行时插件必填 | 运行时入口。Lua 使用脚本路径；native-c 可使用共享库路径或平台入口映射。 |
| `permissions` | string[] | ❌ | 所需权限列表 |
| `locales` | object | ❌ | 以 locale 代码为键的内联本地化词典 |
| `publisher` | string | ✅ | 作者或组织名称 |
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

### Entry 平台映射

`entry` 可以是单个相对路径，也可以是平台映射。native-c 插件推荐使用平台映射：

```json
{
  "entry": {
    "windows-x86_64": "native/windows-x86_64/my_plugin.dll",
    "linux-x86_64": "native/linux-x86_64/libmy_plugin.so",
    "macos-aarch64": "native/macos-aarch64/libmy_plugin.dylib",
    "default": "native/windows-x86_64/my_plugin.dll"
  }
}
```

支持的平台键包括 `windows-x86_64`、`windows-aarch64`、`linux-x86_64`、`linux-aarch64`、`macos-x86_64` 和 `macos-aarch64`。`default` 是可选回退。入口路径必须相对于插件目录，不能包含 `..` 或绝对路径前缀。

### 示例（Native-C）

```json
{
  "id": "my_native_effect",
  "version": "1.0.0",
  "name": "My Native Effect",
  "type": "effect",
  "language": "native-c",
  "abi": "skydimo-effect-c-v3",
  "entry": {
    "windows-x86_64": "native/windows-x86_64/my_native_effect.dll",
    "linux-x86_64": "native/linux-x86_64/libmy_native_effect.so",
    "macos-aarch64": "native/macos-aarch64/libmy_native_effect.dylib",
    "default": "native/current/libmy_native_effect.so"
  },
  "permissions": ["log"],
  "publisher": "Your Name"
}
```

### 插件包组 Manifest

包组 manifest 用于组织子插件，不需要 `language`、`abi` 或 `entry`。Core 会读取 `id`、`name`、`publisher`、`type: "pack"` 和 `plugins`；`version` 建议用于分发元数据。

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

包组插件路径必须留在包组目录内。嵌套包组会被忽略。

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
| `interface_number` | number | USB 接口号（可选）。指定后 Core 仅匹配该接口号。对于 HID，用于过滤多接口设备中的特定 HID 集合；对于串口（CDC），用于识别复合设备中的特定 CDC 接口。省略则匹配所有接口。 |

:::tip
对于暴露多个接口的 HID 设备（例如键盘的输入端点和灯控端点分别在不同接口上），在匹配规则中指定 `interface_number` 可以让 Core 在匹配阶段就完成过滤——**在 `on_validate()` 被调用之前**——避免不必要的设备句柄打开和重复认领。

这套 HID 用法已经过验证，也是多接口 HID 设备的推荐做法。
:::

:::warning
以下警告**仅适用于串口（CDC）匹配**。HID 的 `interface_number` 匹配已经过验证。

串口 `interface_number` 匹配尚未在生产环境中得到验证，**不推荐使用**。在 **3.0.1** 及更高版本中可用。
:::

### 示例（串口控制器）

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

### 示例（串口控制器，带 interface_number）

:::warning 尚未验证
串口 `interface_number` 匹配尚未在生产环境中得到验证，**不推荐使用**。在 **3.0.1** 及更高版本中可用。
:::

```json
{
  "id": "my_composite_serial",
  "version": "1.0.0",
  "name": "Composite Serial Controller",
  "type": "controller",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["serial:read", "serial:write", "log"],
  "match": {
    "protocol": "serial",
    "baud_rate": 115200,
    "rules": [
      { "vid": "0x1A86", "pid": "0x7523", "interface_number": 1 }
    ]
  }
}
```

### 示例（HID 控制器，带 interface_number）

```json
{
  "id": "my_hid_keyboard",
  "version": "1.0.0",
  "name": "My HID Keyboard",
  "type": "controller",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["hid:read", "hid:write", "log"],
  "match": {
    "protocol": "hid",
    "timeout_ms": 200,
    "rules": [
      { "vid": "0x1532", "pid": "0x024E", "interface_number": 3 },
      { "vid": "0x1532", "pid": "0x0293", "interface_number": 2 }
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

## 原生库配置

> **自 `3.0.0-dev.3` 起支持**

可选的 `native` 对象用于控制插件运行时如何加载原生（C/Rust/…）Lua 模块及其共享库依赖。所有路径均相对于插件目录，且不能逃出插件目录（禁止 `..` 或绝对路径）。

本节只适用于通过 Lua `require()` 加载 C 模块的 Lua 插件。它不同于 `native-c` 运行时；在 `native-c` 中，插件入口本身就是共享库。详情请参阅 [Native-C 插件运行时](native-c-plugin)。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `native.module_dirs` | string[] | `[".", "lib"]` | 追加到 `package.cpath` 的额外目录，使 Lua `require()` 能找到 `.dll` / `.so` C 模块。 |
| `native.dll_dirs` | string[] | `[".", "lib", "bin"]` | 注册为 DLL 搜索路径的额外目录（Windows：`AddDllDirectory`），影响传递依赖的解析。 |
| `native.preload_dlls` | string[] | `[]` | 在插件入口脚本运行**之前**必须加载的 DLL 文件相对路径。用于满足无法通过常规搜索路径加载的依赖。 |

:::note
`module_dirs` 和 `dll_dirs` 始终包含其默认值（`"."`、`"lib"`、`"bin"`），声明的额外路径在其基础上追加。
:::

:::caution 仅 Windows 有效
`dll_dirs` 和 `preload_dlls` 仅在 Windows 平台生效。其他平台上这些字段会被接受但静默忽略。
:::

:::tip 需要声明权限
使用 `native` 配置的插件必须在 `permissions` 数组中包含 `"native"`。
:::

### 示例（扩展，带原生 DLL 预加载）

```json
{
  "id": "signalrgb_bridge",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["hardware:hid", "native", "system:info"],
  "native": {
    "preload_dlls": ["lua54.dll", "libmcfgthread-2.dll"]
  }
}
```

### 示例（扩展，自定义模块与 DLL 搜索目录）

```json
{
  "id": "my_native_extension",
  "version": "1.0.0",
  "name": "My Native Extension",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["native", "log"],
  "native": {
    "module_dirs": ["native/modules"],
    "dll_dirs": ["native/deps"],
    "preload_dlls": ["native/deps/libfoo.dll"]
  }
}
```

---

## 扩展特有字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | string | ❌ | 内嵌 HTML 页面的路径（如 `"page/dist/index.html"`）。仅桌面应用。 |
| `page_url` | string | ❌ | 扩展页面的外部 URL（如 `"http://localhost:5173"`）。同时支持桌面应用和浏览器。 |

:::info 版本
`page_url` 自 **3.0.0-dev.4** 起支持。
:::

:::caution
`page` 和 `page_url` **互斥** —— 不得同时声明。`page_url` 必须使用 `http://` 或 `https://` 协议。
:::

### 示例（扩展，本地页面）

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

### 示例（扩展，外部 URL 页面）

```json
{
  "id": "my_extension",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["log"],
  "publisher": "Skydimo",
  "page_url": "http://localhost:5173"
}
```

---

## 国际化（i18n）键

`name`、`description`、`label`、`category` 和 `group` 等字段可使用 i18n 键代替字面字符串。请把翻译直接放在 `manifest.json` 顶层的 `locales` 对象中。

详情请参阅[国际化](i18n)。
