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

### ext.plugin

Read-only table containing metadata about the current extension plugin, as declared in `manifest.json`.

```lua
local p = ext.plugin

ext.log(p.id)           -- Plugin ID, e.g. "extension.my_plugin"
ext.log(p.name.raw)     -- Display name (raw string)
ext.log(p.version)      -- Version string, e.g. "1.0.0"
ext.log(p.publisher)    -- Publisher name
ext.log(p.type)         -- Always "extension"

-- Optional fields (nil if not declared in manifest)
if p.description then
    ext.log(p.description.raw)
end
if p.repository then
    ext.log(p.repository)
end
if p.license then
    ext.log(p.license)
end
if p.page_path then
    ext.log(p.page_path)
end
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Plugin ID |
| `name` | [LocalizedText](../../api/data-types.md#localizedtext) | Plugin display name |
| `version` | string | Plugin version |
| `publisher` | string | Plugin publisher |
| `permissions` | string[] | Declared permissions |
| `type` | string | Always `"extension"` |
| `description` | LocalizedText? | Plugin description (`nil` if not set) |
| `repository` | string? | Source repository URL (`nil` if not set) |
| `license` | string? | License identifier (`nil` if not set) |
| `page_path` | string? | Relative path to the extension HTML page (`nil` if not set) |

---

## System Information

:::info Version
Available since **3.0.0-dev.2**. Requires the `"system:info"` permission.
:::

When the plugin declares the `"system:info"` permission, a read-only `ext.system` table is injected containing hardware and OS details.

### ext.system

```lua
local sys = ext.system

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

## Utility

### ext.json_encode(value)

:::info Version
Available since **3.0.0-dev.3**.
:::

Encode a Lua table or value into a JSON string.

```lua
local json_str = ext.json_encode({ hello = "world", count = 5 })
```

### ext.json_decode(json_string)

:::info Version
Available since **3.0.0-dev.3**.
:::

Decode a JSON string into a Lua table or value.

```lua
local data = ext.json_decode('{"hello": "world"}')
ext.log(data.hello)
```

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

Get all available effects (built-in + Lua plugins).

```lua
local effects = ext.get_effects()
for _, effect in ipairs(effects) do
    ext.log("Effect: " .. effect.id .. " - " .. effect.name.raw)
end
```

