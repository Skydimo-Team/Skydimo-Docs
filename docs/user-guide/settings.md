---
sidebar_position: 2
description: Configure language, startup, capture, shortcuts, privacy, updates, accounts, and support.
---

# Settings

Open Settings from the lower-right sidebar action.

## Account

The Skydimo account card starts browser-based authorization and polls until the
request succeeds, fails, is cancelled, or expires. A cached login can be shown
as offline. Sign out from the same card.

## Preferences

### Language

The current UI resources include German, English (US), Spanish, French,
Russian, Turkish, Simplified Chinese, and Traditional Chinese. Locale changes
also update Core/plugin localized text.

### Start on system boot

Desktop mode can register Skydimo to start in the background. The autostart
launcher starts or attaches Core silently and then exits the UI shell.

### Closing the window

Choose **Ask every time**, **Close to tray**, or **Exit application**. Close to
tray exits the desktop UI but leaves Core and its tray process running.

Browser mode can store these preferences but cannot register autostart or
control a desktop window.

## Screen synchronization

Configure the global capture method, sampling resolution, and frame rate.
Higher settings improve color accuracy and motion smoothness at the cost of CPU,
GPU, and memory bandwidth.

On Windows, available capture methods can include:

- **DXGI** — high-performance default for most systems;
- **Windows Graphics Capture** — modern capture that can show a system border;
  and
- **GDI** — compatibility fallback with lower performance.

Resolution presets range from very small sampling budgets to original
resolution. Frame rate is configurable from 1 to 60 FPS. The Simple profile
locks sampling resolution/frame rate.

## Global shortcuts

Five system-wide actions are configurable:

- all lights on;
- all lights off;
- toggle all lights;
- increase all brightness by 5%; and
- decrease all brightness by 5%.

Focus a shortcut field and press the desired combination. Delete clears a
recording and Escape cancels it. Duplicate combinations are rejected.

## Privacy and diagnostics

The telemetry switch controls optional pseudonymous usage and diagnostic data.
The card also shows the diagnostic installation ID and links to the privacy
policy.

Feedback submission is desktop-only. It requires a message, accepts optional
contact information, and packages a bounded, sanitized subset of current and
rotated Core/Tauri/webview logs plus selected configuration. Review the notice
shown in the dialog before submitting.

## About, configuration, and updates

The About card shows operating-system, Tauri, and application versions. It can
open the configuration directory used by the running Core. If the shell and
Core resolve different directories, both locations are shown.

**Check for updates** queries the update service. When an update is accepted,
the current implementation opens the supplied download URL; it does not
perform an in-app binary installation.

## Contact

The contact card exposes supported email/community channels and desktop
feedback. Availability can vary by platform.

