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

设置设备类型。常用值：

| 值 | 说明 |
|----|------|
| `"light"` | 通用 LED 灯光 |
| `"keyboard"` | 键盘 |
| `"mouse"` | 鼠标 |
| `"gpu"` | 显卡 |
| `"motherboard"` | 主板 |
| `"dram"` | 内存模块 |
| `"headset"` | 耳机 |
| `"fan"` | 风扇 |
| `"aio"` | 一体式水冷 |

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
```

**返回**：成功时为 `true`。

接受 Lua 字符串（二进制数据）。

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
