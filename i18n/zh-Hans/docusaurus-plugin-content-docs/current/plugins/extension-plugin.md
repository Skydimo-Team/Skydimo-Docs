---
sidebar_position: 6
---

# 扩展插件指南

扩展插件是后台服务，可以桥接外部协议、注册虚拟设备、锁定 LED 进行直接控制，并提供自定义 HTML UI 页面。

## 目录结构

```
plugins/extension.my_bridge/
├── manifest.json       # 元数据 + 权限
├── init.lua            # 入口脚本
├── lib/                # 可选 Lua 模块
│   └── protocol.lua
├── locales/            # 可选 i18n 文件
├── data/               # 持久化数据目录
└── page/               # 可选内嵌 HTML UI
    └── dist/
        └── index.html
```

## 生命周期

```
Core 启动 → 加载已启用的扩展
  → 初始化 Lua 环境
  → plugin.on_start()              ← 扩展启动
  → [事件循环]
      plugin.on_scan_devices()     ← 手动扫描触发
      plugin.on_devices_changed()  ← 设备列表变化
      plugin.on_led_locks_changed()← LED 锁状态变化
      plugin.on_system_media_*()   ← 媒体播放改变
      plugin.on_system_state_changed() ← 系统状态变化
      plugin.on_device_frame()     ← 实时 LED 数据
      plugin.on_page_message()     ← 来自 HTML 页面的消息
  → plugin.on_stop()              ← 扩展停止
```

## 生命周期钩子

### on_start()

扩展加载时调用。在此初始化连接、启动外部进程、注册设备。

```lua
function plugin.on_start()
    ext.log("扩展正在启动")
    -- 连接外部服务，注册设备等
end
```

### on_scan_devices()

用户手动触发设备扫描时调用。

```lua
function plugin.on_scan_devices()
    ext.log("正在扫描设备...")
    -- 发现并注册设备
end
```

### on_devices_changed(devices)

全局设备列表变化时调用。

```lua
function plugin.on_devices_changed(devices)
    -- 响应新增/移除的设备
end
```

### on_led_locks_changed(locks)

任何 LED 锁状态变化时调用。

```lua
function plugin.on_led_locks_changed(locks)
    -- locks: 当前锁定状态
end
```

### on_system_media_changed(session)

:::info 版本
自 **3.0.0-dev.3** 起支持。需要 `"media:session"` 权限。
:::

当系统媒体会话属性（如标题、艺术家、专辑、封面等）发生变化时调用。

```lua
function plugin.on_system_media_changed(session)
    if session then
        ext.log("当前播放曲目已变化: " .. session.title)
    end
end
```

### on_system_media_playback_changed(session)

:::info 版本
自 **3.0.0-dev.3** 起支持。需要 `"media:session"` 权限。
:::

当播放状态（播放、暂停、停止）发生变化时调用。

```lua
function plugin.on_system_media_playback_changed(session)
    if session then
        ext.log("播放状态: " .. session.playback_status)
    end
end
```

### on_system_media_timeline_changed(session)

:::info 版本
自 **3.0.0-dev.3** 起支持。需要 `"media:session"` 权限。
:::

当播放进度或时长更新时调用。

```lua
function plugin.on_system_media_timeline_changed(session)
    -- session.timeline 包含进度和时长信息
end
```

### on_system_state_changed(topic, data)

:::info 版本
自 **3.0.0-dev.4** 起支持。需要对应主题的权限（`"system:process"` 或 `"system:window-focus"`）。
:::

当已订阅的系统状态主题发生变化时调用。`topic` 字符串标识变化的主题，`data` 包含变化数据。

```lua
function plugin.on_system_state_changed(topic, data)
    if topic == "process" then
        ext.log("运行中的应用: " .. #data.apps)
        for _, change in ipairs(data.changes) do
            if change.current_instance_count > change.previous_instance_count then
                ext.log("已启动: " .. change.name)
            else
                ext.log("已停止: " .. change.name)
            end
        end
    elseif topic == "window_focus" then
        if data.current then
            ext.log("当前焦点: " .. (data.current.app_name or "未知"))
        end
    end
end
```

