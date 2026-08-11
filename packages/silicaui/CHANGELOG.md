# @wizeworks/silicaui

## 0.53.0

### Minor Changes

- cba5df1: A horizontal strip now says so when there is more of it off-screen — and `Tabs` does it on its own

  `overflow-x: auto` on its own is a trap on anything that can be dragged narrow. The content stays
  reachable, but the only thing announcing it exists is a scrollbar that overlay-scrollbar platforms
  (macOS, iOS, Android) never draw until you are already scrolling. A tab strip that ends at
  "Activity" with Documents and Details past the edge does not have those tabs, as far as the person
  looking at it is concerned.

  ### `ScrollStrip`

  ```tsx
  <ScrollStrip label="filters" trackClassName="gap-2">
    {filters.map((f) => (
      <Badge key={f}>{f}</Badge>
    ))}
  </ScrollStrip>
  ```

  Prev/next controls mount the moment the content stops fitting, and they are **in flow**, not
  overlaid — an overlaid chevron covers the item at the edge, which is exactly the item you were
  trying to read. At an end a control disables but keeps its footprint, so the strip never jumps
  sideways.

  That pairing is load-bearing rather than cosmetic: mounting a control narrows the scroller, which
  can create the very overflow that justified it — remove it and the overflow goes, so it comes back,
  forever. Overflow therefore decides whether the **pair** is mounted and position decides only
  whether each is disabled.

  Also handled: RTL (`scrollLeft` runs negative, and the glyphs turn around), `prefers-reduced-motion`
  (owned in CSS, so the buttons inherit it with no branch in the JS), an opt-in `fade` that clears
  itself at whichever end is not clipped, and a keyboard tab stop on the scroller **only** when
  nothing inside it already has one.

  New: `.scroll-strip` / `-track` / `-control` (+ the `xs`–`xl` ramp and `-faded`) in the CSS plugin,
  a `ScrollStrip` macro and `scroll-strip` behavior for the framework-neutral layers, and a
  `chevronLeft` glyph the bundled Lucide set was missing.

  ### `Tabs` carries it without a wrapper

  `TabsList` gains `scrollable` (**default `true`**), so overflowing tabs announce themselves with no
  change at any call site. Requiring every consumer to remember a wrapper is the papercut, not the fix.

  The list itself becomes the scroller rather than gaining a div around it, so Base UI's moving
  indicator keeps measuring against the same box. Two consequences worth knowing:

  - **Layout.** An `inline-flex` list shrink-wraps its content and therefore can never detect that it
    overflows — a scrollable list has to be constrained by its parent, so the wrapper is block-level
    and fills the available width. The tabs still shrink-wrap and stay left-aligned, and the baseline
    rule still ends at the last tab. Pass `scrollable={false}` for a strip that must shrink-wrap its
    own box.
  - **The indicator.** `overflow-x: auto` forces the other axis off `visible`, so a horizontal
    scroller necessarily clips vertically; the underline's deliberate 1px overhang is tucked flush in
    the scrollable case so it is not shaved to 1px tall.

  On the vanilla side this is wired into the `tabs` behavior directly rather than by nesting a
  `scroll-strip` root inside the list — part lookup stops at a nested behavior boundary, so every
  `tab` would have resolved to the inner root and selection would have gone dead while the strip
  scrolled beautifully.

## 0.52.0

## 0.51.0

## 0.50.0

## 0.49.0

## 0.48.0

### Minor Changes

- 2b079ee: `marquee` — an infinitely-looping ticker, in all four layers

  The `marquee` **behavior** already shipped: registered in `silicaui-behaviors`, named in the
  `BehaviorType` union, documented in the architecture spec and the MCP catalog. There was no marquee
  **component** anywhere — no CSS, no React, no `ComponentDef` — so the handler paused an animation
  that nothing in the library defined. It could only ever do something for a consumer who hand-wrote
  their own keyframes and then dropped our marker on top. Our own landing page did exactly that,
  under a comment reading "Tailwind has no infinite-marquee utility". Neither did we.

  ### The loop distance is not `-50%`

  Every marquee recipe on the web renders the content twice and animates to `-50%`. That is correct
  only with no gap between items. With gap `G` and `R` copies the track measures `R·group + (R−1)·G`,
  so `-100%/R` lands `G/R` short of a whole cycle — the strip snaps back a fraction early, once per
  loop, forever. Small enough to look like a rendering glitch, big enough to see.

  The exact cycle is `group + G`:

  ```css
  @keyframes silica-marquee {
    to {
      transform: translateX(
        calc((-100% - var(--marquee-gap)) / var(--marquee-copies))
      );
    }
  }
  ```

  Carrying `R` as a variable instead of baking in `-50%` also turns the copy count into a knob. The
  other failure mode of a marquee is content too narrow to overflow its container: one pass runs out
  before the loop returns and the tail of each cycle is blank. That is not fixable in CSS by
  measurement, but it is fixable by repetition — hence `repeat` (2–6, and the CSS is a var-setter
  class per count so `toHtml`, which refuses inline `style` on principle, can emit it too). The
  landing-page wall needed `repeat={3}`; it had been running two copies with a blank tail.

  ### New

  - **`.marquee`** (clipping viewport) › **`.marquee-track`** (what travels) › **`.marquee-group`**
    (one copy). Colorless — it moves things, it doesn't paint them.
  - Variants: **`-vertical`**, **`-reverse`**, **`-slow`/`-normal`/`-fast`** (80s/40s/20s),
    **`-fade`**, **`-pause-on-hover`**, **`-copies-2`…`-6`**. Speed and gap are custom properties
    (`--marquee-duration`, `--marquee-gap`, `--marquee-fade`) so any value is reachable inline
    without fighting specificity.
  - **`<Marquee direction speed pauseOnHover fade repeat>`** in React.
  - A **`Marquee`** `ComponentDef`, and a palette entry in the site builder.

  ### Duplicated content is hidden twice over

  Every copy past the first is `aria-hidden` **and** `inert`. `aria-hidden` alone leaves the
  duplicate tabbable while announcing as nothing — tab into copy #2 of a logo wall and focus lands
  somewhere a screen reader insists is not there. In the node tree the extra copies are also
  id-stripped: ids are globally unique by contract, so a duplicate carrying the original's id makes a
  builder click land on whichever copy the DOM query hit first. `inert` joins `GLOBAL_ATTRS` in
  `silicaui-html` for this — it sits next to `hidden` for the same reason both are safe, in that it
  only ever removes capability and carries no URL or script surface.

  In React neither spelling of the prop survives both supported majors — React 18's types don't know
  `inert` and drop `inert={true}` as a non-boolean attribute, React 19 knows it as a boolean and
  drops `inert=""` — so it is set on the node through a ref callback instead. Server-rendered markup
  therefore carries `aria-hidden` but not `inert` until hydration.

  ### The behavior handler was pointing at the wrong element

  It set `style.animationPlayState` on the behavior root. The animation lives on the `track` part, so
  the moment a real component existed the root would never have seen it. It now toggles
  `data-sui-paused` and lets the stylesheet decide, which keeps play-state with exactly one owner and
  means the handler never has to know which descendant is animated. Pause-on-hover is CSS in both
  paths; what is left for JS is the editor-canvas freeze, plus honouring `params.pauseOnHover` for
  hand-authored markup that carries the marker without the class.

  `prefers-reduced-motion` is deliberately **not** handled in JS. The CSS stops the animation and
  hands the strip back as a plain scroller — freezing a clipped strip strands everything past the
  first viewport behind `overflow: hidden`, which for a ticker of announcements or links is worse
  than the motion was. Decorative walls opt back out with `overflow-hidden`, as the landing page
  does. That rule needs two selectors, not one: every rule that _assigns_ an animation is two classes
  deep (`.marquee-vertical .marquee-track`) and a media query adds no specificity, so a bare
  `.marquee-track` loses and the vertical variant keeps moving.

  ### Dogfooding

  `apps/site/app/globals.css` loses its entire hand-rolled marquee block — keyframes, three speed
  classes, the reduced-motion override and the edge mask — and the hero wall is three
  `<Marquee direction="up">`. The file's only remaining custom rule is `.mono`.

  Covered by 17 structural `toHtml` checks, 10 jsdom hydration checks driving the real pause flag, and
  a browser pass asserting the strip actually travels, that hover actually stops it, and that reduced
  motion actually stills it in both orientations — the vertical-specificity bug passed every
  structural assertion right up until something measured a moving pixel.

