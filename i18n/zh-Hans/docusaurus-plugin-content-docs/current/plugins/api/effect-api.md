---
sidebar_position: 2
---

# 灯效 API 参考

灯效插件中可用 API 的完整参考。

## Buffer 对象

传递给 `on_tick` 的 `buffer` 参数代表 LED 颜色缓冲区。

### buffer:len()

返回 LED 数量。

```lua
local count = buffer:len()  -- 如 144
```

### buffer:set(index, r, g, b)

使用 RGB 值设置 LED 颜色。

- `index` —— 1-indexed 的 LED 索引
- `r`, `g`, `b` —— 颜色值（0–255）

```lua
buffer:set(1, 255, 0, 0)   -- 第一个 LED = 红色
buffer:set(2, 0, 255, 0)   -- 第二个 LED = 绿色
```

### buffer:set_hsv(index, h, s, v)

使用 HSV 值设置 LED 颜色。

- `index` —— 1-indexed 的 LED 索引
- `h` —— 色相（0–360）
- `s` —— 饱和度（0.0–1.0）
- `v` —— 亮度（0.0–1.0）

```lua
buffer:set_hsv(1, 0, 1.0, 1.0)    -- 红色
buffer:set_hsv(2, 120, 1.0, 1.0)  -- 绿色
buffer:set_hsv(3, 240, 1.0, 1.0)  -- 蓝色
```

### buffer:set_rgb_bytes(bytes)

:::info 版本
**3.0.2** 及之后版本可用。
:::

从包含 RGB 三元组的 Lua 二进制字符串批量设置 LED 颜色。

- `bytes` —— 按 `R,G,B,R,G,B,...` 顺序排列的原始字节
- 从第 1 个 LED 开始写入
- 只写入完整的 RGB 三元组
- 颜色数量超过缓冲区长度时，超出的数据会被忽略
- 颜色数量不足时，剩余 LED 保持不变

```lua
buffer:set_rgb_bytes(string.char(
    255, 0, 0,   -- LED 1 = 红色
    0, 255, 0,   -- LED 2 = 绿色
    0, 0, 255    -- LED 3 = 蓝色
))
```

### buffer:set_hsv_bytes(bytes)

:::info 版本
**3.0.2** 及之后版本可用。
:::

从包含 HSV 三元组的 Lua 二进制字符串批量设置 LED 颜色。适合本身以 HSV 计算的灯效：每帧只做一次批量写入，HSV 到 RGB 的转换由 Host 侧完成。

- `bytes` —— 按 `H,S,V,H,S,V,...` 顺序排列的原始字节
- `H` —— 色相字节，按 `360 / 255` 缩放
- `S` —— 饱和度字节，缩放到 `0.0–1.0`
- `V` —— 亮度字节，缩放到 `0.0–1.0`
- 从第 1 个 LED 开始写入
- 只写入完整的 HSV 三元组
- 颜色数量超过缓冲区长度时，超出的数据会被忽略
- 颜色数量不足时，剩余 LED 保持不变

```lua
buffer:set_hsv_bytes(string.char(
    0, 255, 255,     -- LED 1 = 红色
    85, 255, 255,    -- LED 2 = 绿色
    170, 255, 255    -- LED 3 = 蓝色
))
```

---

## Host 对象

`host` 全局对象提供工具函数。

### host.hsv_to_rgb(h, s, v)

将 HSV 转换为 RGB。

```lua
local r, g, b = host.hsv_to_rgb(180, 1.0, 1.0)
-- 返回: 0, 255, 255（青色）
```

- `h` —— 色相（0–360）
- `s` —— 饱和度（0.0–1.0）
- `v` —— 亮度（0.0–1.0）
- **返回**：`r`, `g`, `b`（0–255）

### host.log(msg)

在 info 级别记录日志。

```lua
host.log("已初始化灯效，共 " .. buffer:len() .. " 个 LED")
```

### print(...)

标准 Lua `print` 也可用，输出至同一日志。

---

## 屏幕捕获 API

插件拥有 `"screen:capture"` 权限时可用。

### screen.list_displays()

返回可用显示器列表。

```lua
local displays = screen.list_displays()
-- 返回: {{index=0, name="Display 1", width=2560, height=1440, is_hdr=false}, ...}
```

### screen.capture(width, height)

捕获活跃屏幕，缩放至指定分辨率。

