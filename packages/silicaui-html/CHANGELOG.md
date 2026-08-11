# @wizeworks/silicaui-html

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

### Minor Changes

- 0b59128: The catalog can finally describe a node-tree component

  `Embed` gained nine providers and the MCP catalog still described it as a name and an icon. That
  is not a stale-regeneration problem — there was nowhere for the answer to go.

  Every one of the 236 `silicaui-html` components carried **no props, no description, no usage** —
  only `name`, `label`, `icon`, `container` and a source path. All 132 React components carry full
  props. So `get_component("Embed", "@wizeworks/silicaui-html")` had never told anyone which URLs
  work, and a consumer asking the catalog what the node-tree layer can do got a list of names. A
  capability that cannot be discovered looks exactly like a capability that is missing, which is
  why it was reported as missing.

  The generator skipped them for a real reason — these components have no prop interface to parse,
  because props are read ad hoc inside `expand()`. But the prose was there all along, written above
  each def. It is now extracted as `doc`, so descriptions come from the comment that already
  explains the component rather than from a second field that would drift from it. 149 of 236 are
  now documented, up from none.

  The rest are one-line `elementDef(...)` factories, which had no prose because prose would add
  nothing — so those state the one fact they carry, derived from the call: what tag they lower to.
  That same factory shape was also invisible to the source-line lookup, which only ever searched
  for `name: "X",`; 61 components pointed at the file with no line. All 236 now resolve to a line.

  The 87 still undescribed are composite PARTS — `DialogTrigger`, `TabsPanel`, `LightboxSlide` —
  whose parent component is documented and whose meaning is not separable from it.

  ### Embed publishes its provider list

  Which URLs `Embed` frames is decided by an external allowlist, so unlike every other component it
  cannot be inferred from its shape. `EMBED_PROVIDERS` is now exported from `@wizeworks/silicaui-html`
  and carried into the catalog — name, kind (`video` / `audio` / `podcast` / `map`), a working
  example, and `embedUrlOnly` for the providers whose player id is absent from a shareable link.
  A host can render it as help text; an agent can read it before writing a URL into a document.

  `verify-embed.mjs` checks it in both directions: every published example still resolves, and every
  host the resolver can emit is named by an entry — so adding a provider without documenting it, or
  documenting one that stopped working, fails the probe.

  ### Regenerating is no longer destructive

  `gen-catalog.mjs` embedded whatever line endings the working copy had, so regenerating on a Windows
  checkout rewrote every extracted usage example to CRLF and produced a 178-line diff of pure
  line-ending churn — enough noise to bury the real change, and enough friction that the honest move
  was to revert the regeneration instead of reading it. Output is normalized at the single point it
  is written, so the catalog is now byte-identical across platforms.

## 0.49.0

### Minor Changes

- aeb02f8: An email token silica can't parse now belongs to the host, instead of surviving as literal braces

  Silica's inline merge-token pass matched exactly one thing: a bare dotted path, `[a-zA-Z0-9_.]+`. A
  token carrying anything else — an ESP's documented fallback syntax, say
  `{{customer.firstName ?? "there"}}` — didn't match, so the scanner never saw it. It rode through
  projection untouched and rendered as raw `{{` `}}` in the canvas's Preview.

  The send was fine, because a host that runs its own interpolation pass over the projected HTML
  understands its own syntax. That is exactly what made this bad: the author edited an email that
  looked broken, previewed an email that looked broken, and shipped an email that was correct. Preview
  is supposed to be the answer to "what will they actually get" — and there was no seam to fix it
  from outside, because text tokens never reached the host at all. Silica matched and substituted them
  itself, or silently did nothing.

  ### The grammar was the wrong thing to widen

  The obvious repair is to teach the regex about `??`. That answer is wrong twice over: it is `??`
  today, a `|` filter next, a conditional after that, and each one makes silica the owner of an
  expression language it has no business parsing — while still being wrong for the host whose syntax
  differs from whatever got hardcoded.

  So the token pass is now split into a **scanner** and a **grammar**. `TOKEN_RE` finds every `{{…}}`
  an author typed, deliberately lenient about the contents. `TOKEN_PATH_RE` — byte-identical to the
  pattern this file always matched — decides who owns it. A bare path still resolves through
  `resolveBinding`, exactly as before. Anything else is an EXPRESSION and goes to a new optional hook:

  ```ts
  interface EmailResolveHost {
    resolveExpression?(expr: string, scope: DataScope): Resolved | undefined;
  }
  ```

  The host receives the expression with its braces stripped and its outer whitespace trimmed, and
  nothing else done to it — no tokenizing, no unquoting, no evaluation. A host that already evaluates
  this syntax on the way out reuses that same evaluator here and gets an identical answer on the
  canvas, which is the entire point: preview == production, structurally, without silica knowing what
  `??` means.

  It carries the same three-state contract as `resolveBinding`. `undefined` means "I don't speak this"
  — the literal `{{…}}` stays exactly as authored and a diagnostic fires, the same keep-what-was-authored
  rule as everywhere else. A known-but-empty resolution elides. Escaping is shared, so an expression's
  value is escaped inside `TextNode.html` and is not double-escaped in a button label, subject, or
  preheader.

  `ResolveDiagnostic` gains **`unknown-expression`**, distinct from `unknown-ref` on purpose: a
  misspelled field and a syntax nobody wired need different fixes, and an editor badging
  `{{a ?? "b"}}` as an unknown reference would be lying about which one it is.

  Additive in both directions. A host with no `resolveExpression` gets precisely the passthrough it
  gets today, plus a diagnostic it is free to ignore. A host implementing only `resolveExpression`
  works too. Edit mode still shows authored source for every token, path and expression alike — the
  canvas edits the document, it does not resolve it, and that has not changed.

  ### `src=""` no longer survives the sanitizer

  `isSafeUrl("")` returned true, so an empty URL attribute passed through. Not a security question — a
  correctness one: the empty string resolves to the _current document_, so `<img src="">` makes the
  client re-fetch the whole page and then draw a broken-image icon for it. It is never a value anyone
  meant.

  It was also already contradicted by the code around it. `canvasAttrs` substitutes a placeholder when
  an Image has no `src`, so an unset image stays visible and selectable while authoring, and its
  comment already claimed production markup omitted the attribute — which the empty-string carve-out
  quietly made untrue. Now it does. An unset image gets the placeholder on canvas instead of a broken
  icon, and the attribute is absent from output.

  ### Verified

  `probe-email` gains fifteen checks covering the seam end to end: a `??` fallback resolving, the exact
  string the host is handed, paths never reaching `resolveExpression`, escaping in both directions,
  per-item scope inside a repeat, an unhandled expression keeping its literal source, both
  backward-compatibility directions, and the resolved output of `toEmailHtml` — the surface where this
  was actually reported.

