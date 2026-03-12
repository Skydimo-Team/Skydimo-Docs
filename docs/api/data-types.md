---
sidebar_position: 8
---

# Data Types

Reference for the key data types used across the WebSocket API.

## LocalizedText

Text that supports multiple locales:

```json
{
  "raw": "Rainbow",
  "byLocale": {
    "zh-CN": "彩虹",
    "en-US": "Rainbow"
  }
}
```

The `raw` field is used as a fallback when no matching locale is found.

---

## EffectParamInfo

Describes a configurable parameter exposed by an effect. The `type` field determines the UI control.

### Slider

```json
{
  "type": "slider",
  "key": "speed",
  "label": "Speed",
  "min": 0.0,
  "max": 5.0,
  "step": 0.1,
  "default": 2.5,
  "group": "Animation",
  "dependency": null
}
```

### RangeSlider

```json
{
  "type": "range_slider",
  "key": "frequency_range",
  "label": "Frequency Range",
  "min": 20.0,
  "max": 20000.0,
  "step": 1.0,
  "default": [100.0, 8000.0]
}
```

### Select

```json
{
  "type": "select",
  "key": "preset",
  "label": "Preset",
  "default": 0,
  "options": [
    {"label": "Custom", "value": 0},
    {"label": "Rainbow", "value": 1},
    {"label": "Sunset", "value": 2}
  ]
}
```

### Toggle

```json
{
  "type": "toggle",
  "key": "reverse",
  "label": "Reverse Direction",
  "default": false
}
```

### Color

```json
{
  "type": "color",
  "key": "baseColor",
  "label": "Base Color",
  "default": "#FF0000"
}
```

### MultiColor

```json
{
  "type": "multi_color",
  "key": "colors",
  "label": "Color Palette",
  "default": ["#FF0000", "#00FF00", "#0000FF"],
  "fixedCount": null,
  "minCount": 2,
  "maxCount": 16
}
```

---

## ParamDependency

Controls parameter visibility or enabled state based on another parameter's value.

```json
{
  "key": "preset",
  "equals": 0,
  "behavior": "hide"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Key of the parameter to depend on |
| `equals` | any? | Show/enable only when the dependency equals this value |
| `not_equals` | any? | Show/enable only when the dependency does NOT equal this value |
| `behavior` | string | `"hide"` (remove from UI) or `"disable"` (show but grayed out) |

---

## ScreenRegion

Specifies the capture area for screen-based effects.

```typescript
type ScreenRegion =
  | "Full"
  | "Top"
  | "Bottom"
  | "Left"
  | "Right"
  | { Custom: { x: number; y: number; width: number; height: number } };
```

---

## EffectInfo

Complete effect metadata returned by `get_effects`:

```json
{
  "id": "rainbow",
  "name": {"raw": "Rainbow", "byLocale": {"zh-CN": "彩虹"}},
  "description": {"raw": "Flowing rainbow animation"},
  "icon": "Waves",
  "category": "animation",
  "permissions": ["log"],
  "params": [ ... ]
}
```

---

## PluginsResponse

Returned by `get_plugins`:

```json
{
  "effects": [EffectPluginInfo, ...],
  "controllers": [ControllerPluginInfo, ...],
  "extensions": [ExtensionPluginInfo, ...]
}
```

Each plugin info contains:

```json
{
  "id": "plugin_id",
  "name": "Display Name",
  "version": "1.0.0",
  "publisher": "Author",
  "description": "Description",
  "language": "lua",
  "enabled": true,
  "metadata": {
    "version": "1.0.0",
    "publisher": "Author",
    "repository": "https://github.com/...",
    "license": "MIT"
  }
}
```

---

## SystemInfoResponse

```json
{
  "os_platform": "windows",
  "os_version": "10.0.22631",
  "os_build": "22631",
  "arch": "x86_64"
}
```
