# @wizeworks/silicaui-builder

The visual site/page builder for **Silica UI** — editor chrome built entirely
ON [`@wizeworks/silicaui`](https://www.npmjs.com/package/@wizeworks/silicaui) (Tailwind v4 plugin)
and [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react), over a
framework-neutral document engine
([`@wizeworks/silicaui-html`](https://www.npmjs.com/package/@wizeworks/silicaui-html)). No bespoke
chrome: every panel, control, and canvas element is a Silica UI component.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-builder.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-builder)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-builder.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

> Pre-1.0 and under active development — expect breaking changes between
> minor versions until the API settles.

## Install

```bash
pnpm add @wizeworks/silicaui-builder @wizeworks/silicaui-react @wizeworks/silicaui @wizeworks/silicaui-html react react-dom
```

## Usage

```tsx
import { Builder } from "@wizeworks/silicaui-builder/react";

<Builder />;
```

`Builder` renders the full editor: Navigator (tree), Canvas (no iframe — a
recursive schema-to-DOM renderer with `@container` reflow per device width),
Palette (component/block insertion), and Inspector (two-tier class-set
controls — semantic chips + raw class editing). Host apps own persistence via
an `onChange` prop; the builder also keeps its own local crash-recovery copy
(IndexedDB) independent of the host.

## Package layout

| Entry | Contents |
| --- | --- |
| `@wizeworks/silicaui-builder` | Framework-neutral document engine (node schema, operations) |
| `@wizeworks/silicaui-builder/react` | The editor UI — `Builder` and its subcomponents |

## Links

- [silicaui.com](https://silicaui.com) — website & docs
- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui`](https://www.npmjs.com/package/@wizeworks/silicaui) — the CSS layer this package is chrome for
- [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react) — the component layer the builder's chrome is built from
