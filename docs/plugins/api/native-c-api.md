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

### Byte JSON Shape

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
| Plugin info and paths | `plugin.info`, `data_dir`, `plugin.data_dir`, `resource_dir`, `plugin.resource_dir` |
| System | `system`, `system.info`, `list_system_state_topics`, `get_system_state` |
| Page and notifications | `page_emit`, `notify`, `notify_persistent`, `dismiss_persistent` |
| Devices | `register_device`, `remove_extension_device`, `get_devices`, `get_device_info`, `set_device_nickname`, `set_output_leds_count`, `update_output` |
| LED locks | `lock_leds`, `unlock_leds`, `set_leds`, `get_led_locks` |
| Effects and resources | `get_effects`, `get_effect_params`, `get_displays`, `get_audio_devices`, `get_media_session`, `get_current_media` |
| Scope state | `get_scope_screen_state`, `get_scope_audio_device_state`, `set_scope_screen_index`, `set_scope_screen_region`, `set_scope_audio_device_index` |
| Scope control | `set_scope_effect`, `set_effect`, `update_scope_effect_params`, `reset_scope_effect_params`, `set_scope_mode_paused`, `set_scope_power`, `set_scope_brightness` |
| TCP | `tcp_connect`, `net.tcp.connect`, `tcp_write`, `tcp_send`, `net.tcp.write`, `tcp_write_all`, `net.tcp.write_all`, `tcp_read`, `tcp_recv`, `net.tcp.read`, `tcp_read_exact`, `tcp_recv_exact`, `net.tcp.read_exact`, `tcp_close`, `net.tcp.close` |
| HTTP | `http_request`, `net.http.request`, `http_open`, `http_stream`, `net.http.stream`, `http_read`, `net.http.read`, `http_close`, `net.http.close` |
| Process | `spawn_process`, `is_process_alive`, `kill_process` |
| HID | `hid_enumerate`, `hid_open`, `hid_open_path`, `hid_write`, `hid_read`, `hid_send_feature_report`, `hid_get_feature_report`, `hid_close` |

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

### Common Extension Request Shapes

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
      "max_total_leds": 256
    }
  ]
}
```

`lock_leds`, `unlock_leds`, and `set_leds` use:

```json
{
  "port": "device-port",
  "output_id": "main",
  "indices": [0, 1, 2],
  "colors": [
    { "index": 0, "r": 255, "g": 0, "b": 0 },
    [0, 255, 0]
  ]
}
```

`set_leds` accepts either `{ index, r, g, b }` entries or RGB arrays. RGB arrays use the array index as the LED index.

## Safety Rules

- Set every ABI table `size` field to the SDK struct size.
- Validate `requested_abi_version` before writing `out_api`.
- Copy strings or slices if they must outlive the callback.
- Keep host callbacks on the thread where Core invoked the plugin unless the SDK explicitly documents otherwise.
- Do not block high-frequency callbacks such as effect `tick` or controller `update`.
- Treat `call_json` as a control path, not a bulk data path.
- Return negative statuses on failure and log useful context through `host->log`.
