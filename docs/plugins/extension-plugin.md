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
      plugin.on_system_media_*()   ← Media playback changes
      plugin.on_system_state_changed() ← System state changes
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

### on_system_media_changed(session)

:::info Version
Available since **3.0.0-dev.3**. Requires the `"media:session"` permission.
:::

Called when the system media session properties (title, artist, album, artwork, etc.) change.

```lua
function plugin.on_system_media_changed(session)
    if session then
        ext.log("Now playing changed: " .. session.title)
    end
end
```

### on_system_media_playback_changed(session)

:::info Version
Available since **3.0.0-dev.3**. Requires the `"media:session"` permission.
:::

Called when the playback state (playing, paused, stopped) changes.

```lua
function plugin.on_system_media_playback_changed(session)
    if session then
        ext.log("Playback state: " .. session.playback_status)
    end
end
```

### on_system_media_timeline_changed(session)

:::info Version
Available since **3.0.0-dev.3**. Requires the `"media:session"` permission.
:::

Called when the playback timeline (current position, duration) updates.

```lua
function plugin.on_system_media_timeline_changed(session)
    -- session.timeline contains progress and length
end
```

### on_system_state_changed(topic, data)

:::info Version
Available since **3.0.0-dev.3**. Requires the corresponding topic permission (`"system:process"` or `"system:window-focus"`).
:::

Called when a subscribed system state topic changes. The `topic` string identifies which topic changed, and `data` contains the change payload.

```lua
function plugin.on_system_state_changed(topic, data)
    if topic == "process" then
        ext.log("Running applications: " .. #data.apps)
        for _, change in ipairs(data.changes) do
            if change.current_instance_count > change.previous_instance_count then
                ext.log("Started: " .. change.name)
            else
                ext.log("Stopped: " .. change.name)
            end
        end
    elseif topic == "window_focus" then
        if data.current then
            ext.log("Focused: " .. (data.current.app_name or "unknown"))
        end
    end
end
```

