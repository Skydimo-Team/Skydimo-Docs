---
sidebar_position: 5
---

# Effect Plugin Guide

Effect plugins generate visual lighting patterns. They receive a buffer of LEDs and write RGB colors to it each frame.

## Directory Structure

```
plugins/effect.my_effect/
├── manifest.json       # Metadata + parameter definitions
├── main.lua            # Entry script with lifecycle hooks
├── lib/                # Optional Lua modules
├── locales/            # Optional i18n files
│   ├── en-US.json
│   └── zh-CN.json
└── data/               # Runtime data directory
```

## Lifecycle

```
User selects effect → Instantiate Lua environment
  → plugin.on_init()
  → plugin.on_params(params_table)    ← Parameters changed
  → [Render loop]
      plugin.on_tick(elapsed, buffer, width, height)
  → plugin.on_shutdown()
```

## Lifecycle Hooks

### on_init()

Called once when the effect is instantiated.

```lua
function plugin.on_init()
    -- Initialize state, precompute lookup tables, etc.
end
```

### on_params(params)

Called whenever the user changes a parameter value. Also called once initially.

- `params` — Table of key/value pairs matching your manifest `params`

```lua
function plugin.on_params(p)
    if p.speed then speed = p.speed end
    if p.color then
        base_r = p.color[1]
        base_g = p.color[2]
        base_b = p.color[3]
    end
end
```

### on_tick(elapsed, buffer, width, height)

Called every frame. Write RGB colors to the buffer.

- `elapsed` — Seconds since the effect started (float, continuously increasing)
- `buffer` — LED color buffer (userdata, 1-indexed)
- `width` — Layout width (for 2D effects)
- `height` — Layout height (for 2D effects)

```lua
function plugin.on_tick(elapsed, buffer, width, height)
    local count = buffer:len()
    for i = 1, count do
        local hue = (elapsed * 60 + (i - 1) / count * 360) % 360
        buffer:set_hsv(i, hue, 1.0, 1.0)
    end
end
```

### on_shutdown()

Called when the effect is removed. Clean up any resources.

```lua
function plugin.on_shutdown()
    -- Cleanup
end
```

## Buffer API

The `buffer` object provides methods for setting LED colors:

| Method | Description |
|--------|-------------|
| `buffer:len()` | Returns the number of LEDs |
| `buffer:set(i, r, g, b)` | Set LED color by RGB (1-indexed, 0–255) |
| `buffer:set_hsv(i, h, s, v)` | Set LED color by HSV (h: 0–360, s/v: 0.0–1.0) |

## Host Utilities

### Color Conversion

```lua
local r, g, b = host.hsv_to_rgb(hue, saturation, value)
-- hue: 0-360, saturation: 0.0-1.0, value: 0.0-1.0
-- returns: r, g, b (0-255)
```

### Logging

```lua
host.log("Debug message")
print("Also works for logging")
```

## Screen Capture

Effects can capture screen content for ambient lighting. Requires the `"screen:capture"` permission.

```json title="manifest.json"
{
  "permissions": ["screen:capture"]
}
```

```lua
-- List available displays
local displays = screen.list_displays()
-- Returns: {index, name, width, height, is_hdr}

-- Capture screen (downscaled to specified resolution)
local frame = screen.capture(64, 36)
-- Returns: {width, height, pixels=[0xRRGGBB, ...]}
-- Returns nil on failure
```

The user selects which display to capture via the UI. The special params `__screen_index` and `__screen_region` are injected by Core.

## Audio Analysis

Effects can react to audio. Requires the `"audio:capture"` permission.

```json title="manifest.json"
{
  "permissions": ["audio:capture"]
}
```

```lua
-- Get FFT data
local data = audio.capture(32)  -- 32 frequency bins
-- Returns: {amplitude, bins=[0.0..1.0, ...]}
-- amplitude: overall audio level
-- bins: frequency magnitude values (low to high)
```

## Media Album Art

Effects can use the currently playing media's album art. Requires the `"media:album_art"` permission.

```lua
local art = media.album_art(64, 64)
-- Returns: {width, height, pixels=[0xRRGGBB, ...]}
-- Returns nil if no media is playing
```

## Parameter Types in Action

### Slider

```json
{"key": "speed", "kind": "slider", "min": 0, "max": 10, "step": 0.5, "default": 2}
```

```lua
function plugin.on_params(p)
    if p.speed then speed = p.speed end  -- number
end
```

### Select

```json
{
  "key": "mode",
  "kind": "select",
  "options": [{"label": "Wave", "value": 0}, {"label": "Pulse", "value": 1}],
  "default": 0
}
```

```lua
function plugin.on_params(p)
    if p.mode then mode = p.mode end  -- number (value field)
end
```

### Toggle

```json
{"key": "reverse", "kind": "toggle", "default": false}
```

```lua
function plugin.on_params(p)
    if p.reverse ~= nil then reverse = p.reverse end  -- boolean
end
```

### Color

```json
{"key": "color", "kind": "color", "default": "#FF0000"}
```

```lua
function plugin.on_params(p)
    if p.color then
        r, g, b = p.color[1], p.color[2], p.color[3]  -- 0-255 each
    end
end
```

### MultiColor

```json
{
  "key": "colors",
  "kind": "multi-color",
  "default": ["#FF0000", "#00FF00"],
  "minCount": 2,
  "maxCount": 8
}
```

```lua
function plugin.on_params(p)
    if p.colors then
        -- Array of {r, g, b} tables
        palette = p.colors
    end
end
```

## Complete Example: Plasma Effect

```lua
local plugin = {}

local speed = 1.0
local scale = 3.0

function plugin.on_init() end

function plugin.on_params(p)
    if p.speed then speed = p.speed end
    if p.scale then scale = p.scale end
end

function plugin.on_tick(elapsed, buffer, width, height)
    local count = buffer:len()
    local t = elapsed * speed

    for i = 1, count do
        local x = (i - 1) / count * scale
        local v1 = math.sin(x * 10 + t)
        local v2 = math.sin(x * 10 * math.sin(t / 2) + t)
        local v3 = math.sin(x * 10 + math.sin(t / 3) * 2)
        local v = (v1 + v2 + v3) / 3

        local hue = ((v + 1) / 2 * 360) % 360
        buffer:set_hsv(i, hue, 1.0, 0.8)
    end
end

function plugin.on_shutdown() end

return plugin
```

See the [Effect API Reference](api/effect-api) for the complete API.
