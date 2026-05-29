---
sidebar_position: 2
---

# 设备命令

用于设备枚举、配置、LED 锁、输出分段和布局预览流程的命令。

## get_devices

返回所有已连接设备及其当前有效状态和配置。

```json
→ {"jsonrpc":"2.0","method":"get_devices","id":1}
← {"jsonrpc":"2.0","result":[
  {
    "port": "COM3",
    "manufacturer": "Skydimo",
    "model": "LED Controller",
    "nickname": "Desk Strip",
    "outputs": []
  }
],"id":1}
```

---

## get_device

按端口标识返回单个设备。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `port` | string | 是 | 设备端口标识 |

---

## scan_devices

触发手动设备发现，并通知实现了 `on_scan_devices` 的扩展。

```json
→ {"jsonrpc":"2.0","method":"scan_devices","id":1}
```

如果可见设备列表变化，会触发 `devices-changed` 事件。

---

## get_device_config

返回当前连接在 `port` 上设备的持久化配置树。

```json
→ {"jsonrpc":"2.0","method":"get_device_config","params":{"port":"COM3"},"id":1}
← {"jsonrpc":"2.0","result":{
  "deviceId":"device-uuid",
  "port":"COM3",
  "config":{}
},"id":1}
```

---

## set_device_nickname

设置或清除设备自定义显示名称。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `port` | string | 是 | 设备端口标识 |
| `nickname` | string \| null | 否 | 自定义名称，或 `null` 清除 |

---

## set_device_controller

覆盖设备使用的 controller 插件，或清除覆盖。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `port` | string | 是 | 设备端口标识 |
| `controllerId` | string \| null | 否 | Controller 插件 ID，或 `null` 回到自动匹配 |

---

## set_device_conflict_warning_ignored

持久化是否在 UI 中忽略设备冲突警告。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `port` | string | 是 | 设备端口标识 |
| `ignored` | boolean | 是 | 是否忽略警告 |

---

## update_device_settings

更新 controller 特定的设备设置 JSON，并保存设备配置。

```json
→ {"jsonrpc":"2.0","method":"update_device_settings","params":{
  "port":"COM3",
  "settings":{"pollIntervalMs":250}
},"id":1}
```

---

## get_led_locks

返回当前 LED 锁拥有者。锁由扩展创建，可覆盖灯效输出。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `port` | string | 否 | 可选设备过滤 |
| `outputId` | string | 否 | 可选输出过滤 |

---

## 输出配置

### set_output_nickname

设置或清除输出端口自定义名称。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `port` | string | 是 | 设备端口标识 |
| `outputId` | string | 是 | 输出 ID |
| `nickname` | string \| null | 否 | 自定义输出名称，或 `null` 清除 |

### set_output_segments

替换输出端口分段定义并保存设备配置。

```json
→ {"jsonrpc":"2.0","method":"set_output_segments","params":{
  "port":"COM3",
  "outputId":"out1",
  "segments":[
    {"id":"left","name":"Left Half","segment_type":"Linear","leds_count":72},
    {"id":"right","name":"Right Half","segment_type":"Linear","leds_count":72}
  ]
},"id":1}
```

`segment_type` 为 `Single`、`Linear`、`Matrix` 或 `Preset`。Matrix 和 Preset 分段可包含 `matrix` 映射。

---

## 布局工具

### flip_scope_layout

切换设备、输出或分段 scope 的布局变换。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `port` | string | 是 | 设备端口标识 |
| `outputId` | string | 否 | 输出 ID |
| `segmentId` | string | 否 | 分段 ID；需要 `outputId` |
| `axis` | string | 是 | `"horizontal"` 或 `"vertical"` |

线性分段支持水平翻转。Matrix 和 Preset 分段支持两个方向。

---

## LED 编辑预览

这些命令用于布局编辑期间临时预览 LED 颜色。`sessionId` 标识某个输出端口上的一次预览会话。

### begin_led_edit_preview

```json
→ {"jsonrpc":"2.0","method":"begin_led_edit_preview","params":{
  "port":"COM3",
  "outputId":"out1",
  "sessionId":"preview-1"
},"id":1}
```

### update_led_edit_preview

```json
→ {"jsonrpc":"2.0","method":"update_led_edit_preview","params":{
  "port":"COM3",
  "outputId":"out1",
  "sessionId":"preview-1",
  "offset":0,
  "colors":[{"r":255,"g":0,"b":0}]
},"id":1}
```

Core 会拒绝超过 `65,536` 颗 LED 的 `offset` 或预览分片。

### keepalive_led_edit_preview

保持预览会话存活。

### end_led_edit_preview

结束预览会话并恢复正常渲染。