- 7f4449e: Embed frames what it can play, links what it can't, and covers audio and podcasts

  Seven gaps, all reported against rendered output. They look like seven bugs; they are three,
  and the third is the one that made the rest inevitable.

  ### The frameable/not-frameable distinction was never actually drawn

  `resolveEmbed` matched a provider by substring and then checked the result against a HOST
  allowlist. `https://www.google.com/…` is on that allowlist, so an ordinary map page —
  `/maps/place/…`, the URL anyone actually copies — passed the final "already a bare embed URL"
  branch and got an `<iframe>`. Google serves those pages `X-Frame-Options: SAMEORIGIN`, so every
  visitor's browser refused it and the page reserved a blank rectangle where a link used to be.
  Framing a URL is a claim that it will render, and nothing was checking that claim.

  The allowlist is now path-precise, and the same rule decides every provider: Bandcamp,
  Simplecast and Megaphone address their players by an internal id that a shareable URL does not
  carry, and `expand()` is pure and synchronous, so there is nothing to look it up with. Those
  resolve only from the URL their own embed dialog produces. A share URL becomes a link that
  works instead of a player that 404s.

  ### The parts of a URL that decide what plays were being dropped

  The unlisted Vimeo hash is the sharp one: `vimeo.com/<id>/<hash>` resolved to
  `player.vimeo.com/video/<id>`, which plays for the signed-in owner and 401s for everyone else.
  That is invisible to the person who published it. SoundCloud's `/s-…` secret segment is the same
  hazard, and Apple's `?i=` is a quieter version — drop it and the embed does not get smaller, it
  plays the whole album instead of the track. `?t=` start times and `?list=` playlists were dropped
  too.

  Everything that addresses the media now survives the trip, and parsing goes through `URL` rather
  than a substring match — so `youtube.com` has to BE the host, not merely appear in the string.

  ### Provider coverage was a list, and lists rot

  `youtube.com/shorts/…` is what a phone's share sheet produces and it was not framed; neither was
  `/live/`, `/v/`, `vimeo.com/channels/…` or `/groups/…`. So YouTube accepts every path form that
  names a video, and Vimeo strips container prefixes and requires what remains to start with the
  id — which also means a container naming NO video (`/channels/staffpicks`) correctly resolves to
  nothing, because it is not a video.

  Audio and podcasts join on the same terms: Spotify (including `show`/`episode`), SoundCloud,
  Apple Music, Apple Podcasts, Bandcamp, Simplecast, Megaphone, Transistor, Buzzsprout.

  Those players are fixed-height chrome rather than a picture, so `resolveEmbed` now returns the
  provider's own height and the 16:9 box applies only to video — a 152px Spotify row in an
  `aspect-video` frame is a strip of player stranded in a tall empty rectangle. The palette no
  longer seeds `ratio: "wide"` on a new Embed, because an authored ratio overrides the provider
  and that seed would have locked every audio embed into 16:9. The Inspector's ratio control leads
  with `auto` to say so.

  ### And the one that was publishing builder copy to visitors

  An Embed with no URL rendered `Add a YouTube, Vimeo, or Google Maps URL` — through `toHtml`, on
  live pages, to the public. `verify.mjs` asserted that it did. Authoring affordances belong to the
  authoring surface, which is how Image and Icon already work, so `toHtml` now renders nothing and
  the canvas draws its own hint.

  ### Probe

  `verify-embed.mjs` asserts the mapping directly — URL in, player URL out — rather than eyeballing
  markup, because every failure here is the quiet kind: the author pastes a link, sees a player in
  the builder, publishes, and the defect exists only for other people. It covers the three shapes
  at once — not framed but should be, framed but must not be, framed but wrong — across 119 checks,
  including look-alike hosts that a substring match would have accepted.

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

## 0.45.0

### Minor Changes

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

