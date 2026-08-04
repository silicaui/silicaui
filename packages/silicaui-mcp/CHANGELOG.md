# @wizeworks/silicaui-mcp

## 0.48.0

### Patch Changes

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

- a81f64f: The theme editor can size the selector tier, not just fields.

  Silica sizes controls off **two** base units: `--size-field` for anything with a field height
  (Input, Select, Textarea, Button, FileInput) and `--size-selector` for the square/round controls
  (Checkbox, Radio, Switch, Toggle, Badge). Every one of those components has read
  `calc(var(--size-selector, 0.25rem) * N)` since the first release — but `--size-selector` was never
  listed in `SCALAR_TOKENS`, so the token was invisible to everything downstream of that list. The
  builder's Theme panel offered a "Field base size" step and nothing for selectors, and the MCP's
  `get_tokens` didn't know the token existed. Radius already split all three ways in the same panel
  (Boxes / Fields / **Selectors**), which made the missing size lever read as a deliberate omission
  rather than a gap: a theme could round its checkboxes but not shrink them.

  `--size-selector` joins `SCALAR_TOKENS` with the same `0.15–0.4rem` range and default as its field
  counterpart, which lights it up in all three consumers at once — the builder's Theme panel now has
  **Field base size** and **Selector base size** as a pair, and `get_tokens` advertises it. The two
  stay independent on purpose: a dense checkbox beside a large input is the reason these are separate
  tokens, and `e2e/theme-sizes.spec.ts` asserts the rendered box of each tier moves with its own lever
  and holds still for the other one.

### Patch Changes

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

## 0.46.0

### Patch Changes

- 11cccee: Deleting a page asks first.

  It didn't. The trash icon in the Pages panel called `removePage` straight off the
  click, and it sits one button away from Add — the same 24px square, the same ghost
  treatment, in the same run of three. A mis-click took the page and its entire node
  tree off the canvas with nothing on screen to stop it or explain what just
  happened. The op has always been invertible, but undo being available is not the
  same as an author knowing to reach for it: nothing in the editor says a deleted
  page is recoverable, so the honest read of that click is "gone".

  The button now awaits the shared `AlertDialog`, which names the page, labels its
  confirming action `Delete page` rather than a bare `Confirm`, and says undo covers
  it. `AlertDialog`'s backdrop is inert by design, so the decision can't be lost by
  clicking away; Escape still cancels, per the ARIA alert-dialog pattern.

  **`ImperativeAlertDialogProvider` gained `popupProps`**, which is what made this
  reusable rather than a one-off. The popup portals to `document.body` — outside any
  `[data-theme]` island the provider sits in — so a confirm raised from inside a
  themed region (an editor shell, a pane, a dark section) resolved its tokens
  against the host page instead of that region, and came back wearing the wrong
  palette. `popupProps` re-stamps the theme on the portalled surface, the same
  escape hatch `Select` already exposes for the identical reason. It also accepts
  `data-*` keys explicitly, because TypeScript waives excess-property checks for
  hyphenated names in JSX position only, never in an object literal.

  The builder mounts that provider once at the root inside its studio island, so
  this is now infrastructure: any panel can raise a themed confirm by calling
  `useImperativeAlertDialog()`, with no per-call-site dialog state and no bespoke
  markup.

  Covered by a new `e2e/pages.spec.ts`: cancel keeps the page, Escape keeps the
  page, confirm removes it and undo restores it to the switcher, the last remaining
  page stays undeletable, and the popup actually resolves the studio theme — the
  test asserts a non-transparent computed background, not just the attribute, since
  the attribute being present is exactly what a broken portal would also show.

## 0.45.0

### Minor Changes