Each entry in the returned array has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Effect plugin ID |
| `name` | [LocalizedText](../../api/data-types.md#localizedtext) | Effect display name |
| `description` | LocalizedText? | Short description (`nil` if not set) |
| `group` | LocalizedText? | Category/group name (`nil` if not set) |
| `icon` | string? | Icon identifier (`nil` if not set) |

### ext.get_effect_params(effect_id)

Get the parameter schema for an effect.

```lua
local params = ext.get_effect_params("rainbow")
```

### ext.set_effect(port, output_id, effect_id [, params])

:::note Legacy
This is a legacy convenience wrapper. For new plugins, prefer [`ext.set_scope_effect(scope, ...)`](#extsetscopeeffectscope-effect_id-params) which supports `segment_id`.
:::

Set the active effect on a device output.

```lua
ext.set_effect("COM3", "out1", "rainbow")
ext.set_effect("COM3", "out1", "rainbow", {speed = 3.0, preset = 1})
```

---

## Resource Queries

:::info Version
Available since **3.0.0-dev.3**.
:::

### ext.get_media_session([max_edge])

Requires the `"media:session"` permission.

Get the current system media playback session snapshot, including metadata, playback status, timeline, and album artwork.

```lua
local session = ext.get_media_session(256) -- Optional: max edge size for artwork
if session then
    ext.log("Playing: " .. session.title .. " by " .. session.artist)
    ext.log("Status: " .. session.playback_status)
    if session.artwork then
        ext.log("Artwork size: " .. session.artwork.width .. "x" .. session.artwork.height)
    end
end
```

**Returns**: A media session object or `nil` if no active session.

### ext.get_displays()

Get a list of all connected displays.

```lua
local displays = ext.get_displays()
for _, d in ipairs(displays) do
    ext.log("Display: " .. d.name .. " [" .. d.width .. "x" .. d.height .. "]")
end
```

**Returns**: array of display objects.

### ext.get_audio_devices()

Get a list of all audio output devices.

```lua
local devices = ext.get_audio_devices()
for i, dev in ipairs(devices) do
    ext.log(i .. ": " .. dev.name)
end
```

**Returns**: array of audio device objects.

---

## Scope API

:::info Version
Available since **3.0.0-dev.3**.
:::

All scope functions accept a **scope table** as their first argument:

```lua
-- Scope table structure
local scope = {
    port       = "COM3",       -- required: device port
    output_id  = "out1",       -- optional: specific output
    segment_id = "seg0",       -- optional: specific segment (requires output_id)
}
```

### Scope State Queries

#### ext.get_scope_screen_state(scope)

Get the current screen capture state for a scope (selected screen index and region).

```lua
local state = ext.get_scope_screen_state({port = "COM3", output_id = "out1"})
-- state.screen_index, state.region ...
```

#### ext.get_scope_audio_device_state(scope)

Get the current audio device index assigned to a scope.

```lua
local index = ext.get_scope_audio_device_state({port = "COM3", output_id = "out1"})
```

---

### Scope Media Management

#### ext.set_scope_screen_index(scope, screen_index)

Set the display index used for screen-capture effects on a scope.

- `screen_index` — Zero-based display index, or `nil` to use default.

```lua
ext.set_scope_screen_index({port = "COM3", output_id = "out1"}, 0)
ext.set_scope_screen_index({port = "COM3", output_id = "out1"}, nil) -- reset
```

#### ext.set_scope_screen_region(scope, region)

Set the screen capture region for a scope.

- `region` — A `ScreenRegion` table: `{x, y, width, height}`.

```lua
ext.set_scope_screen_region({port = "COM3", output_id = "out1"}, {
    x = 0, y = 0, width = 1920, height = 1080
})
```

#### ext.set_scope_audio_device_index(scope, audio_device_index)

Set the audio device index for audio-reactive effects on a scope.

- `audio_device_index` — Zero-based device index, or `nil` to use default.

```lua
ext.set_scope_audio_device_index({port = "COM3", output_id = "out1"}, 0)
```

---

### Scope Mode Management

#### ext.set_scope_effect(scope, effect_id [, params])

Set the active effect on a scope. Supports `segment_id`.

```lua
ext.set_scope_effect({port = "COM3", output_id = "out1"}, "rainbow")
ext.set_scope_effect(
    {port = "COM3", output_id = "out1", segment_id = "seg0"},
    "breathing",
    {speed = 2.0}
)
ext.set_scope_effect({port = "COM3", output_id = "out1"}, nil) -- clear effect
```

#### ext.update_scope_effect_params(scope, params)

Update only the parameters of the currently active effect on a scope, without changing the effect itself.

```lua
ext.update_scope_effect_params({port = "COM3", output_id = "out1"}, {
    speed = 5.0,
    color = {r = 255, g = 0, b = 0}
})
```

#### ext.reset_scope_effect_params(scope)

Reset the effect parameters of a scope to their defaults.

```lua
ext.reset_scope_effect_params({port = "COM3", output_id = "out1"})
```

#### ext.set_scope_mode_paused(scope, paused)

Pause or resume the active effect on a scope.

```lua
ext.set_scope_mode_paused({port = "COM3", output_id = "out1"}, true)  -- pause
ext.set_scope_mode_paused({port = "COM3", output_id = "out1"}, false) -- resume
```

#### ext.set_scope_power(scope, is_off)

Turn a scope's output on or off.

```lua
ext.set_scope_power({port = "COM3", output_id = "out1"}, true)  -- turn off
ext.set_scope_power({port = "COM3", output_id = "out1"}, false) -- turn on
```

#### ext.set_scope_brightness(scope, brightness)

Set the brightness level for a scope (0–100).

```lua
ext.set_scope_brightness({port = "COM3", output_id = "out1"}, 80)
```

---

## Networking

:::info Version
The new structured `ext.net.*` APIs are available since **3.0.0-dev.3**.
:::

Requires the `"network"`, `"network:tcp"`, or `"network:http"` permission depending on the feature used.

### HTTP Client (`ext.net.http`)

Requires `"network:http"` or `"network"`.

#### ext.net.http.request(options)

Make a one-shot HTTP request. 

```lua
local response = ext.net.http.request({
    method = "GET",
    url = "https://api.github.com/repos/skydimo/light",
    headers = { ["User-Agent"] = "SkydimoExtension" },
    timeout_ms = 10000
})

if response.ok then
    local data = ext.json_decode(response.body)
    ext.log("Repo: " .. data.full_name)
end
```

**Options**:
- `method` — HTTP method (default: `"GET"`).
- `url` — The full target URL.
- `headers` — Table of HTTP headers.
- `body` — String payload.
- `json` — Table/Value to be sent as JSON (sets `Content-Type: application/json` automatically). Cannot be used together with `body`.
- `timeout_ms` — Request timeout in milliseconds (default: `30000`).
- `connect_timeout_ms` — Connection timeout in milliseconds (default: `10000`).
- `max_response_bytes` — Max allowed response size (default: 4MB).
- `follow_redirects` — Whether to follow HTTP redirects (default: `true`).
- `max_redirects` — Limit the maximum number of redirects.

**Returns**: A `HttpResponseData` table containing `ok` (boolean), `status` (integer), `url` (string), `headers` (table), and `body` (string).

#### ext.net.http.stream(options)

:::note
Also available as `ext.net.http.open()`.
:::

Open a streamed HTTP request. Useful for Server-Sent Events (SSE) or downloading large payloads in chunks.
Events must be consumed manually using `read()`.

```lua
local handle = ext.net.http.stream({
    url = "https://example.com/events"
})
```

**Returns**: `integer` — Stream handle.

#### ext.net.http.read(handle [, timeout_ms])

Read the next event from an HTTP stream.

```lua
local event = ext.net.http.read(handle, 5000)

if event then
    if event.type == "headers" then
        ext.log("Response status: " .. event.status)
    elseif event.type == "chunk" then
        ext.log("Received chunk of size: " .. #event.data)
    elseif event.type == "done" then
        ext.log("Stream finished")
    elseif event.type == "error" then
        ext.error("Stream error: " .. event.message)
    end
end
```

**Returns**: Event table (`type`, `status`, `data`, `message`), or `nil` if it timed out. The available properties depend on the event `type` (`"headers"`, `"chunk"`, `"done"`, or `"error"`).

#### ext.net.http.close(handle)

Close an active HTTP stream. Streams are not closed automatically until they reach `"done"` or `"error"`.

```lua
ext.net.http.close(handle)
```

---

### TCP Client (`ext.net.tcp`)

Requires `"network:tcp"` or `"network"`.

#### ext.net.tcp.connect(options)

Open a blocking TCP connection.

```lua
local handle = ext.net.tcp.connect({
    host = "192.168.1.100",
    port = 8080,
    connect_timeout_ms = 5000,
    read_timeout_ms = nil,
    write_timeout_ms = nil,
    no_delay = true
})
```

**Options**:
- `host` — IP address or hostname.
- `port` — Port number.
- `connect_timeout_ms` — connection timeout (default: `5000`).
- `read_timeout_ms` — default timeout for reads on this connection.
- `write_timeout_ms` — default timeout for writes on this connection.
- `no_delay` — Enables `TCP_NODELAY` (default: `true`).

**Returns**: `integer` — Connection handle, or raises an error on failure.

#### ext.net.tcp.write(handle, data [, timeout_ms])

Write data to a TCP connection.

```lua
local bytes_written = ext.net.tcp.write(handle, "HELLO\n")
```

**Returns**: `integer` — Number of bytes successfully written.

#### ext.net.tcp.write_all(handle, data [, timeout_ms])

Write all data to a TCP connection. Blocks until the whole payload is sent.

```lua
ext.net.tcp.write_all(handle, "HELLO\n")
```

#### ext.net.tcp.read(handle, max_len [, timeout_ms])

Receive up to `max_len` bytes. If `timeout_ms` is `0` or omitted, it relies on the connection's default read timeout or blocks indefinitely.

```lua
local data = ext.net.tcp.read(handle, 4096)
```

**Returns**: `string` — received data.

#### ext.net.tcp.read_exact(handle, bytes [, timeout_ms])

Receive exactly `bytes` bytes. Blocks until all are received or an error/timeout occurs.

```lua
local data = ext.net.tcp.read_exact(handle, 4)
```

**Returns**: `string` — received data.

#### ext.net.tcp.close(handle)

Close a TCP connection.

```lua
ext.net.tcp.close(handle)
```

---

### Legacy TCP API (Deprecated)

:::caution Deprecated
The following global `ext.tcp_*` interfaces are deprecated and will be removed in a future release. Please transition to `ext.net.tcp.*`.
:::

- `ext.tcp_connect(host, port [, timeout_ms])` -> `ext.net.tcp.connect({host=host, port=port, connect_timeout_ms=timeout_ms})`
- `ext.tcp_send(handle, data [, timeout_ms])` -> `ext.net.tcp.write(...)`
- `ext.tcp_recv(handle, max_len [, timeout_ms])` -> `ext.net.tcp.read(...)`
- `ext.tcp_recv_exact(handle, bytes [, timeout_ms])` -> `ext.net.tcp.read_exact(...)`
- `ext.tcp_close(handle)` -> `ext.net.tcp.close(...)`

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
| `on_system_media_changed(session)` | `function(table)` | System media metadata/artwork changed (requires `media:session`; ≥ 3.0.0-dev.3) |
| `on_system_media_playback_changed(session)` | `function(table)` | System media playback status changed (requires `media:session`; ≥ 3.0.0-dev.3) |
| `on_system_media_timeline_changed(session)` | `function(table)` | System media timeline/progress changed (requires `media:session`; ≥ 3.0.0-dev.3) |
| `on_device_frame(port, outputs)` | `function(string, table)` | Real-time LED frame data |
| `on_page_message(data)` | `function(table)` | Message from HTML page |
| `on_stop()` | `function()` | Extension stopping |
