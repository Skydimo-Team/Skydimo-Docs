---
sidebar_position: 4
---

# Screen & Audio Commands

Commands for managing screen capture and audio analysis.

## get_displays

Returns all available displays for screen capture.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_displays","id":1}
← {"jsonrpc":"2.0","result":[
  {"index":0,"name":"Display 1","width":2560,"height":1440,"is_hdr":false},
  {"index":1,"name":"Display 2","width":1920,"height":1080,"is_hdr":false}
],"id":1}
```

---

## get_audio_devices

Returns all available audio devices.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_audio_devices","id":1}
← {"jsonrpc":"2.0","result":[
  {"index":0,"name":"Speakers (Realtek)"},
  {"index":1,"name":"Headphones"}
],"id":1}
```

---

## get_scope_screen_state

Get the current screen capture configuration at a scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |

```json
→ {"jsonrpc":"2.0","method":"get_scope_screen_state","params":{"port":"COM3"},"id":1}
← {"jsonrpc":"2.0","result":{"screenIndex":0,"region":"Full"},"id":1}
```

---

## set_scope_screen_index

Select which display to capture for a scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |
| `screenIndex` | number? | Display index, or `null` for default |

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_index","params":{"port":"COM3","screenIndex":1},"id":1}
```

---

## set_scope_screen_region

Set the capture region for a scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |
| `region` | ScreenRegion | Capture region specification |

`ScreenRegion` can be one of:
- `"Full"` — Entire display
- `"Top"` — Top half
- `"Bottom"` — Bottom half
- `"Left"` — Left half
- `"Right"` — Right half
- `{"Custom": {"x": 0, "y": 0, "width": 960, "height": 540}}` — Custom rectangle

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_region","params":{
  "port":"COM3",
  "region":{"Custom":{"x":100,"y":100,"width":800,"height":600}}
},"id":1}
```

---

## get_scope_audio_device_index

Get the current audio device for a scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |

```json
→ {"jsonrpc":"2.0","method":"get_scope_audio_device_index","params":{"port":"COM3"},"id":1}
← {"jsonrpc":"2.0","result":{"audioDeviceIndex":0},"id":1}
```

---

## set_scope_audio_device_index

Select which audio device to use for a scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |
| `audioDeviceIndex` | number? | Audio device index, or `null` for default |

```json
→ {"jsonrpc":"2.0","method":"set_scope_audio_device_index","params":{"port":"COM3","audioDeviceIndex":1},"id":1}
```

---

## get_capture_max_pixels

Query the maximum screen capture resolution.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_capture_max_pixels","id":1}
← {"jsonrpc":"2.0","result":{"maxPixels":921600},"id":1}
```

---

## set_capture_max_pixels

Set the maximum capture resolution (affects all scopes).

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `maxPixels` | number | Maximum pixel count for capture |

---

## get_capture_fps / set_capture_fps

Query or set the screen capture frame rate.

**Parameters** (set):

| Field | Type | Description |
|-------|------|-------------|
| `fps` | number | Capture FPS (1–60) |

---

## get_capture_method / set_capture_method

Query or set the screen capture backend.

**Parameters** (set):

| Field | Type | Description |
|-------|------|-------------|
| `method` | string | Capture method: `"dxgi"`, `"gdi"`, `"graphics"`, or `"xcap"` |

Available methods depend on the platform:
- **Windows**: `dxgi` (default, GPU-accelerated), `gdi` (legacy)
- **macOS**: `graphics` (CoreGraphics)
- **Linux**: `xcap`
