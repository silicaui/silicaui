---
"@wizeworks/silicaui": patch
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-mcp": patch
---

Five layouts each for footers, pricing, CTAs, features, and testimonials

The navbar and hero families were split into five distinct, uniquely-named layouts because a
category with one entry is a single answer to a question that has several. Every other family
still had that problem — most visibly `footer`, which had exactly **one** block, and which every
page on earth ends in.

**Five more families, five layouts each.** The catalog goes 26 → 44 blocks.

| **Footer** | |
| --- | --- |
| **Columns** | the everyday closer: brand, blurb, social, three link columns, legal bar |
| **Minimal** | one slim row for an app shell or docs site — and the only footer with a theme toggle |
| **Newsletter** | a working subscribe form leading two link columns |
| **Closing CTA** | a dark `data-theme` island: the last ask fused into the footer, Linear/Vercel style |
| **Sitemap** | the wide one — four link columns, an office `<address>`, and a status pill |

| **Pricing** | |
| --- | --- |
| **Tiers** | three cards, featured middle |
| **Billing Toggle** | monthly/annual behind a real `tabs` behavior, not a bespoke switch |
| **Two Plans** | two wide cards with room for a two-column feature list each |
| **Single Plan** | one price, argued for, with the card sticky beside the copy |
| **Comparison** | a real `<table>` feature matrix with `scope="col"`/`scope="row"` |

| **CTA** | |
| --- | --- |
| **Band** | centered on a filled `primary` surface |
| **Split Media** | copy and actions beside an image |
| **Boxed Card** | a bordered card that sits inside a page instead of interrupting it |
| **Email Capture** | an inline subscribe form instead of a button |
| **Inline Bar** | one sentence, one button, for the foot of an article |

| **Features** | |
| --- | --- |
| **Grid** | the data-bound one — repeats over a host collection |
| **Media Split** | one capability, told properly, beside a picture of it |
| **Alternating** | three media rows that flip sides via `order-*` (source order stays copy-first) |
| **Bento** | an asymmetric grid where the lead feature gets the biggest cell |
| **Checklist** | a dense two-column list, no cards, no media |

| **Testimonial** | |
| --- | --- |
| **Quote** | one large centered pull-quote |
| **Grid** | three-up cards |
| **Carousel** | long-form quotes one at a time — **the first block to use the `carousel` behavior** |
| **Logo Wall** | a wall of customer wordmarks with one quote pinned inside it |
| **Portrait** | a photographed customer beside their quote and the outcome it produced |

### Breaking-ish for consumers

- **The bare `Hero` and `Footer` palette rows are gone.** Both were inert CSS primitives wearing a
  block family's one-word label, which is exactly why the bare `Navbar` row was removed when that
  family shipped. The `Hero` / `Footer` / `FooterTitle` component macros are untouched in
  `@wizeworks/silicaui`, `-html`, and `-react`, and the `.hero` / `.footer` CSS is untouched too;
  only the Insert rows are gone. A host that hid them by key can drop those entries.
- **Seven existing blocks got a major bump inside their manifest** (`footer`, `pricing_tiers`,
  `cta_band`, `feature_grid`, `feature_media`, `testimonial_quote`, `testimonials_grid`). Every
  **`key` is unchanged**, so saved documents, host starters, and the default frame are unaffected —
  but the trees are rebuilt on the family kits and the golden fixture changed accordingly.
- **`footer` went from 2 slots to 24.** It previously exposed only `brand` and `blurb`: twelve
  links and three column headings were hard-coded past the reach of `fillSlots`, so a host could
  fill the wordmark and nothing else.

### Also fixed — two colour bugs the new blocks surfaced

Both were found by screenshotting every block in both modes, and both are older
than this change. They are fixed at the source rather than at the call site,
because the call-site fix in each case was "repeat the role on every child",
which just relocates the bug to the next person who recolours a section.

- **Headings ignored the surface they sat on.** `typography.js` DECLARED
  `color: var(--color-base-content)` on `h1`–`h6` (and on `small`, `blockquote`,
  `.lead`, `.caption`), and a declared colour beats an inherited one. So a
  `<section class="bg-primary text-primary-content">` painted its heading
  base-content anyway: dark ink on a dark primary band in light mode, pale on
  pale in dark. They now use `color: inherit` — `[data-theme]` already sets
  `color: var(--color-base-content)` on the themed root, so the default is
  unchanged, a nested theme island still works, and a section that paints itself
  a role surface now names that role **once** and everything inside follows.
  Swap `bg-primary text-primary-content` for the `secondary` pair and the whole
  band moves with it; nothing inside hardcodes a role.
- **Dark mode kept the light-mode ink over a re-pointed role.**
  `resolveThemeTokens` treated any `-content` token surviving the light→dark
  merge as authored and skipped derivation. A theme in the ordinary shape —
  `--color-primary-content` in `tokens`, only `--color-primary` overridden in
  `dark` — therefore painted white ink on the pale dark-mode primary at about
  **1.7:1**. "Authored" is now per mode: an ink authored for light survives into
  dark only while the dark bag has not re-pointed its role colour, otherwise it
  is re-derived (**7.96:1** for the case above). An authored ink whose role never
  moves is left exactly alone. The shipped presets never tripped this —
  `defineTheme` emits no `-content` at all — which is why it went unnoticed: it
  only bit a consumer's hand-written theme, and the builder harness ships one.

`verify.mjs` now fails any block that paints a filled role surface carrying text
without naming the matching `-content` ink on the same node, and
`verify-theme-presets.mjs` covers the resolver contract in both directions.

### Also fixed

- **`feature_grid` named an icon the builder cannot draw.** `sparkles` exists in
  `silicaui-html`'s icon set but not in the builder's baked copy, so the canvas rendered an empty
  span while published output rendered a glyph. It is now `layout`, and `verify.mjs` walks every
  block asserting each `Icon` name resolves, so the class of bug is closed rather than the instance.
- **`hero_statement`'s palette glyph was not a real `IconName`** (`"type"`), which failed
  `tsc --noEmit` in the builder. It is now `text`.
- **A centered pull-quote hung a rule down one side of itself.** `typography.js` gives every
  bare `<blockquote>` a `primary` inline-start bar and matching padding — right for a long
  left-aligned quote, wrong for a centered one, where the padding shifts the text off-centre.
  `testimonial_quote` v1 shipped that. Every quote in the family now states which it wants, and
  `verify.mjs` fails a `<blockquote>` that declares neither.

### New guardrails

`verify.mjs` pins each family at five and adds the one invariant its members could break
independently: a real `<footer>` landmark and shared `brand`/`copyright` slots on every footer;
one open panel and a panel per tab on the billing toggle; `headline` + `primary` on every CTA;
and a check that `cta_band` never puts a `btn-primary` on its own `bg-primary` surface — which is
invisible on screen and looks completely correct in source. `docs/blocks-contract.md` gains a
§14 "Families" section documenting the shared-slot, kit, literal-class, contiguity, and
pinned-count rules a new variant has to follow.