- 4cd7665: The MCP server advertises the theme layer.

  It didn't. `get_tokens` returned a `light` map and a `dark` map and never said how either one is
  turned ON — `data-theme` appeared nowhere in the catalog, the tools, or the routing preamble. So an
  agent could learn the eight semantic roles, learn how to register a ninth, and still have no way to
  learn that a different palette is an attribute on a wrapper. Asked for a dark section, the only
  thing left to reach for is a hardcoded hex or a bespoke stylesheet: it looks right in a screenshot
  and can never respond to the theme it ends up inside. It also undersold the product — twenty
  considered themes, swappable per-section, were invisible.

  **Two new tools.** `list_themes` returns the mechanism plus every shipped preset with what it's
  actually for (the prose above each preset's own `name:`, so twenty names like `clay`/`dune`/`frost`
  are pickable). `get_theme({ name, mode? })` returns one preset's **resolved** token map — dark
  deltas already merged over the base tokens and every `-content` ink derived by measured contrast,
  i.e. what a browser computes rather than the authored bag — with the literal attribute to write.

  **`get_tokens` gained `theming`**, so the mechanism is reachable from the tool an agent already
  calls when it asks about color: the `data-theme` selectors, what the bare `[data-theme]` rule
  paints (and why a wrapper is therefore enough), that dark mode is a theme and not a `.dark` class,
  the `@plugin "@wizeworks/silicaui/theme"` options, the runtime `Theme` object a builder/CMS stores,
  and the `@wizeworks/silicaui-html/theme` pair that lets a color named at runtime behave like a
  declared one. The routing preamble gained one rule to the same effect, and `search_docs` now
  answers "dark mode", "data-theme", "theming" and a preset's character text ("terracotta" → `clay`).

  Everything is derived, never described: the selectors come from calling the plugin's own
  `buildBase()`, the `@plugin` options from the plugin's own `options` accesses, the `Theme` shape
  from a TS AST over its source, and each preset from the real `THEME_PRESETS` run through
  `resolveThemeTokens` — plus `contrastWarnings` actually executed per mode, so a preset this catalog
  vouches for is one it has measured.

  Also fixes a latent bug in the catalog generator: the scoping helper wasn't idempotent, so prose
  already written as `@wizeworks/silicaui-charts` got scoped a second time and nine component
  descriptions shipped naming `@wizeworks/@wizeworks/silicaui-charts` — a package that does not
  exist, in the one file whose whole job is to not invent names.

### Patch Changes

- b33c93d: Three host asks: other editors on the canvas, a clickable status item, and a render-path `customColorCss`.

  **Other editors (`<Builder peers>` / `editor.setPeers`).** Hand the builder whatever presence a
  collaborative host already relays and it draws it: a dashed, named ring on the canvas in that
  peer's color, plus a dot on the Navigator row. A peer may also carry a `claim` — node ids whose
  subtrees they are holding — and the engine then refuses every local mutation inside one, drops the
  canvas write affordances (drag, drop target, in-place edit), and names the holder in the Inspector.

  A claim is the SOFT half of a lock and deliberately not `setLocked`: it lives in this editor's
  memory, never touches the tree, records no op, and lands on no undo stack, so a host can expire it
  on a timeout. It is not correctness machinery — per-node last-write-wins and the op log already keep
  the document right — which is why `applyRemoteOps` ignores claims entirely, including the claim held
  by the peer whose ops are arriving. Pinned by `verify:peers` and `e2e/peers.spec.ts`.

  One list rather than the two separate `peerSelections`/`claims` props asked for: a claim with no
  name and no color is a dead end, since the editor has to say WHO is holding a subtree.

  **A status item may now disclose its own detail.** `statusBarSlot`'s non-interactive rule was one
  case too broad — clicking "3 broken" to see which three is reading the same fact at more depth, not
  a second action, and splitting the count from its trigger is what stops a status bar being one. New
  `StatusItem` (both shells): a plain `<span>` without an `onClick`, a ghost `btn-xs` with one — 24px
  inside the 28px strip, carrying `aria-expanded`/`aria-controls`. Anything that ACTS still belongs in
  `toolbarSlot`.

  **`@wizeworks/silicaui-html/theme` — a theme as CSS, off the render path.** `customColorCss(theme,
scope?)` emits every rule a build-time `@plugin "@wizeworks/silicaui" { colors: … }` registration
  would have, for colors coined at RUNTIME by a tenant in a theme editor — which no build-time list can
  carry. It was previously reachable only from the builder's canvas, so a page that previewed correctly
  shipped with `btn-sunset` styling nothing. `themeTokenCss` emits the custom properties those rules
  read (ship both, or they paint nothing). `scope` is opt-in: omit it when publishing, pass one for a
  preview. New subpath because it is the only part of the package that needs `@wizeworks/silicaui`, now
  an optional peer — the root import stays dependency-free.

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

