---
"@wizeworks/silicaui-react": minor
---

**Breaking (pre-1.0): two props renamed so `size` means one thing.**

A design system's leverage is that one prop name means one concept everywhere.
`size` had drifted into three, and two of them were renamed:

| Component | Before | After |
| --- | --- | --- |
| `RadialProgress` | `size?: string` (a CSS length) | `diameter?: string` |
| `Heading` | `size?: 1–6 \| "display"` | `visualLevel?: 1–6 \| "display"` |

`RadialProgress` was the harmful one. `size` accepted any CSS length and wrote
it straight to `--size`, so `<RadialProgress size="lg" />` — the spelling that
works on every other component in the library — type-checked, compiled, and
emitted the invalid `--size: lg`, silently collapsing the ring. `diameter`
pairs with the existing `thickness`, which is also a CSS length.

`Heading` keeps `level` for semantics; the visual scale is now `visualLevel`,
which says what it is and no longer collides with the token scale.

`packages/silicaui-react/verify-prop-vocabulary.mjs` now reads the source and
asserts every `size` prop resolves to the `xs`–`xl` scale (or a subset the CSS
actually emits). Typecheck cannot catch this class of drift — `size?: string`
is perfectly valid TypeScript — so it needed a probe rather than a type.

### `render` vs `as`: documented, deliberately not unified

An earlier audit proposed standardizing all polymorphism on `render`. That was
investigated and **rejected**, because the two props are not two spellings of
one idea:

- `render` takes an **element** and clones it (composition). It needs the real
  element, so it does not survive a `"use client"` boundary — already
  documented in this package's Server Components section.
- `as` takes a **tag name or component type**. A string like `"span"` crosses
  that boundary fine.

Unifying on `render` would have regressed Server Component usage for exactly
the presentational components (`Text`, `Wordmark`, `BlockquoteCite`) most
likely to be used server-side. The existing split was already correct; what was
missing was any statement of the rule. It's now in the README as a table, and
in the component-authoring skill so new components don't pick arbitrarily.