## 0.47.0

### Minor Changes

- a81f64f: `--noise` paints grain. It had never painted anything.

  The token, the builder's Effects ▸ Noise switch and the "Grain on surfaces" caption all shipped;
  no CSS read the token, so the control was decoration. It now paints a tiling SVG turbulence grain on
  the themed surface.

  **Where.** The `[data-theme]` rule — the single declaration that defines "surface" in this system, so
  one rule covers the page and every scoped island, and a Card keeps its clean opaque fill: a raised
  surface sitting ON textured paper, which is the effect grain is for.

  **How it's gated.** `background-size: calc(var(--noise, 0) * 128px)`. A zero-sized background image
  is never painted, so `--noise: 0` costs nothing — and unlike an `::after` overlay this needs no
  `position: relative` on every `[data-theme]`, which would silently re-parent any absolutely
  positioned descendant resolving against an ancestor outside the island. A theme must not move a
  consumer's layout.

  **Why the filter chain looks the way it does.** Three things were found by measuring pixels, not by
  reading specs:

  - `color-interpolation-filters='sRGB'` is load-bearing. SVG filters default to linearRGB, which
    pushed the layer's mean off mid-grey and made every hand-derived coefficient wrong. Pinned to
    sRGB the flattened layer measures mean **128.0** exactly.
  - The noise is composited onto an opaque `feFlood` **before** any `feColorMatrix`/
    `feComponentTransfer`. Those primitives operate on un-premultiplied color, and `feTurbulence`
    emits a noisy ALPHA channel — run directly on turbulence they divide RGB by a near-zero alpha and
    clamp to white. Two earlier cuts did exactly that and washed a base-200 surface **+7.7/255**
    lighter while carrying a standard deviation of **0.5** — all haze, no grain, and every
    computed-style assertion passed the whole time.
  - Contrast is stretched about 0.5 because that is the identity point of `overlay`
    (`b<0.5 → 2bs = b`, `b>=0.5 → 1-2(1-b)(1-s) = b`). Centering there is what lets grain add texture
    without moving the surface color a designer chose.

  Measured on the real board, the shipped version is **Δmean 0.11 with sd 2.99** on a light surface and
  **Δmean 0.05 with sd 1.44** on a dark one. `e2e/theme-noise.spec.ts` asserts those two numbers by
  decoding actual screenshot pixels — the computed-style assertions alongside them could not see the
  defect that was hit twice.

  Also gives the Theme panel's Effects switches an `aria-label`. They shipped with no accessible name,
  which a screen reader announces as a bare "switch".

### Patch Changes

- a81f64f: Motion is themeable, and the focus ring has both of its knobs.

  Measured by what the components actually read versus what the theme editor wrote, three tokens were
  live in CSS and reachable from nothing. `--duration` and `--ease` are read by **86 declarations
  across 38 components** — every hover, focus, open/close and checked transition in the library —
  which made snappy-vs-relaxed, a real brand axis, the single largest unthemeable surface in the
  system. `--focus-offset` left the focus control half-finished: "Focus ring" wrote `--focus-width`
  and `--disabled-opacity`, so a ring could be thickened but never moved off the control it outlines,
  which is the adjustment that makes a ring legible against a filled Button.

  All three join `SCALAR_TOKENS`, which lights them up in the builder's Theme panel and the MCP's
  `get_tokens` at once: a new **Motion** group (Speed: off/snappy/base/relaxed → `--duration`; Easing:
  standard/linear/out/spring → `--ease`) and a **Focus gap** row beside the existing width. The panel's
  Motion group is deliberately distinct from the Inspector's `Animate ▸ Speed`, which sets
  `sui-duration-*` on ONE node's entrance animation — this is the resting transition speed of every
  control on the page. `SCALAR_TOKENS` gained an exported `ScalarToken` type, since `--ease` is the
  first entry whose value isn't a number and so carries `options` instead of a `min`/`max`/`step`.

  **Fixes an accessibility hole this would otherwise have opened.** `theme.js` flattened motion for
  `prefers-reduced-motion: reduce` by setting `--duration: 0.01ms` on `:root` — which a theme island
  defeats, and not through specificity: a custom property declared on a DESCENDANT shadows the
  inherited value for that entire subtree, so a `[data-theme]` element carrying its own `--duration`
  keeps animating no matter what the `:root` rule says. Exposing a speed control would have handed
  every theme author a way to override a user's stated accessibility preference without knowing it.
  The guard now matches `:root, [data-theme]` and is `!important`, so it also beats the inline `style`
  a live editor writes on the island. `e2e/theme-motion.spec.ts` asserts a relaxed theme still
  flattens under reduced motion — and that test was confirmed to fail against the old `:root`-only
  rule before the fix landed.

