---
sidebar_position: 4
---

# Controller Plugin Guide

Controller plugins are hardware device drivers. They handle communication with physical RGB devices over Serial, HID, or other protocols.

## Directory Structure

```
plugins/controller.my_device/
├── manifest.json       # Plugin metadata + hardware match rules
├── main.lua            # Entry script with lifecycle hooks
├── lib/                # Optional Lua modules
│   ├── protocol.lua    # Wire protocol implementation
│   └── config.lua      # Device configuration
├── locales/            # Optional i18n files
│   ├── en-US.json
│   └── zh-CN.json
└── data/               # Runtime data (created by Core)
```

## Lifecycle

```
Device Discovery (USB VID/PID match)
  → Open device handle (serial/HID)
  → plugin.on_validate()       ← Claim or reject device
    → Failed? Close handle, try next plugin
    → Succeeded? Continue
  → plugin.on_init()            ← Register output ports
  → [Render loop] plugin.on_tick(dt)  ← Send colors to hardware
  → plugin.on_shutdown()        ← Cleanup
```

## Lifecycle Hooks

### on_validate()

Called to determine if this plugin can drive the detected device. Use this to send a handshake command and verify the device identity.

**Must return**: `true` to claim the device, `false` to pass to the next plugin.

```lua
function plugin.on_validate()
    -- Send identification command
    device:write("\x01\x00")
    local response = device:read(8, 500)  -- 8 bytes, 500ms timeout

    if response and #response >= 4 then
        device:set_manufacturer("MyBrand")
        device:set_model("LED Strip v2")
        return true
    end

    return false
end
```

### on_init()

Called after successful validation. Register the device's output ports here.

```lua
function plugin.on_init()
    device:add_output({
        id = "main",
        name = "LED Strip",
        type = "linear",
        size = 144,
        capabilities = {
            editable = false,
            min_total_leds = 1,
            max_total_leds = 300,
        }
    })
end
```

### on_tick(dt)

Called every frame. Read the mixed color data and send it to the hardware.

- `dt` — Time since last tick in seconds (float)

```lua
function plugin.on_tick(dt)
    local rgb = device:get_rgb_bytes("main")
    -- Build protocol packet and send
    local header = string.char(0x02, #rgb // 3)
    device:write(header .. rgb)
end
```

### on_shutdown()

Called when the device disconnects or the plugin is unloaded. Clean up resources and optionally blank the LEDs.

```lua
function plugin.on_shutdown()
    local count = device:output_led_count("main") or 0
    if count > 0 then
        -- Send all-black frame
        local blank = string.rep("\x00\x00\x00", count)
        device:write("\x02" .. string.char(count) .. blank)
    end
end
```

## Output Port Types

| Type | Description |
|------|-------------|
| `"single"` | Single-color light (1 LED) |
| `"linear"` | Linear LED strip |
| `"matrix"` | 2D LED matrix grid |

### Matrix Output

For matrix-type outputs, provide a `matrix` field:

```lua
device:add_output({
    id = "panel",
    name = "LED Panel",
    type = "matrix",
    size = 144,
    matrix = {
        width = 12,
        height = 12,
        map = {1, 2, 3, ..., 144}  -- Pixel mapping, -1 = unmapped
    }
})
```

The `map` array defines how logical LED indices map to physical positions. Use `-1` for dead pixels.

## Output Capabilities

```lua
capabilities = {
    editable = true,          -- Can the user resize this output?
    min_total_leds = 1,       -- Minimum LED count
    max_total_leds = 512,     -- Maximum LED count
    allowed_total_leds = nil, -- Specific allowed counts (e.g. {60, 120, 144})
}
```

## Complete Example

```lua
-- plugins/controller.my_serial_strip/main.lua
local plugin = {}

local HEADER = 0xAA
local CMD_SET_LEDS = 0x01
local CMD_IDENTIFY = 0x02

function plugin.on_validate()
    device:write(string.char(HEADER, CMD_IDENTIFY))
    local resp = device:read(16, 1000)

    if not resp or #resp < 4 then
        return false
    end

    local model_len = string.byte(resp, 3)
    local model = resp:sub(4, 3 + model_len)

    device:set_manufacturer("MyCompany")
    device:set_model(model)
    device:set_device_type("light")
    return true
end

function plugin.on_init()
    device:add_output({
        id = "strip",
        name = "RGB Strip",
        type = "linear",
        size = 60,
        capabilities = {
            editable = true,
            min_total_leds = 1,
            max_total_leds = 300,
        }
    })
end

function plugin.on_tick(_dt)
    local rgb = device:get_rgb_bytes("strip")
    local count = device:output_led_count("strip")
    -- Protocol: HEADER, CMD, COUNT_HIGH, COUNT_LOW, R,G,B,...
    local packet = string.char(HEADER, CMD_SET_LEDS,
        math.floor(count / 256), count % 256) .. rgb
    device:write(packet)
end

function plugin.on_shutdown()
    local count = device:output_led_count("strip") or 0
    if count > 0 then
        local blank = string.rep("\x00\x00\x00", count)
        local packet = string.char(HEADER, CMD_SET_LEDS,
            math.floor(count / 256), count % 256) .. blank
        device:write(packet)
    end
end

return plugin
```

## HID Devices

For HID protocol devices, use the HID-specific I/O methods:

```lua
-- Send a HID feature report
device:hid_send_feature_report(packet)
device:hid_send_feature_report(packet, length, selector)

-- Read a HID feature report
local data = device:hid_get_feature_report(length)
local data = device:hid_get_feature_report(length, report_id, selector)

-- List HID interfaces
local interfaces = device:hid_interfaces()
```

See the [Controller API Reference](api/controller-api) for the complete `device` object API.
