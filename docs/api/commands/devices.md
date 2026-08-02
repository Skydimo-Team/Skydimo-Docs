---
sidebar_position: 2
---

# Device Commands

Commands for device enumeration, configuration, LED locks, output segmentation, and layout-preview workflows.

## get_devices

Returns all connected devices with current effective state and configuration.

**Parameters**: none

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

Returns a single device by port identifier.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |

```json
→ {"jsonrpc":"2.0","method":"get_device","params":{"port":"COM3"},"id":1}
```

---

## scan_devices

Trigger manual discovery and notify extensions that implement `on_scan_devices`.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"scan_devices","id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

A `devices-changed` event fires if the visible device list changes.

---

## get_device_config

Returns the persisted configuration tree for the connected device at `port`.

**Parameters**:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |

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

Assign or clear a custom display name for a device.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `nickname` | string \| null | no | Custom name, or `null` to clear |

```json
→ {"jsonrpc":"2.0","method":"set_device_nickname","params":{
  "port":"COM3",
  "nickname":"Desk Strip"
},"id":1}
```

---

## set_device_controller

Override the controller plugin for a device, or clear the override.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `controllerId` | string \| null | no | Controller plugin ID, or `null` for automatic matching |

```json
→ {"jsonrpc":"2.0","method":"set_device_controller","params":{
  "port":"COM3",
  "controllerId":"skydimo_serial"
},"id":1}
```

---

## set_device_conflict_warning_ignored

Persist whether the UI should suppress a device conflict warning.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `ignored` | boolean | yes | Whether to suppress the warning |

```json
→ {"jsonrpc":"2.0","method":"set_device_conflict_warning_ignored","params":{
  "port":"COM3",
  "ignored":true
},"id":1}
```

---

## update_device_settings

Update controller-specific device settings JSON and persist the device config.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `settings` | object | no | Controller-specific settings object |

```json
→ {"jsonrpc":"2.0","method":"update_device_settings","params":{
  "port":"COM3",
  "settings":{"pollIntervalMs":250}
},"id":1}
```

---

## get_led_locks

Returns current LED lock ownership. Locks are created by extensions and can override effect output.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | no | Optional device port filter |
| `outputId` | string | no | Optional output filter |

```json
→ {"jsonrpc":"2.0","method":"get_led_locks","params":{"port":"COM3"},"id":1}
```

---

## Output Configuration

### set_output_nickname

Set or clear a custom display name for an output.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `outputId` | string | yes | Output ID |
| `nickname` | string \| null | no | Custom output name, or `null` to clear |

```json
→ {"jsonrpc":"2.0","method":"set_output_nickname","params":{
  "port":"COM3",
  "outputId":"out1",
  "nickname":"Desk matrix"
},"id":1}
```

### set_output_segments

Replace segment definitions for an output and persist the device config.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `outputId` | string | yes | Output ID |
| `segments` | SegmentDefinition[] | yes | Segment definitions |

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

`segment_type` is `Single`, `Linear`, `Matrix`, or `Preset`. Matrix and preset segments can include a `matrix` map.

---

## Layout Tools

### flip_scope_layout

Toggle the layout transform for a device, output, or segment scope.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `outputId` | string | no | Output ID |
| `segmentId` | string | no | Segment ID; requires `outputId` |
| `axis` | string | yes | `"horizontal"` or `"vertical"` |

```json
→ {"jsonrpc":"2.0","method":"flip_scope_layout","params":{
  "port":"COM3",
  "outputId":"out1",
  "axis":"horizontal"
},"id":1}
```

Linear segments support horizontal flipping. Matrix and preset segments support both axes.

---

## LED Edit Preview

These commands temporarily preview LED colors during layout editing. A `sessionId` identifies one preview session for a specific output.

### begin_led_edit_preview

```json
→ {"jsonrpc":"2.0","method":"begin_led_edit_preview","params":{
  "port":"COM3",
  "outputId":"out1",
  "sessionId":"preview-1"
},"id":1}
```

### update_led_edit_preview

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `port` | string | yes | Device port identifier |
| `outputId` | string | yes | Output ID |
| `sessionId` | string | yes | Preview session ID |
| `offset` | number | no | Zero-based LED offset, default `0` |
| `colors` | Color[] | yes | RGB colors as `{r,g,b}` objects |

```json
→ {"jsonrpc":"2.0","method":"update_led_edit_preview","params":{
  "port":"COM3",
  "outputId":"out1",
  "sessionId":"preview-1",
  "offset":0,
  "colors":[{"r":255,"g":0,"b":0}]
},"id":1}
```

Core rejects an `offset` or preview chunk larger than `65,536` LEDs.

### keepalive_led_edit_preview

```json
→ {"jsonrpc":"2.0","method":"keepalive_led_edit_preview","params":{
  "port":"COM3",
  "outputId":"out1",
  "sessionId":"preview-1"
},"id":1}
```

### end_led_edit_preview

```json
→ {"jsonrpc":"2.0","method":"end_led_edit_preview","params":{
  "port":"COM3",
  "outputId":"out1",
  "sessionId":"preview-1"
},"id":1}
```