## 0.46.0

## 0.45.0

### Minor Changes

- b33c93d: `stack` now peeks at any card size, and the fan is tunable

  `.stack` layers its children into a peeking deck. The nudge that produced the peek was a fixed
  `1.5rem` while the shrink that fights it — `scale()` against `place-items: center` — is
  **proportional**, pulling each edge in by `size × (1 − scale) / 2`. So the two crossed over:

  ```
  2nd card:  12px > h × 0.0375  →  h < 320px
  3rd card:  24px > h × 0.075   →  h < 320px
  ```

  Above ~320px in the peeking dimension every edge went negative and the deck rendered as a single
  card — no warning, no documented ceiling. It looked correct everywhere it was exercised because the
  only specimens were 128×192, comfortably under the ceiling; it failed the first time a card was
  given real content. Reported from sparx's pricing hero at 480×448, where the back cards sat 6px and
  12px _inside_ the front one. Below the ceiling it was not much better: at `w-48` the peek was a ~5px
  sliver, not a fanned deck.

  Both terms are now proportional. Each transform pays back its own shrink first — the `3.75%` /
  `7.5%` terms cancel it exactly — and only then translates by `--stack-peek`:

  ```css
  & > * {
    transform: translateY(calc(-7.5% - var(--stack-peek) * 2)) scale(0.85);
  }
  & > *:nth-child(2) {
    transform: translateY(calc(-3.75% - var(--stack-peek) * 1)) scale(0.925);
  }
  ```

  A percentage in a translate resolves against the element's own border box (`translateY` against
  height, `translateX` against width), so one declaration fans identically at every size, and
  `--stack-peek` is the **real, visible** peek rather than a number that has to out-run the scale.
  `-bottom` / `-start` / `-end` use the same figures — the scale is uniform.

  ### New

  - **`--stack-peek`** on `.stack`, the visible peek per step (2nd card one step, 3rd two, so the deck
    fans evenly). Defaults to `5%`. Accepts any length, so `--stack-peek: 12px` works too, and it is
    reachable as a Tailwind arbitrary property: `className="[--stack-peek:4%]"`.
  - **`stack-xs` … `stack-xl`** (2% / 3.5% / 5% / 7% / 9%), and a matching **`size`** prop on the
    React `<Stack>`. Orthogonal to direction, so `stack stack-end stack-lg` is a wide sideways fan.
    A hero deck and a notification pile want visibly different fans; neither could ask for one before.

  ### Behavior change

  A deck's fan is now a share of the card rather than a constant, so existing decks shift: at the
  128×192 the old demo used, the peek moves from 7.2px/14.4px to 6.4px/12.8px — near-identical — while
  anything larger goes from _nothing_ to a real fan. Pin the old look on a small deck with
  `stack-lg`, or set `--stack-peek` to an explicit length.

  ### Watch out when sizing a deck

  Children stretch to the deck's **width** but keep their own height, so a height class belongs on the
  card and a width class on the deck. `place-items: center` is deliberate — a block-axis stretch would
  squash a deck of `<img>`. A height on the `.stack` itself is an empty box around content-height
  cards, and since the peek is a share of the card, it also reads as a much smaller fan than asked
  for. The demo had this backwards and has been corrected.

  Covered by `examples/playground/e2e/stack-peek.spec.ts`, which measures real browser geometry at
  480×448 — the size that used to collapse. jsdom does no layout, so this class of defect is only
  catchable in a browser.

## 0.44.0

### Patch Changes

- c1ed199: Five layouts each for footers, pricing, CTAs, features, and testimonials

  The navbar and hero families were split into five distinct, uniquely-named layouts because a
  category with one entry is a single answer to a question that has several. Every other family
  still had that problem — most visibly `footer`, which had exactly **one** block, and which every
  page on earth ends in.

  **Five more families, five layouts each.** The catalog goes 26 → 44 blocks.

  | **Footer**      |                                                                                      |
  | --------------- | ------------------------------------------------------------------------------------ |
  | **Columns**     | the everyday closer: brand, blurb, social, three link columns, legal bar             |
  | **Minimal**     | one slim row for an app shell or docs site — and the only footer with a theme toggle |
  | **Newsletter**  | a working subscribe form leading two link columns                                    |
  | **Closing CTA** | a dark `data-theme` island: the last ask fused into the footer, Linear/Vercel style  |
  | **Sitemap**     | the wide one — four link columns, an office `<address>`, and a status pill           |

  | **Pricing**        |                                                                    |
  | ------------------ | ------------------------------------------------------------------ |
  | **Tiers**          | three cards, featured middle                                       |
  | **Billing Toggle** | monthly/annual behind a real `tabs` behavior, not a bespoke switch |
  | **Two Plans**      | two wide cards with room for a two-column feature list each        |
  | **Single Plan**    | one price, argued for, with the card sticky beside the copy        |
  | **Comparison**     | a real `<table>` feature matrix with `scope="col"`/`scope="row"`   |

  | **CTA**           |                                                                    |
  | ----------------- | ------------------------------------------------------------------ |
  | **Band**          | centered on a filled `primary` surface                             |
  | **Split Media**   | copy and actions beside an image                                   |
  | **Boxed Card**    | a bordered card that sits inside a page instead of interrupting it |
  | **Email Capture** | an inline subscribe form instead of a button                       |
  | **Inline Bar**    | one sentence, one button, for the foot of an article               |

  | **Features**    |                                                                                |
  | --------------- | ------------------------------------------------------------------------------ |
  | **Grid**        | the data-bound one — repeats over a host collection                            |
  | **Media Split** | one capability, told properly, beside a picture of it                          |
  | **Alternating** | three media rows that flip sides via `order-*` (source order stays copy-first) |
  | **Bento**       | an asymmetric grid where the lead feature gets the biggest cell                |
  | **Checklist**   | a dense two-column list, no cards, no media                                    |

  | **Testimonial** |                                                                                     |
  | --------------- | ----------------------------------------------------------------------------------- |
  | **Quote**       | one large centered pull-quote                                                       |
  | **Grid**        | three-up cards                                                                      |
  | **Carousel**    | long-form quotes one at a time — **the first block to use the `carousel` behavior** |
  | **Logo Wall**   | a wall of customer wordmarks with one quote pinned inside it                        |
  | **Portrait**    | a photographed customer beside their quote and the outcome it produced              |

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

