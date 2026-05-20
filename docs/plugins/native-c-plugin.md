---
sidebar_position: 4
---

# Native-C Plugin Runtime

The `native-c` runtime loads a compiled platform shared library directly into Skydimo Core and calls it through the Skydimo C ABI. Use it when Lua is not the right fit: high-performance effects, low-level hardware integrations, or plugins written in C, C++, Rust, C#, Zig, or any language that can export a C ABI.

Skydimo does not load source code. A native-c plugin package must contain a compiled `.dll`, `.so`, or `.dylib`, and `manifest.json` tells Core which file to load for each platform.

For the complete ABI function tables and host methods, see [Native-C API Reference](api/native-c-api).

## Runtime Status

| Capability | Status |
|------------|--------|
| Effect plugins | Supported |
| Controller plugins | Supported |
| Extension plugins | Supported |
| Current ABI | `skydimo-*-c-v3` |
| Supported ABI versions | `v2..v3` |
| Runtime model | In-process shared library |
| Update behavior | Core shadow-copies the entry library before loading it |

Reserved manifest runtimes such as `wasm`, `abi-stable`, and `process` are not active plugin runtimes yet.

## SDK Downloads

:::info Temporary links
The links below are placeholders for the public SDK release artifacts. They describe the intended package split and will be replaced with real release links.
:::

| Package | Placeholder download | Use it for |
|---------|----------------------|------------|
| C / C++ SDK | [skydimo-plugin-c-sdk.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-c-sdk.zip) | The canonical C ABI header, C examples, and CMake-oriented starter files |
| Rust SDK | [skydimo-plugin-rs.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-rs.zip) | Rust ABI bindings, safer wrappers, and a `cdylib` template |
| C# SDK | [skydimo-plugin-csharp.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-csharp.zip) | NativeAOT-compatible structs, export helpers, and a `dotnet publish` template |

