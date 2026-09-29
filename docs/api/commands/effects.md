---
sidebar_position: 3
---

# Effect Commands

Commands for listing effects, applying effects to devices, and controlling parameters.

:::note Linked control
When linked control is enabled, effect, parameter, brightness, pause, screen-source, audio-source, and audio-processing mutations update shared linked-control state and synchronize it to all devices. Scope power remains per-scope; use `set_all_devices_power` for a global power change.
:::

## get_effects

Returns all available effects (built-in + plugin effects).

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_effects","id":1}
← {"jsonrpc":"2.0","result":[
  {
    "id": "rainbow",
    "name": {"raw": "Rainbow", "byLocale": {"zh-CN": "彩虹"}},
    "description": {"raw": "Flowing rainbow animation"},
    "icon": "Waves",
    "group": {"raw": "Animation", "byLocale": {"zh-CN": "动画"}},
    "permissions": ["log"],
    "params": [
      {"type": "slider", "key": "speed", "label": {"raw": "Speed", "byLocale": {"zh-CN": "速度"}}, "min": 0.0, "max": 5.0, "step": 0.1, "default": 2.5}
    ]
  }
],"id":1}
```

---

## set_effect

Apply an effect to a device (shorthand for the default scope).

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `effectId` | string | Effect plugin ID |

```json
→ {"jsonrpc":"2.0","method":"set_effect","params":{"port":"COM3","effectId":"rainbow"},"id":1}
```

---

## set_scope_effect

Apply an effect at a specific scope level (device, output, or segment).

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID (omit for device scope) |
| `segmentId` | string? | Segment ID (omit for output scope) |
| `effectId` | string \| null | Effect ID, or `null` to clear |

```json
→ {"jsonrpc":"2.0","method":"set_scope_effect","params":{
  "port":"COM3","outputId":"out1","effectId":"plasma"
},"id":1}
```

---

## update_effect_params

Update effect parameters for a device.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `params` | object | Key-value parameter map |

```json
→ {"jsonrpc":"2.0","method":"update_effect_params","params":{
  "port":"COM3","params":{"speed":3.5,"preset":1}
},"id":1}
```

---

## update_scope_effect_params

Update effect parameters at a specific scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |
| `params` | object | Key-value parameter map |

```json
→ {"jsonrpc":"2.0","method":"update_scope_effect_params","params":{
  "port":"COM3","outputId":"out1","params":{"speed":3.5}
},"id":1}
```

---

## reset_scope_effect_params

Reset effect parameters to defaults at a scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |

```json
→ {"jsonrpc":"2.0","method":"reset_scope_effect_params","params":{"port":"COM3","outputId":"out1"},"id":1}
```

---

## set_brightness

Set brightness for a device.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `brightness` | number | Brightness value, normally `0`–`100` |

```json
→ {"jsonrpc":"2.0","method":"set_brightness","params":{"port":"COM3","brightness":80},"id":1}
```

---

## set_scope_brightness

Set brightness at a specific scope level.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |
| `brightness` | number | Brightness value, normally `0`–`100` |

```json
→ {"jsonrpc":"2.0","method":"set_scope_brightness","params":{
  "port":"COM3","outputId":"out1","brightness":80
},"id":1}
```

---

## set_scope_power

Turn a scope on or off.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |
| `off` | boolean | `true` to power off, `false` to power on |

```json
→ {"jsonrpc":"2.0","method":"set_scope_power","params":{"port":"COM3","off":false},"id":1}
```

---

## set_all_devices_power

Turn every device on or off and persist the affected device configs.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `off` | boolean | `true` to power off, `false` to power on |

```json
→ {"jsonrpc":"2.0","method":"set_all_devices_power","params":{"off":true},"id":1}
```

---

## set_scope_mode_paused

Pause or resume the effect rendering at a scope.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output ID |
| `segmentId` | string? | Segment ID |
| `paused` | boolean | `true` to pause, `false` to resume |

```json
→ {"jsonrpc":"2.0","method":"set_scope_mode_paused","params":{"port":"COM3","paused":true},"id":1}
```

---

## Screen And Audio Source Commands

### get_scope_screen_state

Return selected/effective screen capture state for a scope.

```json
→ {"jsonrpc":"2.0","method":"get_scope_screen_state","params":{"port":"COM3","outputId":"out1"},"id":1}
```

### set_scope_screen_index

Set the display index used by screen-capture effects, or omit/null it to reset.

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_index","params":{
  "port":"COM3",
  "outputId":"out1",
  "screenIndex":0
},"id":1}
```

### set_scope_screen_region

Set the screen capture region for a scope.

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_region","params":{
  "port":"COM3",
  "outputId":"out1",
  "region":{"Custom":{"x":0,"y":0,"width":1920,"height":1080}}
},"id":1}
```

### get_scope_audio_device_index

Return the audio device index selected for a scope.

```json
→ {"jsonrpc":"2.0","method":"get_scope_audio_device_index","params":{"port":"COM3"},"id":1}
```

### set_scope_audio_device_index

Set the audio device index used by audio-reactive effects, or omit/null it to reset.

```json
→ {"jsonrpc":"2.0","method":"set_scope_audio_device_index","params":{
  "port":"COM3",
  "audioDeviceIndex":0
},"id":1}
```

### get_scope_audio_processing_settings

Return audio preprocessing settings for a scope.

```json
→ {"jsonrpc":"2.0","method":"get_scope_audio_processing_settings","params":{"port":"COM3"},"id":1}
```

### set_scope_audio_processing_settings

Set audio preprocessing settings for a scope.

```json
→ {"jsonrpc":"2.0","method":"set_scope_audio_processing_settings","params":{
  "port":"COM3",
  "settings":{
    "amplitude":120,
    "averageMode":"binning",
    "averageSize":8,
    "windowMode":"hann",
    "decay":80,
    "filterConstant":1,
    "normalizationOffset":0.04,
    "normalizationScale":0.5
  }
},"id":1}
```

`averageMode` is `binning` or `low_pass`; `windowMode` is `none`, `hann`, `hamming`, or `blackman`. This command fails when simple mode locks audio preprocessing settings.

### reset_scope_audio_processing_settings

Reset a scope's audio preprocessing settings to defaults.

```json
→ {"jsonrpc":"2.0","method":"reset_scope_audio_processing_settings","params":{"port":"COM3"},"id":1}
```
