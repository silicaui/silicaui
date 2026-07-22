# @wizeworks/silicaui-react

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

### Minor Changes

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

- a90b819: **Breaking (pre-1.0): two props renamed so `size` means one thing.**

  A design system's leverage is that one prop name means one concept everywhere.
  `size` had drifted into three, and two of them were renamed:

  | Component        | Before                         | After                            |
  | ---------------- | ------------------------------ | -------------------------------- |
  | `RadialProgress` | `size?: string` (a CSS length) | `diameter?: string`              |
  | `Heading`        | `size?: 1–6 \| "display"`      | `visualLevel?: 1–6 \| "display"` |

  `RadialProgress` was the harmful one. `size` accepted any CSS length and wrote
  it straight to `--size`, so `<RadialProgress size="lg" />` — the spelling that
  works on every other component in the library — type-checked, compiled, and
  emitted the invalid `--size: lg`, silently collapsing the ring. `diameter`
  pairs with the existing `thickness`, which is also a CSS length.

  `Heading` keeps `level` for semantics; the visual scale is now `visualLevel`,
  which says what it is and no longer collides with the token scale.

  `packages/silicaui-react/verify-prop-vocabulary.mjs` now reads the source and
  asserts every `size` prop resolves to the `xs`–`xl` scale (or a subset the CSS
  actually emits). Typecheck cannot catch this class of drift — `size?: string`
  is perfectly valid TypeScript — so it needed a probe rather than a type.

  ### `render` vs `as`: documented, deliberately not unified

  An earlier audit proposed standardizing all polymorphism on `render`. That was
  investigated and **rejected**, because the two props are not two spellings of
  one idea:

  - `render` takes an **element** and clones it (composition). It needs the real
    element, so it does not survive a `"use client"` boundary — already
    documented in this package's Server Components section.
  - `as` takes a **tag name or component type**. A string like `"span"` crosses
    that boundary fine.

  Unifying on `render` would have regressed Server Component usage for exactly
  the presentational components (`Text`, `Wordmark`, `BlockquoteCite`) most
  likely to be used server-side. The existing split was already correct; what was
  missing was any statement of the rule. It's now in the README as a table, and
  in the component-authoring skill so new components don't pick arbitrarily.

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

### Patch Changes

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

### Minor Changes

- 4d96f1c: Add `PortalContainerProvider` / `usePortalContainer` for multi-window apps.

  Every portalled surface (DropdownMenu, ContextMenu, Menubar, Select, Combobox,
  MultiSelect, Autocomplete, DatePicker, Dialog, AlertDialog, Drawer, Lightbox,
  CommandPalette, NavigationMenu, Popover, PreviewCard, Tooltip, Toast) now
  resolves its portal container from the new context before falling back to Base
  UI's default `document.body`. Apps that render part of their React tree into a
  second browser window (`window.open` + `createPortal` popouts) wrap that
  subtree in `<PortalContainerProvider container={childDocument.body}>` so menus,
  dialogs, and toasts opened there appear in the window that triggered them
  instead of the opener. No provider — or `container={null}` — keeps today's
  behaviour exactly.

  The container is any `HTMLElement`, not only a document body, so the same
  provider scopes portalled surfaces to an in-page region — a pane, workspace, or
  module shell. A dialog portalled into that element resolves its `--color-*`
  against the region's `[data-theme]` island, so a scoped surface inherits the
  region's palette without per-instance styling. Note the container must not
  establish a containing block for fixed positioning (`transform`, `filter`,
  `contain`, `backdrop-filter`) or clip with `overflow: hidden`, or the centered
  popup will position against the region instead of the viewport, or be cut off.

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

### Patch Changes

