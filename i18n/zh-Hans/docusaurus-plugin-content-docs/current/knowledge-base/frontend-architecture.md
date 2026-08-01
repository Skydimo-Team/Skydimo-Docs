---
sidebar_position: 4
description: Advanced React UI 的结构、状态流、传输层、后端驱动渲染和环境限制。
---

# 前端架构

本页介绍 `src/` 中的 Advanced 前端。Simple UI 是位于 `simple/src/` 下的独立应用，它在不同的工作区中复用了许多相同概念。

## 组合结构

```text
main.tsx
└─ providers：i18n、Chakra、platform、toaster
   └─ App.tsx
      ├─ AppLayout + TitleBar + Sidebar
      ├─ HomePage
      ├─ DeviceDetail
      ├─ PluginsPage / ExtensionPageView
      ├─ SettingsPage
      └─ 全局更新、遥测同意和关闭对话框
```

`App.tsx` 使用可辨识联合类型保存 `activeView`，并据此有条件地渲染页面。项目没有使用 React Router。导航状态不会体现在 URL 中，因此不支持浏览器历史记录、深层链接，也无法在刷新后恢复页面。

## 通信分层

| 层 | 职责 |
|---|---|
| `services/transport.ts` | WebSocket 生命周期、JSON-RPC 关联、配置档案握手、超时、重连和事件 |
| `services/api.ts` | 具名 Core 操作，以及仅 Tauri 可用的集成和直接 HTTP 集成 |
| `services/config.ts` | AppConfig 乐观队列、缓存、持久化和浏览器回退 |
| `services/logger.ts` | 结构化前端诊断和 Core 会话关联 |
| `services/frontendErrors.ts` | Window、Promise 和 React 错误报告 |

组件和 Hook 应调用 `api.ts`，而不是直接拼接 WebSocket 方法字符串。

Advanced 传输层要求 `advanced` 运行时配置档案，RPC 超时为 30 秒，并在普通断连两秒后尝试重连。事件监听器会在重连期间保持注册。

## 状态与 Hook

全局业务状态有意保持精简，并由后端驱动：

- `useDevices` 管理设备快照、选中的 Scope 和设备事件。
- `useEffects` 加载灯效目录。
- `useLedStream` 应用高频预览帧。
- `useLedLocks` 跟踪 LED 锁快照和事件。
- `useStartupStatus` 和 `useStartupToast` 展示后台就绪状态。
- `useNotifications` 渲染 Core 通知。
- `useMemberAuth` 执行浏览器授权并监听认证变更。
- `useUpdateCheck` 管理更新状态和对话框行为。

大多数 UI 状态都是 React 本地状态。矩阵编辑器是一个有意保留的局部例外：它使用 Zustand 和 zundo 管理画布状态以及撤销/重做。

## 后端驱动的灯效控件

Core 返回灯效元数据和参数。`ParamRenderer` 按以下规则分发：

| 参数类型 | 渲染器 |
|---|---|
| `slider` | `SliderRenderer` |
| `range-slider` | `RangeSliderRenderer` |
| `select` | `SelectRenderer` |
| `toggle` | `ToggleRenderer` |
| `color` | `ColorRenderer` |
| `multi-color` | `MultiColorRenderer` |

依赖条件可以隐藏或禁用控件。参数组可以折叠，其 UI 状态保存在浏览器 local storage 中。屏幕/音频选择器根据灯效权限显示，而不是根据灯效 ID 显示。

高频控件使用“只保留最新值”的节流模式进行实时预览；交互结束后再提交最终值，并刷新权威状态。

## 设备树与 Scope 选择

`SidebarDeviceTree` 渲染 Device → Output → Segment，而 `utils/scope.ts` 负责规范化压缩路径：

- 隐藏唯一 Output；
- 仅在存在多个有意义的 Segment 时渲染 Segment；
- 将过期或无效选择重定向到有效 Scope；以及
- 允许通过 LED 预览区域选择对应 Scope。

详情视图从最新设备 DTO 中解析选中/生效的模式、亮度、电源、来源、锁和冲突状态。

## 桌面端与浏览器能力边界

同一个 Advanced SPA 既可运行于 Tauri，也可运行于浏览器。许多集成通过 `isTauri` 进行能力判断，但这一边界并不完全严密。

明确仅限桌面端的操作包括：

- 真实的自动启动和关闭行为；
- 托盘/窗口控制和配置档案切换；
- 自定义屏幕区域覆盖层；
- 本地布局预设文件操作；
- 本地扩展页面；以及
- 反馈包上传。

部分面向桌面的控件在浏览器模式下仍会显示，但可能只保存本地偏好，或在执行操作系统动作时失败。在将浏览器模式承诺为受支持的最终用户使用方式前，应实际测试其行为。

## 样式、本地化与动画

- Chakra UI v3 提供基础组件。
- 项目封装位于 `src/components/ui/`。
- 颜色通过 `src/styles/theme.css` 中的变量定义。
- 图标由 Lucide 提供。
- 页面和列表过渡由 Framer Motion 提供。
- i18next 资源目前覆盖八种语言。
- Core/插件的 `LocalizedText` 通过 `src/i18n/localizedText.ts` 解析。

## 当前 UI 限制

- 没有内置帮助中心或帮助路由。
- 没有面向用户的全局错误页面。
- 部分 RPC 失败只会写入日志，不会显示 Toast。
- 设备运行时错误会包含在 DTO 中，但详情 UI 主要只展示设备 FPS。
- 插件市场结果数量有限，且没有分页或详情页面。
- 接受更新时会打开下载 URL，而不是在应用内安装。
- 首页目前只有设备卡片和扫描功能；历史上的资讯/推荐插件代码并未启用。
