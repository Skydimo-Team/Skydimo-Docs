---
sidebar_position: 5
description: 插件发现、运行时分发、manifest、生命周期、权限、页面和开发行为。
---

# 插件系统

本页从维护者视角概述插件系统。有关 schema 和可调用 API，请参阅[插件开发参考](../plugins/overview)。

## 类型与启用的运行时

| 类型 | 用途 | Lua | native-C |
|---|---|:---:|:---:|
| Controller（控制器） | 验证硬件、暴露输出/设置并发送帧 | 是 | 是 |
| Effect（灯效） | 渲染逻辑颜色缓冲区 | 是 | 是 |
| Extension（扩展） | 后台集成、设备、锁和自定义页面 | 是 | 是 |

manifest 解析器可以识别 WASM、ABI-stable 和 process 等其他运行时名称，但当前实际注册表只会分发 Lua 与 native-C。

`effect.example` 等目录名只是一种约定，并非加载器要求。插件类型和 ID 由 `manifest.json` 决定。

## 扫描来源与优先级

Full 模式按以下顺序扫描：

1. 配置档案插件根目录下已安装的插件；
2. `plugins/dev` 下直接加载的开发插件；
3. 应用打包的插件根目录；
4. 打包的 `simple`；以及
5. 打包的 `built-in`。

Simple 模式只扫描打包的 `simple` 和 `built-in`。同一类型和 ID 多次出现时，较早的来源优先。

导入的插件包存放在根据稳定哈希生成的目录中，而不是易读的 `<type>.<id>` 路径。托管数据同样使用哈希目录。插件代码应使用宿主提供的路径，例如 `ext.data_dir`。

## 插件包与 Pack

Advanced 模式可以导入 `.skyplugin`/ZIP 包。普通插件包包含 manifest 和入口文件。`type: "pack"` manifest 会显式列出子插件目录；不支持嵌套 Pack。

在打包/导入时，`.skyignore` 使用 gitignore 风格的匹配规则，并且始终忽略 `.git/`。

## Manifest 摘要

普通 manifest 必须包含：

- `id`；
- `version`；
- `name`；
- `publisher`；
- `type`；
- `language`；以及
- `entry`。

`entry` 可以是字符串，也可以是平台/架构映射。解析出的路径必须位于插件目录内且确实存在。Lua 入口必须返回一个 table。

不同插件类型的要点：

- Controller 必须声明 `match`；当前启用了串口与 HID 匹配。解析器接受 USB/mDNS 协议值，但候选设备匹配目前只接通串口/HID。
- Effect 可以声明分类、图标、参数和资源权限。
- Extension 可以声明本地 `page` 或外部 `page_url`，但二者不能同时存在。
- Native-C 插件必须声明受支持的 ABI，并导出 `skydimo_plugin_get_api`。

## Lua 生命周期

### Controller

```text
匹配候选设备
→ 打开设备
→ 可选 on_validate()
→ 可选 on_init()
→ 要求至少调用一次 device:add_output(...)
→ 每帧调用 on_tick(dt_seconds)
→ 设备设置变更时调用 on_config(table)
→ 释放时调用 on_shutdown()
```

验证返回 false 或抛出错误时，该候选设备会被拒绝，并允许另一个控制器继续尝试。

### Effect

```text
加载入口
→ on_init()
→ on_params(table)
→ on_tick(elapsed_seconds, buffer, width, height)
→ on_shutdown()
```

缺少 tick 或 tick 执行失败时会产生全黑输出。屏幕灯效在成功捕获画面前保持未就绪状态。

### Extension

```text
启动独立线程
→ 注入 ext API
→ on_start()
→ 分发扫描/帧/页面/设备/锁/系统/媒体回调
→ on_stop()
→ 移除设备、释放锁并关闭进程/网络资源
```

扩展回调错误会写入日志，事件循环继续运行。帧投递为非阻塞操作；速度较慢的扩展可能丢帧，但不会阻塞 Runner。

## 权限模型

当前实际强制执行的资源权限包括：

- Effect：`screen:capture`、`audio:capture`、`media:album_art`；
- Extension：`system:info`、`media:session`、`system:process`、`system:window-focus`、`network:tcp`、`network:http`、`network`、`process`、`hardware:hid` 和 `native`；
- Controller：`system:info` 控制 `host.system`。

部分 Controller I/O/日志声明以及许多 Extension 设备、Scope 和管理 API 当前只作为元数据存在，或者并未由独立权限保护。文档必须描述真实的权限执行情况，不应暗示运行时提供了更强的沙箱。

请求 `native` 权限的 Lua 扩展会使用不安全的 Lua 环境，以便加载获准的 C 模块/DLL 依赖。普通 Lua 插件使用更安全的环境。

## 扩展页面通信

本地扩展页面仅桌面端可用。壳会注入：

```js
window.__SKYDIMO_EXT_PAGE__ = { extId, wsUrl, locale };
```

通信通过 Core WebSocket 消息完成：

- 扩展 → 页面：`ext.page_emit(data)` 广播 `ext-page-message:<extension_id>`；
- 页面 → 扩展：使用 `{extId, data}` 调用 JSON-RPC `ext_page_send`，进而触发 `on_page_message(data)`。

这不是通用的 `window.postMessage` 桥接，目前也没有统一的内置页面 SDK。

## 开发与刷新

将直接加载的开发插件放入所解析配置档案的 `plugins/dev` 来源，然后使用**刷新插件**。刷新操作会：

- 停止并重新启动扩展；
- 重新扫描 manifest 与运行时；
- 触发硬件发现；以及
- 重新启动活动 Runner。

Core 日志会记录 manifest、入口、权限、ABI、页面和回调错误。Native-C 库使用影子副本，避免 Windows 在重新加载期间锁定 DLL。

当前检出的示例包括打包的 Skydimo HID/主板/串口控制器、native-C Simple 灯效、Lua 开发灯效，以及 Lua/native-C 扩展。某个工作区中可能并未检出 `.gitmodules` 里的部分插件条目；在其内容实际存在前，不应将其视为可运行示例。
