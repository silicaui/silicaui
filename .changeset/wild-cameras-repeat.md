---
"@wizeworks/silicaui": minor
"@wizeworks/silicaui-react": patch
"@wizeworks/silicaui-html": patch
"@wizeworks/silicaui-behaviors": patch
"@wizeworks/silicaui-mcp": patch
---

Follow the visitor's operating system for light/dark, and say something when the plugin
is not wired up.

**`prefersdark`, a new opt-in plugin option.**

```css
@plugin "@wizeworks/silicaui" { prefersdark: true; }
```

Emits `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }`, so an app
follows the OS on first paint with **no theme script** — no flash of the wrong theme,
and nothing for a strict CSP to refuse. An explicit `data-theme` still wins, so a stored
choice beats the OS and a theme island beats both.

The unthemed root becomes a full Silica surface, not just a set of tokens: it gets the
**surface paint** (`--color-base-100` behind the text, the theme's `--font-sans`, the
16px reading anchor, the grain if `--noise` is on) **and the global type ramp** — bare
`<h1>`–`<h6>`, `<p>`, `<small>` and `<blockquote>`.

That second one matters most. Turning `prefersdark` on means *not* setting `data-theme`,
and the type ramp was scoped to that attribute — so an app that followed the
documentation had no typography at all and every `<h1>` rendered at 16px/400,
indistinguishable from a paragraph. Both the paint and the ramp now read one shared
`surfaceScopes()` list, so the two opt-ins cannot come apart again.

The paint is also declared once rather than inside the dark media query. It names
`var(--color-base-100)`, so it follows whichever palette is live — which fixes the
light side, previously left on the browser's white instead of the theme's `oklch(98% …)`.

Default **off**: nothing changes for an existing app until it asks. If you turn it on,
do not also hardcode `<html data-theme="light">` — that makes the rule unmatchable and
silently disables it.

**`ThemeController` no longer writes a theme nobody chose (bug fix).**

It previously set `data-theme` on mount unconditionally, falling back to the first theme
in `themes`. Merely rendering the control therefore stamped `data-theme="light"` and
overrode the visitor's OS — with no symptom beyond a light page on a dark machine, and
it defeated `prefersdark` entirely.

It now writes only once something has actually chosen: a controlled `value`, an explicit
`defaultValue`, a stored choice, an attribute already on the target, or a click. It also
reads `prefers-color-scheme` once after mount so the icon shows the theme you are
actually looking at, without writing the attribute.

Every case that wrote before still writes. Only "nobody has chosen yet" changed.

**A missing `@plugin` line is no longer silent.**

Forgetting it produced an unstyled page and nothing else: components went on rendering
`class="btn btn-primary"`, the classes resolved to no rules, and there was no build
error, no console warning and a clean `200`. Tailwind's own utilities kept working, so
the result read as deliberate rather than broken.

The plugin now emits one sentinel custom property, `--sui-plugin: 1` on `:root`, and
`@wizeworks/silicaui-react` reads it once per page in development. When it is missing you
get a `console.error` naming the problem, the consequence and the exact CSS to add. A
custom property rather than a class, because `prefix:` renames classes and leaves custom
properties alone — so a prefixed install tests the same thing.

Development only, stripped from production builds, and deferred to the `load` event so a
stylesheet still in flight is never reported as a missing plugin. Nothing reads the
sentinel's value, only whether it exists — it is safe to treat as internal.

**Naming the wrong package in `@plugin` now says so.**

`@plugin "@wizeworks/silicaui-react"` — an easy line to type, since that is the package
you import components from — failed with `b is not a function` from inside Tailwind's
minified internals, naming no package, no cause and no fix.

`@wizeworks/silicaui-react`, `@wizeworks/silicaui-html` and `@wizeworks/silicaui-behaviors`
now each throw one sentence saying they are not the Tailwind plugin, naming
`@wizeworks/silicaui` and showing the line that fixes it. No existing export changed; a
default export on these entry points had no prior meaning.

**`h1` and `h2` are fluid.**

They were flat `2.25rem` / `1.875rem` — 36px on a 360px phone and 36px on a 27" monitor.
A 68-character page title set five lines and 198px at 360px, a quarter of the screen
before any content.

Both now use `clamp(…cqi…)`, the same shape `display-1`–`display-3` already use:

```
h1   clamp(1.75rem, 1.15rem + 2.6cqi, 2.25rem)    28 → 36
h2   clamp(1.5rem,  1.05rem + 2cqi,   1.875rem)   24 → 30
```

