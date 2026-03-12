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
  "label": "速度",
  "min": 0.0,
  "max": 5.0,
  "step": 0.1,
  "default": 2.5,
  "group": "动画",
  "dependency": null
}
```

### RangeSlider（范围滑块）

```json
{
  "type": "range_slider",
  "key": "frequency_range",
  "label": "频率范围",
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
  "label": "预设",
  "default": 0,
  "options": [
    {"label": "自定义", "value": 0},
    {"label": "彩虹", "value": 1},
    {"label": "日落", "value": 2}
  ]
}
```

### Toggle（开关）

```json
{
  "type": "toggle",
  "key": "reverse",
  "label": "反向方向",
  "default": false
}
```

### Color（颜色）

```json
{
  "type": "color",
  "key": "baseColor",
  "label": "基础颜色",
  "default": "#FF0000"
}
```

### MultiColor（多颜色）

```json
{
  "type": "multi_color",
  "key": "colors",
  "label": "调色板",
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
