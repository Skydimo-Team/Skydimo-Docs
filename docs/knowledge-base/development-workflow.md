---
sidebar_position: 7
description: Local development, validation, plugin iteration, and documentation maintenance workflow.
---

# Development Workflow

## Prerequisites

- Node.js 20 or newer for the documentation site; use the repository's current
  frontend engine/tooling requirements for the app.
- The Rust toolchain selected by `rust-toolchain.toml`.
- Platform build prerequisites required by Tauri, screen capture, audio, HID,
  and USB libraries.
- Initialized submodules for the documentation or plugin sources you intend to
  modify.

## Advanced frontend

From the repository root:

```powershell
npm ci
npm run test
npm run build
```

Useful scripts:

```powershell
npm run dev
npm run dev:desktop
npm run tauri dev
```

`dev:desktop` builds the development Core before starting Vite. Plain browser
development still needs a running compatible Core and the explicit `?ws=`
parameter.

## Rust Core validation

Any change under `core/` must pass the strict project check:

```powershell
cargo clippy --manifest-path core/Cargo.toml --all-targets --all-features -- -D warnings
```

Run focused tests while iterating, then the strict check before handoff.

:::caution
Do not run `cargo fmt` or `rustfmt` in this repository. The project explicitly
preserves its existing Rust formatting conventions.
:::

## Plugin development

For Advanced local development:

1. place the plugin source under the resolved profile plugin development
   directory;
2. ensure `manifest.json` resolves its entry/page/native files;
3. build page assets or native libraries;
4. use **Refresh Plugins**;
5. inspect Core logs and startup status; and
6. test enable/disable, restart, data persistence, and cleanup.

Build installable `.skyplugin` packages for distribution. Do not rely on the
human-readable source directory name after installation; Core installs by
hash.

## Documentation site

From `docs/`:

```powershell
npm ci
npm run typecheck
npm run build
```

Local preview:

```powershell
npm run start
npm run start:zh
```

English documents are in `docs/docs/`. Simplified Chinese translations mirror
them under
`docs/i18n/zh-Hans/docusaurus-plugin-content-docs/current/`.

## Validation by change type

| Change | Minimum validation |
|---|---|
| React component/hook | TypeScript build plus focused Vitest tests |
| Transport/API | Transport/API tests, frontend build, compatible Core smoke test |
| Core behavior/DTO | Focused Rust tests and strict Core clippy |
| Plugin manifest/runtime | Parser/runtime tests, refresh/reload, relevant example plugin |
| Tauri command | Rust tests/build plus desktop behavior on the target platform |
| Documentation | Docusaurus typecheck and full multilingual build |

Hardware-affecting changes should also use a safe device or simulator and
verify shutdown, reconnect, and error paths.

## Documentation update checklist

When behavior changes:

1. Identify the authoritative source and affected audience.
2. Update the user manual for visible workflow changes.
3. Update the knowledge base for architecture or ownership changes.
4. Update API/plugin reference pages for serialized contracts.
5. Update both English and Chinese content.
6. Search for the old term or method name across the entire documentation
   tree.
7. Build both locales and fix broken links.

Avoid copying mutable facts into several pages. Prefer one detailed reference
and link to it from overviews.

## Repository hygiene

The main repository and documentation/plugin submodules can each have
independent uncommitted work. Do not stage, reset, commit, switch branches, or
clean files unless the user explicitly requests it. Keep generated builds out
of reviewed source changes and preserve unrelated modifications.

