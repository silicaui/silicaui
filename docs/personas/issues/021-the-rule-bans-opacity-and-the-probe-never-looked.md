# 021 — Half the labels in the library are faded, and the check written to stop that never looked

**Status:** fixed
**Severity:** major
**Found by:** P01 · Dilnoza Karimova · act 7
**Surface:** `@wizeworks/silicaui` › the component CSS, and `scripts/verify-readable-ink.mjs`
**Filed:** 2026-09-18
**Fixed:** 2026-09-18
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 7 is a contrast act. After measuring every status chip and then every piece of text
on the ops console — all of which passed — I went looking for how the library fades
text at all, since fading is the one thing a ratio on a healthy screen will not show.

RULE #3 says it in one sentence: *never `soft`, `muted`, `/opacity`, or a
`color-mix(… , transparent)` ink on anything a person is meant to READ.* It names
`/opacity` **first**.

`verify-readable-ink.mjs` — the probe written to enforce RULE #3, whose own header
records that it caught 35 violations — matches exactly one pattern:

```js
const MUTED = /color:\s*"color-mix\(in oklab, var\(--color-base-content\) (\d+)%, transparent\)"/;
```

One spelling. The other spelling named in the same rule was never checked. The
component sources carry **110 `opacity` declarations, 53 of them partial fades**, and
the probe had never seen one of them.

Among them, described in the components' own words:

| where | value | what is inside it |
| --- | --- | --- |
| `countdown.js` `-label` | **0.6** | the word "days" — at 11px |
| `menu.js` `-title` | 0.55 | a menu group heading |
| `dropdown.js` `-label` | 0.55 | a dropdown group heading |
| `select-menu.js` `-group-label` | 0.55 | a select group heading |
| `dock.js` `-item` | **0.55** | a phone dock's icon **and its 11px label** |
| `footer.js` `-title` | 0.6 | a footer column heading |
| `list.js` `-title` | 0.6 | a list section heading |
| `chat.js` `-header` / `-footer` | 0.7 / 0.6 | who said it, when, whether it was seen |
| `breadcrumb.js` `& a` | 0.7 | every breadcrumb link |
| `power-search.js` `-chip-field` | 0.85 | the field name in a filter chip |
| `alert.js` `-description` | 0.9 | the sentence saying what to do about the alert |
| `toast.js` `-description` / `-action` | 0.9 | the same, plus a button label |

`alert.js` had written the reasoning down beside the fade:

> *Full-contrast `-content` softened just enough for hierarchy against the bold title,
> not enough to hurt legibility.*

That is the exact argument RULE #3 exists to answer, sitting in the source, under a
green build.

## What should have happened

A probe named after a rule should check the whole rule. `opacity: "0.55"` on a menu
group heading and `color-mix(… 55%, transparent)` on the same heading do the same thing
to the same reader. Only one of them was ever going to be caught.

## How to reproduce

1. `cd packages/silicaui`
2. `node scripts/verify-readable-ink.mjs` — **green**, before this fix.
3. `grep -rn 'opacity: "0\.' src/components | wc -l` — **53**.
4. Open silicaui.com › Docs › Menu, in either theme, at any width. The group heading
   above the items is at 55%; the items under it are not.

Every time. Not theme-specific and not width-specific — which is exactly why looking at
screens in dark was never going to surface it.

## Why it matters

Fading is the failure mode this repo has already decided it cares about most, and the
one that looks fine to whoever added it. A 55% menu heading reads on a 27" monitor at
midday and does not read on a laptop at 22:00 — which is the entire premise of the
persona that found it.

**Four of these were below WCAG AA before the fix, measured on the rendered page** —
`.dock-item` at **2.66:1** in light, `.menu-title` at **3.87**, `.countdown-label` at
**4.39**, and `.dock-item` again at 3.13 in dark. This was not only a house-rule
violation; it was a contrast failure that **no existing probe could reach**.
`verify-token-contrast.mjs` measures tokens, so an `opacity` applied on top of a
perfectly good token is invisible to it, and `verify-readable-ink.mjs` was the only
check that could have seen the property — and did not look at it. The numbers in the
table below are the first time any of them were measured.

