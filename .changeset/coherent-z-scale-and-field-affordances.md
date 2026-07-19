---
"@wizeworks/silicaui": minor
---

Give the system a coherent z-scale, and one shared field-affordance geometry.

**z-scale.** Every globally-stacked surface now reads a token instead of a
locally-chosen literal: `--z-drawer` (40), `--z-dialog` (50), `--z-lightbox`
(60), `--z-popover` (70), `--z-tooltip` (80), `--z-toast` (90). The ordering rule
is that a transient surface outranks anything it can be opened from.

This fixes a real bug: every popover-class surface (`.dropdown`, `.popover`,
`.select-popup`, `.navigation-menu`, `.preview-card`, the calendar popup) sat at
`z-index: 50` while `.dialog` sat at `51`, so **any picker opened inside a modal
rendered underneath it**. No component prop could fix it — a child can't
out-stack its own parent's level — so apps were patching it in global CSS.

Note the changed defaults if you have hand-tuned z-indexes against the old
values: popovers moved `50 → 70`, tooltips `50 → 80`, and toasts `9999 → 90`.
Each token is overridable, so `:root { --z-toast: 9999 }` restores the old top.

**Field affordances.** The native `<select>` caret, the listbox trigger's
chevron, and the Combobox / MultiSelect clear + open buttons were three
independent implementations that had drifted apart — a solid gradient wedge at
one trailing inset, a stroked SVG chevron at another, a third inside a round
button at a third — so a Select and a Combobox stacked in one form showed
visibly different marks at visibly different positions. They now derive from a
single contract (`lib/field-affordance.js`): same mark, same ink, same trailing
inset, same rotation-on-open.

The most visible change is the native `<select>`, which now draws a **stroked**
chevron matching the SVG one rather than a solid wedge. It's still painted with
gradients — a `<select>` can carry neither a child nor a reliable
pseudo-element, and an SVG data-URI can't resolve a CSS var — so the mark still
follows the theme.