- b33c93d: Remove named layouts and per-page frames — one shell per site again.

  The feature was built without being asked for, and it expanded the schema in both
  directions to pay for itself. This takes all of it back out.

  **Gone from the shared schema (`@wizeworks/silicaui-html`):**

  - `Site.frames` — the map of additional named shells
  - `Page.frameId` — the tri-state (absent = default, `null` = bare, string = named)
  - `Frame.name` — the label a named layout carried separately from its key
  - the `frameFor` and `frameDiagnostic` exports

  `Site.frame` stays and is the whole story: one shell, wrapping every page. A site
  with no `frame` renders its pages bare. `renderPage` and `pageDocument` both read
  that single field, so the canvas and the publish path still cannot disagree.

  **Gone from the builder's op vocabulary:**

  - `page.setFrame`, `frame.create`, `frame.rename`, `frame.delete`
  - the optional `id` on a `{ scope: "frame" }` op target, which existed only to
    disambiguate which named layout an edit addressed

  **Gone from `Editor`:** `setPageFrame`, `createLayout`, `renameLayout`,
  `deleteLayout`, `editLayout`, `layouts`, `frameChoices`, `editingLayoutId`, and
  `PageMeta.frameId`. `setFrameEditable` and `frameRoot()` remain, now reading
  `Site.frame` directly.

  **Chrome:** Layout mode still edits the site shell. The left rail names it
  instead of offering a switcher, and the Pages panel no longer carries a per-page
  layout picker.

  **Compatibility.** A stored site carrying `frames` or `frameId` still loads — the
  fields are simply ignored, and every page renders in `Site.frame`. A page that
  was set to `frameId: null` (bare) or to a named layout will now render in the
  site shell instead; nothing crashes, but that is a visible change for any such
  page. A host that called the removed `Editor` methods or matched on the removed
  op kinds must drop those call sites.

## 0.44.0

### Minor Changes

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

## 0.41.0

## 0.40.0

## 0.39.0

### Minor Changes

- c12bc35: Bound the binding picker's walk over a host's `DataSource` catalog, so no host data
  can hang or crash the editor.

  `flattenSources` and `findSource` both recursed over the host-supplied catalog with no
  cycle guard and no ceiling, and both hazards were reachable from ordinary host data:

  - **A cycle** — `post.author → author.posts → post`, the everyday shape of a CMS schema
    with a back-reference — overflowed the stack in ~3ms. Thrown mid-render, so it
    surfaced as the whole editor tripping its error boundary rather than as anything
    identifiably about data binding.
  - **Sharing without a cycle** is the subtler one, and needs no cycle at all: a handful
    of content types embedding the same few sub-shapes is finite and small to author but
    exponential in paths through it. Measured, 51 distinct authored sources produced 1.86M
    options in 779ms; 55 produced 16.7M in 7.7s — each one destined to become a real
    `<option>` element.

  `findSource` now memoizes globally per search (whether a shape contains a ref doesn't
  depend on the route taken to reach it), making it linear in distinct sources instead of
  exponential in paths. `flattenSources` guards against the current path only — a shape
  reachable two ways is genuinely two options, so a global seen-set would wrongly drop the
  second — and short-circuits on `MAX_SOURCE_DEPTH` (6) and `MAX_SOURCE_OPTIONS` (500).
  Both are bounds on work done, not slices of work already done.

  Truncation is **reported, never swallowed**: `flattenSources` now returns
  `{ options, truncated }`, and where the list is incomplete the Inspector says so and
  restores the raw reference field the picker replaced. A field missing from a picker must
  never be indistinguishable from a field the host never offered.

  The email builder's `flattenEmailSources` and its private `findSource` were hand-copied
  from the site versions and carried the same defect on a hotter path — the merge-token
  autocomplete flattens while the author types. They are now a re-export of the shared
  bounded walker rather than a second implementation free to drift again.

  `flattenSources`, `findSource`, `truncationMessage` and both ceilings are exported from
  `@wizeworks/silicaui-html`; `verify-data-sources.mjs` pins the guards with wall-clock
  budgets, since a fix that returns the right list in 8 seconds is still the bug.

