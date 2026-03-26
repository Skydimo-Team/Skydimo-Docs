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

### ext.sleep(ms)

休眠指定毫秒数。

```lua
ext.sleep(1000)  -- 休眠 1 秒
```

---

## 日志

### ext.log(msg)

记录 info 级别日志。

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
ext.notify("警告", "连接不稳定", "warn")
```

- `level` —— `"info"`（默认）、`"warn"` 或 `"error"`

### ext.notify_persistent(id, title, description)

显示持久通知，保持显示直到被关闭。

```lua
ext.notify_persistent("conn_status", "正在连接...", "尝试连接到服务器")
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
            matrix = nil,              -- 或 {width, height, map}
        }
    }
})
```

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
ext.lock_leds("COM3", "out1", {0, 1, 2, 3, 4})
```

- `indices` —— 以 0 为基准的 LED 索引数组

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

获取所有可用灯效。

```lua
local effects = ext.get_effects()
for _, effect in ipairs(effects) do
    ext.log("灯效: " .. effect.id)
end
```

### ext.get_effect_params(effect_id)

获取灯效的参数 schema。

```lua
local params = ext.get_effect_params("rainbow")
```

### ext.set_effect(port, output_id, effect_id [, params])

:::note 旧版接口
这是一个旧版便捷封装。新插件建议使用 [`ext.set_scope_effect(scope, ...)`](#extsetscopeeffectscope-effect_id-params)，后者支持 `segment_id`。
:::

在设备输出端口上设置活跃灯效。

```lua
ext.set_effect("COM3", "out1", "rainbow")
ext.set_effect("COM3", "out1", "rainbow", {speed = 3.0, preset = 1})
```

---

## 资源查询

:::info 版本
自 **3.0.0-dev.3** 起支持。
:::

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

#### ext.set_scope_effect(scope, effect_id [, params])

在 scope 上设置活跃灯效，支持 `segment_id`。

```lua
ext.set_scope_effect({port = "COM3", output_id = "out1"}, "rainbow")
ext.set_scope_effect(
    {port = "COM3", output_id = "out1", segment_id = "seg0"},
    "breathing",
    {speed = 2.0}
)
ext.set_scope_effect({port = "COM3", output_id = "out1"}, nil) -- 清除灯效
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

#### ext.set_scope_power(scope, is_off)

开启或关闭 scope 的输出。

```lua
ext.set_scope_power({port = "COM3", output_id = "out1"}, true)  -- 关闭输出
ext.set_scope_power({port = "COM3", output_id = "out1"}, false) -- 开启输出
```

#### ext.set_scope_brightness(scope, brightness)

设置 scope 的亮度级别（0–100）。

```lua
ext.set_scope_brightness({port = "COM3", output_id = "out1"}, 80)
```

---

## 网络（TCP）

需要 `"network:tcp"` 权限。

### ext.tcp_connect(host, port [, timeout_ms])

建立 TCP 连接。

```lua
local handle = ext.tcp_connect("127.0.0.1", 6742)
local handle = ext.tcp_connect("192.168.1.100", 8080, 5000)
```

**返回**：`integer` —— 连接句柄，失败时抛出错误。

### ext.tcp_send(handle, data)

通过 TCP 连接发送数据。

```lua
local bytes_sent = ext.tcp_send(handle, "HELLO\n")
```

**返回**：`integer` —— 已发送字节数。

### ext.tcp_recv(handle, max_len [, timeout_ms])

接收最多 `max_len` 字节。

```lua
local data = ext.tcp_recv(handle, 4096)
local data = ext.tcp_recv(handle, 4096, 5000)  -- 5s 超时
```

**返回**：`string` —— 接收到的数据。

### ext.tcp_recv_exact(handle, bytes [, timeout_ms])

精确接收 `bytes` 个字节（阻塞直到全部收到或超时）。

```lua
local header = ext.tcp_recv_exact(handle, 4)
local payload = ext.tcp_recv_exact(handle, payload_len, 10000)
```

**返回**：`string` —— 接收到的数据。

### ext.tcp_close(handle)

关闭 TCP 连接。

```lua
ext.tcp_close(handle)
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
| `on_device_frame(port, outputs)` | `function(string, table)` | 实时 LED 帧数据 |
| `on_page_message(data)` | `function(table)` | 来自 HTML 页面的消息 |
| `on_stop()` | `function()` | 扩展正在停止 |
