---
sidebar_position: 8
---

# 数据类型

WebSocket API 中使用的核心数据类型参考。

## LocalizedText

支持多语言的文本：

```json
{
  "raw": "Rainbow",
  "byLocale": {
    "zh-CN": "彩虹",
    "en-US": "Rainbow"
  }
}
```

找不到匹配语言时，使用 `raw` 字段作为回退值。

---

## EffectParamInfo

描述灯效暴露的可配置参数。`type` 字段决定 UI 控件类型。

### Slider（滑块）

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
  "dependency": null
}
```

### RangeSlider（范围滑块）

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

### Select（下拉选择）

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

### Toggle（开关）

```json
{
  "type": "toggle",
  "key": "reverse",
  "label": {"raw": "Reverse Direction", "byLocale": {"zh-CN": "反向方向"}},
  "default": false
}
```

### Color（颜色）

```json
{
  "type": "color",
  "key": "baseColor",
  "label": {"raw": "Base Color", "byLocale": {"zh-CN": "基础颜色"}},
  "default": "#FF0000"
}
```

### MultiColor（多颜色）

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

根据另一个参数的值控制参数的可见性或启用状态。

```json
{
  "key": "preset",
  "equals": 0,
  "behavior": "hide"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 依赖的参数键名 |
| `equals` | any? | 仅当依赖项等于此值时显示/启用 |
| `not_equals` | any? | 仅当依赖项不等于此值时显示/启用 |
| `behavior` | string | `"hide"`（从 UI 中移除）或 `"disable"`（显示但置灰） |

---

## ScreenRegion

指定屏幕捕获区域。

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

## SystemInfo

:::info 版本
以下扩展格式自 **3.0.0-dev.2** 起支持。
:::

由 `get_system_info` 返回，包含完整的硬件与操作系统信息。

### OsInfo

| 字段 | 类型 | 说明 |
|------|------|------|
| `platform` | string | 操作系统名称（`"Windows"`、`"macOS"`、`"linux"`） |
| `version` | string | 系统版本或产品名称 |
| `build` | string | 系统构建号 |
| `arch` | string | CPU 架构（`"x86_64"`、`"aarch64"` 等） |
| `hostname` | string | 计算机名称 |

### MotherboardInfo

| 字段 | 类型 | 说明 |
|------|------|------|
| `manufacturer` | string | 主板制造商 |
| `model` | string | 主板型号 |
| `product` | string | 主板产品名称 |
| `serialNumber` | string | 主板序列号 |

### BiosInfo

| 字段 | 类型 | 说明 |
|------|------|------|
| `vendor` | string | BIOS 厂商 |
| `version` | string | BIOS 版本 |
| `date` | string | BIOS 发布日期 |

### CpuInfo

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 处理器型号名称 |
| `manufacturer` | string | CPU 制造商 |
| `cores` | number | 物理核心数 |
| `threads` | number | 逻辑线程数 |
| `baseClockMhz` | number | 基础频率（MHz） |
| `architecture` | string | CPU 架构 |

### GpuInfo

`gpu` 是一个 GPU 对象**数组**。

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | GPU 型号名称 |
| `manufacturer` | string | GPU 制造商 |
| `driverVersion` | string | 驱动版本字符串 |
| `vramMb` | number | 显存大小（MB） |

### RamInfo

| 字段 | 类型 | 说明 |
|------|------|------|
| `totalMemoryMb` | number | 总物理内存（MB） |
| `modules` | RamModuleInfo[] | 每根内存条的详细信息 |

### RamModuleInfo

| 字段 | 类型 | 说明 |
|------|------|------|
| `manufacturer` | string | 内存条制造商 |
| `partNumber` | string | 内存条型号 |
| `capacityMb` | number | 内存条容量（MB） |
| `speedMhz` | number | 内存频率（MHz） |
| `formFactor` | string | 封装类型（`"DIMM"`、`"SO-DIMM"` 等） |

### 完整示例

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
