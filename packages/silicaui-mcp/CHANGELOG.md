# @wizeworks/silicaui-mcp

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
