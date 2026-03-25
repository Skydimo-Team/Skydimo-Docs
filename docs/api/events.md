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

## Subscribing to Events

Since `3.0.0-dev.3`, events are automatically pushed to all connected local WebSocket clients. No explicit subscription is required.
