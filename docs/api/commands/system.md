---
sidebar_position: 6
---

# System Commands

Commands for system information, Core runtime status, app-level configuration, and global capture/control settings.

## get_system_info

Returns detailed host information, including OS, motherboard, BIOS, CPU, GPU, and RAM.

```json
→ {"jsonrpc":"2.0","method":"get_system_info","id":1}
← {"jsonrpc":"2.0","result":{
  "os": {"platform": "Windows", "version": "Microsoft Windows 11 Pro", "build": "22631", "arch": "x86_64", "hostname": "MY-PC"},
  "motherboard": {"manufacturer": "ASUSTeK COMPUTER INC.", "model": "ROG STRIX"},
  "bios": {"vendor": "American Megatrends Inc.", "version": "2803"},
  "cpu": {"name": "AMD Ryzen 9 5900X", "cores": 12, "threads": 24},
  "gpu": [{"name": "NVIDIA GeForce RTX 3080", "vramMb": 10240}],
  "ram": {"totalMemoryMb": 32768, "modules": []}
},"id":1}
```

---

## get_startup_status

Return Core startup task state for plugins, device discovery, and extensions.

```json
→ {"jsonrpc":"2.0","method":"get_startup_status","id":1}
← {"jsonrpc":"2.0","result":{
  "plugins": {"state": "complete"},
  "deviceDiscovery": {"state": "running", "detail": "Scanning USB"},
  "extensions": {"state": "complete"}
},"id":1}
```

`state` is `pending`, `running`, `complete`, or `failed`. Plugin import progress may appear under `plugins.progress`.

---

## Config Directory

### get_core_config_dir

Return Core's configuration directory path.

```json
→ {"jsonrpc":"2.0","method":"get_core_config_dir","id":1}
← {"jsonrpc":"2.0","result":"C:/Users/.../Skydimo","id":1}
```

### open_core_config_dir

Ensure Core's configuration directory exists and open it in the system file manager.

```json
→ {"jsonrpc":"2.0","method":"open_core_config_dir","id":1}
← {"jsonrpc":"2.0","result":null,"id":1}
```

---

## Screen Capture Settings

These settings affect screen-capture based effects globally.

| Command | Purpose |
|---------|---------|
| `get_capture_max_pixels` | Return the current capture pixel budget; `0` means no limit |
| `set_capture_max_pixels` | Set the capture pixel budget |
| `get_capture_fps` | Return capture sampling FPS |
| `set_capture_fps` | Set capture sampling FPS |
| `get_capture_method` | Return the active capture backend |
| `set_capture_method` | Set the active capture backend |

```json
→ {"jsonrpc":"2.0","method":"set_capture_max_pixels","params":{"maxPixels":921600},"id":1}
→ {"jsonrpc":"2.0","method":"set_capture_fps","params":{"fps":30},"id":2}
→ {"jsonrpc":"2.0","method":"set_capture_method","params":{"method":"dxgi"},"id":3}
```

`set_capture_max_pixels` and `set_capture_fps` fail when simple mode locks screen capture sampling. Common capture methods are `dxgi`, `gdi`, and `graphics` on Windows, `screencapturekit` on macOS, and `xcap` on Linux.

---

## Linked Control

Linked control redirects most effect, parameter, brightness, pause, screen-source, audio-source, and audio-processing changes into a shared root state and synchronizes that state to all devices.

### get_linked_control

```json
→ {"jsonrpc":"2.0","method":"get_linked_control","id":1}
← {"jsonrpc":"2.0","result":{"enabled":true},"id":1}
```

### set_linked_control

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Defaults to `false` |
| `sourcePort` | string? | Scope to snapshot when enabling |
| `outputId` | string? | Optional output scope |
| `segmentId` | string? | Optional segment scope; requires `outputId` |

```json
→ {"jsonrpc":"2.0","method":"set_linked_control","params":{
  "enabled":true,
  "sourcePort":"COM3",
  "outputId":"out1"
},"id":1}
```

---

## Shortcuts

### get_shortcuts_config / set_shortcuts_config

Query or replace global shortcut bindings. Missing or empty accelerators are normalized by Core.

```json
→ {"jsonrpc":"2.0","method":"set_shortcuts_config","params":{
  "config":{
    "bindings":[
      {"action":"turn_all_lights_off","accelerator":"Control+Alt+Shift+F10"}
    ]
  }
},"id":1}
```

Known actions are `turn_all_lights_on`, `turn_all_lights_off`, `toggle_all_lights`, `increase_all_brightness`, and `decrease_all_brightness`.

---

## Locale

### set_locale

Set Core's current locale and emit `locale-changed`.

```json
→ {"jsonrpc":"2.0","method":"set_locale","params":{"locale":"zh-CN"},"id":1}
```
