---
sidebar_position: 3
---

# Extension API Reference

Complete reference for the `ext` global object available in extension plugins.

## Properties

### ext.data_dir

The plugin's persistent data directory path. Use this for storing configuration files, caches, etc.

```lua
local config_path = ext.data_dir .. "/config.json"
```

---

## Utility

### ext.sleep(ms)

Sleep for the specified number of milliseconds.

```lua
ext.sleep(1000)  -- Sleep 1 second
```

---

## Logging

### ext.log(msg)

Log at info level.

```lua
ext.log("Extension initialized")
```

### ext.warn(msg)

Log at warning level.

```lua
ext.warn("Device not responding, retrying...")
```

### ext.error(msg)

Log at error level.

```lua
ext.error("Connection failed: " .. err)
```

---

## Notifications

### ext.notify(title, description [, level])

Show a toast notification to the user.

```lua
ext.notify("Device Found", "Corsair Vengeance RGB connected")
ext.notify("Warning", "Connection unstable", "warn")
```

- `level` — `"info"` (default), `"warn"`, or `"error"`

### ext.notify_persistent(id, title, description)

Show a persistent notification that remains until dismissed.

```lua
ext.notify_persistent("conn_status", "Connecting...", "Attempting to connect to server")
```

### ext.dismiss_persistent(id)

Dismiss a persistent notification.

```lua
ext.dismiss_persistent("conn_status")
```

---

## Device Management

### ext.register_device(config)

Register a virtual device in Skydimo.

```lua
local port = ext.register_device({
    controller_port = "bridge://device_0",
    device_path = "bridge://device_0",   -- optional, defaults to controller_port
    nickname = "My Device",               -- optional
    manufacturer = "Vendor",
    model = "Device Name",
    serial_id = "SN123456",
    description = "RGB Controller",
    controller_id = "extension.my_bridge",
    device_type = "light",
    image_url = "https://example.com/device.png",  -- optional
    outputs = {
        {
            id = "zone0",
            name = "Main Zone",
            leds_count = 144,
            output_type = "linear",    -- "single", "linear", "matrix"
            editable = false,
            min_total_leds = 1,
            max_total_leds = 300,
            matrix = nil,              -- or {width, height, map}
        }
    }
})
```

**Returns**: `string` — the controller port identifier for this device.

### ext.remove_extension_device(port)

Remove a previously registered virtual device.

```lua
ext.remove_extension_device("bridge://device_0")
```

### ext.set_device_nickname(port, nickname)

Set a custom display name for a device.

```lua
ext.set_device_nickname("bridge://device_0", "Living Room Strip")
```

### ext.get_devices()

Get all devices in the system.

```lua
local devices = ext.get_devices()
for _, dev in ipairs(devices) do
    ext.log("Device: " .. dev.port .. " - " .. dev.model)
end
```

### ext.get_device_info(port)

Get detailed information about a specific device.

```lua
local info = ext.get_device_info("COM3")
if info then
    ext.log("Model: " .. info.model)
end
```

---

## Output Management

### ext.set_output_leds_count(port, output_id, count)

Change the LED count for an output.

```lua
ext.set_output_leds_count("bridge://device_0", "zone0", 120)
```

### ext.update_output(port, output_id, config)

Update an output's configuration.

```lua
ext.update_output("bridge://device_0", "zone0", {
    leds_count = 144,
    matrix = {width = 12, height = 12, map = {...}}
})
```

---

## LED Locking & Direct Control

### ext.lock_leds(port, output_id, indices)

Lock specific LEDs for direct control, overriding the active effect.

```lua
ext.lock_leds("COM3", "out1", {0, 1, 2, 3, 4})
```

- `indices` — Zero-based LED indices to lock

### ext.unlock_leds(port, output_id, indices)

Release LED locks.

```lua
ext.unlock_leds("COM3", "out1", {0, 1, 2, 3, 4})
```

### ext.set_leds(port, output_id, colors)

Set colors on locked LEDs.

**Index-based format:**

```lua
ext.set_leds("COM3", "out1", {
    {0, 255, 0, 0},     -- {index, r, g, b}
    {1, 0, 255, 0},
    {2, 0, 0, 255},
})
```

