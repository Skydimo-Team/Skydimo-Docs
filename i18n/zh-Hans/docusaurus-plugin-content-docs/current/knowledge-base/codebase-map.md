---
sidebar_position: 6
description: 仓库目录地图，以及实现常见功能时需要修改的源码位置。
---

# 代码库地图

## 仓库根目录

| 路径 | 职责 |
|---|---|
| `core/` | 独立 Rust 后端和公共 Core 库 |
| `src/` | Advanced React 前端 |
| `src-tauri/` | Advanced Tauri 壳与系统集成 |
| `simple/src/` | Simple React 前端 |
| `simple/src-tauri/` | Simple Tauri 壳 |
| `launcher/` | Windows 自动启动辅助程序 |
| `plugins/` | 打包、Simple、开发、私有及子模块插件源码 |
| `docs/` | Docusaurus 文档子模块 |
| `scripts/` | 构建、发布、验证和打包脚本 |
| `script/` | 插件、启动器、打包、迁移和诊断工具 |
| `dev/` | 设计说明、路线图和项目维护资料 |
| `data/`、`import/` | 工作区开发和运行时输入 |

根 Cargo 工作区包含 `core`、`src-tauri`、`simple/src-tauri` 和 `launcher`。根 npm 包负责构建 Advanced 前端；`simple/` 拥有自己的包。

## Core 地图

```text
core/src/
├─ api/          序列化公共 DTO
├─ interface/    Controller/Effect 契约和通用硬件类型
├─ manager/      状态、设备发现、持久化、Runner、锁和布局
├─ plugin/       目录、导入/管理、宿主 API、Lua/native-C 运行时
├─ resource/     音频、屏幕、媒体、系统状态、设备发现和驱动
├─ runtime/      单实例控制与 UI 启动器
├─ server/       WebSocket 服务器、RPC 分发器和事件广播器
├─ shortcut/     全局快捷键
├─ telemetry/    同意状态、队列、上传和异常处理
├─ tray/         Core 托盘和事件循环
├─ event.rs      事件名称和 EventBroadcaster
├─ profile.rs    Advanced/Simple 路径拆分与迁移
└─ main.rs       Core 组合根
```

## Advanced 前端地图

```text
src/
├─ features/
│  ├─ home/
│  ├─ devices/
│  ├─ plugins/
│  ├─ settings/
│  └─ layout/
├─ components/ui/   可复用 UI 封装
├─ hooks/           后端快照、事件、平台和应用状态
├─ services/        API、传输、配置、日志和诊断
├─ types/           前端 DTO 契约
├─ i18n/            语言资源和 LocalizedText 解析
├─ styles/          Chakra 主题和 CSS 变量
├─ motion/          共享动画令牌
├─ App.tsx          页面与对话框组合
└─ main.tsx         应用启动入口
```

## 变更地图

### 新增或修改 WebSocket 操作

1. 实现 manager、resource 或 plugin 行为。
2. 在 `core/src/server/handler.rs` 或 `plugin_rpc.rs` 中添加分发与校验。
3. 新增或更新序列化 DTO。
4. 在 `src/services/api.ts` 中添加类型化封装。
5. 同步 `src/types/`；若 Simple 使用该方法，也要同步其类型与 API。
6. 添加测试并更新 `docs/docs/api/`。

### 新增事件

1. 若为 Core 全局事件，在 `core/src/event.rs` 中声明稳定名称。
2. 通过 `EventBroadcaster` 发出事件。
3. 必要时定义负载 DTO 以及 schema/版本。
4. 在 Hook 或 Service 中订阅，而不是在叶子组件中订阅。
5. 明确该事件只是失效通知，还是包含完整快照。
6. 记录错过事件后的恢复方式。

### 新增灯效参数类型

1. 扩展 Core 灯效参数类型和 manifest 解析器。
2. 扩展 API 序列化。
3. 同步 `src/types/effect.ts`。
4. 在 `features/devices/components/params/` 下添加渲染器。
5. 更新 `ParamRenderer`、测试、适用时的 Simple UI，以及插件文档。

### 新增桌面端专属行为

1. 若业务逻辑需要在无界面模式下工作，应保留在 Core 中。
2. 将操作系统、窗口和文件对话框行为放入相应的 Tauri 壳。
3. 暴露边界清晰的 Tauri 命令。
4. 前端通过 `isTauri` 进行能力判断。
5. 定义浏览器回退行为，或者隐藏该控件。

### 新增 Lua Host API

1. 确定该 API 属于 Controller、Effect 还是 Extension。
2. 在 `core/src/plugin/runtime/lua/` 中实现。
3. 对敏感能力应用明确的权限检查。
4. 仅当公共运行时契约要求对等时，才同步到 native-C。
5. 添加测试并更新相应的插件 API 页面。

## DTO 警告

不要假设所有序列化字段都使用 camelCase。请求参数通常使用 camelCase，但 Device、Output、Segment 和 Scope 响应中包含 `active_controller_id`、`output_id`、`selected_effect_id` 等 snake_case 字段。请核对每个 Rust `serde` 声明和真实响应。

## 子模块与工作树

`docs/` 和多个插件目录是 Git 子模块。有些子模块可能被有意保留为未初始化状态。编辑前请：

- 检查父仓库状态；
- 单独检查目标子模块状态；
- 保留用户无关的现有改动；并且
- 不要假定每个 `.gitmodules` 条目都已在本地可用。
