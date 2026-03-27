---
sidebar_position: 3
---

# 灯效命令

用于列出灯效、将灯效应用到设备以及控制参数的命令。

## get_effects

返回所有可用灯效（内置 + Lua 插件）。

**参数**：无

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

将灯效应用到设备（默认 Scope 的简化写法）。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `effectId` | string | 灯效插件 ID |

```json
→ {"jsonrpc":"2.0","method":"set_effect","params":{"port":"COM3","effectId":"rainbow"},"id":1}
```

---

## set_scope_effect

在指定 Scope 层级（设备、输出或区段）应用灯效。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID（省略则为设备 Scope） |
| `segmentId` | string? | 区段 ID（省略则为输出 Scope） |
| `effectId` | string \| null | 灯效 ID，传 `null` 则清除 |

```json
→ {"jsonrpc":"2.0","method":"set_scope_effect","params":{
  "port":"COM3","outputId":"out1","effectId":"plasma"
},"id":1}
```

---

## update_effect_params

更新设备的灯效参数。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `params` | object | 键值参数映射 |

```json
→ {"jsonrpc":"2.0","method":"update_effect_params","params":{
  "port":"COM3","params":{"speed":3.5,"preset":1}
},"id":1}
```

---

## update_scope_effect_params

在指定 Scope 更新灯效参数。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `params` | object | 键值参数映射 |

```json
→ {"jsonrpc":"2.0","method":"update_scope_effect_params","params":{
  "port":"COM3","outputId":"out1","params":{"speed":3.5}
},"id":1}
```

---

## reset_scope_effect_params

将某个 Scope 的灯效参数重置为默认值。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |

```json
→ {"jsonrpc":"2.0","method":"reset_scope_effect_params","params":{"port":"COM3","outputId":"out1"},"id":1}
```

---

## set_brightness

设置设备亮度（0–255）。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `brightness` | number | 亮度值（0–255） |

```json
→ {"jsonrpc":"2.0","method":"set_brightness","params":{"port":"COM3","brightness":200},"id":1}
```

---

## set_scope_brightness

在指定 Scope 层级设置亮度。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `brightness` | number | 亮度值（0–255） |

---

## set_scope_power

打开或关闭某个 Scope。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `off` | boolean | `true` 关闭，`false` 开启 |

```json
→ {"jsonrpc":"2.0","method":"set_scope_power","params":{"port":"COM3","off":false},"id":1}
```

---

## set_scope_mode_paused

暂停或恢复某个 Scope 的灯效渲染。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `paused` | boolean | `true` 暂停，`false` 恢复 |

```json
→ {"jsonrpc":"2.0","method":"set_scope_mode_paused","params":{"port":"COM3","paused":true},"id":1}
```
