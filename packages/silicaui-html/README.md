# silicaui-html

silicaui's **framework-neutral node-tree source** — the canonical
`Block`/`Document` shape, an authoring kit for building it, and a `toHtml`
projection. This is the format the Silica builder and any structured host (a
CMS, a static-site generator, an email renderer) read and write; React is a
separate *projection* of the same tree, never the source of truth.

[![npm version](https://img.shields.io/npm/v/silicaui-html.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-html)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-html.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-html)
[![bundle size](https://img.shields.io/bundlephobia/minzip/silicaui-html?style=flat-square)](https://bundlephobia.com/package/silicaui-html)
[![license](https://img.shields.io/npm/l/silicaui-html.svg?style=flat-square)](https://github.com/wize-works/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/wize-works/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/wize-works/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add silicaui-html
```

## Why a node tree, not JSX

- **One shape, everywhere.** A template, a live document, a stored record, and
  the input to every projection are the *same* tree. The only transform in the
  whole system is `template → document` (mint ids) — it runs at stamp,
  duplicate, and paste, nowhere else.
- **`class` is the sole styling surface.** No inline `style`, no style object.
  This is what makes the tree portable, themeable, and governable — a host
  gates class strings at one choke point.
- **JSON-serializable.** No functions, no JSX — the largest consumers render
  markup, not React, so the source has to be a static, walkable tree.

## Usage

```ts
import { el, atom, block, stamp, toHtml } from "silicaui-html";

const hero = block({
  root: el("section", "hero", {
    children: [
      atom("Heading", "text-4xl", { level: 1 }, ["Ship faster"]),
      el("p", "text-lg text-base-content/70", { text: "A design system that scales." }),
      atom("Button", undefined, { color: "primary" }, ["Get started"]),
    ],
  }),
});

const document = stamp(hero); // template → document: mints stable ids
const html = toHtml(document.root); // -> "<section class=\"hero\">…</section>"
```

Composed patterns (hero sections, FAQ accordions, feature grids) ship
pre-built under the `blocks` subpath:

```ts
import { heroSplitCta, faqAccordion, featureGrid } from "silicaui-html/blocks";
```

## What's in the package

| Export | Purpose |
| --- | --- |
| `schema` (types) | The canonical `Node`/`Block`/`Document`/`Template` shape |
| `el`, `atom`, `outlet`, `slot`, `behave`, `part`, `bind`, `repeat`, `action`, `block` | The authoring kit — build a well-formed tree by construction |
| `toHtml` | Project a tree to an HTML string |
| `toJson` | Project a tree to its JSON-serializable form |
| `stamp`, `stampTree`, `stripIds` | The template → document transform (mint/strip stable ids) |
| `lintBlock`, `assertBlockClean` | The block linter — catch malformed trees before they ship |
| `walk` | Tree traversal, shared with the Silica builder |
| `SURFACE_TOKENS`, `SEMANTIC_ROLES`, `SCALAR_TOKENS`, `THEME_PRESETS`, `rolesOf`, `colorValue`, `presetByName` | The theme model — the source of truth for a theme's color roles, scalar tokens, and preset library |

See the [architecture doc](https://github.com/wize-works/silicaui/blob/main/docs/silicaui-architecture.md)
for the full spec — node schema, projections, theme model, and the builder
engine seam.

## Links

- [GitHub repo](https://github.com/wize-works/silicaui)
- [Issues](https://github.com/wize-works/silicaui/issues)
