---
sidebar_position: 4
---

# 控制器插件指南

控制器插件是硬件设备驱动程序，负责通过串口、HID 或其他协议与物理 RGB 设备通信。

## 目录结构

```
plugins/controller.my_device/
├── manifest.json       # 插件元数据 + 硬件匹配规则
├── main.lua            # 包含生命周期钩子的入口脚本
├── lib/                # 可选 Lua 模块
│   ├── protocol.lua    # 线路协议实现
│   └── config.lua      # 设备配置
├── locales/            # 可选 i18n 文件
│   ├── en-US.json
│   └── zh-CN.json
└── data/               # 运行时数据（由 Core 创建）
```

## 生命周期

```
设备发现（USB VID/PID 匹配）
  → 打开设备句柄（serial/HID）
  → plugin.on_validate()       ← 认领或拒绝设备
    → 失败? 关闭句柄，尝试下一个插件
    → 成功? 继续
  → plugin.on_init()            ← 注册输出端口
  → [渲染循环] plugin.on_tick(dt)  ← 向硬件发送颜色
  → plugin.on_shutdown()        ← 清理
```

## 生命周期钩子

### on_validate()

用于判断本插件是否可以驱动检测到的设备。使用此钩子发送握手命令并验证设备身份。

**必须返回**：`true` 认领设备，`false` 传递给下一个插件。

```lua
function plugin.on_validate()
    -- 发送识别命令
    device:write("\x01\x00")
    local response = device:read(8, 500)  -- 8 字节，500ms 超时

    if response and #response >= 4 then
        device:set_manufacturer("MyBrand")
        device:set_model("LED Strip v2")
        return true
    end

    return false
end
```

### on_init()

验证成功后调用。在此注册设备的输出端口。

```lua
function plugin.on_init()
    device:add_output({
        id = "main",
        name = "LED Strip",
        type = "linear",
        size = 144,
        capabilities = {
            editable = false,
            min_total_leds = 1,
            max_total_leds = 300,
        }
    })
end
```

### on_tick(dt)

每帧调用，读取混合后的颜色数据并发送至硬件。

- `dt` —— 自上次 tick 以来的秒数（浮点数）

```lua
function plugin.on_tick(dt)
    local rgb = device:get_rgb_bytes("main")
    -- 构建协议数据包并发送
    local header = string.char(0x02, #rgb // 3)
    device:write(header .. rgb)
end
```

### on_shutdown()

设备断开或插件卸载时调用，清理资源并可选择性地清除 LED。

```lua
function plugin.on_shutdown()
    local count = device:output_led_count("main") or 0
    if count > 0 then
        -- 发送全黑帧
        local blank = string.rep("\x00\x00\x00", count)
        device:write("\x02" .. string.char(count) .. blank)
    end
end
```

## 输出端口类型

| 类型 | 说明 |
|------|------|
| `"single"` | 单色灯（1 个 LED） |
| `"linear"` | 线性 LED 灯带 |
| `"matrix"` | 2D LED 矩阵网格 |

### 矩阵输出

对于矩阵类型的输出，需提供 `matrix` 字段：

```lua
device:add_output({
    id = "panel",
    name = "LED Panel",
    type = "matrix",
    size = 144,
    matrix = {
        width = 12,
        height = 12,
        map = {1, 2, 3, ..., 144}  -- 像素映射，-1 = 未映射
    }
})
```

`map` 数组定义逻辑 LED 索引到物理位置的映射，`-1` 表示无效像素。

## 输出能力声明

```lua
capabilities = {
    editable = true,          -- 用户是否可以调整此输出的大小？
    min_total_leds = 1,       -- 最小 LED 数
    max_total_leds = 512,     -- 最大 LED 数
    allowed_total_leds = nil, -- 允许的特定数量（如 {60, 120, 144}）
}
```

## 完整示例

```lua
-- plugins/controller.my_serial_strip/main.lua
local plugin = {}

local HEADER = 0xAA
local CMD_SET_LEDS = 0x01
local CMD_IDENTIFY = 0x02

function plugin.on_validate()
    device:write(string.char(HEADER, CMD_IDENTIFY))
    local resp = device:read(16, 1000)

    if not resp or #resp < 4 then
        return false
    end

    local model_len = string.byte(resp, 3)
    local model = resp:sub(4, 3 + model_len)

    device:set_manufacturer("MyCompany")
    device:set_model(model)
    device:set_device_type("light")
    return true
end

function plugin.on_init()
    device:add_output({
        id = "strip",
        name = "RGB Strip",
        type = "linear",
        size = 60,
        capabilities = {
            editable = true,
            min_total_leds = 1,
            max_total_leds = 300,
        }
    })
end

function plugin.on_tick(_dt)
    local rgb = device:get_rgb_bytes("strip")
    local count = device:output_led_count("strip")
    -- 协议: HEADER, CMD, COUNT_HIGH, COUNT_LOW, R,G,B,...
    local packet = string.char(HEADER, CMD_SET_LEDS,
        math.floor(count / 256), count % 256) .. rgb
    device:write(packet)
end

function plugin.on_shutdown()
    local count = device:output_led_count("strip") or 0
    if count > 0 then
        local blank = string.rep("\x00\x00\x00", count)
        local packet = string.char(HEADER, CMD_SET_LEDS,
            math.floor(count / 256), count % 256) .. blank
        device:write(packet)
    end
end

return plugin
```

## HID 设备

对于 HID 协议设备，使用 HID 专用 I/O 方法：

```lua
-- 发送 HID Feature Report
device:hid_send_feature_report(packet)
device:hid_send_feature_report(packet, length, selector)

-- 读取 HID Feature Report
local data = device:hid_get_feature_report(length)
local data = device:hid_get_feature_report(length, report_id, selector)

-- 列出 HID 接口
local interfaces = device:hid_interfaces()
```

完整 `device` 对象 API 请参阅[控制器 API 参考](api/controller-api)。
