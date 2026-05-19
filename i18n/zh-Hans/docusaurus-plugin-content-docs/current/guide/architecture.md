---
sidebar_position: 1
---

# 架构

Skydimo 采用 **Core + UI 分离**架构，所有业务逻辑都位于独立的原生可执行文件中，UI 则是一个纯展示性的前端。

## 设计原则

1. **后端权威 (Backend Authority)** —— Core 是设备状态、灯效能力和所有业务逻辑的唯一真实来源。
2. **前端无关性 (Frontend Agnosticism)** —— UI 是一个动态渲染器，支持新 Core 功能只需极少改动。Core 可在无 UI 的情况下独立运行（headless 模式）。
3. **开闭原则 (Open/Closed Principle)** —— 新的灯效、控制器和扩展可通过插件运行时添加，无需修改核心逻辑。

## 进程模型

```
┌─────────────────────────────────┐
│  Core 进程 (core.exe)           │
│  ├─ 主线程: 事件循环            │
│  │   + 系统托盘                  │
│  └─ 异步运行时:               │
│     ├─ LightingManager          │
│     ├─ 插件管理器                │
│     │  (Lua + native-c 运行时)   │
│     ├─ WebSocket 服务器          │
│     └─ 控制 Socket (38967)      │
└──────────┬──────────────────────┘
           │ WebSocket JSON-RPC 2.0
           │ (仅本机 + 事件)
┌──────────▼──────────────────────┐
│  UI 进程 (桌面窗口 / 浏览器)    │
│  └─ React SPA                   │
└─────────────────────────────────┘
```

## 单实例控制

Core 在 `127.0.0.1:38967` 监听 TCP，防止多实例运行。当新实例启动时，它会向已有实例发送 `OpenUi` 命令，将 UI 窗口唤至前台。

## 生命周期

1. 从 `3.0.0-dev.3` 开始，Core 无论何时都绑定自动分配的本地 WebSocket 端口，并向 stdout 输出 `CORE_PORT=<port>`。
2. 桌面 UI 读取该值，并通过 `127.0.0.1` 上的 WebSocket 建立连接；浏览器模式则需通过 `?ws=ws://127.0.0.1:<port>` 显式指定正在运行的 Core。
3. UI 关闭时，可选择保留 Core 运行（最小化到托盘）或一并退出。

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

所有支持的平台（Windows、macOS、Linux）均自动处理 USB 热插拔检测。

## 插件运行时分发

Core 会先从 `manifest.json` 解析插件元数据，再根据 `language` 分发到对应运行时：

| 运行时 | 状态 | 用途 |
|--------|------|------|
| `lua` | 已支持 | 沙箱化 Lua 5.4 插件，用于控制器、灯效和扩展 |
| `native-c` | 已支持 | 通过 Skydimo C ABI 加载的进程内原生共享库 |
| `wasm` | 预留 | 未来 WebAssembly 运行时 |
| `abi-stable` | 预留 | 未来 Rust 友好 ABI 实验 |
| `process` | 预留 | 未来进程外插件运行时 |

只有已注册到当前插件类型的运行时会被加载。未支持或预留运行时会被当前注册表忽略。
