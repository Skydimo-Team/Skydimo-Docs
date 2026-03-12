---
sidebar_position: 1
---

# Controller API Reference

Complete reference for the `device` global object available in controller plugins.

## Device Metadata

### device:controller_port()

Returns the device's port identifier.

```lua
local port = device:controller_port()  -- e.g. "COM3", "/dev/ttyUSB0"
```

### device:manufacturer()

Returns the manufacturer name (set via `set_manufacturer`).

### device:model()

Returns the device model (set via `set_model`).

### device:serial_id()

Returns the USB serial number (set via `set_serial_id`).

### device:device_id()

Returns the unique device ID (hash computed by Core).

### device:description()

Returns the device description.

### device:image_url()

Returns the device image URL, or `nil`.

### device:vendor_id()

Returns the USB Vendor ID as a number, or `nil`.

### device:product_id()

Returns the USB Product ID as a number, or `nil`.

---

## Device Configuration

:::note
These methods can only be called during `on_validate()` and `on_init()`.
:::

### device:set_manufacturer(str)

Set the device manufacturer name.

```lua
device:set_manufacturer("Skydimo")
```

### device:set_model(str)

Set the device model name.

```lua
device:set_model("LED Strip v2")
```

### device:set_serial_id(str)

Set the USB serial identifier.

```lua
device:set_serial_id("ABC123")
```

### device:set_description(str)

Set a human-readable device description.

### device:set_image_url(url)

Set a thumbnail URL for the device. Pass `nil` to clear.

### device:set_device_type(str)

Set the device type. Common values:

| Value | Description |
|-------|-------------|
| `"light"` | Generic LED light |
| `"keyboard"` | Keyboard |
| `"mouse"` | Mouse |
| `"gpu"` | Graphics card |
| `"motherboard"` | Motherboard |
| `"dram"` | RAM module |
| `"headset"` | Headset |
| `"fan"` | Fan |
| `"aio"` | AIO cooler |

---

## Output Port Registration

:::note
`add_output` can only be called during `on_init()`.
:::

### device:add_output(config)

Register a hardware output port.

**Simple form:**

```lua
device:add_output("output_id", led_count)
```

**Full form:**

```lua
device:add_output({
    id = "out1",
    name = "Output 1",
    type = "linear",       -- "single", "linear", "matrix"
    size = 144,
    matrix = {             -- Only for "matrix" type
        width = 12,
        height = 12,
        map = {1, 2, ..., 144}  -- -1 = unmapped
    },
    capabilities = {
        editable = false,
        min_total_leds = 1,
        max_total_leds = 300,
        allowed_total_leds = nil  -- or {60, 120, 144}
    }
})
```

---

## Data I/O

### device:write(data)

Send data to the device.

```lua
device:write(packet_string)           -- Write full string
device:write(packet_string, length)   -- Write first N bytes
```

**Returns**: `true` on success.

Accepts a Lua string (binary data).

### device:read(length)

Read data from the device.

```lua
local data = device:read(64)           -- Read up to 64 bytes
local data = device:read(64, 500)      -- With 500ms timeout
```

**Returns**: A Lua string of raw bytes, or `nil` on failure/timeout.

### device:clear_input()

Clear the serial input buffer (serial protocol only).

```lua
device:clear_input()
```

---

## LED Color Data

### device:get_colors(output_id)

Get the mixed LED colors as a Lua table.

```lua
local colors = device:get_colors("out1")
-- Returns: {r, g, b, r, g, b, ...} (numbers 0-255)
```

### device:get_rgb_bytes(output_id)

Get the mixed LED colors as a binary string.

```lua
local rgb = device:get_rgb_bytes("out1")
-- Returns: binary string of RGB bytes
-- More efficient than get_colors for direct hardware I/O
```

### device:output_led_count(output_id)

Get the LED count for an output.

```lua
local count = device:output_led_count("out1")  -- e.g. 144
```

---

## HID-Specific Methods

### device:hid_send_feature_report(data)

Send a HID feature report.

```lua
device:hid_send_feature_report(packet)
device:hid_send_feature_report(packet, length, selector)
```

- `selector` can be an integer or string to select a specific HID interface.

### device:hid_get_feature_report(length)

Read a HID feature report.

```lua
local report = device:hid_get_feature_report(64)
local report = device:hid_get_feature_report(64, report_id, selector)
```

### device:hid_interfaces()

List all HID interfaces for the device.

```lua
local interfaces = device:hid_interfaces()
-- Returns table of interface descriptors
```

---

## Logging

### device:log(msg)

Log an info-level message.

```lua
device:log("Identified device: " .. device:model())
```

### device:error(msg)

Log an error-level message.

```lua
device:error("Failed to send data to device")
```
