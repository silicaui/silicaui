# @wizeworks/silicaui-panels

Silica UI resizable panels — [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
wrapped with a Silica-styled resize handle. Drop-in for split editors,
sidebars, and any layout that needs a draggable divider.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-panels.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-panels)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui-panels.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-panels)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wizeworks/silicaui-panels?style=flat-square)](https://bundlephobia.com/package/@wizeworks/silicaui-panels)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-panels.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add @wizeworks/silicaui-panels @wizeworks/silicaui-react
pnpm add -D @wizeworks/silicaui tailwindcss
```

## Usage

```tsx
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@wizeworks/silicaui-panels";

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

- [silicaui.com](https://silicaui.com) — website & docs

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react) — the component layer this package extends