See [System State Monitoring](#system-state-monitoring) for available topics and data structures.

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
            default_effect = "rainbow_wave",  -- optional (since 3.0.0-dev.4)
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

## HID Device Access

> **Since 3.0.0-dev.2**

Extensions can open and communicate with HID devices directly. Requires the `"hardware:hid"` permission.

```lua
-- Enumerate all connected HID devices (optionally filter by VID/PID)
local devices = ext.hid_enumerate()              -- all devices
local devices = ext.hid_enumerate(0x1B1C)        -- filter by VID
local devices = ext.hid_enumerate(0x1B1C, 0x1B2D) -- filter by VID + PID

-- Each entry contains:
-- device.path, device.vid, device.pid, device.serial,
-- device.manufacturer, device.product,
-- device.interface_number, device.usage, device.usage_page

-- Open a device by VID/PID (optionally with serial number)
local handle = ext.hid_open(0x1B1C, 0x1B2D)
local handle = ext.hid_open(0x1B1C, 0x1B2D, "SN123456")

-- Or open by OS-specific device path
local handle = ext.hid_open_path(devices[1].path)

-- Write data (returns bytes written)
local n = ext.hid_write(handle, "\x00\x01\x02\x03")

-- Read data
local data = ext.hid_read(handle, 64)          -- non-blocking
local data = ext.hid_read(handle, 64, 1000)    -- 1000ms timeout
local data = ext.hid_read(handle, 64, -1)      -- blocking

-- Feature reports
local n = ext.hid_send_feature_report(handle, "\x00\xff\x01")
local data = ext.hid_get_feature_report(handle, 64)
local data = ext.hid_get_feature_report(handle, 64, 0x01) -- with report ID

-- Close
ext.hid_close(handle)
```

All open HID handles are automatically closed when the extension stops.

## Native C Modules

> **Since 3.0.0-dev.2**

Extensions can load native C modules (`.dll` on Windows, `.so` on Linux/macOS) placed inside the plugin directory. Requires the `"native"` permission.

When the `native` permission is declared:
- The Lua VM is created with `unsafe_new()` to allow loading native libraries.
- The plugin directory and its `lib/` subdirectory are automatically added to `package.cpath`.

```json title="manifest.json"
{
  "permissions": ["native"]
}
```

```lua
-- Load a native module from the plugin directory
local mylib = require("mylib")      -- loads mylib.dll / mylib.so
local helper = require("lib/helper") -- loads lib/helper.dll / lib/helper.so

mylib.do_something()
```

:::caution
The `native` permission bypasses Lua's sandboxing. Only use it with trusted, reviewed native modules. Do not distribute plugins requiring `native` without thorough security auditing.
:::



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

Extensions can include an embedded HTML page that appears in the Skydimo UI. There are two modes:

### Path Mode (Desktop App only)

Point to a local HTML file bundled with the plugin. This works only inside the Skydimo desktop app.

```json title="manifest.json"
{
  "page": "page/dist/index.html"
}
```

### URL Mode

:::info Version
Available since **3.0.0-dev.4**.
:::

Point to an external URL. This works in **both the desktop app and browser** environments.

```json title="manifest.json"
{
  "page_url": "http://localhost:5173"
}
```

When using URL mode, Skydimo loads the page as an iframe and automatically appends the following **query parameters** to the URL:

| Parameter | Description |
|-----------|-------------|
| `extId` | The extension's plugin ID |
| `locale` | Current UI locale (e.g. `en-US`, `zh-CN`) |
| `wsUrl` | WebSocket URL of the Skydimo Core (e.g. `ws://127.0.0.1:42070`) |

For example, if `page_url` is `http://localhost:5173`, the actual iframe URL will be:
```
http://localhost:5173?extId=my_extension&locale=en-US&wsUrl=ws://127.0.0.1:42070
```

### Adapting Your Page for URL Mode

Your page needs to resolve connection info from **either** the host-injected global (`window.__SKYDIMO_EXT_PAGE__`) **or** URL query parameters. Here is the recommended pattern (from the LED Canvas extension):

```typescript title="bridge.ts"
// Sources (in priority order):
//  1. window.__SKYDIMO_EXT_PAGE__  — injected by host bootstrap script (path mode)
//  2. URL query params             — set by UI iframe loader (url mode) or manual dev
//  3. Hardcoded fallback

interface SkydimoExtPage {
  extId: string
  wsUrl: string
  locale?: string
}

declare global {
  interface Window {
    __SKYDIMO_EXT_PAGE__?: Partial<SkydimoExtPage>
  }
}

const _params = new URLSearchParams(window.location.search)

const PAGE: SkydimoExtPage = {
  extId: window.__SKYDIMO_EXT_PAGE__?.extId ?? _params.get('extId') ?? 'my_extension',
  wsUrl: window.__SKYDIMO_EXT_PAGE__?.wsUrl ?? _params.get('wsUrl') ?? 'ws://127.0.0.1:42070',
}
```

For locale resolution, also fall back to the query parameter:

```typescript title="i18n.ts"
function resolveLocale(): string {
  // 1. From host injection or URL query param
  const injected = window.__SKYDIMO_EXT_PAGE__?.locale
    ?? new URLSearchParams(window.location.search).get('locale')
  if (injected && supportedLocales.includes(injected)) return injected

  // 2. Base-language matching from navigator
  // ...
}
```

### Browser Debugging

With URL mode, you can debug extension pages **directly in a browser** without the desktop app:

1. Start your page's dev server (e.g. `npm run dev` → `http://localhost:5173`)
2. Make sure Skydimo Core is running
3. Open the page directly in a browser with query parameters:
   ```
   http://localhost:5173?extId=my_extension&wsUrl=ws://127.0.0.1:<core_port>
   ```
4. You have full access to browser DevTools — inspect elements, debug JS, monitor WebSocket frames, etc.

:::tip
This is especially useful during development. You can use `page_url` pointing to your dev server for hot-reload, then switch to `page` with the production build for release.
:::

### Lua ↔ Page Communication

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

// Persistent notification (stays until dismissed, same ID updates text in place)
ext.notify_persistent("conn_status", "Connecting...", "Attempting to connect to server")

// Trick: Real-time Progress Updates
// Submitting a new persistent notification with the EXACT SAME ID will just change the existing toast's 
// title and description instead of spawning a new one. This is very useful for rendering progress.
ext.notify_persistent("conn_status", "Connecting...", "Step 1 of 3: Authenticaton")
ext.notify_persistent("conn_status", "Connecting...", "Step 2 of 3: Syncing devices")
ext.notify_persistent("conn_status", "Connecting...", "Step 3 of 3: Finalizing")

-- Dismiss it later
ext.dismiss_persistent("conn_status")
```

## System State Monitoring

> **Since 3.0.0-dev.3**

Extensions can subscribe to and query system state topics such as running processes and the currently focused window. Each topic requires its own permission.

:::note Platform Support
System state monitoring is currently only supported on **Windows**. On unsupported platforms, `ext.list_system_state_topics()` returns topics with `supported = false`, and `ext.get_system_state()` returns a snapshot with `supported = false` and empty data.
:::

### Available Topics

| Topic | Permission | Description |
|-------|-----------|-------------|
| `process` | `system:process` | Running application processes (name and instance count) |
| `window_focus` | `system:window-focus` | Currently focused foreground window (app name and title) |

### Querying System State

```lua
-- List topics available to this plugin (filtered by declared permissions)
local topics = ext.list_system_state_topics()
for _, topic in ipairs(topics) do
    ext.log("Topic: " .. topic.id .. " supported=" .. tostring(topic.supported))
end

-- Get a snapshot of the current state
local state = ext.get_system_state("process")
if state and state.supported then
    for _, app in ipairs(state.apps) do
        ext.log(app.name .. " (" .. app.instance_count .. " instances)")
    end
end

local focus = ext.get_system_state("window_focus")
if focus and focus.supported and focus.current then
    ext.log("Focused: " .. (focus.current.app_name or "?") .. " - " .. (focus.current.window_title or ""))
end
```

### Receiving Change Events

Declare the corresponding permission and implement `on_system_state_changed`:

```json title="manifest.json"
{
  "permissions": ["system:process", "system:window-focus"]
}
```

```lua
function plugin.on_system_state_changed(topic, data)
    if topic == "process" then
        -- data.apps: full list of {name, instance_count}
        -- data.changes: list of {name, previous_instance_count, current_instance_count}
        for _, change in ipairs(data.changes) do
            if change.current_instance_count > change.previous_instance_count then
                ext.log(change.name .. " launched")
            elseif change.current_instance_count == 0 then
                ext.log(change.name .. " closed")
            end
        end
    elseif topic == "window_focus" then
        -- data.reason: "snapshot", "foreground_changed", or "title_changed"
        -- data.current: {app_name?, window_title?} or nil
        -- data.previous: {app_name?, window_title?} or nil
        if data.current then
            ext.log("Window focus → " .. (data.current.app_name or ""))
        end
    end
end
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