**Nothing changes above roughly a 680px container** — both sit at their present size and
are flat there, so desktop output is identical. `cqi` rather than `vw` means a heading
sizes to the column it is in, which is the right answer inside a sidebar layout.
`h3`–`h6` are unchanged; 24px and below already set fine on a phone.

**Polymorphism has one name: `render`.**

`SidebarItem`, `Text`, `BlockquoteCite` and `Wordmark` took `as={Component}` while
`Button`, `Badge`, `Card` and `PowerSearch` took `render={<Element />}` — two names for
one concept, so a line copied from a Button to a SidebarItem was a type error with no
hint as to the right spelling.

All four now accept `render`, through the same implementation the others use. `render` is
preferred: the element carries its own props and they are type-checked against it
(`render={<Link href="/x" />}`), which `as` plus a widened parent cannot do. **`as` still
works everywhere it did** and is marked deprecated, so nothing breaks.

**`search_docs` can be searched in words (`@wizeworks/silicaui-mcp`).**

`search_docs("app shell")` returned nothing while `search_docs("appshell")` returned
seven results — every matcher was a single literal substring test of the whole query, so
any component whose name is two words was unreachable by the words: `AppShell`,
`DataTable`, `EmptyState`, `CommandPalette`, `NumberField`, `TreeView` and most of the
React surface.

The query now splits into terms, every term must match, and each name is indexed both as
written and word-split — so `AppShell` answers to `appshell`, `app shell` and `shell`.
Applied to all ten matchers rather than the one that was reported.

**`neutral` is readable as ink in dark (bug fix).**

`btn-neutral btn-ghost`, `badge-neutral badge-soft` and every other non-solid `neutral`
variant painted `--color-neutral` as TEXT on the base surface. The dark palette keeps
`neutral` dark on purpose — it is a fill, a subtle chip a shade lighter than the page —
so as ink it measured **1.5:1** against a dark surface. Column headers, nav labels and
`neutral` status chips were effectively invisible at night.

The solid form is unchanged and still measures 10.4:1. Only the ink form moves, to
`--color-base-content`, which is what an uncoloured control already used: every rule reads
`var(--btn-accent, var(--color-base-content))`, so `btn-neutral` had been overriding the
right answer. Applied in the shared generator, so it reaches all 28 coloured families and
the builder's runtime cascade alike.

`verify-token-contrast.mjs` gained the direction it never tested — a role colour measured
as ink on `base-100`, for every role and both modes.

**`SearchInput` and `PasswordInput` take `className` on their outer box (behaviour change).**

`className` used to land on the inner `<input>` while the `input-group` that positions the
search icon, the clear button and the show/hide toggle kept its own width. So
`<SearchInput className="w-96" />` inside a wide container left the clear button stranded
against the container's edge — measured at **718px** from the field it belongs to, and
480px for `PasswordInput`'s toggle.

`className` now goes to the group, which is the visible control, and the new
`inputClassName` styles the field itself. Most existing uses are typography
(`font-mono`, `text-center`), which inherit from the group and land the same either way;
width, max-width and margin classes start working the way they read.

**`.sidebar-item` gets a 44px minimum tap target on touch devices.**

Rows computed to 37px, under WCAG 2.5.5, Apple's 44pt and Android's 48dp — which bites
in a long nav list under a thumb. Scoped to `@media (pointer: coarse)`, so desktop
sidebar density is unchanged.

