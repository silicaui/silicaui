# @wizeworks/silicaui-dnd

Silica UI drag-and-drop — [dnd-kit](https://dndkit.com/) wrapped in a
Silica-styled `<SortableList>`, plus the full dnd-kit primitive set re-exported
for custom drag surfaces.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-dnd.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-dnd)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui-dnd.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-dnd)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wizeworks/silicaui-dnd?style=flat-square)](https://bundlephobia.com/package/@wizeworks/silicaui-dnd)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-dnd.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add @wizeworks/silicaui-dnd @wizeworks/silicaui-react
pnpm add -D @wizeworks/silicaui tailwindcss
```

## Usage

```tsx
import { SortableList } from "@wizeworks/silicaui-dnd";

<SortableList
  items={items}
  getItemId={(item) => item.id}
  onReorder={setItems}
  renderItem={(item, ctx) => (
    <div className={ctx.isDragging ? "opacity-50" : ""}>
      <span {...ctx.handleProps}>⠿</span> {item.label}
    </div>
  )}
/>
```

## `<SortableList>` props

| Prop | Type |
| --- | --- |
| `items` | `T[]` — the ordered items |
| `getItemId` | `(item: T) => string \| number` — stable id, used for drag identity + React key |
| `onReorder` | `(items: T[]) => void` — called with the reordered array after a drag or keyboard move |
| `renderItem` | `(item: T, ctx: SortableItemContext) => ReactNode` — `ctx.isDragging` + `ctx.handleProps` (spread onto your drag handle, or the whole row if no separate handle) |

Also re-exports dnd-kit's core and sortable primitives — `DndContext`,
`DragOverlay`, sensors (`PointerSensor`, `KeyboardSensor`, …),
`SortableContext`, `useSortable`, `arrayMove`, collision strategies, and
`CSS` — so you can build custom drag surfaces (kanban boards, canvas drops)
without a separate dnd-kit install.

## Links

- [silicaui.com](https://silicaui.com) — website & docs

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react) — the component layer this package extends
