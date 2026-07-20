# @wizeworks/silicaui-html

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
