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
  "data": {
    "devices": [ ... ]
  }
}
```

**触发时机**：设备连接/断开、昵称变更、灯效变更、亮度变更、区段更新、LED 锁状态变化。

:::tip
这是保持 UI 同步的核心事件。收到后，应刷新完整的设备列表。
:::

---

### device-led-update

高频事件（约 30 fps），包含某设备输出端口的当前 LED 颜色。

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

`colors` 数组包含每个 LED 的 RGB 三元组（R, G, B, R, G, B, ...）。

:::warning 性能提示
此事件高频触发。请使用 Web Worker 或对渲染进行节流，避免阻塞 UI 线程。
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

## 订阅事件

事件会自动推送到所有已通过认证的 WebSocket 连接，无需显式订阅。
