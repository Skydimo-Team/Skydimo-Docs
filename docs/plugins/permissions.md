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
| `system:info` | Access host system hardware information (OS, CPU, GPU, RAM, etc.) *(since 3.0.0-dev.2)* |

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
| `media:session` | Access the current system media session metadata, playback state, timeline, and artwork *(since 3.0.0-dev.3)* |
| `system:process` | Subscribe to running application process changes and query the current process list. Only supported on Windows. *(since 3.0.0-dev.3)* |
| `system:window-focus` | Subscribe to foreground window focus changes and query the currently focused window. Only supported on Windows. *(since 3.0.0-dev.3)* |
| `network` | Allow all network access (TCP and HTTP) *(since 3.0.0-dev.3)* |
| `network:tcp` | Open TCP connections |
| `network:http` | Make HTTP/HTTPS requests *(since 3.0.0-dev.3)* |
| `process` | Spawn and manage external processes |
| `hardware:hid` | Open and communicate with HID devices directly *(since 3.0.0-dev.2)* |
| `native` | Load native C modules (`.dll`/`.so`) via `require()` and use the `native` manifest block for fine-grained library search control *(since 3.0.0-dev.2; `native` manifest config since 3.0.0-dev.3)* |

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
- System info access requires explicit `system:info` permission; available to controller and extension plugins *(since 3.0.0-dev.2)*
- Media session access requires explicit `media:session` permission; only available to extension plugins *(since 3.0.0-dev.3)*
- System process monitoring requires explicit `system:process` permission; only available to extension plugins. Currently only supported on Windows. *(since 3.0.0-dev.3)*
- Window focus monitoring requires explicit `system:window-focus` permission; only available to extension plugins. Currently only supported on Windows. *(since 3.0.0-dev.3)*
- HID access requires explicit `hardware:hid` permission; only available to extension plugins *(since 3.0.0-dev.2)*
- Native C module loading requires explicit `native` permission and uses an unsafe Lua VM — use with caution *(since 3.0.0-dev.2)*
- Advanced DLL search path control and preloading via the `native` manifest block requires `3.0.0-dev.3` or later *(see [Manifest Reference — Native Library Configuration](manifest#native-library-configuration))*
