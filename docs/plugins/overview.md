---
sidebar_position: 1
---

# Plugin Development Overview

Skydimo's plugin system allows you to extend the application with custom hardware drivers, lighting effects, and background services — all written in **Lua 5.4**.

## Plugin Types

| Type | Directory Pattern | Purpose |
|------|-------------------|---------|
| **Controller** | `controller.<id>/` | Hardware device drivers (serial, HID, mDNS) |
| **Effect** | `effect.<id>/` | Visual lighting patterns and animations |
| **Extension** | `extension.<id>/` | Background services, protocol bridges, custom UI |

## Where Plugins Live

Plugins are stored in the `plugins/` directory:

```
plugins/
├── controller.skydimo_serial/
│   ├── manifest.json
│   ├── main.lua
│   ├── lib/
│   └── locales/
├── effect.rainbow/
│   ├── manifest.json
│   ├── main.lua
│   └── locales/
└── extension.openrgb/
    ├── manifest.json
    ├── init.lua
    ├── locales/
    └── page/
```

## How It Works

1. Core scans the `plugins/` directory on startup
2. Each subfolder whose name matches `<type>.<id>/` is loaded
3. The `manifest.json` is parsed for metadata, permissions, and type-specific config
4. The Lua entry script is executed in a sandboxed environment
5. Core calls plugin lifecycle hooks (`on_init`, `on_tick`, `on_shutdown`, etc.)

## Next Steps

- [Getting Started](getting-started) — Create your first plugin
- [Manifest Reference](manifest) — Full manifest.json specification
- [Controller Plugin Guide](controller-plugin) — Build hardware drivers
- [Effect Plugin Guide](effect-plugin) — Create lighting effects
- [Extension Plugin Guide](extension-plugin) — Build integrations and services
