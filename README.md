# Skydimo Documentation

This Docusaurus site is the source of truth for the Skydimo user manual,
project knowledge base, WebSocket API reference, and plugin development
documentation.

## Installation

```bash
npm ci
```

## Local Development

```bash
npm run start
```

To preview the Simplified Chinese locale:

```bash
npm run start:zh
```

English source documents live in `docs/`. Simplified Chinese translations live
under `i18n/zh-Hans/docusaurus-plugin-content-docs/current/`.

## Build

```bash
npm run typecheck
npm run build
```

The production build validates both locales and fails on broken links.

## Content maintenance

- Treat current source code as authoritative when documentation and historical
  design notes disagree.
- Keep WebSocket command names in sync with `core/src/server/handler.rs` and
  `core/src/server/plugin_rpc.rs`.
- Keep frontend behavior in sync with `src/services/api.ts`, `src/App.tsx`, and
  the relevant feature directory.
- Keep plugin schemas and host APIs in sync with `core/src/plugin/`.
- Update the English source and Chinese translation in the same change.

The documentation site is a Git submodule of the main Skydimo repository.
Review its own working tree before committing changes.
