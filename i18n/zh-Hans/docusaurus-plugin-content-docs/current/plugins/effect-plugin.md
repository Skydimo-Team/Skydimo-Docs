---
sidebar_position: 5
---

# 灯效插件指南

灯效插件负责生成视觉灯光图案。它们接收一个 LED 缓冲区，并在每帧向其写入 RGB 颜色。

## 目录结构

```
plugins/effect.my_effect/
├── manifest.json       # 元数据 + 参数定义
├── main.lua            # 包含生命周期钩子的入口脚本
├── lib/                # 可选 Lua 模块
├── locales/            # 可选 i18n 文件
│   ├── en-US.json
│   └── zh-CN.json
└── data/               # 运行时数据目录
```

## 生命周期

```
用户选择灯效 → 实例化 Lua 环境
  → plugin.on_init()
  → plugin.on_params(params_table)    ← 参数变更时调用
  → [渲染循环]
      plugin.on_tick(elapsed, buffer, width, height)
  → plugin.on_shutdown()
```

## 生命周期钩子

### on_init()

灯效实例化时调用一次。

```lua
function plugin.on_init()
    -- 初始化状态，预计算查找表等
end
```

### on_params(params)

用户更改参数值时调用，初始化时也会调用一次。

- `params` —— 与 manifest `params` 键值对应的表

```lua
function plugin.on_params(p)
    if p.speed then speed = p.speed end
    if p.color then
        base_r = p.color[1]
        base_g = p.color[2]
        base_b = p.color[3]
    end
end
```

### on_tick(elapsed, buffer, width, height)

每帧调用，向缓冲区写入 RGB 颜色。

- `elapsed` —— 灯效启动以来的秒数（浮点数，持续递增）
- `buffer` —— LED 颜色缓冲区（userdata，1-indexed）
- `width` —— 布局宽度（用于 2D 效果）
- `height` —— 布局高度（用于 2D 效果）

```lua
function plugin.on_tick(elapsed, buffer, width, height)
    local count = buffer:len()
    for i = 1, count do
        local hue = (elapsed * 60 + (i - 1) / count * 360) % 360
        buffer:set_hsv(i, hue, 1.0, 1.0)
    end
end
```

### on_shutdown()

灯效移除时调用，清理所有资源。

```lua
function plugin.on_shutdown()
    -- 清理
end
```

## Buffer API

`buffer` 对象提供设置 LED 颜色的方法：

| 方法 | 说明 |
|------|------|
| `buffer:len()` | 返回 LED 数量 |
| `buffer:set(i, r, g, b)` | 通过 RGB 设置 LED 颜色（1-indexed，0–255） |
| `buffer:set_hsv(i, h, s, v)` | 通过 HSV 设置 LED 颜色（h: 0–360，s/v: 0.0–1.0） |

## Host 工具函数

### 颜色转换

```lua
local r, g, b = host.hsv_to_rgb(hue, saturation, value)
-- hue: 0-360, saturation: 0.0-1.0, value: 0.0-1.0
-- 返回: r, g, b (0-255)
```

### 日志

```lua
host.log("调试信息")
print("同样可用于日志输出")
```

## 屏幕捕获

灯效可捕获屏幕内容以实现环境灯光。需要 `"screen:capture"` 权限。

```json title="manifest.json"
{
  "permissions": ["screen:capture"]
}
```

```lua
-- 列出可用显示器
local displays = screen.list_displays()
-- 返回: {index, name, width, height, is_hdr}

-- 捕获屏幕（缩放至指定分辨率）
local frame = screen.capture(64, 36)
-- 返回: {width, height, pixels=[0xRRGGBB, ...]}
-- 失败时返回 nil
```

用户可通过 UI 选择要捕获的显示器。特殊参数 `__screen_index` 和 `__screen_region` 由 Core 注入。

## 音频分析

灯效可对音频作出响应。需要 `"audio:capture"` 权限。

```json title="manifest.json"
{
  "permissions": ["audio:capture"]
}
```

```lua
-- 获取 FFT 数据
local data = audio.capture(32)  -- 32 个频率区间
-- 返回: {amplitude, bins=[0.0..1.0, ...]}
-- amplitude: 整体音量级别
-- bins: 频率幅度值（从低到高）
```

## 媒体专辑封面

灯效可使用当前播放媒体的专辑封面。需要 `"media:album_art"` 权限。

:::note
当前仅支持 **Windows**。在其他平台上返回 `nil`。
:::

```json title="manifest.json"
{
  "permissions": ["media:album_art"]
}
```

```lua
local art = media.album_art(64, 64)
-- 返回: {width, height, pixels=[0xRRGGBB, ...]}
-- 无媒体播放或当前曲目无封面时返回 nil

if art then
    local pixel = art.pixels[1]
    local r = (pixel >> 16) & 0xFF
    local g = (pixel >> 8) & 0xFF
    local b = pixel & 0xFF
end
```

:::tip
Core 在内部缓存专辑封面，仅在切换曲目时更新。在 `on_tick` 中每帧调用 `media.album_art()` 是安全的，不引入任何 I/O 开销 —— 无需自行缓存。
:::

## 参数类型实战

### Slider（滑块）

```json
{"key": "speed", "kind": "slider", "min": 0, "max": 10, "step": 0.5, "default": 2}
```

```lua
function plugin.on_params(p)
    if p.speed then speed = p.speed end  -- number
end
```

### Select（下拉选择）

```json
{
  "key": "mode",
  "kind": "select",
  "options": [{"label": "Wave", "value": 0}, {"label": "Pulse", "value": 1}],
  "default": 0
}
```

```lua
function plugin.on_params(p)
    if p.mode then mode = p.mode end  -- number (value 字段)
end
```

### Toggle（开关）

```json
{"key": "reverse", "kind": "toggle", "default": false}
```

```lua
function plugin.on_params(p)
    if p.reverse ~= nil then reverse = p.reverse end  -- boolean
end
```

### Color（颜色）

```json
{"key": "color", "kind": "color", "default": "#FF0000"}
```

```lua
function plugin.on_params(p)
    if p.color then
        r, g, b = p.color[1], p.color[2], p.color[3]  -- 各 0-255
    end
end
```

### MultiColor（多颜色）

```json
{
  "key": "colors",
  "kind": "multi-color",
  "default": ["#FF0000", "#00FF00"],
  "minCount": 2,
  "maxCount": 8
}
```

```lua
function plugin.on_params(p)
    if p.colors then
        -- {r, g, b} 表格的数组
        palette = p.colors
    end
end
```

## 完整示例：等离子灯效

```lua
local plugin = {}

local speed = 1.0
local scale = 3.0

function plugin.on_init() end

function plugin.on_params(p)
    if p.speed then speed = p.speed end
    if p.scale then scale = p.scale end
end

function plugin.on_tick(elapsed, buffer, width, height)
    local count = buffer:len()
    local t = elapsed * speed

    for i = 1, count do
        local x = (i - 1) / count * scale
        local v1 = math.sin(x * 10 + t)
        local v2 = math.sin(x * 10 * math.sin(t / 2) + t)
        local v3 = math.sin(x * 10 + math.sin(t / 3) * 2)
        local v = (v1 + v2 + v3) / 3

        local hue = ((v + 1) / 2 * 360) % 360
        buffer:set_hsv(i, hue, 1.0, 0.8)
    end
end

function plugin.on_shutdown() end

return plugin
```

完整 API 请参阅[灯效 API 参考](api/effect-api)。
