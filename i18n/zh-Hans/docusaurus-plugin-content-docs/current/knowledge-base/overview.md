---
sidebar_position: 1
description: 基于代码介绍 Skydimo 的架构、术语和文档体系。
---

# 项目知识库

本知识库介绍 Skydimo 当前的实际实现，面向维护者、集成方、支持工程师和插件作者。内容依据当前工作源码树整理，而非仅参考历史设计说明。

## Skydimo 是什么

Skydimo 是一套跨平台 RGB 灯光系统，包括：

- 独立运行、负责设备状态与渲染的 Rust Core；
- Advanced 和 Simple 两套 React 用户界面；
- 可选的 Tauri 桌面壳；
- 基于 localhost 的 WebSocket JSON-RPC API；
- Lua 与 native-C 插件运行时；以及
- 相互独立的运行时配置档案，用于保护 Advanced 和 Simple 配置。

核心规则是**后端权威**：Core 进程是设备、Scope 生效状态、渲染、插件运行时状态和业务操作的唯一真实来源。前端查询这些状态并负责展示。

## 证据优先级

当两种描述相互矛盾时，请按以下顺序判断：

1. 运行时行为与测试
2. Rust、TypeScript 和 Lua 实现
3. 序列化 DTO 定义与 manifest
4. 本文档
5. 历史计划、路线图、README 文本和注释

重要源码入口：

| 问题 | 主要来源 |
|---|---|
| 存在哪些 WebSocket 方法？ | `core/src/server/handler.rs`、`core/src/server/plugin_rpc.rs` |
| 前端如何调用 Core？ | `src/services/api.ts`、`src/services/transport.ts` |
| 哪些内容会被持久化？ | `core/src/manager/store.rs`、`persisted.rs`、`core/src/profile.rs` |
| Scope 值如何解析？ | `core/src/manager/config.rs`、`scope.rs` |
| 渲染如何工作？ | `core/src/manager/runner.rs`、`demand.rs` |
| 会加载哪些插件？ | `core/src/plugin/mod.rs`、`catalog/`、`runtime/` |
| 哪些功能仅桌面端可用？ | `src-tauri/src/`、`simple/src-tauri/src/` |
| UI 暴露了什么功能？ | `src/App.tsx`、`src/features/`、`src/hooks/` |

## 架构原则

- **Core 与框架无关。** `core/` 不依赖 Tauri。
- **业务 API 与壳层 API 相互独立。** WebSocket 方法控制 Core；Tauri invoke 命令提供本地桌面集成。
- **由能力驱动 UI。** 设备声明可编辑输出和设置；灯效声明参数和资源权限。
- **插件扩展注册表。** Lua 与 native-C 控制器、灯效和扩展会在运行时被发现。
- **配置档案隔离可变状态。** Advanced 与 Simple 配置分别存放在独立的配置档案根目录中。
- **事件使缓存视图失效。** 客户端若错过事件或事件含义不明确，应重新查询权威快照。

## 术语表

| 术语 | 含义 |
|---|---|
| Core | 包含设备、插件、渲染、API 和托盘运行时的独立 Rust 进程 |
| Shell（壳） | 承载 React UI 和操作系统集成的 Tauri 桌面进程 |
| Advanced | 提供完整插件与设备管理能力的运行时配置档案 |
| Simple | 仅提供打包插件并限制部分设置的精简配置档案 |
| Scope | Device、Output 或 Segment 控制目标 |
| Controller（控制器） | 暴露输出并接收设备帧的硬件驱动 |
| Effect（灯效） | 填充逻辑颜色缓冲区的渲染器 |
| Extension（扩展） | 可注册设备、锁定 LED 并提供自定义页面的后台集成 |
| Runner | 仅在存在运行需求时创建的逐设备渲染线程 |
| Selected state（选中状态） | 在某个 Scope 上显式保存的值 |
| Effective state（生效状态） | 经过规范化和继承后解析出的值 |
| LED lock（LED 锁） | 由扩展拥有、针对特定物理 LED 的颜色覆盖 |

## 知识库导航

- [系统架构](system-architecture)
- [状态、设备发现与渲染](state-and-rendering)
- [前端架构](frontend-architecture)
- [插件系统](plugin-system)
- [代码库地图](codebase-map)
- [开发工作流](development-workflow)
- [WebSocket API](../api/websocket-overview)
- [插件开发参考](../plugins/overview)

:::caution 文档漂移
较早的说明可能仍称插件必须使用 `<type>.<id>` 目录名、Lua 是唯一启用的运行时、LED 流约为 30 FPS，或者前端在 Web Worker 中解码 LED 帧。这些说法与当前实现不符。
:::