## 0.43.1

### Patch Changes

- f802ac6: **Releases now happen on merge, with nothing to click.**

  No runtime change in any package — this is the release pipeline itself, and the first
  version cut by it.

  Merging a changeset to `main` used to open a "Version Packages" PR that had to be
  opened and merged by hand before a second workflow run would publish. Half this repo's
  commits and half its PRs were that ceremony, every one of them merged within seconds
  and unreviewed, and ~40% of release runs failed outright creating the PR because the
  org disables "Allow GitHub Actions to create and approve pull requests" — leaving a
  pushed branch and no PR to clean up.

  The Version PR is gone. `ci.yml` is now one graph — lint, build, verify, site, then
  release and deploy — so publishing is a `needs:`-gated job that cannot start unless CI
  is green. Previously release and deploy raced CI rather than following it, and a red
  build could reach both npm and silicaui.com.

  Two things are restored rather than added. Packages are tagged again, and a GitHub
  Release is cut for each version: when the publish step was hand-rolled to work around
  `changesets/action`, it silently dropped that action's `git push --tags` and release
  creation, so roughly forty published versions have neither. And `guard-version` now
  also rejects a `major` bump while the family is pre-1.0 at the moment the changeset is
  authored — it previously could only fire after versions were already computed, on main.

  The pipeline also stopped repeating itself: one `pnpm build` per push instead of four,
  one Next export instead of two, and the deploy ships the exact `out/` CI verified
  instead of rebuilding its own.

## 0.43.0

### Minor Changes

- f166e9e: **A color you invent now reaches every component, not just buttons.**

  Silica's core promise is that N named colors cascade through everything — invent
  `brand` and you get `btn-brand`, `badge-brand`, `alert-brand`, and the rest for
  free. That held at build time and quietly collapsed at runtime, in the one place a
  color is actually invented: the builder's theme editor.

  Two defects, both fixed here:

  1. **Only `btn-` regenerated.** Each component carried its own inline
     `for (const name of colors)` loop — 35 copies of the same shape, private to 35
     module scopes. Button alone had ever been factored out, so the builder's runtime
     cascade could re-emit exactly one family. A live `brand` painted buttons and
     silently skipped Badge, Alert, Input, Tabs and 30 others. The mappings now live
     in one declarative `color-variants.js` table that both callers — the plugin at
     build time and `customColorCss` at runtime — drive from the same generator, so a
     live color is byte-for-byte a declared one. `verify-color-reach.mjs` fails the
     build if a factory takes `colors` without registering there, so a new colored
     component can't silently drop out of the cascade.

  2. **Colors added in dark mode were invisible.** `rolesOf` scanned `theme.tokens`
     only, so a color created while the theme editor was in dark mode landed in
     `theme.dark` and never appeared — no palette tile, no Inspector swatch, no
     generated utilities — even though the token was really there and the color
     picker could still edit it. It now scans both: a role is a role regardless of
     which mode declares it.

  Every entry stays a pure var-setter (a color class assigns `--<c>-*` and paints
  nothing), so color still composes with style and size classes without specificity
  fights. A snapshot diff of the generated CSS confirmed the refactor is
  byte-identical for the shipped colors — this adds reach, it does not restyle
  anything.

  The MCP catalog picks up the same table, so `list_classes` / `get_component` now
  report the full color-variant set per component.

## 0.42.0

## 0.41.0

## 0.40.0

## 0.39.0

## 0.38.0

## 0.37.0

## 0.36.0

### Patch Changes

