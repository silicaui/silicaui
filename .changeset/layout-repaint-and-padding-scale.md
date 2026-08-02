---
"@wizeworks/silicaui-builder": patch
---

Fix two builder defects reported from a real host integration.

**Layout mode never repainted the canvas.** `Editor.activeRootNode` handed back
the LIVE tree root, and node edits mutate that tree in place — so the object
identity never changed and anything memoizing on it (the canvas's `useResolved`,
`React.memo`, a host's own view) kept rendering the pre-edit tree. Edits landed
in the model, saved, and published; they just weren't visible until a reload, and
only in Layout / Component mode (Page mode reads a per-commit clone from
`extract()`). It bit only hosts that resolve data, since resolution is what puts
a memoized copy between the model and the screen. `activeRootNode` is now a
defensive snapshot with a fresh identity per commit — same guarantee `extract()`
already gave the page tree. Probe: `pnpm verify:repaint`.

**A padding value above the control's ceiling couldn't be overwritten.** A class
group only stripped its own listed members, so on a section authored `py-20` —
what most starter heroes carry — picking 16 appended `py-16` and left `py-20`
standing, which won in Tailwind's source order. Computed padding never moved.
A group that enumerates a numeric SCALE now owns that whole scale (`py-0 … py-16`
owns `py-20`, `py-[3rem]`, `py-px`), so any step is replaceable and `Auto` really
clears. Derived, so every numeric group — `gap-*`, `grid-cols-*`, a host's own —
gets the same fix; groups of NAMED values (`text-left/center/right`,
`rounded-*`) keep membership semantics, since owning a shared prefix there would
strip a node's color and size. The padding scale itself now runs to 32, so the
control can express a hero's own spacing rather than only overwrite it.

Consumers that generate a Tailwind safelist from `CANVAS_UTILITY_CLASSES`
(`@wizeworks/silicaui-builder/vocab`) pick up `p/px/py-20|24|32` on rebuild.
