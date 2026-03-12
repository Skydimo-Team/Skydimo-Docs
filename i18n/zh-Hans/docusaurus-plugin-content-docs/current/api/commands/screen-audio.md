---
sidebar_position: 4
---

# 屏幕与音频命令

用于管理屏幕捕获和音频分析的命令。

## get_displays

返回所有可用于屏幕捕获的显示器。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_displays","id":1}
← {"jsonrpc":"2.0","result":[
  {"index":0,"name":"显示器 1","width":2560,"height":1440,"is_hdr":false},
  {"index":1,"name":"显示器 2","width":1920,"height":1080,"is_hdr":false}
],"id":1}
```

---

## get_audio_devices

返回所有可用的音频设备。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_audio_devices","id":1}
← {"jsonrpc":"2.0","result":[
  {"index":0,"name":"Speakers (Realtek)"},
  {"index":1,"name":"Headphones"}
],"id":1}
```

---

## get_scope_screen_state

获取某个 Scope 当前的屏幕捕获配置。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |

```json
→ {"jsonrpc":"2.0","method":"get_scope_screen_state","params":{"port":"COM3"},"id":1}
← {"jsonrpc":"2.0","result":{"screenIndex":0,"region":"Full"},"id":1}
```

---

## set_scope_screen_index

为某个 Scope 选择要捕获的显示器。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `screenIndex` | number? | 显示器索引，传 `null` 则使用默认 |

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_index","params":{"port":"COM3","screenIndex":1},"id":1}
```

---

## set_scope_screen_region

设置某个 Scope 的捕获区域。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `region` | ScreenRegion | 捕获区域规格 |

`ScreenRegion` 可为以下之一：
- `"Full"` —— 整个显示器
- `"Top"` —— 上半部
- `"Bottom"` —— 下半部
- `"Left"` —— 左半部
- `"Right"` —— 右半部
- `{"Custom": {"x": 0, "y": 0, "width": 960, "height": 540}}` —— 自定义矩形

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_region","params":{
  "port":"COM3",
  "region":{"Custom":{"x":100,"y":100,"width":800,"height":600}}
},"id":1}
```

---

## get_scope_audio_device_index

获取某个 Scope 当前的音频设备。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |

```json
→ {"jsonrpc":"2.0","method":"get_scope_audio_device_index","params":{"port":"COM3"},"id":1}
← {"jsonrpc":"2.0","result":{"audioDeviceIndex":0},"id":1}
```

---

## set_scope_audio_device_index

为某个 Scope 选择要使用的音频设备。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `audioDeviceIndex` | number? | 音频设备索引，传 `null` 则使用默认 |

```json
→ {"jsonrpc":"2.0","method":"set_scope_audio_device_index","params":{"port":"COM3","audioDeviceIndex":1},"id":1}
```

---

## get_capture_max_pixels

查询最大屏幕捕获分辨率。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_capture_max_pixels","id":1}
← {"jsonrpc":"2.0","result":{"maxPixels":921600},"id":1}
```

---

## set_capture_max_pixels

设置最大捕获分辨率（影响所有 Scope）。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `maxPixels` | number | 捕获的最大像素数 |

---

## get_capture_fps / set_capture_fps

查询或设置屏幕捕获帧率。

**参数**（set）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `fps` | number | 捕获 FPS（1–60） |

---

## get_capture_method / set_capture_method

查询或设置屏幕捕获后端。

**参数**（set）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `method` | string | 捕获方式：`"dxgi"`、`"gdi"`、`"graphics"` 或 `"xcap"` |

各平台可用方式：
- **Windows**：`dxgi`（默认，GPU 加速）、`gdi`（传统方式）
- **macOS**：`graphics`（CoreGraphics）
- **Linux**：`xcap`