The dock case is the sharpest. An 11px label on a phone's bottom bar, faded to 55%,
where the active item was **already** marked with a real accent colour — so the fade
bought no hierarchy at all. The probe's own header had worked this out for `tabs-tab`
and `outline-link` and written it down:

> *Selection state is NOT on that list: `tabs-tab` and `outline-link` mark the active
> item with a real accent color already, so fading the inactive ones was redundant.*

The knowledge existed. It could not travel, because the check could not see the
property.

## Where it lives

- `packages/silicaui/scripts/verify-readable-ink.mjs` — `MUTED` was the only detector
- the 13 component modules in the table above

## Do the siblings have it too?

**This issue is the sibling sweep.** The single instance that started it — a countdown
label — was worth nothing alone. The class was worth 16 fixes.

All 37 files carrying a partial `opacity` were checked. After correcting two faults in
my own first pass, the split is **49 legitimately faded, 20 flagged, 16 fixed, 4
allow-listed with a written reason**:

| kept, and why |  |
| --- | --- |
| `breadcrumb` `::before`, `collapse` `::after` | a chevron made of two rotated borders, `content: ""` |
| `mockup` `pre[data-prefix]::before` | terminal line numbers, `userSelect: none` |
| `pagination` `-ellipsis` | the "…" gap marker, `userSelect: none` — structural punctuation |

**Two of the faults were mine, and running the probe is what found them.** The first
draft reported 41 and would have had me "fix" 21 things that were already correct:

1. The selector capture `\[([^\]]+)\]:` stopped at the **first** `]`, so
   ``[`${sel("-item")}[data-disabled="true"]`]`` was recorded as `-item` — discarding
   the very attribute that makes a disabled control legitimately faded. Twelve
   `[data-disabled]` rules were flagged as defects because of it. The file's existing
   header comment had already warned about this truncation for a *different* assignment
   shape; the same bug was live in the main one.
2. `ALLOW_SELECTOR` listed `data-disabled|aria-disabled` but not the `:disabled`
   **pseudo-class**, so six more real disabled states were flagged.

Both are fixed in the probe. 41 → 20 was a correction to my measurement, not a change
to the components.

## The fix

**The probe** now runs a second detector beside `MUTED`:

```js
const FADED = /(?:^|[\s{,])opacity:\s*"(0\.\d+)"/;
```

`0` and `1` are show/hide, not fades. Rules whose selector names a glyph, divider,
handle, overlay, remove/close affordance or drag state are allowed by pattern; disabled,
placeholder and animation states were already allowed by `ALLOW_SELECTOR`. Whatever is
left is either fixed or written into `OPACITY_OK` with its reason on the line — the same
discipline the colour half already used.

**The components.** Every fix is the same move, and it is the one the rule prescribes:
hierarchy comes from scale, weight and colour, so the fade comes out and nothing
replaces it — because the hierarchy was already there.

- The five uppercase group headings are 11–12px, weight 700, letter-spaced and uppercase
  against 14px regular items. That **is** the hierarchy. The 55% sat on top of it.
- `chat` header/footer are 12px against a 16px bubble.
- `breadcrumb`'s current page was already `fontWeight: 500`; its ancestors no longer
  fade to 70%.
- `dock` keeps the accent colour on the active item and loses the fade on the rest.
- The 0.9 fades (`alert`, `toast`) did almost nothing visible and cost the rule its
  meaning.

Two things broke as a result of my own edits, and were repaired before the act finished:

- `dock -item` lost its only hover feedback when the `opacity` hover went. It now hovers
  to the accent colour — feedback in colour, not in fade.
- `toast -action` was left holding a dead `opacity: "1"` on hover, returning from a fade
  that no longer existed. Removed. The `-close` glyph beside it **keeps** its 0.7/1
  pair, which is correct: it is a glyph, not text.

No class name, token name or prop changed.

## Confirmed by

**The probe was proved before it was trusted.** Put the `countdown` label's
`opacity: "0.6"` back and `node scripts/verify-readable-ink.mjs` names
`countdown.js:44 -label` and **exits 1**. Take it out again and it exits 0. A probe
nobody has watched fail is not a probe.

