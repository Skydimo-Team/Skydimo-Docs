---
sidebar_position: 6
---

# Extension Plugin Guide

Extension plugins are background services that can bridge external protocols, register virtual devices, lock LEDs for direct control, and provide custom HTML UI pages.

## Directory Structure

```
plugins/extension.my_bridge/
├── manifest.json       # Metadata + permissions
├── init.lua            # Entry script
├── lib/                # Optional Lua modules
│   └── protocol.lua
├── locales/            # Optional i18n files
├── data/               # Persistent data directory
└── page/               # Optional embedded HTML UI
    └── dist/
        └── index.html
```

## Lifecycle

```
Core startup → Load enabled extensions
  → Initialize Lua environment
  → plugin.on_start()              ← Extension started
  → [Event loop]
      plugin.on_scan_devices()     ← Manual scan triggered
      plugin.on_devices_changed()  ← Device list changed
      plugin.on_led_locks_changed()← LED lock changed
      plugin.on_device_frame()     ← Real-time LED data
      plugin.on_page_message()     ← Message from HTML page
  → plugin.on_stop()              ← Extension stopping
```

## Lifecycle Hooks

### on_start()

Called when the extension is loaded. Initialize connections, spawn external processes, register devices.

```lua
function plugin.on_start()
    ext.log("Extension starting")
    -- Connect to external service, register devices, etc.
end
```

### on_scan_devices()

Called when the user manually triggers a device scan.

```lua
function plugin.on_scan_devices()
    ext.log("Scanning for devices...")
    -- Discover and register devices
end
```

### on_devices_changed(devices)

Called when the global device list changes.

```lua
function plugin.on_devices_changed(devices)
    -- React to new/removed devices
end
```

### on_led_locks_changed(locks)

Called when any LED lock state changes.

```lua
function plugin.on_led_locks_changed(locks)
    -- locks: current lock state
end
```

### on_device_frame(port, outputs)

Called with real-time LED color data for every active device frame. This is high-frequency (up to 30+ fps).

```lua
function plugin.on_device_frame(port, outputs)
    -- outputs: {output_id = {r,g,b,r,g,b,...}, ...}
    local colors = outputs["out1"]
    if colors then
        -- Forward colors to external system
    end
end
```

### on_page_message(data)

Called when the embedded HTML page sends a message.

```lua
function plugin.on_page_message(data)
    if data.action == "refresh" then
        -- Handle page request
        ext.page_emit({status = "ok", devices = ext.get_devices()})
    end
end
```

### on_stop()

Called when the extension is being unloaded. Clean up all resources.

```lua
function plugin.on_stop()
    ext.log("Extension stopping")
    -- Close connections, kill processes, unregister devices
end
```

## Registering Virtual Devices

Extensions can register virtual devices that appear in Skydimo like physical hardware:

```lua
local port = ext.register_device({
    controller_port = "openrgb://device_0",
    manufacturer = "Corsair",
    model = "Vengeance RGB",
    serial_id = "ABC123",
    description = "RAM Module",
    controller_id = "extension.openrgb",
    device_type = "dram",
    outputs = {
        {
            id = "zone0",
            name = "Zone 0",
            leds_count = 8,
            output_type = "linear",
        }
    }
})
```

These devices receive effects from Skydimo and you forward the rendered colors to the real hardware via `on_device_frame`.

### Updating Devices

```lua
-- Change device nickname
ext.set_device_nickname(port, "My RAM Stick")

-- Update output configuration
ext.update_output(port, "zone0", {
    leds_count = 16,
    matrix = nil  -- or {width=4, height=4, map={...}}
})

-- Remove a device
ext.remove_extension_device(port)
```

## LED Locking

Extensions can lock specific LEDs for direct color control, overriding the active effect:

```lua
-- Lock LEDs 0-9 for direct control
ext.lock_leds("COM3", "out1", {0, 1, 2, 3, 4, 5, 6, 7, 8, 9})

-- Set colors on locked LEDs
ext.set_leds("COM3", "out1", {
    {0, 255, 0, 0},    -- LED 0: red
    {1, 0, 255, 0},    -- LED 1: green
    {2, 0, 0, 255},    -- LED 2: blue
})

-- Release locks
ext.unlock_leds("COM3", "out1", {0, 1, 2, 3, 4, 5, 6, 7, 8, 9})
```

## Networking (TCP)

