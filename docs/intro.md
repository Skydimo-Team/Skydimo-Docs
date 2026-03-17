---
sidebar_position: 1
slug: /intro
---

# Welcome to Skydimo

**Skydimo** is a cross-platform RGB lighting control application with a powerful **Lua plugin system** for extending device support and creating custom lighting effects.

## Who is this for?

- **End users** wanting to learn about Skydimo's features and how to use it
- **Plugin developers** looking to create custom effects, hardware drivers, or integrations
- **Third-party integrators** building on the WebSocket API

## Architecture at a Glance

Skydimo uses a **Core + UI** separation:

```
┌─────────────────────────────────┐
│  Core Process (core.exe)        │
│  ├─ Lighting Manager            │
│  ├─ Lua Plugin Runtime          │
│  ├─ WebSocket JSON-RPC Server   │
│  └─ System Tray                 │
└──────────┬──────────────────────┘
           │ WebSocket JSON-RPC 2.0
┌──────────▼──────────────────────┐
│  UI (Desktop / Browser)         │
│  └─ React SPA                   │
└─────────────────────────────────┘
```

- **Core** is a standalone native executable handling device management, the lighting engine, plugin runtime, and WebSocket server.
- **UI** is a React frontend communicating with Core via WebSocket JSON-RPC 2.0. It can run as a desktop app or in a standard browser.

## Quick Links

| Topic | Description |
|-------|-------------|
| [Architecture](guide/architecture) | Detailed system architecture |
| [Features](guide/features) | Software capabilities overview |
| [WebSocket API](api/websocket-overview) | JSON-RPC 2.0 protocol reference |
| [Plugin Development](plugins/overview) | Build your own plugins |
