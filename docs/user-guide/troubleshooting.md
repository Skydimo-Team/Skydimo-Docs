---
sidebar_position: 1
description: Diagnose Core connection, device discovery, effects, plugins, capture, and configuration problems.
---

# Troubleshooting

## The UI cannot connect to Core

1. Check the connection dot beside Home.
2. Restart the desktop application.
3. Allow local loopback traffic to `127.0.0.1` in security software.
4. If using a browser, verify the full
   `?ws=ws://127.0.0.1:<port>` parameter.
5. Confirm that the UI and Core use the same `advanced` or `simple` profile.

A profile mismatch is terminal for that browser session. Ordinary network
disconnects retry every two seconds.

## Core is connected but effects or devices are still missing

The WebSocket port is published before plugin initialization and device
discovery complete. Wait for startup messages or query the startup status.
Warnings may identify the failed stage.

## A connected device does not appear

- Select **Scan Devices**.
- Reconnect the USB cable and avoid charge-only cables.
- Check that the relevant controller plugin is enabled.
- Close software that may exclusively own the device.
- On Windows, follow any CH340 driver diagnostic shown by Simple UI.
- Inspect Core logs if hardware is detected but validation fails.

Serial/HID discovery and network-device discovery use different paths. A
controller must match and validate the candidate before it becomes a device.

## Skydimo paused a device because of conflicting software

Close the named application first. Ignoring the warning allows Skydimo to
continue, but two applications writing the same hardware can cause flicker,
wrong colors, or device damage. Use the override only when the hardware is
known to support safe sharing, then re-enable protection.

## Controls have no visible effect

- Check whether the selected Scope or device is powered off.
- Check whether the setting is inherited from a parent.
- Reveal fully locked devices and inspect LED lock owners.
- Disable or configure the extension that owns the locks.
- Open device information and check runtime state/FPS.

Some operation failures are currently recorded only in logs rather than shown
as a toast.

## Screen effect has no source or does not update

- Confirm that the effect declares screen capture support.
- Select a valid display and region.
- Reduce sampling resolution or FPS.
- On Windows, try another capture method.
- Use the desktop app for visual custom-region selection.
- Check operating-system capture permissions on supported platforms.

## Audio effect has no source or does not react

- Confirm that the effect declares audio capture support.
- Select the default output or another input/output device.
- Reset audio preprocessing.
- Increase amplitude carefully and review averaging/normalization values.
- Confirm the operating system exposes the selected audio endpoint.

## A plugin will not install or load

- Wait for plugin initialization to finish.
- Use a `.skyplugin` package in Advanced mode.
- Confirm that the package contains a valid manifest and entry file.
- For local development, use the development plugin directory and Refresh.
- Check Core logs for manifest, permission, ABI, entry, or page errors.
- Remember that Simple mode does not import user packages.

For extension pages, a local `page` requires the desktop app. An external
`page_url` must be HTTP(S). If a page fails, use **Reload** and inspect both
webview and Core logs.

## Configuration directories do not match

Settings can show separate Core and shell directories. Open both using the
provided buttons, back them up, and identify which running binary/profile is
authoritative. Do not copy or delete live configuration files while Core is
writing them.

Advanced and Simple mutable state intentionally live in separate profile
directories.

## Collect information for support

Record:

- app version and runtime profile;
- device/controller/plugin IDs;
- exact reproduction steps;
- the diagnostic ID shown in Settings; and
- whether the problem occurs in Advanced, Simple, desktop, or browser mode.

The desktop feedback action packages sanitized logs and selected configuration.
Alternatively, open the configuration/log locations from Settings and review
them before sharing.

