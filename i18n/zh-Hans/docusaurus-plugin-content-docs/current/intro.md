---
sidebar_position: 1
slug: /intro
---

# 欢迎使用 Skydimo

**Skydimo** 是一款跨平台 RGB 灯光控制应用程序，提供强大的 **Lua 插件系统**，用于扩展设备支持并创建自定义灯光效果。

## 适用人群

- **终端用户** —— 了解 Skydimo 的功能及使用方式
- **插件开发者** —— 创建自定义灯效、硬件驱动或集成方案
- **第三方集成商** —— 基于 WebSocket API 进行二次开发

## 架构概览

Skydimo 采用 **Core + UI** 分离架构：

```
┌─────────────────────────────────┐
│  Core 进程 (core.exe)           │
│  ├─ LightingManager             │
│  ├─ Lua 插件运行时               │
│  ├─ WebSocket JSON-RPC 服务器   │
│  └─ 系统托盘                     │
└──────────┬──────────────────────┘
           │ WebSocket JSON-RPC 2.0
┌──────────▼──────────────────────┐
│  UI (桌面窗口 / 浏览器)          │
│  └─ React SPA                   │
└─────────────────────────────────┘
```

- **Core** 是独立的原生可执行文件，负责设备管理、灯效引擎、插件运行时和 WebSocket 服务器。
- **UI** 是通过 WebSocket JSON-RPC 2.0 与 Core 通信的 React 前端，可作为桌面应用或在标准浏览器中运行。

## 快速导航

| 主题 | 说明 |
|------|------|
| [架构](guide/architecture) | 详细系统架构说明 |
| [功能特性](guide/features) | 软件能力概览 |
| [WebSocket API](api/websocket-overview) | JSON-RPC 2.0 协议参考 |
| [插件开发](plugins/overview) | 构建你自己的插件 |
