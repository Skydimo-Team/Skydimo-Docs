---
sidebar_position: 7
---

# Events

Skydimo broadcasts real-time events as JSON-RPC 2.0 notifications. Events are pushed from the server without a request — they have no `id` field.

## Event Format

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

## Event Types

### devices-changed

Fired when the device list or any device configuration changes (device connected/disconnected, settings updated, etc.).

```json
{
  "event": "devices-changed",
  "data": {
    "devices": [ ... ]
  }
}
```

**Triggers**: device connect/disconnect, nickname change, effect change, brightness change, segment update, LED lock change.

:::tip
This is the primary event for keeping your UI in sync. When received, refresh the full device list.
:::

---

### device-led-update

High-frequency event (~30 fps) containing the current LED colors for a device output.

```json
{
  "event": "device-led-update",
  "data": {
    "port": "COM3",
    "outputId": "out1",
    "colors": [255, 0, 0, 0, 255, 0, 0, 0, 255, ...]
  }
}
```

The `colors` array contains RGB triples (R, G, B, R, G, B, ...) for each LED.

:::warning Performance
This event fires at high frequency. Use a Web Worker or throttle rendering to avoid blocking the UI thread.
:::

---

### notification

A toast notification from Core or a plugin.

```json
{
  "event": "notification",
  "data": {
    "id": "notif_123",
    "title": "Device Connected",
    "description": "Skydimo LED Controller found on COM3",
    "level": "info",
    "persistent": false
  }
}
```

**Levels**: `"info"`, `"warn"`, `"error"`

**Persistent Updates**: If `persistent` is `true` and the UI receives another `notification` event with the EXACT SAME `id`, the existing toast's title and description will be updated in-place instead of creating a new one. This is extremely useful for progress bars or real-time status updates (e.g. `Scanning... 10/100`).

---

### notification-dismiss

Dismisses a persistent notification.

```json
{
  "event": "notification-dismiss",
  "data": {
    "id": "notif_123"
  }
}
```

---

### led-locks-changed

Fired when extension plugins lock or unlock LEDs.

```json
{
  "event": "led-locks-changed",
  "data": { ... }
}
```

Query the full lock state via the [`get_led_locks`](commands/devices#get_led_locks) command.

---

### ext-page-message:\{extId\}

Fired when an extension’s embedded HTML page sends a message to Core. The event name includes the extension ID.

```json
{
  "event": "ext-page-message:openrgb",
  "data": { ... }
}
```

Extension Lua code receives this via the `on_page_message(data)` callback.
---

### system.process.changed

:::info Version
Available since **3.0.0-dev.3**. Currently only supported on Windows.
:::

Fired when the list of running application processes changes (an application starts or stops). Extension plugins with the `system:process` permission receive this via the `on_system_state_changed("process", data)` callback.

```json
{
  "event": "system.process.changed",
  "data": {
    "supported": true,
    "apps": [
      { "name": "chrome.exe", "instance_count": 3 },
      { "name": "code.exe", "instance_count": 1 }
    ],
    "changes": [
      { "name": "notepad.exe", "previous_instance_count": 1, "current_instance_count": 0 }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `supported` | boolean | Whether process monitoring is supported on the current platform |
| `apps` | array | Full list of currently running applications |
| `changes` | array | Applications whose instance count changed in this update |

---

### system.focus.changed

:::info Version
Available since **3.0.0-dev.3**. Currently only supported on Windows.
:::

Fired when the foreground window focus changes (user switches to a different window, or the current window's title changes). Extension plugins with the `system:window-focus` permission receive this via the `on_system_state_changed("window_focus", data)` callback.

```json
{
  "event": "system.focus.changed",
  "data": {
    "supported": true,
    "reason": "foreground_changed",
    "current": {
      "app_name": "code.exe",
      "window_title": "extension-api.md - Light - Visual Studio Code"
    },
    "previous": {
      "app_name": "chrome.exe",
      "window_title": "GitHub"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `supported` | boolean | Whether window focus monitoring is supported on the current platform |
| `reason` | string | `"snapshot"`, `"foreground_changed"`, or `"title_changed"` |
| `current` | object? | Currently focused window (`app_name`, `window_title`), or `null` |
| `previous` | object? | Previously focused window, or `null` |
## Subscribing to Events

Since `3.0.0-dev.3`, events are automatically pushed to all connected local WebSocket clients. No explicit subscription is required.
