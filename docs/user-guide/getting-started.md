---
sidebar_position: 3
description: Launch Skydimo, complete the first-run choices, and connect the first device.
---

# Getting Started

## First launch

When the desktop UI starts, it first tries to attach to a compatible running
Core. If none exists, it starts the bundled `skydimo-core` executable and
validates the WebSocket port announced by Core.

The workspace can appear while Core continues background initialization.
Watch the startup messages for these stages:

1. Core connection
2. Plugin initialization
3. Device discovery
4. Extension startup

If a stage completes with warnings, the app remains usable and shows the
reported detail.

## Privacy choice

After the first successful connection, Skydimo asks whether it may send
optional usage and diagnostic data. Choose **Allow** or **Not now** to
continue. The choice can be changed later under **Settings → Privacy &
Data**.

The optional data is associated with a pseudonymous installation identifier.
The Settings page displays that diagnostic ID for support correlation.

## Connect a device

1. Connect the RGB device by USB, or make sure a supported network device is
   available on the local network.
2. Wait for automatic discovery.
3. If necessary, select **Scan Devices** on Home.
4. Select the device card to open its detail page.

Skydimo discovers serial and HID candidates through controller drivers and
uses a separate mDNS path for supported network devices. A detected hardware
candidate appears only after a compatible enabled controller validates it.

## Confirm basic control

On the device detail page:

1. Choose a simple effect.
2. Move the brightness slider.
3. Use the power button to turn the selected Scope off and on.
4. Confirm that the live LED preview and the hardware respond.

If a control inherits its value from a parent Scope, the UI may ask you to
create a local mode selection before brightness can be changed independently.

## Keep lighting running

Closing the desktop window offers three behaviors:

- **Ask every time** — show the choice on each close.
- **Close to tray** — exit the UI process while Core and its tray remain
  active.
- **Exit application** — close the UI and request Core shutdown.

Select **Remember my choice** to save the behavior. It can be changed later in
Settings.

## Browser connection

For development or browser-only use:

1. Start Core and read `CORE_PORT=<port>` from its standard output.
2. Open the appropriate UI bundle with
   `?ws=ws://127.0.0.1:<port>`.
3. Confirm that the connection indicator reports **Connected**.

The WebSocket listens only on `127.0.0.1`. Do not replace the address with a
LAN interface unless Core is deliberately redesigned with authentication and
an appropriate security model.

