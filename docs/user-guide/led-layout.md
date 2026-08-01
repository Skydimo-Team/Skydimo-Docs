---
sidebar_position: 2
description: Build, preview, validate, and save point, linear, matrix, and preset LED layouts.
---

# LED Layout

The full layout editor is an Advanced desktop workflow. It is available only
for outputs whose controller reports editable layout capabilities.

## Open the editor

Open a device and select the LED-edit action from the detail header or context
menu. The dialog lists each editable output and its ordered segments.

Changes remain a draft until **Save**. Closing the dialog discards the draft.

## Segment types

| Type | Use |
|---|---|
| Point | Add one independently addressable LED |
| Linear | Add an ordered strip with a selected LED count |
| Matrix | Place LEDs in a two-dimensional map |
| Preset | Reuse a saved product/layout definition |

For linear outputs, physical offsets are derived from the order and LED count
of preceding segments. Reordering or resizing a segment can therefore change
the mapping of later segments.

## Matrix editing

The matrix editor supports:

- click or drag to add/remove cells;
- middle- or right-button drag to pan;
- wheel zoom;
- row-major, column-major, and serpentine automatic fill;
- invert and clear;
- undo and redo; and
- fit-to-view.

Selected cells map to zero-based physical LED indexes. Empty cells do not map
to hardware.

## Live hardware preview

While adding or editing a segment, the UI opens a temporary preview session and
sends colors to the relevant hardware output. The session is refreshed while
the editor remains active and expires automatically if the UI disappears.

The preview is not persisted. Saving the dialog writes the actual layout and
restarts the affected rendering state.

## Validation

Before saving, Skydimo checks each output against controller capabilities:

- total LEDs must not be below `min_total_leds`;
- total LEDs must not exceed `max_total_leds`; and
- controllers may additionally advertise a list of allowed totals.

If validation fails, adjust or remove segments and save again. A controller's
hardware limit cannot be bypassed safely from the UI.

## Layout transforms

Where the selected Scope supports them:

- **Horizontal flip** reverses the horizontal/linear layout direction.
- **Vertical flip** reverses the vertical direction of matrix or preset
  layouts.

Transforms are stored separately from the segment's physical LED count.

## Presets

The desktop UI can scan a local preset library, search it, filter by device
type, and group results by brand. A matrix draft can be saved as a reusable
preset with product name, brand, optional display name/type, and optional image
URL.

Preset directory scanning, saving, and directory opening use Tauri commands and
are not available in plain browser mode.

## Simple UI

Simple UI intentionally does not expose the full segment/matrix editor. For
eligible linear outputs it can adjust only a safe LED count within the
controller's declared capabilities.