Extensions can make TCP connections. Requires the `"network:tcp"` permission.

```lua
-- Connect
local handle = ext.tcp_connect("127.0.0.1", 6742)
-- With timeout:
local handle = ext.tcp_connect("127.0.0.1", 6742, 5000)

-- Send data
local bytes_sent = ext.tcp_send(handle, data_string)

-- Receive data
local data = ext.tcp_recv(handle, 1024)            -- Up to 1024 bytes
local data = ext.tcp_recv(handle, 1024, 5000)      -- With 5s timeout
local data = ext.tcp_recv_exact(handle, 256)        -- Exactly 256 bytes
local data = ext.tcp_recv_exact(handle, 256, 5000)  -- With timeout

-- Close
ext.tcp_close(handle)
```

## Process Management

Extensions can spawn and manage external processes. Requires the `"process"` permission.

```lua
-- Spawn a process
local handle = ext.spawn_process("openrgb.exe", {"--server"}, {
    hidden = true,
    working_dir = ext.data_dir
})

-- Check if running
if ext.is_process_alive(handle) then
    ext.log("Process is running")
end

-- Kill process
ext.kill_process(handle)
```

## Effect Management

Extensions can query and control effects on devices:

```lua
-- Get all available effects
local effects = ext.get_effects()

-- Get effect parameter schema
local params = ext.get_effect_params("rainbow")

-- Set effect on a device output
ext.set_effect("COM3", "out1", "rainbow")
ext.set_effect("COM3", "out1", "rainbow", {speed = 3.0})
```

## Page Communication

Extensions can include an embedded HTML page that appears in the Skydimo UI:

```json title="manifest.json"
{
  "page": "page/dist/index.html"
}
```

Communicate between Lua and the page:

```lua
-- Send data to the HTML page
ext.page_emit({type = "update", devices = ext.get_devices()})

-- Receive from the page (via on_page_message hook)
function plugin.on_page_message(data)
    if data.type == "set_color" then
        ext.set_leds(data.port, data.output, data.colors)
    end
end
```

## Notifications

Send toast notifications to the user:

```lua
-- Simple notification
ext.notify("Connection Established", "Connected to OpenRGB server")

-- With level
ext.notify("Warning", "Device not responding", "warn")  -- "info", "warn", "error"

-- Persistent notification (stays until dismissed)
ext.notify_persistent("conn_status", "Connecting...", "Attempting to connect to server")

-- Dismiss it later
ext.dismiss_persistent("conn_status")
```

## Complete Example: Protocol Bridge

```lua
local plugin = {}

local conn = nil
local devices = {}

function plugin.on_start()
    ext.log("Bridge extension starting")

    -- Spawn external service
    local handle = ext.spawn_process("bridge-server.exe", {"--port", "9000"}, {
        hidden = true
    })

    -- Wait for server to start
    ext.sleep(2000)

    -- Connect
    conn = ext.tcp_connect("127.0.0.1", 9000, 5000)
    if not conn then
        ext.error("Failed to connect to bridge server")
        return
    end

    -- Discover and register devices
    discover_devices()
end

function discover_devices()
    ext.tcp_send(conn, "LIST_DEVICES\n")
    local response = ext.tcp_recv(conn, 4096, 3000)
    if not response then return end

    -- Parse response and register each device
    for name, leds in response:gmatch("(%S+):(%d+)") do
        local port = ext.register_device({
            controller_port = "bridge://" .. name,
            manufacturer = "Bridge",
            model = name,
            controller_id = "extension.my_bridge",
            device_type = "light",
            outputs = {{
                id = "main",
                name = "Main",
                leds_count = tonumber(leds),
                output_type = "linear"
            }}
        })
        devices[port] = {name = name, conn = conn}
    end
end

function plugin.on_device_frame(port, outputs)
    local dev = devices[port]
    if not dev then return end

    local colors = outputs["main"]
    if colors then
        local packet = "SET_LEDS:" .. dev.name .. ":" .. table.concat(colors, ",")
        ext.tcp_send(conn, packet .. "\n")
    end
end

function plugin.on_scan_devices()
    discover_devices()
end

function plugin.on_stop()
    -- Unregister all devices
    for port in pairs(devices) do
        ext.remove_extension_device(port)
    end
    -- Close connection
    if conn then ext.tcp_close(conn) end
end

return plugin
```

See the [Extension API Reference](api/extension-api) for the complete API.