- c1ed199: Five navbar layouts, and a block `name` is now the palette label

  The Insert palette used to show two rows both reading the literal word **"Navbar"** — a real block
  with a working mobile menu, and an inert `navbar-start`/`navbar-end` shell with no links and no
  collapse. Picking between them was a coin flip.

  **Five distinct layouts**, each responsive in three container-query tiers (narrow → hamburger,
  `@sm:` → sign-in, `@md:` → full bar), each with a working `disclosure` mobile menu, and each
  showcasing part of the system:

  |                            |                                                                                                                     |
  | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
  | **Navbar — Brand Left**    | the everyday header; links cluster beside the brand (it was a `justify-between` row, which optically centered them) |
  | **Navbar — Center Links**  | equal `flex-1` flanks so the nav is genuinely centered; ghost **Sign in** + primary **Sign up**                     |
  | **Navbar — Center Logo**   | links split either side of a centered wordmark; collapses to a normal mobile header purely from DOM order           |
  | **Navbar — Mega Menu**     | a full-width shelf of grouped links, plus search with a `⌘K` hint                                                   |
  | **Navbar — Floating Pill** | a `sticky`, `glass` capsule with an account avatar — the signed-in flavour                                          |

  All five brand with the real `Wordmark` component (so a logo can be assigned through the Inspector's
  one-control path) and carry a `theme-toggle` button. The primary action and sign-in now also render
  inside the mobile menu, sharing one slot with their desktop twins — a header whose CTA disappears on
  a phone was the previous behaviour, and it was a bug.

  The mega menu's shelf is a second `disclosure` trigger/panel pair, **not** the `menu` behavior:
  `menu` needs an absolutely-positioned panel, which a builder canvas force-reveals and which would
  then blanket the top of the page. It is also the ARIA-correct pattern for a shelf of links
  (WAI-ARIA APG's Disclosure Navigation Menu) rather than `role="menu"`, which is for commands.

  ### Breaking-ish for consumers

  - **Every block's `name` changed.** A block's `name` is now the palette label verbatim — short,
    unique, `Family — Variant` — and the explanatory sentence lives in `description`, which hosts show
    as the row's hint. Previously the label was derived by truncating `name` at `" — "`, which is why
    a whole family collapsed to one row text. A host that renders `Template.name` will see new
    strings; `key` is unchanged for every existing block, so lookups, saved documents, and starters
    are unaffected. `verify.mjs` now fails on a duplicate or overlong name.
  - **The bare `Navbar` primitive left the Insert catalog.** The `Navbar` component itself is
    untouched in `@wizeworks/silicaui`, `-html`, and `-react`; only the palette entry is gone. A host
    that hid it by key can drop that entry.

  ### Also fixed

  `wordmark` and `glass` were missing from `COMPONENT_STEMS`, so a prefixed projection
  (`toHtml(node, { prefix })`) emitted bare `wordmark`/`glass` classes that matched no CSS. The
  palette has authored `atom("Wordmark", "wordmark")` since it shipped, so this was already live for
  anyone running a class prefix.

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

## 0.43.0

### Patch Changes

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

### Patch Changes

- 108ae7d: **Form: stop validation from stealing the caret mid-typing, and add `focusOnError`.**

  Base UI's `Form` moves focus to the first invalid control and calls `select()`
  on it, from two places: synchronously on an invalid submit, and from an effect
  whenever `errors` changes after a submit that passed. The second fires on the
  network's schedule — it lands while the user is typing in a different field,
  yanks the caret out, and (thanks to `select()`) makes the next keystroke replace
  what they had typed instead of appending to it. Upstream offers no opt-out.

  Silica now narrows that move. By default it still focuses the first invalid
  control on submit, but:

  - it never selects the control's existing value — the caret goes to the end, so
    the next keystroke appends;
  - a late `errors` update never takes focus from a text control the user is
    currently typing in; it scrolls the invalid field into view instead.

  The new `focusOnError` prop softens it further — `"scroll"` reveals the field
  without focusing, `false` leaves focus alone entirely:

  ```tsx
  <Form focusOnError="scroll" errors={serverErrors}>…</Form>
  <Form focusOnError={false} errors={serverErrors}>…</Form>
  ```

  Covered by `verify-form-focus.mjs` (policy) and a new playground Playwright
  suite (event-loop timing, which jsdom cannot reproduce).

## 0.41.0

## 0.40.0

## 0.39.0

## 0.38.0

### Minor Changes

- e81303c: Per-item links inside an email `collection` repeat — a `link` group node — and MCP
  coverage for the email schema.

  **`{ kind: "link"; href; children: ContentNode[] }`.** Every email node carries at most
  one `data` marker, so inside a repeat an `image` could bind its `src` **or** its `href`,
  never both, and a `text` node has no `href` at all — a link inside copy is inline `<a>`
  markup, a literal string identical on every item. A rail of product cards was therefore
  either unclickable images or one CTA sending everyone to the same page. One marker per
  node stays the rule; the fix is composition, the same move the site engine makes with its
  link box: the group holds the destination, so its `href` binds per item while each child
  keeps its own marker for its own field.

  `href` is the kind's only field and its default bind target, so a whole rail is three
  markers: `collection` on the section, `value → item.url` on the group, and each child's
  own. It holds content only — a nested `link` would mean nested anchors, and a nested
  `columns` row would put table markup inside a group whose job is to lower into inline
  anchors. Both are type errors, and `canHold` mirrors them.

  **It does not project as one `<a>`.** An anchor around block-level content is invalid in
  the HTML dialect Outlook's Word engine parses, and Outlook drops it: the card renders,
  looks clickable, and does nothing, with no symptom in the markup or a webmail preview. So
  the group emits no element at all and distributes the destination onto each child's own
  inline anchor — an image becomes `<a><img></a>`, a text block's copy is wrapped with
  `color:inherit;text-decoration:none` (a card title that happens to be clickable is not a
  link inside a sentence). Both forms are bulletproof everywhere. The trade is stated rather
  than hidden: the card's content is clickable, the padding around it is not. Explicit beats
  inherited in both directions — a child with its own `href` keeps it, and copy that already
  contains an `<a>` is never re-wrapped. An empty `href` distributes nothing, never
  `<a href="">`.

  Insert → **Linked card** drops a group already holding image + title + price; **Link
  group** is the empty one. On canvas a group draws a persistent boundary and link glyph,
  because it is invisible in the output and "children inside it" versus "siblings after it"
  otherwise looks identical — the one mistake that produces a silently unlinked card.
  `canHold` and `EMAIL_BINDABLE_FIELDS` are now exported: both are contracts a host
  building its own drag layer or binding UI would otherwise have to re-derive, differently.

  **MCP: `list_email_nodes` / `get_email_node`.** The catalog covered the three delivery
  paths and said nothing about the email builder's document schema — the one surface with no
  other source of truth, where an invented kind or an illegal nesting is dropped silently
  with no error to read. Both tools are generated, never described: fields and doc comments
  from the TypeScript AST, the nesting matrix by calling the real `canHold` on every
  (parent, child) pair, the bind allowlist from `EMAIL_BINDABLE_FIELDS`, the presets from
  `EMAIL_PALETTE` with each `make()` actually invoked. `search_docs` reaches node kinds and
  the document envelope, and the routing preamble now says email is a separate surface
  rather than a fourth path.

- 7e57761: `get_node_schema` — the MCP now describes path 3's document schema, not just what goes in it.

  The catalog could answer "what components and blocks exist" and nothing at all about the
  shape of the tree they go into. So the **data-binding vocabulary** — how a generated
  document draws live content, repeats over a collection, or hides itself when there is
  nothing to show — lived in the source and in two hand-written docs and **nowhere an agent
  could look it up**. The gap was found the honest way: a per-instance `limit` was added to
  a collection binding, and the question "is the MCP updated?" had no mechanism behind it.

  The new tool returns, all extracted from `@wizeworks/silicaui-html`'s own source:

  - the four node kinds and their fields, and **which of them carry the shared metadata
    band** (an outlet does not, which is the kind of thing that is only ever learned by
    something not working);
  - the typed system-metadata band itself — `data` / `slot` / `behavior` / `part` /
    `locked` / `instanceOf`;
  - the full `DataBinding` union with every field and its real doc comment;
  - the resolution contract a host implements, including the unknown-vs-empty rule the
    whole thing hangs on (`undefined` means "never heard of this ref" and keeps the
    authored content; `{ value: undefined }` means "known and empty" and renders empty);
  - the raw-element/attribute allowlist `toHtml` enforces, per tag, read from the exported
    `RAW_ELEMENTS` map at generation time.

  Path 3 fails **silently** where the other two fail loudly — an unlisted tag becomes a
  `<div>`, an unlisted attribute is dropped, an invented binding field is not persisted,
  and the output still looks plausible. The routing instructions now say so and point at
  this tool first, and `search_docs` reaches bindings, node kinds and allowed attributes,
  so "limit", "repeat" and "srcset" stop returning nothing.

  Kept honest by construction: `verify.mjs` re-parses the real `DataBinding` union out of
  `silicaui-html/src/schema.ts` and compares it field by field against what the server
  publishes, both directions. Adding a binding option and forgetting the catalog now fails
  the build instead of shipping a server that describes last release's schema. That check
  earned its keep immediately — it caught the generator publishing `ResolveHost` as an
  empty member list, because the parser only walked property signatures and every hook on
  that interface is a method signature.

## 0.37.0

### Minor Changes

- 87800d0: Teach the MCP server that Silica has THREE delivery paths, and tell connecting
  agents so before they write any code.

  **A routing preamble at `initialize`.** The server now supplies MCP `instructions` —
  the block clients surface ahead of the first tool call. Previously an agent received
  ten tools in a bag and had to infer the architecture from their names; the path choice
  (CSS vs React vs node-tree) is made _before_ any tool runs, by which point per-tool
  descriptions are too late to help. The preamble names each path, what you write on it,
  whether it's interactive, which tool answers for it, and the wrong-path smells:
  importing `@wizeworks/silicaui-react` into non-React output, hand-writing `data-sui-*`
  markers, or shipping node-tree markup without `@wizeworks/silicaui-behaviors` and
  wondering why nothing opens.

  **The CSS path is a real component path now.** `@wizeworks/silicaui` had zero entries in
  the catalog — it was reachable only through `list_classes`, which returns a flat bag of
  class names: real, but silent about which class is the root, which are its parts, and
  which are variants. So an agent writing plain HTML had to guess the markup, and
  `get_component` could answer for two of three paths. All 109 class families are now
  catalog entries carrying the module's own JSDoc, the derived `root` class, `classes`,
  `colorVariants` (matched against the real semantic-color list), and the compound
  selectors that reveal required structure (`.checkbox.card-selectable-indicator`).
  Families with no bare root class — `dialog` is only ever `.dialog-popup` /
  `.dialog-backdrop` / … — say so via `familyPrefix` and `rootNote`, since `root: null`
  alone invites inventing `class="dialog"`.

  **`get_component` answers every path at once.** A name spanning packages used to return
  `isError` asking the caller to pick one — a round trip that demands a choice it can't
  yet make, since how the shapes differ is exactly what it was asking. It now returns all
  of them, CSS → React → HTML, with a note that they aren't interchangeable. Pass
  `package` to narrow.

  Two extraction bugs fixed on the way in: `button`'s description came from the
  `buttonColorVars` helper that happens to sit above it in the file (first-JSDoc-wins),
  and root derivation crowned `bg-info` the root of the 66 unrelated `color-utilities`
  because it prefixes `bg-info-content`.

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

### Minor Changes

- da5efa7: `Heading` / `Display` / `Text` take `size` (with `visualLevel` deprecated)

  Sizing a heading now uses the prop everyone reaches for first — `size` — instead of `visualLevel`:

  ```tsx
  <Heading level={2} size={4}>…</Heading>        // an <h2> that looks like an h4
  <Heading level={1} size="display-1">…</Heading> // hero
  <Display size={1}>…</Display>
  <Text size="lg">…</Text>                         // new: explicit body size
  ```

  `size` on these typographic components is the **type/display scale** (an h-level `1`–`6`, a `display-1..3` step, or a `text-*` step on `Text`) — a deliberate, probe-sanctioned counterpart to the `xs`–`xl` control scale that `size` names on `Button`/`Input`/etc. The rule `verify-prop-vocabulary` enforces is unchanged in spirit — `size` always means "a step on a silicaui scale," never a raw length or arbitrary string — it just recognizes the typographic scale on typographic components. Heading/Display values keep the ramp's designed per-step weight and tracking, which a bare `text-*` size would drop.

  `visualLevel` is **deprecated but still works** (`size` wins if both are set), so no one has to migrate on the spot; it will be removed in a future major. The common case is unchanged: a bare `<Heading level={2}>` still sizes itself — `size` is only for overriding.

## 0.31.0

### Minor Changes

- bb098bc: Type scale to `text-10xl`, a fluid display ramp, and a consumable canvas vocabulary

  - **Type scale reaches `text-10xl`** and is now declared in one place (`@wizeworks/silicaui/type-scale`), consumed by the plugin and the MCP catalog generator so the documented ladder can't drift. `text-8xl`/`9xl` are now owned explicitly (previously present only via Tailwind's defaults).
  - **`display-1` / `display-2` / `display-3`** — an oversized hero ramp above the headings — and they are **fluid** (`clamp()` + container units), so they scale with their container instead of overflowing narrow screens. React: `<Display visualLevel={1|2|3}>` and `<Heading visualLevel="display-1">`. Bare `.display` equals `.display-3`.
  - **`@wizeworks/silicaui-builder/vocab`** exposes the canvas's utility-class vocabulary as consumable data — `CANVAS_UTILITY_CLASSES` (flat safelist), `CANVAS_VOCAB_GROUPS`, and `CONTAINER_BREAKPOINTS` — so a consumer's Tailwind safelist can be generated from silicaui's source of truth instead of hand-copied. The Inspector imports the same source, so the two can't drift.
  - The Inspector now **surfaces classes with no backing CSS** on the raw class field (and via a deduped console warning) instead of rendering them silently as no-ops.
  - The **MCP catalog now documents the type scale**: `tokens.json` gains `typography.scale` (every step with px), and `classes.json` gains a `type-scale` group (`text-xs` … `text-10xl`).