- e252ef2: Twenty real themes instead of four hue swaps, and a `themes()` seam so a platform can
  offer its own.

  **The preset catalog is now twenty complete looks.** The four shipped presets varied the
  brand and status HUES over one shared neutral ramp, so picking a theme changed the color
  of a button and nothing else — twenty variations of a single design. Each preset now
  carries a palette, a type pairing, and a shape language (`--radius-selector`/`-field`/
  `-box`, `--border`, `--depth`), because whether an interface reads as sharp and technical
  or soft and friendly is decided by radius and line weight at least as much as by hue. A
  preset states only the scalars it actually changes; the rest inherit @wizeworks/silicaui's
  defaults. `quartz` deliberately inherits the default UI stack and is otherwise unchanged,
  so a site already on it sees nothing move.

  Presets are assembled through a `defineTheme` whose signature is the fix: `dark` is a full
  palette, not a partial override bag. Three of the four shipped presets quietly stopped
  short of restating theirs — `ocean` never restated a brand role at all, `grape` and
  `sunset` restated only `primary` — and every unstated role fell THROUGH to its light
  value, so `ocean` in dark mode painted a 38%-lightness neutral fill onto a 21% surface.
  Requiring the whole palette makes that a type error rather than something you notice in a
  screenshot.

  `verify-theme-presets.mjs` (now in `pnpm verify`) pins what no role check reaches:
  completeness in both modes, body text on the full surface ramp against WCAG AA
  (`base-content` is not a role, so `contrastWarnings` never measured it — a theme could
  pass every role check with unreadable prose), that the ramp steps in one direction rather
  than doubling back, that shape and type live only in the light bag, and that every font
  row matches the builder's real Google catalog. That last one matters because `FACE` in
  `themes.ts` hardcodes the stack and weights the theme editor's Google option produces —
  the catalog lives DOWNSTREAM in the builder and the schema package must not import it, so
  the duplication is deliberate and this is what keeps it honest.

  **`BuilderHost.themes()` — the third shelf.** The Themes panel had two tiers and a
  platform could reach neither: "This site" is `site.savedThemes`, real document data one
  click from deletion and scoped to a single site, and the presets shelf was a hard import
  of `THEME_PRESETS`. A host embedding the builder across many tenants, with a brand catalog
  it maintains centrally, had nowhere to put it — seeding `savedThemes` is the wrong shelf
  twice over, handing the author a delete button on the platform's brand and copying the
  catalog into every site.

  `themes()` takes the same merge shape as `catalog()`: `extend` adds labeled shelves,
  rendered above the shipped presets and apply-only; `hide` prunes SHIPPED entries by preset
  name, by the shipped shelf key (`SHIPPED_THEMES_KEY`), or `HIDE_ALL_SHIPPED` (`"*"`) for
  the white-label case. `hide` never touches the host's own `extend` — a host passing `"*"`
  means "only mine", and having that erase its own catalog would be an absurd reading. A
  host theme whose name matches a shipped preset shadows it (host wins, logged once): the
  name IS the `[data-theme]` value, so two token bags cannot share one, and dropping a row
  silently is the class of degradation that reads as a mystery later.

  Applying COPIES the theme into the document, so a site that adopts a host preset holds a
  snapshot and later upstream edits do not reach it. That is deliberate — the author can
  edit an applied theme and a live overwrite would discard their work mid-session — but a
  host's own UI must not promise propagation, so it is stated in `docs/builder-contract.md`
  rather than left to be discovered.

  `themeShelves`, `shippedThemeGroups`, `SHIPPED_THEMES_KEY`, `HIDE_ALL_SHIPPED` and the
  `ThemeGroup`/`ThemeContribution` types are exported from `@wizeworks/silicaui-builder`;
  `probe-themes.ts` (`pnpm verify:themes`) pins the merge rules and the harness host carries
  a demo shelf the `host-seam` e2e drives end to end.

## 0.38.0

### Minor Changes

- e81303c: Per-instance `limit` on a collection binding, and a canvas that draws the count.

  **`{ kind: "collection"; ref; omitWhenEmpty?; limit? }`.** A `DataSource` catalog says
  what a source **is**; `limit` says how much of it **this instance** wants. Those are
  different questions and until now they shared one field — the ref — so only the first
  could be asked, and the count was whatever the host chose when it fetched, uniform per
  source across a whole site. One catalog can now feed a strip of 4 above the fold, a full
  grid at `/shop` and a rail of 12 on the product page.

  Encoding it in the ref (`products|limit=4`) is not an alternative: `resolveTree` never
  parses a ref, but `scopeAt` **does** — it narrows a descendant's bindable fields by
  matching an ancestor's `data.ref` against a catalog `key`, so a ref that isn't exactly a
  key matches nothing and the author silently gets an empty field list on the card inside
  the repeat. The ref is load-bearing and cannot double as an options bag.

  `limit` caps how many items **load**, not how many are visible at a time — a carousel
  showing 4 of 12 is layout (`basis-1/4` on a snap rail), and the class model already does
  that. It must be a positive integer; anything else is ignored, so a malformed limit
  renders the whole collection rather than nothing. `applyCollectionLimit(items, limit)` is
  exported so a host narrowing its own pre-fetch shares the engine's clamp instead of
  re-deriving it.

  **The canvas now previews the true count.** `resolveTree`'s editing walk still refuses to
  expand a collection — a clone carries its template's ids, and selection, overrides and
  React keys are all keyed off those. The count is a rendering concern, so the canvas
  answers it there: copy 0 is the authored template, selectable and editable exactly as
  before, and copies 1..n-1 render through the same inert `preview` path the context layer
  already uses (no ids, no handlers, no decorations). A block that will ship 12 cards no
  longer lays out as one. Capped at 24 drawn copies so an uncapped source can't stall the
  editor; the Inspector's preview row states the real number either way ("12 items",
  "4 of 12 items — limited").

  Both builders get the control: a "How many" field beside the source picker in the site
  and email Inspectors, blank meaning all. The email resolver honours `limit` through the
  same clamp, so a count means the same thing in a campaign as on the page it links to.

## 0.37.0

### Minor Changes

- 90a7652: Named layouts and multi-select — the two follow-ups left open from the host-seam batch.

  **Named layouts.** `Site.frames` was already resolvable and page-selectable; now it's
  authorable. Layout mode gets a switcher (`LayoutsPanel`) to create, rename, delete and
  switch which shell it edits, `Frame.name` carries the label separately from the key so a
  rename can't break the `Page.frameId`s pointing at it, and `OpTarget` for `frame` gained
  an optional `id`. That last one is load-bearing: without it an edit to a named layout
  emitted ops a peer applied to the DEFAULT shell, silently rewriting the wrong tree on
  every other client. New ops `frame.create` / `frame.rename` / `frame.delete`, all
  invertible; deleting a layout returns its pages to the site default rather than to
  `null`, and the delete op carries the reassigned page ids so undo can put them back.

  Fixes a real bug this surfaced: `useActiveRoot` resolved the frame case from
  `doc.frame` — the layout of the ACTIVE PAGE — which stopped meaning "the layout being
  edited" as soon as a site could have more than one. Layout mode rendered, and let you
  click, a tree the Inspector wasn't writing to.

  **Multi-select.** `Editor.selectedIds` is the full selection with `selection` as its
  primary (the last added), plus `selectMany` / `toggleSelect`. Shift/Cmd-click on the
  canvas toggles membership, `Cmd+A` selects every SIBLING — the level the author is
  looking at, rather than a flat set whose members are each other's ancestors — and the
  Inspector's Design controls write to the whole set while reading the primary, with a
  header saying so. Set-aware commands (`removeMany`, `duplicateMany`,
  `setClassTokenMany`, `selectSiblings`) run inside one `batch`, so a six-node gesture is
  one undo step. Removing one member of a selection now prunes just that member instead of
  replacing the whole set with its parent.

  The Navigator stays single-select: `TreeView` has a single-id selection API, and
  widening it is a silicaui component change rather than a builder one.

