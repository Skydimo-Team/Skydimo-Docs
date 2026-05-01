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

### ext.notify_persistent(id, title, description)

显示持久通知，保持显示直到被关闭。通知级别始终为 `"info"`。

如果已存在相同 `id` 的持久通知，其标题和描述将被就地更新。

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

获取所有可用的灯效（内置 + Lua 插件）。

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
