# @wizeworks/silicaui

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
