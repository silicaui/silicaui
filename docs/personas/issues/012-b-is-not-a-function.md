# 012 — She pointed `@plugin` at the wrong silicaui package and got "b is not a function"

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 4
**Surface:** `@plugin "@wizeworks/silicaui-react"` in an app's `globals.css`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** P01 act 4, on `localhost:4099`

## What happened

She has two silicaui packages installed. The one she imports components from all day is
`@wizeworks/silicaui-react`. So that is the name she typed into the plugin line:

```css
@plugin "@wizeworks/silicaui-react";
```

The build stopped and the Next error overlay filled the screen with:

> `CssSyntaxError: tailwindcss: …\app\globals.css:1:1: b is not a function`

`b` is a minified internal. The message names no package, no cause and no fix. It reads
like a crash inside silicaui, not like a mistake she made — which is the worst possible
reading for somebody deciding whether a 0.x project is safe to adopt.

**With** an options block it is better but still not helpful:

```css
@plugin "@wizeworks/silicaui-react" {
  colors: primary, secondary, accent, neutral, info, success, warning, error;
}
```
> `The plugin "@wizeworks/silicaui-react" does not accept options`

That one is Tailwind's own message. It at least names the package and stops the build at
a named file — she would get there. The bare form is the one that leaves her stranded.

## What should have happened

`@wizeworks/silicaui-react` is not a Tailwind plugin and knows it. Asked to be one, it
should say so in a sentence, and name the package she actually wants.

## How to reproduce

1. In a working install (P01's artifact), open `app/globals.css`.
2. Replace `@plugin "@wizeworks/silicaui" { … }` with `@plugin "@wizeworks/silicaui-react";`
3. Reload. Every time, both themes, every width.

## Why it matters

Lower stakes than 011 — the build stops, so she cannot ship it by accident, and she will
eventually find it. But it costs her minutes at the exact moment she is judging the
project's care, and it spends them making silicaui look broken. The fix is four lines.

## Where it lives

`packages/silicaui-react/src/index.ts` — the package has no default export, so Tailwind
calls whatever it resolved and dies inside its own minified code.

## Do the siblings have it too?

**Checked all three non-plugin packages. All three do it.**

| Named in `@plugin` | What she gets |
| --- | --- |
| `@wizeworks/silicaui-react` | `b is not a function` |
| `@wizeworks/silicaui-html` | same class of failure — no default export |
| `@wizeworks/silicaui-behaviors` | same class of failure — no default export |

Fixed in all three, not just the one found, because the reason a person picks the wrong
name is that they are thinking of the package they use most — which differs by path.
P08's node-tree run would have hit the `-html` one.

**Also checked, and NOT a defect:** putting the plugin line in a *second* CSS file that
`globals.css` imports —

```css
@import "tailwindcss";
@import "./silica.css";       /* @plugin lives in here */
```

— works correctly. Button measured `lab(32.5 -3.3 -19.1)`, 40px tall, `0px 16px` padding:
byte-for-byte the working baseline. Tailwind follows the import chain. Worth documenting
as supported rather than leaving people to guess.

## The fix

Add a default export to each of the three non-plugin packages: a function that throws one
sentence naming the mistake and the fix. Tailwind calls it, the throw surfaces in the
overlay in place of `b is not a function`.

No existing export changed; a default export on these barrels had no prior meaning.

## Confirmed by

**Re-ran P01 act 4 on Dilnoza's own app.** Wrote `@plugin "@wizeworks/silicaui-react";`
into `app/globals.css` and reloaded `localhost:4099`. The Next build overlay — the screen
she actually looks at — now reads:

> `@wizeworks/silicaui-react is a React component library, not a Tailwind plugin. Only
> @wizeworks/silicaui is.`
> `  Fix: in your CSS, name the plugin package instead —`
> `    @plugin "@wizeworks/silicaui" {`
> `      colors: primary, secondary, accent, neutral, info, success, warning, error;`
> `    }`
> `  Keep importing @wizeworks/silicaui-react from your components as normal; the two are
> separate packages on purpose.`

in place of `b is not a function`. The overlay clips the first line horizontally, but the
`Fix:` block — the part that unblocks her — is fully visible without scrolling.

Restored `globals.css` byte-identical to the backup and re-measured the button:
`lab(32.5387 -3.30366 -19.0915)`, 40px, `0px 16px`, `4px`. The baseline, unchanged.

**Not driven on screen for the other two packages.** The `-html` and `-behaviors` guards
are the same four lines from the same generator and are present in their built output,
but a build overlay was only produced for `-react`. Handed to **P08** (node-tree), which
installs `-html` and `-behaviors` for real and is the run where a person would plausibly
type either name.

## Rating effect

—