- 5d01dd4: Close the open host-seam asks: responsive authoring, per-page layouts, conditional
  visibility, op inversion — and fix two house-rule breaches in the shipped blocks.

  **Per-breakpoint authoring.** `Editor.setClassToken(id, group, value, prefix)` sets one
  member of a class group at one container breakpoint without disturbing the others;
  `classTokenAt` / `classTokenBreakpoints` read it back with the mobile-first cascade
  resolved, so a control can show a value as inherited rather than set. The Inspector
  gains a breakpoint selector (base / tablet / desktop) that follows the device toggle.
  Writing a container variant now also guarantees a container context exists
  (`Editor.ensureContainer`), on the tree root — where the query measures the page, the
  width the device toggle actually sets.

  **Viewport variants are rejected by default** in live documents
  (`EditorOptions.viewportVariants`, `BuilderHost.viewportVariants`) — a policy a host
  can lift, deliberately NOT part of the un-liftable security floor. `lintTree` reports
  container variants with no container ancestor, the check a `ClassValidator` can't do
  because it sees the string and not the tree.

  **Per-page layouts.** `Page.frameId` picks the site default (absent), no frame at all
  (`null` — the landing page that was previously unrepresentable), or a named frame from
  the new `Site.frames`. `frameFor` / `frameDiagnostic` resolve it; a dangling id renders
  bare and reports, rather than silently restoring the default header.

  **Conditional visibility.** A new `{ kind: "visible"; ref; negate? }` data binding drops
  a node and its subtree without consuming the node's content slot. Scope-aware (works
  per item inside a collection), and an unknown ref KEEPS the node — a resolver typo must
  never silently delete a section. Wired through both the site and email resolvers and
  Inspectors.

  **Op inversion.** `Editor.inverseOf(ops, before)` returns the ops that undo a batch, so
  a host driving undo through `setHistoryDelegate` no longer has to re-derive them. This
  closes the two that were impossible from outside: a `symbol.set` that creates (its
  inverse needs a detach cascade of engine-minted ids — also available on its own via
  `Editor.planSymbolDelete`) and `node.setText` over rich children, which now inverts into
  the new `node.setChildren` op instead of flattening irrecoverably.

  **Contrast-derived foreground ink.** `-content` tokens are now chosen by MEASURED
  contrast (`deriveContent`, `resolveThemeTokens`, `contrastWarnings` in
  @wizeworks/silicaui-html) rather than an OKLCH lightness threshold, which picked white on
  seven role colors across the four shipped presets where black would have passed WCAG AA.
  The CSS last-resort threshold moves 0.68 → 0.57 for colors no build step can see, and
  the plugin's own `error-content` is fixed (4.26:1 → 4.66:1).

  **Also:** `Editor.batch()` for one-undo-step multi-node edits (site + email);
  `Builder` `initialMode` / `onModeChange`; keyboard arrows to navigate and reorder,
  select-parent on Escape, `Cmd+X`, `Cmd+G`; `srcset`/`sizes` emission on Image plus a
  quantized focal point; `resolveTree` now resolves a node's children after an
  attr-targeted fill (a bound card could not previously contain anything bound).

  **Blocks:** dropped the `eyebrow` part from "Content — prose section" and "Feature —
  media split", and swept faded `/opacity` ink out of all shipped blocks. Both are now
  enforced by the block linter (`no-eyebrow`, `no-faded-ink`), which runs at module load.

## 0.35.0

## 0.34.2

## 0.34.1

## 0.34.0

## 0.33.0

## 0.32.1

## 0.32.0

## 0.31.0

### Minor Changes

- bb098bc: Type scale to `text-10xl`, a fluid display ramp, and a consumable canvas vocabulary

  - **Type scale reaches `text-10xl`** and is now declared in one place (`@wizeworks/silicaui/type-scale`), consumed by the plugin and the MCP catalog generator so the documented ladder can't drift. `text-8xl`/`9xl` are now owned explicitly (previously present only via Tailwind's defaults).
  - **`display-1` / `display-2` / `display-3`** — an oversized hero ramp above the headings — and they are **fluid** (`clamp()` + container units), so they scale with their container instead of overflowing narrow screens. React: `<Display visualLevel={1|2|3}>` and `<Heading visualLevel="display-1">`. Bare `.display` equals `.display-3`.
  - **`@wizeworks/silicaui-builder/vocab`** exposes the canvas's utility-class vocabulary as consumable data — `CANVAS_UTILITY_CLASSES` (flat safelist), `CANVAS_VOCAB_GROUPS`, and `CONTAINER_BREAKPOINTS` — so a consumer's Tailwind safelist can be generated from silicaui's source of truth instead of hand-copied. The Inspector imports the same source, so the two can't drift.
  - The Inspector now **surfaces classes with no backing CSS** on the raw class field (and via a deduped console warning) instead of rendering them silently as no-ops.
  - The **MCP catalog now documents the type scale**: `tokens.json` gains `typography.scale` (every step with px), and `classes.json` gains a `type-scale` group (`text-xs` … `text-10xl`).

## 0.30.0

### Minor Changes

