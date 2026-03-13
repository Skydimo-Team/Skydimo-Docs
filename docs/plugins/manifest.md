---
sidebar_position: 3
---

# Manifest Reference

Every plugin requires a `manifest.json` file in its root directory. This page documents all available fields.

## Base Fields (All Plugin Types)

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `id` | string | ✅ | Unique plugin identifier (must match directory suffix) |
| `version` | string | ✅ | Semantic version (e.g. `"1.0.0"`) |
| `name` | string | ✅ | Display name (or i18n key like `"meta.name"`) |
| `type` | string | ✅ | Plugin type: `"controller"`, `"effect"`, or `"extension"` |
| `language` | string | ✅ | Always `"lua"` |
| `entry` | string | ✅ | Entry script filename (e.g. `"main.lua"` or `"init.lua"`) |
| `permissions` | string[] | ❌ | Required permissions |
| `publisher` | string | ❌ | Author or organization name |
| `description` | string | ❌ | Human-readable description (or i18n key) |
| `repository` | string | ❌ | Source repository URL |
| `license` | string | ❌ | License identifier (e.g. `"MIT"`) |

### Example (Base)

```json
{
  "id": "my_plugin",
  "version": "1.0.0",
  "name": "My Plugin",
  "type": "effect",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["log"],
  "publisher": "Your Name",
  "description": "A cool plugin",
  "license": "MIT"
}
```

---

## Controller-Specific Fields

### match

Defines how the controller matches hardware devices.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `match.protocol` | string | ✅ | `"serial"`, `"hid"`, or `"mdns"` |
| `match.rules` | MatchRule[] | ✅ | USB matching rules |
| `match.baud_rate` | number | ❌ | Serial baud rate (serial only) |
| `match.timeout_ms` | number | ❌ | I/O timeout in milliseconds |

### MatchRule

| Field | Type | Description |
|-------|------|-------------|
| `vid` | string | USB Vendor ID in hex (e.g. `"0x1A86"`) |
| `pid` | string | USB Product ID in hex (e.g. `"0x7523"`) |
| `interface_number` | number | HID interface number (HID only, optional). When specified, Core only matches the HID collection on that interface. Omit to match all interfaces. |

:::tip
For HID devices that expose multiple interfaces (e.g. keyboards with separate input and lighting endpoints), specifying `interface_number` in the match rule lets Core filter at the matching stage — **before** `on_validate()` is called — avoiding unnecessary device handle opens and duplicate claims.
:::

### Example (Serial Controller)

```json
{
  "id": "skydimo_serial",
  "version": "1.0.0",
  "name": "Skydimo Serial Controller",
  "type": "controller",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["serial:read", "serial:write", "log"],
  "match": {
    "protocol": "serial",
    "baud_rate": 115200,
    "timeout_ms": 200,
    "rules": [
      { "vid": "0x1A86", "pid": "0x7523" }
    ]
  }
}
```

### Example (HID Controller with interface_number)

```json
{
  "id": "my_hid_keyboard",
  "version": "1.0.0",
  "name": "My HID Keyboard",
  "type": "controller",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["hid:read", "hid:write", "log"],
  "match": {
    "protocol": "hid",
    "timeout_ms": 200,
    "rules": [
      { "vid": "0x1532", "pid": "0x024E", "interface_number": 3 },
      { "vid": "0x1532", "pid": "0x0293", "interface_number": 2 }
    ]
  }
}
```

---

## Effect-Specific Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `category` | string | ❌ | Effect category for sorting (or i18n key) |
| `icon` | string | ❌ | Lucide icon name (e.g. `"Waves"`, `"Zap"`, `"Music"`) |
| `params` | ParamDefinition[] | ❌ | Configurable parameters |

### ParamDefinition

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `key` | string | ✅ | Parameter identifier |
| `label` | string | ✅ | Display label (or i18n key) |
| `kind` | string | ✅ | `"slider"`, `"select"`, `"toggle"`, `"color"`, `"multi-color"` |
| `default` | any | ❌ | Default value |
| `group` | string | ❌ | Group label for UI organization |
| `dependency` | Dependency | ❌ | Conditional visibility |

**Kind-specific fields:**

| Kind | Extra Fields |
|------|-------------|
| `slider` | `min`, `max`, `step` |
| `select` | `options: [{label, value}]` |
| `toggle` | *(none)* |
| `color` | *(none)* |
| `multi-color` | `fixedCount`, `minCount`, `maxCount` |

### Dependency

Controls when a parameter is visible or enabled:

```json
{
  "key": "preset",
  "equals": 0,
  "behavior": "hide"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Key of the parameter to depend on |
| `equals` | any | Show only when dependency equals this value |
| `not_equals` | any | Show only when dependency does NOT equal this value |
| `behavior` | string | `"hide"` or `"disable"` |

### Example (Effect)

```json
{
  "id": "rainbow",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "effect",
  "language": "lua",
  "entry": "main.lua",
  "category": "meta.category",
  "icon": "Waves",
  "permissions": ["log"],
  "params": [
    {
      "key": "speed",
      "label": "params.speed",
      "group": "params.groups.animation",
      "kind": "slider",
      "default": 2.5,
      "min": 0.0,
      "max": 5.0,
      "step": 0.1
    },
    {
      "key": "preset",
      "label": "params.preset",
      "kind": "select",
      "default": 0,
      "options": [
        {"label": "Custom", "value": 0},
        {"label": "Rainbow", "value": 1}
      ]
    },
    {
      "key": "colors",
      "label": "params.colors",
      "kind": "multi-color",
      "default": ["#FF0000", "#00FF00", "#0000FF"],
      "minCount": 2,
      "maxCount": 16,
      "dependency": {
        "key": "preset",
        "equals": 0,
        "behavior": "hide"
      }
    }
  ]
}
```

---

## Extension-Specific Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `page` | string | ❌ | Path to embedded HTML page (e.g. `"page/dist/index.html"`) |

### Example (Extension)

```json
{
  "id": "openrgb",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["network:tcp", "process", "log"],
  "publisher": "Skydimo",
  "page": "page/dist/index.html"
}
```

---

## Internationalization (i18n) Keys

Fields like `name`, `description`, `label`, `category`, and `group` can use i18n keys instead of literal strings. When a key is used, Skydimo resolves it from the plugin's `locales/` directory.

See [Internationalization](i18n) for details.
