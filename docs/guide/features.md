---
sidebar_position: 2
---

# Features

An overview of Skydimo's capabilities.

## Device Management

- **Auto-discovery** — Automatically detects connected RGB devices via USB hot-plug (Serial, HID)
- **Multi-device** — Control multiple devices simultaneously, each with independent settings
- **Device tree** — Hierarchical device → output → segment structure for fine-grained control
- **Nicknames** — Assign custom names to devices for easy identification

## Lighting Effects

- **Built-in effects** — Includes essential effects like monochrome, rainbow, and matrix test
- **Lua effect plugins** — Install community effects or write your own in Lua
- **Parameterizable** — Each effect exposes configurable parameters (sliders, selects, toggles, colors)
- **Per-scope configuration** — Apply different effects to different outputs or segments on the same device

## Screen Capture

- **Display mirroring** — Capture screen content to drive ambient lighting
- **Multi-monitor** — Select which display to capture
- **Region selection** — Capture full screen, top, bottom, left, right, or a custom region
- **Configurable quality** — Adjust capture resolution and frame rate

## Audio Visualization

- **FFT analysis** — Real-time audio frequency analysis
- **Multiple audio devices** — Select any system audio input/output
- **Audio-reactive effects** — Build effects that respond to music and ambient sound

## Plugin System

Three types of Lua plugins extend Skydimo's capabilities:

| Type | Purpose | Example |
|------|---------|---------|
| **Controller** | Hardware device drivers | Serial LED controllers, HID keyboards |
| **Effect** | Visual lighting patterns | Rainbow, plasma, audio visualizer |
| **Extension** | Background services & integrations | OpenRGB bridge, custom protocols |

See the [Plugin Development Guide](../plugins/overview) for details.

## WebSocket API

- **JSON-RPC 2.0** — Standard protocol for full programmatic control
- **Event streaming** — Real-time device state changes and LED color updates
- **Authentication** — Secret-based auth for secure connections
- **Browser-compatible** — Use from any WebSocket client (browser, CLI, automation tools)

See the [WebSocket API Reference](../api/websocket-overview) for details.

## Cross-Platform

| Platform | USB Discovery | Screen Capture | Audio Capture | System Tray |
|----------|:---:|:---:|:---:|:---:|
| Windows  | WM_DEVICECHANGE | DXGI / GDI | WASAPI | tao + tray-icon |
| macOS    | IOKit | CoreGraphics | CoreAudio | tao + tray-icon |
| Linux    | Netlink | XCap | PulseAudio | tao + tray-icon |

## UI

- **React + Tauri** — Modern desktop app with native window management
- **Browser mode** — Also works as a standalone web UI (no Tauri required)
- **Dark/Light mode** — Automatic theme detection
- **Internationalization** — English and Chinese supported (i18next)
- **Backend-driven UI** — Effect parameters are rendered dynamically from Core metadata
