# silicaui-mcp

A local [MCP](https://modelcontextprotocol.io) server for **Silica UI**. It gives
your AI coding assistant real, extracted-from-source answers about the design
system — exact CSS class names, real component props, working usage examples,
composed blocks, and the behavior contract — instead of guessing.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/silicaui-mcp.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-mcp)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-mcp.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-mcp)
[![license](https://img.shields.io/npm/l/silicaui-mcp.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
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
claude mcp add silicaui -- npx -y silicaui-mcp
```

**Claude Desktop / other `.mcp.json`-style clients** — add to your MCP config:

```json
{
  "mcpServers": {
    "silicaui": {
      "command": "npx",
      "args": ["-y", "silicaui-mcp"]
    }
  }
}
```

**Cursor** — Settings → MCP → Add new MCP server, same command/args as above, or
add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "silicaui": {
      "command": "npx",
      "args": ["-y", "silicaui-mcp"]
    }
  }
}
```

No API key, account, or network access required after install — everything the
server answers with is bundled in the package.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_packages` | The Silica UI package family, purpose, install command, version. |
| `list_components({ package? })` | Component names + categories, optionally filtered to one package. |
| `get_component({ name })` | A component's real props (from source) + a real usage example (from the playground). |
| `list_classes({ component? })` | Exact, literal CSS class names — extracted from the actual class generators. |
| `get_tokens()` | Semantic color list, light/dark values, typography tokens. |
| `list_blocks({ category?, tag? })` | Composed page blocks (hero, FAQ, feature grid, …), summary only. |
| `get_block({ key })` | One block's full node tree. |
| `list_behaviors()` / `get_behavior({ type })` | The `data-sui-*` interactive-behavior contract. |
| `search_docs({ query })` | Free-text search across components, blocks, and behaviors. |

## A note on versioning

This server ships a **static catalog**, regenerated from the Silica UI monorepo
and published in step with the rest of the family. It doesn't read your
project's actual installed `silicaui` version — for the fast-moving, mostly
additive pre-1.0 stage that's a fine trade for zero setup and zero dependency on
your project's module resolution. If you're pinned to an older Silica UI
version and hit a mismatch, pin `silicaui-mcp` to a matching release too.

## Links

- [silicaui.com](https://silicaui.com) — website & docs
- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
