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

Returns the manufacturer name. Pre-populated from the USB descriptor if available; can be overridden via `set_manufacturer()`.

### device:model()

Returns the device model. Pre-populated from the USB product string if available; can be overridden via `set_model()`.

### device:serial_id()

Returns the USB serial number (set via `set_serial_id`, pre-populated for HID devices).

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

Override the device manufacturer name. If not called, the value reported by the USB descriptor is used.

```lua
device:set_manufacturer("Skydimo")
```

### device:set_model(str)

Override the device model name. If not called, the USB product string is used (serial) or the USB product string if available (HID).

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

Set the device type. Accepts a case-insensitive string (hyphens are treated as underscores).

| Value | Aliases | Description |
|-------|---------|-------------|
| `"light"` | | Generic LED light |
| `"led_strip"` | `"ledstrip"` | LED strip |
| `"keyboard"` | | Keyboard |
| `"keypad"` | | Keypad |
| `"mouse"` | | Mouse |
| `"mouse_mat"` | `"mousemat"` | Mouse mat |
| `"headset"` | | Headset |
| `"headset_stand"` | `"headsetstand"` | Headset stand |
| `"gamepad"` | | Gamepad |
| `"motherboard"` | | Motherboard |
| `"gpu"` | | Graphics card |
| `"dram"` | `"memory"` | RAM module |
| `"cooler"` | | Cooler (fan / AIO) |
| `"case"` | | PC case |
| `"speaker"` | | Speaker |
| `"microphone"` | | Microphone |
| `"monitor"` | | Monitor |
| `"laptop"` | | Laptop |
| `"storage"` | | Storage device |
| `"accessory"` | | Accessory |
| `"virtual"` | | Virtual device |
| `"unknown"` | | Unknown type |

```lua
device:set_device_type("keyboard")
```

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
    },
    default_effect = "rainbow_wave",  -- optional
})
```

:::info Version
The `default_effect` field is available since **3.0.0-dev.4**. When set, this effect is automatically applied to the output when no user configuration exists.
:::

---

## Data I/O

### device:write(data)

Send data to the device.

```lua
device:write(packet_string)           -- Write full string
device:write(packet_string, length)   -- Write first N bytes
device:write({0x01, 0x02, 0xFF})      -- Write from byte table
```

**Returns**: `true` on success.

Accepts a Lua string (binary data), a table of byte values (0–255), or `nil` (no-op).

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

## System Information

:::info Version
Available since **3.0.0-dev.2**. Requires the `"system:info"` permission.
:::

When the plugin declares the `"system:info"` permission, a read-only `host.system` table is injected containing hardware and OS details.

### host.system

```lua
local sys = host.system

-- OS
sys.os.platform    -- "Windows" | "macOS" | "linux"
sys.os.version     -- e.g. "Microsoft Windows 11 Pro"
sys.os.build       -- e.g. "22631"
sys.os.arch        -- e.g. "x86_64"
sys.os.hostname    -- e.g. "MY-PC"

-- Motherboard
sys.motherboard.manufacturer   -- e.g. "ASUSTeK COMPUTER INC."
sys.motherboard.model          -- e.g. "ROG STRIX B550-F GAMING"
sys.motherboard.product        -- same as model
sys.motherboard.serial_number  -- board serial

-- BIOS
sys.bios.vendor    -- e.g. "American Megatrends Inc."
sys.bios.version   -- e.g. "2803"
sys.bios.date      -- e.g. "12/01/2023"

-- CPU
sys.cpu.name            -- e.g. "AMD Ryzen 9 5900X 12-Core Processor"
sys.cpu.manufacturer    -- e.g. "AMD"
sys.cpu.cores           -- physical core count
sys.cpu.threads         -- logical thread count
sys.cpu.base_clock_mhz  -- base clock in MHz
sys.cpu.architecture    -- e.g. "x64"

-- GPU (array, 1-indexed)
for i, gpu in ipairs(sys.gpu) do
    gpu.name              -- e.g. "NVIDIA GeForce RTX 3080"
    gpu.manufacturer      -- e.g. "NVIDIA"
    gpu.driver_version    -- e.g. "537.58"
    gpu.vram_mb           -- VRAM in MB
end

-- RAM
sys.ram.total_memory_mb  -- total physical memory in MB
for i, m in ipairs(sys.ram.modules) do
    m.manufacturer   -- module manufacturer
    m.part_number    -- module part number
    m.capacity_mb    -- module capacity in MB
    m.speed_mhz      -- module speed in MHz
    m.form_factor    -- e.g. "DIMM", "SO-DIMM"
end
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
