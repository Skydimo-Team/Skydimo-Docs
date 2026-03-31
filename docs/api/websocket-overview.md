---
sidebar_position: 1
---

# WebSocket API Overview

Skydimo Core exposes a **JSON-RPC 2.0** API over WebSocket for full programmatic control of the lighting system.

:::note Since 3.0.0-dev.3
WebSocket secret-based authentication was removed in `3.0.0-dev.3`. Core now binds locally on `127.0.0.1` and accepts requests immediately after the socket opens.
:::

## Connection

### Obtaining Connection Info

When Core starts, it outputs the selected port to stdout:

```
CORE_PORT=<port>
```

Connect to `ws://127.0.0.1:<port>`.

In browser mode, the UI must be opened with `?ws=ws://127.0.0.1:<port>` so it knows which running Core instance to connect to.

Core only binds to the local loopback interface, so the API is only reachable from the same machine.

### Timeouts

| Operation | Timeout |
|-----------|---------|
| RPC call | 30s |
| Reconnect interval | 2s |

## Request Format

Standard JSON-RPC 2.0 request:

```json
{
  "jsonrpc": "2.0",
  "method": "<command_name>",
  "params": { ... },
  "id": <number>
}
```

## Response Format

### Success

```json
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": <number>
}
```

### Error

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Error description"
  },
  "id": <number>
}
```

## Event Notifications

The server pushes events as JSON-RPC notifications (no `id` field):

```json
{
  "jsonrpc": "2.0",
  "method": "event",
  "params": {
    "event": "<event_name>",
    "data": { ... }
  }
}
```

See [Events](events) for the full event list.

## Command Categories

| Category | Commands | Description |
|----------|----------|-------------|
| [Devices](commands/devices) | `get_devices`, `get_device`, `scan_devices`, ... | Device enumeration and management |
| [Effects](commands/effects) | `get_effects`, `set_effect`, `set_brightness`, ... | Effect control and parameters |
| [Screen & Audio](commands/screen-audio) | `get_displays`, `get_audio_devices`, ... | Media capture configuration |
| [Plugins](commands/plugins) | `get_plugins`, `set_controller_plugins_enabled`, ... | Plugin management |
| [System](commands/system) | `get_system_info`, capture settings | System information and global settings |

## Example Session

```json
// 1. List devices
→ {"jsonrpc":"2.0","method":"get_devices","id":1}
← {"jsonrpc":"2.0","result":[{"port":"COM3","manufacturer":"Skydimo",...}],"id":1}

// 2. Set effect
→ {"jsonrpc":"2.0","method":"set_effect","params":{"port":"COM3","effectId":"rainbow"},"id":2}
← {"jsonrpc":"2.0","result":null,"id":2}

// 3. Receive event
← {"jsonrpc":"2.0","method":"event","params":{"event":"devices-changed","data":{...}}}
```
