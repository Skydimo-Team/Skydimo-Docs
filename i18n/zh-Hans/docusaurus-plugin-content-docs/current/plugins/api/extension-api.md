---
sidebar_position: 3
---

# 扩展 API 参考

扩展插件中可用的 `ext` 全局对象完整参考。

## 属性

### ext.data_dir

插件的持久化数据目录路径。用于存储配置文件、缓存等。

```lua
local config_path = ext.data_dir .. "/config.json"
```

---

### ext.resource_dir

插件资源目录路径。用于读取随插件包分发的只读资源。

```lua
local icon_path = ext.resource_dir .. "/icons/device.png"
```

---

### ext.plugin

只读表，包含当前扩展插件的元数据，来自 `manifest.json` 的声明。

```lua
local p = ext.plugin

ext.log(p.id)           -- 插件 ID，如 "extension.my_plugin"
ext.log(p.name.raw)     -- 显示名称（原始字符串）
ext.log(p.version)      -- 版本字符串，如 "1.0.0"
ext.log(p.publisher)    -- 作者名称
ext.log(p.type)         -- 始终为 "extension"

-- 可选字段（未在 manifest 中声明则为 nil）
if p.description then
    ext.log(p.description.raw)
end
if p.repository then
    ext.log(p.repository)
end
if p.license then
    ext.log(p.license)
end
if p.page_path then
    ext.log(p.page_path)
end
if p.page_url then
    ext.log(p.page_url)
end
```

