---
sidebar_position: 4
---

# Native-C API 参考

本页记录插件可使用的公开 native-c ABI。内容依据当前 Core 运行时行为整理，面向使用公开 SDK 包的外部开发者，而不是面向阅读 Skydimo 源码的内部开发者。

请使用 [Skydimo-Team/Skydimo-SDK](https://github.com/Skydimo-Team/Skydimo-SDK) 中与 manifest `abi` 匹配的 SDK 包。

## ABI 模型

native-c 插件是进程内共享库。Core 会加载 `manifest.json` `entry` 声明的库，查找 `skydimo_plugin_get_api`，并要求插件填充函数表。

```c
SKYDIMO_EXPORT int32_t skydimo_plugin_get_api(
    uint32_t requested_abi_version,
    const SkydimoHostApiV1* host,
    SkydimoPluginApiV1* out_api);
```

| 项 | 值 |
|----|----|
| 当前 ABI 版本 | `3` |
| 支持版本范围 | `2..3` |
| 通用 ABI id | `skydimo-native-c-v3` |
| Effect ABI id | `skydimo-effect-c-v3` |
| Controller ABI id | `skydimo-controller-c-v3` |
| Extension ABI id | `skydimo-extension-c-v3` |

`out_api->abi_version` 必须等于 `requested_abi_version`。`out_api->kind_mask` 必须包含 manifest 类型所需的 API family。

| Mask | 含义 |
|------|------|
| `SKYDIMO_PLUGIN_KIND_EFFECT` | 提供 `SkydimoEffectApiV1` |
| `SKYDIMO_PLUGIN_KIND_CONTROLLER` | 提供 `SkydimoControllerApiV1` |
| `SKYDIMO_PLUGIN_KIND_EXTENSION` | 提供 `SkydimoExtensionApiV1` |

## 状态码约定

| 函数类型 | 成功 | 软结果 | 失败 |
|----------|------|--------|------|
| 返回 `int32_t` 的生命周期回调 | `0` 或正数 | 部分回调用 `0` 表示 false、正数表示 true | 负状态码 |
| `validate` 与 `is_ready` | 正数表示 true | `0` 表示 false | 负状态码 |
| 返回 `intptr_t` 的读写回调 | 非负字节数 | `0` 表示没有数据或写入被限流 | 负状态码 |
| `call_json` | `0` 表示响应已写入 | 正数表示响应缓冲区太小，并写入 `required_len` | 负状态码；可用时响应为错误 JSON |

不要让异常、panic 或 unwind 穿过 native-c ABI 函数。插件应在语言边界内捕获运行时失败，并返回负状态码。

## 通用类型

| 类型 | 用途 |
|------|------|
| `SkydimoStr` | UTF-8 字符串切片：`const char* ptr`、`size_t len`；不要求以 null 结尾 |
| `SkydimoRgb` | RGB 颜色：`uint8_t r`、`g`、`b` |
| `SkydimoRgbFrameV1` | 宽高与宿主持有的 RGB 像素切片 |
| `SkydimoAudioFrameV1` | 音频振幅与 FFT bin 切片 |
| `SkydimoOutputDefinitionV1` | 控制器输出端口元数据与能力 |
| `SkydimoOutputFrameV1` | 输出 id 与 RGB 颜色切片 |
| `SkydimoHardwareCandidateV1` | 由 controller manifest 匹配到的串口或 HID 候选设备 |
| `SkydimoDeviceInfoV1` | 控制器提供的设备身份信息 |

Core 传入的指针只在对应回调约定的生命周期内有效。插件如果需要稍后使用数据，必须自行复制。

### 设备类型

原生常量对应插件系统中的设备类型字符串：

```text
light, motherboard, dram, gpu, cooler, led_strip, keyboard, mouse,
mouse_mat, headset, headset_stand, gamepad, speaker, virtual, storage,
case, microphone, accessory, keypad, laptop, monitor, unknown
```

### Segment 类型

| 常量 | 含义 |
|------|------|
| `SKYDIMO_SEGMENT_SINGLE` | 单色区域 |
| `SKYDIMO_SEGMENT_LINEAR` | 线性灯带 |
| `SKYDIMO_SEGMENT_MATRIX` | 二维矩阵 |
| `SKYDIMO_SEGMENT_PRESET` | 预设或非逐点可寻址区域 |

## Plugin API 表

`SkydimoPluginApiV1` 是 `skydimo_plugin_get_api` 返回的顶层函数表。

| 字段 | 是否必需 | 说明 |
|------|----------|------|
| `size` | 是 | 设为 `sizeof(SkydimoPluginApiV1)` |
| `abi_version` | 是 | 必须等于 `requested_abi_version` |
| `kind_mask` | 是 | `SKYDIMO_PLUGIN_KIND_*` 按位或 |
| `effect` | effect 插件必需 | `SkydimoEffectApiV1` 表 |
| `controller` | controller 插件必需 | `SkydimoControllerApiV1` 表 |
| `extension` | extension 插件必需 | `SkydimoExtensionApiV1` 表 |
| `shutdown_plugin` | 可选 | Core 卸载已加载插件包装时调用 |

## Host API 表

Core 会把 `SkydimoHostApiV1` 传给插件的 `create` 回调。所有插件类型都会收到通用回调。

| 回调 | 可用范围 | 用途 |
|------|----------|------|
| `log` | 所有插件类型 | 写入带插件上下文的日志 |
| `get_plugin_id` | 所有插件类型 | 以 `SkydimoStr` 返回当前插件 id |
| `call_json` | Effect、Controller、Extension | 语言中立的宿主方法调用 |

### call_json 协议

`call_json` 接收方法名和 UTF-8 JSON 请求，并把 UTF-8 JSON 响应写入调用方提供的缓冲区。

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

推荐调用流程：

1. 先使用一个合理大小的响应缓冲区调用。
2. 如果返回值为正数，按 `required_len` 分配缓冲区后再调用一次。
3. 如果返回值为负数，且响应已写入，可按 `{ "error": "..." }` 解析错误信息。

`request_ptr == NULL` 或 `request_len == 0` 会被视为 JSON `null`。

### 字节 JSON 形态 {#byte-json-shape}

多个 `call_json` 方法接受以下任意字节输入形式：

```json
{ "bytes": [1, 2, 255] }
```

```json
{ "data": { "base64": "AQD/" } }
```

```json
{ "data": "plain UTF-8 text" }
```

字节响应包含：

```json
{
  "bytes": [1, 2, 255],
  "base64": "AQL/",
  "len": 3
}
```

## Effect 插件 API

Core 会为每个启用的灯效分配创建一个 native effect 实例。

| 回调 | 是否必需 | 调用时机 |
|------|----------|----------|
| `create(host, out_instance)` | 是 | 创建灯效实例 |
| `destroy(instance)` | 可选 | 灯效实例被释放 |
| `resize(instance, width, height, led_count)` | 可选 | 目标 LED 布局变化 |
| `update_params_json(instance, ptr, len)` | 可选 | 灯效参数变化 |
| `tick(instance, elapsed_seconds, buffer, len)` | 可选 | 每个渲染帧 |
| `is_ready(instance)` | 可选 | Core 检查异步资源是否就绪 |

`tick` 接收 Core 持有的可变 RGB buffer。插件应原地填充，不要保存该指针。

Core 会先消费 `__screen_index`、`__screen_region`、`__audio_device_index`、`__audio_settings` 等内部运行时参数，再把剩余参数转交给 `update_params_json`。

### Effect Host 回调

| 回调 | 权限 | 返回 |
|------|------|------|
| `effect_audio_capture(avg_size, out_frame)` | `audio:capture` | 正数表示有数据，`0` 表示暂无帧，负数表示错误 |
| `effect_screen_capture(width, height, out_frame)` | `screen:capture` | 正数表示有数据，`0` 表示不可用，负数表示错误 |
| `effect_album_art(width, height, out_frame)` | `media:album_art` | 正数表示有数据，`0` 表示不可用，负数表示错误 |

返回的 frame 切片由宿主持有，只在下一次相关 capture 调用前，或回到 Core 前有效。

### Effect call_json 方法

| 方法 | 权限 | 请求 | 响应 |
|------|------|------|------|
| `hsv_to_rgb` 或 `host.hsv_to_rgb` | 无 | `{ "h": 0..360, "s": 0..1, "v": 0..1 }` | `{ "r": 0..255, "g": 0..255, "b": 0..255, "rgb": [r,g,b] }` |
| `screen.list_displays` 或 `list_displays` | `screen:capture` | `null` | 显示器列表 |
| `screen.capture` 或 `capture_screen` | `screen:capture` | `{ "width": n, "height": n }` | `{ "width": n, "height": n, "pixels": [0xRRGGBB...] }` 或 `null` |
| `audio.capture` 或 `capture_audio` | `audio:capture` | `{ "avg_size": n }`、数字或 `null` | `{ "amplitude": n, "bins": [...] }` 或 `null` |
| `media.album_art` 或 `album_art` | `media:album_art` | `{ "width": n, "height": n }` | `{ "width": n, "height": n, "pixels": [0xRRGGBB...] }` 或 `null` |

## Controller 插件 API

Controller 插件只会为 manifest `match` 规则命中的硬件候选设备创建。

| 回调 | 是否必需 | 调用时机 |
|------|----------|----------|
| `create(host, candidate, out_instance)` | 是 | 串口或 HID 候选设备匹配后 |
| `destroy(instance)` | 可选 | 控制器被释放 |
| `validate(instance)` | 可选 | 握手验证；正数接受，`0` 拒绝候选设备 |
| `init(instance)` | 可选 | 注册输出端口与初始化 |
| `get_device_info(instance, out_info)` | 可选 | Core 刷新设备身份 |
| `get_output_count(instance)` | 可选 | Core 读取输出端口数量 |
| `get_output(instance, index, out_output)` | 可选 | Core 读取单个输出端口定义 |
| `update(instance, frames, frame_count)` | 可选 | 新 LED 颜色可用 |
| `set_output_leds_count(instance, output_id, len, count)` | 可选 | 用户修改可编辑 LED 数量 |
| `update_output(instance, output)` | 可选 | 用户修改输出布局 |
| `disconnect(instance)` | 可选 | 设备即将断开 |

Controller 可以在 `init` 中通过 host 回调推送设备/输出元数据，也可以实现 `get_device_info`、`get_output_count`、`get_output` 供 Core 拉取。

### Controller Host 回调

| 回调 | 用途 |
|------|------|
| `controller_set_device_info(info)` | 覆盖 manufacturer、model、serial id、device type、image URL、controller id/name、device path |
| `controller_add_output(output)` | 注册或替换输出端口定义 |
| `controller_output_led_count(output_id)` | 返回输出端口当前 LED 数量 |
| `controller_get_rgb_bytes(output_id, out, out_len)` | 复制最新帧 RGB 字节 |
| `controller_write(data, data_len)` | 写入串口或 primary HID transport |
| `controller_read(out, out_len, timeout_ms)` | 从串口或 primary HID transport 读取 |
| `controller_hid_send_feature_report(data, data_len)` | 在 primary HID transport 发送 feature report |
| `controller_hid_get_feature_report(out, out_len, report_id)` | 在 primary HID transport 读取 feature report |

### Controller call_json 方法

| 方法 | 权限 | 请求 | 响应 |
|------|------|------|------|
| `system` 或 `system.info` | `system:info` | `null` | 系统信息对象 |
| `hid_interfaces` 或 `controller.hid_interfaces` | 无 | `null` | `{ interface_number, port_key, primary }` 数组 |
| `hid_write` 或 `controller.hid_write` | 无 | `{ "data": bytes, "selector": selector }` | `{ "written": n }` |
| `hid_read` 或 `controller.hid_read` | 无 | `{ "len": n, "timeout_ms": n, "selector": selector }` | 字节响应 |
| `hid_send_feature_report` 或 `controller.hid_send_feature_report` | 无 | `{ "data": bytes, "selector": selector }` | `{ "written": n }` |
| `hid_get_feature_report` 或 `controller.hid_get_feature_report` | 无 | `{ "len": n, "report_id": n, "selector": selector }` | 字节响应 |
| `register_setting`、`controller.register_setting` 或 `controller.register_config_param` | 无 | 设置项 schema | `{ "ok": true }` |
| `get_settings` 或 `controller.get_settings` | 无 | `null` | 当前设置对象 |
| `trigger_setting_action` 或 `controller.trigger_setting_action` | 无 | `{ "key": "setting_key" }` | `{ "ok": true }` |

`selector` 可以是接口号、`port_key` 字符串，或 `{ "interface_number": 1 }`、`{ "port_key": "..." }` 这类对象。

## Extension 插件 API

Extension 运行在 Core 管理的线程中，可接收设备帧投递、UI 页面消息、插件广播事件和扫描请求。

| 回调 | 是否必需 | 调用时机 |
|------|----------|----------|
| `create(host, out_instance)` | 是 | 扩展线程启动 |
| `destroy(instance)` | 可选 | 扩展被释放 |
| `start(instance)` | 可选 | 创建后、事件循环前 |
| `stop(instance)` | 可选 | 扩展停止 |
| `on_scan_devices(instance)` | 可选 | 用户或 Core 请求设备扫描 |
| `on_event_json(instance, event, data)` | 可选 | 收到扩展广播事件 |
| `on_page_message_json(instance, ptr, len)` | 可选 | 扩展页面发送消息 |
| `on_device_frame(instance, port, frames, frame_count)` | 可选 | 收到订阅设备帧 |

### Extension Host 回调

| 回调 | 用途 |
|------|------|
| `extension_lock_leds(port, output_id, indices, locked_count, rejected_count)` | 以扩展身份锁定 LED |
| `extension_unlock_leds(port, output_id, indices)` | 释放 LED 锁 |
| `extension_set_leds_rgb(port, output_id, colors)` | 为已锁定 LED 设置颜色 |

### Extension call_json 方法

| 区域 | 方法 |
|------|------|
| 插件信息与路径 | `plugin.info`、`data_dir`、`plugin.data_dir`、`resource_dir`、`plugin.resource_dir`、`get_core_config_dir`、`open_core_config_dir`、`get_plugin_dir`、`open_plugin_dir`、`open_plugin_data_dir` |
| 插件管理 | `get_plugins`、`import_plugin_package`、`install_plugins`、`cancel_plugin_import`、`delete_plugin`、`reset_plugin`、`refresh_plugins`、`set_controller_plugins_enabled`、`set_effect_plugins_enabled`、`set_extension_plugins_enabled` |
| Core 配置 | `get_startup_status`、`get_shortcuts_config`、`set_shortcuts_config`、`set_locale`、`get_capture_config`、`get_capture_max_pixels`、`set_capture_max_pixels`、`get_capture_fps`、`set_capture_fps`、`get_capture_method`、`set_capture_method` |
| 系统 | `system`、`system.info`、`get_system_info`、`list_system_state_topics`、`get_system_state` |
| 页面与通知 | `page_emit`、`ext_page_send`、`notify`、`notify_persistent`、`dismiss_persistent` |
| 设备 | `register_device`、`remove_extension_device`、`scan_devices`、`get_devices`、`get_device_info`、`get_device`、`get_device_config`、`set_device_nickname`、`set_output_nickname`、`set_device_controller`、`set_device_conflict_warning_ignored`、`update_device_settings`、`set_output_leds_count`、`update_output`、`set_output_segments` |
| LED 锁 | `lock_leds`、`unlock_leds`、`set_leds`、`get_led_locks` |
| 灯效与资源 | `get_effects`、`get_effect_params`、`get_displays`、`get_audio_devices`、`get_media_session`、`get_current_media` |
| 关联/全局控制 | `get_linked_control`、`set_linked_control`、`set_all_devices_power` |
| 布局与编辑预览 | `flip_scope_layout`、`begin_led_edit_preview`、`update_led_edit_preview`、`keepalive_led_edit_preview`、`end_led_edit_preview` |
| Scope 状态 | `get_scope_screen_state`、`get_scope_audio_device_state`、`get_scope_audio_device_index`、`get_scope_audio_processing_settings`、`set_scope_screen_index`、`set_scope_screen_region`、`set_scope_audio_device_index`、`set_scope_audio_processing_settings`、`reset_scope_audio_processing_settings` |
| Scope 控制 | `set_scope_effect`、`set_effect`、`update_scope_effect_params`、`update_effect_params`、`reset_scope_effect_params`、`set_scope_mode_paused`、`set_scope_power`、`set_scope_brightness`、`set_brightness` |
| TCP | `tcp_connect`、`net.tcp.connect`、`tcp_write`、`tcp_send`、`net.tcp.write`、`tcp_write_all`、`net.tcp.write_all`、`tcp_read`、`tcp_recv`、`net.tcp.read`、`tcp_read_exact`、`tcp_recv_exact`、`net.tcp.read_exact`、`tcp_close`、`net.tcp.close` |
| HTTP | `http_request`、`net.http.request`、`http_open`、`http_stream`、`net.http.stream`、`http_read`、`net.http.read`、`http_close`、`net.http.close` |
| 进程 | `spawn_process`、`is_process_alive`、`kill_process` |
| HID | `hid_enumerate`、`hid_open`、`hid_open_path`、`hid_write`、`hid_read`、`hid_send_feature_report`、`hid_get_feature_report`、`hid_close` |

这些新增能力未改变 ABI 结构体和回调签名，全部通过现有 `SkydimoHostApiV1.call_json` 暴露。以下方法级表格是权威说明：部分方法同时接受 snake_case 与 camelCase 字段，较早的兼容方法仍要求 snake_case 字段名。

会修改插件文件的管理调用带有运行时保护。`import_plugin_package` 和 `install_plugins` 在简单模式下不可用。`install_plugins`、`delete_plugin`、`reset_plugin` 与 `refresh_plugins` 会在插件启动状态仍为 `pending` 或 `running` 时失败。启用状态调用（`set_controller_plugins_enabled`、`set_effect_plugins_enabled`、`set_extension_plugins_enabled`）会立即更新启用表，不受启动状态保护。

### Extension 权限

| 能力 | 所需权限 |
|------|----------|
| `system` / `system.info` | `system:info` |
| 媒体会话方法 | `media:session` |
| TCP 方法 | `network:tcp` 或 `network` |
| HTTP 方法 | `network:http` 或 `network` |
| 进程方法 | `process` |
| HID 方法 | `hardware:hid` |
| 系统进程状态 | `system:process` |
| 系统窗口焦点状态 | `system:window-focus` |

### Extension call_json 请求与响应形态

Scope 方法可以在顶层或 `scope` 字段中传入 scope：

```json
{
  "scope": {
    "port": "device-port",
    "output_id": "out1",
    "segment_id": "segment-a"
  }
}
```

`segment_id` 必须搭配 `output_id`。`output_id` 与 `segment_id` 对设备级操作是可选的。

通用响应约定：

- `null` 表示方法成功且无返回载荷。
- 创建句柄的方法返回 `{ "handle": number }`。
- 返回字节的方法使用 [Byte JSON 形态](#byte-json-shape)：`{ "bytes": [...], "base64": "...", "len": n }`。
- `request_ptr == NULL` 或空请求会被当作 JSON `null`。

#### 插件、路径与 Core 配置

| 方法 | 请求 | 响应 | 说明 |
|------|------|------|------|
| `plugin.info` | `null` | 插件元数据对象 | 包含 `id`、`name`、`version`、`publisher`、`language`、`permissions`、`type`，以及可选 `abi`、`description`、`page_path`、`page_url`。 |
| `data_dir`、`plugin.data_dir` | `null` | string | 确保并返回当前插件的运行时数据目录。 |
| `resource_dir`、`plugin.resource_dir` | `null` | string | 返回插件资源目录。 |
| `get_core_config_dir` | `null` | string | 不会创建目录。 |
| `open_core_config_dir` | `null` | string | 确保目录存在；Native-C host 不会打开系统文件管理器。 |
| `get_plugin_dir` | `null` | string | 返回托管插件总目录。 |
| `open_plugin_dir` | `{ "pluginId": "id" }` 或 `{ "plugin_id": "id" }` | string | `pluginId` 可省略；省略时返回插件总目录。会确保返回目录存在。 |
| `open_plugin_data_dir` | `{ "pluginId": "id" }` 或 `{ "plugin_id": "id" }` | string | 确保并返回目标插件的运行时数据目录。 |
| `get_plugins` | `null` | `PluginsResponse` | 与 WebSocket `get_plugins` 相同。 |
| `import_plugin_package` | `{ "fileName": "x.skyplugin", "data": "BASE64" }` | `{ "sessionId": "...", "sourceName": "...", "plugins": [...] }` | 也接受 `file_name`、`data_base64`、`dataBase64`。简单模式下不可用。 |
| `install_plugins` | `{ "sessionId": "...", "pluginIds": ["id"] }` | array | 也接受 `session_id`、`plugin_ids`。受启动状态保护，简单模式下不可用。 |
| `cancel_plugin_import` | `{ "sessionId": "..." }` | `null` | 也接受 `session_id`。 |
| `delete_plugin` | `{ "pluginId": "id", "deleteData": true }` | `null` | 也接受 `plugin_id`、`delete_data`。受启动状态保护。 |
| `reset_plugin` | `{ "pluginId": "id", "resetData": false }` | `null` | 也接受 `plugin_id`、`reset_data`。受启动状态保护。 |
| `refresh_plugins` | `null` | `null` | 受启动状态保护；会在重载注册表前后停止并重启已启用扩展。 |
| `set_controller_plugins_enabled` | `{ "pluginIds": ["id"], "enabled": false }` | `null` | 也接受 `plugin_ids`；`enabled` 默认 `true`。禁用会断开匹配设备，启用会触发发现。 |
| `set_effect_plugins_enabled` | `{ "pluginIds": ["id"], "enabled": true }` | `null` | 发送 `plugins-changed`。 |
| `set_extension_plugins_enabled` | `{ "pluginIds": ["id"], "enabled": false }` | `null` | 停止被禁用扩展，并启动新启用扩展。 |
| `get_startup_status` | `null` | `CoreStartupStatusInfo` | 参见 [数据类型](../../api/data-types#corestartupstatusinfo)。 |
| `get_shortcuts_config` | `null` | `ShortcutConfig` | 返回当前全局快捷键配置。 |
| `set_shortcuts_config` | `ShortcutConfig` 或 `{ "config": ShortcutConfig }` | `ShortcutConfig` | 返回规范化后的持久化配置。 |
| `set_locale` | `{ "locale": "zh-CN" }` | `null` | 发送 `locale-changed`。 |
| `get_capture_config` | `null` | `{ "maxPixels": n, "fps": n, "method": "...", "samplingLocked": bool }` | 全局屏幕捕获配置。 |
| `get_capture_max_pixels` | `null` | number | `0` 表示不限制像素预算。 |
| `set_capture_max_pixels` | `{ "maxPixels": 921600 }` | 捕获配置 | 也接受 `max_pixels`。简单模式锁定捕获采样时失败。 |
| `get_capture_fps` | `null` | number | 当前捕获帧率。 |
| `set_capture_fps` | `{ "fps": 30 }` | 捕获配置 | 最小为 `1`；简单模式锁定捕获采样时失败。 |
| `get_capture_method` | `null` | string | 当前捕获后端。 |
| `set_capture_method` | `{ "method": "dxgi" }` | 捕获配置 | 可用值取决于平台。 |

#### 系统、页面与通知

| 方法 | 请求 | 响应 | 说明 |
|------|------|------|------|
| `system`、`system.info`、`get_system_info` | `null` | 系统信息对象 | 需要 `system:info`。 |
| `list_system_state_topics` | `null` | array | 只返回当前插件权限允许的 topic。 |
| `get_system_state` | `{ "topic": "process" }` | object | 需要对应 topic 权限，例如 `system:process` 或 `system:window-focus`。 |
| `page_emit` | 任意 JSON 值 | `null` | 以 `ext-page-message:<extension_id>` 发送给当前扩展页面。 |
| `ext_page_send` | `{ "extId": "other_extension", "data": {...} }` | `null` | 也接受 `ext_id`；`data` 默认 `null`。 |
| `notify` | `{ "title": ..., "description": ..., "level": "info" }` | `null` | `description` 默认空字符串；`level` 默认 `info`。文本字段支持本地化通知对象。 |
| `notify_persistent` | `{ "id": "key", "title": ..., "description": ..., "level": "warning" }` | `null` | 若同 ID 持久通知已存在则更新。 |
| `dismiss_persistent` | `{ "id": "key" }` | `null` | 关闭持久通知。 |

#### 设备、输出与 LED

`register_device` 接受：

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

| 方法 | 请求 | 响应 | 说明 |
|------|------|------|------|
| `register_device` | 设备定义对象 | string | 返回注册的 `controller_port`。 |
| `remove_extension_device` | `{ "port": "device-port" }` | `null` | 也接受 `controller_port`。 |
| `scan_devices` | `null` | `null` | 触发手动发现。 |
| `get_devices` | `null` | array | 与 WebSocket API 使用的设备列表形态一致。 |
| `get_device_info`、`get_device` | `{ "port": "device-port" }` | 设备对象 | 设备不存在时失败。 |
| `get_device_config` | `{ "port": "device-port" }` | `{ "deviceId": "...", "port": "...", "config": {...} }` | 读取当前连接设备的持久化配置。 |
| `set_device_nickname` | `{ "port": "...", "nickname": "Desk" }` | `null` | 省略 `nickname` 或设为 `null` 可清除。 |
| `set_output_nickname` | `{ "port": "...", "outputId": "main", "nickname": "Desk strip" }` | `null` | 也接受 `output_id`。 |
| `set_device_controller` | `{ "port": "...", "controllerId": "skydimo_serial" }` | `null` | 也接受 `controller_id`；省略或设为 `null` 可清除覆盖。 |
| `set_device_conflict_warning_ignored` | `{ "port": "...", "ignored": true }` | `null` | 更新重复/冲突警告忽略状态。 |
| `update_device_settings` | `{ "port": "...", "settings": {...} }` | `null` | `settings` 默认 `{}`。 |
| `set_output_leds_count` | `{ "port": "...", "output_id": "main", "count": 120 }` | `null` | 也接受 `controller_port` 和 `leds_count`；此方法要求 `output_id`。 |
| `update_output` | `{ "port": "...", "output_id": "main", "leds_count": 120, "matrix": {...} }` | `null` | 也接受 `controller_port`；此方法要求 `output_id`。 |
| `set_output_segments` | `{ "port": "...", "outputId": "main", "segments": [...] }` | `null` | 也接受 `output_id`。 |
| `lock_leds` | `{ "port": "...", "output_id": "main", "indices": [0, 1] }` | `{ "locked": n, "rejected": n }` | `indices` 为零基；此方法要求 `output_id`。 |
| `unlock_leds` | `{ "port": "...", "output_id": "main", "indices": [0, 1] }` | `null` | 释放当前扩展拥有的锁。 |
| `set_leds` | `{ "port": "...", "output_id": "main", "colors": [...] }` | `null` | 颜色可为 `{ "index": 0, "r": 255, "g": 0, "b": 0 }` 或 `[r, g, b]`。 |
| `get_led_locks` | `{ "port": "...", "output_id": "main" }` | array/object | 两个字段都可省略；按输出过滤时此方法要求 `output_id`。 |

`set_output_segments` 使用 [数据类型](../../api/data-types#segmentdefinition) 中的 `SegmentDefinition` 形态。Matrix 使用 `{ "width": n, "height": n, "map": [...] }`。

LED 编辑预览方法：

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

`begin_led_edit_preview`、`update_led_edit_preview`、`keepalive_led_edit_preview` 和 `end_led_edit_preview` 使用 `port`、`outputId`/`output_id`、`sessionId`/`session_id`。`update_led_edit_preview` 还接受 `offset` 和 `colors`。Core 会拒绝超过 `65,536` 颗 LED 的 `offset` 或预览分片。

#### 灯效、资源与 Scope 控制

| 方法 | 请求 | 响应 | 说明 |
|------|------|------|------|
| `get_effects` | `null` | array | 灯效元数据，包含本地化 `name`，以及可选 `description`、`group`、`icon`。 |
| `get_effect_params` | `{ "effect_id": "rainbow" }` | array | 也接受 `id`。 |
| `get_displays` | `null` | array | 屏幕/显示器列表。 |
| `get_audio_devices` | `null` | array | 音频捕获设备列表。 |
| `get_media_session`、`get_current_media` | `{ "max_edge": 256 }` | 媒体会话对象或 `null` | 需要 `media:session`；`max_edge` 可选且使用 snake_case。 |
| `get_linked_control` | `null` | `{ "enabled": bool, "state": {...} }` | 返回全局关联控制状态。 |
| `set_linked_control` | `{ "enabled": true, "source": { "port": "...", "outputId": "main" } }` | 关联控制对象 | 也接受 `source_scope`；source 字段接受 snake_case/camelCase。 |
| `set_all_devices_power` | `{ "is_off": true }` | `{ "affected_ports": [...] }` | 也接受 `off`。 |
| `get_scope_screen_state` | scope 请求 | object | Scope 可位于顶层或 `scope` 字段内。 |
| `get_scope_audio_device_state`、`get_scope_audio_device_index` | scope 请求 | object | 返回 `selected_index`、`effective_index` 和 `effective_from`。 |
| `get_scope_audio_processing_settings` | scope 请求 | object | 返回选中/生效的音频预处理设置。 |
| `set_scope_screen_index` | scope 请求加 `screenIndex` 或 `screen_index` | `null` | 省略或传 `null` 表示重置。关联控制会更新共享状态。 |
| `set_scope_screen_region` | scope 请求加 `region` | `null` | `region` 为 `{ "x": n, "y": n, "width": n, "height": n }`。 |
| `set_scope_audio_device_index` | scope 请求加 `audioDeviceIndex` 或 `audio_device_index` | `null` | 省略或传 `null` 表示重置。 |
| `set_scope_audio_processing_settings` | scope 请求加 `settings` | `null` | 简单模式锁定音频预处理时失败。 |
| `reset_scope_audio_processing_settings` | scope 请求 | `null` | 重置为默认值；简单模式锁定音频预处理时失败。 |
| `flip_scope_layout` | scope 请求加 `{ "axis": "horizontal" }` | `null` | `axis` 为 `horizontal` 或 `vertical`。 |
| `set_scope_effect`、`set_effect` | scope 请求加 `effectId`/`effect_id`/`effect`，可选 `params`，可选过渡标志 | `null` | 省略 effect 字段表示清除灯效。 |
| `update_scope_effect_params`、`update_effect_params` | scope 请求加 `{ "params": {...} }` | `null` | 只更新当前灯效参数。 |
| `reset_scope_effect_params` | scope 请求 | `null` | 将参数重置为默认值。 |
| `set_scope_mode_paused` | scope 请求加 `{ "paused": true }` | `null` | 关联控制会更新共享暂停状态。 |
| `set_scope_power` | scope 请求加 `{ "is_off": true }` | `null` | 也接受 `off` 和过渡标志。 |
| `set_scope_brightness`、`set_brightness` | scope 请求加 `{ "brightness": 80 }` | `null` | 亮度会被限制到 `0..100`。 |

过渡标志可放在顶层或 `options` 内：`skip_transition`、`skipTransition`、`no_transition` 或 `immediate`。

音频预处理使用 camelCase JSON：

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

`averageMode` 可为 `binning` 或 `low_pass`；`windowMode` 可为 `none`、`hann`、`hamming` 或 `blackman`。

#### 网络、进程与 HID

TCP 方法需要 `network:tcp` 或 `network`：

| 方法 | 请求 | 响应 |
|------|------|------|
| `tcp_connect`、`net.tcp.connect` | `{ "host": "127.0.0.1", "port": 1234, "connectTimeoutMs": 5000, "readTimeoutMs": 1000, "writeTimeoutMs": 1000, "noDelay": true }` | `{ "handle": n }` |
| `tcp_write`、`tcp_send`、`net.tcp.write` | `{ "handle": n, "data": bytes, "timeoutMs": 1000 }` | `{ "written": n }` |
| `tcp_write_all`、`net.tcp.write_all` | `{ "handle": n, "data": bytes, "timeoutMs": 1000 }` | `{ "written": n }` |
| `tcp_read`、`tcp_recv`、`net.tcp.read` | `{ "handle": n, "max_len": 4096, "timeoutMs": 1000 }` | 字节响应 |
| `tcp_read_exact`、`tcp_recv_exact`、`net.tcp.read_exact` | `{ "handle": n, "len": 4, "timeoutMs": 1000 }` | 字节响应 |
| `tcp_close`、`net.tcp.close` | `{ "handle": n }` | `null` |

HTTP 方法需要 `network:http` 或 `network`。请求选项接受 `method`、`url`、`headers`、`body`、`json`、`timeoutMs`/`timeout_ms`、`connectTimeoutMs`/`connect_timeout_ms`、`maxResponseBytes`/`max_response_bytes`、`followRedirects`/`follow_redirects`、`maxRedirects`/`max_redirects`。`body` 与 `json` 互斥。

| 方法 | 请求 | 响应 |
|------|------|------|
| `http_request`、`net.http.request` | HTTP 请求选项 | `{ "ok": bool, "status": n, "url": "...", "headers": {...}, "body": [bytes], "body_base64": "..." }` |
| `http_open`、`http_stream`、`net.http.stream` | HTTP 请求选项 | `{ "handle": n }` |
| `http_read`、`net.http.read` | `{ "handle": n, "timeoutMs": 5000 }` | `null`、headers 事件、字节 chunk 事件、done 事件或 error 事件 |
| `http_close`、`net.http.close` | `{ "handle": n }` | `null` |

HTTP stream 事件：

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

进程方法需要 `process`：

| 方法 | 请求 | 响应 |
|------|------|------|
| `spawn_process` | `{ "executable": "tool", "args": ["--flag"], "hidden": true, "working_dir": "C:/..." }` | `{ "handle": n }` |
| `is_process_alive` | `{ "handle": n }` | `{ "alive": bool }` |
| `kill_process` | `{ "handle": n }` | `null` |

`spawn_process` 也接受 `path` 代替 `executable`，接受 `cwd` 代替 `working_dir`。

HID 方法需要 `hardware:hid`：

| 方法 | 请求 | 响应 |
|------|------|------|
| `hid_enumerate` | `{ "vendorId": 0x1532, "productId": 0x0084 }` | array |
| `hid_open` | `{ "vendorId": 0x1532, "productId": 0x0084, "serial": "..." }` | `{ "handle": n }` |
| `hid_open_path` | `{ "path": "..." }` | `{ "handle": n }` |
| `hid_write` | `{ "handle": n, "data": bytes }` | `{ "written": n }` |
| `hid_read` | `{ "handle": n, "len": 64, "timeoutMs": 1000 }` | 字节响应 |
| `hid_send_feature_report` | `{ "handle": n, "data": bytes }` | `{ "written": n }` |
| `hid_get_feature_report` | `{ "handle": n, "len": 64, "reportId": 6 }` | 字节响应 |
| `hid_close` | `{ "handle": n }` | `null` |

HID vendor/product 字段也接受 `vid`/`pid`、`vendor_id`/`product_id`、`vendorId`/`productId`。枚举到的 HID 行使用 `vendor_id`、`product_id`、`serial_number`、`manufacturer`、`product`、`interface_number`、`usage`、`usage_page`。

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

## 安全规则

- 将每个 ABI 表的 `size` 字段设为 SDK 结构体大小。
- 写入 `out_api` 前先校验 `requested_abi_version`。
- 字符串或切片需要跨回调保存时必须复制。
- 除非 SDK 明确说明，否则 host 回调应在 Core 调用插件的线程内使用。
- 不要阻塞高频回调，例如 effect `tick` 或 controller `update`。
- 将 `call_json` 视为控制路径，不要用它承载高频大块数据。
- 失败时返回负状态码，并通过 `host->log` 记录有用上下文。
