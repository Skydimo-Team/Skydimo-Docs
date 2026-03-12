---
sidebar_position: 2
---

# Device Commands

Commands for device enumeration, configuration, and management.

## get_devices

Returns all connected devices with their current configuration.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_devices","id":1}
← {"jsonrpc":"2.0","result":[
  {
    "port": "COM3",
    "manufacturer": "Skydimo",
    "model": "LED Controller",
    "serial_id": "ABC123",
    "nickname": "Desk Strip",
    "outputs": [...]
  }
],"id":1}
```

---

## get_device

Returns a single device by port identifier.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |

```json
→ {"jsonrpc":"2.0","method":"get_device","params":{"port":"COM3"},"id":1}
```

---

## scan_devices

Manually triggers device discovery. Useful when auto-detection misses a device.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"scan_devices","id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

A `devices-changed` event will fire if new devices are found.

---

## set_device_nickname

Assign a custom display name to a device.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `nickname` | string \| null | Custom name, or `null` to clear |

```json
→ {"jsonrpc":"2.0","method":"set_device_nickname","params":{"port":"COM3","nickname":"Desk Strip"},"id":1}
```

---

## set_device_controller

Override the controller plugin for a device.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `controllerId` | string \| null | Controller plugin ID, or `null` for auto-detect |

```json
→ {"jsonrpc":"2.0","method":"set_device_controller","params":{"port":"COM3","controllerId":"skydimo_serial"},"id":1}
```

---

## get_device_config

Returns the full configuration tree for a device.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |

```json
→ {"jsonrpc":"2.0","method":"get_device_config","params":{"port":"COM3"},"id":1}
```

---

## get_led_locks

Returns the current LED lock state (which LEDs are locked by extensions).

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string? | Optional device port filter |
| `outputId` | string? | Optional output filter |

```json
→ {"jsonrpc":"2.0","method":"get_led_locks","params":{"port":"COM3"},"id":1}
```

---

## set_output_segments

Define segment zones within an output port.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string | Output port ID |
| `segments` | SegmentDefinition[] | Segment configurations |

```json
→ {"jsonrpc":"2.0","method":"set_output_segments","params":{
  "port":"COM3",
  "outputId":"out1",
  "segments":[
    {"id":"seg1","name":"Left Half","startIndex":0,"endIndex":72},
    {"id":"seg2","name":"Right Half","startIndex":72,"endIndex":144}
  ]
},"id":1}
```

---

## flip_scope_layout

Flip the LED layout for a scope along an axis.

**Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `port` | string | Device port identifier |
| `outputId` | string? | Output port ID |
| `segmentId` | string? | Segment ID |
| `axis` | string | `"H"` (horizontal) or `"V"` (vertical) |

```json
→ {"jsonrpc":"2.0","method":"flip_scope_layout","params":{"port":"COM3","outputId":"out1","axis":"H"},"id":1}
```
