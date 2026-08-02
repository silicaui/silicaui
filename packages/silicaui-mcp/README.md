# @wizeworks/silicaui-mcp

A local [MCP](https://modelcontextprotocol.io) server for **Silica UI**. It gives
your AI coding assistant real, extracted-from-source answers about the design
system — exact CSS class names, real component props, working usage examples,
composed blocks, and the behavior contract — instead of guessing.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-mcp.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui-mcp.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-mcp)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-mcp.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Why

Every class name, prop, and usage example this server returns is **extracted
from Silica UI's actual source** at release time — never hand-written prose that
can drift out of date. `list_classes("button")` calls the real class generator;
`get_component("Select")` reads the real TypeScript props and a real, working
playground demo. If your assistant is about to write `<Button intent="primary">`
or `btn-purple`, this catches it before it ships.

## Install

**Claude Code:**

```bash
claude mcp add @wizeworks/silicaui -- npx -y @wizeworks/silicaui-mcp
```

**Claude Desktop / other `.mcp.json`-style clients** — add to your MCP config:

```json
{
  "mcpServers": {
    "@wizeworks/silicaui": {
      "command": "npx",
      "args": ["-y", "@wizeworks/silicaui-mcp"]
    }
  }
}
```

**Cursor** — Settings → MCP → Add new MCP server, same command/args as above, or
add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "@wizeworks/silicaui": {
      "command": "npx",
      "args": ["-y", "@wizeworks/silicaui-mcp"]
    }
  }
}
```

No API key, account, or network access required after install — everything the
server answers with is bundled in the package.

## The three delivery paths

Silica UI is one design system consumed three different ways, and the server
tells every connecting client so up front (via MCP `instructions`, which clients
surface before the first tool call) — because the choice is made *before* any
tool gets called, and getting it wrong is the most common way an integration
breaks.

| Path | Package | You write | Interactive? |
| --- | --- | --- | --- |
| **CSS** | `@wizeworks/silicaui` | Plain HTML + classes: `<button class="btn btn-primary">` | No — no JS ships |
| **React** | `@wizeworks/silicaui-react` | `<Button color="primary" size="lg">` | Yes, via Base UI |
| **HTML / node-tree** | `@wizeworks/silicaui-html` + `@wizeworks/silicaui-behaviors` | A node tree that projects to HTML with `data-sui-*` markers | Yes, once the behaviors runtime loads |

`get_component` answers on all three. Called without a `package`, it returns
every path's shape side by side so an assistant can see how they differ rather
than guessing which one it wants:

```jsonc
// get_component({ name: "Button" })
{
  "name": "button",
  "note": "\"Button\" exists on 3 delivery paths … they are not interchangeable.",
  "paths": [
    { "package": "@wizeworks/silicaui",       "root": "btn", "classes": ["btn", "btn-outline", …], "colorVariants": ["btn-primary", …] },
    { "package": "@wizeworks/silicaui-react", "props": [ … ], "usageExample": "…" },
    { "package": "@wizeworks/silicaui-html",  "category": "content", "label": "Button", "container": false, "behaviors": [] }
  ]
}
```

Pass `package` to get just one.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_packages` | The Silica UI package family, purpose, install command, version. |
| `list_components({ package? })` | Component names + categories across all three paths, optionally filtered to one package. |
| `get_component({ name, package? })` | A component's real shape on each path: CSS root class + classes + color variants, React props (from source) + a real usage example, or the `-html` macro and its behaviors. |
| `list_classes({ component? })` | Exact, literal CSS class names — extracted from the actual class generators. |
| `get_tokens()` | Semantic color list, the default theme's light/dark values, scalar + typography tokens, how to register extra color roles, and the `data-theme` mechanism those values are activated by. |
| `list_themes()` | Every shipped theme preset (what it's for, its faces and shape) plus the `data-theme` mechanism itself — how a theme is applied, how dark mode works, and how a section opts into its own palette by nesting the attribute. |
| `get_theme({ name, mode? })` | One theme's fully resolved token map — dark deltas merged, `-content` inks derived — with the exact attribute to write. |
| `list_blocks({ category?, tag? })` | Composed page blocks (hero, FAQ, feature grid, …), summary only. |
| `get_block({ key })` | One block's full node tree. |
| `list_behaviors()` / `get_behavior({ type })` | The `data-sui-*` interactive-behavior contract. |
| `get_node_schema({ section? })` | Path 3's document schema (`@wizeworks/silicaui-html`): the four node kinds, the typed system-metadata band, the data-binding vocabulary, the host resolution contract, and the tag/attribute allowlist `toHtml` enforces. |
| `list_email_nodes()` | The email builder's closed node schema (`@wizeworks/silicaui-builder/email`): every kind, what it may hold, what may hold it, the insertable presets, and the document envelope. |
| `get_email_node({ kind })` | One email node kind's real typed fields (with source docs) and its data-binding contract — which `attr` a bind may target. |
| `search_docs({ query })` | Free-text search across components, blocks, behaviors, classes, tokens, themes, node-tree bindings and allowed tags, and email node kinds. |

## A note on versioning

This server ships a **static catalog**, regenerated from the Silica UI monorepo
and published in step with the rest of the family. It doesn't read your
project's actual installed `@wizeworks/silicaui` version — for the fast-moving, mostly
additive pre-1.0 stage that's a fine trade for zero setup and zero dependency on
your project's module resolution. If you're pinned to an older Silica UI
version and hit a mismatch, pin `@wizeworks/silicaui-mcp` to a matching release too.

## Links

- [silicaui.com](https://silicaui.com) — website & docs
- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
