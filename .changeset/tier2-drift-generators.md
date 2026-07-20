---
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-behaviors": patch
"@wizeworks/silicaui-builder": patch
---

Convergence pass on the sources of API drift, rather than on its symptoms.

**One name for a component's own value callback: `onValueChange`.** The library
already used it 22 times against 4 uses of `onChange`, but the authoring guide
mandated `onChange` — so every new component was being written to the 15%
pattern and the split was widening on its own. The guide is corrected, and the
four outliers (`Rating`, `Pagination`, `Carousel`, `ThemeController`) now expose
`onValueChange`. **`onChange` still works everywhere it did before**, marked
`@deprecated`, so nothing breaks. The rule it encodes: `onChange` belongs to the
native DOM handler on components that wrap a real form element — declaring your
own shadows it, which is why each of those four carried an
`Omit<…, "onChange">` in its props type paying for the collision.

**`ThemeController` no longer causes a hydration mismatch.** Its `useState`
initializer read `localStorage` and the DOM, so the server resolved one theme
and the client another — and because that value picks the Sun vs Moon icon, the
mismatch was guaranteed and visible. It now initializes to a value the server
can also compute and adopts the stored theme in an effect after mount, matching
`useTheme` and `useMediaQuery`.

**`Carousel` no longer notifies spuriously.** The change callback fired once on
mount (reporting a change that never happened) and re-fired on every render
when given an inline arrow — which turns a `setState` in the handler into a
render loop. It now fires only on real index changes.

**`TreeView` re-flattened its entire tree on every render** in controlled mode:
the expanded `Set` was rebuilt inline each render, so the `useMemo` depending on
it never hit.

**`useControllableState` is real now.** It documented itself as "the pattern
every Silica component uses internally" while having zero component imports.
`Rating` now uses it as the reference implementation, and the doc says plainly
that adoption is partial and ongoing instead of claiming otherwise.

### Tooling

The repo had **no ESLint config at all**. There is now a correctness-only flat
config — no stylistic rules, and none are wanted.

Notably, `eslint-plugin-ssr-friendly` turned out **not** to catch the SSR bug
class it was added for: it skips nested function expressions, which is exactly
the shape of a lazy `useState` initializer, so both hydration bugs this repo
actually shipped were invisible to it. A local
`silica/no-dom-in-state-initializer` rule covers the real shapes — lazy
initializers, and helpers referenced by name — and reports the read even when
it's `typeof`-guarded, since a guard prevents the crash but not the mismatch.
Its RuleTester cases are the two shipped bugs verbatim, and run as part of
`pnpm lint`.
