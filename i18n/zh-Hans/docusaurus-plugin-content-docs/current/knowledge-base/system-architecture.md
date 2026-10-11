---
sidebar_position: 2
description: 进程模型、启动顺序、IPC 边界、运行时配置档案和关闭行为。
---

# 系统架构

## 进程模型

```text
可选的自动启动器
        │
        ▼
Tauri 壳（Advanced 或 Simple）── 本地 invoke ── 操作系统集成
        │
        │ WebSocket JSON-RPC 2.0
        ▼
Core 进程
├─ 主线程：tao 事件循环 + Core 托盘
└─ core-runtime 线程：Tokio 多线程运行时
   ├─ 位于 127.0.0.1:<dynamic> 的 WebSocket 服务器
   ├─ 位于 127.0.0.1:38967 的控制服务器
   ├─ LightingManager 与设备发现
   ├─ 插件目录与 ExtensionManager
   ├─ 媒体/系统状态监视器
   ├─ 会员认证与遥测
   └─ 逐设备 Runner 线程
```

Core 可以在没有 UI 的情况下运行。关闭壳进程并不会必然终止 Core。

## 启动顺序

### Core

1. 解析 `--app-id`、`--simple` 和诊断标志。
2. 解析共享配置目录和日志目录。
3. 尝试向已有 Core 发起带认证的 ping。
4. 获取 `127.0.0.1:38967` 上的全局控制监听器。
5. 准备共享路径和配置档案专属路径。
6. 启动 `core-runtime` 线程和 Tokio 运行时。
7. 创建 manager、broadcaster、各类 watcher、认证服务和 extension manager。
8. 将 WebSocket 服务器绑定到 `127.0.0.1:0`。
9. 输出 `CORE_PORT=<port>`。
10. 在后台初始化插件、恢复关联控制、执行首次设备发现并启动扩展。
11. 在主线程运行托盘/事件循环。

WebSocket 会有意在后台初始化完成前开放。`get_startup_status` 和 `startup-status-changed` 用于提供各子系统的就绪状态。

如果兼容的 Core 已占用控制 socket，第二个 Core 会输出现有端口并退出。它自身不会发送 `OpenUi`；重新打开 UI 由托盘或壳层路径处理。

### Tauri 壳

壳首先尝试完成认证，并连接到已有且配置档案匹配的 Core。否则，它会启动同目录下的 `skydimo-core` 可执行文件，解析其公布的端口，并验证控制 socket 报告的端口和运行时配置档案一致。

即使 WebSocket 端口由 Core 通过 `--ws-port` 提供，也必须经过验证。这样可以防止 Advanced 前端意外连接到 Simple Core，反之亦然。

## 三个本地通信边界

| 边界 | 用途 | 范围 |
|---|---|---|
| Core 控制 TCP | 单实例、ping、打开 UI、关闭 | 仅限本机回环 |
| Core WebSocket（动态端口） | 设备、灯效、插件、配置 RPC 和事件 | 仅限本机回环 |
| Tauri invoke | 窗口、自动启动、本地预设、反馈、扩展页面托管 | 进程内壳层边界 |

前端在向应用开放连接前，会先调用 `get_runtime_profile` 作为首个 WebSocket RPC。这是一项兼容性检查，并非 WebSocket 认证。

## JSON-RPC 行为

请求和响应使用类似 JSON-RPC 的信封：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "get_devices",
  "params": {}
}
```

当前分发器的具体行为：

- 解析错误：`-32700`；
- 缺少方法：`-32600`；
- 未知方法以及大多数业务失败：`-1`；
- 不会严格校验 `jsonrpc`；
- 不含 `id` 的请求仍会收到 `id: null` 的响应。

事件使用：

```json
{
  "jsonrpc": "2.0",
  "method": "event",
  "params": {
    "event": "devices-changed",
    "data": []
  }
}
```

事件投递队列有容量上限。速度较慢的客户端可能丢失较早的广播消息，因此必须重新查询快照；事件是失效通知，而非持久日志。

## 运行时配置档案与路径

Core 会创建一个共享根目录和两个可变的配置档案根目录：

```text
<config-root>/
├─ app.json
├─ control.token
├─ 认证/遥测状态
└─ profiles/
   ├─ profile-split-v1.json
   ├─ advanced/
   └─ simple/
```

一次性配置档案迁移会复制旧状态，但不会删除或移动旧条目；迁移会校验指纹，并仅在配置档案结构可靠落盘后写入完成标记。

## Core 模块

| 模块 | 职责 |
|---|---|
| `interface/` | Controller/Effect 契约和面向硬件的共享类型 |
| `manager/` | 设备、Scope 状态、持久化、设备发现、Runner、锁和预览 |
| `plugin/` | 插件目录、导入/管理操作、Lua 与 native-C 运行时 |
| `resource/` | 屏幕、音频、媒体、系统状态、设备发现和内置资源 |
| `server/` | WebSocket 服务器、分发器、插件 RPC 和事件广播器 |
| `runtime/` | Core 控制 socket 和 UI 启动器 |
| `shortcut/` | 全局快捷键状态与执行 |
| `telemetry/` | 同意状态、诊断、缓冲、上传和异常报告 |
| `tray/` | Core 所有的托盘和 tao 事件循环 |
| `api/` | 公共接口使用的共享序列化 DTO |

框架层面的依赖边界仍符合设计目标：Core 不依赖 Tauri；`interface` 不依赖 manager、server 或 plugin；`resource` 不依赖 server。除此之外，内部模块关系比旧版简化图所表达的更加紧密。

## 关闭

Core 可因 Ctrl+C、带认证的控制 socket 请求或托盘操作而关闭。Core 会请求所有正在运行的 UI 实例退出、刷新遥测数据、停止扩展及其资源、中止控制任务，并在 manager 释放时停止设备 Runner。

选择**关闭到托盘**时，Tauri UI 会退出而 Core 保持运行。选择**退出应用程序**时，壳会请求 Core 关闭；只有优雅关闭失败时，才回退为终止由该壳启动的子进程。
