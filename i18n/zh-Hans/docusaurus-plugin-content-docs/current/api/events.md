---
sidebar_position: 7
---

# 事件

Skydimo 以 JSON-RPC 2.0 通知的形式广播实时事件。事件由服务端主动推送，无需请求 —— 它们没有 `id` 字段。

## 事件格式

```json
{
  "jsonrpc": "2.0",
  "method": "event",
  "params": {
    "event": "<事件名称>",
    "data": { ... }
  }
}
```

## 事件类型

### devices-changed

当设备列表或任何设备配置发生变化时触发（设备连接/断开、设置更新等）。

```json
{
  "event": "devices-changed",
  "data": [ ... ]
}
```

**触发时机**：设备连接/断开、昵称变更、灯效变更、亮度变更、区段更新、LED 锁状态变化。

:::tip
这是保持 UI 同步的核心事件。收到后，应刷新完整的设备列表。
:::

---

### device-diagnostics-changed

当 Core 的可恢复硬件发现诊断发生变化时触发。载荷与 [`get_device_diagnostics`](commands/runtime-diagnostics#get_device_diagnostics) 返回的版本化报告相同。

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

`revision` 仅在诊断列表变化时递增。最后一个问题被清除时也会触发此事件，此时 `diagnostics` 为空数组。如果查询响应的修订号低于客户端已处理的最新事件，可将该旧响应丢弃。

---

### device-runtime-status-changed

当设备运行器因控制器更新失败、运行器 panic 或意外退出而终止时触发。当前实现只发送终止故障，不发送常规的启动或运行状态变化。

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

当前错误代码包括 `controller_update_failed`、`runner_panicked` 和 `runner_exited_unexpectedly`。Core 还会把故障写入设备的 `runtime_stats`，并发送一条错误 `notification`。

---

### device-led-update

高频预览事件，包含设备按物理顺序展平后的当前 LED 颜色。发送速率不是稳定的 API 保证，它取决于活动运行器和调度；客户端必须能处理突发、丢失中间帧和暂时停顿。

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

`rgb` 是 `count` 个紧密排列 RGB 三元组（R, G, B, R, G, B, ...）的标准 Base64 编码。最多解码 `min(count, 解码字节数 / 3)` 个完整颜色。

:::warning 性能提示
应合并或节流 UI 更新，而不是渲染每个收到的帧。当前 Advanced UI 在主线程解码载荷，并将 React 状态更新节流到约 33 ms；该数据流没有经过 Web Worker。
:::

---

### notification

来自 Core 或插件的 Toast 通知。

```json
{
  "event": "notification",
  "data": {
    "id": "notif_123",
    "title": "设备已连接",
    "description": "在 COM3 发现 Skydimo LED 控制器",
    "level": "info",
    "persistent": false
  }
}
```

**级别**：`"info"`、`"warn"`、`"error"`

**持久通知就地更新特性**：如果 `persistent` 为 `true` 且 UI 收到了带有**完全相同** `id` 的新 `notification` 事件，则不会弹出新的 Toast，而是就地更新已存在的 Toast 的 `title` 和 `description`。这对于显示进度或实时状态更新（例如 `扫描中... 10/100`）非常有用。

---

### notification-dismiss

关闭持久通知。

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

当扩展插件锁定或解锁 LED 时触发。

```json
{
  "event": "led-locks-changed",
  "data": { ... }
}
```

通过 [`get_led_locks`](commands/devices#get_led_locks) 命令查询完整的锁定状态。

---

### plugins-changed

当插件元数据或启用状态变化时触发。

```json
{
  "event": "plugins-changed",
  "data": null
}
```

常见触发来源包括：安装插件包、删除/重置/刷新插件、切换灯效/控制器/扩展插件启用状态，以及启动时插件清单刷新。

客户端收到后应重新调用 [`get_plugins`](commands/plugins#get_plugins)。

---

### locale-changed

当 Core 当前语言变化时触发。

```json
{
  "event": "locale-changed",
  "data": {
    "locale": "zh-CN"
  }
}
```


### startup-status-changed

当 Core 启动任务进度变化时触发。

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

`state` 可能是 `pending`、`running`、`complete` 或 `failed`。

---

### plugin-import-progress

:::caution 已声明但当前未发送
Core 声明了 `plugin-import-progress` 事件名和进度 DTO，但当前没有任何 Core 调用点广播该事件。客户端不得依赖收到它。启动期间应从 `get_startup_status` 或 `startup-status-changed` 读取插件进度。
:::

在 Core 实际实现发送端之前，不应推断其线上载荷协议。

---

### ext-page-message:\{extId\}

当扩展调用 `ext.page_emit(data)` 或 native-c `call_json("page_emit", data)` 时触发。事件名称包含扩展插件 ID，便于对应扩展页面只监听自己的消息。

```json
{
  "event": "ext-page-message:openrgb",
  "data": { ... }
}
```

反向通信请调用 [`ext_page_send`](commands/plugins#ext_page_send)；Lua 扩展通过 `on_page_message(data)` 回调接收该载荷，native-c 扩展通过 `on_page_message_json` 接收。

---

### system.media.changed

:::info 平台
当前仅由 Windows 媒体会话监听器发送。
:::

当活动媒体会话出现或消失，或曲目元数据、来源应用、封面可用性或封面修订发生变化时触发。

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

事件载荷为完整媒体会话快照；没有活动会话时为 `null`。可选标量字段会序列化为 `null`。`playback_status` 为 `playing`、`paused` 或 `stopped`。`has_artwork` 表示 Core 是否缓存了封面；事件本身不包含封面像素。

扩展需要 `media:session` 权限才能收到对应的 `on_system_media_changed(data)` 回调。

---

### system.media.playback_changed

当 `playback_status` 变化时触发，媒体会话出现或消失时也会触发。载荷为 `system.media.changed` 一节描述的完整媒体会话快照；会话消失时为 `null`。

扩展需要 `media:session` 权限才能收到 `on_system_media_playback_changed(data)`。

---

### system.media.timeline_changed

当时间线中的任何字段变化时触发，包括位置、可跳转范围、时长或最近更新时间；媒体会话出现或消失时也会触发。载荷为同样的完整媒体会话快照，或 `null`。

扩展需要 `media:session` 权限才能收到 `on_system_media_timeline_changed(data)`。

---

### system.process.changed

:::info 版本
自 **3.0.0-dev.3** 起支持。目前仅支持 Windows。
:::

当运行中的应用程序进程列表发生变化（应用启动或停止）时触发。拥有 `system:process` 权限的扩展插件通过 `on_system_state_changed("process", data)` 回调接收此事件。

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

| 字段 | 类型 | 说明 |
|------|------|------|
| `supported` | boolean | 当前平台是否支持进程监控 |
| `apps` | array | 当前运行中的应用程序完整列表 |
| `changes` | array | 本次更新中实例数发生变化的应用程序 |

---

### system.focus.changed

:::info 版本
自 **3.0.0-dev.3** 起支持。目前仅支持 Windows。
:::

当前台窗口焦点发生变化（用户切换到不同窗口，或当前窗口标题改变）时触发。拥有 `system:window-focus` 权限的扩展插件通过 `on_system_state_changed("window_focus", data)` 回调接收此事件。

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

| 字段 | 类型 | 说明 |
|------|------|------|
| `supported` | boolean | 当前平台是否支持窗口焦点监控 |
| `reason` | string | `"snapshot"`、`"foreground_changed"` 或 `"title_changed"` |
| `current` | object? | 当前聚焦窗口（`app_name`、`window_title`），若无则为 `null` |
| `previous` | object? | 之前聚焦的窗口，若无则为 `null` |

## 订阅事件

从 `3.0.0-dev.3` 开始，事件会自动推送到所有已连接的本机 WebSocket 客户端，无需显式订阅。
