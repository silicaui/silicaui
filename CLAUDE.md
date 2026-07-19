# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## RULE #1 — silicaui first, Tailwind second, everything else needs approval

**Build every UI on silicaui.** Reach for a `@wizeworks/silicaui-react` component and its
`color × variant × size × shape` props before anything else. **Tailwind utility classes are also
allowed** — layout, spacing, sizing, positioning, one-off chrome. That is the whole sanctioned
toolbox.

**Anything that is not silicaui or Tailwind requires Brandon's explicit approval, asked for
up front — not shipped and explained afterwards.** That includes: a new dependency or component
library, a hand-rolled replacement for something silicaui already provides, a bespoke CSS file,
and any inline `style` that paints a control.

**If you are touching a file that does it the old way, migrate it** — don't match the surrounding
mistake. And never "re-skin" a silicaui component:

```tsx
// NEVER — an inline hex fill on a control. Stays black inside a dark themed
// island, ignores the token system, and is exactly what this rule exists to stop.
<Button size="lg" style={{ backgroundColor: '#0A0A0A' }}>Start free</Button>

// ALWAYS — props resolve to the plugin's real classes: `btn btn-neutral btn-lg`.
<Button color="neutral" size="lg">Start free</Button>
<Button color="brand" size="lg">Start selling</Button>      // any color registered in globals.css works
<Button variant="outline" size="lg">Talk to sales</Button>  // inside a [data-theme] island, the theme
                                                            // resolves border + ink automatically
```

Colors come from tokens, never hex: `--color-neutral`, `--color-primary`, and any custom role
registered with the plugin in the app's `globals.css` (`@plugin "@wizeworks/silicaui" { colors: … }`).
A hardcoded hex cannot respond to light/dark, so it is wrong even when it looks right on the screen
you tested.

A **theme island** is how a section opts into a different palette — nest `data-theme="<name>"` on the
wrapper and everything inside resolves against that theme's tokens with no per-theme CSS:

```tsx
<section data-theme="dark">…</section>   // dark surface + ink, same classes underneath
```

The only sanctioned literal-hex context is edge-runtime OG images (Satori can't resolve CSS custom
properties). No such route exists in this repo today; if one is added, read the hex from a single
exported brand constant rather than inlining it.

Detail: [docs/why-semantic-classes.md](docs/why-semantic-classes.md),
[docs/silicaui-architecture.md](docs/silicaui-architecture.md).

## RULE #2 — no eyebrows, no eyebrow badges, no editorial formatting

**Nothing sits above a heading to introduce it.** No kicker, no label, no category chip, no
`01 / 02 / 03` step marker, no uppercase-mono micro-caps — and **no `<Badge>` used as one either.**
Swapping an uppercase `<span>` for a `<Badge>` in the same slot is the same anti-pattern wearing a
component; the ban is on the _slot_, not the markup.

```tsx
// NEVER — all four are the same eyebrow.
<span className="font-mono text-xs uppercase tracking-wide">Confident</span><h3>…</h3>
<Badge color="success" variant="soft">Confident</Badge><h3>…</h3>
<span>01</span><h3>…</h3>
<p className="uppercase">How it works</p><h2>…</h2>

// ALWAYS — the heading carries itself; hierarchy comes from scale, weight, and color.
<h3>…</h3>
```

**No editorial formatting** either: no pull quotes, no drop caps, no rules/dividers used as
decoration, no magazine-style label columns. This is product marketing, not a magazine spread.
A `<Badge>` is for **state on a thing** (`<Badge color={statusTone(s)}>` on a row, a card, a
record) — never a decorative label introducing a section.

## RULE #3 — soft/muted/transparent is a deliberate signal, not a default

**Text:** never `soft`, `muted`, `/opacity`, or a `color-mix(… , transparent)` ink on anything a
person is meant to READ. Readable text gets a real ink token (`--color-base-content`, or the
surface's `-content`). Faded text is reserved for text deliberately not meant to be read —
decorative watermarks, disabled controls, a de-emphasized duplicate.

**Backgrounds:** the same. `bg-soft` is **not** part of the primary theme — it is an accent applied
on purpose, to the ONE thing that earns it. Applying `soft` everywhere drains the exact power it
exists for and flattens the design system into mush. **If everything were meant to be soft, soft
would be the theme color.** It isn't.

Practical test before typing `soft`/`muted`/`/opacity`: _what is this de-emphasized relative to,
and is that contrast actually doing work on this screen?_ If the answer is "nothing in particular,
it just looked nicer," use the real token. Hierarchy comes from **scale, weight, and color** —
not from fading things out.

The base font floor for body text is **16px** — the plugin anchors this by declaring `100%` (not a
fixed `16px`) so the scale honors a user's own browser setting, with `text-md` = 1rem = 16px.
Related: [docs/builder-ux-principles.md](docs/builder-ux-principles.md).
