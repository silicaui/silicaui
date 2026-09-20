# 077 — The builder's own labels were faded, on text a person has to read to operate it

**Status:** fixed — the email builder by P04, the site builder and the harness by P03's act 10 follow-up
**Severity:** low
**Found by:** P04 · Reuben Halloway · standing check, design-rule breaches
**Finished by:** P03 · act 10 follow-up, 2026-09-19
**Surface:** Both builders' chrome, and the harness
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Root `CLAUDE.md` RULE #3, in its own words:

> **Text:** never `soft`, `muted`, `/opacity`, or a `color-mix(… , transparent)`
> ink on anything a person is meant to READ. […] Faded text is reserved for text
> deliberately not meant to be read — decorative watermarks, disabled controls,
> a de-emphasized duplicate.

Counted across the email builder's own chrome: **17** uses of
`text-base-content/70`. Eleven of them are on text a person reads to operate the
builder —

- every Inspector field label
- every Inspector group heading
- the Inspector's empty state, which is the only thing on that panel when
  nothing is selected
- the Inspector's breadcrumb
- the canvas's "Empty — insert something from the palette" hint
- the canvas's "Custom HTML" block marker
- the Send-test dialog's description
- the Palette's "Saved" heading and its "Inserts into X." line

None of those is de-emphasised relative to anything. They are the primary text
of the control they label. The fade was a default, which is precisely what the
rule says it must never be.

## The part that is NOT a defect, and why it matters here

`/70` is **not** a contrast failure. P03 settled that with a measurement
([043](043-the-builders-own-labels-are-faded-below-the-contrast-floor.md)) and left a verifier
behind, `verify-chrome-ink.mjs`, which computes the worst reading each alpha can
produce across every shipped theme in both modes plus the builder's own studio
chrome. Its answer: `/70` is the floor, at 4.77:1 of 120 combinations. `/65`
fails six of them.

So this is a rule breach, not a readability defect, and it is worth being exact
about that rather than implying people could not read the panel.

## Where it lives

`packages/silicaui-builder/src/email/react/` — `Inspector.tsx`, `Palette.tsx`,
`Canvas.tsx`, `EmailBuilder.tsx`

## The fix

Eleven text instances now take the real ink token. Six were left, deliberately,
and each is a case the rule explicitly allows:

| Left faded | Why |
| --- | --- |
| the Navigator's kind icon, the lock/shield icon, the Palette's item icon | icons, not text |
| the Inspector's swatch-cell and stepper glyphs | icon-only controls |
| the breadcrumb's `/` separator | punctuation between crumbs — a de-emphasised duplicate, which is the rule's own example |
| the footer's `silicaui` mark, which restores on hover | attribution chrome, deliberately behind the author's work |

One other thing went with it. The "Custom HTML" marker was `text-[10px]`, which
is both below the type floor and an arbitrary pixel size the type-scale memory
says never to write. It is `text-xs` now.

## Confirmed by

```
$ grep -rn "text-base-content/70" src/email/react/*.tsx | wc -l
7
```

…and every one of the seven is in the table above.

`pnpm verify` exit 0 workspace-wide — including `verify:chrome-ink`, which still
passes, since solid ink is strictly more contrast than `/70`. Builder e2e
**208 passed**.

## Also recorded, not fixed — with a number

**The site builder has 63.** Same classes, same chrome, same rule. Not fixed in
this run because P04 is the email persona and the site builder's screens are
scored by P01 and P03 — a 63-call-site sweep belongs in the run that then looks
at the result, not in one that will not.

It is written down with the count so it is a worklist and not an impression.
Every one of the 63 passes AA, so this is tidiness, not rescue.

## Rating effect

`Email builder › Inspector`, `› Insert`, `› Canvas` in [rating.md](../rating.md) —
this lifts a recorded deduction rather than adding one.

---

## The site builder half, finished 2026-09-19

