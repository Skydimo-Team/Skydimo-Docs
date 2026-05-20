---
sidebar_position: 5
---

# Native-C 插件运行时

`native-c` 运行时会把已编译共享库加载进 Skydimo Core，并通过 Skydimo C ABI 调用它。Lua 不够用时再选择 native-c：例如高性能灯效、底层硬件集成，或使用 C、C++、Rust、C#、Zig 等能够导出 C ABI 的语言开发插件。

完整 ABI 函数表与宿主方法请参阅 [Native-C API 参考](api/native-c-api)。

## SDK 下载

:::info 临时链接
下面是未来公开 SDK 发布包的占位链接。
:::

| 包 | 占位下载 | 适用场景 |
|----|----------|----------|
| C / C++ SDK | [skydimo-plugin-c-sdk.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-c-sdk.zip) | 权威 C ABI 头文件、示例、CMake 风格起步模板 |
| Rust SDK | [skydimo-plugin-rs.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-rs.zip) | Rust ABI 绑定、封装、`cdylib` 插件模板 |
| C# SDK | [skydimo-plugin-csharp.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-csharp.zip) | NativeAOT 兼容结构体、导出辅助代码、`dotnet publish` 模板 |

头文件占位下载：[skydimo_plugin_c_api.h](https://downloads.skydimo.com/sdk/native-c/v3/skydimo_plugin_c_api.h)。

所有语言包都面向同一套 ABI。如果某个语言封装在结构体布局、常量或回调签名上与 C SDK 不一致，请以 C SDK 为准。

## 运行时状态

| 能力 | 状态 |
|------|------|
| 灯效插件 | 已支持 |
| 控制器插件 | 已支持 |
| 扩展插件 | 已支持 |
| 当前 ABI | `skydimo-*-c-v3` |
| 支持 ABI 版本 | `v2..v3` |
| 运行模型 | 进程内共享库 |
| 更新行为 | Core 在加载前对入口库进行 shadow copy |

`wasm`、`abi-stable`、`process` 等 manifest 运行时目前只是预留项，尚不是可用插件运行时。

## native-c 与 Lua 原生模块

Skydimo 里有两个原生机制：

| 机制 | Manifest 形态 | 用途 |
|------|---------------|------|
| Lua C 模块加载 | `language: "lua"` 加 `native` manifest 块和 `native` 权限 | Lua 插件通过 `require()` 加载 C 模块 |
| native-c 运行时 | `language: "native-c"` 加 `abi` 和共享库 `entry` | 插件本身就是原生共享库 |

native-c 插件不需要为了加载自身而声明 `native` 权限。它仍然需要声明所调用宿主能力对应的权限。

## 包结构

可安装的 native-c 插件包必须包含 `entry` 指向的已编译库：

```text
effect.my_native_effect/
├── manifest.json
├── native/
│   ├── windows-x86_64/my_native_effect.dll
│   ├── linux-x86_64/libmy_native_effect.so
│   └── macos-aarch64/libmy_native_effect.dylib
├── locales/
└── data/
```

源码、构建目录、本地测试输出和工具链缓存不需要随插件一起分发。使用 `.skyignore` 排除 `target/`、`bin/`、`obj/`、临时日志和本地调试文件。

## Manifest

使用 `language: "native-c"`，并声明与插件类型匹配的 ABI family：

| 插件类型 | 推荐 `abi` |
|----------|------------|
| `effect` | `skydimo-effect-c-v3` |
| `controller` | `skydimo-controller-c-v3` |
| `extension` | `skydimo-extension-c-v3` |
| 任意类型 | `skydimo-native-c-v3` |

```json
{
  "id": "my_native_effect",
  "version": "1.0.0",
  "name": "My Native Effect",
  "publisher": "Example",
  "type": "effect",
  "language": "native-c",
  "abi": "skydimo-effect-c-v3",
  "entry": {
    "windows-x86_64": "native/windows-x86_64/my_native_effect.dll",
    "linux-x86_64": "native/linux-x86_64/libmy_native_effect.so",
    "macos-aarch64": "native/macos-aarch64/libmy_native_effect.dylib"
  },
  "permissions": ["log"],
  "params": [
    {
      "key": "speed",
      "label": "Speed",
      "kind": "slider",
      "default": 1.0,
      "min": 0.1,
      "max": 5.0,
      "step": 0.1
    }
  ]
}
```

`entry` 也可以包含 `default`。所有入口路径都必须相对于插件目录，不能逃出该目录。

## 语言说明

| 语言 | 要求 |
|------|------|
| C / C++ | 引入 SDK 头文件并导出 `skydimo_plugin_get_api`。C++ 导出必须使用 `extern "C"`。 |
| Rust | 构建 `cdylib`，导出 `skydimo_plugin_get_api`，并在返回 Core 前捕获 panic。 |
| C# | 使用 NativeAOT 或其他原生导出机制。Core 不能加载普通纯托管 `.dll`。 |
| 其他语言 | 产出平台共享库，导出未改名的 C 符号，并保持与 SDK 兼容的结构体布局。 |

## 构建与打包流程

1. 下载对应语言的 SDK 包。
2. 为每个目标平台构建 release 共享库。
3. 将每个输出文件复制到 `manifest.json` 的 `entry` 声明路径。
4. 从分发包中排除开发期文件。
5. 通过 Skydimo 插件导入流程安装，或以插件归档包形式分发。

文件名不会从插件 id 推断。Core 只会加载 `entry` 中声明的路径。

## 安全规则

- 使用与 `manifest.json` 中 `abi` 匹配的 SDK 包进行构建。
- 所有 ABI 结构体布局必须与 C SDK 保持兼容。
- 填充 API 表前先校验 `requested_abi_version`。
- 不要在文档约定的回调生命周期之外保存宿主拥有的指针。
- 不要让异常或 unwind 穿过 FFI 边界。
- 失败时返回负状态码。
- 将 native-c 插件视为可信原生代码：它们运行在 Core 进程内。
