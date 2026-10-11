# OEM build and runtime contract

Skydimo, AARGB, AARGB2, Apex, MageeLife and VIB share one codebase and one Windows
build entry. AARGB2 is a deeply customized OEM product: its workspace and device
interaction can remain specialized while identity, Core lifecycle, packaging and
release verification follow the same contract as every other OEM.

## Extension boundaries

| Concern | Owner | How a customer customizes it |
| --- | --- | --- |
| Product identity | `branding/<id>.json` | Name, bundle identifier, logos, support destinations |
| Presentation | Simple/OEM UI modules | Choose an existing layout or implement another reusable layout module |
| Lighting policy | Core, selected by brand configuration | `control.linkedControl`, manufacturer admission |
| Device and effect capabilities | Core and plugins | Controller/effect extensions and declared capabilities |
| Plugin composition | Brand selection and release policy | Select supported roots and exclude plugin identities |
| Build and delivery | Shared scripts | Same entry, immutable Core artifacts, brand-specific staging |

A new customer that uses an existing layout and protocol adds configuration,
artwork and preset data. A new interaction or hardware protocol can require a UI
module or plugin; it must not require another release script or a forked Core.
Do not infer device or linked-control policy from a page-layout name.

## Brand identity and connection admission

The branded build resolves one configuration snapshot. Vite embeds its public
metadata; Tauri embeds the expected identity and packages the snapshot and tray
artwork. The shell explicitly selects the matching snapshot when it launches
Core. An installed shell uses its own resource directory instead of a stale
inherited environment setting. Development uses the selected generated snapshot.

Core rejects a missing, malformed or mismatched explicitly selected configuration.
An independent Core with no explicit selection retains its default lookup behavior.
Core remains brand-neutral at compile time so the same verified binary can be
reused by multiple OEM packages.

Control-channel authentication, runtime profile and configuration namespace checks
remain required. The brand identity is checked when attaching to an existing Core.
The frontend then checks the active brand and control policy after WebSocket
authentication and before exposing the connection, application RPCs or events.
This check runs again on reconnect. A mismatch never changes another running
product's identity or stops its process automatically.

`control.linkedControl` is `allowed` by default and `disabled` for AARGB2.
Core enforces this policy for RPC and extension callers and clamps persisted
linked state. Frontend presentation follows that policy independently of layout.
The source `manufacturerAllowlist` only restricts devices when
`device.enforceManufacturerAllowlist` is true. UNSET/UNPROVISIONED diagnostics
remain separate from customer identity and do not make those devices controllable.

## Plugin composition

Supported roots are `simple`, `built-in`, and the platform-specific `macos` root.
Missing or empty `includeRoots` retains the legacy platform default; empty does
not mean a package with no plugins. Unknown, duplicate and unsafe roots fail
validation. A new arbitrary source directory requires an explicit extension of
the packaging and runtime contract.

`scripts/plugin-composition.mjs` resolves selection and independently inventories
prepared files. Windows preparation and the generated Tauri resource map contain
only selected roots. Core uses the same root semantics for bundled discovery.
The global release policy still applies, and `exclude` applies both during
packaging and runtime loading. Advanced user/development plugin sources are not
redefined by this bundled-root selection.

Verification compares actual roots, plugin identities and entry files with the
selected source plugins. It rejects missing or extra roots/plugins, duplicate
identities, excluded plugins and missing entries. This is independent of whether
the copier reported success.

## Build and delivery

Use `scripts/brand-build.mjs` from the repository root. `prepare` generates
configuration and artwork, `build` builds the frontend, `desktop-dev` runs the
desktop development build, and `desktop-build` produces the Windows installer.
Use `--brand <id>` explicitly in automation.

Each desktop release has a generated plan binding the brand snapshot, effective
Tauri configuration, Core provenance, resource map, version and build identifier.
After packaging, an artifact manifest records exact outputs and final checksums.
Proof, collection and smoke tests consume this plan; they must not select an EXE
by modification time or assume a Skydimo filename.

Collection preserves the selected brand, effective configuration and preparation
marker alongside the installer. `release-plan.mjs verify-collected` validates
these files without reopening checkout paths, so a later OEM build cannot erase
the evidence needed to verify a previous collected package.

The legacy Skydimo distribution keeps both shells and Launcher. Its Simple
binary remains `skydimo-simple.exe`, distinct from Advanced `skydimo.exe` on
case-insensitive Windows filesystems. OEM packages without Advanced omit both
Advanced and Launcher. The shared backend remains `skydimo-core.exe`.

Signing can change a staged PE binary. Core source-artifact checksums describe
the original immutable artifact; final distribution checksums describe signed
outputs. Content verification must distinguish PE signature changes from changes
to executable content and must check Lua/JSON resources exactly.

Tauri temporarily patches its main executable's bundle-type marker for NSIS and
restores the Cargo output afterward. The signing hook captures the final patched
main executable for this build before packaging completes. Artifact checksums
and signature checks use that captured input, and extracted/installed files must
match it exactly; the restored Cargo executable is not the installed binary.

The checkout build lock protects shared frontend and Cargo outputs. Customer
staging and collected artifacts use brand-specific directories. Build sequentially
in a checkout or use isolated CI checkouts. The fixed control port still means
runtime smoke tests on the same host must run sequentially.

The Windows smoke test must use this build's staged or installed package, perform
authenticated RPC, and verify its identity and policy. A prepared-resource smoke
test is not an installation test. Installation, upgrade, tray reopening, autostart
and uninstall need a separate clean Windows test environment. Only the process
created by a test may be terminated by its cleanup.

## Verification levels

1. `npm run test:oem-build`: configuration, shared-Core compatibility, build
   orchestration, preset parsing, plugin preparation and release-proof tests.
   Mocked orchestration tests do not prove that NSIS produced a usable installer.
2. Frontend tests and actual builds for standard, Apex and AARGB2 layouts. Include
   a synthetic customer with a new ID to detect hidden brand-name conditionals.
3. Rust unit tests and strict Core clippy. Check both Tauri shells when modifying
   launch/attach behavior; do not run Rust formatters in this repository.
4. Real Windows packaging and authenticated startup checks for every shipped OEM.
   Verify actual package resources, not only source configuration.
5. Clean-machine installation and upgrade acceptance before customer distribution.

Acceptance includes AARGB2 → Apex → AARGB2 sequential builds, stale environment
variables, malformed brand snapshots, cross-brand attachment, reconnection, a
single selected plugin root, and a new OEM that reuses an existing deep layout.

OEM macOS/Linux installers, simultaneous Core services for several brands, and
customer-owned account/telemetry services remain separate platform or product
extensions. Existing Skydimo-only service restrictions remain explicit.