**Flat RGB format:**

```lua
ext.set_leds("COM3", "out1", {255, 0, 0, 0, 255, 0, 0, 0, 255})
-- Sets LED 0=red, LED 1=green, LED 2=blue
```

### ext.get_led_locks([port [, output_id]])

Query current LED lock state.

```lua
local all_locks = ext.get_led_locks()
local device_locks = ext.get_led_locks("COM3")
local output_locks = ext.get_led_locks("COM3", "out1")
```

---

## Effect Management

### ext.get_effects()

Get all available effects.

```lua
local effects = ext.get_effects()
for _, effect in ipairs(effects) do
    ext.log("Effect: " .. effect.id)
end
```

### ext.get_effect_params(effect_id)

Get the parameter schema for an effect.

```lua
local params = ext.get_effect_params("rainbow")
```

### ext.set_effect(port, output_id, effect_id [, params])

Set the active effect on a device output.

```lua
ext.set_effect("COM3", "out1", "rainbow")
ext.set_effect("COM3", "out1", "rainbow", {speed = 3.0, preset = 1})
```

---

## Networking (TCP)

Requires the `"network:tcp"` permission.

### ext.tcp_connect(host, port [, timeout_ms])

Open a TCP connection.

```lua
local handle = ext.tcp_connect("127.0.0.1", 6742)
local handle = ext.tcp_connect("192.168.1.100", 8080, 5000)
```

**Returns**: `integer` — connection handle, or raises an error on failure.

### ext.tcp_send(handle, data)

Send data over a TCP connection.

```lua
local bytes_sent = ext.tcp_send(handle, "HELLO\n")
```

**Returns**: `integer` — number of bytes sent.

### ext.tcp_recv(handle, max_len [, timeout_ms])

Receive up to `max_len` bytes.

```lua
local data = ext.tcp_recv(handle, 4096)
local data = ext.tcp_recv(handle, 4096, 5000)  -- 5s timeout
```

**Returns**: `string` — received data.

### ext.tcp_recv_exact(handle, bytes [, timeout_ms])

Receive exactly `bytes` bytes (blocks until all received or timeout).

```lua
local header = ext.tcp_recv_exact(handle, 4)
local payload = ext.tcp_recv_exact(handle, payload_len, 10000)
```

**Returns**: `string` — received data.

### ext.tcp_close(handle)

Close a TCP connection.

```lua
ext.tcp_close(handle)
```

---

## Process Management

Requires the `"process"` permission.

### ext.spawn_process(exe, args [, options])

Spawn an external process.

```lua
local handle = ext.spawn_process("openrgb", {"--server", "--port", "6742"}, {
    hidden = true,
    working_dir = ext.data_dir
})
```

- `args` — Table of command-line arguments
- `options.hidden` — Hide the process window (boolean)
- `options.working_dir` — Working directory path

**Returns**: `integer` — process handle.

### ext.is_process_alive(handle)

Check if a process is still running.

```lua
if ext.is_process_alive(handle) then
    ext.log("Process is running")
end
```

**Returns**: `boolean`

### ext.kill_process(handle)

Terminate a process.

```lua
ext.kill_process(handle)
```

---

## Page Communication

### ext.page_emit(data)

Send data to the extension's embedded HTML page.

```lua
ext.page_emit({type = "devices_update", devices = ext.get_devices()})
```

- `data` — Any Lua table (serialized to JSON for the page)

---

## Lifecycle Hooks Summary

| Hook | Signature | Description |
|------|-----------|-------------|
| `on_start()` | `function()` | Extension loaded |
| `on_scan_devices()` | `function()` | Manual scan triggered |
| `on_devices_changed(devices)` | `function(table)` | Device list changed |
| `on_led_locks_changed(locks)` | `function(table)` | LED lock state changed |
| `on_device_frame(port, outputs)` | `function(string, table)` | Real-time LED frame data |
| `on_page_message(data)` | `function(table)` | Message from HTML page |
| `on_stop()` | `function()` | Extension stopping |
