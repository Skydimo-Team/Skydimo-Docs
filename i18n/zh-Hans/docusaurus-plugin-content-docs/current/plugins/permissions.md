---
sidebar_position: 8
---

# 权限

插件必须在 `manifest.json` 中声明所需权限。Core 会强制执行权限检查 —— 调用未声明权限的 API 将会失败。

## 可用权限

### 通用

| 权限 | 说明 |
|------|------|
| `log` | 向应用日志写入内容 |

### 控制器插件

| 权限 | 说明 |
|------|------|
| `serial:read` | 从串口读取数据 |
| `serial:write` | 向串口写入数据 |
| `hid:read` | 从 HID 设备读取数据 |
| `hid:write` | 向 HID 设备写入数据 |

### 灯效插件

| 权限 | 说明 |
|------|------|
| `screen:capture` | 捕获屏幕内容 |
| `audio:capture` | 访问音频 FFT 数据 |
| `media:album_art` | 访问媒体专辑封面 |

### 扩展插件

| 权限 | 说明 |
|------|------|
| `network:tcp` | 建立 TCP 连接 |
| `process` | 启动和管理外部进程 |

## 声明权限

在 `manifest.json` 中添加 `permissions` 数组：

```json
{
  "permissions": ["log", "network:tcp", "process"]
}
```

## 安全模型

- 插件运行在沙箱化的 Lua 5.4 环境中
- 文件系统访问限制在插件自身目录内
- 网络访问需要显式声明 `network:tcp` 权限
- 进程启动需要显式声明 `process` 权限
- 每个插件运行在独立的 Lua 状态中 —— 插件之间无法访问彼此的数据