This issue was filed by P04 against the email builder and closed there, with the
site builder **counted and left** because "those screens belong to P01 and P03".
That is the framework's own named failure shape — *a fix leaves its neighbour
behind* — sitting in the ledger with a number against it. P03's run is now
complete, so the neighbour is done.

The count had grown from the 63 P04 recorded to **69**, which is what happens to
a deferred defect class in a live tree.

```
site builder   69 uses of text-base-content/70 and /80
               57 -> the real ink token
               12 -> deliberately left faded
email builder   7 remaining, every one an exemption already agreed here
```

### The twelve left faded, and why

Each is one of the four cases RULE #3 names, and the same four this issue applied
to the email builder:

| Left faded | Why |
| --- | --- |
| `Navigator.tsx:78` the row's kind icon, `:85` the lock / shield icon | icons, not text |
| `Palette.tsx:127` the item icon, `:237` the search icon in the field | icons |
| `ComponentStarterDialog.tsx:67` the search icon, `:117` the item's icon tile | icons |
| `Inspector.tsx:545` a swatch control, `:593` a stepper, `:2042` the node's icon tile | icon-only controls |
| `ThemeEditor.tsx:567` remove, `ThemeLibrary.tsx:117` delete | icon-only buttons |
| `Builder.tsx:681` the `silicaui` mark, which restores on hover | attribution chrome, deliberately behind the author's work |

### Three that needed a decision rather than a rule

- **`Inspector.tsx` — `<em>hidden (visible: false)</em>` and `<em>empty</em>`.**
  Faded, inside an already-faded paragraph. They are not de-emphasised
  duplicates: when a bound value is hidden or empty they are the **only** thing
  on that row. That is the "absence behaves like fine" shape, and absence is the
  thing that most needs to be legible. Real ink.
- **`ThemeLibrary.tsx` — two `<code>` tokens inside an explanatory line.** Once
  the sentence around them took real ink, leaving the code faded would make the
  code *less* readable than the prose it sits in, which is backwards. Real ink.
- **The harness's own three labels** — "Demo host UI", the email equivalent, and
  "Contributed by the demo host". Not silicaui's chrome, but the demo every
  evaluator opens first, in this repo, under this rule. Real ink.

### Confirmed by

Not by a grep. A grep proves what was typed; this reads what is **painted** —
every leaf element in the chrome outside the canvas, its computed colour pushed
through a canvas so the number is real sRGB bytes rather than the digits inside
an `oklab(...)` string:

```
CONTROL black -> 0,0,0   white -> 255,255,255   a 70% ink -> alpha 179   ok

===== builder chrome, text inks, light =====        ===== DARK =====
 137 x  rgb(21,25,30)    alpha 255                   137 x  rgb(229,232,236) alpha 255
  16 x  rgb(246,249,251) alpha 255                    16 x  rgb(6,9,15)       alpha 255
   2 x  rgb(22,51,82)    alpha 255                     2 x  rgb(167,201,240)  alpha 255
   1 x  rgb(137,0,26)    alpha 255                     1 x  rgb(255,137,132)  alpha 255
(icon glyphs skipped: 114 — RULE #3 is about text)
```

**Every text ink in the builder chrome is now at full alpha, in both themes.**
Four inks, and each is doing work: the readable ink, the inverse ink on filled
controls, primary on the selected crumb, error on "Delete". Hierarchy from scale,
weight and colour — which is what the rule asks for instead of fading.

**The first version of this probe could not have failed.** It read three
channels and stopped. `color-mix(…, transparent)` leaves the RGB alone and drops
the ALPHA, so a `/70` ink and a full one came back as the same number and the run
printed a clean result it had not earned. The control now proves the instrument
can see fading before any finding is believed — a 70% black must come back with
an alpha under 250, and it reads 179.

`pnpm verify` — exit 0.  Builder e2e — **217 passed**.  `tsc --noEmit` — clean.
