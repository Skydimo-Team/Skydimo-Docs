---
sidebar_position: 4
---

# Native-C 插件运行时

`native-c` 运行时会把已编译的平台共享库直接加载进 Skydimo Core，并通过 Skydimo C ABI 调用它。Lua 不适合时再选择 native-c：例如高性能灯效、底层硬件集成，或者使用 C、C++、Rust、C#、Zig 等能够导出 C ABI 的语言开发插件。

Skydimo 不加载源码。native-c 插件包必须包含已经编译好的 `.dll`、`.so` 或 `.dylib`，并由 `manifest.json` 指定每个平台要加载的文件。

完整 ABI 函数表与宿主方法请参阅 [Native-C API 参考](api/native-c-api)。

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

## SDK 仓库

native-c SDK 包和各语言模板维护在 [Skydimo-Team/Skydimo-SDK](https://github.com/Skydimo-Team/Skydimo-SDK)。

| 包 | 适用场景 |
|----|----------|
| C / C++ SDK | 权威 C ABI 头文件、C 示例、CMake 风格起步模板 |
| Rust SDK | Rust ABI 绑定、更安全的封装、`cdylib` 插件模板 |
| C# SDK | NativeAOT 兼容结构体、导出辅助代码、`dotnet publish` 模板 |

所有语言包都面向同一套 ABI。如果某个语言封装在结构体布局、常量或回调签名上与 C SDK 不一致，请以 C SDK 为准，并先更新语言封装再构建。

不要把本文档里的 ABI 结构体片段复制到生产代码中。下面的代码只用于说明接入形态，真实声明应来自下载的 SDK 包。

## native-c 与 Lua 原生模块的区别

Skydimo 里有两个不同的原生机制：

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

当一个二进制暴露多个插件 API family 时，可以使用通用的 `skydimo-native-c-v3`，但类型专用 ABI 更清晰。

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

## 导出约定

每个 native-c 库都必须导出这个符号：

```c
SKYDIMO_EXPORT int32_t skydimo_plugin_get_api(
    uint32_t requested_abi_version,
    const SkydimoHostApiV1* host,
    SkydimoPluginApiV1* out_api);
```

Core 加载库后会立即调用该函数。函数必须填充 `out_api`，将 `abi_version` 设为请求的 ABI 版本，并通过 `kind_mask` 声明这个二进制提供的 API：

| Mask | 含义 |
|------|------|
| `SKYDIMO_PLUGIN_KIND_EFFECT` | 提供 `SkydimoEffectApiV1` |
| `SKYDIMO_PLUGIN_KIND_CONTROLLER` | 提供 `SkydimoControllerApiV1` |
| `SKYDIMO_PLUGIN_KIND_EXTENSION` | 提供 `SkydimoExtensionApiV1` |

返回 `0` 或正数表示成功，负数表示失败。不要让异常或 panic 穿过 FFI 边界。

## 选择语言包

无论使用哪种语言，最终产物都必须是一个导出 `skydimo_plugin_get_api` 的原生共享库。Skydimo 不关心这个库是由 CMake、Cargo、`dotnet publish`、Zig 还是其他工具链生成的。

### C / C++ SDK

C / C++ SDK 包含 `include/skydimo_plugin_c_api.h`。引入该头文件、填充 API 表，并编译为共享库。C++ 必须把导出函数放在 `extern "C"` 中，避免符号名被改写。

```c
#include "skydimo_plugin_c_api.h"

static int32_t effect_create(const SkydimoHostApiV1* host, void** out_instance) {
    (void)host;
    *out_instance = NULL;
    return 0;
}

SKYDIMO_EXPORT int32_t skydimo_plugin_get_api(
    uint32_t requested_abi_version,
    const SkydimoHostApiV1* host,
    SkydimoPluginApiV1* out_api) {
    (void)host;
    if (out_api == NULL || requested_abi_version != SKYDIMO_NATIVE_C_ABI_VERSION) {
        return -1;
    }

    *out_api = (SkydimoPluginApiV1){0};
    out_api->size = sizeof(SkydimoPluginApiV1);
    out_api->abi_version = requested_abi_version;
    out_api->kind_mask = SKYDIMO_PLUGIN_KIND_EFFECT;
    out_api->effect.size = sizeof(SkydimoEffectApiV1);
    out_api->effect.create = effect_create;
    return 0;
}
```

典型构建流程：

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

把生成的库复制到 `entry` 声明的对应平台路径。

### Rust SDK

Rust SDK 应提供由 C SDK 生成的 `abi` 模块，并在可能时提供更高层封装。插件 crate 需要构建为 `cdylib`，这样输出才是原生共享库，而不是仅供 Rust 使用的库。

```toml
[lib]
name = "my_native_effect"
crate-type = ["cdylib"]
```

```rust
use skydimo_plugin_rs::abi::*;

#[no_mangle]
pub unsafe extern "C" fn skydimo_plugin_get_api(
    requested_abi_version: u32,
    _host: *const SkydimoHostApiV1,
    out_api: *mut SkydimoPluginApiV1,
) -> i32 {
    std::panic::catch_unwind(|| {
        if out_api.is_null() || requested_abi_version != SKYDIMO_NATIVE_C_ABI_VERSION {
            return -1;
        }

        unsafe {
            *out_api = SkydimoPluginApiV1 {
                size: std::mem::size_of::<SkydimoPluginApiV1>() as u32,
                abi_version: requested_abi_version,
                kind_mask: SKYDIMO_PLUGIN_KIND_EFFECT,
                effect: SkydimoEffectApiV1 {
                    size: std::mem::size_of::<SkydimoEffectApiV1>() as u32,
                    ..SkydimoEffectApiV1::default()
                },
                ..SkydimoPluginApiV1::default()
            };
        }
        0
    })
    .unwrap_or(-100)
}
```

典型构建流程：

```bash
cargo build --release
```

Rust 的 panic 必须在返回 Core 前被捕获。不要让 unwind 穿过导出的 C ABI 函数，也不要让它穿过任何由 Core 调用的回调。

### C# SDK

C# native-c 插件必须产出原生库，而不是普通托管程序集。使用 C# SDK 中的 NativeAOT 模板，或其他原生导出机制，让最终 `.dll`、`.so` 或 `.dylib` 导出 `skydimo_plugin_get_api`。

```csharp
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
public unsafe struct SkydimoPluginApiV1
{
    public uint size;
    public uint abi_version;
    public uint kind_mask;
    // SDK 包会提供完整的 ABI 结构体定义。
}

public static unsafe class PluginExports
{
    [UnmanagedCallersOnly(EntryPoint = "skydimo_plugin_get_api")]
    public static int GetApi(uint requestedAbiVersion, void* host, SkydimoPluginApiV1* outApi)
    {
        if (outApi == null || requestedAbiVersion != 3)
        {
            return -1;
        }

        outApi->size = (uint)sizeof(SkydimoPluginApiV1);
        outApi->abi_version = requestedAbiVersion;
        return 0;
    }
}
```

典型构建流程：

```bash
dotnet publish -c Release -r win-x64 /p:PublishAot=true
```

要分发多个目标平台时，需要分别 publish。每个平台的原生输出都放到对应的 `entry` 路径。

### 其他语言

其他语言只要满足同一 ABI 约定即可使用：

- 产出平台共享库。
- 导出未改名的 `skydimo_plugin_get_api` 符号。
- 结构体布局、整数大小、指针所有权和回调调用约定与 C SDK 一致。
- 阻止异常、panic 或语言运行时错误穿过 FFI 边界。

如果该语言需要额外运行时文件，请把这些文件放进插件包，并保持所有路径都相对于插件目录。

## 生命周期 API

### Effect

Core 会为每次灯效分配创建一个 native effect 实例：

```text
create -> resize -> update_params_json -> tick -> destroy
```

`tick` 接收宿主管理的 RGB buffer，并必须原地填充。

### Controller

控制器插件会先通过 `match` 规则匹配硬件，再创建实例：

```text
create(candidate) -> validate -> init -> update(frame)* -> disconnect -> destroy
```

控制器可以使用类型化宿主回调进行串口/HID I/O 和输出注册，也可以用 `call_json` 处理低频宿主操作。

### Extension

扩展运行在 Core 管理的独立线程中：

```text
create -> start -> callbacks/events -> stop -> destroy
```

扩展回调包含设备扫描请求、广播事件、页面消息和设备帧投递。

## 宿主能力

C ABI 同时暴露类型化回调和 `call_json`：

| 区域 | 示例 |
|------|------|
| 通用 | `log`、`get_plugin_id`、`call_json` |
| Effect | `effect_audio_capture`、`effect_screen_capture`、`effect_album_art` |
| Controller | `controller_add_output`、`controller_get_rgb_bytes`、`controller_write`、`controller_read`、HID feature report |
| Extension | `extension_lock_leds`、`extension_unlock_leds`、`extension_set_leds_rgb`，以及面向设备、scope、网络、HTTP、HID、进程、通知、页面消息的 JSON 调用 |

高频或大块数据路径优先使用类型化回调。低频控制或更适合语言中立表达的 API 可使用 `call_json`。

## 构建与打包流程

1. 下载对应语言的 SDK 包。
2. 为每个目标平台构建 release 共享库。
3. 将每个输出文件复制到 `manifest.json` 的 `entry` 声明路径。
4. 从分发包中排除开发期文件。
5. 通过 Skydimo 插件导入流程安装，或以插件归档包形式分发。

平台 key 当前使用以下形式：

| Platform key | 典型产物名 |
|--------------|------------|
| `windows-x86_64` | `my_plugin.dll` |
| `windows-aarch64` | `my_plugin.dll` |
| `linux-x86_64` | `libmy_plugin.so` |
| `linux-aarch64` | `libmy_plugin.so` |
| `macos-x86_64` | `libmy_plugin.dylib` |
| `macos-aarch64` | `libmy_plugin.dylib` |

文件名不会从插件 id 推断。Core 只会加载 `entry` 中声明的路径。

## ABI 与安全规则

- 使用与 `manifest.json` 中 `abi` 匹配的下载 SDK 包进行构建。
- 所有 ABI 结构体布局必须与 C SDK 保持兼容。
- 填充 API 表前先校验 `requested_abi_version`。
- 按 SDK 要求填写所有 `size` 字段。
- 除非 SDK 明确说明生命周期，否则不要在回调生命周期之外保存宿主拥有的指针。
- 不要让异常或 panic 穿过 FFI 边界。
- 失败时返回负状态码。
- 将 native-c 插件视为可信原生代码：它们运行在 Core 进程内。
