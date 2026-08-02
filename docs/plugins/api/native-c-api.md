---
sidebar_position: 4
---

# Native-C API Reference

This page documents the public native-c ABI exposed to plugins. It is based on the current Core runtime behavior and is meant for authors using the public SDK packages, not for authors reading Skydimo source code.

Use the SDK package from [Skydimo-Team/Skydimo-SDK](https://github.com/Skydimo-Team/Skydimo-SDK) that matches your manifest `abi`.

## ABI Model

Native-c plugins are in-process shared libraries. Core loads the library declared by `manifest.json` `entry`, looks up `skydimo_plugin_get_api`, and asks the plugin to fill a function table.

```c
SKYDIMO_EXPORT int32_t skydimo_plugin_get_api(
    uint32_t requested_abi_version,
    const SkydimoHostApiV1* host,
    SkydimoPluginApiV1* out_api);
```

| Item | Value |
|------|-------|
| Current ABI version | `3` |
| Supported version range | `2..3` |
| Generic ABI id | `skydimo-native-c-v3` |
| Effect ABI id | `skydimo-effect-c-v3` |
| Controller ABI id | `skydimo-controller-c-v3` |
| Extension ABI id | `skydimo-extension-c-v3` |

`out_api->abi_version` must equal `requested_abi_version`. `out_api->kind_mask` must include the API family used by the manifest type.

| Mask | Meaning |
|------|---------|
| `SKYDIMO_PLUGIN_KIND_EFFECT` | Provides `SkydimoEffectApiV1` |
| `SKYDIMO_PLUGIN_KIND_CONTROLLER` | Provides `SkydimoControllerApiV1` |
| `SKYDIMO_PLUGIN_KIND_EXTENSION` | Provides `SkydimoExtensionApiV1` |

## Status Conventions

| Function kind | Success | Soft result | Failure |
|---------------|---------|-------------|---------|
| Lifecycle callbacks returning `int32_t` | `0` or positive | Some callbacks treat `0` as false and positive as true | Negative status |
| `validate` and `is_ready` | Positive means true | `0` means false | Negative status |
| Read/write callbacks returning `intptr_t` | Non-negative byte count | `0` means no data or throttled write | Negative status |
| `call_json` | `0` means response written | Positive means response buffer too small and `required_len` was set | Negative status with error JSON when possible |

Never throw exceptions, panic, or unwind through any native-c ABI function. Catch language runtime failures inside the plugin and return a negative status.

## Common Types

| Type | Purpose |
|------|---------|
| `SkydimoStr` | UTF-8 string slice: `const char* ptr`, `size_t len`; not null-terminated |
| `SkydimoRgb` | RGB color with `uint8_t r`, `g`, `b` |
| `SkydimoRgbFrameV1` | Width, height, and host-owned RGB pixel slice |
| `SkydimoAudioFrameV1` | Audio amplitude plus FFT bin slice |
| `SkydimoOutputDefinitionV1` | Controller output metadata and capabilities |
| `SkydimoOutputFrameV1` | Output id plus RGB color slice |
| `SkydimoHardwareCandidateV1` | Serial or HID candidate matched from the controller manifest |
| `SkydimoDeviceInfoV1` | Controller-provided device identity |

Pointers passed from Core are valid only for the duration documented by the callback. If a plugin needs data later, it must copy it.

### Device Types

Native constants map to device type strings used elsewhere in the plugin APIs:

```text
light, motherboard, dram, gpu, cooler, led_strip, keyboard, mouse,
mouse_mat, headset, headset_stand, gamepad, speaker, virtual, storage,
case, microphone, accessory, keypad, laptop, monitor, unknown
```

### Segment Types

| Constant | Meaning |
|----------|---------|
| `SKYDIMO_SEGMENT_SINGLE` | Single color zone |
| `SKYDIMO_SEGMENT_LINEAR` | Linear LED strip |
| `SKYDIMO_SEGMENT_MATRIX` | 2D LED matrix |
| `SKYDIMO_SEGMENT_PRESET` | Preset or non-addressable zone |

## Plugin API Table

`SkydimoPluginApiV1` is the top-level table returned by `skydimo_plugin_get_api`.

| Field | Required | Notes |
|-------|----------|-------|
| `size` | Yes | Set to `sizeof(SkydimoPluginApiV1)` |
| `abi_version` | Yes | Must equal `requested_abi_version` |
| `kind_mask` | Yes | OR of `SKYDIMO_PLUGIN_KIND_*` |
| `effect` | For effect plugins | `SkydimoEffectApiV1` table |
| `controller` | For controller plugins | `SkydimoControllerApiV1` table |
| `extension` | For extension plugins | `SkydimoExtensionApiV1` table |
| `shutdown_plugin` | Optional | Called when Core unloads the loaded plugin wrapper |

## Host API Table

Core passes `SkydimoHostApiV1` to plugin `create` callbacks. All plugin types receive common callbacks.

| Callback | Available to | Purpose |
|----------|--------------|---------|
| `log` | All plugin types | Write a plugin-scoped log entry |
| `get_plugin_id` | All plugin types | Return the current plugin id as `SkydimoStr` |
| `call_json` | Effect, controller, extension | Language-neutral host method call |

### call_json Protocol

`call_json` receives a method name and a UTF-8 JSON request. It writes a UTF-8 JSON response into the provided buffer.

```c
int32_t (*call_json)(
    void* host_ctx,
    const char* method_ptr,
    size_t method_len,
    const char* request_ptr,
    size_t request_len,
    uint8_t* response_ptr,
    size_t response_len,
    size_t* required_len);
```

Recommended usage:

1. Call with a reasonably sized response buffer.
2. If the return value is positive, allocate `required_len` bytes and call again.
3. If the return value is negative, parse the response as `{ "error": "..." }` when a response was written.

`request_ptr == NULL` or `request_len == 0` is treated as JSON `null`.

### Byte JSON Shape {#byte-json-shape}

Several `call_json` methods accept bytes in any of these forms:

```json
{ "bytes": [1, 2, 255] }
```

```json
{ "data": { "base64": "AQD/" } }
```

```json
{ "data": "plain UTF-8 text" }
```

Byte responses include:

```json
{
  "bytes": [1, 2, 255],
  "base64": "AQL/",
  "len": 3
}
```

## Effect Plugin API

Core creates one native effect instance per active effect assignment.

| Callback | Required | Called when |
|----------|----------|-------------|
| `create(host, out_instance)` | Yes | Effect instance is created |
| `destroy(instance)` | Optional | Effect instance is dropped |
| `resize(instance, width, height, led_count)` | Optional | Target LED layout changes |
| `update_params_json(instance, ptr, len)` | Optional | Effect params change |
| `tick(instance, elapsed_seconds, buffer, len)` | Optional | Each render frame |
| `is_ready(instance)` | Optional | Core checks whether async resources are ready |

`tick` receives a mutable RGB buffer owned by Core. Fill the buffer in place; do not store the pointer.

Core consumes internal runtime parameters such as `__screen_index`, `__screen_region`, `__audio_device_index`, and `__audio_settings` before forwarding params to `update_params_json`.

### Effect Host Callbacks

| Callback | Permission | Return |
|----------|------------|--------|
| `effect_audio_capture(avg_size, out_frame)` | `audio:capture` | Positive if data exists, `0` if no frame, negative on error |
| `effect_screen_capture(width, height, out_frame)` | `screen:capture` | Positive if data exists, `0` if unavailable, negative on error |
| `effect_album_art(width, height, out_frame)` | `media:album_art` | Positive if data exists, `0` if unavailable, negative on error |

Returned frame slices are host-owned and valid until the next related host capture call or until the callback returns to Core.

### Effect call_json Methods

| Method | Permission | Request | Response |
|--------|------------|---------|----------|
| `hsv_to_rgb` or `host.hsv_to_rgb` | None | `{ "h": 0..360, "s": 0..1, "v": 0..1 }` | `{ "r": 0..255, "g": 0..255, "b": 0..255, "rgb": [r,g,b] }` |
| `screen.list_displays` or `list_displays` | `screen:capture` | `null` | Display list |
| `screen.capture` or `capture_screen` | `screen:capture` | `{ "width": n, "height": n }` | `{ "width": n, "height": n, "pixels": [0xRRGGBB...] }` or `null` |
| `audio.capture` or `capture_audio` | `audio:capture` | `{ "avg_size": n }`, a number, or `null` | `{ "amplitude": n, "bins": [...] }` or `null` |
| `media.album_art` or `album_art` | `media:album_art` | `{ "width": n, "height": n }` | `{ "width": n, "height": n, "pixels": [0xRRGGBB...] }` or `null` |

## Controller Plugin API

Controller plugins are created only for hardware candidates matched by the manifest `match` rules.

| Callback | Required | Called when |
|----------|----------|-------------|
| `create(host, candidate, out_instance)` | Yes | A serial or HID candidate matched |
| `destroy(instance)` | Optional | Controller is dropped |
| `validate(instance)` | Optional | Handshake; positive accepts, `0` rejects candidate |
| `init(instance)` | Optional | Register outputs and perform initialization |
| `get_device_info(instance, out_info)` | Optional | Core refreshes device identity |
| `get_output_count(instance)` | Optional | Core reads output definitions from plugin |
| `get_output(instance, index, out_output)` | Optional | Core reads one output definition |
| `update(instance, frames, frame_count)` | Optional | New LED colors are available |
| `set_output_leds_count(instance, output_id, len, count)` | Optional | User changes editable LED count |
| `update_output(instance, output)` | Optional | User changes output layout |
| `disconnect(instance)` | Optional | Device is being disconnected |

Controllers can either push device/output metadata through host callbacks during `init`, or expose `get_device_info`, `get_output_count`, and `get_output`.

### Controller Host Callbacks

| Callback | Purpose |
|----------|---------|
| `controller_set_device_info(info)` | Override manufacturer, model, serial id, device type, image URL, controller id/name, and device path |
| `controller_add_output(output)` | Register or replace an output definition |
| `controller_output_led_count(output_id)` | Return current LED count for an output |
| `controller_get_rgb_bytes(output_id, out, out_len)` | Copy RGB bytes for the latest frame |
| `controller_write(data, data_len)` | Write to serial or primary HID transport |
| `controller_read(out, out_len, timeout_ms)` | Read from serial or primary HID transport |
| `controller_hid_send_feature_report(data, data_len)` | Send HID feature report on primary HID transport |
| `controller_hid_get_feature_report(out, out_len, report_id)` | Read HID feature report on primary HID transport |

### Controller call_json Methods

| Method | Permission | Request | Response |
|--------|------------|---------|----------|
| `system` or `system.info` | `system:info` | `null` | System information object |
| `hid_interfaces` or `controller.hid_interfaces` | None | `null` | Array of `{ interface_number, port_key, primary }` |
| `hid_write` or `controller.hid_write` | None | `{ "data": bytes, "selector": selector }` | `{ "written": n }` |
| `hid_read` or `controller.hid_read` | None | `{ "len": n, "timeout_ms": n, "selector": selector }` | Byte response |
| `hid_send_feature_report` or `controller.hid_send_feature_report` | None | `{ "data": bytes, "selector": selector }` | `{ "written": n }` |
| `hid_get_feature_report` or `controller.hid_get_feature_report` | None | `{ "len": n, "report_id": n, "selector": selector }` | Byte response |
| `register_setting`, `controller.register_setting`, or `controller.register_config_param` | None | Setting schema | `{ "ok": true }` |
| `get_settings` or `controller.get_settings` | None | `null` | Current settings object |
| `trigger_setting_action` or `controller.trigger_setting_action` | None | `{ "key": "setting_key" }` | `{ "ok": true }` |

`selector` can be an interface number, a `port_key` string, or an object such as `{ "interface_number": 1 }` or `{ "port_key": "..." }`.

## Extension Plugin API

Extensions run on a Core-managed thread and receive events from device frame delivery, UI page messages, plugin broadcasts, and scan requests.

| Callback | Required | Called when |
|----------|----------|-------------|
| `create(host, out_instance)` | Yes | Extension thread starts |
| `destroy(instance)` | Optional | Extension is dropped |
| `start(instance)` | Optional | After creation, before event loop |
| `stop(instance)` | Optional | Extension is stopping |
| `on_scan_devices(instance)` | Optional | User or Core requests a device scan |
| `on_event_json(instance, event, data)` | Optional | Extension broadcast event arrives |
| `on_page_message_json(instance, ptr, len)` | Optional | Extension page sends a message |
| `on_device_frame(instance, port, frames, frame_count)` | Optional | Subscribed device frame arrives |

### Extension Host Callbacks

| Callback | Purpose |
|----------|---------|
| `extension_lock_leds(port, output_id, indices, locked_count, rejected_count)` | Lock LEDs for extension ownership |
| `extension_unlock_leds(port, output_id, indices)` | Release LED locks |
| `extension_set_leds_rgb(port, output_id, colors)` | Set colors for already locked LEDs |

### Extension call_json Methods

| Area | Methods |
|------|---------|
| Plugin info and paths | `plugin.info`, `data_dir`, `plugin.data_dir`, `resource_dir`, `plugin.resource_dir`, `get_core_config_dir`, `open_core_config_dir`, `get_plugin_dir`, `open_plugin_dir`, `open_plugin_data_dir` |
| Plugin administration | `get_plugins`, `import_plugin_package`, `install_plugins`, `cancel_plugin_import`, `delete_plugin`, `reset_plugin`, `refresh_plugins`, `set_controller_plugins_enabled`, `set_effect_plugins_enabled`, `set_extension_plugins_enabled` |
| Core configuration | `get_startup_status`, `get_shortcuts_config`, `set_shortcuts_config`, `set_locale`, `get_capture_config`, `get_capture_max_pixels`, `set_capture_max_pixels`, `get_capture_fps`, `set_capture_fps`, `get_capture_method`, `set_capture_method` |
| System | `system`, `system.info`, `get_system_info`, `list_system_state_topics`, `get_system_state` |
| Page and notifications | `page_emit`, `ext_page_send`, `notify`, `notify_persistent`, `dismiss_persistent` |
| Devices | `register_device`, `remove_extension_device`, `scan_devices`, `get_devices`, `get_device_info`, `get_device`, `get_device_config`, `set_device_nickname`, `set_output_nickname`, `set_device_controller`, `set_device_conflict_warning_ignored`, `update_device_settings`, `set_output_leds_count`, `update_output`, `set_output_segments` |
| LED locks | `lock_leds`, `unlock_leds`, `set_leds`, `get_led_locks` |
| Effects and resources | `get_effects`, `get_effect_params`, `get_displays`, `get_audio_devices`, `get_media_session`, `get_current_media` |
| Linked/global control | `get_linked_control`, `set_linked_control`, `set_all_devices_power` |
| Layout and edit preview | `flip_scope_layout`, `begin_led_edit_preview`, `update_led_edit_preview`, `keepalive_led_edit_preview`, `end_led_edit_preview` |
| Scope state | `get_scope_screen_state`, `get_scope_audio_device_state`, `get_scope_audio_device_index`, `get_scope_audio_processing_settings`, `set_scope_screen_index`, `set_scope_screen_region`, `set_scope_audio_device_index`, `set_scope_audio_processing_settings`, `reset_scope_audio_processing_settings` |
| Scope control | `set_scope_effect`, `set_effect`, `update_scope_effect_params`, `update_effect_params`, `reset_scope_effect_params`, `set_scope_mode_paused`, `set_scope_power`, `set_scope_brightness`, `set_brightness` |
| TCP | `tcp_connect`, `net.tcp.connect`, `tcp_write`, `tcp_send`, `net.tcp.write`, `tcp_write_all`, `net.tcp.write_all`, `tcp_read`, `tcp_recv`, `net.tcp.read`, `tcp_read_exact`, `tcp_recv_exact`, `net.tcp.read_exact`, `tcp_close`, `net.tcp.close` |
| HTTP | `http_request`, `net.http.request`, `http_open`, `http_stream`, `net.http.stream`, `http_read`, `net.http.read`, `http_close`, `net.http.close` |
| Process | `spawn_process`, `is_process_alive`, `kill_process` |
| HID | `hid_enumerate`, `hid_open`, `hid_open_path`, `hid_write`, `hid_read`, `hid_send_feature_report`, `hid_get_feature_report`, `hid_close` |

The ABI structs and callback signatures did not change for these additions. They are exposed through the existing `SkydimoHostApiV1.call_json` path. Method-specific tables below are authoritative: some methods accept both snake_case and camelCase fields, while older compatibility methods still require snake_case field names.

File-changing plugin administration calls have runtime guards. `import_plugin_package` and `install_plugins` are disabled in simple mode. `install_plugins`, `delete_plugin`, `reset_plugin`, and `refresh_plugins` fail while plugin startup is still `pending` or `running`. Enable-state calls (`set_controller_plugins_enabled`, `set_effect_plugins_enabled`, `set_extension_plugins_enabled`) update the enabled maps immediately and are not startup-gated.

### Extension Permissions

| Capability | Required permission |
|------------|---------------------|
| `system` / `system.info` | `system:info` |
| Media session methods | `media:session` |
| TCP methods | `network:tcp` or `network` |
| HTTP methods | `network:http` or `network` |
| Process methods | `process` |
| HID methods | `hardware:hid` |
| System process state | `system:process` |
| System window focus state | `system:window-focus` |

### Extension call_json Request and Response Shapes

Scope methods accept a scope either at the top level or under `scope`:

```json
{
  "scope": {
    "port": "device-port",
    "output_id": "out1",
    "segment_id": "segment-a"
  }
}
```

`segment_id` requires `output_id`. `output_id` and `segment_id` are optional for device-level operations.

Common response conventions:

- `null` means the method succeeded and has no payload.
- Handle-creating methods return `{ "handle": number }`.
- Byte-returning methods use the [Byte JSON Shape](#byte-json-shape): `{ "bytes": [...], "base64": "...", "len": n }`.
- `request_ptr == NULL` or an empty request is treated as JSON `null`.

#### Plugin, Paths, and Core Configuration

| Method(s) | Request | Response | Notes |
|-----------|---------|----------|-------|
| `plugin.info` | `null` | Plugin metadata object | Includes `id`, `name`, `version`, `publisher`, `language`, `permissions`, `type`, optional `abi`, `description`, `page_path`, and `page_url`. |
| `data_dir`, `plugin.data_dir` | `null` | string | Ensures and returns this plugin's runtime data directory. |
| `resource_dir`, `plugin.resource_dir` | `null` | string | Returns the plugin resource directory. |
| `get_core_config_dir` | `null` | string | Does not create the directory. |
| `open_core_config_dir` | `null` | string | Ensures the directory exists; Native-C host does not open a file manager. |
| `get_plugin_dir` | `null` | string | Returns the managed plugin root directory. |
| `open_plugin_dir` | `{ "pluginId": "id" }` or `{ "plugin_id": "id" }` | string | `pluginId` is optional; omitted returns the plugin root. Ensures the returned directory exists. |
| `open_plugin_data_dir` | `{ "pluginId": "id" }` or `{ "plugin_id": "id" }` | string | Ensures and returns the runtime data directory for the target plugin. |
| `get_plugins` | `null` | `PluginsResponse` | Same shape as WebSocket `get_plugins`. |
| `import_plugin_package` | `{ "fileName": "x.skyplugin", "data": "BASE64" }` | `{ "sessionId": "...", "sourceName": "...", "plugins": [...] }` | Also accepts `file_name`, `data_base64`, and `dataBase64`. Disabled in simple mode. |
| `install_plugins` | `{ "sessionId": "...", "pluginIds": ["id"] }` | array | Also accepts `session_id` and `plugin_ids`. Startup-gated and disabled in simple mode. |
| `cancel_plugin_import` | `{ "sessionId": "..." }` | `null` | Also accepts `session_id`. |
| `delete_plugin` | `{ "pluginId": "id", "deleteData": true }` | `null` | Also accepts `plugin_id` and `delete_data`. Startup-gated. |
| `reset_plugin` | `{ "pluginId": "id", "resetData": false }` | `null` | Also accepts `plugin_id` and `reset_data`. Startup-gated. |
| `refresh_plugins` | `null` | `null` | Startup-gated; stops and restarts enabled extensions around registry reload. |
| `set_controller_plugins_enabled` | `{ "pluginIds": ["id"], "enabled": false }` | `null` | Also accepts `plugin_ids`; `enabled` defaults to `true`. Disabling disconnects matching devices; enabling triggers discovery. |
| `set_effect_plugins_enabled` | `{ "pluginIds": ["id"], "enabled": true }` | `null` | Emits `plugins-changed`. |
| `set_extension_plugins_enabled` | `{ "pluginIds": ["id"], "enabled": false }` | `null` | Stops disabled extensions and starts newly enabled extensions. |
| `get_startup_status` | `null` | `CoreStartupStatusInfo` | See [data types](../../api/data-types#corestartupstatusinfo). |
| `get_shortcuts_config` | `null` | `ShortcutConfig` | Returns the current global shortcut config. |
| `set_shortcuts_config` | `ShortcutConfig` or `{ "config": ShortcutConfig }` | `ShortcutConfig` | Returns the normalized persisted config. |
| `set_locale` | `{ "locale": "en-US" }` | `null` | Emits `locale-changed`. |
| `get_capture_config` | `null` | `{ "maxPixels": n, "fps": n, "method": "...", "samplingLocked": bool }` | Global screen-capture config. |
| `get_capture_max_pixels` | `null` | number | `0` means no pixel budget limit. |
| `set_capture_max_pixels` | `{ "maxPixels": 921600 }` | capture config | Also accepts `max_pixels`. Fails when simple mode locks capture sampling. |
| `get_capture_fps` | `null` | number | Current capture FPS. |
| `set_capture_fps` | `{ "fps": 30 }` | capture config | Clamped to at least `1`; fails when simple mode locks capture sampling. |
| `get_capture_method` | `null` | string | Active capture backend. |
| `set_capture_method` | `{ "method": "dxgi" }` | capture config | Valid values depend on platform. |

#### System, Page, and Notifications

| Method(s) | Request | Response | Notes |
|-----------|---------|----------|-------|
| `system`, `system.info`, `get_system_info` | `null` | System information object | Requires `system:info`. |
| `list_system_state_topics` | `null` | array | Only topics allowed by this plugin's permissions are returned. |
| `get_system_state` | `{ "topic": "process" }` | object | Requires the topic permission, such as `system:process` or `system:window-focus`. |
| `page_emit` | any JSON value | `null` | Emits to this extension's page as `ext-page-message:<extension_id>`. |
| `ext_page_send` | `{ "extId": "other_extension", "data": {...} }` | `null` | Also accepts `ext_id`; `data` defaults to `null`. |
| `notify` | `{ "title": ..., "description": ..., "level": "info" }` | `null` | `description` defaults to empty string; `level` defaults to `info`. Text fields accept localized notification objects. |
| `notify_persistent` | `{ "id": "key", "title": ..., "description": ..., "level": "warning" }` | `null` | Updates any existing persistent notification with the same `id`. |
| `dismiss_persistent` | `{ "id": "key" }` | `null` | Dismisses a persistent notification. |

#### Devices, Outputs, and LEDs

`register_device` accepts:

```json
{
  "controller_port": "extension.unique-device",
  "manufacturer": "Example",
  "model": "Virtual Matrix",
  "serial_id": "001",
  "device_type": "virtual",
  "outputs": [
    {
      "id": "main",
      "name": "Main",
      "output_type": "matrix",
      "leds_count": 64,
      "matrix": { "width": 8, "height": 8, "map": [0, 1, 2] },
      "editable": true,
      "min_total_leds": 1,
      "max_total_leds": 256,
      "allowed_total_leds": [64, 128],
      "default_effect": "rainbow"
    }
  ]
}
```

| Method(s) | Request | Response | Notes |
|-----------|---------|----------|-------|
| `register_device` | Device definition object | string | Returns the registered `controller_port`. |
| `remove_extension_device` | `{ "port": "device-port" }` | `null` | Also accepts `controller_port`. |
| `scan_devices` | `null` | `null` | Triggers manual discovery. |
| `get_devices` | `null` | array | Same device list shape used by WebSocket APIs. |
| `get_device_info`, `get_device` | `{ "port": "device-port" }` | device object | Fails if the device is not known. |
| `get_device_config` | `{ "port": "device-port" }` | `{ "deviceId": "...", "port": "...", "config": {...} }` | Reads persisted config for the connected device. |
| `set_device_nickname` | `{ "port": "...", "nickname": "Desk" }` | `null` | Omit or set `nickname` to `null` to clear it. |
| `set_output_nickname` | `{ "port": "...", "outputId": "main", "nickname": "Desk strip" }` | `null` | Also accepts `output_id`. |
| `set_device_controller` | `{ "port": "...", "controllerId": "skydimo_serial" }` | `null` | Also accepts `controller_id`; omit or set to `null` to clear the override. |
| `set_device_conflict_warning_ignored` | `{ "port": "...", "ignored": true }` | `null` | Updates duplicate/conflict warning state. |
| `update_device_settings` | `{ "port": "...", "settings": {...} }` | `null` | `settings` defaults to `{}`. |
| `set_output_leds_count` | `{ "port": "...", "output_id": "main", "count": 120 }` | `null` | Also accepts `controller_port` and `leds_count`; this method requires `output_id`. |
| `update_output` | `{ "port": "...", "output_id": "main", "leds_count": 120, "matrix": {...} }` | `null` | Also accepts `controller_port`; this method requires `output_id`. |
| `set_output_segments` | `{ "port": "...", "outputId": "main", "segments": [...] }` | `null` | Also accepts `output_id`. |
| `lock_leds` | `{ "port": "...", "output_id": "main", "indices": [0, 1] }` | `{ "locked": n, "rejected": n }` | `indices` are zero-based; this method requires `output_id`. |
| `unlock_leds` | `{ "port": "...", "output_id": "main", "indices": [0, 1] }` | `null` | Releases locks owned by this extension. |
| `set_leds` | `{ "port": "...", "output_id": "main", "colors": [...] }` | `null` | Colors can be `{ "index": 0, "r": 255, "g": 0, "b": 0 }` or `[r, g, b]`. |
| `get_led_locks` | `{ "port": "...", "output_id": "main" }` | array/object | Both fields are optional; this method requires `output_id` when filtering by output. |

`set_output_segments` uses the `SegmentDefinition` shape from [data types](../../api/data-types#segmentdefinition). Matrix values use `{ "width": n, "height": n, "map": [...] }`.

LED edit preview methods:

```json
{
  "port": "device-port",
  "outputId": "main",
  "sessionId": "preview-1",
  "offset": 0,
  "colors": [
    {"r": 255, "g": 0, "b": 0}
  ]
}
```

Use `begin_led_edit_preview`, `update_led_edit_preview`, `keepalive_led_edit_preview`, and `end_led_edit_preview` with `port`, `outputId`/`output_id`, and `sessionId`/`session_id`. `update_led_edit_preview` also accepts `offset` and `colors`. Core rejects an `offset` or preview chunk larger than `65,536` LEDs.

#### Effects, Resources, and Scope Control

| Method(s) | Request | Response | Notes |
|-----------|---------|----------|-------|
| `get_effects` | `null` | array | Effect metadata with localized `name`, optional `description`, `group`, and `icon`. |
| `get_effect_params` | `{ "effect_id": "rainbow" }` | array | Also accepts `id`. |
| `get_displays` | `null` | array | Screen/display list. |
| `get_audio_devices` | `null` | array | Audio capture device list. |
| `get_media_session`, `get_current_media` | `{ "max_edge": 256 }` | media session object or `null` | Requires `media:session`; `max_edge` is optional and uses snake_case. |
| `get_linked_control` | `null` | `{ "enabled": bool, "state": {...} }` | Returns global linked-control state. |
| `set_linked_control` | `{ "enabled": true, "source": { "port": "...", "outputId": "main" } }` | linked-control object | Also accepts `source_scope`; source fields accept snake_case/camelCase. |
| `set_all_devices_power` | `{ "is_off": true }` | `{ "affected_ports": [...] }` | Also accepts `off`. |
| `get_scope_screen_state` | scope request | object | Scope may be top-level or nested under `scope`. |
| `get_scope_audio_device_state`, `get_scope_audio_device_index` | scope request | object | Returns `selected_index`, `effective_index`, and `effective_from`. |
| `get_scope_audio_processing_settings` | scope request | object | Returns selected/effective audio preprocessing settings. |
| `set_scope_screen_index` | scope request plus `screenIndex` or `screen_index` | `null` | Omit or pass `null` to reset. Linked control updates shared state. |
| `set_scope_screen_region` | scope request plus `region` | `null` | `region` is `{ "x": n, "y": n, "width": n, "height": n }`. |
| `set_scope_audio_device_index` | scope request plus `audioDeviceIndex` or `audio_device_index` | `null` | Omit or pass `null` to reset. |
| `set_scope_audio_processing_settings` | scope request plus `settings` | `null` | Fails when simple mode locks audio preprocessing. |
| `reset_scope_audio_processing_settings` | scope request | `null` | Resets to defaults; fails when simple mode locks audio preprocessing. |
| `flip_scope_layout` | scope request plus `{ "axis": "horizontal" }` | `null` | `axis` is `horizontal` or `vertical`. |
| `set_scope_effect`, `set_effect` | scope request plus `effectId`/`effect_id`/`effect`, optional `params`, optional transition flags | `null` | Omit the effect field to clear the effect. |
| `update_scope_effect_params`, `update_effect_params` | scope request plus `{ "params": {...} }` | `null` | Updates the active effect params only. |
| `reset_scope_effect_params` | scope request | `null` | Resets params to defaults. |
| `set_scope_mode_paused` | scope request plus `{ "paused": true }` | `null` | Linked control updates shared pause state. |
| `set_scope_power` | scope request plus `{ "is_off": true }` | `null` | Also accepts `off` and transition flags. |
| `set_scope_brightness`, `set_brightness` | scope request plus `{ "brightness": 80 }` | `null` | Brightness is clamped to `0..100`. |

Transition flags can be at the top level or inside `options`: `skip_transition`, `skipTransition`, `no_transition`, or `immediate`.

Audio preprocessing uses camelCase JSON:

```json
{
  "scope": {"port": "device-port", "outputId": "main"},
  "settings": {
    "amplitude": 120,
    "averageMode": "binning",
    "averageSize": 8,
    "windowMode": "hann",
    "decay": 80,
    "filterConstant": 1.0,
    "normalizationOffset": 0.04,
    "normalizationScale": 0.5
  }
}
```

`averageMode` is `binning` or `low_pass`; `windowMode` is `none`, `hann`, `hamming`, or `blackman`.

#### Network, Process, and HID

TCP methods require `network:tcp` or `network`:

| Method(s) | Request | Response |
|-----------|---------|----------|
| `tcp_connect`, `net.tcp.connect` | `{ "host": "127.0.0.1", "port": 1234, "connectTimeoutMs": 5000, "readTimeoutMs": 1000, "writeTimeoutMs": 1000, "noDelay": true }` | `{ "handle": n }` |
| `tcp_write`, `tcp_send`, `net.tcp.write` | `{ "handle": n, "data": bytes, "timeoutMs": 1000 }` | `{ "written": n }` |
| `tcp_write_all`, `net.tcp.write_all` | `{ "handle": n, "data": bytes, "timeoutMs": 1000 }` | `{ "written": n }` |
| `tcp_read`, `tcp_recv`, `net.tcp.read` | `{ "handle": n, "max_len": 4096, "timeoutMs": 1000 }` | byte response |
| `tcp_read_exact`, `tcp_recv_exact`, `net.tcp.read_exact` | `{ "handle": n, "len": 4, "timeoutMs": 1000 }` | byte response |
| `tcp_close`, `net.tcp.close` | `{ "handle": n }` | `null` |

HTTP methods require `network:http` or `network`. Request options accept `method`, `url`, `headers`, `body`, `json`, `timeoutMs`/`timeout_ms`, `connectTimeoutMs`/`connect_timeout_ms`, `maxResponseBytes`/`max_response_bytes`, `followRedirects`/`follow_redirects`, and `maxRedirects`/`max_redirects`. `body` and `json` are mutually exclusive.

| Method(s) | Request | Response |
|-----------|---------|----------|
| `http_request`, `net.http.request` | HTTP request options | `{ "ok": bool, "status": n, "url": "...", "headers": {...}, "body": [bytes], "body_base64": "..." }` |
| `http_open`, `http_stream`, `net.http.stream` | HTTP request options | `{ "handle": n }` |
| `http_read`, `net.http.read` | `{ "handle": n, "timeoutMs": 5000 }` | `null`, headers event, byte chunk event, done event, or error event |
| `http_close`, `net.http.close` | `{ "handle": n }` | `null` |

HTTP stream events:

```json
{ "type": "headers", "ok": true, "status": 200, "url": "...", "headers": {} }
```

```json
{ "type": "chunk", "bytes": [1, 2], "base64": "AQI=", "len": 2 }
```

```json
{ "type": "done" }
```

```json
{ "type": "error", "error": "message" }
```

Process methods require `process`:

| Method | Request | Response |
|--------|---------|----------|
| `spawn_process` | `{ "executable": "tool", "args": ["--flag"], "hidden": true, "working_dir": "C:/..." }` | `{ "handle": n }` |
| `is_process_alive` | `{ "handle": n }` | `{ "alive": bool }` |
| `kill_process` | `{ "handle": n }` | `null` |

`spawn_process` also accepts `path` instead of `executable`, and `cwd` instead of `working_dir`.

HID methods require `hardware:hid`:

| Method | Request | Response |
|--------|---------|----------|
| `hid_enumerate` | `{ "vendorId": 0x1532, "productId": 0x0084 }` | array |
| `hid_open` | `{ "vendorId": 0x1532, "productId": 0x0084, "serial": "..." }` | `{ "handle": n }` |
| `hid_open_path` | `{ "path": "..." }` | `{ "handle": n }` |
| `hid_write` | `{ "handle": n, "data": bytes }` | `{ "written": n }` |
| `hid_read` | `{ "handle": n, "len": 64, "timeoutMs": 1000 }` | byte response |
| `hid_send_feature_report` | `{ "handle": n, "data": bytes }` | `{ "written": n }` |
| `hid_get_feature_report` | `{ "handle": n, "len": 64, "reportId": 6 }` | byte response |
| `hid_close` | `{ "handle": n }` | `null` |

HID vendor/product fields also accept `vid`/`pid`, `vendor_id`/`product_id`, and `vendorId`/`productId`. Enumerated HID rows use `vendor_id`, `product_id`, `serial_number`, `manufacturer`, `product`, `interface_number`, `usage`, and `usage_page`.

```json
{
  "path": "\\\\?\\hid#vid_1532...",
  "vendor_id": 5426,
  "product_id": 132,
  "serial_number": "ABC",
  "manufacturer": "Vendor",
  "product": "Device",
  "interface_number": 1,
  "usage": 1,
  "usage_page": 65280
}
```

## Safety Rules

- Set every ABI table `size` field to the SDK struct size.
- Validate `requested_abi_version` before writing `out_api`.
- Copy strings or slices if they must outlive the callback.
- Keep host callbacks on the thread where Core invoked the plugin unless the SDK explicitly documents otherwise.
- Do not block high-frequency callbacks such as effect `tick` or controller `update`.
- Treat `call_json` as a control path, not a bulk data path.
- Return negative statuses on failure and log useful context through `host->log`.
