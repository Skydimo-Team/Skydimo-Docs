---
sidebar_position: 1
---

# WebSocket API 概览

Skydimo Core 通过 WebSocket 暴露 **JSON-RPC 2.0** API，提供对灯光系统的完整程序化控制。

:::note 自 3.0.0-dev.3 起
从 `3.0.0-dev.3` 开始，WebSocket 基于密钥的鉴权已被移除。Core 现在仅绑定到本机 `127.0.0.1`，连接建立后即可直接发送请求。
:::

## 连接

### 获取连接信息

Core 启动时，会向 stdout 输出所选端口：

```
CORE_PORT=<port>
```

连接地址为 `ws://127.0.0.1:<port>`。

在浏览器模式下，必须通过 `?ws=ws://127.0.0.1:<port>` 打开 UI，显式指向正在运行的 Core 实例。

Core 仅绑定到本机 loopback 接口，因此该 API 只能被同一台机器上的客户端访问。

### 超时

| 操作 | 超时时间 |
|------|---------|
| RPC 调用 | 30 秒 |
| 重连间隔 | 2 秒 |

## 请求格式

标准 JSON-RPC 2.0 请求：

```json
{
  "jsonrpc": "2.0",
  "method": "<命令名称>",
  "params": { ... },
  "id": <number>
}
```

## 响应格式

### 成功

```json
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": <number>
}
```

### 错误

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "错误描述"
  },
  "id": <number>
}
```

## 事件通知

服务端以 JSON-RPC 通知（无 `id` 字段）的形式推送事件：

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

完整事件列表请参阅[事件](events)。

## 命令分类

| 分类 | 命令 | 说明 |
|------|------|------|
| [设备](commands/devices) | `get_devices`, `get_device`, `scan_devices`, ... | 设备枚举与管理 |
| [灯效](commands/effects) | `get_effects`, `set_effect`, `set_brightness`, ... | 灯效控制与参数 |
| [屏幕与音频](commands/screen-audio) | `get_displays`, `get_audio_devices`, ... | 媒体捕获配置 |
| [插件](commands/plugins) | `get_plugins`, `set_controller_plugins_enabled`, ... | 插件管理 |
| [系统](commands/system) | `get_system_info`, 捕获设置 | 系统信息与全局设置 |

## 示例会话

```json
// 1. 列出设备
→ {"jsonrpc":"2.0","method":"get_devices","id":1}
← {"jsonrpc":"2.0","result":[{"port":"COM3","manufacturer":"Skydimo",...}],"id":1}

// 2. 设置灯效
→ {"jsonrpc":"2.0","method":"set_effect","params":{"port":"COM3","effectId":"rainbow"},"id":2}
← {"jsonrpc":"2.0","result":null,"id":2}

// 3. 接收事件
← {"jsonrpc":"2.0","method":"event","params":{"event":"devices-changed","data":{...}}}
```
