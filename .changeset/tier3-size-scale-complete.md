---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": minor
---

**Every sized component now ships the full `xs`–`xl` scale.**

Ten of twenty-nine sized components shipped a partial scale, so the same prop
worked on one component and did nothing on the next:

| Component | Shipped | Added |
| --- | --- | --- |
| `EmptyState` | `sm` | `xs` `md` `lg` `xl` |
| `FileInput` | `sm` `lg` | `xs` `md` `xl` |
| `MultiSelect` | `sm` `lg` | `xs` `md` `xl` |
| `TagInput` | `sm` `lg` | `xs` `md` `xl` |
| `Slider` | `sm` `lg` | `xs` `md` `xl` |
| `SegmentField` | `sm` `lg` | `xs` `md` `xl` |
| `Toolbar` | `sm` `lg` | `xs` `md` `xl` |
| `ToggleGroup` | `xs` `sm` `lg` | `md` `xl` |
| `Prose` | `sm` `lg` `xl` | `xs` `md` |
| `Pagination` | `xs` `sm` `md` `lg` | `xl` |
| `Meter` | `xs` `sm` `lg` `xl` | `md` |

Nothing errored when a size was missing — `size="xs"` just rendered at the
default, which reads as "the prop was ignored". The only way to learn which
sizes a component actually supported was to read its CSS, per component. For a
developer that's a papercut; for an agent generating code it's a silent
correctness failure.

The TypeScript unions were *honest* about this (`ToolbarSize = "sm" | "md" |
"lg"`), which is why typecheck never flagged it — the types faithfully
described an inconsistent system. They're now all `SilicaSize`, because the CSS
backs it. `EmptyState`'s wrapper also hard-coded `size === "sm"`, so it would
have ignored the new classes even once they existed.

Each component was extended along its **own** ladder rather than a generic one:
field-height components follow the `×6/8/10/12/14` `--size-field` ramp that
`Input` establishes, while `Meter` (track height), `Slider` (rail/thumb),
`Prose` (font/line-height), `Pagination` (cell size) and `ToggleGroup` (item
height, which is offset because the item sits inside track padding) keep their
existing proportions.

`-md` is now declared explicitly everywhere rather than left implicit in the
base rule. React wrappers may still omit it, but the class-first layers —
vanilla markup and `silicaui-html` — author `class="foo foo-md"` by hand, and
that has to resolve.

Guarded by `packages/silicaui/scripts/verify-size-scale.mjs`, which fails the
build if any component ships a partial scale, and verified against real
compiled CSS from the playground rather than only the plugin's JS output.
