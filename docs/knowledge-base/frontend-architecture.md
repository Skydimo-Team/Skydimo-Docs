---
sidebar_position: 4
description: Advanced React UI structure, state flow, transport, backend-driven rendering, and environment limits.
---

# Frontend Architecture

This page describes the Advanced frontend in `src/`. Simple UI has a separate
application under `simple/src/` and reuses many concepts with a different
workspace.

## Composition

```text
main.tsx
└─ providers: i18n, Chakra, platform, toaster
   └─ App.tsx
      ├─ AppLayout + TitleBar + Sidebar
      ├─ HomePage
      ├─ DeviceDetail
      ├─ PluginsPage / ExtensionPageView
      ├─ SettingsPage
      └─ global update, telemetry-consent, and close dialogs
```

`App.tsx` stores an `activeView` discriminated union and conditionally renders
pages. There is no React Router. Navigation state is not represented in the
URL, so browser history, deep links, and page restoration after refresh are
not available.

## Communication layers

| Layer | Responsibility |
|---|---|
| `services/transport.ts` | WebSocket lifecycle, JSON-RPC correlation, profile handshake, timeout, reconnect, events |
| `services/api.ts` | Named Core operations plus Tauri-only and direct HTTP integrations |
| `services/config.ts` | Optimistic AppConfig queue, cache, persistence, browser fallback |
| `services/logger.ts` | Structured frontend diagnostics and Core session correlation |
| `services/frontendErrors.ts` | Window/Promise/React error reporting |

Components and hooks should call `api.ts`, not construct WebSocket method
strings directly.

The Advanced transport expects the `advanced` runtime profile, uses a 30-second
RPC timeout, and retries ordinary disconnects after two seconds. Event
listeners remain registered across reconnects.

## State and hooks

Global business state is intentionally small and backend-driven:

- `useDevices` owns device snapshots, selected Scope, and device events.
- `useEffects` loads the effect catalog.
- `useLedStream` applies high-frequency preview frames.
- `useLedLocks` follows lock snapshots/events.
- `useStartupStatus` and `useStartupToast` expose background readiness.
- `useNotifications` renders Core notifications.
- `useMemberAuth` performs browser authorization and listens for auth changes.
- `useUpdateCheck` owns update state and dialog behavior.

Most UI state is local React state. The matrix editor is a deliberate local
exception: it uses Zustand and zundo for canvas state and undo/redo.

## Backend-driven effect controls

Core returns effect metadata and parameters. `ParamRenderer` dispatches:

| Parameter type | Renderer |
|---|---|
| `slider` | `SliderRenderer` |
| `range-slider` | `RangeSliderRenderer` |
| `select` | `SelectRenderer` |
| `toggle` | `ToggleRenderer` |
| `color` | `ColorRenderer` |
| `multi-color` | `MultiColorRenderer` |

Dependencies can hide or disable a control. Parameter groups are collapsible
and their UI state is stored in browser local storage. Screen/audio selectors
appear from effect permissions, not effect IDs.

High-frequency controls use a latest-value throttling pattern for live preview
and a settled commit followed by authoritative refresh.

## Device tree and Scope selection

`SidebarDeviceTree` renders Device → Output → Segment while
`utils/scope.ts` normalizes compressed paths:

- hide a single output;
- render segments only when multiple segments are meaningful;
- redirect stale/invalid selections to a valid Scope; and
- allow LED-preview regions to select their Scope.

The detail view resolves selected/effective mode, brightness, power, source,
lock, and conflict states from the latest device DTO.

## Desktop and browser capability boundary

The same Advanced SPA can run in Tauri or a browser. `isTauri` gates many
integrations, but the boundary is not perfect.

Clearly desktop-only operations include:

- real autostart and close behavior;
- tray/window controls and profile switching;
- custom screen-region overlay;
- local layout-preset file operations;
- local extension pages; and
- feedback package upload.

Some desktop-oriented controls remain visible in browser mode and may only
persist a local preference or fail to perform an OS action. Browser behavior
should be tested before it is promised as a supported end-user path.

## Styling, localization, and motion

- Chakra UI v3 supplies primitives.
- Project wrappers live under `src/components/ui/`.
- Colors are defined through variables in `src/styles/theme.css`.
- Lucide supplies icons.
- Framer Motion supplies page and list transitions.
- i18next resources currently cover eight locales.
- Core/plugin `LocalizedText` is resolved through `src/i18n/localizedText.ts`.

## Current UI limitations

- No built-in help center or help route.
- No global user-facing error page.
- Some RPC failures are logged without a toast.
- Device runtime errors are carried in DTOs but the detail UI mainly exposes
  device FPS.
- Marketplace result sets are limited and have no pagination/detail page.
- Update acceptance opens a download URL instead of installing in-app.
- Home currently contains only device cards and scanning; historical
  news/recommended-plugin code is not active.

