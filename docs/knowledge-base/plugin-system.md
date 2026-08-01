---
sidebar_position: 5
description: Plugin discovery, runtime dispatch, manifests, lifecycle, permissions, pages, and development behavior.
---

# Plugin System

This page is a maintainer-level overview. For schemas and callable APIs, use
the [Plugin Development Reference](../plugins/overview).

## Types and active runtimes

| Type | Purpose | Lua | native-C |
|---|---|:---:|:---:|
| Controller | Validate hardware, expose outputs/settings, send frames | Yes | Yes |
| Effect | Render logical color buffers | Yes | Yes |
| Extension | Background integrations, devices, locks, custom pages | Yes | Yes |

The manifest parser recognizes additional runtime names such as WASM,
ABI-stable, and process, but active registries currently dispatch only Lua and
native-C.

Directory names such as `effect.example` are a convention, not a loader
requirement. `manifest.json` determines type and ID.

## Scan sources and precedence

Full mode scans, in order:

1. installed plugins under the profile plugin root;
2. direct development plugins under `plugins/dev`;
3. the bundled plugin root;
4. bundled `simple`; and
5. bundled `built-in`.

Simple mode scans only bundled `simple` and `built-in`. Earlier sources win
when the same type and ID appear more than once.

Imported packages are stored under a stable hash-derived directory, not a
human-readable `<type>.<id>` path. Managed data also uses a hash-derived
directory. Plugin code should use host-provided paths such as `ext.data_dir`.

## Packages and packs

Advanced mode imports `.skyplugin`/ZIP packages. A normal plugin package
contains a manifest and entry. A `type: "pack"` manifest explicitly lists
child plugin directories; nested packs are not supported.

`.skyignore` uses gitignore-style patterns during packaging/import, and `.git/`
is always ignored.

## Manifest summary

Normal manifests require:

- `id`;
- `version`;
- `name`;
- `publisher`;
- `type`;
- `language`; and
- `entry`.

`entry` may be a string or a platform/architecture map. The resolved path must
remain inside the plugin directory and exist. Lua entries must return a table.

Type-specific highlights:

- Controllers require `match`; serial and HID matching are active. The parser
  accepts USB/mDNS protocol values, but candidate matching currently connects
  serial/HID only.
- Effects can declare category, icon, parameters, and resource permissions.
- Extensions can declare either a local `page` or external `page_url`, not
  both.
- Native-C plugins must declare a supported ABI and export
  `skydimo_plugin_get_api`.

## Lua lifecycle

### Controller

```text
match candidate
→ open device
→ optional on_validate()
→ optional on_init()
→ require at least one device:add_output(...)
→ on_tick(dt_seconds) per frame
→ on_config(table) on device-setting change
→ on_shutdown() on drop
```

A false/error validation result rejects the candidate and allows another
controller to try it.

### Effect

```text
load entry
→ on_init()
→ on_params(table)
→ on_tick(elapsed_seconds, buffer, width, height)
→ on_shutdown()
```

A missing/failing tick produces black output. Screen effects remain not-ready
until capture succeeds.

### Extension

```text
start dedicated thread
→ inject ext APIs
→ on_start()
→ dispatch scan/frame/page/device/lock/system/media callbacks
→ on_stop()
→ remove devices, release locks, close process/network resources
```

Extension callback errors are logged and the loop continues. Frame delivery is
non-blocking; a slow extension can lose frames rather than block a Runner.

## Permission model

Actively enforced resource permissions include:

- effect: `screen:capture`, `audio:capture`, `media:album_art`;
- extension: `system:info`, `media:session`, `system:process`,
  `system:window-focus`, `network:tcp`, `network:http`, `network`, `process`,
  `hardware:hid`, and `native`;
- controller: `system:info` controls `host.system`.

Some controller I/O/log declarations and many extension device/Scope/admin APIs
currently act as metadata or are not separately permission-gated. Documentation
must describe actual enforcement and should not imply a stronger sandbox than
the runtime provides.

Lua extensions that request `native` use an unsafe Lua environment so they can
load approved C modules/DLL dependencies. Ordinary Lua plugins use the safer
environment.

## Extension page communication

Local extension pages are desktop-only. The shell injects:

```js
window.__SKYDIMO_EXT_PAGE__ = { extId, wsUrl, locale };
```

Communication uses Core WebSocket messages:

- extension → page: `ext.page_emit(data)` broadcasts
  `ext-page-message:<extension_id>`;
- page → extension: JSON-RPC `ext_page_send` with `{extId, data}` invokes
  `on_page_message(data)`.

This is not a generic `window.postMessage` bridge, and there is no universal
built-in page SDK at present.

## Development and refresh

Put direct development plugins under the resolved profile's `plugins/dev`
source and use **Refresh Plugins**. Refresh:

- stops/restarts extensions;
- rescans manifests and runtimes;
- triggers hardware discovery; and
- restarts active runners.

Core logs contain manifest, entry, permission, ABI, page, and callback errors.
Native-C libraries use shadow copies to avoid Windows DLL locking during
reload.

Checked-out examples include bundled Skydimo HID/motherboard/serial
controllers, native-C Simple effects, Lua development effects, and Lua/native-C
extensions. Some `.gitmodules` plugin entries may not be checked out in a
given workspace and should not be treated as runnable examples until present.

