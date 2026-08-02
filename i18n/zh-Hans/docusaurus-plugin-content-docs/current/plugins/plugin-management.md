---
sidebar_position: 3
---

# 插件管理

本文说明插件运行来源、`.skyplugin` 包导入流程，以及刷新、删除、重置会如何影响正在运行的 Core。

:::info 版本
本文涉及的包导入、托管插件存储和扩展插件元数据自 **`3.0.0-dev.4`** 起支持。
:::

## 运行来源

Core 会根据插件模式扫描不同的插件根目录。

### Full 模式

Full 模式加载：

| 优先级 | 来源 | 用途 |
|--------|------|------|
| 1 | `<config_dir>/plugins/` | 用户安装的插件包副本，目录名为插件 ID 的哈希 |
| 2 | `<config_dir>/plugins/dev/` | 直接从目录加载的开发插件 |
| 3 | `<exe_dir>/plugins/` | 随应用打包的插件 |
| 4 | `<exe_dir>/plugins/built-in/` | 共享内置基线插件 |

插件 ID 重复时优先级更高的来源胜出。安装到 `<config_dir>/plugins/` 的包可以覆盖打包插件；`reset_plugin` 会移除这个覆盖。

### Simple 模式

Simple 模式只加载打包插件：

| 优先级 | 来源 | 用途 |
|--------|------|------|
| 1 | `<exe_dir>/plugins/simple/` | Simple 模式专用插件集 |
| 2 | `<exe_dir>/plugins/built-in/` | 共享内置基线插件 |

Simple 模式禁用用户插件包导入和安装。

## 包导入流程

Skydimo 通过短生命周期的服务端会话导入 `.skyplugin` 文件：

1. 客户端用 `import_plugin_package` 发送包字节。
2. Core 将压缩包解压到临时目录并扫描 `manifest.json`。
3. 客户端选择要安装的插件 ID。
4. Core 通过 `install_plugins` 安装选中的插件。
5. 导入会话被消费，临时目录被清理。

插件代码会复制到 `<config_dir>/plugins/<hash(plugin_id)>`。包内顶层 `data/` 会合并到 `<config_dir>/data/<hash(plugin_id)>`，不会随插件代码一起复制。

用户放弃导入时使用 `cancel_plugin_import` 清理会话。

## 开发插件

开发插件放在：

```text
<config_dir>/plugins/dev/<type>.<id>/
```

开发插件直接从该目录加载，不会复制到哈希目录。它的运行时数据目录解析为插件目录自己的 `data/`。

修改开发插件后执行刷新，让 Core 重载 manifest 并重启受影响的运行时部分。

## 刷新行为

`refresh_plugins` 会执行运行时安全的刷新流程：

- Full 模式下确保插件根目录存在。
- 重载注册表前停止正在运行的扩展。
- 重新扫描所有当前启用的插件来源。
- 重新启动已启用扩展。
- 执行热插拔扫描，重启活跃 runner，并发送 `plugins-changed`。

如果扩展调用的插件管理 API 会重启它自己，Core 会短暂延迟这个扩展的重启，让当前调用可以正常返回。

## 启用状态

每类插件都有独立启用表：

| 插件类型 | 命令/API |
|----------|----------|
| Controller | `set_controller_plugins_enabled` |
| Effect | `set_effect_plugins_enabled` |
| Extension | `set_extension_plugins_enabled` |

禁用 controller 插件会断开由它管理的设备；禁用 extension 会停止它的运行线程。启用 controller 会触发设备发现；启用 extension 会立即启动它。

## 删除与重置

### 删除

使用 `delete_plugin` 移除用户安装的包副本。

- 只有当前来源为 `package` 的插件可删除。
- 删除文件前会先禁用/释放插件。
- `deleteData: true` 会同时删除运行时数据目录。
- 如果失败，Core 会尝试恢复插件之前的启用状态。

打包插件和开发插件不能通过该操作删除。

### 重置

使用 `reset_plugin` 移除用户安装的覆盖副本，并回退到其他可用来源，通常是打包插件。

- 移除该插件 ID 的托管包副本。
- `resetData: true` 会同时删除运行时数据目录。
- 如果插件原本存在且已启用，重载后 Core 会恢复该启用状态。

## 运维元数据

`get_plugins` 返回适合 UI 和工具使用的元数据：

| 字段 | 含义 |
|------|------|
| `pluginDir` | Core 实际加载的插件目录 |
| `dataDir` | 运行时数据目录，若已存在 |
| `bundled` | 当前来源是否为打包插件 |
| `installSource` | 当前运行来源通常为 `bundled`、`import-dev` 或 `package` |
| `reimportsOnRefresh` | 当前扫描来源固定为 `false` |

请使用这些字段，而不是猜测路径。

## `.skyignore`

包安装会遵守插件目录中的 `.skyignore` 规则。语法类似 `.gitignore`，并且 `.git/` 会被隐式跳过。

```text
target/
bin/
obj/
node_modules/
*.tmp
*.log
!keep-this.log
```

native-c 包应将编译产物放在 `manifest.json` 的 `entry` 路径下，并排除构建缓存。

## 排障

### 包导入扫描不到插件

- 确认压缩包中至少有一个 `manifest.json`。
- 确认压缩包条目没有绝对路径或 `..`。
- 确认插件的 `type`、`language` 和 `entry` 合法。

### 安装后插件没有出现

- 确认 `install_plugins` 传入的是 `import_plugin_package` 返回的 ID。
- 查看 `get_startup_status`，插件初始化不能处于 `pending` 或 `running`。
- 执行 `refresh_plugins` 并检查 Core 日志中的 manifest/runtime 错误。

### 生效版本不对

查看 `get_plugins` 返回的 `installSource` 和 `pluginDir`。来源优先级意味着用户包可以覆盖打包插件，开发插件可以覆盖优先级更低的打包来源。

### 插件文件删除了但数据还在

只有 `deleteData` 或 `resetData` 为 `true` 时才会删除数据目录。

## 相关文档

- [插件命令](../api/commands/plugins)
- [扩展 API 参考](api/extension-api)
- [Native-C API 参考](api/native-c-api)
- [Manifest 参考](manifest)
