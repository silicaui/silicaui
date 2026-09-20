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
  items={vessels}
  getItemId={(v) => v.id}
  getItemLabel={(v) => v.name}
  onReorder={setVessels}
  handle
  renderItem={(v, ctx) => (
    <>
      <span {...ctx.handleProps} aria-label={`Reorder ${v.name}`}>
        <GripIcon />
      </span>
      <span className="min-w-0 flex-1 truncate">{v.name}</span>
      <Badge color={toneFor(v)}>{statusOf(v)}</Badge>
    </>
  )}
/>
```

**The list and its rows come styled.** The `<ul>` gets `sortable-list` and every
row gets `sortable-item` — a flex row with a border, a surface, padding, a radius
and a lifted look while it is dragged. So `renderItem` returns what goes INSIDE
the row, not a second bordered box. (A single returned element is stretched to
fill the row, so a wrapper is fine when you want one.) Add to the row with
`itemClassName`.

`ctx.handleProps` already carries the handle’s class — grab and grabbing cursors,
a hover ink and a focus ring. Spreading it and then setting `className` replaces
that, so merge instead: `className={cx(ctx.handleProps.className, "ml-1")}`.

**Name your items.** `getItemLabel` is what a person who is not using a mouse
hears: *“Picked up MV Hakuhō Maru, position 3 of 9.”* Without it the
announcements fall back to the ids `getItemId` returns, which are keys, not
names.

## `<SortableList>` props

| Prop | Type |
| --- | --- |
| `items` | `T[]` — the ordered items |
| `getItemId` | `(item: T) => string \| number` — stable id, used for drag identity + React key |
| `getItemLabel` | `(item: T) => string` — what to call an item in the live announcements. Falls back to the id |
| `onReorder` | `(items: T[]) => void` — called with the reordered array after a drag or keyboard move |
| `renderItem` | `(item: T, ctx: SortableItemContext) => ReactNode` — the row’s CONTENTS. `ctx.isDragging` + `ctx.handleProps` (spread onto your drag handle, or already on the row if no separate handle) |
| `handle` | `boolean` — drag only from the element you wire with `ctx.handleProps`. Default `false` (the whole row drags) |
| `className` | `string` — added to the `<ul>` |
| `itemClassName` | `string` — added to every row `<li>`, alongside the row’s own class |

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
