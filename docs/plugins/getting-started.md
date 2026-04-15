---
sidebar_position: 2
---

# Getting Started

This guide walks you through creating your first Skydimo plugin — a simple color-cycling effect.

:::info Version
This workflow is supported since **`3.0.0-dev.4`**.
:::

## Prerequisites

- Skydimo installed and running
- A text editor
- Basic Lua knowledge ([Lua 5.4 Reference](https://www.lua.org/manual/5.4/))

## Step 1: Create a Source Package Directory

Create a source folder under the development import queue:

```
import/plugin-dev/effect.my_first_effect/
```

The directory name must follow the pattern `<type>.<id>` where:
- `type` is `controller`, `effect`, or `extension`
- `id` is a unique identifier using lowercase letters, numbers, and underscores

## Step 2: Write manifest.json

Create `import/plugin-dev/effect.my_first_effect/manifest.json`:

```json
{
  "id": "my_first_effect",
  "version": "1.0.0",
  "name": "My First Effect",
  "type": "effect",
  "language": "lua",
  "entry": "main.lua",
  "category": "animation",
  "icon": "Sparkles",
  "permissions": ["log"],
  "params": [
    {
      "key": "speed",
      "label": "Speed",
      "kind": "slider",
      "default": 1.0,
      "min": 0.1,
      "max": 5.0,
      "step": 0.1
    },
    {
      "key": "color",
      "label": "Color",
      "kind": "color",
      "default": "#FF6600"
    }
  ]
}
```

## Step 3: Write main.lua

Create `import/plugin-dev/effect.my_first_effect/main.lua`:

```lua
local plugin = {}

-- Parameters (updated by on_params)
local speed = 1.0
local base_r, base_g, base_b = 255, 102, 0

function plugin.on_init()
    -- Called once when the effect is instantiated
end

function plugin.on_params(p)
    -- Called whenever user changes parameters
    if p.speed then
        speed = p.speed
    end
    if p.color then
        -- Color comes as {r, g, b} table
        base_r = p.color[1] or base_r
        base_g = p.color[2] or base_g
        base_b = p.color[3] or base_b
    end
end

function plugin.on_tick(elapsed, buffer, width, height)
    local count = buffer:len()

    for i = 1, count do
        -- Calculate a wave based on position and time
        local ratio = (i - 1) / count
        local wave = math.sin((ratio + elapsed * speed) * math.pi * 2)
        local brightness = (wave + 1) / 2  -- normalize 0..1

        local r = math.floor(base_r * brightness)
        local g = math.floor(base_g * brightness)
        local b = math.floor(base_b * brightness)
        buffer:set(i, r, g, b)
    end
end

function plugin.on_shutdown()
    -- Called when the effect is removed
end

return plugin
```

## Step 4: Import and Load the Plugin

1. In the Plugins page, trigger **Refresh Plugins** (or restart Core).
2. Core imports your package and updates the plugin registry.
3. Open any device and find **My First Effect** in the effect list.
4. Adjust parameters to verify live behavior.

:::tip
Use `import/plugin-dev/` while developing. The source package is kept, so you can iterate quickly: edit files → refresh plugins → retest.
:::

## Step 5: Development Iteration Loop

Recommended loop:

1. Edit source package in `import/plugin-dev/<type>.<id>/`
2. Trigger **Refresh Plugins**
3. Verify behavior in UI / logs
4. Repeat

When moving to production/distribution, package clean plugin content and install through import/download flows.

## What's Next?

- [Manifest Reference](manifest) — All manifest options
- [Plugin Management](plugin-management) — Import queues, delete/reset behavior, and troubleshooting
- [Effect Plugin Guide](effect-plugin) — Advanced effect techniques
- [Controller Plugin Guide](controller-plugin) — Write hardware drivers
- [Extension Plugin Guide](extension-plugin) — Build background services

## Troubleshooting

:::tip
Check the Core log output for Lua errors. Plugin errors are logged with the plugin ID prefix.
:::

Common issues:
- **Plugin not showing up**: Verify the directory name matches `effect.<id>`, `manifest.json` is valid JSON, and you triggered **Refresh Plugins**
- **Lua errors**: Ensure your entry file returns a table with the expected callback functions
- **Parameters not working**: Make sure `params` keys in `manifest.json` match what you read in `on_params`
- **Changes not applied immediately**: Trigger refresh again and confirm you are editing the source package under `import/plugin-dev/`
