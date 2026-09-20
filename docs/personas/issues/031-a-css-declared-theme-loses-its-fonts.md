# 031 — A theme declared in CSS silently loses its type faces and any multi-layer shadow

**Status:** fixed
**Severity:** major
**Found by:** P02 · Tomás Ferreiro · act 4
**Surface:** `@wizeworks/silicaui` › `src/theme-plugin.js`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Issue 030's fix says: on the CSS path, declare the preset yourself. So marble was declared
from `get_theme("marble")`'s own token map:

```css
@plugin "@wizeworks/silicaui/theme" {
  name: marble;
  --font-sans: "Inter", sans-serif;
  --font-head: "Cormorant Garamond", serif;
  /* …the colours, the radii, the depth */
}
```

The colours landed. The page was marble. **The headings were not Cormorant Garamond** — they
were the browser's generic serif, and `--font-head` computed to exactly `serif`.

The emitted CSS says why:

```css
[data-theme="marble"] {
  --font-sans: Inter;
  --font-sans: sans-serif;          /* ← wins */
  --font-head: Cormorant Garamond;
  --font-head: serif;               /* ← wins */
}
```

**Every comma-separated value was split into one declaration per fragment, and the last
fragment won.** The family is discarded; you are left with the fallback, which looks like a
font rather than like a bug.

## What should have happened

`--font-head: "Cormorant Garamond", serif` is one value. It should be emitted once.

## How to reproduce

In a bare directory, outside any monorepo, with nothing but the Tailwind CLI:

```css
@plugin "@wizeworks/silicaui/theme" {
  name: repro;
  --font-head: "Cormorant Garamond", serif;
  --shadow-card: 0 1px 2px black, 0 4px 8px black;
}
```

```
npx @tailwindcss/cli -i repro.css -o repro.out.css
```

Both come out split in two. Font stacks and multi-layer shadows alike.

## Why it matters

A theme's **type faces are part of the theme** — `list_themes` gives every preset a `fonts`
field, and marble's character line is *"High-contrast serif headings, hairline borders, flat
surfaces."* Without the serif it is not marble; it is marble's palette on the default type.

It fails silently, in the way that costs the most time: the page renders, the colours are
right, so the fault looks like a Google Fonts problem or a `<link>` problem. It took a
`getComputedStyle` read of `--font-head` to see that the token itself was `serif`.

And it lands squarely on the path with no build step to warn from. On React and the node
tree the host emits the preset; **only the CSS declarer writes these values by hand**, which
is exactly who issue 030's fix now sends here.

## Where it lives

`packages/silicaui/src/theme-plugin.js` — `unquote()`.

Tailwind hands a comma-separated `@plugin` option to a plugin as an **array**. The old
`unquote` tested `typeof v === "string"`, so an array fell straight through untouched and
reached `addBase`, which emits one declaration per element.

## Do the siblings have it too?

**No — and the reason is the point.** The main plugin already knew. Both of its option
parsers open with the same line:

```js
const raw = Array.isArray(option) ? option : String(option).split(/[\s,]+/);   // parseColors
const raw = Array.isArray(option) ? option.join("") : String(option);          // parsePrefix
```

`theme-plugin.js` is the third option parser in the package and the only one that did not.
**The knowledge was in the sibling file and did not travel** — the third time that shape has
turned up in this run (see 027, 028).

Checked for other affected values: any token whose value contains a comma. In practice that
is font stacks, multi-layer shadows, and `transition` lists. All three split; all three are
fixed by the same join.

## The fix

`unquote` joins arrays before doing anything else.

A second bug surfaced while fixing it, and it is why the join alone was not enough. The old
unwrapping was:

```js
v.replace(/^["']|["']$/g, "")
```

That strips each end **independently**. Applied to a joined stack it removes the opening
quote of the first family and leaves the closing one — `Cormorant Garamond", serif` — which
is worse than the split. So unwrapping now removes **one matched pair, and only when the
whole value is wrapped in it**:

| input | before | after |
| --- | --- | --- |
| `"Cormorant Garamond", serif` | two declarations | `Cormorant Garamond, serif` |
| `"#7c3aed"` | `#7c3aed` | `#7c3aed` — unchanged |
| `oklch(50% 0.08 75)` | unchanged | unchanged |

## Confirmed by

**A new probe, `scripts/verify-theme-plugin.mjs`, wired into `pnpm verify`.** It compiles a
theme block through the **real Tailwind compiler with the real plugin**, rather than
asserting on the option parser — the bug lived in the hand-off between the two, and a unit
test of either half would have stayed green.

```
✓ the declared theme is emitted at all
✓ a font stack stays ONE declaration
✓ a font stack keeps its family AND its fallback
✓ a three-part font stack survives too
✓ a multi-layer shadow is not split
✓ a wholly-quoted scalar still unwraps
✓ an unquoted value is untouched
✓ a colour with no -content gets one derived
```

**Proved by breaking it.** `unquote` reverted to the pre-fix version: **4 of the 8 go red**,
naming the split values (`--font-head appeared 2 times`, `--font-sans = IBM Plex Sans`,
`--shadow-probe = 0 1px 2px black`). Restored: green.

The two checks that stayed green under the old code are the regression guards — they are
what stops the join being "fixed" by removing unwrapping altogether.

**On the page it was found on**, rebuilt with the Tailwind CLI and read off the browser:

| | before | after |
| --- | --- | --- |
| `--font-head` token | `serif` | `Cormorant Garamond, serif` |
| rendered `<h1>` font-family | `serif` | `"Cormorant Garamond", serif` |
| `--font-sans` token | `sans-serif` | `Inter, sans-serif` |

`pnpm verify` across the workspace: **exit 0**.

## Rating effect

The menu page is scored in [rating.md](../rating.md); its headings are only marble's
because of this fix.