**Text that a person reads no longer fades (RULE #3).**

Thirteen components faded readable text with `opacity` — a menu, dropdown, select and
footer group heading at 55–60%, every breadcrumb link at 70%, a chat bubble's byline and
delivery line, a countdown's unit label at 11px, a phone dock's icon **and its label** at
55%, and the description line in an alert and a toast.

Four of them were below WCAG AA on the rendered page, in a theme:

```
.dock-item        2.66:1 light,  3.13:1 dark   ->  7.99 / 7.87
.menu-title       3.87:1 light                 ->  16.71
.countdown-label  4.39:1 light                 ->  15.28
```

Nothing in the repo could have reported this. `verify-token-contrast.mjs` measures
tokens, so an `opacity` sitting on top of a perfectly good token is invisible to it, and
`verify-readable-ink.mjs` — the probe written for the rule that bans `/opacity` by name —
only ever matched the `color-mix(…, transparent)` spelling.

The fade is simply removed in each case; nothing replaces it, because the hierarchy was
already carried by scale, weight and case (11–12px, 700, uppercase against 14px regular
items). The dock's active item was already marked with a real accent colour, so the fade
on the others was buying nothing; it now hovers to that colour instead. Glyphs, dividers,
handles, drag states, disabled controls and placeholders are untouched — a toast's close
"×" still sits at 70% beside an action button that no longer fades.

`verify-readable-ink.mjs` now checks `opacity` as well, with the same written-reason
allow list; two bugs in its own selector matching (an attribute selector truncated at the
first `]`, and the `:disabled` pseudo-class missing from the allow list) are fixed too.

**A role colour now has an ink form as well as a fill form (visual change, light mode).**

A palette tunes each role as a **fill**: light mode's `warning` is `oklch(80% 0.11 85)`, a
soft amber that carries near-black `warning-content` at 8.8:1 and is right behind a label.
The same value used **as** the label, on a 98% surface, is **1.77:1**.

So `soft`, `outline`, `ghost` and `link` were unreadable in light for most roles —
**fifteen of twenty-one** role × variant pairs below AA:

```
warning  soft 1.64   outline/ghost 1.78
success  soft 2.13   outline/ghost 2.41
info     soft 2.34   outline/ghost 2.67
accent   soft 2.55   outline/ghost 2.96
error    soft 3.66   outline/ghost 4.42
```

No single lightness fixes it — the two uses pull opposite ways. So the ink is **derived**
from the fill and both ship. Every coloured family gains `--<root>-ink` beside its
existing `--<root>-accent`:

```css
--btn-ink: oklch(from color-mix(in oklab, var(--color-warning) 50%, var(--color-base-content)) l calc(c * 2) h);
```

Mixing halfway toward `--color-base-content` moves the colour toward whatever the current
surface uses as ink — darker on a light page, lighter on a dark one — so it is correct in
**every** theme, including one a host invents at runtime, with no light/dark flag to set
and no way to set it backwards. The mix costs about half the chroma, so the second step
multiplies it back; 89–134% of the original chroma survives, and nothing washes out.

**In the browser, all 40 role × variant pairs now pass AA in both themes.** Worst light
case `warning soft` **1.64 → 5.15**; worst dark case `error soft` 7.30.

**Only text moved.** `--<root>-accent` still holds the raw colour and still drives every
fill and tint, so **solid variants are unchanged** and `btn-outline:hover` still fills with
the raw colour under its matching `-content` (measured 8.72:1). What moved: `color:` on
soft/outline/ghost/dash/link, the button spinners, and the resting outline/dash border on
Button, Badge and Alert — a border drawn round a label in the label's own colour has to
move with it.

The ink variable is emitted from the shared generator, so it reaches all 28 coloured
families and a colour invented live in the theme editor identically.

`verify-token-contrast.mjs` now measures the derived ink rather than the token, and reads
the mix ratio and chroma multiplier back out of the generated CSS so the probe and the
stylesheet cannot drift apart.

**A busy `Button` no longer drops the keyboard user's focus (bug fix).**

`<Button loading>` passed `disabled || loading` to the native `disabled` attribute, and
when the element a keyboard user is standing on gains `disabled`, the browser moves focus
to `<body>`. So pressing Enter on a submit button left them with no focus anywhere for the
length of the request — no ring on the page, the next Tab restarting from the top of the
document, and a screen reader losing its place with `aria-busy` set and nothing focused to
announce it.

Busy now goes through `aria-disabled` (with activation stopped explicitly, since
`aria-disabled` is advisory) and `disabled` is kept for a real, lasting disabled. **Nothing
about the look changes** — `&:disabled, &[aria-disabled='true']` already shared one rule and
the spinner already keyed off `aria-busy`. The polymorphic `render` path always worked this
way; only the native `<button>` differed from it.

`verify-busy-keeps-focus.mjs` fails the build on a native `disabled` derived from a busy
state, following the derivation one hop.

**A role colour painted as text goes through the ink derivation everywhere (bug fix).**

Fifteen rules across twelve components wrote a role token straight into a `color:` — the
required-field asterisk, the validator message, upload errors, an active menu item, prose
links and more. Those bypassed the ink form entirely: the asterisk measured **4.42:1** in
light, while `verify-token-contrast.mjs` reported `error` at 9.56 because it measures the
derived value.

The derivation moved to `lib/ink.js` so both callers share one formula, and all fifteen use
it. The asterisk is now **9.57:1** in light and 8.45 in dark, and still unmistakably red.
`verify-ink-derivation.mjs` fails the build on a bare role token in a `color:` declaration;
`--color-base-content` and `--color-<role>-content` are exempt, because those already are
inks.

**A `DialogHeader` puts a description under the title, not beside it.**

`.dialog-header` is a `space-between` row, right for a title and a close button. Putting a
`DialogTitle` and a `DialogDescription` in it — the obvious reading of the name — squeezed
the title into half the popup and wrapped it. The bar now wraps and `.dialog-description`
takes a full basis, so title + close still sits on one row and a description takes its own.
`.drawer-header` had the identical shape and gets the identical fix; `AlertDialogHeader`
re-exports Dialog's.

**`text-<role>` paints the ink form, not the fill (visual change, light mode).**

A palette tunes a role as a fill, so in light `text-warning` put `oklch(80% 0.11 85)` on a
98% surface and measured **1.78:1**. Five of the seven chromatic roles were under AA that
way — while `<Button color="warning" variant="ghost">` measured 5.60 on the same page,
because the component layer had already been given an ink form. RULE #1 names Tailwind
utilities as the other half of the sanctioned toolbox, so the sanctioned path produced the
worst text on the page.

```
              light before → after
text-warning     1.78 → 5.60
text-success     2.41 → 6.46
text-info        2.67 → 6.89
text-accent      2.96 → 6.88
text-error       4.42 → 9.57
```

All seven pass AA in both themes now. **`bg-` and `border-` are unchanged** — a background
IS the fill form, and a border is a boundary under a different threshold. `base-*` and every
`-content` token are skipped, because those are already inks.

The rules are emitted in the utilities layer with the `[class]` specificity bump the `soft`
family already uses: a base-layer rule is outranked by Tailwind's own utility for any colour
whose literal class appears in scanned source, which would have fixed only the colours
nobody uses.

**`search_docs` answers the words people type, and says when it relaxed a query.**

Forty-one ordinary phrases were run against the server; thirty-three worked and eight
returned nothing while the component sat right there — `status history`, `activity feed`,
`audit trail` and `history` for Timeline, `snackbar` and `toast message` for Toast, `loader`
for Skeleton, `user picture` for Avatar.

Two causes. Some are true synonyms that no normalisation reaches (`snackbar`/`toast`), now
covered by a fifteen-entry alias table. The rest were strictness: `toast` returns 12 and
`message` returns 22, but `toast message` returned **0**, because no single entry carries
both. A query that matches nothing now drops its least specific word and runs again — the
AND is kept, so precision is kept, and OR was measured and rejected for burying the answer.

A relaxed search returns a `search-note` first, naming the word it ignored. Nothing that
returned results before returns anything different.

**A controlled segmented date or time field can be typed into (bug fix).**

`DateInput`, `TimeInput` and `DateTimeInput` exist so a person can put their hands on the
keyboard and type the date instead of hunting through a calendar. That was false for every
**controlled, empty** field, for as long as the components have existed.

`onValueChange` only fires with a whole value, which is the right contract — a parent must
never be handed the 4th of no month. But it means the keystrokes before the last one are
not representable in the parent, and the components kept their own cells only for the
uncontrolled case, deriving them from `value` otherwise. So each digit reported `null`, the
parent's `value` stayed `null`, and an effect put the placeholders back before the next
digit arrived. An empty controlled field could never reach a complete date at all; only
pasting one worked.

A field that starts full was typeable, which is why this survived: the fields people looked
at were seeded with today's date.

The segments are now the component's own state whether controlled or not, and `value` syncs
down only when it disagrees with what the cells already say. A `null` value beside
incomplete cells is somebody part-way through typing, never a parent clearing the field.
Clearing one segment also stops clearing its neighbours — a single Backspace on the month
used to empty the day and the year with it.

`verify-segment-typing.mjs` runs the keystrokes against all three components, because every
part of this typechecked.

**`Timestamp` puts the exact time on every relative label.**

The `title` was keyed on the format rather than on what got rendered: `format="auto"`
carried one whether it landed on "2 minutes ago" or on "Jul 8", and an explicit
`format="relative"` carried none. So "2 weeks ago" — the one label that is a summary and
cannot be quoted — was the one case with no way to reach the real date.

The tooltip now follows the rendered label: present wherever the text is relative, absent
where the text is already the answer. `verify-timestamp.mjs` covers it.