## 0.30.0

### Patch Changes

- a03f3b0: Report the live version, and restore the usage examples

  `list_packages` advertised whatever version was current the last time someone
  ran `pnpm gen` by hand — it had frozen at 0.26.0 while npm served 0.29.0 — and
  the MCP server introduced itself as `0.1.0`, a literal unchanged since the
  package was created. Neither number is baked into the catalog now: both are read
  from the package's own `package.json` at startup. Every package in the family is
  released in lockstep (they share one `fixed` group in the changesets config), so
  that value is correct for all of them, and the drift is no longer possible
  rather than merely fixed.

  `get_component` also returned no `usageExample` for any of the 344 components.
  The generator reads demos from disk, and they had moved to the new
  `silicaui-demos` package; the per-component read tolerates a missing demo (most
  components legitimately have none), so a stale directory degraded silently into
  "nobody has an example" instead of failing. The path is corrected — 106
  components carry an example again — and the directory is now asserted once up
  front, where a future move fails loudly instead of quietly emptying the catalog.

  Finally, `verify.mjs` asserted a hardcoded count of 30 behaviors, which broke
  when a 31st was registered. It now compares against the `BehaviorType` union
  itself and names any type that is genuinely missing.

- a90b819: Coverage and catalog honesty — what the library says about itself.

  **The MCP catalog described a component that does not exist.** `Typography`
  had a row in silicaui-react's README component table but is not exported from
  anywhere. The generator resolved the name through its kebab-case fallback to a
  real file (`typography.tsx`), parsed it, and published a fully-formed entry —
  with `HeadingProps` attached. An assistant querying the catalog was told to
  write `<Typography level={2}>`, complete with prop documentation, for a
  component that cannot be imported. The row is gone, and the generator now
  treats a README name with no matching export as an **error**: it drops the
  entry from the emitted data and exits non-zero, because a phantom entry is
  worse than a missing one — a consumer acts on it.

  **Six real components were missing from the catalog.** The generator's
  existing check ran one direction only and at file granularity: a file with at
  least one documented export was exempted wholesale, on the assumption that its
  other exports were Base-UI-style sub-parts. That assumption holds for ~150
  genuine sub-parts, but it also silently swallowed `DateRangePicker` (in
  `date-picker.tsx` beside documented `DatePicker`), `ClickableCard`,
  `SelectableCard`, `FloatingLabel`, `CheckboxOption`, and `RadioOption`. The
  check is now per-export, and a sub-part is identified by being name-prefixed
  by a documented sibling in either direction (`DialogTrigger` ⊃ `Dialog`;
  `Steps` ⊃ `Step`) rather than by sharing a file.

  **Five components became authorable outside React.** `Link`, `FileInput`,
  `FloatingLabel`, `SelectableCard`, and `MockupCodeLine` existed only in
  silicaui-react, so a static or Sparx-rendered page could not author them at
  all — `Link` most glaringly, since a projection with no link component made
  every link a hand-written raw element node.

  **`<input accept>` was silently dropped from all static output.** The raw
  element sanitizer's allowlist for `input` included `multiple` but not
  `accept`, so every static file input lost its file-type filter. Nothing
  errored; the picker just opened unfiltered. This predates the `FileInput`
  macro and affected hand-authored element nodes too — adding the macro is only
  what surfaced it. `accept` is an inert hint string with no URL or script
  surface.

  **React↔HTML parity is now enforced rather than assumed.** A component that
  exists only in silicaui-react is invisible to every non-React consumer. That's
  legitimate for some, but it has to be a decision. The generator now warns on
  any React component with no `-html` macro unless it appears in an explicit
  `HTML_EXEMPT` map with a stated reason — imperative APIs (`ToastProvider`),
  pure class-applicators (`Validator`), names already covered under a different
  one (`NativeSelect` → `-html`'s `Select`), and interactive components still
  owed a behavior handler. It also warns when an exemption goes stale, so the
  list can't rot into fiction once a macro lands.

  The five new macros and the `accept` fix are locked in the byte-identical HTML
  golden fixture.

## 0.29.0

## 0.28.0

## 0.27.0

## 0.26.0

## 0.25.1

## 0.25.0

## 0.24.0

### Patch Changes

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

## 0.19.0

### Patch Changes

- d0d7cc6: `SCALAR_TOKENS` (the theme's non-color knobs — radius/border/size/depth/noise/focus-width/disabled-opacity) now carries a `doc` string per entry describing what it actually affects, surfaced through the MCP's `get_tokens` and documented in `docs/silicaui-architecture.md` §5.1. Also fixes a stale ThemeEditor tooltip ("3D depth on fields & selectors") that no longer matched what `--depth` controls (Card/Button shadow), and regenerates the MCP catalog to pick up previously-uncataloged package versions and the Combobox `popupProps` prop.

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

### Patch Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

## 0.10.1

### Patch Changes

- 7e6966e: Fix `@wizeworks/silicaui-builder` being non-consumable: it imports `@wizeworks/silicaui-react` at runtime (Toolbar, Button, Select, TreeView, etc. from `/react` and `/email/react`) but never declared it as a dependency, so a fresh install left that import unresolved. It's now a peer dependency, matching the other component-wrapping packages.

  The MCP package catalog also still listed `silicaui-builder` as `private: true` / `install: null` from before it became a publicly installable package — corrected to a real install command and current version.

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

## 0.5.0

## 0.4.0

### Minor Changes

- 18da685: Fix `@wizeworks/silicaui-mcp`'s catalog generator so it can't silently drift out of sync again:

  - `behaviors.json` is now derived from `silicaui-behaviors`' real `HANDLERS` dispatch table instead of a hand-maintained file list — all 30 registered `BehaviorType`s are covered (previously only 11, missing `form` and every behavior added since).
  - `components.json` now also covers `silicaui-html`'s `ComponentDef` macro registry (208 framework-neutral components — Dialog, Popover, Combobox, etc.), not just `silicaui-react`. Each macro's real `BehaviorType`(s) are discovered by actually calling its `expand()`, not guessed. `get_component` now takes an optional `package` argument to disambiguate names that exist in both packages.
  - The generator now warns at `gen` time if a `silicaui-react` component's export has no matching row in the README's component table, instead of silently omitting it from the catalog forever.
  - `silicaui-react/README.md`'s component table gets 28 real components it was missing (`Timestamp`, `InputGroup`, `PasswordInput`, `MultiSelect`, `AppShell`, `PowerSearch`, the `DateInput`/`TimeInput` family, and others).