Direct header placeholder: [skydimo_plugin_c_api.h](https://downloads.skydimo.com/sdk/native-c/v3/skydimo_plugin_c_api.h).

All language packages target the same ABI. If a wrapper package disagrees with the C SDK for struct layout, constants, or callback signatures, treat the C SDK as authoritative and update the wrapper before building.

Do not copy ABI structs from this documentation into production code. The snippets below explain the shape of the integration; the SDK package should provide the real declarations.

## Native-C vs Lua Native Modules

Skydimo has two different native mechanisms:

| Mechanism | Manifest shape | Use case |
|-----------|----------------|----------|
| Lua C module loading | `language: "lua"` plus `native` manifest block and `native` permission | A Lua plugin uses `require()` to load C modules |
| Native-c runtime | `language: "native-c"` plus `abi` and shared-library `entry` | The plugin itself is a native shared library |

A native-c plugin does not need the `native` permission just to be loaded. It still needs the permissions required by the host capabilities it calls.

## Package Layout

An installable native-c plugin package must include the compiled library declared by `entry`:

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

Source files, build directories, local test output, and toolchain caches do not need to ship with the plugin. Use `.skyignore` to exclude `target/`, `bin/`, `obj/`, temporary logs, and local debug files.

## Manifest

Use `language: "native-c"` and declare the ABI family that matches the plugin type:

| Plugin type | Recommended `abi` |
|-------------|-------------------|
| `effect` | `skydimo-effect-c-v3` |
| `controller` | `skydimo-controller-c-v3` |
| `extension` | `skydimo-extension-c-v3` |
| Any type | `skydimo-native-c-v3` |

The generic `skydimo-native-c-v3` ABI can be used when one binary exposes more than one plugin API family, but type-specific ABI identifiers are clearer.

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

`entry` can also include `default`. All entry paths must be relative to the plugin directory and cannot escape it.

## Export Contract

Every native-c library must export this symbol:

```c
SKYDIMO_EXPORT int32_t skydimo_plugin_get_api(
    uint32_t requested_abi_version,
    const SkydimoHostApiV1* host,
    SkydimoPluginApiV1* out_api);
```

Core calls this function immediately after loading the library. The function must fill `out_api`, set `abi_version` to the requested ABI version, and set `kind_mask` to the APIs provided by the binary:

| Mask | Meaning |
|------|---------|
| `SKYDIMO_PLUGIN_KIND_EFFECT` | Provides `SkydimoEffectApiV1` |
| `SKYDIMO_PLUGIN_KIND_CONTROLLER` | Provides `SkydimoControllerApiV1` |
| `SKYDIMO_PLUGIN_KIND_EXTENSION` | Provides `SkydimoExtensionApiV1` |

Return `0` or a positive value for success. Return a negative status for failure. Do not let exceptions or panics cross the FFI boundary.

## Choose a Language Package

No matter which language you use, the final output must be a native shared library that exports `skydimo_plugin_get_api`. Skydimo does not know whether the library was produced by CMake, Cargo, `dotnet publish`, Zig, or another toolchain.

### C / C++ SDK

The C / C++ SDK contains `include/skydimo_plugin_c_api.h`. Include that header, fill the API table, and compile a shared library. In C++, wrap exported functions in `extern "C"` to prevent name mangling.

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

Typical build flow:

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

Copy the produced library to the platform-specific path declared by `entry`.

### Rust SDK

The Rust SDK should provide an `abi` module generated from the C SDK and, when possible, higher-level helpers. Build the crate as a `cdylib` so the output is a native shared library instead of a Rust-only library.

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

Typical build flow:

```bash
cargo build --release
```

Rust panics must be caught before control returns to Core. Never allow unwinding across the exported C ABI function or any callback invoked by Core.

### C# SDK

C# native-c plugins must produce a native library, not a normal managed assembly. Use the C# SDK's NativeAOT template or another native export mechanism so the final `.dll`, `.so`, or `.dylib` exports `skydimo_plugin_get_api`.

```csharp
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
public unsafe struct SkydimoPluginApiV1
{
    public uint size;
    public uint abi_version;
    public uint kind_mask;
    // The SDK package provides the complete ABI struct definitions.
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

Typical build flow:

```bash
dotnet publish -c Release -r win-x64 /p:PublishAot=true
```

Repeat the publish step for each target runtime you want to distribute. Put each native output at the matching `entry` path.

### Other Languages

Other languages are supported when they can satisfy the same ABI contract:

- Produce a platform shared library.
- Export an unmangled `skydimo_plugin_get_api` symbol.
- Match the struct layout, integer sizes, pointer ownership, and callback calling convention from the C SDK.
- Prevent exceptions, panics, or language runtime errors from escaping over FFI.

If the language requires its own runtime files, ship those files inside the plugin package and keep paths relative to the plugin directory.

## Lifecycle APIs

### Effect

Core creates one native effect instance per effect assignment:

```text
create -> resize -> update_params_json -> tick -> destroy
```

`tick` receives the host-owned RGB buffer and must fill it in place.

### Controller

Controller plugins are matched by `match` rules before creation:

```text
create(candidate) -> validate -> init -> update(frame)* -> disconnect -> destroy
```

Controllers can use typed host callbacks for serial/HID I/O and output registration, or `call_json` for less frequent host operations.

### Extension

Extensions run on their own Core-managed thread:

```text
create -> start -> callbacks/events -> stop -> destroy
```

Extension callbacks include device scan requests, broadcast events, page messages, and device frame delivery.

## Host Capabilities

The C ABI exposes both typed callbacks and `call_json`:

| Area | Examples |
|------|----------|
| Common | `log`, `get_plugin_id`, `call_json` |
| Effect | `effect_audio_capture`, `effect_screen_capture`, `effect_album_art` |
| Controller | `controller_add_output`, `controller_get_rgb_bytes`, `controller_write`, `controller_read`, HID feature reports |
| Extension | `extension_lock_leds`, `extension_unlock_leds`, `extension_set_leds_rgb`, JSON calls for devices, scopes, network, HTTP, HID, process, notifications, page messages |

Use typed callbacks for high-frequency or bulk data paths. Use `call_json` for low-frequency control and APIs that are easier to keep language-neutral.

## Build and Package Workflow

1. Download the SDK package for your language.
2. Build a release shared library for each target platform.
3. Copy each output file to the path declared by `manifest.json` `entry`.
4. Keep development-only files out of the distributable package.
5. Install the package through the Skydimo plugin import flow or distribute it as a plugin archive.

Platform keys currently use this shape:

| Platform key | Typical artifact name |
|--------------|-----------------------|
| `windows-x86_64` | `my_plugin.dll` |
| `windows-aarch64` | `my_plugin.dll` |
| `linux-x86_64` | `libmy_plugin.so` |
| `linux-aarch64` | `libmy_plugin.so` |
| `macos-x86_64` | `libmy_plugin.dylib` |
| `macos-aarch64` | `libmy_plugin.dylib` |

The file name is not inferred from the plugin id. Core only loads the path declared by `entry`.

## ABI and Safety Rules

- Build against the downloaded SDK package that matches the `abi` in `manifest.json`.
- Keep all ABI structs layout-compatible with the C SDK.
- Validate `requested_abi_version` before filling the API table.
- Fill every `size` field required by the SDK structs.
- Do not store host-owned pointers beyond the callback lifetime unless the SDK explicitly documents that lifetime.
- Do not throw exceptions or unwind across FFI.
- Return negative status codes for failures.
- Treat native-c plugins as trusted native code: they run inside the Core process.
