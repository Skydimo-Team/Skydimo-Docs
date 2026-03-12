---
sidebar_position: 1
---

# WebSocket API 概览

Skydimo Core 通过 WebSocket 暴露 **JSON-RPC 2.0** API，提供对灯光系统的完整程序化控制。

## 连接

### 获取连接信息

Core 启动时，会向 stdout 输出两个值：

```
CORE_PORT=<port>
CORE_AUTH=<secret>
```

连接地址为 `ws://127.0.0.1:<port>`。

### 认证

连接后的**第一条消息**必须为 `auth` 调用：

```json
{
  "jsonrpc": "2.0",
  "method": "auth",
  "params": { "secret": "<CORE_AUTH 的值>" },
  "id": 1
}
```

认证成功前，所有后续命令都将被拒绝。

### 超时

| 操作 | 超时时间 |
|------|---------|
| RPC 调用 | 30 秒 |
| 认证 | 8 秒 |
| 重连间隔 | 250ms ~ 2s（指数退避） |

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
// 1. 认证
→ {"jsonrpc":"2.0","method":"auth","params":{"secret":"abc123"},"id":1}
← {"jsonrpc":"2.0","result":true,"id":1}

// 2. 列出设备
→ {"jsonrpc":"2.0","method":"get_devices","id":2}
← {"jsonrpc":"2.0","result":[{"port":"COM3","manufacturer":"Skydimo",...}],"id":2}

// 3. 设置灯效
→ {"jsonrpc":"2.0","method":"set_effect","params":{"port":"COM3","effectId":"rainbow"},"id":3}
← {"jsonrpc":"2.0","result":null,"id":3}

// 4. 接收事件
← {"jsonrpc":"2.0","method":"event","params":{"event":"devices-changed","data":{...}}}
```