`pnpm verify` across the workspace: **exit 0**.

**RULE #7 — re-proved on silicaui.com, opened cold** after `rm -rf apps/site/.next`
(and after killing the old dev server, which had survived its own stop and was holding
port 4011). Every number below is read off the **computed style** of the rendered
element, with the alpha of every ancestor composited — not off the source. The
converter was checked with a magenta pre-fill and `#fff` on `#000` = 21.00 on each
page, and the compositor with 50% black over white = 127.

Before → after, in both themes. **AA needs 4.5.**

| element | px | was | dark | light |
| --- | --- | --- | --- | --- |
| `.dock-item` "Home" | 16/11 | 0.55 | 3.13 → **7.87** | **2.66** → **7.99** |
| `.menu-title` "Workspace" | 12 | 0.55 | 5.28 → 15.75 | **3.87** → 16.71 |
| `.dropdown-label` "Actions" | 12 | 0.55 | 5.28 → 15.75 | — |
| `.countdown-label` "days" | 11 | 0.6 | 6.11 → 16.31 | **4.39** → 15.28 |
| `.list-title` "Team" | 11 | 0.6 | 6.10 → 15.75 | 4.53 → 16.71 |
| `.footer-title` "Product" | 12 | 0.6 | 6.10 → 15.75 | 4.53 → 16.71 |
| `.chat-header` / `.chat-footer` | 12 | 0.7 / 0.6 | 6.10 → 15.75 | 4.53 → 16.71 |
| `.breadcrumb a` "Home" | 14 | 0.7 | 8.00 → 15.75 | 6.36 → 16.71 |
| `.power-search-chip-field` "Status:" | 13 | 0.85 | 5.22 → 6.65 | 4.68 → 6.65 |
| `.toast-description` / `.toast-action` | 14 | 0.9 | 7.67 → 8.77 | — |

**Four were below AA before this, and the rule had nothing to do with it —** the
contrast probe cannot see an `opacity` either, because it reads tokens, not rendered
pixels. `dock-item` at **2.66** in light is an 11px label on a phone's bottom bar.

The dropdown and the toast were opened by clicking their real triggers, not by
inspecting CSS. `.toast-close` still measures **0.7** beside a `-action` that no longer
fades, which is the exemption behaving: a glyph keeps its fade, the words next to it do
not.

**Two gaps were recorded here. One was real. The other was my own mistake, and it is
corrected in place rather than quietly deleted:**

1. ~~**`.select-menu-group-label` was never seen on a screen.**~~ **This was my error and it
   is withdrawn.** There is no such class and there never was. `select-menu.js` builds its
   selectors as `.select` + suffix — the module is *named* select-menu and emits
   **`.select-*`**. I read this probe's own output, which prints the SUFFIX
   (`-group-label`), glued it to the FILENAME, then searched the page for a selector I had
   invented, did not find it, and wrote the absence up as a finding about the product.

   The real class is **`.select-group-label`**, it is in the served stylesheet, and the fix
   is live on it — the rule now carries padding, font-size, text-transform and
   letter-spacing and **no `opacity`**. The on-screen reading taken at the time was right:
   "Classic" at opacity 1, 12px, on the Select (Advanced) page. Only the name I filed it
   under was wrong. **All thirteen components are confirmed on a screen, not twelve.**

   Found in act 9, when the "a class that ships and renders nothing" lead was chased and
   turned out to be nothing.


2. **`.alert-description` is still broken in light, and this fix was never going to
   mend it.** 1.58 → **1.67**. The first alert on that page is
   `alert alert-warning alert-soft`, whose ink computes to `oklch(0.8 0.11 85)` — the
   `warning` role painted as text on a pale tint. That is **issue 019**, open by design,
   measured here for the second time on a real component rather than a synthetic label.
   Removing the 0.9 was correct and moved it 0.09; the remaining 2.8 is 019's to fix.

## Rating effect

None of the console's own screens moved — the console uses none of these thirteen
components. The effect lands on the silicaui.com docs pages for them, which P01 has not
scored. They stay `—` in [rating.md](../rating.md) rather than being scored from a
fly-past.