```lua
local frame = screen.capture(64, 36)
if frame then
    -- frame.width, frame.height
    -- frame.pixels: 0xRRGGBB 值的平铺数组
    local pixel = frame.pixels[1]
    local r = (pixel >> 16) & 0xFF
    local g = (pixel >> 8) & 0xFF
    local b = pixel & 0xFF
end
```

**返回**：包含 `width`、`height` 和 `pixels` 字段的表格，失败时为 `nil`。

:::tip
用户在 UI 中选择要捕获的显示器。内部参数 `__screen_index` 和 `__screen_region` 由 Core 处理。
:::

---

## 音频捕获 API

插件拥有 `"audio:capture"` 权限时可用。

### audio.capture(avg_size)

获取 FFT 频率分析数据。

- `avg_size` —— 要返回的频率区间数量（1–256）

```lua
local data = audio.capture(32)
if data then
    -- data.amplitude: 整体音量级别（0.0-1.0）
    -- data.bins: 频率幅度数组（0.0-1.0）
    for i, mag in ipairs(data.bins) do
        -- mag 是频率区间 i 的幅度值
    end
end
```

**返回**：包含 `amplitude` 和 `bins` 字段的表格，音频捕获不可用时为 `nil`。

---

## 媒体专辑封面 API

插件拥有 `"media:album_art"` 权限时可用。

:::note 平台支持
当前仅支持 **Windows**（通过 Windows Media Session API）。在其他平台上，`media.album_art()` 始终返回 `nil`。
:::

### media.album_art(width, height)

获取当前播放媒体的专辑封面，缩放至指定分辨率。

- `width` —— 期望输出宽度（像素）
- `height` —— 期望输出高度（像素）

```lua
local art = media.album_art(64, 64)
if art then
    -- art.width: number —— 返回图像的实际宽度
    -- art.height: number —— 返回图像的实际高度
    -- art.pixels: 0xRRGGBB 整数值的平铺数组（行优先排列）

    -- 示例：提取第一个像素的 RGB 分量
    local pixel = art.pixels[1]
    local r = (pixel >> 16) & 0xFF
    local g = (pixel >> 8) & 0xFF
    local b = pixel & 0xFF
end
```

**返回**：包含 `width`、`height` 和 `pixels` 字段的表格，无媒体播放或当前曲目无封面时为 `nil`。

**像素格式**：`pixels` 数组中的每个元素是打包为 `0xRRGGBB` 的 24-bit 整数。数组采用**行优先**顺序（从左到右，从上到下），总长度为 `width × height`。

:::tip 性能 —— 缓存 & 事件驱动
Core 在内部缓存专辑封面，**仅在切换曲目时**更新（事件驱动而非轮询）。在 `on_tick` 中每帧调用 `media.album_art()` **不引入任何 I/O 开销** —— 它只是读取缓存图像并缩放至请求的分辨率。无需自行实现缓存。
:::

### 典型用法示例

**直接像素映射（环境灯光）：**

```lua
function plugin.on_tick(elapsed, buffer, width, height)
    local art = media.album_art(width, height)
    if not art then return end

    local led = 1
    for y = 0, height - 1 do
        for x = 0, width - 1 do
            if led > buffer:len() then return end
            local pixel = art.pixels[y * art.width + x + 1]
            local r = (pixel >> 16) & 0xFF
            local g = (pixel >> 8) & 0xFF
            local b = pixel & 0xFF
            buffer:set(led, r, g, b)
            led = led + 1
        end
    end
end
```

**主色提取（用于调色板灯效）：**

```lua
-- 请求小尺寸图像以加速颜色均值计算
local art = media.album_art(8, 8)
if art then
    local sum_r, sum_g, sum_b = 0, 0, 0
    local count = #art.pixels
    for i = 1, count do
        local p = art.pixels[i]
        sum_r = sum_r + ((p >> 16) & 0xFF)
        sum_g = sum_g + ((p >> 8) & 0xFF)
        sum_b = sum_b + (p & 0xFF)
    end
    local avg_r = math.floor(sum_r / count)
    local avg_g = math.floor(sum_g / count)
    local avg_b = math.floor(sum_b / count)
end
```

---

## 生命周期钩子摘要

| 钩子 | 签名 | 说明 |
|------|------|------|
| `on_init()` | `function()` | 实例化时调用一次 |
| `on_params(p)` | `function(table)` | 参数变更时调用 |
| `on_tick(elapsed, buffer, width, height)` | `function(number, userdata, number, number)` | 每帧调用 |
| `on_shutdown()` | `function()` | 灯效移除时调用 |
