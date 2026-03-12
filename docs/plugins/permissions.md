---
sidebar_position: 8
---

# Permissions

Plugins must declare required permissions in `manifest.json`. Core enforces these — API calls requiring undeclared permissions will fail.

## Available Permissions

### General

| Permission | Description |
|-----------|-------------|
| `log` | Write to the application log |

### Controller Plugins

| Permission | Description |
|-----------|-------------|
| `serial:read` | Read from serial port |
| `serial:write` | Write to serial port |
| `hid:read` | Read from HID device |
| `hid:write` | Write to HID device |

### Effect Plugins

| Permission | Description |
|-----------|-------------|
| `screen:capture` | Capture screen content |
| `audio:capture` | Access audio FFT data |
| `media:album_art` | Access media album art |

### Extension Plugins

| Permission | Description |
|-----------|-------------|
| `network:tcp` | Open TCP connections |
| `process` | Spawn and manage external processes |

## Declaring Permissions

Add a `permissions` array to your `manifest.json`:

```json
{
  "permissions": ["log", "network:tcp", "process"]
}
```

## Security Model

- Plugins run in a sandboxed Lua 5.4 environment
- File system access is restricted to the plugin's own directory
- Network access requires explicit `network:tcp` permission
- Process spawning requires explicit `process` permission
- Each plugin runs in an isolated Lua state — plugins cannot access each other's data
