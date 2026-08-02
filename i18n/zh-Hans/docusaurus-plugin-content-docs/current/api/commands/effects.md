---
sidebar_position: 3
---

# 灯效命令

用于列出灯效、应用灯效到设备，以及控制参数、亮度、电源、屏幕源和音频源的命令。

:::note 关联控制
关联控制启用时，灯效、参数、亮度、暂停、屏幕源、音频源和音频预处理变更会更新共享关联状态并同步到所有设备。Scope 电源仍按 scope 控制；全局电源变更请使用 `set_all_devices_power`。
:::

## get_effects

返回所有可用灯效（内置 + 插件灯效）。

```json
→ {"jsonrpc":"2.0","method":"get_effects","id":1}
```

---

## set_effect

将灯效应用到设备（设备级 scope 的简化写法）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识 |
| `effectId` | string | 灯效插件 ID |

---

## set_scope_effect

在指定 scope 层级（设备、输出或分段）应用灯效。

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识 |
| `outputId` | string? | 输出 ID |
| `segmentId` | string? | 分段 ID |
| `effectId` | string \| null | 灯效 ID，或 `null` 清除 |

```json
→ {"jsonrpc":"2.0","method":"set_scope_effect","params":{
  "port":"COM3","outputId":"out1","effectId":"plasma"
},"id":1}
```

---

## update_effect_params / update_scope_effect_params

更新设备或指定 scope 当前灯效的参数。

```json
→ {"jsonrpc":"2.0","method":"update_scope_effect_params","params":{
  "port":"COM3",
  "outputId":"out1",
  "params":{"speed":3.5}
},"id":1}
```

---

## reset_scope_effect_params

将指定 scope 的灯效参数重置为默认值。

```json
→ {"jsonrpc":"2.0","method":"reset_scope_effect_params","params":{"port":"COM3","outputId":"out1"},"id":1}
```

---

## set_brightness / set_scope_brightness

设置设备或指定 scope 的亮度，通常范围为 `0`–`100`。

```json
→ {"jsonrpc":"2.0","method":"set_scope_brightness","params":{
  "port":"COM3","outputId":"out1","brightness":80
},"id":1}
```

---

## set_scope_power

开启或关闭指定 scope。

| 字段 | 类型 | 说明 |
|------|------|------|
| `off` | boolean | `true` 关闭，`false` 开启 |

```json
→ {"jsonrpc":"2.0","method":"set_scope_power","params":{"port":"COM3","off":false},"id":1}
```

---

## set_all_devices_power

开启或关闭所有设备，并持久化受影响设备配置。

```json
→ {"jsonrpc":"2.0","method":"set_all_devices_power","params":{"off":true},"id":1}
```

---

## set_scope_mode_paused

暂停或恢复指定 scope 的灯效渲染。

```json
→ {"jsonrpc":"2.0","method":"set_scope_mode_paused","params":{"port":"COM3","paused":true},"id":1}
```

---

## 屏幕源

### get_scope_screen_state

返回 scope 的屏幕捕获选择/有效状态。

### set_scope_screen_index

设置屏幕捕获灯效使用的显示器索引；省略或传 `null` 表示重置。

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_index","params":{
  "port":"COM3",
  "outputId":"out1",
  "screenIndex":0
},"id":1}
```

### set_scope_screen_region

设置 scope 的屏幕捕获区域。

```json
→ {"jsonrpc":"2.0","method":"set_scope_screen_region","params":{
  "port":"COM3",
  "outputId":"out1",
  "region":{"Custom":{"x":0,"y":0,"width":1920,"height":1080}}
},"id":1}
```

---

## 音频源与预处理

### get_scope_audio_device_index / set_scope_audio_device_index

获取或设置音频响应灯效使用的音频设备索引。

```json
→ {"jsonrpc":"2.0","method":"set_scope_audio_device_index","params":{
  "port":"COM3",
  "audioDeviceIndex":0
},"id":1}
```

### get_scope_audio_processing_settings

返回 scope 的音频预处理设置。

### set_scope_audio_processing_settings

设置 scope 的音频预处理参数。

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

`averageMode` 为 `binning` 或 `low_pass`；`windowMode` 为 `none`、`hann`、`hamming` 或 `blackman`。Simple 模式锁定音频预处理设置时该命令会失败。

### reset_scope_audio_processing_settings

将 scope 的音频预处理设置重置为默认值。

```json
→ {"jsonrpc":"2.0","method":"reset_scope_audio_processing_settings","params":{"port":"COM3"},"id":1}
```
