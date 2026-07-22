# @wizeworks/silicaui-behaviors

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

### Patch Changes

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

## 0.23.0

## 0.22.0

### Minor Changes

- 79822a8: Host nodes (live code-component embeds) + two-tier node locking — two orthogonal, universal primitives so an authored page can carry a live, host-owned functional region (checkout, search, cart, a data grid) pinned in place. Design authority: `docs/host-nodes-and-node-locking.md`.

  - **Node locking** — new `NodeBase.locked?: "host" | "author"` (presence encodes locked; the value encodes the owner). The editing spine refuses `remove`/`move`/reparent on any locked node, `duplicate` yields an unlocked copy, and a new tier-blind `setLocked(id, owner)` primitive is undoable. The Inspector's Settings tab gains a Lock row (an author toggle, or a read-only "Locked by host" indicator with no unlock — only the host clears a host lock); the Navigator shows an owner-aware lock/shield glyph. Generalizes the outlet/root protection; no projection reads `locked`.

  - **Host nodes** — new `HostNode { kind: "host"; component; props }` in the node union (+ a `host()` kit helper). `toHtml` projects an **empty** `<div data-sui-host="…" data-sui-host-props="…">` mount point — never live framework code, preserving the framework-neutral projection promise — into which a host mounts its real component (client or SSR), the same trust model as behavior-marker hydration and `rawHtml`. Every traversal (`stampTree`/`walk`/`flattenSymbols`/`resolveTree`) passes a host node through untouched.

  - **`@wizeworks/silicaui-behaviors`** — new optional `mountHostNodes(registry, root?)` helper, the client-side companion to the mount points (symmetric with `hydrate()`); host components stay host-owned.

  - **Builder** — `BuilderHost` gains `hostComponents()` (Insert-palette entries, `pinned` inserts host-locked) and `renderHostNode()` (live canvas preview, with a labeled placeholder fallback), plus `HostComponentDef`/`HostPropDef`/`HostRenderCtx`. The engine treats a host node as a selectable **leaf** — drop-_beside_, never drop-_into_ — and `setProp` writes host props. The Inspector renders a Host panel from the component's declared props.

## 0.21.0

## 0.20.0

## 0.19.0

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

## 0.5.0

## 0.4.0
