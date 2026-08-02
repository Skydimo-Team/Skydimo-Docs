---
sidebar_position: 1
description: Start here to learn the Skydimo workspace, navigation, and normal operating flow.
---

# User Manual Overview

This manual describes the current Skydimo user experience implemented by the
Advanced UI in `src/`. Differences for the Simple UI and browser mode are
called out where they matter.

## A normal session

1. Start Skydimo and wait for the Core connection indicator to become
   connected.
2. Allow plugin initialization and the first device scan to finish.
3. On **Home**, select a detected device. Use **Scan Devices** if the device
   does not appear automatically.
4. Choose the device, output, or segment you want to control in the sidebar.
5. Select an effect, then adjust brightness and the effect's parameters.
6. Leave Core running in the tray if lighting should continue after the UI is
   closed.

Settings are generally persisted as soon as an action succeeds. The LED layout
editor is the notable exception: it keeps a draft until you select **Save**.

## Workspace map

| Area | Purpose |
|---|---|
| Title bar | Window controls and, on the Windows Advanced desktop build, switching to Simple UI |
| Home | Connected-device summary and manual device scan |
| Device tree | Device, output, and segment selection; power and linked-control actions |
| Extension shortcuts | Direct access to enabled extension pages; shortcuts can be pinned or unpinned |
| Plugins | Marketplace, package import, installed plugin state, and extension pages |
| Settings | Language, startup and close behavior, capture quality, shortcuts, privacy, updates, and support |
| Toasts | Startup progress, Core notifications, plugin operations, errors, and update status |

Skydimo does not use URL routes for its internal pages. Browser back/forward,
deep links to a device, and restoring the last page after refresh are not
currently supported.

## Connection and startup status

The dot next to **Home** shows the UI-to-Core connection state and exposes the
local WebSocket address in its tooltip:

- **Connected** — normal operation.
- **Connecting** — Core is starting or the UI is reconnecting.
- **Disconnected** — device and lighting operations cannot be completed.

Core announces its WebSocket port before all background initialization has
finished. Startup toasts separately report plugin initialization, device
discovery, and extension startup. A visible workspace therefore does not
always mean every effect or extension is ready yet.

## Device control hierarchy

The control hierarchy is:

```text
Device → Output → Segment
```

The sidebar compresses simple paths:

- A single-output device normally hides the Output node.
- Segment nodes appear only when an output has multiple segments.
- The detail page always resolves the selected item to the most appropriate
  backend Scope.

See [Devices and effects](device-control) for inheritance, linked control,
screen/audio sources, and LED locks.

## Where to continue

- [Choose an edition](editions)
- [First launch and device setup](getting-started)
- [Control devices and effects](device-control)
- [Configure LED layouts](led-layout)
- [Manage plugins](plugin-management)
- [Configure Skydimo](settings)
- [Troubleshooting](troubleshooting)