详见[系统状态监控](#系统状态监控)了解可用主题和数据结构。

### on_device_frame(port, outputs)

每个活跃设备帧触发，携带实时 LED 颜色数据，高频（最高 30+ fps）。

```lua
function plugin.on_device_frame(port, outputs)
    -- outputs: {output_id = {r,g,b,r,g,b,...}, ...}
    local colors = outputs["out1"]
    if colors then
        -- 将颜色转发至外部系统
    end
end
```

### on_page_message(data)

内嵌 HTML 页面发送消息时调用。

```lua
function plugin.on_page_message(data)
    if data.action == "refresh" then
        -- 处理页面请求
        ext.page_emit({status = "ok", devices = ext.get_devices()})
    end
end
```

### on_stop()

插件即将卸载时调用，清理所有资源。

```lua
function plugin.on_stop()
    ext.log("扩展正在停止")
    -- 关闭连接，终止进程，注销设备
end
```

## 注册虚拟设备

扩展可以注册虚拟设备，这些设备在 Skydimo 中像实体硬件一样显示：

```lua
local port = ext.register_device({
    controller_port = "openrgb://device_0",
    manufacturer = "Corsair",
    model = "Vengeance RGB",
    serial_id = "ABC123",
    description = "RAM 模块",
    controller_id = "extension.openrgb",
    device_type = "dram",
    outputs = {
        {
            id = "zone0",
            name = "Zone 0",
            leds_count = 8,
            output_type = "linear",
        }
    }
})
```

这些设备从 Skydimo 接收灯效，你可以通过 `on_device_frame` 将渲染后的颜色转发至真实硬件。

### 更新设备

```lua
-- 更改设备昵称
ext.set_device_nickname(port, "我的内存条")

-- 更新输出配置
ext.update_output(port, "zone0", {
    leds_count = 16,
    matrix = nil  -- 或 {width=4, height=4, map={...}}
})

-- 移除设备
ext.remove_extension_device(port)
```

## LED 锁定

扩展可以锁定特定 LED 进行直接颜色控制，覆盖当前活跃的灯效：

```lua
-- 锁定 LED 0-9 进行直接控制
ext.lock_leds("COM3", "out1", {0, 1, 2, 3, 4, 5, 6, 7, 8, 9})

-- 对锁定的 LED 设置颜色
ext.set_leds("COM3", "out1", {
    {0, 255, 0, 0},    -- LED 0: 红
    {1, 0, 255, 0},    -- LED 1: 绿
    {2, 0, 0, 255},    -- LED 2: 蓝
})

-- 释放锁定
ext.unlock_leds("COM3", "out1", {0, 1, 2, 3, 4, 5, 6, 7, 8, 9})
```

## 网络（TCP）

扩展可以建立 TCP 连接。需要 `"network:tcp"` 权限。

```lua
-- 连接
local handle = ext.tcp_connect("127.0.0.1", 6742)
-- 带超时:
local handle = ext.tcp_connect("127.0.0.1", 6742, 5000)

-- 发送数据
local bytes_sent = ext.tcp_send(handle, data_string)

-- 接收数据
local data = ext.tcp_recv(handle, 1024)            -- 最多 1024 字节
local data = ext.tcp_recv(handle, 1024, 5000)      -- 带 5s 超时
local data = ext.tcp_recv_exact(handle, 256)        -- 恰好 256 字节
local data = ext.tcp_recv_exact(handle, 256, 5000)  -- 带超时

-- 关闭
ext.tcp_close(handle)
```

## 进程管理

扩展可以启动和管理外部进程。需要 `"process"` 权限。

```lua
-- 启动进程
local handle = ext.spawn_process("openrgb.exe", {"--server"}, {
    hidden = true,
    working_dir = ext.data_dir
})

-- 检查是否运行中
if ext.is_process_alive(handle) then
    ext.log("进程正在运行")
end

-- 终止进程
ext.kill_process(handle)
```

## HID 设备访问

> **3.0.0-dev.2 起支持**

扩展可以直接打开并与 HID 设备通信。需要 `"hardware:hid"` 权限。

```lua
-- 枚举所有已连接的 HID 设备（可按 VID/PID 过滤）
local devices = ext.hid_enumerate()                    -- 全部设备
local devices = ext.hid_enumerate(0x1B1C)              -- 按 VID 过滤
local devices = ext.hid_enumerate(0x1B1C, 0x1B2D)     -- 按 VID + PID 过滤

-- 每项包含:
-- device.path、device.vid、device.pid、device.serial、
-- device.manufacturer、device.product、
-- device.interface_number、device.usage、device.usage_page

-- 按 VID/PID 打开设备（可选序列号）
local handle = ext.hid_open(0x1B1C, 0x1B2D)
local handle = ext.hid_open(0x1B1C, 0x1B2D, "SN123456")

-- 或按操作系统设备路径打开
local handle = ext.hid_open_path(devices[1].path)

-- 写入数据（返回写入字节数）
local n = ext.hid_write(handle, "\x00\x01\x02\x03")

-- 读取数据
local data = ext.hid_read(handle, 64)          -- 非阻塞
local data = ext.hid_read(handle, 64, 1000)    -- 超时 1000ms
local data = ext.hid_read(handle, 64, -1)      -- 阻塞等待

-- Feature Report
local n = ext.hid_send_feature_report(handle, "\x00\xff\x01")
local data = ext.hid_get_feature_report(handle, 64)
local data = ext.hid_get_feature_report(handle, 64, 0x01)  -- 指定 report ID

-- 关闭
ext.hid_close(handle)
```

扩展停止时，所有打开的 HID 句柄会被自动关闭。

## 原生 C 模块

> **3.0.0-dev.2 起支持**

扩展可以加载放置在插件目录中的原生 C 模块（Windows 上为 `.dll`，Linux/macOS 上为 `.so`）。需要 `"native"` 权限。

声明 `native` 权限后：
- Lua VM 将使用 `unsafe_new()` 创建，以允许加载原生库。
- 插件目录及其 `lib/` 子目录会被自动添加到 `package.cpath`。

```json title="manifest.json"
{
  "permissions": ["native"]
}
```

```lua
-- 从插件目录加载原生模块
local mylib = require("mylib")       -- 加载 mylib.dll / mylib.so
local helper = require("lib/helper") -- 加载 lib/helper.dll / lib/helper.so

mylib.do_something()
```

:::caution
`native` 权限会绕过 Lua 的沙箱机制。请仅对经过充分审查的可信原生模块使用此权限。分发需要 `native` 权限的插件前，必须进行严格的安全审计。
:::



扩展可以查询和控制设备上的灯效：

```lua
-- 获取所有可用灯效
local effects = ext.get_effects()

-- 获取灯效参数 schema
local params = ext.get_effect_params("rainbow")

-- 在设备输出端口上设置灯效
ext.set_effect("COM3", "out1", "rainbow")
ext.set_effect("COM3", "out1", "rainbow", {speed = 3.0})
```

## 页面通信

扩展可以包含一个内嵌 HTML 页面，显示在 Skydimo UI 中：

```json title="manifest.json"
{
  "page": "page/dist/index.html"
}
```

Lua 与页面之间双向通信：

```lua
-- 向 HTML 页面发送数据
ext.page_emit({type = "update", devices = ext.get_devices()})

-- 接收来自页面的消息（通过 on_page_message 钩子）
function plugin.on_page_message(data)
    if data.type == "set_color" then
        ext.set_leds(data.port, data.output, data.colors)
    end
end
```

## 通知

向用户发送 Toast 通知：

```lua
-- 简单通知
ext.notify("连接成功", "已连接到 OpenRGB 服务器")

-- 带级别
ext.notify("警告", "设备无响应", "warn")  -- "info", "warn", "error"

-- 持久通知（保持显示直到关闭）
ext.notify_persistent("conn_status", "正在连接...", "尝试连接到服务器")

-- 稍后关闭
ext.dismiss_persistent("conn_status")
```

## 系统状态监控

> **3.0.0-dev.4 起支持**

扩展可以订阅和查询系统状态主题，例如运行中的进程和当前聚焦窗口。每个主题需要对应的权限。

:::note 平台支持
系统状态监控目前仅支持 **Windows**。在不支持的平台上，`ext.list_system_state_topics()` 返回的主题将显示 `supported = false`，`ext.get_system_state()` 返回的快照中 `supported = false` 且数据为空。
:::

### 可用主题

| 主题 | 权限 | 说明 |
|------|------|------|
| `process` | `system:process` | 运行中的应用程序进程（名称和实例数） |
| `window_focus` | `system:window-focus` | 当前聚焦的前台窗口（应用名称和窗口标题） |

### 查询系统状态

```lua
-- 列出本插件可用的主题（根据已声明权限过滤）
local topics = ext.list_system_state_topics()
for _, topic in ipairs(topics) do
    ext.log("主题: " .. topic.id .. " supported=" .. tostring(topic.supported))
end

-- 获取当前状态快照
local state = ext.get_system_state("process")
if state and state.supported then
    for _, app in ipairs(state.apps) do
        ext.log(app.name .. " (" .. app.instance_count .. " 个实例)")
    end
end

local focus = ext.get_system_state("window_focus")
if focus and focus.supported and focus.current then
    ext.log("当前焦点: " .. (focus.current.app_name or "?") .. " - " .. (focus.current.window_title or ""))
end
```

### 接收变化事件

声明对应权限并实现 `on_system_state_changed`：

```json title="manifest.json"
{
  "permissions": ["system:process", "system:window-focus"]
}
```

```lua
function plugin.on_system_state_changed(topic, data)
    if topic == "process" then
        -- data.apps: 完整的 {name, instance_count} 列表
        -- data.changes: {name, previous_instance_count, current_instance_count} 列表
        for _, change in ipairs(data.changes) do
            if change.current_instance_count > change.previous_instance_count then
                ext.log(change.name .. " 已启动")
            elseif change.current_instance_count == 0 then
                ext.log(change.name .. " 已关闭")
            end
        end
    elseif topic == "window_focus" then
        -- data.reason: "snapshot"、"foreground_changed" 或 "title_changed"
        -- data.current: {app_name?, window_title?} 或 nil
        -- data.previous: {app_name?, window_title?} 或 nil
        if data.current then
            ext.log("窗口焦点 → " .. (data.current.app_name or ""))
        end
    end
end
```

## 完整示例：协议网桥

```lua
local plugin = {}

local conn = nil
local devices = {}

function plugin.on_start()
    ext.log("网桥扩展正在启动")

    -- 启动外部服务
    local handle = ext.spawn_process("bridge-server.exe", {"--port", "9000"}, {
        hidden = true
    })

    -- 等待服务器启动
    ext.sleep(2000)

    -- 连接
    conn = ext.tcp_connect("127.0.0.1", 9000, 5000)
    if not conn then
        ext.error("连接网桥服务器失败")
        return
    end

    -- 发现并注册设备
    discover_devices()
end

function discover_devices()
    ext.tcp_send(conn, "LIST_DEVICES\n")
    local response = ext.tcp_recv(conn, 4096, 3000)
    if not response then return end

    -- 解析响应并注册每个设备
    for name, leds in response:gmatch("(%S+):(%d+)") do
        local port = ext.register_device({
            controller_port = "bridge://" .. name,
            manufacturer = "Bridge",
            model = name,
            controller_id = "extension.my_bridge",
            device_type = "light",
            outputs = {{
                id = "main",
                name = "Main",
                leds_count = tonumber(leds),
                output_type = "linear"
            }}
        })
        devices[port] = {name = name, conn = conn}
    end
end

function plugin.on_device_frame(port, outputs)
    local dev = devices[port]
    if not dev then return end

    local colors = outputs["main"]
    if colors then
        local packet = "SET_LEDS:" .. dev.name .. ":" .. table.concat(colors, ",")
        ext.tcp_send(conn, packet .. "\n")
    end
end

function plugin.on_scan_devices()
    discover_devices()
end

function plugin.on_stop()
    -- 注销所有设备
    for port in pairs(devices) do
        ext.remove_extension_device(port)
    end
    -- 关闭连接
    if conn then ext.tcp_close(conn) end
end

return plugin
```

完整 API 请参阅[扩展 API 参考](api/extension-api)。