| 字段 | 类型 | 说明 |
|-------|------|------|
| `id` | string | 插件 ID |
| `name` | [LocalizedText](../../api/data-types.md#localizedtext) | 插件显示名称 |
| `version` | string | 插件版本 |
| `publisher` | string | 插件作者 |
| `permissions` | string[] | 已声明的权限列表 |
| `type` | string | 始终为 `"extension"` |
| `description` | LocalizedText? | 插件描述（未设置则为 `nil`） |
| `repository` | string? | 源代码仓库 URL（未设置则为 `nil`） |
| `license` | string? | 许可证标识符（未设置则为 `nil`） |
| `page_path` | string? | 扩展 HTML 页面的相对路径（未设置则为 `nil`） |
| `page_url` | string? | 外部扩展页面 URL（未设置则为 `nil`） |

---

## 系统信息

:::info 版本
自 **3.0.0-dev.2** 起支持。需要声明 `"system:info"` 权限。
:::

当插件声明 `"system:info"` 权限时，会注入一个只读的 `ext.system` 表，包含硬件与操作系统详情。

### ext.system

```lua
local sys = ext.system

-- 操作系统
sys.os.platform    -- "Windows" | "macOS" | "linux"
sys.os.version     -- 如 "Microsoft Windows 11 Pro"
sys.os.build       -- 如 "22631"
sys.os.arch        -- 如 "x86_64"
sys.os.hostname    -- 如 "MY-PC"

-- 主板
sys.motherboard.manufacturer   -- 如 "ASUSTeK COMPUTER INC."
sys.motherboard.model          -- 如 "ROG STRIX B550-F GAMING"
sys.motherboard.product        -- 同 model
sys.motherboard.serial_number  -- 主板序列号

-- BIOS
sys.bios.vendor    -- 如 "American Megatrends Inc."
sys.bios.version   -- 如 "2803"
sys.bios.date      -- 如 "12/01/2023"

-- CPU
sys.cpu.name            -- 如 "AMD Ryzen 9 5900X 12-Core Processor"
sys.cpu.manufacturer    -- 如 "AMD"
sys.cpu.cores           -- 物理核心数
sys.cpu.threads         -- 逻辑线程数
sys.cpu.base_clock_mhz  -- 基础频率（MHz）
sys.cpu.architecture    -- 如 "x64"

-- GPU（数组，1-indexed）
for i, gpu in ipairs(sys.gpu) do
    gpu.name              -- 如 "NVIDIA GeForce RTX 3080"
    gpu.manufacturer      -- 如 "NVIDIA"
    gpu.driver_version    -- 如 "537.58"
    gpu.vram_mb           -- 显存大小（MB）
end

-- 内存
sys.ram.total_memory_mb  -- 总物理内存（MB）
for i, m in ipairs(sys.ram.modules) do
    m.manufacturer   -- 内存条制造商
    m.part_number    -- 内存条型号
    m.capacity_mb    -- 内存条容量（MB）
    m.speed_mhz      -- 内存频率（MHz）
    m.form_factor    -- 如 "DIMM"、"SO-DIMM"
end
```

### ext.get_system_info()

返回与 `ext.system` 相同结构的最新系统信息表。需要 `"system:info"` 权限。

---

## 工具函数

### ext.json_encode(value)

:::info 版本
自 **3.0.0-dev.3** 起支持。
:::

将 Lua 表格或值编码为 JSON 字符串。

```lua
local json_str = ext.json_encode({ hello = "world", count = 5 })
```

### ext.json_decode(json_string)

:::info 版本
自 **3.0.0-dev.3** 起支持。
:::

将 JSON 字符串解码为 Lua 表格或值。

```lua
local data = ext.json_decode('{"hello": "world"}')
ext.log(data.hello)
```

### ext.sleep(ms)

休眠指定毫秒数。

```lua
ext.sleep(1000)  -- 休眠 1 秒
```

---

## Core 运行时与管理

这些 API 暴露 Core 级状态，面向可信管理扩展。除特别说明外，不需要额外权限。

会修改插件文件的管理调用带有运行时保护：

- `ext.import_plugin_package()` 和 `ext.install_plugins()` 在简单模式下不可用。
- `ext.install_plugins()`、`ext.delete_plugin()`、`ext.reset_plugin()` 和 `ext.refresh_plugins()` 会在插件启动状态仍为 `pending` 或 `running` 时失败。
- `ext.set_controller_plugins_enabled()`、`ext.set_effect_plugins_enabled()` 和 `ext.set_extension_plugins_enabled()` 会立即更新启用状态；它们不会导入或删除插件文件。

### ext.get_core_config_dir()

返回 Core 配置目录路径。

```lua
local dir = ext.get_core_config_dir()
```

### ext.open_core_config_dir()

确保 Core 配置目录存在并返回路径。在 Lua Host 中，此函数不会打开系统文件管理器。

### ext.get_plugin_dir()

返回托管插件总目录。

### ext.open_plugin_dir([plugin_id])

确保并返回插件总目录，或指定 `plugin_id` 的解析目录。

### ext.open_plugin_data_dir(plugin_id)

确保并返回指定插件的运行时数据目录。

### ext.get_startup_status()

返回 Core 启动任务状态：

```json
{
  "plugins": {"state": "complete", "detail": null, "progress": null},
  "deviceDiscovery": {"state": "complete"},
  "extensions": {"state": "running"}
}
```

`state` 可能是 `pending`、`running`、`complete` 或 `failed`。

### ext.get_plugins()

返回与 WebSocket [`get_plugins`](../../api/commands/plugins#get_plugins) 命令相同的 `PluginsResponse` 结构。

### ext.import_plugin_package(file_name, data_base64)

从 Base64 包字节创建插件包导入会话。返回 `{sessionId, sourceName, plugins}`。

### ext.install_plugins(session_id, plugin_ids)

从插件包导入会话中安装选定插件 ID。Core 会在修改文件前释放运行中的插件，随后重载注册表，尽可能恢复启用状态，重启受影响的运行时部分，并发送插件/设备事件。

### ext.cancel_plugin_import(session_id)

取消并清理插件包导入会话。

### ext.delete_plugin(plugin_id [, delete_data])

删除已安装的包插件副本。打包插件和开发插件不可直接删除；若要移除已安装覆盖或清理数据，请使用 `ext.reset_plugin()`。

### ext.reset_plugin(plugin_id [, reset_data])

移除已安装的覆盖副本，并可选删除运行时数据。如果存在打包版本，它会重新生效。

### ext.refresh_plugins()

从磁盘重载插件注册表，重启已启用扩展，重新扫描设备，重启活动 Runner，并发送 `plugins-changed`。插件包字节通过 `ext.import_plugin_package()` 和 `ext.install_plugins()` 安装，不由刷新处理。

### ext.set_controller_plugins_enabled(plugin_ids, enabled)

启用或禁用控制器插件。禁用控制器插件会断开当前由该插件管理的设备。

```lua
ext.set_controller_plugins_enabled({"skydimo_serial"}, false)
```

### ext.set_effect_plugins_enabled(plugin_ids, enabled)

启用或禁用灯效插件，并通知 UI 插件元数据发生变化。

### ext.set_extension_plugins_enabled(plugin_ids, enabled)

启用或禁用扩展插件。被禁用的运行中扩展会停止，新启用的扩展会启动。

### ext.get_shortcuts_config()

返回持久化的全局快捷键绑定：

```json
{
  "bindings": [
    {"action": "toggle_all_lights", "accelerator": "CommandOrControl+Shift+L"}
  ]
}
```

### ext.set_shortcuts_config(config)

更新全局快捷键绑定，并返回规范化后的持久化配置。

### ext.set_locale(locale)

设置 Core 当前语言，并发送 `locale-changed`。

### ext.get_capture_config()

返回全局屏幕捕获配置：

```json
{
  "maxPixels": 921600,
  "fps": 30,
  "method": "dxgi",
  "samplingLocked": false
}
```

### ext.get_capture_max_pixels()

返回当前屏幕捕获像素预算。`0` 表示不限制。

### ext.set_capture_max_pixels(max_pixels)

设置屏幕捕获像素预算并返回完整捕获配置。简单模式下可能因采样分辨率锁定而失败。

### ext.get_capture_fps()

返回配置的屏幕捕获帧率。

### ext.set_capture_fps(fps)

设置屏幕捕获帧率，最小为 `1`，并返回完整捕获配置。简单模式下可能因采样帧率锁定而失败。

### ext.get_capture_method()

返回当前捕获后端，例如不同平台上的 `dxgi`、`gdi`、`graphics`、`xcap` 或 `screencapturekit`。

### ext.set_capture_method(method)

设置当前捕获后端并返回完整捕获配置。

---

## 日志

### ext.trace(msg)

记录 trace 级别日志。

```lua
ext.trace("USB 扫描 tick")
```

### ext.debug(msg)

记录 debug 级别日志。

```lua
ext.debug("匹配到一个 VID/PID 候选设备")
```

### ext.info(msg)

记录 info 级别日志。

```lua
ext.info("扩展已初始化")
```

### ext.log(msg)

`ext.info(msg)` 的兼容别名。

```lua
ext.log("扩展已初始化")
```

### ext.warn(msg)

记录 warning 级别日志。

```lua
ext.warn("设备无响应，正在重试...")
```

### ext.error(msg)

记录 error 级别日志。

```lua
ext.error("连接失败: " .. err)
```

---

## 通知

### ext.notify(title, description [, level])

向用户显示 Toast 通知。

```lua
ext.notify("发现设备", "Corsair Vengeance RGB 已连接")
ext.notify("警告", "连接不稳定", "warning")
ext.notify("完成", "固件更新成功", "success")
```

- `level` —— `"info"`（默认）、`"success"`、`"warning"` 或 `"error"`
- `title` 和 `description` 可以是字符串、manifest i18n key，或本地化文本表。

```lua
ext.notify(
    { key = "notifications.connected.title", fallback = "已连接" },
    {
        key = "notifications.connected.description",
        fallback = "已连接到 {server}",
        args = { server = "OpenRGB" },
    },
    "success"
)
```

### ext.notify_persistent(id, title, description)

显示持久通知，保持显示直到被关闭。通知级别始终为 `"info"`。

如果已存在相同 `id` 的持久通知，其标题和描述将被就地更新。

`title` 和 `description` 支持与 `ext.notify()` 相同的字符串、manifest key 和本地化文本表写法。

```lua
ext.notify_persistent("conn_status", "正在连接...", "尝试连接到服务器")

-- 更新已有通知
ext.notify_persistent("conn_status", "已连接", "成功连接到服务器")
```

### ext.dismiss_persistent(id)

关闭持久通知。

```lua
ext.dismiss_persistent("conn_status")
```

---

## 设备管理

### ext.register_device(config)

在 Skydimo 中注册虚拟设备。

```lua
local port = ext.register_device({
    controller_port = "bridge://device_0",
    device_path = "bridge://device_0",   -- 可选，默认为 controller_port
    nickname = "我的设备",                -- 可选
    manufacturer = "Vendor",
    model = "Device Name",
    serial_id = "SN123456",
    description = "RGB 控制器",
    controller_id = "extension.my_bridge",
    device_type = "light",
    image_url = "https://example.com/device.png",  -- 可选
    outputs = {
        {
            id = "zone0",
            name = "主区域",
            leds_count = 144,
            output_type = "linear",    -- "single"、"linear"、"matrix"
            editable = false,
            min_total_leds = 1,
            max_total_leds = 300,
            allowed_total_leds = {30, 60, 144},  -- 可选：限制为特定数量
            matrix = nil,              -- 或 {width, height, map}
            default_effect = "rainbow_wave",  -- 可选
        }
    }
})
```

:::info 版本
`default_effect` 字段自 **3.0.0-dev.4** 起支持。设置后，当该输出端口不存在用户配置时，此灯效将被自动应用。
:::

**返回**：`string` —— 该设备的控制器端口标识符。

### ext.remove_extension_device(port)

移除之前注册的虚拟设备。

```lua
ext.remove_extension_device("bridge://device_0")
```

### ext.set_device_nickname(port, nickname)

为设备设置自定义显示名称。

```lua
ext.set_device_nickname("bridge://device_0", "客厅灯带")
```

### ext.get_devices()

获取系统中的所有设备。

```lua
local devices = ext.get_devices()
for _, dev in ipairs(devices) do
    ext.log("设备: " .. dev.port .. " - " .. dev.model)
end
```

### ext.get_device_info(port)

获取特定设备的详细信息。

```lua
local info = ext.get_device_info("COM3")
if info then
    ext.log("型号: " .. info.model)
end
```

### ext.scan_devices()

立即触发一次手动设备扫描。

```lua
ext.scan_devices()
```

### ext.get_device_config(port)

返回当前连接在 `port` 上的设备持久化配置。

```lua
local result = ext.get_device_config("COM3")
ext.log(result.deviceId)
-- result.config 包含持久化设备配置
```

### ext.set_device_controller(port, controller_id)

为设备覆盖选择控制器插件。传入 `nil` 可清除覆盖。

```lua
ext.set_device_controller("COM3", "skydimo_serial")
ext.set_device_controller("COM3", nil)
```

### ext.set_device_conflict_warning_ignored(port, ignored)

设置是否忽略设备重复/冲突警告。

### ext.update_device_settings(port, settings)

替换控制器设备的设置 JSON。

```lua
ext.update_device_settings("COM3", {pollIntervalMs = 250})
```

---

## 输出管理

### ext.set_output_leds_count(port, output_id, count)

修改输出端口的 LED 数量。

```lua
ext.set_output_leds_count("bridge://device_0", "zone0", 120)
```

### ext.update_output(port, output_id, config)

更新输出端口的配置。

```lua
ext.update_output("bridge://device_0", "zone0", {
    leds_count = 144,
    matrix = {width = 12, height = 12, map = {...}}
})
```

### ext.set_output_nickname(port, output_id, nickname)

设置或清除输出端口的自定义显示名称。

```lua
ext.set_output_nickname("COM3", "out1", "桌面灯带")
ext.set_output_nickname("COM3", "out1", nil)
```

### ext.set_output_segments(port, output_id, segments)

替换输出端口的分区定义。`segments` 必须匹配 Core 的 `SegmentDefinition` JSON 结构。

```lua
ext.set_output_segments("COM3", "out1", {
    {id = "left", name = "左侧", leds_count = 30, segment_type = "Linear"},
    {id = "right", name = "右侧", leds_count = 30, segment_type = "Linear"},
})
```

`segment_type` 可为 `Single`、`Linear`、`Matrix` 或 `Preset`。矩阵和预设分区可包含 `matrix` 映射；任意分区可包含 `image_url` 和布局 `transform`。

### LED 编辑预览

这些函数驱动与 UI 相同的临时 LED 布局预览系统。`session_id` 标识某个输出端口上的一次预览会话。

```lua
local session = "my-preview-1"
ext.begin_led_edit_preview("COM3", "out1", session)
ext.update_led_edit_preview("COM3", "out1", session, 0, {
    {r = 255, g = 0, b = 0},
    {r = 0, g = 255, b = 0},
})
ext.keepalive_led_edit_preview("COM3", "out1", session)
ext.end_led_edit_preview("COM3", "out1", session)
```

- `offset` 以 0 为基准，且必须非负。
- `colors` 是 `{r,g,b}` 颜色对象数组。
- 如果 `offset` 或预览分片超过 `65,536` 颗 LED，Core 会拒绝。

---

## LED 锁定与直接控制

### ext.lock_leds(port, output_id, indices)

锁定特定 LED 进行直接控制，覆盖当前活跃灯效。

```lua
local locked, rejected = ext.lock_leds("COM3", "out1", {0, 1, 2, 3, 4})
ext.log("已锁定: " .. locked .. ", 被拒绝: " .. rejected)
```

- `indices` —— 以 0 为基准的 LED 索引数组

**返回**：`integer, integer` —— `(locked_count, rejected_count)`。如果 LED 已被其他扩展锁定，可能会被拒绝。

### ext.unlock_leds(port, output_id, indices)

释放 LED 锁定。

```lua
ext.unlock_leds("COM3", "out1", {0, 1, 2, 3, 4})
```

### ext.set_leds(port, output_id, colors)

对锁定的 LED 设置颜色。

**基于索引的格式：**

```lua
ext.set_leds("COM3", "out1", {
    {0, 255, 0, 0},     -- {index, r, g, b}
    {1, 0, 255, 0},
    {2, 0, 0, 255},
})
```

**平铺 RGB 格式：**

```lua
ext.set_leds("COM3", "out1", {255, 0, 0, 0, 255, 0, 0, 0, 255})
-- 设置 LED 0=红, LED 1=绿, LED 2=蓝
```

### ext.get_led_locks([port [, output_id]])

查询当前 LED 锁定状态。

```lua
local all_locks = ext.get_led_locks()
local device_locks = ext.get_led_locks("COM3")
local output_locks = ext.get_led_locks("COM3", "out1")
```

---

## 灯效管理

### ext.get_effects()

获取所有可用的灯效（内置 + 插件灯效）。

```lua
local effects = ext.get_effects()
for _, effect in ipairs(effects) do
    ext.log("灯效：" .. effect.id .. " - " .. effect.name.raw)
end
```

返回数组中每个元素的字段如下：

| 字段 | 类型 | 说明 |
|-------|------|------|
| `id` | string | 灯效插件 ID |
| `name` | [LocalizedText](../../api/data-types.md#localizedtext) | 灯效显示名称 |
| `description` | LocalizedText? | 简短描述（未设置则为 `nil`） |
| `group` | LocalizedText? | 分类/分组名称（未设置则为 `nil`） |
| `icon` | string? | 图标标识符（未设置则为 `nil`） |

### ext.get_effect_params(effect_id)

获取灯效的参数 schema。

```lua
local params = ext.get_effect_params("rainbow")
```

### ext.set_effect(port, output_id, effect_id [, params [, options]]) {#extset_effectport-output_id-effect_id--params}

:::note 旧版接口
这是一个旧版便捷封装。新插件建议使用 [`ext.set_scope_effect(scope, ...)`](#extsetscopeeffectscope-effect_id-params)，后者支持 `segment_id`。
:::

在设备输出端口上设置活跃灯效。

```lua
ext.set_effect("COM3", "out1", "rainbow")
ext.set_effect("COM3", "out1", "rainbow", {speed = 3.0, preset = 1})
ext.set_effect("COM3", "out1", "rainbow", nil, {skip_transition = true})
```

可选 `options` 表与 `ext.set_scope_effect` 使用相同的[过渡选项](#过渡选项)。如果只需要传入选项，请将 `params` 位置传为 `nil`。

---

## 资源查询

:::info 版本
自 **3.0.0-dev.3** 起支持。
:::

### ext.get_media_session([max_edge])

:::note
也可以通过 `ext.get_current_media()` 调用。
:::

需要 `"media:session"` 权限。

获取当前系统媒体播放会话的快照，包括元数据、播放状态、进度条时间线以及专辑封面。

```lua
local session = ext.get_media_session(256) -- 可选: 封面图片的最大边长参数
if session then
    ext.log("正在播放: " .. session.title .. " (" .. session.artist .. ")")
    ext.log("状态: " .. session.playback_status)
    if session.artwork then
        ext.log("封面尺寸: " .. session.artwork.width .. "x" .. session.artwork.height)
    end
end
```

**返回**：一个媒体会话对象，若无活跃播放会话则返回 `nil`。

### ext.get_displays()

获取所有已连接显示器的列表。

```lua
local displays = ext.get_displays()
for _, d in ipairs(displays) do
    ext.log("显示器: " .. d.name .. " [" .. d.width .. "x" .. d.height .. "]")
end
```

**返回**：显示器对象数组。

### ext.get_audio_devices()

获取所有音频输出设备的列表。

```lua
local devices = ext.get_audio_devices()
for i, dev in ipairs(devices) do
    ext.log(i .. ": " .. dev.name)
end
```

**返回**：音频设备对象数组。

---

## 系统状态

:::info 版本
自 **3.0.0-dev.3** 起支持。
:::

系统状态 API 允许扩展监控操作系统级别的状态，例如运行中的进程和当前聚焦窗口。每个主题需要对应的权限。

:::note 平台支持
系统状态监控目前仅支持 **Windows**。在不支持的平台上，主题显示 `supported = false` 并返回空数据。
:::

### ext.list_system_state_topics()

列出本扩展可用的系统状态主题，根据已声明的权限进行过滤。

```lua
local topics = ext.list_system_state_topics()
for _, topic in ipairs(topics) do
    ext.log(topic.id .. " supported=" .. tostring(topic.supported))
end
```

**返回**：主题信息对象数组：

| 字段 | 类型 | 说明 |
|-------|------|------|
| `id` | string | 主题标识符（`"process"`、`"window_focus"`） |
| `permission` | string | 该主题所需的权限 |
| `supported` | boolean | 该主题在当前平台是否受支持 |

### ext.get_system_state(topic)

获取指定主题的当前状态快照。

- `topic` — 主题标识符字符串。

```lua
local state = ext.get_system_state("process")
local focus = ext.get_system_state("window_focus")
```

**返回**：快照表格（结构取决于主题）。若主题未知或未声明所需权限则抛出错误。

#### 主题：`process`

需要 `"system:process"` 权限。

**快照** (`ext.get_system_state("process")`):

| 字段 | 类型 | 说明 |
|-------|------|------|
| `supported` | boolean | 当前平台是否支持进程监控 |
| `apps` | array | 运行中的应用程序列表 |
| `apps[].name` | string | 应用程序可执行文件名（小写、已去除首尾空格） |
| `apps[].instance_count` | integer | 运行实例数 |

**变化事件** (`on_system_state_changed("process", data)`):

| 字段 | 类型 | 说明 |
|-------|------|------|
| `supported` | boolean | 是否支持进程监控 |
| `apps` | array | 当前运行中的应用程序完整列表 |
| `changes` | array | 实例数发生变化的应用程序列表 |
| `changes[].name` | string | 应用程序可执行文件名 |
| `changes[].previous_instance_count` | integer | 变化前的实例数 |
| `changes[].current_instance_count` | integer | 变化后的实例数 |

```lua
-- 快照
local state = ext.get_system_state("process")
for _, app in ipairs(state.apps) do
    ext.log(app.name .. ": " .. app.instance_count)
end

-- 变化回调
function plugin.on_system_state_changed(topic, data)
    if topic == "process" then
        for _, c in ipairs(data.changes) do
            ext.log(c.name .. ": " .. c.previous_instance_count .. " → " .. c.current_instance_count)
        end
    end
end
```

#### 主题：`window_focus`

需要 `"system:window-focus"` 权限。

**快照** (`ext.get_system_state("window_focus")`):

| 字段 | 类型 | 说明 |
|-------|------|------|
| `supported` | boolean | 当前平台是否支持窗口焦点监控 |
| `current` | object? | 当前聚焦窗口，若无则为 `nil` |
| `current.app_name` | string? | 应用程序可执行文件名（小写） |
| `current.window_title` | string? | 窗口标题文本 |

**变化事件** (`on_system_state_changed("window_focus", data)`):

| 字段 | 类型 | 说明 |
|-------|------|------|
| `supported` | boolean | 是否支持窗口焦点监控 |
| `reason` | string | 变化原因：`"snapshot"`、`"foreground_changed"` 或 `"title_changed"` |
| `current` | object? | 当前聚焦窗口，若无则为 `nil` |
| `previous` | object? | 之前聚焦的窗口，若无则为 `nil` |

```lua
-- 快照
local focus = ext.get_system_state("window_focus")
if focus.current then
    ext.log("当前聚焦应用: " .. (focus.current.app_name or "未知"))
    ext.log("窗口标题: " .. (focus.current.window_title or ""))
end

-- 变化回调
function plugin.on_system_state_changed(topic, data)
    if topic == "window_focus" then
        ext.log("焦点变化原因: " .. data.reason)
        if data.current then
            ext.log("当前: " .. (data.current.app_name or ""))
        end
        if data.previous then
            ext.log("之前: " .. (data.previous.app_name or ""))
        end
    end
end
```

---

## Scope API

:::info 版本
自 **3.0.0-dev.3** 起支持。
:::

所有 scope 函数的第一个参数均为 **scope 表**：

```lua
-- scope 表结构
local scope = {
    port       = "COM3",       -- 必填：设备端口
    output_id  = "out1",       -- 可选：指定输出端口
    segment_id = "seg0",       -- 可选：指定分段（需同时提供 output_id）
}
```

从 JSON 风格代码传入表时，Host 也接受 `outputId` 与 `segmentId`。

### 关联控制

关联控制会把大多数灯效、亮度与媒体来源变更重定向到共享根状态，并同步到全部设备。

#### ext.get_linked_control()

返回 `{enabled, state}`，其中 `state` 是共享关联控制配置。

```lua
local linked = ext.get_linked_control()
if linked.enabled then
    ext.log("共享灯效: " .. tostring(linked.state.selected))
end
```

#### ext.set_linked_control(enabled [, source])

启用或禁用关联控制。启用时，如果提供 `source`，Core 会从该 scope 快照状态；否则使用第一个可用的关联控制快照。

```lua
ext.set_linked_control(true, {port = "COM3", output_id = "out1"})
ext.set_linked_control(false)
```

关联控制开启时，以下 API 会更新共享状态并应用到全部设备：`set_scope_effect`、`update_scope_effect_params`、`reset_scope_effect_params`、`set_scope_mode_paused`、`set_scope_brightness`、`set_scope_screen_index`、`set_scope_screen_region`、`set_scope_audio_device_index` 与音频预处理设置 API。

#### ext.set_all_devices_power(is_off)

设置所有设备电源并持久化。返回受影响端口。

```lua
local affected = ext.set_all_devices_power(true)
```

#### ext.flip_scope_layout(scope, axis)

翻转某个 scope 的 LED 布局。`axis` 必须是 `"horizontal"` 或 `"vertical"`。

```lua
ext.flip_scope_layout({port = "COM3", output_id = "matrix"}, "horizontal")
```

### Scope 状态查询

#### ext.get_scope_screen_state(scope)

获取指定 scope 的屏幕捕获状态（当前选择的屏幕索引及捕获区域）。

```lua
local state = ext.get_scope_screen_state({port = "COM3", output_id = "out1"})
-- state.screen_index, state.region ...
```

#### ext.get_scope_audio_device_state(scope)

获取指定 scope 当前分配的音频设备索引。

```lua
local index = ext.get_scope_audio_device_state({port = "COM3", output_id = "out1"})
```

#### ext.get_scope_audio_device_index(scope)

`ext.get_scope_audio_device_state(scope)` 的别名。

#### ext.get_scope_audio_processing_settings(scope)

获取某个 scope 的选中值与生效音频预处理设置。

```lua
local state = ext.get_scope_audio_processing_settings({port = "COM3"})
-- state.value / state.effective_value 包含 AudioProcessingSettings
```

---

### Scope 媒体管理

#### ext.set_scope_screen_index(scope, screen_index)

设置 scope 用于屏幕捕获灯效的显示器索引。

- `screen_index` —— 以 0 为基准的显示器索引，或 `nil` 使用默认值。

```lua
ext.set_scope_screen_index({port = "COM3", output_id = "out1"}, 0)
ext.set_scope_screen_index({port = "COM3", output_id = "out1"}, nil) -- 重置
```

#### ext.set_scope_screen_region(scope, region)

设置 scope 的屏幕捕获区域。

- `region` —— `ScreenRegion` 表：`{x, y, width, height}`。

```lua
ext.set_scope_screen_region({port = "COM3", output_id = "out1"}, {
    x = 0, y = 0, width = 1920, height = 1080
})
```

#### ext.set_scope_audio_device_index(scope, audio_device_index)

设置 scope 用于音频响应灯效的音频设备索引。

- `audio_device_index` —— 以 0 为基准的设备索引，或 `nil` 使用默认值。

```lua
ext.set_scope_audio_device_index({port = "COM3", output_id = "out1"}, 0)
```

#### ext.set_scope_audio_processing_settings(scope, settings)

设置某个 scope 的音频预处理设置。

```lua
ext.set_scope_audio_processing_settings({port = "COM3", output_id = "out1"}, {
    amplitude = 120,
    averageMode = "binning",
    averageSize = 8,
    windowMode = "hann",
    decay = 80,
    filterConstant = 1.0,
    normalizationOffset = 0.04,
    normalizationScale = 0.5,
})
```

`averageMode` 可为 `binning` 或 `low_pass`；`windowMode` 可为 `none`、`hann`、`hamming` 或 `blackman`。简单模式下可能因音频预处理设置被锁定而失败。

#### ext.reset_scope_audio_processing_settings(scope)

将某个 scope 的音频预处理设置重置为默认值。

---

### Scope 模式管理

:::info 版本
`ext.set_scope_effect`、`ext.set_scope_power` 以及旧版 `ext.set_effect` 的可选过渡 `options` 表在 **3.0.2** 之后版本支持。
:::

#### 过渡选项

当灯效或电源变更需要立即生效，而不是使用默认灯效切换淡入淡出时，可以传入可选 `options` 表。该选项只影响当前这次调用，不会写入持久配置。

以下任意布尔字段设为 `true` 即可：

- `skip_transition`
- `skipTransition`
- `no_transition`
- `immediate`

```lua
local immediate = {skip_transition = true}

ext.set_scope_effect({port = "COM3", output_id = "out1"}, "rainbow", nil, immediate)
ext.set_scope_power({port = "COM3", output_id = "out1"}, false, {immediate = true})
```

#### ext.set_scope_effect(scope, effect_id [, params [, options]]) {#extsetscopeeffectscope-effect_id-params}

在 scope 上设置活跃灯效，支持 `segment_id`。

```lua
ext.set_scope_effect({port = "COM3", output_id = "out1"}, "rainbow")
ext.set_scope_effect(
    {port = "COM3", output_id = "out1", segment_id = "seg0"},
    "breathing",
    {speed = 2.0}
)
ext.set_scope_effect({port = "COM3", output_id = "out1"}, nil) -- 清除灯效
ext.set_scope_effect({port = "COM3", output_id = "out1"}, "rainbow", nil, {skipTransition = true})
```

#### ext.update_scope_effect_params(scope, params)

仅更新 scope 当前活跃灯效的参数，不更换灯效本身。

```lua
ext.update_scope_effect_params({port = "COM3", output_id = "out1"}, {
    speed = 5.0,
    color = {r = 255, g = 0, b = 0}
})
```

#### ext.update_effect_params(port, params)

旧版设备级封装，用于更新设备 scope 上的灯效参数。

```lua
ext.update_effect_params("COM3", {speed = 3})
```

#### ext.reset_scope_effect_params(scope)

将 scope 的灯效参数重置为默认值。

```lua
ext.reset_scope_effect_params({port = "COM3", output_id = "out1"})
```

#### ext.set_scope_mode_paused(scope, paused)

暂停或恢复 scope 上的活跃灯效。

```lua
ext.set_scope_mode_paused({port = "COM3", output_id = "out1"}, true)  -- 暂停
ext.set_scope_mode_paused({port = "COM3", output_id = "out1"}, false) -- 恢复
```

#### ext.set_scope_power(scope, is_off [, options])

开启或关闭 scope 的输出。

```lua
ext.set_scope_power({port = "COM3", output_id = "out1"}, true)  -- 关闭输出
ext.set_scope_power({port = "COM3", output_id = "out1"}, false) -- 开启输出
ext.set_scope_power({port = "COM3", output_id = "out1"}, false, {immediate = true})
```

#### ext.set_scope_brightness(scope, brightness)

设置 scope 的亮度级别（0–100）。

```lua
ext.set_scope_brightness({port = "COM3", output_id = "out1"}, 80)
```

#### ext.set_brightness(port, brightness)

旧版设备级封装，用于设置设备 scope 的亮度。

```lua
ext.set_brightness("COM3", 80)
```

---

## 网络

:::info 版本
全新的 `ext.net.*` 结构化 API 自 **3.0.0-dev.3** 起支持。
:::

根据使用的功能不同，需要 `"network"`、`"network:tcp"` 或 `"network:http"` 权限。

### HTTP 客户端 (`ext.net.http`)

需要 `"network:http"` 或 `"network"` 权限。

#### ext.net.http.request(options)

发起一次性 HTTP 请求。

```lua
local response = ext.net.http.request({
    method = "GET",
    url = "https://api.github.com/repos/skydimo/light",
    headers = { ["User-Agent"] = "SkydimoExtension" },
    timeout_ms = 10000
})

if response.ok then
    local data = ext.json_decode(response.body)
    ext.log("Repo: " .. data.full_name)
end
```

**参数 (options)**:
- `method` —— HTTP 方法（默认：`"GET"`）。
- `url` —— 完整的请求目标 URL。
- `headers` —— 包含 HTTP 请求头的表格。
- `body` —— 字符串请求载荷。
- `json` —— 希望作为 JSON 发送的表格/值（会自动设置 `Content-Type: application/json`）。不可与 `body` 同时使用。
- `timeout_ms` —— 请求整体超时时间（单位：毫秒，默认：`30000`）。
- `connect_timeout_ms` —— 建立连接超时时间（单位：毫秒，默认：`10000`）。
- `max_response_bytes` —— 允许响应的最大体积（默认：4MB）。
- `follow_redirects` —— 是否跟随 HTTP 重定向（默认：`true`）。
- `max_redirects` —— 允许重定向的最大次数。

**返回**：一个 `HttpResponseData` 表格，包含 `ok` (布尔值)、`status` (状态码整数)、`url` (字符串)、`headers` (表格) 和 `body` (响应体字符串)。

#### ext.net.http.stream(options)

:::note
也可以通过 `ext.net.http.open()` 调用。
:::

发起 HTTP 流请求。适用于 Server-Sent Events (SSE) 或是分块下载大型数据。
事件必须通过 `read()` 进行手动拉取。

```lua
local handle = ext.net.http.stream({
    url = "https://example.com/events"
})
```

**返回**：`integer` —— 流句柄。

#### ext.net.http.read(handle [, timeout_ms])

从 HTTP 流中拉取下一个事件。

```lua
local event = ext.net.http.read(handle, 5000)

if event then
    if event.type == "headers" then
        ext.log("响应状态码: " .. event.status)
    elseif event.type == "chunk" then
        ext.log("收到的切片大小: " .. #event.data)
    elseif event.type == "done" then
        ext.log("流结束")
    elseif event.type == "error" then
        ext.error("流错误: " .. event.message)
    end
end
```

**返回**：事件表格（包含 `type`、`status`、`data`、`message` 等），如果超时则返回 `nil`。表格内可用的字段取决于事件 `type` (`"headers"`、`"chunk"`、`"done"` 或是 `"error"`)。

#### ext.net.http.close(handle)

关闭运行中的 HTTP 流。流在到达 `"done"` 或 `"error"` 之前不会自动关闭。

```lua
ext.net.http.close(handle)
```

---

### TCP 客户端 (`ext.net.tcp`)

需要 `"network:tcp"` 或 `"network"` 权限。

#### ext.net.tcp.connect(options)

建立阻塞的 TCP 连接。

```lua
local handle = ext.net.tcp.connect({
    host = "192.168.1.100",
    port = 8080,
    connect_timeout_ms = 5000,
    read_timeout_ms = nil,
    write_timeout_ms = nil,
    no_delay = true
})
```

**参数 (options)**:
- `host` —— IP 地址或主机名。
- `port` —— 端口号。
- `connect_timeout_ms` —— 连接超时（默认：`5000`）。
- `read_timeout_ms` —— 此连接上的默认读取超时。
- `write_timeout_ms` —— 此连接上的默认写入超时。
- `no_delay` —— 是否开启 `TCP_NODELAY`（默认：`true`）。

**返回**：`integer` —— 连接句柄，失败时抛出错误。

#### ext.net.tcp.write(handle, data [, timeout_ms])

通过 TCP 连接发送数据。

```lua
local bytes_written = ext.net.tcp.write(handle, "HELLO\n")
```

**返回**：`integer` —— 成功写入的字节数。

#### ext.net.tcp.write_all(handle, data [, timeout_ms])

通过 TCP 连接发送全部数据。阻塞直到全部载荷发送完毕。

```lua
ext.net.tcp.write_all(handle, "HELLO\n")
```

#### ext.net.tcp.read(handle, max_len [, timeout_ms])

接收最多 `max_len` 个字节。如果 `timeout_ms` 留空或者为 `0`，则取决于该连接的默认读取超时或是被阻断直到接收完毕。

```lua
local data = ext.net.tcp.read(handle, 4096)
```

**返回**：`string` —— 接收到的数据。

#### ext.net.tcp.read_exact(handle, bytes [, timeout_ms])

精确接收 `bytes` 个字节。阻塞直到全部接收或超时/发生错误。

```lua
local data = ext.net.tcp.read_exact(handle, 4)
```

**返回**：`string` —— 接收到的数据。

#### ext.net.tcp.close(handle)

关闭 TCP 连接。

```lua
ext.net.tcp.close(handle)
```

---

### 遗留 TCP 接口 (已废弃)

:::caution ⚠️ 废弃警告
以下作为全局属性的 `ext.tcp_*` 接口已被废弃，并将在未来版本中被移除，旧业务仍兼容使用直至移除为止。请逐步迁移至 `ext.net.tcp.*`。
:::

- `ext.tcp_connect(host, port [, timeout_ms])` -> `ext.net.tcp.connect({host=host, port=port, connect_timeout_ms=timeout_ms})`
- `ext.tcp_send(handle, data [, timeout_ms])` -> `ext.net.tcp.write(...)`
- `ext.tcp_recv(handle, max_len [, timeout_ms])` -> `ext.net.tcp.read(...)`
- `ext.tcp_recv_exact(handle, bytes [, timeout_ms])` -> `ext.net.tcp.read_exact(...)`
- `ext.tcp_close(handle)` -> `ext.net.tcp.close(...)`
- `ext.tcp_write_all(handle, data [, timeout_ms])` -> `ext.net.tcp.write_all(...)`

---

### 遗留 HTTP 接口（已废弃）

:::caution ⚠️ 废弃警告
以下作为全局属性的 `ext.http_*` 接口已被废弃，并将在未来版本中被移除。请逐步迁移至 `ext.net.http.*`。
:::

- `ext.http_request(options)` -> `ext.net.http.request(...)`
- `ext.http_open(options)` -> `ext.net.http.stream(...)`
- `ext.http_read(handle [, timeout_ms])` -> `ext.net.http.read(...)`
- `ext.http_close(handle)` -> `ext.net.http.close(...)`

---

## HID 硬件访问

:::info 版本
自 **3.0.0-dev.3** 起支持。需要 `"hardware:hid"` 权限。
:::

直接 USB HID 设备通信。句柄由系统自动管理，并在扩展停止时自动清理。

### ext.hid_enumerate([vid [, pid]])

枚举已连接的 HID 设备，可按 Vendor ID 和 Product ID 进行过滤。

```lua
-- 列出所有 HID 设备
local devices = ext.hid_enumerate()

-- 按 VID/PID 过滤
local devices = ext.hid_enumerate(0x1532, 0x0084)

for _, dev in ipairs(devices) do
    ext.log(dev.product .. " @ " .. dev.path)
end
```

**返回**：设备信息表数组：

| 字段 | 类型 | 说明 |
|-------|------|------|
| `path` | string | 平台特定的设备路径 |
| `vid` | integer | USB 厂商 ID |
| `pid` | integer | USB 产品 ID |
| `serial` | string | 序列号（可能为空） |
| `manufacturer` | string | 制造商字符串 |
| `product` | string | 产品名称字符串 |
| `interface_number` | integer | USB 接口编号 |
| `usage` | integer | HID 用途 ID |
| `usage_page` | integer | HID 用途页面 |

### ext.hid_open(vid, pid [, serial])

通过 VID/PID 打开 HID 设备，可指定序列号以区分同型号设备。

```lua
local handle = ext.hid_open(0x1532, 0x0084)
```

**返回**：`integer` —— 设备句柄。

### ext.hid_open_path(path)

通过平台特定的设备路径打开 HID 设备（路径来自 `hid_enumerate`）。

```lua
local handle = ext.hid_open_path(dev.path)
```

**返回**：`integer` —— 设备句柄。

### ext.hid_write(handle, data)

向 HID 设备写入数据。

```lua
local bytes_written = ext.hid_write(handle, "\x00\x01\x02")
```

- `data` —— 要写入的二进制字符串。

**返回**：`integer` —— 写入的字节数。

### ext.hid_read(handle, length [, timeout_ms])

从 HID 设备读取数据。

```lua
local data = ext.hid_read(handle, 64, 1000)
```

- `length` —— 最大读取字节数。
- `timeout_ms` —— 读取超时（毫秒，默认 `0` 为阻塞模式）。

**返回**：`string` —— 从设备读取的二进制数据。

### ext.hid_send_feature_report(handle, data)

发送 HID Feature Report。

```lua
local bytes_written = ext.hid_send_feature_report(handle, "\x06\x00\x01")
```

**返回**：`integer` —— 写入的字节数。

### ext.hid_get_feature_report(handle, length [, report_id])

获取 HID Feature Report。

```lua
local report = ext.hid_get_feature_report(handle, 64, 0x06)
```

- `length` —— 最大报告长度。
- `report_id` —— Report ID（默认为 `0`）。

**返回**：`string` —— 二进制报告数据。

### ext.hid_close(handle)

关闭 HID 设备句柄。

```lua
ext.hid_close(handle)
```

---

## 进程管理

需要 `"process"` 权限。

### ext.spawn_process(exe, args [, options])

启动外部进程。

```lua
local handle = ext.spawn_process("openrgb", {"--server", "--port", "6742"}, {
    hidden = true,
    working_dir = ext.data_dir
})
```

- `args` —— 命令行参数表格
- `options.hidden` —— 隐藏进程窗口（boolean）
- `options.working_dir` —— 工作目录路径

**返回**：`integer` —— 进程句柄。

### ext.is_process_alive(handle)

检查进程是否仍在运行。

```lua
if ext.is_process_alive(handle) then
    ext.log("进程正在运行")
end
```

**返回**：`boolean`

### ext.kill_process(handle)

终止进程。

```lua
ext.kill_process(handle)
```

---

## 页面通信

### ext.page_emit(data)

向扩展的内嵌 HTML 页面发送数据。

```lua
ext.page_emit({type = "devices_update", devices = ext.get_devices()})
```

- `data` —— 任意 Lua 表格（序列化为 JSON 发送到页面）

### ext.ext_page_send(ext_id, data)

向另一个正在运行的扩展实例发送 JSON 消息。

```lua
ext.ext_page_send("openrgb", {action = "refresh"})
```

目标扩展会通过 `on_page_message(data)` 或 native-c `on_page_message_json` 接收该载荷，与 WebSocket `ext_page_send` 使用同一路径。

---

## 生命周期钩子摘要

| 钩子 | 签名 | 说明 |
|------|------|------|
| `on_start()` | `function()` | 扩展已加载 |
| `on_scan_devices()` | `function()` | 手动扫描触发 |
| `on_devices_changed(devices)` | `function(table)` | 设备列表变化 |
| `on_led_locks_changed(locks)` | `function(table)` | LED 锁状态变化 |
| `on_system_media_changed(session)` | `function(table)` | 系统媒体属性/封面变化（需 `media:session`；≥ 3.0.0-dev.3） |
| `on_system_media_playback_changed(session)` | `function(table)` | 系统媒体播放状态变化（需 `media:session`；≥ 3.0.0-dev.3） |
| `on_system_media_timeline_changed(session)` | `function(table)` | 系统媒体进度/时长更新（需 `media:session`；≥ 3.0.0-dev.3） |
| `on_system_state_changed(topic, data)` | `function(string, table)` | 系统状态主题变化（需对应主题权限；≥ 3.0.0-dev.3） |
| `on_device_frame(port, outputs)` | `function(string, table)` | 实时 LED 帧数据 |
| `on_page_message(data)` | `function(table)` | 来自 HTML 页面的消息 |
| `on_stop()` | `function()` | 扩展正在停止 |
