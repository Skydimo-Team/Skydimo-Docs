---
sidebar_position: 1
---

# 架构

Skydimo 采用 **Core + UI 分离**架构，所有业务逻辑都位于独立的 Rust 可执行文件中，UI 则是一个纯展示性的 React 前端。

## 设计原则

1. **后端权威 (Backend Authority)** —— Rust Core 是设备状态、灯效能力和所有业务逻辑的唯一真实来源。
2. **前端无关性 (Frontend Agnosticism)** —— UI 是一个动态渲染器，支持新 Core 功能只需极少改动。Core 可在无 UI 的情况下独立运行（headless 模式）。
3. **开闭原则 (Open/Closed Principle)** —— 新的灯效、控制器和扩展可通过 Lua 插件添加，无需修改核心逻辑。

## 进程模型

```
┌─────────────────────────────────┐
│  Core 进程 (core.exe)           │
│  ├─ 主线程: tao 事件循环         │
│  │   + 系统托盘                  │
│  └─ Tokio 运行时:               │
│     ├─ LightingManager          │
│     ├─ Lua 插件管理器            │
│     ├─ WebSocket 服务器          │
│     └─ 控制 Socket (38967)      │
└──────────┬──────────────────────┘
           │ WebSocket JSON-RPC 2.0
           │ (认证 + 事件)
┌──────────▼──────────────────────┐
│  UI 进程 (Tauri / 浏览器)        │
│  ├─ React SPA                   │
│  └─ Tauri 薄壳（可选）           │
└─────────────────────────────────┘
```

## 单实例控制

Core 在 `127.0.0.1:38967` 监听 TCP，防止多实例运行。当新实例启动时，它会向已有实例发送 `OpenUi` 命令，将 UI 窗口唤至前台。

## 生命周期

1. Core 启动并向 stdout 输出 `CORE_PORT=<port>` 和 `CORE_AUTH=<secret>`。
2. UI 进程读取这些值并通过 WebSocket 建立连接。
3. UI 关闭时，可选择保留 Core 运行（最小化到托盘）或一并退出。

## 核心模块

| 模块 | 路径 | 职责 |
|------|------|------|
| `interface` | `core/src/interface/` | 核心 Trait 定义（Controller、Effect）和共享数据类型 |
| `plugin` | `core/src/plugin/` | Lua 插件加载、生命周期、Host API |
| `resource` | `core/src/resource/` | 内置实现 + 平台资源（音频、屏幕、USB、串口） |
| `manager` | `core/src/manager/` | 中央协调器 —— 设备管理、Runner、配置、需求调度 |
| `api` | `core/src/api/` | DTO 定义（序列化协议） |
| `server` | `core/src/server/` | WebSocket JSON-RPC 2.0 服务器 + 事件广播 |
| `runtime` | `core/src/runtime/` | 单实例 Socket + UI 启动器 |
| `tray` | `core/src/tray/` | 系统托盘（tao + tray-icon） |

## 依赖方向

```
resource/ → interface/
plugin/  → interface/
manager/ → interface/ + resource/ + plugin/
api/     → （仅 DTO）
server/  → manager/ + api/
runtime/ → server/ + manager/
tray/    → runtime/
```

**禁止**：`interface/` 不得依赖 `manager/`、`server/` 或 `plugin/`。

## Scope 配置体系

Skydimo 使用分层 Scope 体系管理配置：

```
Device → Output → Segment
```

每个 Scope 层级可拥有各自的：
- **ModeConfig** —— 灯效选择 + 参数
- **PowerConfig** —— 开关状态
- **亮度** —— 亮度级别
- **屏幕/音频源** —— 显示器和音频设备选择

子 Scope 可继承父 Scope 的配置，也可独立覆盖任意设置。

## 硬件发现

Skydimo 支持多种硬件发现方式：

- **Serial** —— 通过 VID/PID 匹配 USB 串口设备
- **HID** —— 通过 VID/PID 匹配 USB HID 设备
- **mDNS** —— 通过服务发现检测网络设备

各平台 USB 热插拔检测：
- **Windows**：`WM_DEVICECHANGE` 消息
- **macOS**：IOKit 通知
- **Linux**：Netlink socket
