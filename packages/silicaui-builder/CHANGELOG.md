# @wizeworks/silicaui-builder

## 0.52.0

### Minor Changes

- f99ccb6: Every button in both builders says what it does on hover; the email builder's Export HTML button is gone

  ### Export HTML is removed (BREAKING — a minor, since SilicaUI is pre-1.0)

  The email builder shipped an **Export HTML** toolbar button that did two things: triggered a
  client-side `Blob` download of the projected markup, and called an optional `onExport` prop with the
  same string. Both are gone, along with the `onExport` prop.

  Projecting a document is the HOST's job, not a button in the chrome. A host already owns the send
  path, the storage, and the filename; the builder handing the browser a `subject-slug.html` download
  was a fourth, uncoordinated answer to a question the host had already answered. The projector itself
  is untouched and still public:

  ```ts
  import { toEmailHtml } from "@wizeworks/silicaui-builder/email";
  const html = toEmailHtml(doc, { resolver: host, frame });
  ```

  That is the same one projector Preview and Send test use, so nothing about the output changes.

  **Migrating from `onExport`:** render your own action in `toolbarSlot` and call `toEmailHtml`
  yourself. The prop only ever fired on that button's click, so there is no other behaviour to
  replace. The site builder had no export or import button and is unaffected — `Publish` is its
  terminal action and stays.

  There was never an Import HTML anywhere in either builder. (The site Theme editor's paste-CSS →
  **Apply** flow imports _theme CSS_, not document HTML, and is deliberately untouched.)

  ### Tooltips on every chrome button

  Roughly thirty icon-only buttons across both builders had no hover help at all, and every other
  button relied on the native `title` attribute — which has an unconfigurable ~1s delay, no styling,
  no theme, no touch support, and is announced inconsistently by screen readers (often twice, once as
  the name and once as the description). Icon-only controls in a dense tool UI are exactly the case a
  real tooltip exists for.

  New shared primitives in the builder — `Hint`, `IconButton`, `BuilderTooltipProvider` — replace
  every `title` on a control. Three rules they enforce that a per-call-site `<Tooltip>` would not:

  - **One string, both consumers.** `IconButton` takes one `label` and emits both the tooltip and the
    `aria-label`, so they can't drift. Several swatch grids were empty `<button>`s carrying only a
    `title` — no accessible name at all — and now have real ones.
  - **Themed.** Base UI portals the popup to `document.body`, outside the chrome's `[data-theme]`
    island, where `--color-*` resolves against nothing. `Hint` re-stamps the studio theme, the same
    fix `DialogContent` and `Select`'s `popupProps` already use. `StudioThemeProvider` moved to
    `shared/react/` and is now mounted in the email shell too (it was site-only, and the email builder
    hand-threaded `studioTheme` as a prop through each panel).
  - **Disabled controls still explain themselves.** "Why can't I click this" is the hover people
    actually make, and it's the one Base UI drops by default since a disabled `<button>` emits no
    pointer events. Disabled buttons now carry their reason: _A row holds at most 6 columns_, _This
    block is locked by the host_, _Publishing isn't available here — this editor's host hasn't wired
    it up_.

  Tooltips add the CONSEQUENCE rather than repeating a visible label — "Delete component" gets _every
  instance is unlinked into a real copy_; a value chip that already reads "Bold" gets nothing, because
  a popup echoing the word on the button is noise.

  Two accessible names changed, both improvements: the rich-text toolbar's buttons are named `Bold` /
  `Italic` (the shortcut moved to its own tooltip line, out of the accessible name), and swatches are
  named for what they set (`Medium corners`, `Base 200`) instead of carrying a bare `title`.

  ### silicaui-react

  - `Tooltip` gains **`popupProps`** — the escape hatch `Select` and `Combobox` already had, for
    re-stamping a theme on the portalled popup.
  - `DialogTrigger` **forwards its props** to Base UI's trigger instead of dropping everything but
    `children`, and accepts `nativeButton`. A trigger wrapper that silently swallows props is
    indistinguishable from a broken dialog at the call site: nothing errors, the button just stops
    opening anything.

  ### Verified

  A new `tooltips` e2e spec asserts the parts that regress silently: that the popup is themed
  (`data-theme="studio"`), that no `title` survives beside it (both would show, staggered), that a
  disabled button still opens one, that an unlabelled swatch has an accessible name — and that neither
  builder has an Export or Import button. Full builder suite: 199 passing.

  One trap worth recording, since it cost a full red suite: **two Base UI triggers cannot render the
  same element.** A tooltip trigger nested with a dialog trigger clones the child twice and the second
  clobbers the first's ref, so the dialog stops opening with no error anywhere. Where both are needed,
  the tooltip owns a wrapper `<span>` and the dialog owns the real button.

### Patch Changes

- @wizeworks/silicaui-panels@0.52.0
- @wizeworks/silicaui@0.52.0
- @wizeworks/silicaui-html@0.52.0

## 0.51.0

### Minor Changes

- cda15c0: A host component is a first-class palette row, not a plug labelled with its own allowlist key

  `hostComponentGroups` built its palette item from four fields of a `HostComponentDef` and dropped
  the rest. Everything below lives in how the palette and inspector RENDER a def — which is why none
  of it is visible to an assertion about trees or projected HTML, and why the whole class of it
  survived a full render sweep. It was found by opening the Add palette.

  ### `icon` was declared and read nowhere

  Every host row drew the same hardcoded plug. A host picks a registered icon name, writes it down,
  and gets nothing — silently, because the honest outcome of an unimplemented field is a type error
  and this was a fallback. `icon` is now read, with the plug as the FALLBACK it was always documented
  to be. An unknown name warns once and names itself, the same loose-string contract `inspectorTabs()`
  already has: the def crosses a package boundary, so `IconName` isn't enforceable at the type level
  and a typo has to announce itself at runtime.

  It reads through to the Navigator glyph and the Inspector's identity header too, not just the
  palette. Fixing only the palette would have swapped one inconsistency for a worse one — the row you
  clicked showing a map, the layer it inserted showing a plug.

  ### `hint` did not exist

  So a host row got no tooltip (`ItemRow` renders `item.hint` as its `title`) and contributed nothing
  to search, which ranks over label / key / hint / group. Catalog rows had four searchable fields;
  host rows had two. `hint` is now a field on `HostComponentDef` and flows to both. The key is also
  searched with its namespace stripped (`host:` as well as `block:`) — a prefix is routing metadata,
  and leaving it in made every namespaced row a hit for the letters h-o-s-t.

  ### `category` is display copy, and now says so

  It was used verbatim as the group's HEADING while its key became `hostcat:<slug>`, which nothing
  documented — so a host passing what looks like a slug (`'media'`) got a second group rendering as
  MEDIA directly beneath the builder's own Media group, because `mergeCatalog` only ever merges by
  key. A category that names a built-in group — matched on key or heading, case- and space-insensitive
  — now merges INTO it. Anything else opens its own group, labelled with the host's copy verbatim.

  ### The registered `label` never reached the node

  `makeInsertNode` stamped `label` only for `block:` keys, so a placed host node had none and
  `nodeName` fell through to the derived type name: the inspector header for `site.map` read
  **`Site.map`** — the allowlist key, sentence-cased — while the label the host registered sat two
  fields away in the same object. It is stamped now, keyed on the produced node's KIND rather than a
  string prefix, so a host component contributed through `catalog().extend` gets it too.

  Nodes a host authors programmatically never pass through the palette at all, so the display layer
  resolves the same def as a fallback: `nodeName` / `nodeRowLabel` / `nodeIconName` / `nodeTypeLabel`
  take an optional lookup, bound in React by `useHostDisplay()`. A lookup rather than a module-level
  registry, because a shell can hold several editors on several hosts at once. And `humanize` now
  treats `.` as a separator like `-`, so even an unregistered host node reads "Site map" rather than
  "Site.map".

  ### The identity header called a host node an Outlet

  `kindLabel`'s ternary had no arm for `kind: "host"`, so it landed in the `else`. A host node is a
  region the host renders and that takes props; an outlet is the structural slot a page body lands in.
  Different primitives, and the inspector told the author they were the same thing. It reads
  **"Host component"** now.

  ### `hide` could not reach a host row

  `catalogForHost` merged twice and only the first merge carried the hide set, so a `host:*` key could
  never be in `hidden` at the moment it mattered. Every other palette row was suppressible; host rows
  alone were mandatory.

  That bites because a host core is frequently the raw INGREDIENT of a curated block rather than
  something to place bare — the frame without the heading, or without the address as readable text
  beside the picture. Hiding it is the right fix, and deregistering it isn't an alternative:
  `hostComponents()` is also the render and prop allowlist, so removing the row removes the component.
  The host groups now run back through `mergeCatalog` as its own base, which applies exactly the
  item-key/group-key matching every other row already gets — including dropping a host group whose
  last row was hidden.

  ### A search row lost its name before its group badge

  Not host-specific. `ItemRow`'s badge was `shrink-0` and its label was a plain `truncate`, and
  `truncate` sets `overflow: hidden` — which already zeroes a flex item's automatic minimum size. So in
  a narrow dock a 19-character group ("Video, audio & maps") kept every pixel while the NAME truncated
  to nothing: rows that are an icon, a category, and no answer to what the author just typed. It only
  appears in SEARCH results, which is precisely when names are being read rather than sections scanned.

  The label is `flex-auto` (it claims its real width) against a badge whose shrink factor is large
  enough that flexbox's size-weighted distribution takes the deficit out of the badge first. The badge
  collapses to nothing, and only then does the name begin to truncate. `flex-1` would NOT have fixed
  it — a `0` basis means the label claims no width of its own and only ever gets what the badge leaves.
  A host cannot restyle this row, and "make the panel wider" is not a fix when the panel is the host's
  own dock.

  ### Verified

  `probe-host` gains 22 checks over the def→row→node path (icon read, unknown-icon warning fired
  exactly once, hint carried, category merged vs minted, label stamped, the display fallbacks with and
  without a lookup, and `hide` reaching a host row, emptying its group, and still composing with a
  built-in hide). Three e2e specs cover the same ground through the real chrome, including measuring
  that a squeezed search row keeps its name and drops its category. `<Icon>` now emits `data-icon`,
  because inline SVG path data is otherwise unassertable — which is how a hardcoded plug stood in for
  a registered icon without any test noticing.

### Patch Changes

- @wizeworks/silicaui@0.51.0
- @wizeworks/silicaui-html@0.51.0
- @wizeworks/silicaui-panels@0.51.0

## 0.50.0

### Patch Changes

