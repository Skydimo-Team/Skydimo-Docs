---
sidebar_position: 5
---

# Native-C Plugin Runtime

The `native-c` runtime loads a compiled shared library into Skydimo Core and calls it through the Skydimo C ABI. Use it when Lua is not enough: high-performance effects, low-level hardware integrations, or plugins written in C, C++, Rust, C#, Zig, or another language that can export a C ABI.

For the complete ABI function tables and host methods, see [Native-C API Reference](api/native-c-api).

## SDK Downloads

:::info Temporary links
These are placeholder links for future public SDK release artifacts.
:::

| Package | Placeholder download | Use it for |
|---------|----------------------|------------|
| C / C++ SDK | [skydimo-plugin-c-sdk.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-c-sdk.zip) | Canonical C ABI header, examples, and CMake-oriented starter files |
| Rust SDK | [skydimo-plugin-rs.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-rs.zip) | Rust ABI bindings, wrappers, and a `cdylib` template |
| C# SDK | [skydimo-plugin-csharp.zip](https://downloads.skydimo.com/sdk/native-c/v3/skydimo-plugin-csharp.zip) | NativeAOT-compatible structs, export helpers, and a `dotnet publish` template |

Direct header placeholder: [skydimo_plugin_c_api.h](https://downloads.skydimo.com/sdk/native-c/v3/skydimo_plugin_c_api.h).

All language packages target the same ABI. If a wrapper package disagrees with the C SDK about struct layout, constants, or callback signatures, treat the C SDK as authoritative.

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

## Native-C vs Lua Native Modules

Skydimo has two native mechanisms:

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

## Language Notes

| Language | Requirements |
|----------|--------------|
| C / C++ | Include the SDK header and export `skydimo_plugin_get_api`. C++ exports must use `extern "C"`. |
| Rust | Build a `cdylib`, export `skydimo_plugin_get_api`, and catch panics before returning to Core. |
| C# | Use NativeAOT or another native export mechanism. Core cannot load a normal managed-only `.dll`. |
| Other languages | Produce a platform shared library with an unmangled C export and SDK-compatible struct layout. |

## Build and Package Workflow

1. Download the SDK package for your language.
2. Build a release shared library for each target platform.
3. Copy each output file to the path declared by `manifest.json` `entry`.
4. Keep development-only files out of the distributable package.
5. Install through the Skydimo plugin import flow or distribute as a plugin archive.

The file name is not inferred from the plugin id. Core only loads the path declared by `entry`.

## Safety Rules

- Build against the SDK package that matches the `abi` in `manifest.json`.
- Keep all ABI structs layout-compatible with the C SDK.
- Validate `requested_abi_version` before filling the API table.
- Do not store host-owned pointers beyond the documented callback lifetime.
- Do not throw exceptions or unwind across FFI.
- Return negative status codes for failures.
- Treat native-c plugins as trusted native code: they run inside the Core process.
