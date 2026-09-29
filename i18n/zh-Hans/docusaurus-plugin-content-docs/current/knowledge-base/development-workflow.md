---
sidebar_position: 7
description: 本地开发、验证、插件迭代和文档维护工作流。
---

# 开发工作流

## 前置条件

- 文档站点需要 Node.js 20 或更高版本；应用本身请遵循仓库当前的前端引擎/工具链要求。
- 使用 `rust-toolchain.toml` 指定的 Rust 工具链。
- 安装 Tauri、屏幕捕获、音频、HID 和 USB 库所需的平台构建依赖。
- 初始化你准备修改的文档或插件源码子模块。

## Advanced 前端

在仓库根目录执行：

```powershell
npm ci
npm run test
npm run build
```

常用脚本：

```powershell
npm run dev
npm run dev:desktop
npm run tauri dev
```

`dev:desktop` 会先构建开发版 Core，再启动 Vite。仅使用浏览器开发时，仍需要运行兼容的 Core，并显式传入 `?ws=` 参数。

## Rust Core 验证

任何 `core/` 下的变更都必须通过项目的严格检查：

```powershell
cargo clippy --manifest-path core/Cargo.toml --all-targets --all-features -- -D warnings
```

迭代期间运行针对性测试，并在交付前完成严格检查。

:::caution
不要在此仓库中运行 `cargo fmt` 或 `rustfmt`。项目明确要求保留现有的 Rust 格式约定。
:::

## 插件开发

进行 Advanced 本地开发时：

1. 将插件源码放入所解析配置档案的插件开发目录；
2. 确保 `manifest.json` 能正确解析其入口、页面和原生文件；
3. 构建页面资源或原生库；
4. 使用**刷新插件**；
5. 检查 Core 日志和启动状态；并且
6. 测试启用/禁用、重启、数据持久化和资源清理。

构建可安装的 `.skyplugin` 包用于分发。安装后不要依赖易读的源码目录名；Core 会按哈希安装插件。

## 文档站点

在 `docs/` 中执行：

```powershell
npm ci
npm run typecheck
npm run build
```

本地预览：

```powershell
npm run start
npm run start:zh
```

英文文档位于 `docs/docs/`。简体中文翻译在以下目录中与其保持镜像：

`docs/i18n/zh-Hans/docusaurus-plugin-content-docs/current/`。

## 按变更类型验证

| 变更 | 最低验证要求 |
|---|---|
| React 组件/Hook | TypeScript 构建和针对性的 Vitest 测试 |
| 传输层/API | 传输层/API 测试、前端构建、兼容 Core 冒烟测试 |
| Core 行为/DTO | 针对性 Rust 测试和严格 Core clippy |
| 插件 manifest/运行时 | 解析器/运行时测试、刷新/重载，以及相关示例插件 |
| Tauri 命令 | Rust 测试/构建，以及目标平台上的桌面行为验证 |
| 文档 | Docusaurus 类型检查和完整多语言构建 |

涉及硬件的变更还应使用安全的设备或模拟器进行验证，并检查关闭、重连和错误路径。

## 文档更新检查清单

行为发生变化时：

1. 确认权威来源和受影响的读者。
2. 若用户可见工作流发生变化，更新用户手册。
3. 若架构或职责归属发生变化，更新知识库。
4. 若序列化契约发生变化，更新 API/插件参考页面。
5. 同时更新英文和中文内容。
6. 在整个文档树中搜索旧术语或旧方法名。
7. 构建两种语言并修复失效链接。

避免在多个页面重复易变化的事实。应优先维护一份详细参考，并从概览页面链接到该参考。

## 仓库卫生

主仓库以及文档/插件子模块可能各自存在独立的未提交工作。除非用户明确要求，否则不要暂存、重置、提交、切换分支或清理文件。不要让生成的构建产物混入待评审源码变更，并保留无关的现有修改。
