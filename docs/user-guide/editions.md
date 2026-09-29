---
sidebar_position: 2
description: Understand Advanced, Simple, desktop, and browser operation before choosing a workflow.
---

# Editions and Operating Modes

Skydimo has two runtime profiles and two ways to host a UI. The UI and Core
profile must match.

## Advanced and Simple profiles

| Capability | Advanced | Simple |
|---|---|---|
| Main experience | Device tree and detailed per-Scope controls | Unified, reduced-complexity device view |
| Runtime profile | `advanced` | `simple` |
| User plugin packages | Marketplace/import and development plugins | Bundled `simple` and `built-in` plugins only |
| LED layout | Full point, linear, matrix, and preset editor | Safe LED-count editing for eligible linear outputs |
| Effect pause | Available | Disabled |
| Capture sampling and audio preprocessing | User-configurable | Fixed by the Simple profile |
| Stored state | `profiles/advanced/` | `profiles/simple/` |

Authentication, telemetry consent, launcher metadata, and the Core control
token live in the shared application root. Mutable lighting, device, and plugin
state is separated by profile so that Simple UI cannot rewrite Advanced
settings.

:::note
Only one Core process can own the global control socket at a time. If the
opposite profile is already running, the desktop shell must shut it down before
starting the requested profile.
:::

## Desktop mode

The desktop application uses a Tauri shell. It can:

- start or attach to Core and verify the selected runtime profile;
- register operating-system startup behavior;
- show the close-to-tray or exit workflow;
- open configuration/plugin directories;
- visually select a custom screen region;
- scan and save local LED layout presets;
- host local extension pages; and
- package and submit diagnostic feedback.

On Windows, the Advanced title bar includes **Switch to Simple UI**. Simple UI
has a guarded path back to Advanced mode. Switching requires the matching
frontend executable to be installed beside the current application.

## Browser mode

A browser UI connects to an already-running Core using an explicit URL:

```text
http://<ui-host>/?ws=ws://127.0.0.1:<core-port>
```

The Advanced browser bundle verifies that Core reports the `advanced` profile;
the Simple bundle expects `simple`. A mismatch is treated as a terminal
connection error.

Browser mode is useful for development and local integrations, but it does not
replace desktop system integration:

- local extension `page` files are desktop-only; external `page_url` pages may
  work in a browser;
- screen-region visual selection, layout preset files, feedback upload, tray,
  autostart, and real window-close behavior require Tauri;
- app preferences are stored in browser local storage;
- some desktop-oriented controls may still be visible but cannot perform their
  operating-system action.

Use the desktop application for the complete end-user workflow.

