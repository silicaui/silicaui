---
"@wizeworks/silicaui-builder": minor
---

Container layout controls in the Inspector — the parent side of flex/grid, per-axis padding, and flex-child sizing. The Design tab could style a node but not **arrange its children**: a Row block inserted from the palette came in wearing `flex`, and there was no UI to change its justification, gap, direction, or wrap once it was on the canvas.

- **Display gates the arrangement rows** — `justify-*` / `items-*` / `gap-*` / `flex-*` are inert on a plain block, so those rows only appear once the node is a flex or grid container. Display reads back out of the class set, so a node that already wears `flex` opens with the rows already expanded. Switching display **drops the classes the new display can't honor** (a `flex-col` left behind on a grid, a `grid-cols-3` left on a flex row), so the class set never carries inert leftovers.

- **Per-axis padding expands the shorthand instead of dropping it** — `p-4` covers both axes, so editing one axis has to leave the other standing. Picking a new Padding X on a `p-8` node now rewrites it as `px-2 py-8` rather than silently zeroing the vertical padding. The opposite axis is looked up **by index** across three deliberately index-aligned scales, which is what keeps every emitted class a literal string — a composed `py-${n}` is invisible to the `@source` safelist scan. The scale also now reaches `p-10`/`p-12`/`p-16`, which the palette already bakes onto sections.

- **Self size** — `flex-1` / `grow` / `flex-none` for a flex child, the main-axis counterpart to the existing cross-axis Self align. Like `self-*` it's offered unconditionally, since the governing parent isn't visible from the Inspector. `flex-auto` is deliberately absent: its natural label would be "Auto", which already means "clear this group" on every ChipGroup.

Covered by `e2e/container-layout.spec.ts`, which asserts **computed style** rather than `class` — canvas HTML is generated at runtime, so Tailwind never sees it, and only a painted `justify-content: space-evenly` proves the utility survived the safelist scan.
