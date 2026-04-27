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
| `locales` | object | ❌ | Inline locale dictionaries keyed by locale code. Also accepts `i18n` and `translations` |
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
| `interface_number` | number | USB interface number (optional). When specified, Core only matches the device on that interface. See protocol-specific notes below. |

:::tip
For **HID** devices that expose multiple interfaces (e.g. keyboards with separate input and lighting endpoints), specifying `interface_number` in the match rule lets Core filter at the matching stage — **before** `on_validate()` is called — avoiding unnecessary device handle opens and duplicate claims.

This HID usage is already verified and is the recommended approach for multi-interface HID devices.
:::

:::warning Serial `interface_number` — Not Yet Verified
This warning applies only to **Serial (CDC)** matching. HID `interface_number` matching is already verified.

For **Serial (CDC)** devices, `interface_number` is now read from the OS USB enumeration API (requires the `usbportinfo-interface` feature of the `serialport` crate) and will be matched against this field. This enables distinguishing multiple serial interfaces on the same composite USB device.

**This usage has not been verified in production and is not recommended.** Available in version **3.0.1** and later.
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

### Example (Serial Controller with interface_number)

:::warning Not Yet Verified
Matching Serial devices by `interface_number` has not been verified in production and is **not recommended**. Available in version **3.0.1** and later.
:::

For composite USB devices that expose multiple serial interfaces (e.g. a single USB device that has both a control CDC interface and a data CDC interface), you can target a specific interface:

```json
{
  "id": "my_composite_serial",
  "version": "1.0.0",
  "name": "Composite Serial Controller (Interface 1)",
  "type": "controller",
  "language": "lua",
  "entry": "main.lua",
  "permissions": ["serial:read", "serial:write", "log"],
  "match": {
    "protocol": "serial",
    "baud_rate": 115200,
    "timeout_ms": 200,
    "rules": [
      { "vid": "0x1A86", "pid": "0x7523", "interface_number": 1 }
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

## Native Library Configuration

> **Available since: `3.0.0-dev.3`**

The optional `native` object controls how the plugin runtime loads native (C/Rust/…) Lua modules and their shared-library dependencies. All paths are relative to the plugin directory and must not escape it (no `..` or absolute paths).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `native.module_dirs` | string[] | `[".", "lib"]` | Extra directories appended to `package.cpath` so Lua `require()` can find `.dll` / `.so` C modules. |
| `native.dll_dirs` | string[] | `[".", "lib", "bin"]` | Extra directories registered as DLL search paths (Windows: `AddDllDirectory`). Affects transitive dependency resolution. |
| `native.preload_dlls` | string[] | `[]` | Relative paths to DLL files that must be loaded **before** the plugin entry script runs. Use this to satisfy dependencies that aren't loadable via normal search paths. |

:::note
`module_dirs` and `dll_dirs` always include their defaults (`"."`, `"lib"`, `"bin"`) in addition to any extra paths you declare.
:::

:::caution Windows-only
`dll_dirs` and `preload_dlls` only have effect on Windows. On other platforms the fields are accepted but silently ignored.
:::

:::tip Permission required
Plugins that declare `native` configuration must include `"native"` in their `permissions` array.
:::

### Example (Extension with native DLL preload)

```json
{
  "id": "signalrgb_bridge",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["hardware:hid", "native", "system:info"],
  "native": {
    "preload_dlls": ["lua54.dll", "libmcfgthread-2.dll"]
  }
}
```

### Example (Extension with custom module and DLL search dirs)

```json
{
  "id": "my_native_extension",
  "version": "1.0.0",
  "name": "My Native Extension",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["native", "log"],
  "native": {
    "module_dirs": ["native/modules"],
    "dll_dirs": ["native/deps"],
    "preload_dlls": ["native/deps/libfoo.dll"]
  }
}
```

---

## Extension-Specific Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `page` | string | ❌ | Path to embedded HTML page (e.g. `"page/dist/index.html"`). Desktop app only. |
| `page_url` | string | ❌ | External URL for the extension page (e.g. `"http://localhost:5173"`). Works in both desktop app and browser. |

:::info Version
`page_url` is available since **3.0.0-dev.4**.
:::

:::caution
`page` and `page_url` are **mutually exclusive** — you must not declare both. `page_url` must use `http://` or `https://` scheme.
:::

### Example (Extension with local page)

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

### Example (Extension with external URL page)

```json
{
  "id": "my_extension",
  "version": "1.0.0",
  "name": "meta.name",
  "type": "extension",
  "language": "lua",
  "entry": "init.lua",
  "permissions": ["log"],
  "publisher": "Skydimo",
  "page_url": "http://localhost:5173"
}
```

---

## Internationalization (i18n) Keys

Fields like `name`, `description`, `label`, `category`, and `group` can use i18n keys instead of literal strings. Translations are resolved from the plugin's merged locale sources: inline `locales` in `manifest.json` (preferred, with `i18n` and `translations` accepted as aliases) plus the legacy `locales/` directory.

If the same key exists in both places, the value declared in `manifest.json` wins.

See [Internationalization](i18n) for details.