- Updated dependencies [0b59128]
  - @wizeworks/silicaui-html@0.50.0
  - @wizeworks/silicaui@0.50.0
  - @wizeworks/silicaui-panels@0.50.0

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

### Patch Changes

- 0a50a3d: The canvas stops logging React warnings for attributes it was handed correctly

  Opening any site with a hero video filled the host app's console:

  ```
  Invalid DOM property `autoplay`. Did you mean `autoPlay`?
  Invalid DOM property `playsinline`. Did you mean `playsInline`?
  ```

  Two errors per Video node, on every render. Nothing was actually wrong with the document. A node's
  `attrs` carry real HTML attribute names because that is what `toHtml` has to emit — `<video autoplay
muted loop playsinline>` is the correct markup for a muted looping background video, and it is what
  the `Video` component's own inspector authors, `playsinline` toggle and all. React wants
  `autoPlay`/`playsInline`, so `canvasAttrs` translates on the way into `createElement`. Its table
  listed fifteen names and neither of those.

  ### The shape of the bug is drift, not omission

  `canvasAttrs` runs after `sanitizeElement`, so the universe of names that can reach it is exactly
  `element.ts`'s allow-set. Those are two lists that have to agree, in two packages, with nothing
  telling anyone editing one to look at the other. `video` gained `autoplay` and `playsinline`; the
  canvas table did not follow. Nineteen hyphenated SVG presentation attributes — `stroke-width`,
  `clip-path`, `stop-color`, `dominant-baseline`, `letter-spacing` — had never been listed at all, so
  a pasted brand logo warned once per attribute per node.

  Checked against React's own `possibleStandardNames`, 22 of the 117 allowed names rendered under a
  name React rejects.

  So the fix is not "add two entries". Hyphenated names now camelize **by rule** (`reactAttrName`),
  which is exact for every hyphenated attribute React knows and keeps `SVG_PRESENTATION` correct here
  for free as it grows; the explicit table is down to what it should always have been — the irregulars
  whose React spelling can't be derived (`for` → `htmlFor`, `autoplay` → `autoPlay`, `datetime` →
  `dateTime`). `data-*` and `aria-*` are excluded, since React wants those verbatim. Attributes are
  rebuilt through the rule rather than renamed in place, so a name nobody thought about still arrives
  correct.

  ### And a probe, because nothing else could see this

  `probe-canvas-attrs` walks every attribute `element.ts` permits and asserts each one renders under
  the name React wants — reading React's expectation out of the installed `react-dom` development
  bundle rather than restating it, since a copied table is one more thing to drift. A console-only
  defect is invisible to types, to lint, and to any assertion about what rendered: the element appears,
  the builder looks fine, and the only symptom is red in someone else's console. Checking the two
  broken attributes would have been worthless — the whole allow-set is checked, so the next attribute
  added to `element.ts` fails here instead of in a host app.

  Canvas-only throughout. `toHtml` and production markup are untouched — this only ever sees the
  ephemeral render-time copy.

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

- Updated dependencies [aeb02f8]
- Updated dependencies [7f4449e]
  - @wizeworks/silicaui-html@0.49.0
  - @wizeworks/silicaui@0.49.0
  - @wizeworks/silicaui-panels@0.49.0

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

- Updated dependencies [2b079ee]
  - @wizeworks/silicaui@0.48.0
  - @wizeworks/silicaui-html@0.48.0
  - @wizeworks/silicaui-panels@0.48.0

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

- Updated dependencies [a81f64f]
- Updated dependencies [a81f64f]
- Updated dependencies [a81f64f]
  - @wizeworks/silicaui@0.47.0
  - @wizeworks/silicaui-html@0.47.0
  - @wizeworks/silicaui-panels@0.47.0

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

  - @wizeworks/silicaui-panels@0.46.0
  - @wizeworks/silicaui@0.46.0
  - @wizeworks/silicaui-html@0.46.0

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

### Patch Changes

- b33c93d: Layers and Insert are first-class tabs at the top of the left rail — in both the
  site and the email builder.

  They were a small segmented pill group sitting under whatever the rail's real
  header happened to be (Pages, Layout, Components, Templates), which said the
  switcher outranked them and made the two most-used destinations in the editor
  look like a filter on a panel. They now use the same `PanelTabs` strip the
  Inspector uses on the right: an underline tab list that IS the rail's header, at
  the same 40px row on both sides of the app. First-level navigation is a tab, not
  a pill — the rule the Inspector already followed, now applied to the other rail.

  The switcher above them moves INSIDE the Layers tab, where it belongs: Pages,
  Layouts, Components and email Templates all choose which tree the layers show, so
  they are a child of that tab rather than a fixture that outranks both. The Insert
  palette gets the full height of the rail as a result. The layer-depth toggle
  follows its tab, off the end of the strip, via a new `actions` slot on
  `PanelTabs`; a `testIdPrefix` prop keeps the two strips' test ids distinct
  (`left-tab-*` vs `inspector-tab-*`).

  In Component mode with nothing open there is still nothing to insert into, so
  only Layers is offered and an author who left Insert open falls back to it rather
  than landing on a dead panel.

  E2E specs that reached these by `getByRole("button", { name: "Layers" })` now use
  `getByRole("tab", …)`, which is what the strip actually exposes.

- Updated dependencies [b33c93d]
- Updated dependencies [b33c93d]
- Updated dependencies [b33c93d]
  - @wizeworks/silicaui-html@0.45.0
  - @wizeworks/silicaui@0.45.0
  - @wizeworks/silicaui-panels@0.45.0

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

### Patch Changes

- c1ed199: The canvas drop indicator is a target you can aim at, on both builders.

  It was a 2px accent bar spliced in between the hovered node's siblings. Three
  problems, in ascending order of how much they cost:

  **It read as a hairline.** A 2px rule states the seam exactly and tells the
  author nothing about how much slack surrounds it, so a drop felt like threading a
  needle even though the hit band was always half the node (or a 24px end band on a
  container). The marker is now a 22px accent zone with a solid bar and end caps,
  centered on the edge the node will land at and spanning the node it belongs to —
  the size of the affordance now matches the size of the target.

  **It was drawn on the wrong axis.** `computeEdge` read `clientY` unconditionally.
  That is right for a stack and meaningless in a flex row, where the entire top
  half of every sibling meant "before", the pointer's horizontal position — the
  only thing the author is aiming with — was discarded, and the indicator was a
  horizontal rule between two side-by-side cards, pointing at nothing. A new
  `siblingAxis` reads the target's real DOM neighbours (the parent's
  `flex-direction`, else a measured comparison against an actual sibling), so a
  row is aimed at horizontally and drawn with a vertical bar. Email columns and
  the site's flex/grid rows both get this.

  **In a flex row it fought the pointer.** A marker spliced between two children of
  a flex container is itself a flex item, so it claims a share of the container's
  `gap`: the very node being aimed at slid out from under the cursor, the pointer
  landed on the container, the drop re-resolved to INSIDE and the marker vanished —
  with the author holding still. (Measured on the seeded hero's CTA row: the marker
  appeared at the target's left edge and was gone 4px later. In a grid container it
  was worse — the marker ate a whole cell.) It is now drawn as a measured overlay
  over the board, the same way `SelectionOverlay` draws the selection ring, so a
  pending drop costs the layout nothing and what you are aiming at never moves.

  `renderChildren` no longer interleaves anything, and `RenderCtx.lineGap` is gone
  from both canvases. `e2e/drop-target.spec.ts` covers all of it, including walking
  the pointer across the row seam that used to lose the drop.

- c1ed199: Two email-Inspector fixes found while checking whether the site builder's
  repaint/padding defects had twins here. (They don't — email nodes carry typed
  fields, so an update is an assignment and can't layer, and every view reads
  `extract()`, which clones per commit. Both are now covered by
  `e2e/email-repaint.spec.ts` so they stay true.)

  **Control rows were stealing a control's accessible name.** `Row` was a
  `<label>` wrapping arbitrary children, and a `<label>` names the first labelable
  element it wraps — `<button>` included. So every chip and swatch row handed its
  entire text to whichever control came first: the Auto chip announced as
  "Padding Y 0 2 4 6 8 44", every other chip announced with no context at all, and
  in `NumberField` the number input left unnamed while the reset button took the
  label. 40 rows across every node kind. Rows holding more than one control are
  now `role="group"` + `aria-labelledby`, which names the SET without taking any
  member's name; single-control rows stay real `<label>`s. Guarded generally
  rather than row-by-row — `e2e/email-inspector-a11y.spec.ts` sweeps every kind
  and fails on any `<label>` wrapping two controls.

  **Size and radius chips can now reach a value they don't list.** The chip ladder
  is a scale, and the free-entry field only appeared once the value was ALREADY
  off it — so an author could edit a foreign value (from a template, or another
  editor via `applyRemoteOps`) but never author one: 12px padding or a 12px corner
  had no way in. A `Custom` chip opens the field on demand; an off-ladder value
  still opens it unprompted. Radius gains the same trailing custom swatch the
  colour picker already had.

  Also: `Auto` no longer highlights when no chip matches. It is a reset ACTION —
  an email field is never unset, unlike a site class token — and lighting it on a
  deliberate 44px announced that value as the default. `Custom` owns "this isn't a
  preset" now, matching the convention `SwatchGroup` already documented.

