---
sidebar_position: 1
---

# 控制器 API 参考

控制器插件中可用的 `device` 全局对象完整参考。

## 设备元数据

### device:controller_port()

返回设备的端口标识符。

```lua
local port = device:controller_port()  -- 如 "COM3"、"/dev/ttyUSB0"
```

### device:manufacturer()

返回厂商名称（通过 `set_manufacturer` 设置）。

### device:model()

返回设备型号（通过 `set_model` 设置）。

### device:serial_id()

返回 USB 序列号（通过 `set_serial_id` 设置）。

### device:device_id()

返回唯一设备 ID（由 Core 计算的哈希值）。

### device:description()

返回设备描述。

### device:image_url()

返回设备图片 URL，或 `nil`。

### device:vendor_id()

返回 USB 供应商 ID（数字），或 `nil`。

### device:product_id()

返回 USB 产品 ID（数字），或 `nil`。

---

## 设备配置

:::note
这些方法只能在 `on_validate()` 和 `on_init()` 期间调用。
:::

### device:set_manufacturer(str)

设置设备厂商名称。

```lua
device:set_manufacturer("Skydimo")
```

### device:set_model(str)

设置设备型号名称。

```lua
device:set_model("LED Strip v2")
```

### device:set_serial_id(str)

设置 USB 序列标识符。

```lua
device:set_serial_id("ABC123")
```

### device:set_description(str)

设置人类可读的设备描述。

### device:set_image_url(url)

设置设备缩略图 URL，传 `nil` 则清除。

### device:set_device_type(str)

设置设备类型。接受不区分大小写的字符串（连字符等同于下划线）。

| 值 | 别名 | 说明 |
|----|------|------|
| `"light"` | | 通用 LED 灯光 |
| `"led_strip"` | `"ledstrip"` | LED 灯带 |
| `"keyboard"` | | 键盘 |
| `"keypad"` | | 小键盘 |
| `"mouse"` | | 鼠标 |
| `"mouse_mat"` | `"mousemat"` | 鼠标垫 |
| `"headset"` | | 耳机 |
| `"headset_stand"` | `"headsetstand"` | 耳机支架 |
| `"gamepad"` | | 游戏手柄 |
| `"motherboard"` | | 主板 |
| `"gpu"` | | 显卡 |
| `"dram"` | `"memory"` | 内存模块 |
| `"cooler"` | | 散热器（风扇 / 水冷） |
| `"case"` | | 机箱 |
| `"speaker"` | | 音箱 |
| `"microphone"` | | 麦克风 |
| `"monitor"` | | 显示器 |
| `"laptop"` | | 笔记本电脑 |
| `"storage"` | | 存储设备 |
| `"accessory"` | | 配件 |
| `"virtual"` | | 虚拟设备 |
| `"unknown"` | | 未知类型 |

```lua
device:set_device_type("keyboard")
```

---

## 输出端口注册

:::note
`add_output` 只能在 `on_init()` 期间调用。
:::

### device:add_output(config)

注册一个硬件输出端口。

**简单形式：**

```lua
device:add_output("output_id", led_count)
```

**完整形式：**

```lua
device:add_output({
    id = "out1",
    name = "Output 1",
    type = "linear",       -- "single"、"linear"、"matrix"
    size = 144,
    matrix = {             -- 仅 "matrix" 类型
        width = 12,
        height = 12,
        map = {1, 2, ..., 144}  -- -1 = 未映射
    },
    capabilities = {
        editable = false,
        min_total_leds = 1,
        max_total_leds = 300,
        allowed_total_leds = nil  -- 或 {60, 120, 144}
    }
})
```

---

## 数据 I/O

### device:write(data)

向设备发送数据。

```lua
device:write(packet_string)           -- 写入完整字符串
device:write(packet_string, length)   -- 写入前 N 个字节
device:write({0x01, 0x02, 0xFF})      -- 从字节表写入
```

**返回**：成功时为 `true`。

接受 Lua 字符串（二进制数据）、字节值表（0–255）或 `nil`（无操作）。

### device:read(length)

从设备读取数据。

```lua
local data = device:read(64)           -- 最多读取 64 字节
local data = device:read(64, 500)      -- 带 500ms 超时
```

**返回**：原始字节的 Lua 字符串，失败/超时时为 `nil`。

### device:clear_input()

清除串口输入缓冲区（仅串口协议）。

```lua
device:clear_input()
```

---

## LED 颜色数据

### device:get_colors(output_id)

以 Lua 表格形式获取混合后的 LED 颜色。

```lua
local colors = device:get_colors("out1")
-- 返回: {r, g, b, r, g, b, ...}（0-255 的数字）
```

### device:get_rgb_bytes(output_id)

以二进制字符串形式获取混合后的 LED 颜色。

```lua
local rgb = device:get_rgb_bytes("out1")
-- 返回: RGB 字节的二进制字符串
-- 相比 get_colors 对直接硬件 I/O 更高效
```

### device:output_led_count(output_id)

获取输出端口的 LED 数量。

```lua
local count = device:output_led_count("out1")  -- 如 144
```

---

## HID 专用方法

### device:hid_send_feature_report(data)

发送 HID Feature Report。

```lua
device:hid_send_feature_report(packet)
device:hid_send_feature_report(packet, length, selector)
```

- `selector` 可以是整数或字符串，用于选择特定 HID 接口。

### device:hid_get_feature_report(length)

读取 HID Feature Report。

```lua
local report = device:hid_get_feature_report(64)
local report = device:hid_get_feature_report(64, report_id, selector)
```

### device:hid_interfaces()

列出设备的所有 HID 接口。

```lua
local interfaces = device:hid_interfaces()
-- 返回接口描述符的表格
```

---

## 系统信息

:::info 版本
自 **3.0.0-dev.2** 起支持。需要声明 `"system:info"` 权限。
:::

当插件声明 `"system:info"` 权限时，会注入一个只读的 `host.system` 表，包含硬件与操作系统详情。

### host.system

```lua
local sys = host.system

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

## 日志

### device:log(msg)

记录 info 级别日志。

```lua
device:log("已识别设备: " .. device:model())
```

### device:error(msg)

记录 error 级别日志。

```lua
device:error("向设备发送数据失败")
```
