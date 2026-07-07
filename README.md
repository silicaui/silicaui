# Silica UI

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/silicaui.svg?style=flat-square)](https://www.npmjs.com/package/silicaui)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-react.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-react)
[![license](https://img.shields.io/npm/l/silicaui.svg?style=flat-square)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/silicaui/silicaui/pulls)

A design system for **Tailwind CSS v4**, in two core layers plus a family of
optional composite packages:

- **`silicaui`** — the "daisyUI" layer. A Tailwind v4 plugin that ships 76
  semantic, themeable component classes (`btn`, `btn-primary`, `card`,
  `dialog`, …) driven by an extensible OKLCH color-token engine. CSS-first: no
  `tailwind.config`, just `@plugin "silicaui"` in your CSS. Framework-agnostic.
- **`silicaui-react`** — the "shadcn" layer. 90 thin React components that
  apply Silica classes and delegate interaction behavior to
  [Base UI](https://base-ui.com).
- **`silicaui-html`** — the framework-neutral node-tree source + HTML
  projection powering the visual builder and any structured host.
- **Composite packages** — heavier engines (charts, tables, rich text,
  drag-and-drop, resizable panels) kept out of the core so it stays
  dependency-light; install them only when you need them.

## Status

Early, but growing fast: 76 CSS component families, 90 React components, a
full theme-customization API (extensible N-color engine, optional class
prefixing), and five composite packages wrapping best-in-class engines. See
[`examples/playground`](./examples/playground).

```bash
pnpm install
pnpm dev        # open the playground
```

## Packages

| Package | What it is |
| --- | --- |
| [`silicaui`](./packages/silicaui) | Tailwind v4 plugin — tokens, themes, color engine, 76 component classes |
| [`silicaui-react`](./packages/silicaui-react) | 90 React components over the Silica classes, behavior via Base UI |
| [`silicaui-html`](./packages/silicaui-html) | Framework-neutral node-tree source + HTML projection |
| [`silicaui-charts`](./packages/silicaui-charts) | `<Chart>`/`<Sparkline>` — Apache ECharts, auto-themed to Silica tokens |
| [`silicaui-table`](./packages/silicaui-table) | `<DataTable>` — TanStack Table, sort/select/paginate |
| [`silicaui-editor`](./packages/silicaui-editor) | `<RichTextEditor>` — TipTap with a Silica-styled toolbar |
| [`silicaui-dnd`](./packages/silicaui-dnd) | `<SortableList>` — dnd-kit primitives + a styled sortable list |
| [`silicaui-panels`](./packages/silicaui-panels) | `<ResizablePanelGroup>` — react-resizable-panels with a styled handle |
| [`examples/playground`](./examples/playground) | Vite app that consumes the packages above |

`silicaui-builder` (the visual builder) lives in this monorepo but is not yet
published — it's mid-refactor onto the React component set above.

## Contributing

This is a pnpm workspace. Every change that should ship gets a changeset:

```bash
pnpm changeset          # describe what changed and which packages it affects
```

A bot opens a "Version Packages" PR batching pending changesets; merging it to
`main` publishes the affected packages to npm. See
[`.github/workflows/release.yml`](./.github/workflows/release.yml).

## Links

- [silicaui.com](https://silicaui.com) — website & docs
- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)

## License

[MIT](./LICENSE)