- c1ed199: Fix two builder defects reported from a real host integration.

  **Layout mode never repainted the canvas.** `Editor.activeRootNode` handed back
  the LIVE tree root, and node edits mutate that tree in place — so the object
  identity never changed and anything memoizing on it (the canvas's `useResolved`,
  `React.memo`, a host's own view) kept rendering the pre-edit tree. Edits landed
  in the model, saved, and published; they just weren't visible until a reload, and
  only in Layout / Component mode (Page mode reads a per-commit clone from
  `extract()`). It bit only hosts that resolve data, since resolution is what puts
  a memoized copy between the model and the screen. `activeRootNode` is now a
  defensive snapshot with a fresh identity per commit — same guarantee `extract()`
  already gave the page tree. Probe: `pnpm verify:repaint`.

  **A padding value above the control's ceiling couldn't be overwritten.** A class
  group only stripped its own listed members, so on a section authored `py-20` —
  what most starter heroes carry — picking 16 appended `py-16` and left `py-20`
  standing, which won in Tailwind's source order. Computed padding never moved.
  A group that enumerates a numeric SCALE now owns that whole scale (`py-0 … py-16`
  owns `py-20`, `py-[3rem]`, `py-px`), so any step is replaceable and `Auto` really
  clears. Derived, so every numeric group — `gap-*`, `grid-cols-*`, a host's own —
  gets the same fix; groups of NAMED values (`text-left/center/right`,
  `rounded-*`) keep membership semantics, since owning a shared prefix there would
  strip a node's color and size. The padding scale itself now runs to 32, so the
  control can express a hero's own spacing rather than only overwrite it.

  Consumers that generate a Tailwind safelist from `CANVAS_UTILITY_CLASSES`
  (`@wizeworks/silicaui-builder/vocab`) pick up `p/px/py-20|24|32` on rebuild.

- c1ed199: The site Inspector's rows now label what they label.

  A row was a `<div>` with a `<span>` above the control — which looks exactly like
  a label and is not one. Nothing associated the two, so every single-control row
  in the Settings tab announced as a bare "edit": Name, ID, Content, ARIA label,
  Role, Tab index, DOM id, Title, and the custom-attribute key/value pairs. (The
  irony of an unnamed "ARIA label" field is the reason this is worth its own note.)

  Rows are now real `<label>`s, which name the one control they wrap. Rows holding
  a SET of controls — the 33 chip, swatch, focal-point, display, trigger, ID and
  asset rows — are `role="group"` + `aria-labelledby` instead, because a `<label>`
  names the first labelable element it wraps and `<button>` is labelable: wrapping
  a chip row in one would hand "Padding X Auto 0 2 3 4 6 8…" to whichever chip came
  first and leave the rest with no context at all. Group naming also gives the
  Design tab's chips the row context they never had.

  Both rules are enforced rather than remembered — `e2e/inspector-a11y.spec.ts`
  sweeps the rail across node kinds and both tabs, failing on any control with no
  accessible name, any `<label>` wrapping two controls, and any nested `<label>`.
  Its email twin (`email-inspector-a11y.spec.ts`) does the same there.

  Specs that located rows by their element (`div.mb-2`, `label`) now use the shared
  `ROW` selector, which matches either shape — so a row gaining a second control
  stops being a test-breaking change.

- Updated dependencies [c1ed199]
- Updated dependencies [c1ed199]
  - @wizeworks/silicaui-html@0.44.0
  - @wizeworks/silicaui@0.44.0
  - @wizeworks/silicaui-panels@0.44.0

## 0.43.1

### Patch Changes

- Updated dependencies [f802ac6]
  - @wizeworks/silicaui@0.43.1
  - @wizeworks/silicaui-html@0.43.1
  - @wizeworks/silicaui-panels@0.43.1

## 0.43.0

### Minor Changes

- a9a708e: **The inspector rail's tabs are now its header — and a host can add tabs to it.**

  Both builders stacked a fixed `Design` header bar on top of the Inspector's own
  Design/Settings switcher. It duplicated the first tab's name and then contradicted
  the second: open Settings and the rail still said "Design". The left rail already
  did this correctly — its `PanelHead` _contains_ the Layers/Insert toggle — so the
  right rail now matches it. The header bar is gone; the tab strip is the header.

  Those tabs are also no longer a segmented pill. A pill is a **mode switch** — a set
  of options where one is armed — and at first level it read as one more row of chips
  alongside the Editing / All sizes / Tablet controls right below it. A first-level
  tab is a **page of the panel**, so the strip uses the `underline` Tabs variant: the
  row carries the baseline rule, the active tab's indicator sits on that rule, and
  tabs are natural-width and left-aligned rather than stretched edge to edge. The
  rail's genuine mode switches stay pills, which is now a real distinction instead of
  a coincidence.

  `PanelTabs` owns the panel body as well as the strip, so the ARIA is real: Base UI
  wires `role="tablist"`/`role="tab"` with `aria-controls` pointing at a panel that
  exists. **Anything locating these tabs by `role="button"` / `aria-pressed` must move
  to `role="tab"` / `aria-selected`.**

  That makes a new seam possible. `host.inspectorTabs(node)` contributes **whole
  panels** to the right rail as top-level peers of Design and Settings, which is a
  different grain from the existing `host.inspectorPanels(node)` — a section _inside_
  Settings. Both tiers stay; pick the one that matches the contribution.

  A tab declares its scope, and the choice is not cosmetic:

  ```ts
  inspectorTabs: (node) => [
    // Panel-scoped: about the document. Renders with NOTHING selected — which is
    // the point. Gets no node and no mutation ctx.
    { id: "history", label: "History", icon: "undo", scope: "panel",
      render: () => <ChangeHistory /> },

    // Node-scoped (the default, and what Design/Settings are). Return it
    // conditionally to make the tab node-specific; it gets the same mutation
    // primitives the built-in panels write through.
    ...(node?.kind === "element"
      ? [{ id: "seo", label: "SEO", render: (n, ctx) => <SeoPanel node={n} ctx={ctx} /> }]
      : []),
  ],
  ```

  While a panel-scoped tab is open the rail hides its node chrome — the identity
  header and the Duplicate/Delete footer — because both describe a selection that
  tab isn't about.

  Merge rules, each warning once when it drops something (a contribution that
  silently never renders is indistinguishable from a builder bug): `design` and
  `settings` are reserved and a host tab claiming one is rejected rather than
  shadowed; duplicate ids keep the first; blank id/label and unknown icons are
  rejected; `order` sorts against the built-ins (Design `0`, Settings `10`, omitted
  lands last). A node-scoped tab that stops applying while open falls back to Design
  instead of blanking the rail.

  When the tabs outgrow the rail, the strip pages with explicit circle buttons that
  take real layout space beside it — no horizontal scrollbar, and no overlay sitting
  on top of the end tabs.

  Same seam, same rules, same names on `EmailBuilderHost`. Covered by four new
  `host-seam` e2e specs.

### Patch Changes

- Updated dependencies [f166e9e]
  - @wizeworks/silicaui@0.43.0
  - @wizeworks/silicaui-html@0.43.0
  - @wizeworks/silicaui-panels@0.43.0

## 0.42.0

### Patch Changes

- @wizeworks/silicaui-panels@0.42.0
- @wizeworks/silicaui@0.42.0
- @wizeworks/silicaui-html@0.42.0

## 0.41.0

### Minor Changes

- 78a7569: A `statusBarSlot` on both builders, and the mode toggle now follows a host's `setActiveTree`.

  **`statusBarSlot`** renders host state in the FOOTER — the status bar — immediately after the
  engine's own mode label and before the spacer, so a host's state and the engine's read left to
  right as one sentence about the session.

  It's the same content `toolbarStatusSlot` takes, one floor down, and usually the better home for
  it. The footer already carries exactly this kind of fact (which surface you're on, which device
  width you're looking at) and nothing else — the engine's own two children are the argument:
  `mode` and `device` are state, so they live down there rather than beside the toggles that set
  them. State read in the footer isn't competing with a bar full of buttons. Use the header slot
  for the one or two things that must be at eye level, this for the rest, or this alone.

  Non-interactive content only, and more strictly than in the header: the strip is 28px tall.
  Unreachable for a host any other way — `<footer>` is engine-owned and takes no children, so the
  alternatives were a second status bar stacked below `<Builder>` (two per screen, one per package)
  or a portal into our markup at a computed index, which breaks silently the first time the
  footer's children change. Same slot, same position, same contract on `EmailBuilder`.

  **The mode follows the tree.** `editor.setActiveTree("frame")` retargeted the whole editing spine
  — canvas, Navigator, Inspector — while the shell's mode toggle kept saying **Page** and the left
  rail kept listing pages, so an author edited the shared header and footer while the editor
  insisted they were on a page body. Two knock-ons came from the same root: the rail showed Pages
  instead of Layouts, and `<Navigator>` (keyed on the mode) wasn't remounted, so it kept the page
  tree's expanded set and a newly-selected frame node could sit inside a collapsed ancestor with no
  visible row. All three are gone: the shell now watches the active tree the same way it already
  watched `enterSymbol`, and moves the mode to match.

  It keys off a CHANGE of tree rather than the (tree, mode) pair, because the pair is legitimately
  mismatched when the MODE moved and the tree didn't — Component mode with no symbol yet leaves the
  spine on the page body on purpose, and a pair test would bounce the author straight back out of
  it. Theme mode is exempt for the same reason `changeMode` leaves the tree alone there: it edits
  tokens, so being in it is not a claim about any tree and there is nothing stale on screen to
  correct.

  **`editor.select(id)` now returns whether it landed** — the sharp edge underneath the above.
  Selection is tree-scoped, so an id from another tree means nothing: a frame node while the spine
  is on a page body, a node in another email template, a node a concurrent editor already deleted.
  Those used to be stored anyway, leaving a selection that resolved to no node — no ring, no
  Navigator row, no Inspector, and shortcuts pointed at nothing. They're now refused, and the
  boolean is what makes "not in the tree you're pointed at" distinguishable from "gone", so a host
  can say _that block isn't there any more_ — or switch trees and try again — instead of guessing at
  a silent no-op. Clearing (`select(undefined)`) always lands. Same contract on the email engine.

  Also: the footer's ink is a real token instead of `text-base-content/55` (and, in email,
  `/40` on the mode label). Faded ink on text a person is meant to read was already wrong, and it's
  squarely wrong now that the strip is where a host's status lives.

### Patch Changes

- 78a7569: Webfont loading follows the active THEME, so a preset's heading font actually changes.

  The editor fetched a Google face from the theme editor's font picker — the click, not the
  result. That covered exactly one of the eight ways a theme arrives. Applying one of the shipped
  presets, a saved theme, pasted theme CSS, a host-supplied theme at mount, crash-recovery restore,
  undo, or a remote editor's op all wrote a perfectly correct `--font-head: "Syne", sans-serif` onto
  the island against a font the page had never requested. The token resolved, the browser fell back
  to the generic, and the component board's Typography specimen showed headings in the body face:
  _the heading font doesn't change when I switch themes._

  The load now hangs off the theme itself — `useThemeWebfonts`, mounted once at the editor root —
  so it watches the result rather than the cause and every route is covered by construction,
  including routes added later. `theme.fonts` is preferred for the family and its exact weights
  (the unambiguous provenance record the picker and the presets both write); the raw token is the
  fallback, which is what makes pasted CSS work with no `fonts` record at all. A stack leading with
  a generic keyword, a `var()`, or a face the shipped system stacks name on purpose resolves to
  nothing to fetch.

  Two silent degradations around it now say so once, on the affordance rather than at each call
  site: a family the theme names that isn't in the catalog (nowhere to fetch it from), and a face
  whose `<link>` fails — offline, a blocked CDN, a CSP without `fonts.googleapis.com`. Both paint a
  fallback and look merely _wrong_ rather than broken, which is worth knowing before a screenshot.

  Pasting theme CSS also stops dropping the `fonts` record for a token the paste changed. Dropping
  it left the theme naming a webfont with nothing for the publish-time self-hosting step
  (`selfHostGoogleFonts`) to act on, so the published page shipped `--font-head: "Fraunces"` with no
  `@font-face` behind it — the preview lying about the output. The record is re-derived from the
  pasted token instead, by the same catalog match the editor uses to preview it. A family we can't
  source records nothing, which is the honest answer.

  Guarded by e2e that asserts the `<link>`, not the token: a token on the island was exactly the
  evidence that made this invisible, and `document.fonts.check` is no better — it reports true for a
  family with no matching `@font-face` at all.

  - @wizeworks/silicaui@0.41.0
  - @wizeworks/silicaui-html@0.41.0
  - @wizeworks/silicaui-panels@0.41.0

## 0.40.0

### Minor Changes

- 24556c0: A `toolbarStatusSlot` on both builders — status chrome, distinct from the action slot.

  `toolbarSlot` renders at ONE fixed position, immediately before Publish (Send test/Export
  HTML, in email). A host with both kinds of header chrome therefore had to put them in one
  place: a presence pill and a saved/unsaved badge landed between the engine's controls on
  their left and the host's own buttons on their right, reading as a gap in a run of controls
  rather than as state.

  `toolbarStatusSlot` renders at the head of the right-hand cluster — after the spacer that
  ends the engine's left-hand controls, before the shortcut hint and the light/dark toggle —
  with no control beside it. `toolbarSlot` is unchanged and stays what it always was: actions,
  grouped with Publish, in a stable order someone can build muscle memory for.

  Two slots rather than one because status and actions want different placement rules, and a
  single slot forces every host to render one of them in the wrong place. It also can't be
  faked host-side: the header is a single flex container, so CSS `order` only sorts against
  the whole set (`-1` lands left of the mode switcher, `1` lands right of Publish) — there is
  no value that reaches mid-container. And a host that got close with `order` would move a
  control visually without moving it in the DOM, so a keyboard user meets the theme toggle
  before something that appears ahead of it (WCAG 2.4.3). A real slot puts status in the right
  place in both orders at once, and because the content is non-interactive it adds no tab stop
  at all. The remaining alternative — portalling into the engine's header DOM at a computed
  index — breaks silently the first time that header's child order changes.

  Same slot on `EmailBuilder`, in the same position for the same reasons.

### Patch Changes

- @wizeworks/silicaui@0.40.0
- @wizeworks/silicaui-html@0.40.0
- @wizeworks/silicaui-panels@0.40.0

## 0.39.0

### Minor Changes

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

### Patch Changes

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

- Updated dependencies [c12bc35]
- Updated dependencies [e252ef2]
  - @wizeworks/silicaui-html@0.39.0
  - @wizeworks/silicaui@0.39.0
  - @wizeworks/silicaui-panels@0.39.0

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

### Patch Changes

- Updated dependencies [e81303c]
  - @wizeworks/silicaui-html@0.38.0
  - @wizeworks/silicaui@0.38.0
  - @wizeworks/silicaui-panels@0.38.0

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

### Patch Changes

- Updated dependencies [90a7652]
  - @wizeworks/silicaui-html@0.37.0
  - @wizeworks/silicaui@0.37.0
  - @wizeworks/silicaui-panels@0.37.0

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

### Patch Changes

- Updated dependencies [5d01dd4]
  - @wizeworks/silicaui-html@0.36.0
  - @wizeworks/silicaui@0.36.0
  - @wizeworks/silicaui-panels@0.36.0

## 0.35.0

### Minor Changes

- 5fb3f74: Email builder: a host can own the saved-block library.

  **Feature.** `<EmailBuilder>` gains `savedBlocks` + `onSavedBlocksChange`, making
  the Insert palette's Saved section a controlled collection. Supply it and the
  library can be account-level and server-backed — following an author across
  devices and sharable between them — instead of the browser-local `localStorage`
  list it has been, which survives a reload but not a device or user change.

  It is a controlled `value`/`onChange` pair rather than a `catalog()`-style read
  plus separate save/rename/delete write hooks. Those would leave the builder
  holding an optimistic shadow list with no defined reconciliation: a
  server-assigned id, a rejected save, or a second author's concurrent edit would
  each drift the palette away from the account with nothing to correct it. With the
  host's persisted list rendered directly, all three reconcile by re-rendering. The
  `change` argument (`save`/`rename`/`delete`) carries the author's intent, so a
  host persists one row instead of diffing two arrays.

  Two shapes fall out of the same pair: `savedBlocks` with no `onSavedBlocksChange`
  is an insert-only curated library (Save/rename/delete are hidden, not inert), and
  an empty `savedBlocks` array is a real empty account library — presence of the
  prop, not its contents, transfers ownership.

  `readLocalSavedBlocks()` / `clearLocalSavedBlocks()` are the one-time migration
  seam, so blocks an author saved before the host took over aren't orphaned.

  Fully backward compatible: omit both props and behavior is unchanged. Also fixes
  a latent SSR warning — the store's server snapshot returned a fresh `[]` per
  call, breaking `useSyncExternalStore`'s cached-snapshot invariant.

### Patch Changes

- 1181848: Email inspector: color swatches key by role, not hex — no duplicate-key warning.

  **Fix.** `SwatchGroup` rendered its 13 palette swatches with `key={o.hex}`, which
  assumes every theme role resolves to a distinct color. Real themes routinely
  collide — a dark neutral doubling as base content (`neutral` and `baseContent`
  both `#0f172a` is the common case) — so React logged "Encountered two children
  with the same key" and could drop or duplicate a swatch. The role name is the
  stable identity of a swatch and is already carried on every option, so it is now
  the key. Order and behavior are unchanged; the colliding roles still render as
  two separate (identically colored) swatches, each picking its own role.

  - @wizeworks/silicaui@0.35.0
  - @wizeworks/silicaui-html@0.35.0
  - @wizeworks/silicaui-panels@0.35.0

## 0.34.2

### Patch Changes

- 63f7674: Email canvas: a frame region no longer renders body-editor chrome, and marks itself as host-managed.

  **Fix.** `EmailFrame` regions promised "full fidelity but inert", but several block
  renderers still drew authoring marks inside them — most visibly the raw-HTML
  block's "Custom HTML" label and dashed box, which painted a fully-composed host
  legal footer as an unfilled developer placeholder. The rule is now general
  rather than per-kind: nothing in `frame.header` / `frame.footer` wears chrome
  that belongs to the editor. Also suppressed there: the empty-container "insert
  something" prompt and its tinted drop well, the image placeholder gradient, the
  spacer's visibility band, and the empty-text placeholder. Content-legitimate
  marks are untouched (a Video block still shows its play overlay — the projector
  emits one), and an author's own HTML block keeps its label as before.

  **UX.** The region now marks itself positively and persistently: a hairline
  dashed boundary plus a locked tag carrying `frame.label`, pinned to the composed
  email's outer edge (top for the header, bottom for the footer). Previously the
  tag appeared only on hover. The region is still not dimmed — fading it would
  read as "unfinished" rather than "real, and not yours to edit here".

  - @wizeworks/silicaui@0.34.2
  - @wizeworks/silicaui-html@0.34.2
  - @wizeworks/silicaui-panels@0.34.2

## 0.34.1

### Patch Changes

- 521eb99: builder/email: move Subject + preview text out of the toolbar, and align the header with the site builder

  Subject and preview text had two homes: plain `Input`s in the email toolbar, and
  `TokenTextField`s on the document root's Settings tab. The toolbar pair was the
  worse of the two — no merge-token autocomplete, so `{{customer.firstName}}` in a
  subject line meant going to the Inspector anyway — and it consumed roughly 300px
  of a header that also has to fit the host's own `toolbarSlot`. The duplicates are
  gone; the Inspector fields (Email → Settings → Content) are unchanged and remain
  the way to set both.

  The header's left cluster now runs in the same order as the site builder's —
  mode switcher (carrying `toggle-group-primary`, as the one control that changes
  what everything else means), then undo/redo, then canvas width — rather than the
  reverse.

  Also gives the template rename input an `aria-label`; it had no accessible name.

  - @wizeworks/silicaui@0.34.1
  - @wizeworks/silicaui-html@0.34.1
  - @wizeworks/silicaui-panels@0.34.1

## 0.34.0

### Minor Changes

- fa4333f: Email: a host `frame` (fixed chrome around the body) and two-tier node locking

  Two ways a host keeps part of an email out of an author's hands. Both additive —
  an `EmailBuilder` that passes neither behaves exactly as before, and a document
  that sets neither projects byte-for-byte the markup it did.

  **`<EmailBuilder frame>`.** A platform that brands every tenant's mail composes a
  brand bar and a legal footer at send, outside the editable body, for two reasons:
  an author must not be able to delete the compliance footer, and the chrome must
  reflect the tenant's _current_ brand rather than whatever was current when the
  email was drafted. Baking those sections into the persisted document breaks both
  guarantees — a node in the document is a node an author can remove, and a color
  in the document is a color frozen at authoring time. So the frame lives outside
  the document entirely:

  ```tsx
  <EmailBuilder
    project={project}
    frame={{ header: [brandBar], footer: [legal] }}
  />
  ```

  `header`/`footer` are ordinary `SectionNode[]`. On the canvas they render inside
  the body wrapper at full fidelity but inert — no `data-sui-id`, no selection, no
  drag, no inline edit, and drops over them are refused rather than falling through
  — with a dashed ring and an owner chip on hover. They are never persisted, never
  in `onChange`, never on the undo stack; the engine is not told they exist.

  Preview, Export HTML, and Send test all project through the frame, so the framed
  view stops being one button. `toEmailHtml(doc, { resolver, frame })` and the
  exported `composeEmailDocument(doc, frame)` are the same composition the canvas
  uses, so a host's send path and the builder's preview can't drift — the frame
  extension of the guarantee the resolver seam already gave bound content.
  Composition runs _before_ resolution, so frame sections get the same data
  bindings and `{{merge}}` tokens the body does.

  **`EmailNode.locked?: "host" | "author"`.** For content that genuinely belongs to
  the saved document but must not be deleted or moved — the same two-tier flag the
  site schema carries, reused rather than reinvented. A locked node refuses
  `remove`/`removeColumn`/Delete and refuses `move`, including a sibling swap from
  either side (a swap moves both nodes; a legal footer dragged to the top is as
  broken as a deleted one). It stays _editable_: the lock is structural, not
  editorial, so fixing a typo in a pinned footer still works. Duplicating one
  produces an **unlocked** copy — otherwise duplicating a pinned block would mint a
  second undeletable one.

  A `"host"` lock is shown and explained in the Inspector but offers the author no
  unlock; an `"author"` lock is theirs to toggle. `setLocked` itself is unguarded,
  so a host is never boxed out of releasing its own lock. The Navigator marks both
  (padlock / shield). `node.setLocked` is a first-class op that relays and applies
  remotely; a _remote_ remove/move is not re-adjudicated against the lock, matching
  the site engine — refusing there would leave two clients permanently disagreeing
  about what the document contains.

  `locked` is authoring metadata: `toEmailHtml` never reads it, so it cannot reach
  sent markup.

  New probes `verify:email-frame` / `verify:email-lock` and an `email-frame` e2e
  spec cover both; full docs in `docs/email-frame-and-locking.md`. The MCP
  catalog's `silicaui-builder` entry now names the email host seam, the frame, and
  node locking, so an assistant querying `list_packages` learns they exist.

### Patch Changes

- @wizeworks/silicaui@0.34.0
- @wizeworks/silicaui-html@0.34.0
- @wizeworks/silicaui-panels@0.34.0

## 0.33.0

### Minor Changes

- 7056d3f: Email: head injection, section cards, outline buttons, tinted auto-colors, section align, link color

  Six gaps in the email vocabulary, each of which forced a workaround in real
  template work. All are additive — a document that sets none of these projects
  byte-for-byte the markup it did before.

  **`<head>` injection.** `toEmailHtml` emitted a fixed `<head>` no caller could
  reach, which put webfonts and any client-hack CSS out of reach entirely. The
  second argument now also accepts `{ resolver, head }` (the bare positional
  resolver still works and is not deprecated), where `head` carries `css`, `meta`,
  and `raw`, all emitted last so a caller can override what we generate.

  The two things nearly every sender wanted from that hook are **not** in it,
  deliberately — they're schema, so they travel with the document and are editable
  in the Inspector rather than living as strings at a render call site:

  - `EmailBody.webFonts` — `@font-face` declarations, with the families prepended
    to the body font stack and `EmailBody.fontFamily` kept as the fallback. Emitted
    inside `@media screen` so Outlook's Word engine can't half-see a font it can't
    load and drop the whole email to Times New Roman. Reach is Apple Mail, iOS
    Mail, Outlook for Mac, and Samsung Mail; everywhere else falls back. Link a
    hosted file rather than embedding one — Gmail clips messages over ~102KB, and
    a data-URI font blows through that alone.
  - `EmailBody.colorScheme` — emits the `color-scheme` /
    `supported-color-schemes` meta pair and the matching `:root` rule. Apple Mail
    and Outlook for Mac honour it; Gmail and Outlook.com invert on their own terms
    regardless, so dark mode is progressive enhancement, not a design to rely on.

  **Section box decoration.** `SectionNode` gains `radius`, `borderColor` /
  `borderWidth`, and `marginX` / `marginY`. Setting any of them promotes the
  section from a bare `<tr><td>` to a nested-table card: the outer cell carries the
  margin as padding (a `<td>` can't take real margin in Outlook) and the inner
  table owns fill, border, and radius. Replaces hand-balancing a rounded `<div>`
  across an open/close pair of raw `html` nodes. Corners are square in Outlook
  desktop — the normal degradation for rounded email cards.

  **Per-node auto-color roles.** Auto-tracked colors were pinned to one role per
  node KIND, so anything but the blessed role had to be frozen to a literal hex —
  which is why a tinted card or footer stopped following the tenant's theme. Each
  auto field now takes a per-node role override (`bgRole`, `colorRole`,
  `borderColorRole`, …) spanning all of `EmailColorDefaults`, so a `base200` card
  and a `primary` hero band both keep tracking the palette. In the Inspector,
  picking a theme swatch now **tracks that role**; only the custom picker freezes a
  hex. An unknown role falls back to the kind default rather than repainting to
  `undefined`.

  **Button outline variant.** `ButtonNode.variant` plus `borderColor` /
  `borderWidth`. An outline button drops the `bgcolor` attribute entirely (there is
  no transparent `bgcolor` value) and paints `background:transparent`, so the
  section behind shows through in every client including Outlook. Switching
  variants repoints the label color between `primaryContent` and `primary` while
  it's still theme-tracked, since white ink on a transparent button is invisible; a
  hand-picked label color is never overwritten. Adds an "Outline button" palette
  entry, so a secondary action no longer has to be demoted to a text link.

  **`SectionNode.align`.** The projector hardcoded `align="center"` on every
  section `<td>`, imposing a layout decision the schema couldn't express. Now
  authorable, defaulting to `center`.

  **Inline link color.** `TextNode.linkColor` (theme-trackable) paints `<a>`
  elements, which otherwise take the client's default hyperlink blue that no
  `<style>` rule reliably overrides. There is no link node — a link is inline
  inside copy and the schema has no inline level — so the projector rewrites anchor
  tags in `TextNode.html`, the one place it reads markup, and only because that
  field is a constrained inline-safe subset. An existing `style` is merged with the
  color prepended, so a hand-written `color:` still wins. `HtmlNode` is never
  touched.

  Canvas mirrors all of it — including loading declared webfonts and reusing the
  projector's own anchor rewrite — so the editor can't show something different
  from what sends. Covered by 64 new `probe-email.ts` checks and a new
  `email-surface-and-typography` e2e spec.

### Patch Changes

- @wizeworks/silicaui@0.33.0
- @wizeworks/silicaui-html@0.33.0
- @wizeworks/silicaui-panels@0.33.0

## 0.32.1

### Patch Changes

- 61fb568: Theme Component board: fix the Typography specimen's inverted, compressed ramp

  The board's Typography card carried hardcoded `text-*` utilities on its type
  components — `text-xl` on the `<h1>` and `text-3xl` on the `<Display>`. Those
  magic sizes overrode each component's designed step, so "Heading one" rendered at
  20px (**below** the 24px "Heading three"), the display barely cleared the
  headings, and the broken hierarchy made a picked heading font look like it wasn't
  applying at all — even though it was.

  Removed the overrides so every step carries its real ramp size, weight, and
  tracking (and the theme's `--font-head`), and set the display to `size={1}` so it
  reads as the head of the ramp in the narrow, container-queried card. The specimen
  now descends cleanly (display › h1 › h3 › body) and truthfully reflects the
  theme's type + heading font. Added an e2e regression asserting both the rendered
  heading font and the descending order — the prior test only checked the token
  landed in the island's `style`, never that anything rendered with it.

  - @wizeworks/silicaui@0.32.1
  - @wizeworks/silicaui-html@0.32.1
  - @wizeworks/silicaui-panels@0.32.1

## 0.32.0

### Patch Changes

- @wizeworks/silicaui-panels@0.32.0
- @wizeworks/silicaui@0.32.0
- @wizeworks/silicaui-html@0.32.0

## 0.31.0

### Minor Changes

- bb098bc: Type scale to `text-10xl`, a fluid display ramp, and a consumable canvas vocabulary

  - **Type scale reaches `text-10xl`** and is now declared in one place (`@wizeworks/silicaui/type-scale`), consumed by the plugin and the MCP catalog generator so the documented ladder can't drift. `text-8xl`/`9xl` are now owned explicitly (previously present only via Tailwind's defaults).
  - **`display-1` / `display-2` / `display-3`** — an oversized hero ramp above the headings — and they are **fluid** (`clamp()` + container units), so they scale with their container instead of overflowing narrow screens. React: `<Display visualLevel={1|2|3}>` and `<Heading visualLevel="display-1">`. Bare `.display` equals `.display-3`.
  - **`@wizeworks/silicaui-builder/vocab`** exposes the canvas's utility-class vocabulary as consumable data — `CANVAS_UTILITY_CLASSES` (flat safelist), `CANVAS_VOCAB_GROUPS`, and `CONTAINER_BREAKPOINTS` — so a consumer's Tailwind safelist can be generated from silicaui's source of truth instead of hand-copied. The Inspector imports the same source, so the two can't drift.
  - The Inspector now **surfaces classes with no backing CSS** on the raw class field (and via a deduped console warning) instead of rendering them silently as no-ops.
  - The **MCP catalog now documents the type scale**: `tokens.json` gains `typography.scale` (every step with px), and `classes.json` gains a `type-scale` group (`text-xs` … `text-10xl`).

### Patch Changes

- Updated dependencies [bb098bc]
  - @wizeworks/silicaui@0.31.0
  - @wizeworks/silicaui-panels@0.31.0
  - @wizeworks/silicaui-html@0.31.0

## 0.30.0

### Patch Changes

- a90b819: Convergence pass on the sources of API drift, rather than on its symptoms.

  **One name for a component's own value callback: `onValueChange`.** The library
  already used it 22 times against 4 uses of `onChange`, but the authoring guide
  mandated `onChange` — so every new component was being written to the 15%
  pattern and the split was widening on its own. The guide is corrected, and the
  four outliers (`Rating`, `Pagination`, `Carousel`, `ThemeController`) now expose
  `onValueChange`. **`onChange` still works everywhere it did before**, marked
  `@deprecated`, so nothing breaks. The rule it encodes: `onChange` belongs to the
  native DOM handler on components that wrap a real form element — declaring your
  own shadows it, which is why each of those four carried an
  `Omit<…, "onChange">` in its props type paying for the collision.

  **`ThemeController` no longer causes a hydration mismatch.** Its `useState`
  initializer read `localStorage` and the DOM, so the server resolved one theme
  and the client another — and because that value picks the Sun vs Moon icon, the
  mismatch was guaranteed and visible. It now initializes to a value the server
  can also compute and adopts the stored theme in an effect after mount, matching
  `useTheme` and `useMediaQuery`.

  **`Carousel` no longer notifies spuriously.** The change callback fired once on
  mount (reporting a change that never happened) and re-fired on every render
  when given an inline arrow — which turns a `setState` in the handler into a
  render loop. It now fires only on real index changes.

  **`TreeView` re-flattened its entire tree on every render** in controlled mode:
  the expanded `Set` was rebuilt inline each render, so the `useMemo` depending on
  it never hit.

  **`useControllableState` is real now.** It documented itself as "the pattern
  every Silica component uses internally" while having zero component imports.
  `Rating` now uses it as the reference implementation, and the doc says plainly
  that adoption is partial and ongoing instead of claiming otherwise.

  ### Tooling

  The repo had **no ESLint config at all**. There is now a correctness-only flat
  config — no stylistic rules, and none are wanted.

  Notably, `eslint-plugin-ssr-friendly` turned out **not** to catch the SSR bug
  class it was added for: it skips nested function expressions, which is exactly
  the shape of a lazy `useState` initializer, so both hydration bugs this repo
  actually shipped were invisible to it. A local
  `silica/no-dom-in-state-initializer` rule covers the real shapes — lazy
  initializers, and helpers referenced by name — and reports the read even when
  it's `typeof`-guarded, since a guard prevents the crash but not the mismatch.
  Its RuleTester cases are the two shipped bugs verbatim, and run as part of
  `pnpm lint`.

- Updated dependencies [26b341e]
- Updated dependencies [90de1e2]
- Updated dependencies [6e1edd6]
- Updated dependencies [fa40d33]
- Updated dependencies [f9fd0a6]
- Updated dependencies [a90b819]
- Updated dependencies [a90b819]
- Updated dependencies [a90b819]
- Updated dependencies [a90b819]
  - @wizeworks/silicaui-html@0.30.0
  - @wizeworks/silicaui@0.30.0
  - @wizeworks/silicaui-panels@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [8e7bd27]
  - @wizeworks/silicaui@0.29.0
  - @wizeworks/silicaui-html@0.29.0
  - @wizeworks/silicaui-panels@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [273c7f8]
  - @wizeworks/silicaui@0.28.0
  - @wizeworks/silicaui-html@0.28.0
  - @wizeworks/silicaui-panels@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4d96f1c]
- Updated dependencies [4d96f1c]
  - @wizeworks/silicaui-html@0.27.0
  - @wizeworks/silicaui@0.27.0
  - @wizeworks/silicaui-panels@0.27.0

## 0.26.0

### Minor Changes

- 208df11: `Builder` accepts a `dataToggle` prop to hide the canvas data on/off toggle. It defaults to `true`, so nothing changes for an existing host.

  The toggle exists for the case where a host's resolver is wrong, slow, or absent and an author needs to see the authored placeholder. That's a debugging affordance. On a site whose authors are non-technical — or one whose trees carry no bindings at all — the control's effect is invisible, so it reads as a dead button to everyone who isn't debugging a resolver. `dataToggle={false}` lets such a host drop it without giving up `resolveData`.

### Patch Changes

- @wizeworks/silicaui@0.26.0
- @wizeworks/silicaui-html@0.26.0
- @wizeworks/silicaui-panels@0.26.0

## 0.25.1

### Patch Changes

- @wizeworks/silicaui-panels@0.25.1
- @wizeworks/silicaui@0.25.1
- @wizeworks/silicaui-html@0.25.1

## 0.25.0

### Minor Changes

- b910fbb: Container layout controls in the Inspector — the parent side of flex/grid, per-axis padding, and flex-child sizing. The Design tab could style a node but not **arrange its children**: a Row block inserted from the palette came in wearing `flex`, and there was no UI to change its justification, gap, direction, or wrap once it was on the canvas.

  - **Display gates the arrangement rows** — `justify-*` / `items-*` / `gap-*` / `flex-*` are inert on a plain block, so those rows only appear once the node is a flex or grid container. Display reads back out of the class set, so a node that already wears `flex` opens with the rows already expanded. Switching display **drops the classes the new display can't honor** (a `flex-col` left behind on a grid, a `grid-cols-3` left on a flex row), so the class set never carries inert leftovers.

  - **Per-axis padding expands the shorthand instead of dropping it** — `p-4` covers both axes, so editing one axis has to leave the other standing. Picking a new Padding X on a `p-8` node now rewrites it as `px-2 py-8` rather than silently zeroing the vertical padding. The opposite axis is looked up **by index** across three deliberately index-aligned scales, which is what keeps every emitted class a literal string — a composed `py-${n}` is invisible to the `@source` safelist scan. The scale also now reaches `p-10`/`p-12`/`p-16`, which the palette already bakes onto sections.

  - **Self size** — `flex-1` / `grow` / `flex-none` for a flex child, the main-axis counterpart to the existing cross-axis Self align. Like `self-*` it's offered unconditionally, since the governing parent isn't visible from the Inspector. `flex-auto` is deliberately absent: its natural label would be "Auto", which already means "clear this group" on every ChipGroup.

  Covered by `e2e/container-layout.spec.ts`, which asserts **computed style** rather than `class` — canvas HTML is generated at runtime, so Tailwind never sees it, and only a painted `justify-content: space-evenly` proves the utility survived the safelist scan.

### Patch Changes

- @wizeworks/silicaui@0.25.0
- @wizeworks/silicaui-html@0.25.0
- @wizeworks/silicaui-panels@0.25.0

## 0.24.0

### Minor Changes

- 065d97b: Data-resolution honesty + a logo-capable brand mark + canvas binding resolution — three orthogonal fixes closing the gap between what the data layer promised and what it did. Design authority: `docs/data-resolution-and-brand-mark.md`.

  - **Resolution honesty (`@wizeworks/silicaui-html`)** — `ResolveHost`'s hooks now return `Resolved | undefined` (and `readonly unknown[] | undefined`), where a bare `undefined` means **"I don't know this ref"** and `{ value: undefined }` keeps its old meaning, **"I know it and it's empty"**. Those were previously the same value, so the walk _couldn't_ tell them apart and blanked the node either way. An unknown ref now **keeps the node's authored content** (marker included, so a re-resolve or a downstream runtime still sees the bind), never drops it, and reports a structured `ResolveDiagnostic` via the new optional `ResolveHost.onDiagnostic`. `omitWhenEmpty` deliberately does **not** apply to an unknown ref — "legitimately empty, render nothing" is a claim only a host that knows the ref can make. The core stays pure: no `console`, no `NODE_ENV` sniffing — loudness is the consumer's call. Widening the return type is source-compatible: an existing host's narrower return still typechecks and behaves exactly as before.

  - **Canvas resolution (`@wizeworks/silicaui-builder`)** — the canvas resolves bindings through the same `resolveTree` primitive `toHtml` uses, via a new `ResolveOptions.editing`. `editing` is a **destruction policy, not a second resolver**: same walker, same hooks, same refs, diverging only where production's answer is "show nothing" — which an editor can't render, because a dropped node can't be selected, inspected, or un-bound. So `visible:false` (and `omitWhenEmpty` at zero items) render **ghosted** and report `code: "hidden"`; unknown refs render their authored content wearing a warning outline plus a `data-sui-unresolved` hook. A **Data on/off toggle** (default on, shown only when the host resolves anything) flips back to the authored placeholder — which is what ships when data is absent, so it must stay visible and editable. Text showing **resolved** data is no longer `contentEditable` (committing it would overwrite the authored placeholder with host data); an unknown ref still shows authored text, so it stays editable. v1 resolves `value`/`html` binds only — a collection keeps its authored template unexpanded _and unresolved_, because cloning children clones their ids (which selection and React keys depend on), and resolving a nested field with no item in scope would blank the very placeholder being laid out.

  - **Brand mark (`@wizeworks/silicaui`, `@wizeworks/silicaui-react`, `@wizeworks/silicaui-html`)** — `Wordmark` can hold a logo. It was a text-only atom while its own CSS and React wrapper both already assumed a mark, so "put the logo in the wordmark" was impossible by construction. It's now a container with `src`/`alt`/`href` props (nesting an `Image`/`Icon` child remains the richer path and wins when present; `href` lowers the mark to an `<a>`, same sugar as `Button`). `alt` defaults to `""` — decorative, since the name renders beside it. The CSS mark rule generalizes from `& svg { width: 1.15em }` to `& :is(svg, img)` height-locked with **width auto**, so a non-square logo is no longer squashed to a square (square marks are unaffected). **Text-only Wordmark markup is byte-identical to before.**

  - **`ComponentDef.primary` (`@wizeworks/silicaui-html`)** — a component now declares which prop a bare `value` bind fills. This replaces `resolve.ts`'s hardcoded `Image`/`Avatar` name-list and its `"src" in props` sniff outright: the name-list meant every new bindable component needed a resolver edit, and the sniff was about to write a bound site **name** into a Wordmark's **logo URL**. `Image`/`Avatar` declare `primary: "src"`; `Wordmark` declares `primary: "text"`. Absent a declaration the old `label` → `text` fallback applies. Same coupling `ComponentDef.container` was introduced to kill.

  - **Host adapters extend, never re-declare** — `BuilderHost` and `EmailBuilderHost` both carried duplicate copies of the resolver hooks, so the widened signature didn't propagate and both Inspectors read `.value` off a possibly-`undefined` with the compiler silent. They now `extends ResolveHost` / `EmailResolveHost`. The builder's React entry also exports the `Editor` type (what `useEditor()` returns — a host couldn't name it), and `Canvas.isEmptyContainer` now asks a component's **expansion** rather than its authored children, so a prop-populated container is no longer painted over with an "empty — drop something here" placeholder.

### Patch Changes

- Updated dependencies [065d97b]
  - @wizeworks/silicaui-html@0.24.0
  - @wizeworks/silicaui@0.24.0
  - @wizeworks/silicaui-panels@0.24.0

## 0.23.0

### Minor Changes

- ef57d85: Host-extensible New-component starter picker — a host can now contribute its own base composites (e.g. a product card) as starters authors begin an editable component from.

  - `componentStarterGroups(opts?)` accepts `{ catalogExtend?, starters? }`. A host's `catalog().extend` groups **auto-surface** as starter groups with their `key` + `label` preserved verbatim (a "Commerce" Insert group becomes a "Commerce" starter group — no second declaration).
  - New optional `BuilderHost.componentStarters?(): { extend?, hide? }` curates on top: `extend` merges by group key, `hide` prunes item **or** whole group keys (defaults included, applied last so it wins).
  - Boundary preserved by construction: only `catalog().extend` (editable node-trees) auto-surfaces — `hostComponents()` (locked/opaque `HostNode`s, prop-config only) never becomes a starter. "Exposed for editing" is the schema-block/starter path, not the host-node path.
  - `NewComponentButton` reads the host adapter via `useHost()`; `componentStarterGroups` and the `StarterGroup` / `StarterContribution` / `StarterOptions` types are exported from the builder's React entry.

### Patch Changes

- @wizeworks/silicaui@0.23.0
- @wizeworks/silicaui-html@0.23.0
- @wizeworks/silicaui-panels@0.23.0

## 0.22.0

### Minor Changes

- 79822a8: Host nodes (live code-component embeds) + two-tier node locking — two orthogonal, universal primitives so an authored page can carry a live, host-owned functional region (checkout, search, cart, a data grid) pinned in place. Design authority: `docs/host-nodes-and-node-locking.md`.

  - **Node locking** — new `NodeBase.locked?: "host" | "author"` (presence encodes locked; the value encodes the owner). The editing spine refuses `remove`/`move`/reparent on any locked node, `duplicate` yields an unlocked copy, and a new tier-blind `setLocked(id, owner)` primitive is undoable. The Inspector's Settings tab gains a Lock row (an author toggle, or a read-only "Locked by host" indicator with no unlock — only the host clears a host lock); the Navigator shows an owner-aware lock/shield glyph. Generalizes the outlet/root protection; no projection reads `locked`.

  - **Host nodes** — new `HostNode { kind: "host"; component; props }` in the node union (+ a `host()` kit helper). `toHtml` projects an **empty** `<div data-sui-host="…" data-sui-host-props="…">` mount point — never live framework code, preserving the framework-neutral projection promise — into which a host mounts its real component (client or SSR), the same trust model as behavior-marker hydration and `rawHtml`. Every traversal (`stampTree`/`walk`/`flattenSymbols`/`resolveTree`) passes a host node through untouched.

  - **`@wizeworks/silicaui-behaviors`** — new optional `mountHostNodes(registry, root?)` helper, the client-side companion to the mount points (symmetric with `hydrate()`); host components stay host-owned.

  - **Builder** — `BuilderHost` gains `hostComponents()` (Insert-palette entries, `pinned` inserts host-locked) and `renderHostNode()` (live canvas preview, with a labeled placeholder fallback), plus `HostComponentDef`/`HostPropDef`/`HostRenderCtx`. The engine treats a host node as a selectable **leaf** — drop-_beside_, never drop-_into_ — and `setProp` writes host props. The Inspector renders a Host panel from the component's declared props.

### Patch Changes

- Updated dependencies [79822a8]
  - @wizeworks/silicaui-html@0.22.0
  - @wizeworks/silicaui@0.22.0
  - @wizeworks/silicaui-panels@0.22.0

## 0.21.0

### Minor Changes

- 9e0027d: Media, icons, and rich-text/embed support for the framework-neutral renderer.

  - **Video / audio**: `<video>` and `<audio>` now render through `toHtml` (added to the raw-element floor with their full attribute set — `poster`, `controls`, `autoplay`, `muted`, `loop`, `playsinline`, `preload`, sizing, `crossorigin`; `<source>` kept). New first-class **Video** component (palette + Inspector). Previously both coerced to `<div>`.
  - **Icons on static pages**: `toHtml` now inlines an SVG glyph for `Icon` (`data-icon`) spans via a new `icons` resolver that **defaults to a bundled Lucide set**, so a published page is self-contained (no icon runtime/font). Pass a custom `Record<name, markup>` / function to override, or `icons: false` for the bare span. Core stays icon-agnostic; the builder canvas uses the same resolver (preview == production). Exported: `LUCIDE_ICONS`, `iconSvg`, `IconResolver`.
  - **Data-bound trusted HTML**: new `DataBinding` kind `{ kind: "html"; ref }` and **RichText** component for CMS long-form / rich text. `resolveTree` fills a render-time `rawHtml` that `toHtml` emits unescaped — the host sanitizes the value at its data boundary (same trust model as `dangerouslySetInnerHTML`). Unresolved binds lower to an inert `data-sui-html` marker.
  - **Embed**: new curated **Embed** component (YouTube / Vimeo / Google Maps) that emits a sandboxed `<iframe>` to an allowlisted host only, normalizing share URLs to their embed form; unknown hosts fall back to a link. `<iframe>` is still not in the raw-element floor — arbitrary authored iframes continue to downgrade to `<div>`.
  - **Broader inline-SVG allowlist**: pasted logos/illustrations survive — added `defs`, `use`, `symbol`, `title`, `desc`, `ellipse`, `text`, `tspan`, `clipPath`, `mask`, `pattern`, `linearGradient`, `radialGradient`, `stop`, `image`, plus a shared presentation-attribute set. Security is unchanged: `script`/`style`/`foreignObject` still downgrade, `on*` fails closed, inline `style` is stripped, and `use`/gradient/pattern `href` is restricted to internal fragment references.

### Patch Changes

- Updated dependencies [9e0027d]
  - @wizeworks/silicaui-html@0.21.0
  - @wizeworks/silicaui@0.21.0
  - @wizeworks/silicaui-panels@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [d0a6ca6]
  - @wizeworks/silicaui@0.20.0
  - @wizeworks/silicaui-panels@0.20.0
  - @wizeworks/silicaui-html@0.20.0

## 0.19.0

### Patch Changes

- d0d7cc6: `SCALAR_TOKENS` (the theme's non-color knobs — radius/border/size/depth/noise/focus-width/disabled-opacity) now carries a `doc` string per entry describing what it actually affects, surfaced through the MCP's `get_tokens` and documented in `docs/silicaui-architecture.md` §5.1. Also fixes a stale ThemeEditor tooltip ("3D depth on fields & selectors") that no longer matched what `--depth` controls (Card/Button shadow), and regenerates the MCP catalog to pick up previously-uncataloged package versions and the Combobox `popupProps` prop.
- Updated dependencies [d0d7cc6]
- Updated dependencies [3893c74]
  - @wizeworks/silicaui-html@0.19.0
  - @wizeworks/silicaui@0.19.0
  - @wizeworks/silicaui-panels@0.19.0

## 0.18.0

### Minor Changes

- 66ee29f: A `collection` data bind can now opt out of the "zero items renders the authored children once, as a placeholder" convention: `DataBinding`'s collection variant gains an optional `omitWhenEmpty` flag, and both the site and email resolvers honor it identically — a collection resolving to zero items with `omitWhenEmpty: true` drops the node (and its subtree) entirely, the same way a `value` bind's `visible: false` does, instead of rendering the placeholder row. Both Inspectors' Data binding section gain a matching "Omit when empty" toggle on a collection bind.
- 66ee29f: `EmailBuilder` gains a `toolbarSlot` prop, mirroring the site `Builder`'s: arbitrary host UI (a save-status badge, a template lifecycle strip) renders in the header immediately before the Send test/Export HTML buttons, instead of a host having to render its own chrome outside the builder entirely.

### Patch Changes

- Updated dependencies [66ee29f]
  - @wizeworks/silicaui-html@0.18.0
  - @wizeworks/silicaui@0.18.0
  - @wizeworks/silicaui-panels@0.18.0

## 0.17.0

### Minor Changes

- aadc8f6: Mirrors the site engine's dynamic-content marker (`DataBinding`/`setData`/`ancestorsOf`) and host-catalog merge pattern into the email builder: Text/Button/Section/collection-repeat nodes can now carry a `DataBinding`, wired into the Inspector's new Data binding section, and `toEmailHtml` accepts an optional resolver so preview and static export share one resolving code path instead of drifting.
- aadc8f6: The email builder's `TextNode.html`, `ButtonNode.label`, `subject`, and `preheader` now resolve inline `{{ref}}` merge tokens against the host's `resolveBinding`, independent of any whole-field `data` bind on the same node — a sentence like "Hi {{customer.firstName}}, your order shipped" has no single field to bind wholesale, so each token resolves on its own. Typing `{{` in the Canvas's rich-text editor or the Inspector's Subject/Preview text/Button label fields now opens a filterable autocomplete sourced from the host's `dataSources()`. Tokens inside a `data-scope="collection"` repeat resolve per item, and `HtmlNode.html` is never token-substituted (raw passthrough stays raw).

### Patch Changes

- @wizeworks/silicaui@0.17.0
- @wizeworks/silicaui-html@0.17.0
- @wizeworks/silicaui-panels@0.17.0

## 0.16.0

### Minor Changes

- 8b540c0: Both builder shells' left/right rails (site `Builder` and `EmailBuilder`) are now resizable via `@wizeworks/silicaui-panels`, with widths persisted locally per-browser (`autoSaveId`) independent of the document itself — useful once a tree gets deep enough that the fixed 264px/320px rails felt cramped. The `IconItem`/`PanelHead` chrome primitives shared by both builders were also consolidated into one `shared/react/chrome.tsx` so a tweak to one applies to both instead of silently drifting apart.
- 8b540c0: `EmailBuilder`'s `theme` prop is now live, not read-once-at-mount: every Text/Button/Divider/Section/Body color that's still on its brand default repaints when the host hands down an updated `Theme` (e.g. a theme edited in the site builder elsewhere), so an open email stays on-brand instead of drifting. A field freezes the moment a user picks its own color, so a live theme update never clobbers a deliberate choice. Also moves the email's Subject and Preview text fields into the toolbar (previously buried in a truncated label) and swaps the header/footer branding for a `silicaui.com` link, matching the site builder's chrome.
- 8b540c0: Add Google Fonts theming to the site builder. `ThemeEditor`'s body and heading typeface controls are now a searchable picker over ~1900 Google Fonts (previously a 4-option body toggle and a 2-option "Match body"/"Serif" heading toggle) — selecting a font live-loads it in the canvas for preview and records the exact family/weights on the new optional `Theme.fonts` field, so a host can self-host the real files at publish time instead of hotlinking Google's CDN (a real EU privacy liability for published sites).

  New package `@wizeworks/silicaui-fonts` provides `selfHostGoogleFonts()` — a Node-only, publish-time utility a host's backend calls to fetch and self-host the actual font files, given `theme.fonts` from `PublishPayload`.

  Also adds `Combobox`'s `popupProps` (mirroring `Select`) so a portaled Combobox popup can re-stamp `[data-theme]` when opened from inside a scoped theme island.

- 8b540c0: The Theme editor's "CSS" button now opens a modal instead of just copying to the clipboard: the theme's CSS custom properties are shown editable in place, with Copy, Reset, and a new Apply that parses pasted CSS back into the theme. Apply only accepts exactly what the theme's own CSS export produces (one `[data-theme]` block, optionally a dark `@media` block) — anything else (an extra selector, `url()`, a comment) is rejected with an inline error and never touches the live theme. Theme names are also now sanitized to a safe charset as you type.
- 8b540c0: The Theme editor's "This site" saved-theme library is now real, host-persistable site data instead of an in-memory-only convenience. `Site` gains an optional `savedThemes` field; saving/deleting a named theme now flows through `Builder`'s `onChange` and local crash-recovery same as any other edit, so a theme an author starts (e.g. a "Christmas" theme built months ahead) survives a reload and round-trips through a host's own persistence — same as the rest of the site. The shipped `THEME_PRESETS` starting points are unaffected.

### Patch Changes

- 8b540c0: The Navigator tree's root row now reads "Site root" in Layout mode instead of its bare tag name (e.g. "div") — the frame root has no useful ancestor context to hint at what it is, unlike a page root which already carries an explicit "Page" label.
- Updated dependencies [8b540c0]
- Updated dependencies [8b540c0]
  - @wizeworks/silicaui-html@0.16.0
  - @wizeworks/silicaui-panels@0.16.0
  - @wizeworks/silicaui@0.16.0

## 0.15.0

### Minor Changes

- de20e1b: Add `<Builder onActivePageChange>` — fires on mount and whenever the active page's identity (switch, rename, slug edit) changes, with `{id, name, slug}`. Lets a host key its own page-scoped UI (e.g. an SEO/metadata drawer rendered via `toolbarSlot`) to whichever page the author has open, without adding any domain fields to the `Page` schema itself.

### Patch Changes

- @wizeworks/silicaui@0.15.0
- @wizeworks/silicaui-html@0.15.0

## 0.14.0

### Minor Changes

- aa589af: `DataBinding`'s `value` kind gains an optional `attr?: string`. When set, `resolveTree`'s `fillValue` writes the resolved value onto exactly that attribute (element) or prop (component) — e.g. a product card's own `<a>` binding `href` — instead of relying on the auto-detected primary slot (which only ever covered `img`/`source`→`src`, `input`→`value`, and a component's `label`/`text`/`src`). Omitting `attr` keeps today's auto-detection unchanged.

  The site builder's Inspector gains a "Target attribute" field on `value` bindings, next to the existing kind/reference picker, following the same pattern as the `action` kind's "Fallback href".

### Patch Changes

- Updated dependencies [aa589af]
  - @wizeworks/silicaui-html@0.14.0
  - @wizeworks/silicaui@0.14.0

## 0.13.0

### Patch Changes

- @wizeworks/silicaui@0.13.0
- @wizeworks/silicaui-html@0.13.0

## 0.12.0

### Minor Changes

- 9c716c3: Fix `resolveTree`'s data-fill for form controls: a bound value on an `<input>` now sets its `value` attribute instead of its children, which `toHtml` silently drops for void elements (the bound value previously vanished from the rendered output with no error).

  Add `<Builder toolbarSlot>` — a header extension point (rendered next to Publish) for host-owned UI like a save-status badge, since the builder itself has no way to know whether a host's own persistence succeeded, failed, or is pending. Also widen `<Builder document>` to accept `Document | Site` directly (the `Editor` already did), dropping a cast some hosts needed.

### Patch Changes

- Updated dependencies [9c716c3]
  - @wizeworks/silicaui-html@0.12.0
  - @wizeworks/silicaui@0.12.0

## 0.11.0

### Minor Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

### Patch Changes

- Updated dependencies [970bb4b]
  - @wizeworks/silicaui@0.11.0
  - @wizeworks/silicaui-html@0.11.0

## 0.10.1

### Patch Changes

- 7e6966e: Fix `@wizeworks/silicaui-builder` being non-consumable: it imports `@wizeworks/silicaui-react` at runtime (Toolbar, Button, Select, TreeView, etc. from `/react` and `/email/react`) but never declared it as a dependency, so a fresh install left that import unresolved. It's now a peer dependency, matching the other component-wrapping packages.

  The MCP package catalog also still listed `silicaui-builder` as `private: true` / `install: null` from before it became a publicly installable package — corrected to a real install command and current version.

  - @wizeworks/silicaui@0.10.1
  - @wizeworks/silicaui-html@0.10.1

## 0.10.0

### Minor Changes

- 8e7b6ed: Add the builder host adapter seam (builder-contract.md §5): `<Builder host={...}>` now accepts `catalog` (Insert-palette merge), `dataSources` (a real binding picker via engine-owned `scopeAt`), `validateClass` (composes with a new non-optional built-in class-string floor), `inspectorPanels` (additive host panels writing through the shared mutation primitives), and `pickAsset` (a new asset-picker Inspector control).

  Add the data-resolution keystone: `resolveTree(tree, host, scope?)` in `@wizeworks/silicaui-html` — one synchronous walker resolving `value`/`collection` bindings (including nested repeats), directly usable by a host's own live-render path (`toHtml(resolveTree(root, host))`). The Inspector's Data binding panel gained a live "Preview" row using the same host resolvers.

  Fix: the raw-element/attribute security floor (`sanitizeElement`, closed tag+attribute whitelist) is now enforced unconditionally in both `toHtml` and the live editor canvas — the canvas previously had no sanitization at all, a more exploitable gap than the publish path since it's the builder's own browser session.

### Patch Changes

- Updated dependencies [8e7b6ed]
  - @wizeworks/silicaui-html@0.10.0
  - @wizeworks/silicaui@0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

### Patch Changes

- Updated dependencies [e8bd507]
  - @wizeworks/silicaui@0.9.0
  - @wizeworks/silicaui-html@0.9.0

## 0.8.0

### Minor Changes

- 494e058: Fill the site builder's Insert palette with the high-value components added to `silicaui-html` that were previously unreachable from the UI: overlay/modal family (Dialog, Drawer, AlertDialog, Popover, Tooltip, CommandPalette, PreviewCard), form composites and standalone inputs (checkbox/radio/toggle groups, date pickers, dropzone, combobox, autocomplete, multi-select, slider, rating, phone/search/password/pin inputs, calendar, and more), data/nav additions (TreeView, Wizard, Collapsible, stats, toolbar, dock, menubar, navigation-menu), media (Carousel, Lightbox, mockups, mask, diff), and layout/content/feedback rounding-out entries (hero, app-shell, scroll-area, prose, empty-state, meter, and more).

  Along the way, fixed a button-in-button nesting bug in the Dialog/Drawer/AlertDialog/Popover trigger and close macros, a Lightbox/Drawer/Dialog/CommandPalette canvas positioning bug that let a revealed overlay panel block the entire builder UI, a Wizard palette entry that inserted with an empty-placeholder instead of Back/Next buttons, and a React `defaultSelected` console warning on canvas-rendered `<option>` elements.

### Patch Changes

- @wizeworks/silicaui@0.8.0
- @wizeworks/silicaui-html@0.8.0

## 0.7.0

### Minor Changes

- 309e377: Complete the email editor's feature set to parity with the site builder (no longer a starter slice): real drag-and-drop (drag-from-palette + drag-to-reorder, extracted `shared/dnd`), nested column groups, dynamic column add/duplicate/remove with automatic width rebalancing, section background images (with an Outlook VML fallback), Social/Video/Custom-HTML block kinds, a rich-text formatting toolbar (bold/italic/link/list) on text blocks, brand-theme-aware default colors (`EmailBuilder`'s new `theme` prop resolves OKLCH tokens to hex for new inserts), local crash-recovery autosave (extracted a generic `shared/persistence` `DraftStore<T>` and `shared/react/RecoveryBanner`, now used by both editors), saved/reusable blocks, a real-HTML preview mode (an iframe rendering the actual projected `toEmailHtml` output, not the live-DOM approximation), and a host-delegated `onSendTest` hook with a built-in send dialog.

### Patch Changes

- @wizeworks/silicaui@0.7.0
- @wizeworks/silicaui-html@0.7.0

## 0.6.0

### Minor Changes

- 1735d12: Add a first email editor, a peer of the site builder (new `@wizeworks/silicaui-builder/email` + `/email/react` entry points): a closed node schema (body → section → columns/column → text/image/button/divider/spacer), an `EmailEditor` engine (insert/move/duplicate/undo-redo), a `toEmailHtml` projector that emits real table-based, fully inline-styled markup with Outlook MSO conditional fallbacks and mobile column-stacking, and an `EmailBuilder` React chrome (click-to-insert palette, a live-DOM-approximation canvas with inline text editing, and a per-block-kind Inspector). Extracted a shared `SelectionOverlay` (used by both editors' canvases) and added the email-related baked icons.

### Patch Changes

- @wizeworks/silicaui@0.6.0
- @wizeworks/silicaui-html@0.6.0

## 0.5.2

### Patch Changes

- a39ad19: Restructure `silicaui-builder`'s source tree to make room for an email editor alongside the existing site editor: editor-agnostic chrome (icon system, `Icon`, `ErrorBoundary`) moved to `src/shared/`, and the site editor's engine + React chrome moved to `src/site/`. The public API (`@wizeworks/silicaui-builder` and `@wizeworks/silicaui-builder/react`) is unchanged — internal move only, verified against the full e2e suite.
  - @wizeworks/silicaui@0.5.2
  - @wizeworks/silicaui-html@0.5.2

## 0.5.1

### Patch Changes

- Updated dependencies
  - @wizeworks/silicaui@0.5.1
  - @wizeworks/silicaui-html@0.5.1

## 0.5.0

### Patch Changes

- Fix several layout/visibility bugs found while auditing the playground, and add a proper chat typing indicator:

  - **Alert/Toast**: top-align the leading icon and trailing actions/close button (`align-items: flex-start`) instead of centering them against the whole (often multi-line) row. `.alert-close`/`.alert-actions`/`.toast-close` now claim their own trailing space via `margin-inline-start: auto` instead of relying on a sibling `AlertContent` to flex-grow — a dismissible one-liner Alert (bare children, no `AlertContent`) previously left the `×` sitting right next to the text instead of at the row's end.
  - **Collapsible**: new `CollapsibleTrigger` `variant="icon"` — a compact circular disclosure control (sized like `AlertClose`) for placing a second trigger in its own layout slot (e.g. an Alert's trailing actions) while a `variant="default"` trigger elsewhere carries the visible label; both share one `Collapsible`'s open state via context.
  - **Collapse**: renamed its CSS class from `.collapse` to `.details` everywhere (CSS, React, the `-html` macro, the prefix-recognition table, the builder's palette). Tailwind v4 ships a built-in `.collapse { visibility: collapse }` utility (for table row/column collapsing) that silently won over the component's own rule of the same name, making every `Collapse` invisible while it still occupied layout space. The public React names (`Collapse`/`CollapseTitle`/`CollapseContent`) are unchanged.
  - **Carousel**: `className` now applies to both the outer positioning root and the inner scroll strip, not just the strip. Previously a width-constraining class (e.g. `max-w-lg`) shrank the visible strip while the prev/next controls — absolutely positioned against the _root_ — stayed anchored to the full, unconstrained parent width.
  - **MockupPhone**: no component change; documented that content should fill the display (`w-full h-full`), not a fixed size smaller than it.
  - **Chat**: `.chat-layout-messages` now bottom-anchors (`justify-content: flex-end`) so a short conversation sits against the composer instead of pinned to the top with a dead gap below it. Added `ChatTypingIndicator` — three animated dots inside a real `.chat-bubble` (matching avatar/placement of a normal message) — replacing the old plain-text "is typing…" convention.

- Updated dependencies
  - @wizeworks/silicaui@0.5.0
  - @wizeworks/silicaui-html@0.5.0

## 0.4.0

### Patch Changes

- @wizeworks/silicaui@0.4.0
- @wizeworks/silicaui-html@0.4.0
