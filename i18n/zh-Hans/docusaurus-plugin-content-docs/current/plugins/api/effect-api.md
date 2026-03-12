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

### media.album_art(width, height)

获取当前播放媒体的专辑封面。

```lua
local art = media.album_art(64, 64)
if art then
    -- art.width, art.height
    -- art.pixels: 0xRRGGBB 值的平铺数组
end
```

**返回**：包含 `width`、`height` 和 `pixels` 的表格，无媒体播放时为 `nil`。

---

## 生命周期钩子摘要

| 钩子 | 签名 | 说明 |
|------|------|------|
| `on_init()` | `function()` | 实例化时调用一次 |
| `on_params(p)` | `function(table)` | 参数变更时调用 |
| `on_tick(elapsed, buffer, width, height)` | `function(number, userdata, number, number)` | 每帧调用 |
| `on_shutdown()` | `function()` | 灯效移除时调用 |
