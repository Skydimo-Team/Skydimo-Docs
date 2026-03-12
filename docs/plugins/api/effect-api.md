---
sidebar_position: 2
---

# Effect API Reference

Complete reference for the APIs available in effect plugins.

## Buffer Object

The `buffer` parameter passed to `on_tick` represents the LED color buffer.

### buffer:len()

Returns the number of LEDs.

```lua
local count = buffer:len()  -- e.g. 144
```

### buffer:set(index, r, g, b)

Set an LED's color using RGB values.

- `index` — 1-based LED index
- `r`, `g`, `b` — Color values (0–255)

```lua
buffer:set(1, 255, 0, 0)   -- First LED = red
buffer:set(2, 0, 255, 0)   -- Second LED = green
```

### buffer:set_hsv(index, h, s, v)

Set an LED's color using HSV values.

- `index` — 1-based LED index
- `h` — Hue (0–360)
- `s` — Saturation (0.0–1.0)
- `v` — Value/brightness (0.0–1.0)

```lua
buffer:set_hsv(1, 0, 1.0, 1.0)    -- Red
buffer:set_hsv(2, 120, 1.0, 1.0)  -- Green
buffer:set_hsv(3, 240, 1.0, 1.0)  -- Blue
```

---

## Host Object

The `host` global provides utility functions.

### host.hsv_to_rgb(h, s, v)

Convert HSV to RGB.

```lua
local r, g, b = host.hsv_to_rgb(180, 1.0, 1.0)
-- Returns: 0, 255, 255 (cyan)
```

- `h` — Hue (0–360)
- `s` — Saturation (0.0–1.0)
- `v` — Value (0.0–1.0)
- **Returns**: `r`, `g`, `b` (0–255)

### host.log(msg)

Log a message at info level.

```lua
host.log("Effect initialized with " .. buffer:len() .. " LEDs")
```

### print(...)

Standard Lua `print` is also available and logs to the same output.

---

## Screen Capture API

Available when the plugin has the `"screen:capture"` permission.

### screen.list_displays()

Returns a list of available displays.

```lua
local displays = screen.list_displays()
-- Returns: {{index=0, name="Display 1", width=2560, height=1440, is_hdr=false}, ...}
```

### screen.capture(width, height)

Capture the active screen, downscaled to the specified resolution.

```lua
local frame = screen.capture(64, 36)
if frame then
    -- frame.width, frame.height
    -- frame.pixels: flat array of 0xRRGGBB values
    local pixel = frame.pixels[1]
    local r = (pixel >> 16) & 0xFF
    local g = (pixel >> 8) & 0xFF
    local b = pixel & 0xFF
end
```

**Returns**: A table with `width`, `height`, and `pixels` fields, or `nil` on failure.

:::tip
The user selects which display to capture from the UI. The internal `__screen_index` and `__screen_region` parameters are handled by Core.
:::

---

## Audio Capture API

Available when the plugin has the `"audio:capture"` permission.

### audio.capture(avg_size)

Get FFT frequency analysis data.

- `avg_size` — Number of frequency bins to return (1–256)

```lua
local data = audio.capture(32)
if data then
    -- data.amplitude: overall audio level (0.0-1.0)
    -- data.bins: array of frequency magnitudes (0.0-1.0)
    for i, mag in ipairs(data.bins) do
        -- mag is the magnitude for frequency bin i
    end
end
```

**Returns**: A table with `amplitude` and `bins` fields, or `nil` if audio capture is unavailable.

---

## Media Album Art API

Available when the plugin has the `"media:album_art"` permission.

### media.album_art(width, height)

Get the currently playing media's album art.

```lua
local art = media.album_art(64, 64)
if art then
    -- art.width, art.height
    -- art.pixels: flat array of 0xRRGGBB values
end
```

**Returns**: A table with `width`, `height`, and `pixels`, or `nil` if no media is playing.

---

## Lifecycle Hooks Summary

| Hook | Signature | Description |
|------|-----------|-------------|
| `on_init()` | `function()` | Called once at instantiation |
| `on_params(p)` | `function(table)` | Called when parameters change |
| `on_tick(elapsed, buffer, width, height)` | `function(number, userdata, number, number)` | Called every frame |
| `on_shutdown()` | `function()` | Called when effect is removed |
