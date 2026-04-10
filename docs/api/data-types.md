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

Describes a configurable parameter exposed by an effect. The `type` field determines the UI control. Parameters can also include an optional `groupCollapsed` flag; when it is `true`, the UI starts that group collapsed by default.

### Slider

```json
{
  "type": "slider",
  "key": "speed",
  "label": {"raw": "Speed", "byLocale": {"zh-CN": "速度"}},
  "min": 0.0,
  "max": 5.0,
  "step": 0.1,
  "default": 2.5,
  "group": {"raw": "Animation", "byLocale": {"zh-CN": "动画"}},
  "groupCollapsed": true,
  "dependency": null
}
```

### RangeSlider

```json
{
  "type": "range_slider",
  "key": "frequency_range",
  "label": {"raw": "Frequency Range", "byLocale": {"zh-CN": "频率范围"}},
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
  "label": {"raw": "Preset", "byLocale": {"zh-CN": "预设"}},
  "default": 0,
  "options": [
    {"label": {"raw": "Custom", "byLocale": {"zh-CN": "自定义"}}, "value": 0},
    {"label": {"raw": "Rainbow", "byLocale": {"zh-CN": "彩虹"}}, "value": 1},
    {"label": {"raw": "Sunset", "byLocale": {"zh-CN": "日落"}}, "value": 2}
  ]
}
```

### Toggle

```json
{
  "type": "toggle",
  "key": "reverse",
  "label": {"raw": "Reverse Direction", "byLocale": {"zh-CN": "反向方向"}},
  "default": false
}
```

### Color

```json
{
  "type": "color",
  "key": "baseColor",
  "label": {"raw": "Base Color", "byLocale": {"zh-CN": "基础颜色"}},
  "default": "#FF0000"
}
```

### MultiColor

```json
{
  "type": "multi_color",
  "key": "colors",
  "label": {"raw": "Color Palette", "byLocale": {"zh-CN": "调色板"}},
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

## SystemInfo

:::info Version
The extended format below is available since **3.0.0-dev.2**.
:::

Returned by `get_system_info`. Contains complete hardware and OS details.

### OsInfo

| Field | Type | Description |
|-------|------|-------------|
| `platform` | string | OS name (`"Windows"`, `"macOS"`, `"linux"`) |
| `version` | string | OS version or product name |
| `build` | string | OS build number |
| `arch` | string | CPU architecture (`"x86_64"`, `"aarch64"`, etc.) |
| `hostname` | string | Machine hostname |

### MotherboardInfo

| Field | Type | Description |
|-------|------|-------------|
| `manufacturer` | string | Board manufacturer |
| `model` | string | Board model name |
| `product` | string | Board product name |
| `serialNumber` | string | Board serial number |

### BiosInfo

| Field | Type | Description |
|-------|------|-------------|
| `vendor` | string | BIOS vendor |
| `version` | string | BIOS version |
| `date` | string | BIOS release date |

### CpuInfo

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Processor model name |
| `manufacturer` | string | CPU manufacturer |
| `cores` | number | Physical core count |
| `threads` | number | Logical thread count |
| `baseClockMhz` | number | Base clock speed in MHz |
| `architecture` | string | CPU architecture |

### GpuInfo

`gpu` is an **array** of GPU objects.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | GPU model name |
| `manufacturer` | string | GPU manufacturer |
| `driverVersion` | string | Driver version string |
| `vramMb` | number | Video RAM in MB |

### RamInfo

| Field | Type | Description |
|-------|------|-------------|
| `totalMemoryMb` | number | Total physical memory in MB |
| `modules` | RamModuleInfo[] | Per-DIMM module details |

### RamModuleInfo

| Field | Type | Description |
|-------|------|-------------|
| `manufacturer` | string | Module manufacturer |
| `partNumber` | string | Module part number |
| `capacityMb` | number | Module capacity in MB |
| `speedMhz` | number | Module speed in MHz |
| `formFactor` | string | Form factor (`"DIMM"`, `"SO-DIMM"`, etc.) |

### Full Example

```json
{
  "os": {
    "platform": "Windows",
    "version": "Microsoft Windows 11 Pro",
    "build": "22631",
    "arch": "x86_64",
    "hostname": "MY-PC"
  },
  "motherboard": {
    "manufacturer": "ASUSTeK COMPUTER INC.",
    "model": "ROG STRIX B550-F GAMING",
    "product": "ROG STRIX B550-F GAMING",
    "serialNumber": "ABC123456"
  },
  "bios": {
    "vendor": "American Megatrends Inc.",
    "version": "2803",
    "date": "12/01/2023"
  },
  "cpu": {
    "name": "AMD Ryzen 9 5900X 12-Core Processor",
    "manufacturer": "AMD",
    "cores": 12,
    "threads": 24,
    "baseClockMhz": 3700,
    "architecture": "x64"
  },
  "gpu": [
    {
      "name": "NVIDIA GeForce RTX 3080",
      "manufacturer": "NVIDIA",
      "driverVersion": "537.58",
      "vramMb": 10240
    }
  ],
  "ram": {
    "totalMemoryMb": 32768,
    "modules": [
      {
        "manufacturer": "G Skill Intl",
        "partNumber": "F4-3600C16-16GVKC",
        "capacityMb": 16384,
        "speedMhz": 3600,
        "formFactor": "DIMM"
      }
    ]
  }
}
```
