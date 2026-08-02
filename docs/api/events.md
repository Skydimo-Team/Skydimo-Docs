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
  "data": [ ... ]
}
```

**Triggers**: device connect/disconnect, nickname change, effect change, brightness change, segment update, LED lock change.

:::tip
This is the primary event for keeping your UI in sync. When received, refresh the full device list.
:::

---

### device-diagnostics-changed

Fired when Core's recoverable hardware-discovery diagnostics change. The payload is the same versioned report returned by [`get_device_diagnostics`](commands/runtime-diagnostics#get_device_diagnostics).

```json
{
  "event": "device-diagnostics-changed",
  "data": {
    "revision": 2,
    "diagnostics": [
      {
        "id": "windows.ch340.1a86.7523",
        "code": "windows_ch340_com_unavailable",
        "severity": "warning",
        "title": {"raw": "Skydimo serial driver needs attention", "byLocale": {}},
        "description": {"raw": "Windows detected the device, but no usable COM port is available.", "byLocale": {}},
        "action": {
          "kind": "open_support_article",
          "topic": "ch340_driver",
          "label": {"raw": "View driver guide", "byLocale": {}}
        }
      }
    ]
  }
}
```

`revision` increases only when the diagnostics list changes. Clearing the last issue also fires this event with an empty `diagnostics` array. A client can ignore an older query response whose revision is lower than the latest event it has processed.

---

### device-runtime-status-changed

Fired when a device runner terminates because a controller update failed, the runner panicked, or it exited unexpectedly. The current implementation emits terminal failures; it does not emit routine starting/running transitions.

```json
{
  "event": "device-runtime-status-changed",
  "data": {
    "schemaVersion": 1,
    "operation": "controller.update",
    "outcome": "failure",
    "state": "failed",
    "errorCode": "controller_update_failed",
    "errorMessage": "Device write failed",
    "port": "COM3",
    "controllerId": "skydimo_serial",
    "controllerPort": "COM3",
    "outputIds": ["out1"],
    "outputCount": 1,
    "ledCount": 60,
    "consecutiveFailures": 1,
    "durationMs": 4
  }
}
```

Current error codes are `controller_update_failed`, `runner_panicked`, and `runner_exited_unexpectedly`. Core also records the failure in the device's `runtime_stats` and emits an error `notification`.

---

### device-led-update

High-frequency preview event containing the current flattened physical LED colors for a device. Delivery rate is not a stable API guarantee: it depends on the active runner and scheduling, and clients must tolerate bursts, dropped intermediate frames, and pauses.

```json
{
  "event": "device-led-update",
  "data": {
    "port": "COM3",
    "rgb": "/wAAAP8AAAD/",
    "count": 3
  }
}
```

`rgb` is standard Base64 encoding of `count` packed RGB triples (`R, G, B, R, G, B, ...`). Decode at most `min(count, decodedByteLength / 3)` complete colors.

:::warning Performance
Coalesce or throttle UI updates instead of rendering every received frame. The current Advanced UI decodes this payload on the main thread and throttles React state updates to approximately 33 ms; it does not route this stream through a Web Worker.
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

### plugins-changed

Fired when plugin metadata or enabled state changes.

```json
{
  "event": "plugins-changed",
  "data": null
}
```

**Triggers**: package install, plugin delete/reset/refresh, effect/controller/extension enable-state changes, and startup plugin inventory refresh.

Clients should call [`get_plugins`](commands/plugins#get_plugins) again after receiving this event.

---

### locale-changed

Fired when Core's active locale changes.

```json
{
  "event": "locale-changed",
  "data": {
    "locale": "en-US"
  }
}
```


### startup-status-changed

Fired while Core startup tasks progress.

```json
{
  "event": "startup-status-changed",
  "data": {
    "plugins": {"state": "complete"},
    "deviceDiscovery": {"state": "running"},
    "extensions": {"state": "pending"}
  }
}
```

`state` is `pending`, `running`, `complete`, or `failed`.

---

### plugin-import-progress

:::caution Declared but not currently emitted
Core declares the `plugin-import-progress` event name and progress DTO, but there is no current Core call site that broadcasts this event. Clients must not depend on receiving it. During startup, read plugin progress from `get_startup_status` or `startup-status-changed` instead.
:::

No wire payload contract should be inferred until Core has an actual emitter.

---

### ext-page-message:\{extId\}

Fired when an extension calls `ext.page_emit(data)` or native-c `call_json("page_emit", data)`. The event name includes the extension ID so that the matching extension page can listen for its own messages.

```json
{
  "event": "ext-page-message:openrgb",
  "data": { ... }
}
```

To send data in the other direction, call [`ext_page_send`](commands/plugins#ext_page_send); Lua extensions receive that payload via `on_page_message(data)`, and native-c extensions receive it through `on_page_message_json`.

---

### system.media.changed

:::info Platform
Currently emitted only by the Windows media-session watcher.
:::

Fired when the active media session appears or disappears, or when its track metadata, source application, artwork availability, or artwork revision changes.

```json
{
  "event": "system.media.changed",
  "data": {
    "title": "Example Track",
    "artist": "Example Artist",
    "album_title": "Example Album",
    "album_artist": "Example Artist",
    "source_app_id": "Example.Player",
    "playback_status": "playing",
    "duration_ms": 240000,
    "position_ms": 32100,
    "has_artwork": true,
    "timeline": {
      "start_time_ms": 0,
      "end_time_ms": 240000,
      "min_seek_time_ms": 0,
      "max_seek_time_ms": 240000,
      "position_ms": 32100,
      "duration_ms": 240000,
      "last_updated_unix_ms": 1798761600000
    }
  }
}
```

The event payload is a complete media-session snapshot or `null` when there is no active session. Optional scalar fields serialize as `null`. `playback_status` is `playing`, `paused`, or `stopped`. `has_artwork` reports whether artwork is cached; the event does not include artwork pixels.

Extensions need the `media:session` permission to receive the corresponding `on_system_media_changed(data)` callback.

---

### system.media.playback_changed

Fired when `playback_status` changes, including when a media session appears or disappears. Its payload is the same complete media-session snapshot described under `system.media.changed`, or `null` when the session disappeared.

Extensions need the `media:session` permission to receive `on_system_media_playback_changed(data)`.

---

### system.media.timeline_changed

Fired when any timeline field changes, including position, seek bounds, duration, or last-update time, and when a media session appears or disappears. Its payload is the same complete media-session snapshot described above, or `null`.

Extensions need the `media:session` permission to receive `on_system_media_timeline_changed(data)`.

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
