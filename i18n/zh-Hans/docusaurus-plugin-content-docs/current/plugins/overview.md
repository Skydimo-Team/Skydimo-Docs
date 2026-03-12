---
sidebar_position: 1
---

# 插件开发概览

Skydimo 的插件系统允许你用 **Lua 5.4** 编写自定义硬件驱动、灯光效果和后台服务，从而扩展应用能力。

## 插件类型

| 类型 | 目录命名 | 用途 |
|------|----------|------|
| **Controller（控制器）** | `controller.<id>/` | 硬件设备驱动（串口、HID、mDNS） |
| **Effect（灯效）** | `effect.<id>/` | 视觉灯光图案与动画 |
| **Extension（扩展）** | `extension.<id>/` | 后台服务、协议网桥、自定义 UI |

## 插件存放位置

插件存储在 `plugins/` 目录中：

```
plugins/
├── controller.skydimo_serial/
│   ├── manifest.json
│   ├── main.lua
│   ├── lib/
│   └── locales/
├── effect.rainbow/
│   ├── manifest.json
│   ├── main.lua
│   └── locales/
└── extension.openrgb/
    ├── manifest.json
    ├── init.lua
    ├── locales/
    └── page/
```

## 工作原理

1. Core 在启动时扫描 `plugins/` 目录
2. 名称匹配 `<type>.<id>/` 格式的子目录将被加载
3. 解析 `manifest.json` 以获取元数据、权限和类型特定配置
4. Lua 入口脚本在沙箱环境中执行
5. Core 调用插件生命周期钩子（`on_init`、`on_tick`、`on_shutdown` 等）

## 下一步

- [快速入门](getting-started) —— 创建你的第一个插件
- [Manifest 参考](manifest) —— 完整的 manifest.json 规格说明
- [控制器插件指南](controller-plugin) —— 构建硬件驱动
- [灯效插件指南](effect-plugin) —— 创建灯光效果
- [扩展插件指南](extension-plugin) —— 构建集成方案和后台服务