- 3bd07b4: Make the `render` prop fail safely, and document that it's client-only.

  Passing `render={<a href="…" />}` from a React Server Component either threw
  React's opaque `Element type is invalid… got: undefined`, or silently produced
  a styled element with none of its own props — a link that looks right and
  navigates nowhere. The cause is structural: this package's main entry is a
  single `"use client"` module, so the element is serialized across the boundary
  and arrives with `type` and/or `props` missing.

  - The three `render` implementations (`Button`, `Badge`, `ClickableCard`) now
    share one audited helper, `composeRender`. It validates the element before
    cloning it and falls back to the component's own native element when the
    element is unusable, so a bad `render` can no longer take a page down.
  - Both failure modes now log an actionable `console.error` naming the
    component and pointing at `@wizeworks/silicaui-react/server`. They fire in
    production too — each mode is silent by nature, so a build that only warned
    in development would still ship dead links. The remediation detail is
    dev-gated and stripped from production bundles.
  - `mergeProps` keeps its public contract: called with a single argument (its
    documented `/server` usage) it stays silent.
  - The `render` JSDoc on all three components states the constraint and the
    fix, which also surfaces it in editor hover-hints and the `silicaui-mcp`
    catalog. The README gains a **Server Components** section covering the
    `"use client"` boundary and the `/server` class builders.
  - New `pnpm --filter @wizeworks/silicaui-react verify` probe covers all of the
    above against the built bundle, in both `NODE_ENV` modes.

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

### Minor Changes

- 8b540c0: Add Google Fonts theming to the site builder. `ThemeEditor`'s body and heading typeface controls are now a searchable picker over ~1900 Google Fonts (previously a 4-option body toggle and a 2-option "Match body"/"Serif" heading toggle) — selecting a font live-loads it in the canvas for preview and records the exact family/weights on the new optional `Theme.fonts` field, so a host can self-host the real files at publish time instead of hotlinking Google's CDN (a real EU privacy liability for published sites).

  New package `@wizeworks/silicaui-fonts` provides `selfHostGoogleFonts()` — a Node-only, publish-time utility a host's backend calls to fetch and self-host the actual font files, given `theme.fonts` from `PublishPayload`.

  Also adds `Combobox`'s `popupProps` (mirroring `Select`) so a portaled Combobox popup can re-stamp `[data-theme]` when opened from inside a scoped theme island.

## 0.15.0

## 0.14.0

### Patch Changes

- aa589af: `buttonClasses`, `badgeClasses`, and `clickableCardClasses` (added in 0.13.0) now actually work from a Server Component. They previously lived inside `button.tsx`/`badge.tsx`/`card.tsx`, part of the bundle `@wizeworks/silicaui-react`'s main entry stamps `"use client"` onto — importing them there handed a Server Component an unusable client reference, not a callable function. They now live in framework-agnostic `lib/` modules (no React dependency) exported from both the main entry and `@wizeworks/silicaui-react/server`, so `import { buttonClasses } from "@wizeworks/silicaui-react/server"` gets a real function.

## 0.13.0

### Minor Changes

- 386a0c1: `mergeProps` (the merge behind every component's `render` prop) now tolerates a `theirs` of `undefined`, so passing a Server Component's client-component element through `render` degrades gracefully instead of throwing — crossing that boundary serializes the element as a lazy client reference whose `.props` reads as `undefined`. `Validator`/`FloatingLabel`'s direct `children.props` reads get the same treatment.

  Also export `buttonClasses`, `badgeClasses`, and `clickableCardClasses` — the class-string logic behind `Button`, `Badge`, and `ClickableCard`, as standalone functions with no React context dependency. A Server Component can now style a plain element directly (e.g. `<Link className={buttonClasses({ color: "neutral", variant: "ghost" })}>`) instead of needing the client-side `render` composition.

## 0.12.0

## 0.11.0

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

### Patch Changes

- 18da685: Fix `@wizeworks/silicaui-mcp`'s catalog generator so it can't silently drift out of sync again:

  - `behaviors.json` is now derived from `silicaui-behaviors`' real `HANDLERS` dispatch table instead of a hand-maintained file list — all 30 registered `BehaviorType`s are covered (previously only 11, missing `form` and every behavior added since).
  - `components.json` now also covers `silicaui-html`'s `ComponentDef` macro registry (208 framework-neutral components — Dialog, Popover, Combobox, etc.), not just `silicaui-react`. Each macro's real `BehaviorType`(s) are discovered by actually calling its `expand()`, not guessed. `get_component` now takes an optional `package` argument to disambiguate names that exist in both packages.
  - The generator now warns at `gen` time if a `silicaui-react` component's export has no matching row in the README's component table, instead of silently omitting it from the catalog forever.
  - `silicaui-react/README.md`'s component table gets 28 real components it was missing (`Timestamp`, `InputGroup`, `PasswordInput`, `MultiSelect`, `AppShell`, `PowerSearch`, the `DateInput`/`TimeInput` family, and others).
