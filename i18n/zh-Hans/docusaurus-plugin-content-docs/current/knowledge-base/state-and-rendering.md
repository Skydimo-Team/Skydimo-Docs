---
sidebar_position: 3
description: Scope 解析、持久化、设备发现、Runner 需求、渲染、锁和预览。
---

# 状态、设备发现与渲染

## 持久化状态

Core 将进程级共享状态与运行时配置档案状态分开保存。

| 位置 | 内容 |
|---|---|
| 共享根目录 | 启动器元数据、语言/共享应用字段、认证、遥测同意/数据、控制令牌 |
| `profiles/<profile>/core.json` | Schema 3 捕获设置、关联控制状态、快捷键 |
| `profiles/<profile>/plugins.json` | Controller/Effect/Extension 启用状态映射 |
| `profiles/<profile>/devices/*.json` | 身份历史、控制器设置、布局和 Scope 配置 |
| `profiles/<profile>/plugins/` | 已安装插件或开发插件文件 |
| `profiles/<profile>/data/` | 托管的插件数据 |
| `profiles/<profile>/layouts/` | 本地布局预设 |

Manager 写入时会先创建临时文件，再通过重命名替换目标文件。即便如此，在 Core 运行期间仍应避免手动编辑正在使用的文件。

## Scope 规范化

Scope 引用可以采用以下有效形式之一：

| 目标 | 字段 |
|---|---|
| Device | `port` |
| Output | `port`、`outputId` |
| Segment | `port`、`outputId`、`segmentId` |

没有 Output 的 Segment 无效。Core 会将单 Output 的 Device Scope 规范化为该 Output，也可能将唯一 Segment 折叠为其 Output。前端路径压缩会映射这一行为。

## 选中值与生效值

模式状态会跟踪：

- 在该 Scope 显式选中的灯效；
- 经过 Segment → Output → Device 继承后生效的灯效；
- 生效参数；
- 暂停状态；以及
- 提供生效值的 Scope。

亮度、屏幕来源/区域、音频来源和音频预处理会跟随活动模式的选中层级。因此，在子 Scope 建立自己的模式选择前，它可以显示来自父 Scope 的生效值。

电源的行为不同。父级操作会递归更新底层渲染目标，而非叶子 Scope 只有在所有子级都关闭时才算实际关闭。渲染使用内部关灯灯效产生全黑输出。

## 关联控制

关联控制拥有共享根状态和时间线。多种灯效、亮度、屏幕和音频操作会被重定向到该共享状态，再应用到各设备。UI 目前主要将其描述为“关联切换灯效”，因此新增行为应明确记录，不应仅凭现状推断。

## 设备发现

首次设备发现会在插件目录加载完成后开始：

1. 枚举串口和 HID 候选设备；
2. 尝试通过 inventory 编译注册的 Rust 控制器；
3. 尝试匹配的运行时控制器插件；
4. 恢复设备身份/配置和默认灯效；
5. 发布设备快照。

`HardwareCandidate` 当前只表示 Serial 和 HID。mDNS 设备使用独立的元数据、服务浏览器和控制器工厂路径。

各平台的热插拔监听分别通过 Windows 设备消息、macOS IOKit 和 Linux netlink 实现。设备发现过程由 manager 门控串行化，避免扫描重叠。手动扫描会重新打开串口候选设备；系统恢复处理还会重新打开 HID 候选设备。

## Runner 需求

并非每个检测到的设备都有一个永久运行的 Runner。只有至少存在以下一种输出处理需求时，才需要 Runner：

- 活动灯效或关灯灯效；
- LED 锁；
- LED 编辑预览会话；或者
- 控制器暴露的设备设置。

若发现已知的进程冲突，Runner 会被抑制，除非用户覆盖这一保护。需求消失时，Runner 会停止。

## 渲染流水线

每个设备 Runner 使用普通线程，以 60 FPS 为目标：

```text
解析 Scope 目标
→ tick 每个 Output/Segment 的灯效运行时
→ 将逻辑缓冲区映射到物理输出索引
→ 应用亮度
→ 应用扩展 LED 锁
→ 应用 LED 编辑预览覆盖
→ Controller::update(DeviceFrame)
```

每个 Output/Segment 都可以拥有独立的灯效运行时。布局映射允许逻辑灯效渲染到线性、矩阵或预设物理排列中。

Controller 更新失败可能终止该设备的 Runner、设置运行时错误状态、发出 `device-runtime-status-changed`，并发布错误通知。

## LED 预览流

Core 可以发出包含以下内容的 `device-led-update`：

```json
{
  "port": "device-port",
  "rgb": "<base64 RGB bytes>",
  "count": 60
}
```

后端数据流可以接近 60 FPS 的渲染目标。当前 Advanced 前端在主线程中解码 base64，并将 UI 更新节流到约 33 ms；现有 `ledPreview.worker.ts` 文件并未接入 `useLedStream.ts`。

## 锁与编辑预览

扩展可以锁定从零开始计数的物理 LED 索引，并提供覆盖颜色。锁状态变化会重新评估 Runner 需求，并通过快照/事件对外提供。

编辑 LED 布局时会创建临时 Output 预览会话。预览更新优先于普通锁输出，由编辑器持续保活，长时间无活动后自动过期，并受到大小限制，以防超大帧影响 Core。
