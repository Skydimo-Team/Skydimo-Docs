---
sidebar_position: 1
description: Control power, brightness, effects, screen/audio sources, and hierarchical Scopes.
---

# Devices and Effects

## Select a Scope

Skydimo stores and resolves lighting state at three levels:

```text
Device → Output → Segment
```

Select a node in the sidebar or a region in the LED preview. The sidebar hides
redundant single-output and single-segment levels, but Core still resolves the
operation to a concrete Scope.

An output or segment may inherit its effect from a parent. The UI distinguishes
the locally selected value from the effective value after inheritance.

## Power and brightness

The power action applies to the selected Scope. At a parent level it is
recursively applied to the underlying render targets; a parent appears off
when all relevant children are off.

Brightness is resolved with the active mode's inheritance:

- A following child displays the effective parent brightness.
- Choose **Set independently** when the UI offers it to create a local mode
  selection and then adjust brightness.
- Slider movement is previewed rapidly; the settled value is committed when
  the interaction finishes.

## Linked control

Use the linked-control button in the device tree to control devices through a
shared root and shared effect timeline. The current UI describes this as
synchronizing effect switching across devices. Some related Core operations
also use the shared state, but workflows should not assume that every device
setting is mirrored.

Use the separate all-devices power action to turn every device on or off.

## Choose and configure an effect

Effects are grouped using metadata returned by Core. Favorites are shown in a
separate category and are stored as an app preference.

The settings panel is generated from the selected effect's metadata. Supported
controls are:

- slider;
- range slider;
- select;
- toggle;
- color; and
- multi-color.

Parameters can be grouped, and a dependency can hide or disable a parameter.
Use **Restore default parameters** to reset the current effect on the selected
Scope. **Pause mode** freezes an active effect without selecting another one;
pause is not available in the Simple profile.

## Screen-reactive effects

An effect that declares `screen:capture` exposes:

- display selection;
- full, top, bottom, left, or right capture regions; and
- a custom physical-pixel rectangle.

The desktop application can visually select a custom region. Browser mode can
display coordinate controls but cannot open the Tauri selection overlay.

Global sampling method, resolution budget, and frame rate are configured in
Settings. Windows can offer DXGI, Windows Graphics Capture, and GDI methods,
depending on the build and platform support.

## Audio-reactive effects

An effect that declares `audio:capture` exposes audio-device selection and
preprocessing controls. The default output option follows the operating
system's default output device.

Available preprocessing settings include amplitude, averaging mode and size,
FFT window, decay, filter constant, normalization offset, and normalization
scale. Use **Reset** to return the selected Scope to the inherited/default
audio-processing state.

## Locks and conflict protection

Extensions may lock individual LEDs. A partial lock shows the locked count and
owners; a full lock means the extension currently controls every LED in the
Scope. Fully locked devices are hidden from the tree by default and can be
revealed with the locked-device visibility control.

Skydimo can also pause control when known conflicting software is running. The
safety view identifies the process and can link to troubleshooting. Ignoring
the warning resumes output but can cause flicker, incorrect colors, or hardware
problems if two applications write simultaneously. Re-enable protection after
testing.

## Device tools

The device header and context menu can expose:

- device or output rename;
- automatic or manual controller selection;
- device-specific controller settings;
- horizontal/vertical layout flip where supported;
- LED layout editing; and
- identity, controller, output, conflict, and runtime-FPS information.

Horizontal flip applies to linear, matrix, and preset layouts. Vertical flip
applies to matrix and preset layouts.

