---
sidebar_position: 3
description: Scope resolution, persistence, device discovery, runner demand, rendering, locks, and previews.
---

# State, Discovery, and Rendering

## Persisted state

Core separates process-wide state from runtime-profile state.

| Location | Contents |
|---|---|
| Shared root | Launcher metadata, locale/shared app fields, auth, telemetry consent/data, control token |
| `profiles/<profile>/core.json` | Schema 3 capture settings, linked-control state, shortcuts |
| `profiles/<profile>/plugins.json` | Controller/effect/extension enabled maps |
| `profiles/<profile>/devices/*.json` | Identity history, controller settings, layout, and Scope configuration |
| `profiles/<profile>/plugins/` | Installed or development plugin files |
| `profiles/<profile>/data/` | Managed plugin data |
| `profiles/<profile>/layouts/` | Local layout presets |

Manager writes use temporary files followed by rename. Callers should still
avoid manually editing live files while Core is running.

## Scope normalization

A Scope reference is valid in one of these forms:

| Target | Fields |
|---|---|
| Device | `port` |
| Output | `port`, `outputId` |
| Segment | `port`, `outputId`, `segmentId` |

A segment without an output is invalid. Core canonicalizes a single-output
Device Scope to the Output and can collapse a sole Segment to its Output.
Frontend path compression mirrors this behavior.

## Selected and effective values

Mode state tracks:

- the effect explicitly selected at the Scope;
- the effective effect after Segment → Output → Device inheritance;
- effective parameters;
- pause state; and
- the Scope that supplied the effective value.

Brightness, screen source/region, audio source, and audio preprocessing follow
the active mode selection layer. A child can therefore display an effective
parent value until it creates a local mode selection.

Power is different. Parent operations recursively update underlying render
targets, and a non-leaf Scope is effectively off only when its children are
off. Rendering uses an internal turn-off effect to produce black.

## Linked control

Linked control owns a shared root and timeline. Several effect, brightness,
screen, and audio operations are redirected to that shared state and then
applied to devices. The UI currently presents its primary promise as linked
effect switching, so new behavior should be documented deliberately rather
than inferred.

## Device discovery

Initial discovery begins after plugin catalogs load:

1. enumerate serial and HID candidates;
2. try compiled Rust inventory controllers;
3. try matching runtime controller plugins;
4. restore identity/configuration and default effects;
5. publish a device snapshot.

`HardwareCandidate` currently represents Serial and HID only. mDNS devices use
a separate metadata, service-browser, and controller-factory path.

Platform hot-plug listeners are implemented with Windows device messages,
macOS IOKit, and Linux netlink. Discovery is serialized by a manager gate to
avoid overlapping scans. Manual scan reopens serial candidates; resume handling
also reopens HID candidates.

## Runner demand

A Runner is not a permanent task for every detected device. Demand exists when
at least one of these requires output processing:

- an active or turn-off effect;
- an LED lock;
- an LED edit-preview session; or
- a controller-exposed device setting.

Known process conflicts suppress a runner unless the user overrides protection.
When demand disappears, the runner stops.

## Rendering pipeline

Each device Runner uses a standard thread with a 60 FPS target:

```text
Resolve Scope targets
→ tick each Output/Segment effect runtime
→ map logical buffers into physical output indexes
→ apply brightness
→ apply extension LED locks
→ apply LED edit preview override
→ Controller::update(DeviceFrame)
```

Each output/segment can own an independent effect runtime. Layout maps allow
logical effects to render into linear, matrix, or preset physical arrangements.

Controller update failure can terminate that device's Runner, set runtime error
state, emit `device-runtime-status-changed`, and publish an error notification.

## LED preview streams

Core can emit `device-led-update` with:

```json
{
  "port": "device-port",
  "rgb": "<base64 RGB bytes>",
  "count": 60
}
```

The backend stream can approach the 60 FPS render target. The current Advanced
frontend decodes base64 on the main thread and throttles UI application to
about 33 ms; the existing `ledPreview.worker.ts` file is not wired into
`useLedStream.ts`.

## Locks and edit previews

Extensions can lock zero-based physical LED indexes and supply override colors.
Lock changes re-evaluate Runner demand and are exposed through snapshots/events.

LED layout editing creates a temporary output preview session. Preview updates
take precedence over normal lock output, are kept alive by the editor, expire
after inactivity, and are bounded to protect Core from oversized frames.

