---
sidebar_position: 6
---

# 系统命令

用于系统信息、Core 启动状态、应用级配置、全局捕获设置和全局控制状态的命令。

## get_system_info

返回主机详细信息，包括操作系统、主板、BIOS、CPU、GPU 和内存。

**参数**：无

```json
→ {"jsonrpc":"2.0","method":"get_system_info","id":1}
← {"jsonrpc":"2.0","result":{
  "os": {
    "platform": "Windows",
    "version": "Microsoft Windows 11 Pro",
    "build": "22631",
    "arch": "x86_64",
    "hostname": "MY-PC"
  },
  "motherboard": {"manufacturer": "ASUSTeK COMPUTER INC.", "model": "ROG STRIX"},
  "bios": {"vendor": "American Megatrends Inc.", "version": "2803"},
  "cpu": {"name": "AMD Ryzen 9 5900X", "cores": 12, "threads": 24},
  "gpu": [{"name": "NVIDIA GeForce RTX 3080", "vramMb": 10240}],
  "ram": {"totalMemoryMb": 32768, "modules": []}
},"id":1}
```

---

## get_startup_status

返回 Core 中插件、设备发现和扩展的启动任务状态。

```json
→ {"jsonrpc":"2.0","method":"get_startup_status","id":1}
← {"jsonrpc":"2.0","result":{
  "plugins": {"state": "complete"},
  "deviceDiscovery": {"state": "running", "detail": "Scanning USB"},
  "extensions": {"state": "complete"}
},"id":1}
```

`state` 为 `pending`、`running`、`complete` 或 `failed`。插件导入/启动进度可能位于 `plugins.progress`。

---

## get_core_config_dir

返回 Core 配置目录路径。

```json
→ {"jsonrpc":"2.0","method":"get_core_config_dir","id":1}
← {"jsonrpc":"2.0","result":"C:/Users/.../Skydimo","id":1}
```

## open_core_config_dir

确保 Core 配置目录存在，并在系统文件管理器中打开。

```json
→ {"jsonrpc":"2.0","method":"open_core_config_dir","id":1}
```

---

## 屏幕捕获设置

这些设置全局影响屏幕捕获类灯效。

### get_capture_max_pixels

返回当前捕获像素预算。`0` 表示无限制。

### set_capture_max_pixels

设置捕获像素预算。

```json
→ {"jsonrpc":"2.0","method":"set_capture_max_pixels","params":{"maxPixels":921600},"id":1}
```

Simple 模式锁定屏幕捕获采样分辨率时会失败。

### get_capture_fps / set_capture_fps

获取或设置捕获采样 FPS。低于 `1` 的值会归一化为 `1`。

```json
→ {"jsonrpc":"2.0","method":"set_capture_fps","params":{"fps":30},"id":1}
```

Simple 模式锁定屏幕捕获采样帧率时会失败。

### get_capture_method / set_capture_method

获取或设置捕获后端。

```json
→ {"jsonrpc":"2.0","method":"set_capture_method","params":{"method":"dxgi"},"id":1}
```

常见值：Windows 上为 `dxgi`、`gdi`、`graphics`，macOS 上为 `screencapturekit`，Linux 上为 `xcap`。

---

## 关联控制

关联控制会将多数灯效、参数、亮度、暂停、屏幕源、音频源和音频预处理变更重定向到共享根状态，并同步到所有设备。

### get_linked_control

返回关联控制是否启用。

```json
→ {"jsonrpc":"2.0","method":"get_linked_control","id":1}
← {"jsonrpc":"2.0","result":{"enabled":true},"id":1}
```

### set_linked_control

启用或禁用关联控制。

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `enabled` | boolean | 否 | 默认 `false` |
| `sourcePort` | string | 否 | 启用时用于快照状态的 scope |
| `outputId` | string | 否 | 可选输出 scope |
| `segmentId` | string | 否 | 可选分段 scope；需要 `outputId` |

```json
→ {"jsonrpc":"2.0","method":"set_linked_control","params":{
  "enabled":true,
  "sourcePort":"COM3",
  "outputId":"out1"
},"id":1}
```

---

## 快捷键

### get_shortcuts_config

返回全局快捷键绑定。

```json
→ {"jsonrpc":"2.0","method":"get_shortcuts_config","id":1}
← {"jsonrpc":"2.0","result":{
  "bindings":[
    {"action":"toggle_all_lights","accelerator":"Control+Alt+Shift+F8"}
  ]
},"id":1}
```

### set_shortcuts_config

替换全局快捷键绑定。缺失或空的 accelerator 会由 Core 归一化。

```json
→ {"jsonrpc":"2.0","method":"set_shortcuts_config","params":{
  "config":{
    "bindings":[
      {"action":"turn_all_lights_off","accelerator":"Control+Alt+Shift+F10"}
    ]
  }
},"id":1}
```

已知 action：`turn_all_lights_on`、`turn_all_lights_off`、`toggle_all_lights`、`increase_all_brightness`、`decrease_all_brightness`。

---

## 语言

### set_locale

设置 Core 当前语言并发送 `locale-changed`。

```json
→ {"jsonrpc":"2.0","method":"set_locale","params":{"locale":"zh-CN"},"id":1}
```