- fa40d33: **Text you're meant to read now uses real ink (RULE #3).**

  Faded ink had spread to 35 places it didn't belong. Each instance looked
  defensible on its own, which is exactly how it accumulated — it compiles, it
  renders, and it makes a screenshot look tidier. In aggregate it was draining
  the signal out of the one thing de-emphasis exists for.

  The worst of it:

  - `.lead` — the **lead paragraph**, the most prominent body copy on a page —
    was rendered at 82%.
  - `.accordion-content` and `.collapsible-content`, which are the entire reason
    those components exist, were at 80%.
  - Every `-description` (`dialog`, `popover`, `drawer`, `field`, `empty-state`)
    sat between 65% and 75%.
  - Data a user reads to make a decision — `meter-value`, `slider-value`,
    `color-picker-value-hex`, `timestamp`, `stat-title`/`-desc`,
    `data-table-pagination` — was faded.
  - Empty-state messages (`combobox-empty`, `data-table-empty`) — the only text
    on screen at that moment — were the faintest thing on it.

  Faded ink is retained where it's genuinely _not_ meant to be read: disabled
  controls, placeholders, the calendar's other-month days, transient
  enter/exit animation states, icons and glyphs, structural punctuation (a date
  field's `/`, a range separator), and the mockup browser's deliberately fake URL
  bar.

  Selection state was **not** treated as a reason to fade. `tabs-tab` and
  `outline-link` already mark the active item with a real accent color, so the
  fade on inactive items was redundant on top of a distinction that was already
  doing the work correctly — which is what RULE #3 prescribes: hierarchy from
  scale, weight, and color, not from fading text out.

  Guarded by `packages/silicaui/scripts/verify-readable-ink.mjs`, which fails the
  build on a muted `--color-base-content` ink outside the reviewed allowlist. The
  probe earned its keep immediately: it caught two instances the initial sweep
  missed, because it parses a selector-assignment form the sweep didn't. Verified
  visually in a browser, light and dark, not just as compiled CSS.

- a90b819: First-five-minutes hardening pass — four defects that shipped to npm and one
  latent projection bug, all in the surface a new adopter hits before anything
  else.

  **`<Checkbox>Run tests</Checkbox>` no longer crashes the page.** `Checkbox`,
  `Radio`, and `Toggle` now accept `children` as a caption, wrapping the control
  in a `<label>` so the text is a real click target. Previously the types
  permitted `children` (inherited from `React.InputHTMLAttributes`) while React
  threw _"input is a void element tag and must neither have `children`"_ at
  runtime — a type-checks-clean white screen. Passing no children is unchanged,
  so pairing with your own `<label htmlFor>` still works exactly as before.

  **The four components where a caption is meaningless now reject `children` at
  the type level** — `Input`, `FileInput`, `PasswordInput`, `SearchInput`. The
  last two were the sneakiest: their root JSX is a `<div>`, so the mistake looked
  safe while `{...rest}` landed the `children` on the inner `<input>` anyway.

  **Five packages were missing their `'use client'` directive.**
  `@wizeworks/silicaui-charts`, `-table`, `-editor`, `-dnd`, and `-panels` all use
  hooks but shipped without the directive, so importing any of them from a
  Next.js App Router page threw. The prepend logic is now one shared build helper
  instead of being re-derived per package, and a new `verify:packaging` CI step
  asserts the directive is present in every client bundle — and absent from
  `silicaui-react/server`, whose entire purpose is being server-safe.

  **`peerDependenciesMeta` no longer dangles.** `@wizeworks/silicaui-react`
  declared `@wizeworks/silicaui` as an optional peer with no matching
  `peerDependencies` entry, which npm and pnpm both accept silently — so the
  intended "you're missing the CSS package" warning never fired. The same CI step
  now catches this class of no-op.

  **`CheckboxOption` / `RadioOption` rendered an unstyled native control in
  static output.** The expansion routed the node's class to the wrapping
  `<label>`, leaving the actual `<input>` with no `.checkbox` / `.radio` class at
  all. The control class now stays on the input, and `Checkbox` / `Radio` /
  `Toggle` in `silicaui-html` gained the same optional caption as their React
  counterparts — so both layers now emit byte-identical markup for identical
  authoring. `Toggle` also picked up the `role="switch"` that React already had.

  **New `.label-control` class** for a label that wraps its own control: the whole
  row is the click target, and the caption gets real ink rather than the muted
  field-caption color `.label` uses, since it's text meant to be read.

  ### Documentation

  The `@source` directive is now documented in both READMEs. Tailwind v4 never
  scans `node_modules`, so without it the plain utilities used inside
  `silicaui-react` never compile — producing a _partial_ break (buttons and cards
  look right; dialog footers don't align, `Lightbox` has no size, `soft`/`glass`
  sit inert) that reads like a library bug rather than a one-line config gap.
  This affected every consumer, not just monorepos.

- a90b819: Three defects that produced no error — the page rendered, and was wrong.

  **`Alert` with `dismissible` now works outside React.** The React layer had
  `dismissible`/`onDismiss`, `silicaui-behaviors` shipped a working `dismiss`
  handler, and the `.alert-close` CSS existed — but the `silicaui-html` macro
  emitted a bare `<div role="alert">`, so a static or Sparx-rendered page got no
  close button at all. The macro now emits the button, the inlined close icon,
  and the `data-sui-behavior="dismiss"` marker. Verified across the whole chain
  (schema → `toHtml` → `hydrate` → click → removed) rather than by asserting the
  markup, since a structural check alone would have passed before the fix too.

  **`Swap` and `Stat` sized their icons.** Neither declared `width`/`height` for
  its `svg`, violating the project's own rule. This is the worst failure mode
  available: an unsized inline `<svg>` has no intrinsic size, so it can render
  correctly in Playwright's Chromium and collapse or balloon in a real browser —
  invisible to CI, including screenshots. `Swap` is entirely an icon component,
  and `stat-figure` defines an implicit grid column, so its glyph shifts the whole
  component's layout rather than just itself. A new `verify:icon-sizing` probe
  asserts every icon slot declares both dimensions.

  **A theme color that isn't registered with the plugin now says so.** Adding a
  color takes two steps, and doing only the first produces the most confusing
  possible result: `bg-brand` and `text-brand` work (Tailwind emits those), while
  `btn-brand`, `badge-brand`, and `alert-brand` silently render in the default
  color. Every instinct says the color is broken; it isn't, only the registration
  is missing. The plugin now detects this at build time and prints the exact
  fix line, ready to paste:

  ```
  [silicaui] Theme color brand is declared in @theme but not registered with the plugin.
    Fix: @plugin "@wizeworks/silicaui" { colors: primary, …, brand; }
  ```

  Best-effort by design: the plugin runs at its own position in the stylesheet, so
  this only sees `@theme` blocks declared _before_ the `@plugin` line. Colors
  registered through Silica's own `@plugin "@wizeworks/silicaui/theme"` block
  correctly stay silent — that path registers them by construction.

  ### CI

  Six packages shipped verify suites that **CI never ran**, so a regression any of
  them was written to catch could still reach `main`. A root `pnpm verify` now
  runs all of them plus the byte-identical HTML golden, and CI runs it.

- a90b819: **Every sized component now ships the full `xs`–`xl` scale.**

  Ten of twenty-nine sized components shipped a partial scale, so the same prop
  worked on one component and did nothing on the next:

  | Component      | Shipped             | Added               |
  | -------------- | ------------------- | ------------------- |
  | `EmptyState`   | `sm`                | `xs` `md` `lg` `xl` |
  | `FileInput`    | `sm` `lg`           | `xs` `md` `xl`      |
  | `MultiSelect`  | `sm` `lg`           | `xs` `md` `xl`      |
  | `TagInput`     | `sm` `lg`           | `xs` `md` `xl`      |
  | `Slider`       | `sm` `lg`           | `xs` `md` `xl`      |
  | `SegmentField` | `sm` `lg`           | `xs` `md` `xl`      |
  | `Toolbar`      | `sm` `lg`           | `xs` `md` `xl`      |
  | `ToggleGroup`  | `xs` `sm` `lg`      | `md` `xl`           |
  | `Prose`        | `sm` `lg` `xl`      | `xs` `md`           |
  | `Pagination`   | `xs` `sm` `md` `lg` | `xl`                |
  | `Meter`        | `xs` `sm` `lg` `xl` | `md`                |

  Nothing errored when a size was missing — `size="xs"` just rendered at the
  default, which reads as "the prop was ignored". The only way to learn which
  sizes a component actually supported was to read its CSS, per component. For a
  developer that's a papercut; for an agent generating code it's a silent
  correctness failure.

  The TypeScript unions were _honest_ about this (`ToolbarSize = "sm" | "md" |
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

## 0.29.0

### Minor Changes

- 8e7bd27: Soften the resting border on colored field controls

  A color class on a field-tier control (`.input-*`, `.select-*`, `.textarea-*`,
  `.pin-input-cell-*`, `.checkbox-*`, `.radio-*`, `.multi-select-*`,
  `.tag-input-*`, `.segment-field-*`) now paints a softened tint of that color at
  rest and the solid color on focus. Previously a colored control's border was
  identical at rest and on focus, so the border carried no state information —
  only the focus ring changed. This restores rest → focus as a visible
  transition, matching what the neutral (uncolored) default already did.

  `.multi-select`, `.tag-input` and `.segment-field` previously hardcoded a
  neutral resting border, so a color class on them showed no color at all until
  focus; they now follow the same two-lever model as the rest of the tier.

  Each color class now sets two levers rather than one: `--input-accent` (focus
  ring + focused border, unchanged) and the new `--input-border` (resting
  border), and likewise for the other controls — note the property stem doesn't
  always track the class name (`.tag-input` drives `--tag-*`). The resting tint is
  `color-mix(in oklab, <color> var(--field-border-tint, 45%), var(--color-base-100))`.

  Set `--field-border-tint` to tune how strong the resting tint is — lower is
  quieter. Because it mixes toward the surface color, the same ratio gives the
  same perceptual separation in both light and dark themes.

  Validation status is deliberately unaffected: `.field` and `.validator` drive
  status through the accent alone and reset the border lever, so `[data-invalid]`,
  `[data-status="error"|"warning"|"success"]`, and `:user-invalid`/`:user-valid`
  keep the solid border that makes them legible as a status — including on a
  control that also carries a decorative color class.

## 0.28.0

### Minor Changes

- 273c7f8: Give the system a coherent z-scale, and one shared field-affordance geometry.

  **z-scale.** Every globally-stacked surface now reads a token instead of a
  locally-chosen literal: `--z-drawer` (40), `--z-dialog` (50), `--z-lightbox`
  (60), `--z-popover` (70), `--z-tooltip` (80), `--z-toast` (90). The ordering rule
  is that a transient surface outranks anything it can be opened from.

  This fixes a real bug: every popover-class surface (`.dropdown`, `.popover`,
  `.select-popup`, `.navigation-menu`, `.preview-card`, the calendar popup) sat at
  `z-index: 50` while `.dialog` sat at `51`, so **any picker opened inside a modal
  rendered underneath it**. No component prop could fix it — a child can't
  out-stack its own parent's level — so apps were patching it in global CSS.

  Note the changed defaults if you have hand-tuned z-indexes against the old
  values: popovers moved `50 → 70`, tooltips `50 → 80`, and toasts `9999 → 90`.
  Each token is overridable, so `:root { --z-toast: 9999 }` restores the old top.

  **Field affordances.** The native `<select>` caret, the listbox trigger's
  chevron, and the Combobox / MultiSelect clear + open buttons were three
  independent implementations that had drifted apart — a solid gradient wedge at
  one trailing inset, a stroked SVG chevron at another, a third inside a round
  button at a third — so a Select and a Combobox stacked in one form showed
  visibly different marks at visibly different positions. They now derive from a
  single contract (`lib/field-affordance.js`): same mark, same ink, same trailing
  inset, same rotation-on-open.

  The most visible change is the native `<select>`, which now draws a **stroked**
  chevron matching the SVG one rather than a solid wedge. It's still painted with
  gradients — a `<select>` can carry neither a child nor a reliable
  pseudo-element, and an SVG data-URI can't resolve a CSS var — so the mark still
  follows the theme.

## 0.27.0

### Minor Changes

- 4d96f1c: ToggleGroup gains `size` and `color` props

  The CSS already carried a size vocabulary (`toggle-group-xs|sm|lg`, `md` default)
  and a colored active pill, but the React wrapper exposed neither — you had to hand-write
  the class. It now takes `size` (`xs | sm | md | lg`) and `color`, matching Button's prop shape.

  The colored pill is also no longer limited to three hard-coded roles: `toggleGroup()` now
  takes the plugin's `colors` list and emits a class per registered color, so any custom color
  works. Colors apply orthogonally — the color class only sets `--toggle-group-pill-*`, which
  the base `[data-pressed]` rule reads.

## 0.26.0

## 0.25.1

## 0.25.0

## 0.24.0

### Minor Changes

- 065d97b: Data-resolution honesty + a logo-capable brand mark + canvas binding resolution — three orthogonal fixes closing the gap between what the data layer promised and what it did. Design authority: `docs/data-resolution-and-brand-mark.md`.

  - **Resolution honesty (`@wizeworks/silicaui-html`)** — `ResolveHost`'s hooks now return `Resolved | undefined` (and `readonly unknown[] | undefined`), where a bare `undefined` means **"I don't know this ref"** and `{ value: undefined }` keeps its old meaning, **"I know it and it's empty"**. Those were previously the same value, so the walk _couldn't_ tell them apart and blanked the node either way. An unknown ref now **keeps the node's authored content** (marker included, so a re-resolve or a downstream runtime still sees the bind), never drops it, and reports a structured `ResolveDiagnostic` via the new optional `ResolveHost.onDiagnostic`. `omitWhenEmpty` deliberately does **not** apply to an unknown ref — "legitimately empty, render nothing" is a claim only a host that knows the ref can make. The core stays pure: no `console`, no `NODE_ENV` sniffing — loudness is the consumer's call. Widening the return type is source-compatible: an existing host's narrower return still typechecks and behaves exactly as before.

  - **Canvas resolution (`@wizeworks/silicaui-builder`)** — the canvas resolves bindings through the same `resolveTree` primitive `toHtml` uses, via a new `ResolveOptions.editing`. `editing` is a **destruction policy, not a second resolver**: same walker, same hooks, same refs, diverging only where production's answer is "show nothing" — which an editor can't render, because a dropped node can't be selected, inspected, or un-bound. So `visible:false` (and `omitWhenEmpty` at zero items) render **ghosted** and report `code: "hidden"`; unknown refs render their authored content wearing a warning outline plus a `data-sui-unresolved` hook. A **Data on/off toggle** (default on, shown only when the host resolves anything) flips back to the authored placeholder — which is what ships when data is absent, so it must stay visible and editable. Text showing **resolved** data is no longer `contentEditable` (committing it would overwrite the authored placeholder with host data); an unknown ref still shows authored text, so it stays editable. v1 resolves `value`/`html` binds only — a collection keeps its authored template unexpanded _and unresolved_, because cloning children clones their ids (which selection and React keys depend on), and resolving a nested field with no item in scope would blank the very placeholder being laid out.

  - **Brand mark (`@wizeworks/silicaui`, `@wizeworks/silicaui-react`, `@wizeworks/silicaui-html`)** — `Wordmark` can hold a logo. It was a text-only atom while its own CSS and React wrapper both already assumed a mark, so "put the logo in the wordmark" was impossible by construction. It's now a container with `src`/`alt`/`href` props (nesting an `Image`/`Icon` child remains the richer path and wins when present; `href` lowers the mark to an `<a>`, same sugar as `Button`). `alt` defaults to `""` — decorative, since the name renders beside it. The CSS mark rule generalizes from `& svg { width: 1.15em }` to `& :is(svg, img)` height-locked with **width auto**, so a non-square logo is no longer squashed to a square (square marks are unaffected). **Text-only Wordmark markup is byte-identical to before.**

  - **`ComponentDef.primary` (`@wizeworks/silicaui-html`)** — a component now declares which prop a bare `value` bind fills. This replaces `resolve.ts`'s hardcoded `Image`/`Avatar` name-list and its `"src" in props` sniff outright: the name-list meant every new bindable component needed a resolver edit, and the sniff was about to write a bound site **name** into a Wordmark's **logo URL**. `Image`/`Avatar` declare `primary: "src"`; `Wordmark` declares `primary: "text"`. Absent a declaration the old `label` → `text` fallback applies. Same coupling `ComponentDef.container` was introduced to kill.

  - **Host adapters extend, never re-declare** — `BuilderHost` and `EmailBuilderHost` both carried duplicate copies of the resolver hooks, so the widened signature didn't propagate and both Inspectors read `.value` off a possibly-`undefined` with the compiler silent. They now `extends ResolveHost` / `EmailResolveHost`. The builder's React entry also exports the `Editor` type (what `useEditor()` returns — a host couldn't name it), and `Canvas.isEmptyContainer` now asks a component's **expansion** rather than its authored children, so a prop-populated container is no longer painted over with an "empty — drop something here" placeholder.

## 0.23.0

## 0.22.0

## 0.21.0

## 0.20.0

### Minor Changes

- d0a6ca6: `Field` and `FieldStatus` now support a `floating` prop that takes the status panel out of flow (`position: absolute`, anchored under the field) so it never pushes sibling fields up or down as it appears, changes, or disappears — it overlays whatever's below instead. Off by default.

## 0.19.0

### Minor Changes

- 3893c74: Toast now supports a clickable action button. `useToast().add()` accepts `actionProps` (forwarded to Base UI's `Toast.Action`, rendered as a `<button>`) — commonly paired with `timeout: 0` so the toast doesn't auto-dismiss before the user can act: `toast.add({ title: "New version available", actionProps: { children: "Refresh", onClick: () => location.reload() }, timeout: 0 })`. Adds a `.toast-action` style (an outlined pill reading `currentColor`/`--toast-fg`, so it stays legible across every `data-type` and in dark mode) positioned between the toast content and the close button.

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

### Minor Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

## 0.10.1

## 0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

## 0.5.1

### Patch Changes

- `ChatMessage` (the convenience wrapper, not the raw `Chat`/`ChatHeader`/`ChatFooter` primitives) now renders name/time _after_ the bubble instead of before it, matching a modern messaging-app read where the message is the point and the timestamp is a quiet trailing detail. The avatar's alignment flips from bottom- to top-anchored (`.chat-image` `align-self: start`) so it lines up with whatever's first in the group — the bubble in `ChatMessage`'s new order, or a `ChatHeader` name/time row for anyone composing the primitives directly (e.g. a Slack-style header-above layout) — instead of hanging toward a short trailing metadata line.

## 0.5.0

### Minor Changes

- Fix several layout/visibility bugs found while auditing the playground, and add a proper chat typing indicator:

  - **Alert/Toast**: top-align the leading icon and trailing actions/close button (`align-items: flex-start`) instead of centering them against the whole (often multi-line) row. `.alert-close`/`.alert-actions`/`.toast-close` now claim their own trailing space via `margin-inline-start: auto` instead of relying on a sibling `AlertContent` to flex-grow — a dismissible one-liner Alert (bare children, no `AlertContent`) previously left the `×` sitting right next to the text instead of at the row's end.
  - **Collapsible**: new `CollapsibleTrigger` `variant="icon"` — a compact circular disclosure control (sized like `AlertClose`) for placing a second trigger in its own layout slot (e.g. an Alert's trailing actions) while a `variant="default"` trigger elsewhere carries the visible label; both share one `Collapsible`'s open state via context.
  - **Collapse**: renamed its CSS class from `.collapse` to `.details` everywhere (CSS, React, the `-html` macro, the prefix-recognition table, the builder's palette). Tailwind v4 ships a built-in `.collapse { visibility: collapse }` utility (for table row/column collapsing) that silently won over the component's own rule of the same name, making every `Collapse` invisible while it still occupied layout space. The public React names (`Collapse`/`CollapseTitle`/`CollapseContent`) are unchanged.
  - **Carousel**: `className` now applies to both the outer positioning root and the inner scroll strip, not just the strip. Previously a width-constraining class (e.g. `max-w-lg`) shrank the visible strip while the prev/next controls — absolutely positioned against the _root_ — stayed anchored to the full, unconstrained parent width.
  - **MockupPhone**: no component change; documented that content should fill the display (`w-full h-full`), not a fixed size smaller than it.
  - **Chat**: `.chat-layout-messages` now bottom-anchors (`justify-content: flex-end`) so a short conversation sits against the composer instead of pinned to the top with a dead gap below it. Added `ChatTypingIndicator` — three animated dots inside a real `.chat-bubble` (matching avatar/placement of a normal message) — replacing the old plain-text "is typing…" convention.

## 0.4.0
