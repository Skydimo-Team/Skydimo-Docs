---
sidebar_position: 1
slug: /intro
---

# 欢迎使用 Skydimo

Skydimo 是一款跨平台 RGB 灯光应用。独立运行的 Core 负责设备状态、灯效、插件和配置持久化；React UI 通过本机 WebSocket JSON-RPC 与 Core 通信。

## 选择阅读路径

| 我想要…… | 从这里开始 |
|---|---|
| 安装并使用应用 | [用户手册](./user-guide/overview.md) |
| 了解项目与系统架构 | [项目知识库](./knowledge-base/overview.md) |
| 对接本机 Core | [WebSocket API](./api/websocket-overview.md) |
| 开发设备驱动、灯效或扩展 | [插件开发](./plugins/overview.md) |

## 架构速览

```text
Core 进程
├─ LightingManager 与渲染 Runner
├─ Lua 和 native-C 插件运行时
├─ 设备发现与平台资源
├─ 本机 WebSocket JSON-RPC 服务
└─ 系统托盘与单实例控制
               │
               │ JSON-RPC 请求与事件
               ▼
React UI（Tauri 桌面壳或浏览器）
```

Core 是系统的唯一真实来源。前端从 Core 动态获取设备、灯效、参数和能力，而不是硬编码具体产品行为。

## 文档覆盖范围

这套文档与项目源代码一同维护，包含：

- 桌面端和浏览器端的日常使用流程；
- Advanced 与 Simple 两种运行配置的差异；
- 配置继承与灯光渲染管线；
- 前端、Core、插件系统和仓库架构；
- JSON-RPC 命令、事件、数据类型及插件 Host API。

如果文档与当前行为不一致，请以当前源代码为准，并在修改代码时同步更新对应文档。
