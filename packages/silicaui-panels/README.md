# silicaui-panels

Silica UI resizable panels — [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
wrapped with a Silica-styled resize handle. Drop-in for split editors,
sidebars, and any layout that needs a draggable divider.

[![npm version](https://img.shields.io/npm/v/silicaui-panels.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-panels)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-panels.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-panels)
[![bundle size](https://img.shields.io/bundlephobia/minzip/silicaui-panels?style=flat-square)](https://bundlephobia.com/package/silicaui-panels)
[![license](https://img.shields.io/npm/l/silicaui-panels.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add silicaui-panels silicaui-react
pnpm add -D silicaui tailwindcss
```

## Usage

```tsx
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "silicaui-panels";

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={25} minSize={15}>Sidebar</ResizablePanel>
  <ResizeHandle />
  <ResizablePanel>Main content</ResizablePanel>
</ResizablePanelGroup>
```

- **`ResizablePanelGroup`** — the container. Pass `direction="horizontal"`
  (side-by-side) or `"vertical"` (stacked); size the group yourself, it fills
  its box.
- **`ResizablePanel`** — one region. Takes `defaultSize` / `minSize` /
  `maxSize` (percentages), `collapsible`, an imperative `ref`, and the rest of
  react-resizable-panels' `Panel` props.
- **`ResizeHandle`** — the draggable divider. Renders a centered grip by
  default; pass `children` for your own. Orientation is inferred from the
  parent group's direction.

Also re-exports react-resizable-panels' imperative helpers
(`getPanelElement`, `getPanelGroupElement`, `getResizeHandleElement`) and its
prop/handle types, so you can do programmatic resize/collapse and layout
persistence without a separate install.

## Links

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`silicaui-react`](https://www.npmjs.com/package/silicaui-react) — the component layer this package extends
