---
sidebar_position: 3
---

# Effect Commands

Commands for listing effects, applying effects to devices, and controlling parameters.

## get_effects

Returns all available effects (built-in + Lua plugins).

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_effects","id":1}
← {"jsonrpc":"2.0","result":[
  {
    "id": "rainbow",
    "name": {"raw": "Rainbow", "byLocale": {"zh-CN": "彩虹"}},
    "description": {"raw": "Flowing rainbow animation"},
    "icon": "Waves",
    "category": "animation",
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

Set brightness for a device (0–255).

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `brightness` | number | Brightness value (0–255) |

```json
→ {"jsonrpc":"2.0","method":"set_brightness","params":{"port":"COM3","brightness":200},"id":1}
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
| `brightness` | number | Brightness value (0–255) |

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