## 0.36.0

### Minor Changes

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

## 0.30.0

### Minor Changes

- 26b341e: **The Chat family and `Filter` are now authorable outside React.**

  Thirteen Chat components landed as one unit — `Chat`, `ChatImage`, `ChatHeader`,
  `ChatFooter`, `ChatBubble`, `ChatLayout`, `ChatLayoutMessages`,
  `ChatMessageMetadata`, `ChatMessage`, `ChatSystemMessage`,
  `ChatTypingIndicator`, `ChatToolCalls`, `ChatComposer`. Shipping half a family
  is worse than shipping none: a consumer who finds `Chat` but no `ChatComposer`
  hand-rolls the missing half in markup that then drifts from the React layer,
  which is the exact failure the component registry exists to prevent.

  Two of those reuse existing behavior rather than inventing new vocabulary:

  - `ChatToolCalls` is structurally a collapsible, so it emits the existing
    `disclosure` behavior and the Collapsible part classes the CSS already
    targets.
  - `ChatComposer` lowers to a real `<form>` with the existing `form` behavior,
    so a static page can actually send. React adds autoresize and Enter-to-send
    on top; without them it degrades to a normal textarea and submit button
    rather than to something broken.

  **`Filter` turned out not to need a new behavior at all.** It was on the "needs
  a behavior handler" list, but checking it against the existing vocabulary first
  showed it _is_ `toggle-group`: same single-select press semantics, same roving
  focus, same `aria-pressed` buttons. The only delta was the reset control, which
  is now an optional `close` part on that handler — the "one type, optional parts"
  pattern, not a fork. Part names are scoped per behavior root, so `close` here
  can't collide with a modal's. A plain toggle group with no reset is unaffected,
  which is checked explicitly.

  Every new interactive path is verified by driving it in jsdom — clicking the
  tool-call disclosure open and shut, pressing chips, clearing them with the
  reset, and confirming the reset hides itself when nothing is selected — not by
  asserting a marker is present. All of it is locked in the byte-identical HTML
  golden.

  Also removes three `opacity-60` instances from the React layer (one live, two
  in doc examples that were teaching the pattern) — the same RULE #3 defect the
  CSS pass fixed, in a place a stylesheet sweep couldn't see.

  Still deliberately absent from `-html`, each because it needs a genuinely new
  `BehaviorType` rather than because it was overlooked: `Countdown` (a live clock;
  the existing `counter` is a one-shot 0→target tween on scroll-in), `TagInput`
  (text entry that emits removable tokens), and `PowerSearch` (faceted multi-term
  query building, which `combobox` doesn't model).

- 90de1e2: **The OKLCH ColorPicker now works outside React** — the real editor, not a
  stand-in.

  The obvious shortcut was to lower to `<input type="color">`: it works without
  JS, posts a value, and is fully accessible. It was rejected because it is a
  **different control** — a native sRGB swatch dialog, not an OKLCH L/C/H editor.
  Silica's entire token system is OKLCH, and a picker that can't express chroma
  past the sRGB gamut isn't the same tool. Shipping it under this component's name
  would have misdescribed what a consumer gets.

  So the picker is real: three `role="slider"` tracks with live OKLCH ramps,
  pointer drag with capture, full keyboard support (arrows / PageUp+Down / Home /
  End) at **exactly** React's step sizes, a hex field that round-trips, and a
  hidden input carrying the value for an ordinary form post.

  ### Two constraints shaped it

  **No inline styles in static output.** `verify-csp` forbids `style` attributes,
  but the track gradients are dynamic OKLCH ramps that depend on the current
  color. So the macro emits structure only and the handler paints on hydrate —
  following the precedent already set by `carousel` and `form`. An unhydrated page
  renders the picker unpainted, which is correct degradation for an editor that
  cannot function without JS, and the hidden input still carries the value.

  **The math is duplicated, deliberately.** `silicaui-behaviors` is a
  zero-dependency runtime; importing the React package to share `oklch.ts` would
  pull React into every vanilla page that hydrates a picker. The same reasoning
  already keeps `BehaviorType` duplicated across the two packages.

  Duplicated _math_ is a sharper risk than a duplicated string union, though: a
  drifted union fails loudly the first time a marker doesn't match, while drifted
  math keeps running and just returns slightly different colors — React and a
  static page would report different hex for the same OKLCH input. So
  `verify-oklch-parity.mjs` runs both implementations over ~1,070 cases and fails
  on any difference.

  That probe caught a hole in itself during negative testing: it originally
  compared only functions, so a deliberately corrupted `MAX_CHROMA` still reported
  "agree exactly" — the sweep bounded itself by the _other_ copy's constant and
  never exercised the drift. Exported constants are now compared too, and both
  drift kinds are verified to fail.

  Verified in a real browser as well as jsdom: dragging the hue track updates the
  swatch, the hex readout, the form value, **and re-renders the L and C ramps for
  the new hue** — the behavior that keeps the picker legible while editing, and
  the one thing jsdom cannot check, since it has no layout for
  `getBoundingClientRect`.

- 6e1edd6: **`Countdown` works outside React**, via a new `countdown` behavior.

  Reuse was checked first and rejected on the merits. The existing `counter`
  behavior tweens text from 0 to a target once, when it scrolls into view. A
  countdown is a recurring clock that stops at a deadline and formats time —
  different trigger, different cadence, different stopping condition. Reusing
  `counter` would have meant a handler that ignores most of its own parameters,
  so `countdown` is a real addition to the vocabulary rather than a stretched
  existing one.

  Two details worth naming:

  - **The macro never reads the clock.** `expand` must be pure, or two builds of
    the same tree differ and the golden fixture can't be pinned. The starting
    values come from an explicit `props.from`; without it the units render as
    placeholders the handler fills on hydrate.
  - **The authored markup carries real values**, so a page that never hydrates
    shows a sensible (if frozen) countdown rather than empty boxes.

  The handler writes only the units the markup actually authored — it never
  invents or removes DOM — and skips its timer in preview, where a ticking clock
  in an editing canvas is a distraction that also keeps a render loop alive per
  countdown on the canvas.

  Also fixes an SSR hydration mismatch in the React `Countdown`: its value is
  computed from `Date.now()`, so the server and client legitimately disagree.
  That's what `suppressHydrationWarning` exists for — the value is time-dependent
  by definition, not a mismatch to reconcile. Without it every server-rendered
  countdown logged a hydration error. Note this is a class the local
  `no-dom-in-state-initializer` ESLint rule cannot catch, since `Date.now` is not
  a DOM global.

- f9fd0a6: **`TagInput` works outside React**, via a new `tag-input` behavior.

  Reuse was checked first, as with `Countdown`. `selection-list` and
  `toggle-group` both choose among items that already exist in the markup; this
  one _creates_ them from typed text. That's a different contract, not a
  parameter, so it warranted a new type.

  **New chips are cloned from a `template` part, not constructed in JS.** This is
  the load-bearing detail. A handler that built `<span class="tag-input-chip">`
  itself would emit unprefixed class names and render unstyled in exactly the apps
  that opted into a `SilicaProvider` prefix — a failure that only appears in
  prefixed builds, which is the hardest kind to notice. Cloning keeps every class
  name in the authored markup. The golden fixture and a jsdom check both pin it
  (the cloned chip must match the authored chip's `className`).

  The value travels on a real `input[type=hidden]`, so the field submits with a
  normal form post and the `form` behavior needs no special case. Chips are
  comma-joined, matching what the React component posts.

  ### `<template>` moved onto the raw-element allowlist

  Emitting a `<template>` revealed the sanitizer was downgrading it to a `<div>`,
  which rendered the blueprint as a visible empty chip. `template` had been sitting
  in the exclusion list beside `script`, `iframe`, and `object` — a different
  category entirely: those execute or embed, while `template` is inert by
  construction (its content parses into a detached fragment that never renders and
  never executes), and its children still pass through `sanitizeElement`.

  Because that widens the security floor, it is now asserted rather than assumed:
  `verify.mjs` checks that a `<script>`, an `<iframe>`, and an `on*` handler placed
  _inside_ a template are still downgraded and stripped.

  A `hidden` chip was considered as an alternative and rejected — an author
  `display:inline-flex` on `.tag-input-chip` beats the UA `[hidden]{display:none}`
  rule, so the blueprint would become visible under exactly the CSS this library
  ships.

  Also fixes a React-parity bug found while writing the probe: React's `addTag`
  clears the field _before_ its dedupe/max checks, so a rejected duplicate still
  empties the input. The handler cleared only on success, which made the two
  layers behave differently for identical input.

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

### Patch Changes

- 4d96f1c: Accessibility + CSP hardening across the vanilla runtime and static HTML projection.

  - behaviors: hydrate no longer steals page focus (toggle-group, selection-list); tooltips are keyboard-reachable with hover persistence and generated `aria-describedby`; modal scroll-locks and inerts the background while open; CommandPalette and combobox convey the highlighted option via `aria-activedescendant` over generated ids; carousel off-screen slides are inert, dots use present-or-absent `aria-current`, and autoplay pauses on keyboard focus; overflow-list is a proper disclosure (`aria-expanded`, Escape, real accessible name); rating keeps `aria-checked` in sync; wizard marks the active step `aria-current="step"`; form submits announce success/error via a live region; menus close on Tab; `confirm()` initially focuses Cancel; dismiss parks focus before removing its root; marquee honors reduced motion; scroll-area viewports are keyboard-focusable. New `verify-a11y.mjs` probe (32 checks) locks these contracts.
  - html: `DropdownMenuContent` gets `role="menu"`, `TabsList` gets `role="tablist"`, the calendar grid is an honestly-labeled group, slider thumbs and date segments carry default `aria-label`s, OverflowList's panel drops its incorrect `role="menu"`. Embed's iframe no longer uses an inline `style` attribute, making static output run under strict CSP (`style-src` without `'unsafe-inline'`) — enforced by a new `verify-csp.mjs` probe.

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

### Minor Changes

- 79822a8: Host nodes (live code-component embeds) + two-tier node locking — two orthogonal, universal primitives so an authored page can carry a live, host-owned functional region (checkout, search, cart, a data grid) pinned in place. Design authority: `docs/host-nodes-and-node-locking.md`.

  - **Node locking** — new `NodeBase.locked?: "host" | "author"` (presence encodes locked; the value encodes the owner). The editing spine refuses `remove`/`move`/reparent on any locked node, `duplicate` yields an unlocked copy, and a new tier-blind `setLocked(id, owner)` primitive is undoable. The Inspector's Settings tab gains a Lock row (an author toggle, or a read-only "Locked by host" indicator with no unlock — only the host clears a host lock); the Navigator shows an owner-aware lock/shield glyph. Generalizes the outlet/root protection; no projection reads `locked`.

  - **Host nodes** — new `HostNode { kind: "host"; component; props }` in the node union (+ a `host()` kit helper). `toHtml` projects an **empty** `<div data-sui-host="…" data-sui-host-props="…">` mount point — never live framework code, preserving the framework-neutral projection promise — into which a host mounts its real component (client or SSR), the same trust model as behavior-marker hydration and `rawHtml`. Every traversal (`stampTree`/`walk`/`flattenSymbols`/`resolveTree`) passes a host node through untouched.

  - **`@wizeworks/silicaui-behaviors`** — new optional `mountHostNodes(registry, root?)` helper, the client-side companion to the mount points (symmetric with `hydrate()`); host components stay host-owned.

  - **Builder** — `BuilderHost` gains `hostComponents()` (Insert-palette entries, `pinned` inserts host-locked) and `renderHostNode()` (live canvas preview, with a labeled placeholder fallback), plus `HostComponentDef`/`HostPropDef`/`HostRenderCtx`. The engine treats a host node as a selectable **leaf** — drop-_beside_, never drop-_into_ — and `setProp` writes host props. The Inspector renders a Host panel from the component's declared props.

## 0.21.0

### Minor Changes

- 9e0027d: Media, icons, and rich-text/embed support for the framework-neutral renderer.

  - **Video / audio**: `<video>` and `<audio>` now render through `toHtml` (added to the raw-element floor with their full attribute set — `poster`, `controls`, `autoplay`, `muted`, `loop`, `playsinline`, `preload`, sizing, `crossorigin`; `<source>` kept). New first-class **Video** component (palette + Inspector). Previously both coerced to `<div>`.
  - **Icons on static pages**: `toHtml` now inlines an SVG glyph for `Icon` (`data-icon`) spans via a new `icons` resolver that **defaults to a bundled Lucide set**, so a published page is self-contained (no icon runtime/font). Pass a custom `Record<name, markup>` / function to override, or `icons: false` for the bare span. Core stays icon-agnostic; the builder canvas uses the same resolver (preview == production). Exported: `LUCIDE_ICONS`, `iconSvg`, `IconResolver`.
  - **Data-bound trusted HTML**: new `DataBinding` kind `{ kind: "html"; ref }` and **RichText** component for CMS long-form / rich text. `resolveTree` fills a render-time `rawHtml` that `toHtml` emits unescaped — the host sanitizes the value at its data boundary (same trust model as `dangerouslySetInnerHTML`). Unresolved binds lower to an inert `data-sui-html` marker.
  - **Embed**: new curated **Embed** component (YouTube / Vimeo / Google Maps) that emits a sandboxed `<iframe>` to an allowlisted host only, normalizing share URLs to their embed form; unknown hosts fall back to a link. `<iframe>` is still not in the raw-element floor — arbitrary authored iframes continue to downgrade to `<div>`.
  - **Broader inline-SVG allowlist**: pasted logos/illustrations survive — added `defs`, `use`, `symbol`, `title`, `desc`, `ellipse`, `text`, `tspan`, `clipPath`, `mask`, `pattern`, `linearGradient`, `radialGradient`, `stop`, `image`, plus a shared presentation-attribute set. Security is unchanged: `script`/`style`/`foreignObject` still downgrade, `on*` fails closed, inline `style` is stripped, and `use`/gradient/pattern `href` is restricted to internal fragment references.

## 0.20.0

## 0.19.0

### Minor Changes

- d0d7cc6: `SCALAR_TOKENS` (the theme's non-color knobs — radius/border/size/depth/noise/focus-width/disabled-opacity) now carries a `doc` string per entry describing what it actually affects, surfaced through the MCP's `get_tokens` and documented in `docs/silicaui-architecture.md` §5.1. Also fixes a stale ThemeEditor tooltip ("3D depth on fields & selectors") that no longer matched what `--depth` controls (Card/Button shadow), and regenerates the MCP catalog to pick up previously-uncataloged package versions and the Combobox `popupProps` prop.

## 0.18.0

### Minor Changes

- 66ee29f: A `collection` data bind can now opt out of the "zero items renders the authored children once, as a placeholder" convention: `DataBinding`'s collection variant gains an optional `omitWhenEmpty` flag, and both the site and email resolvers honor it identically — a collection resolving to zero items with `omitWhenEmpty: true` drops the node (and its subtree) entirely, the same way a `value` bind's `visible: false` does, instead of rendering the placeholder row. Both Inspectors' Data binding section gain a matching "Omit when empty" toggle on a collection bind.

## 0.17.0

## 0.16.0

### Minor Changes

- 8b540c0: Add Google Fonts theming to the site builder. `ThemeEditor`'s body and heading typeface controls are now a searchable picker over ~1900 Google Fonts (previously a 4-option body toggle and a 2-option "Match body"/"Serif" heading toggle) — selecting a font live-loads it in the canvas for preview and records the exact family/weights on the new optional `Theme.fonts` field, so a host can self-host the real files at publish time instead of hotlinking Google's CDN (a real EU privacy liability for published sites).

  New package `@wizeworks/silicaui-fonts` provides `selfHostGoogleFonts()` — a Node-only, publish-time utility a host's backend calls to fetch and self-host the actual font files, given `theme.fonts` from `PublishPayload`.

  Also adds `Combobox`'s `popupProps` (mirroring `Select`) so a portaled Combobox popup can re-stamp `[data-theme]` when opened from inside a scoped theme island.

- 8b540c0: The Theme editor's "This site" saved-theme library is now real, host-persistable site data instead of an in-memory-only convenience. `Site` gains an optional `savedThemes` field; saving/deleting a named theme now flows through `Builder`'s `onChange` and local crash-recovery same as any other edit, so a theme an author starts (e.g. a "Christmas" theme built months ahead) survives a reload and round-trips through a host's own persistence — same as the rest of the site. The shipped `THEME_PRESETS` starting points are unaffected.

## 0.15.0

## 0.14.0

### Minor Changes

- aa589af: `DataBinding`'s `value` kind gains an optional `attr?: string`. When set, `resolveTree`'s `fillValue` writes the resolved value onto exactly that attribute (element) or prop (component) — e.g. a product card's own `<a>` binding `href` — instead of relying on the auto-detected primary slot (which only ever covered `img`/`source`→`src`, `input`→`value`, and a component's `label`/`text`/`src`). Omitting `attr` keeps today's auto-detection unchanged.

  The site builder's Inspector gains a "Target attribute" field on `value` bindings, next to the existing kind/reference picker, following the same pattern as the `action` kind's "Fallback href".

## 0.13.0

## 0.12.0

### Patch Changes

- 9c716c3: Fix `resolveTree`'s data-fill for form controls: a bound value on an `<input>` now sets its `value` attribute instead of its children, which `toHtml` silently drops for void elements (the bound value previously vanished from the rendered output with no error).

  Add `<Builder toolbarSlot>` — a header extension point (rendered next to Publish) for host-owned UI like a save-status badge, since the builder itself has no way to know whether a host's own persistence succeeded, failed, or is pending. Also widen `<Builder document>` to accept `Document | Site` directly (the `Editor` already did), dropping a cast some hosts needed.

## 0.11.0

### Minor Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

## 0.10.1

## 0.10.0

### Minor Changes

- 8e7b6ed: Add the builder host adapter seam (builder-contract.md §5): `<Builder host={...}>` now accepts `catalog` (Insert-palette merge), `dataSources` (a real binding picker via engine-owned `scopeAt`), `validateClass` (composes with a new non-optional built-in class-string floor), `inspectorPanels` (additive host panels writing through the shared mutation primitives), and `pickAsset` (a new asset-picker Inspector control).

  Add the data-resolution keystone: `resolveTree(tree, host, scope?)` in `@wizeworks/silicaui-html` — one synchronous walker resolving `value`/`collection` bindings (including nested repeats), directly usable by a host's own live-render path (`toHtml(resolveTree(root, host))`). The Inspector's Data binding panel gained a live "Preview" row using the same host resolvers.

  Fix: the raw-element/attribute security floor (`sanitizeElement`, closed tag+attribute whitelist) is now enforced unconditionally in both `toHtml` and the live editor canvas — the canvas previously had no sanitization at all, a more exploitable gap than the publish path since it's the builder's own browser session.

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

### Patch Changes

- Fix several layout/visibility bugs found while auditing the playground, and add a proper chat typing indicator:

  - **Alert/Toast**: top-align the leading icon and trailing actions/close button (`align-items: flex-start`) instead of centering them against the whole (often multi-line) row. `.alert-close`/`.alert-actions`/`.toast-close` now claim their own trailing space via `margin-inline-start: auto` instead of relying on a sibling `AlertContent` to flex-grow — a dismissible one-liner Alert (bare children, no `AlertContent`) previously left the `×` sitting right next to the text instead of at the row's end.
  - **Collapsible**: new `CollapsibleTrigger` `variant="icon"` — a compact circular disclosure control (sized like `AlertClose`) for placing a second trigger in its own layout slot (e.g. an Alert's trailing actions) while a `variant="default"` trigger elsewhere carries the visible label; both share one `Collapsible`'s open state via context.
  - **Collapse**: renamed its CSS class from `.collapse` to `.details` everywhere (CSS, React, the `-html` macro, the prefix-recognition table, the builder's palette). Tailwind v4 ships a built-in `.collapse { visibility: collapse }` utility (for table row/column collapsing) that silently won over the component's own rule of the same name, making every `Collapse` invisible while it still occupied layout space. The public React names (`Collapse`/`CollapseTitle`/`CollapseContent`) are unchanged.
  - **Carousel**: `className` now applies to both the outer positioning root and the inner scroll strip, not just the strip. Previously a width-constraining class (e.g. `max-w-lg`) shrank the visible strip while the prev/next controls — absolutely positioned against the _root_ — stayed anchored to the full, unconstrained parent width.
  - **MockupPhone**: no component change; documented that content should fill the display (`w-full h-full`), not a fixed size smaller than it.
  - **Chat**: `.chat-layout-messages` now bottom-anchors (`justify-content: flex-end`) so a short conversation sits against the composer instead of pinned to the top with a dead gap below it. Added `ChatTypingIndicator` — three animated dots inside a real `.chat-bubble` (matching avatar/placement of a normal message) — replacing the old plain-text "is typing…" convention.

## 0.4.0
