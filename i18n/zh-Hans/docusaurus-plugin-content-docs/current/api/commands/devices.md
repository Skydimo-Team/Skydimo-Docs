---
sidebar_position: 2
---

# 设备命令

用于设备枚举、配置和管理的命令。

## get_devices

返回所有已连接设备及其当前配置。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_devices","id":1}
← {"jsonrpc":"2.0","result":[
  {
    "port": "COM3",
    "manufacturer": "Skydimo",
    "model": "LED Controller",
    "serial_id": "ABC123",
    "nickname": "桌面灯带",
    "outputs": [...]
  }
],"id":1}
```

---

## get_device

通过端口标识符返回单个设备。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |

```json
→ {"jsonrpc":"2.0","method":"get_device","params":{"port":"COM3"},"id":1}
```

---

## scan_devices

手动触发设备发现。当自动检测未能发现设备时使用。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"scan_devices","id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

如果发现新设备，将触发 `devices-changed` 事件。

---

## set_device_nickname

为设备分配自定义显示名称。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `nickname` | string \| null | 自定义名称，传 `null` 则清除 |

```json
→ {"jsonrpc":"2.0","method":"set_device_nickname","params":{"port":"COM3","nickname":"桌面灯带"},"id":1}
```

---

## set_device_controller

覆盖设备的控制器插件。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `controllerId` | string \| null | 控制器插件 ID，传 `null` 则自动检测 |

```json
→ {"jsonrpc":"2.0","method":"set_device_controller","params":{"port":"COM3","controllerId":"skydimo_serial"},"id":1}
```

---

## get_device_config

返回设备的完整配置树。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |

```json
→ {"jsonrpc":"2.0","method":"get_device_config","params":{"port":"COM3"},"id":1}
```

---

## get_led_locks

返回当前 LED 锁定状态（哪些 LED 被扩展插件锁定）。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string? | 可选的设备端口过滤器 |
| `outputId` | string? | 可选的输出端口过滤器 |

```json
→ {"jsonrpc":"2.0","method":"get_led_locks","params":{"port":"COM3"},"id":1}
```

---

## set_output_segments

在输出端口内定义区段分区。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string | 输出端口 ID |
| `segments` | SegmentDefinition[] | 区段配置列表 |

```json
→ {"jsonrpc":"2.0","method":"set_output_segments","params":{
  "port":"COM3",
  "outputId":"out1",
  "segments":[
    {"id":"seg1","name":"左半部","startIndex":0,"endIndex":72},
    {"id":"seg2","name":"右半部","startIndex":72,"endIndex":144}
  ]
},"id":1}
```

---

## flip_scope_layout

沿指定轴翻转某个 Scope 的 LED 布局。

**参数**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | string | 设备端口标识符 |
| `outputId` | string? | 输出端口 ID |
| `segmentId` | string? | 区段 ID |
| `axis` | string | `"H"`（水平）或 `"V"`（垂直） |

```json
→ {"jsonrpc":"2.0","method":"flip_scope_layout","params":{"port":"COM3","outputId":"out1","axis":"H"},"id":1}
```
