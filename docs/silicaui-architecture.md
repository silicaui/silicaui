# silicaui — Architecture & Integration Spec

**Version:** 0.2 — complete first draft (all sections; ready for implementation)
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-06
**Status:** This is the **canonical** spec for the silicaui family. It is the design
authority. Consumers (sparx first) conform to it — not the reverse.

> **Purpose.** silicaui is a WizeWorks product: a universal, themeable design
> system **plus** a visual builder authored for that system. This document is its
> single source of truth — the node schema, the projections, the theme model, the
> data/behavior contracts, the builder engine, and the seam a host plugs into. It is
> written **consumer-agnostic**: silicaui serves any host (a CMS, a commerce
> platform, a docs site, a static-site generator, an email renderer). Where a
> specific host needs to adapt, that mapping is quarantined to the appendix.
>
> **Read this first, one line:** there is **one node shape**, it is the same shape
> everywhere (template, document, persisted record, every projection), and
> everything else — React, HTML, the builder, a host adapter — is a *projection of*
> or *operation on* that one tree. Get the schema, the projections, and the theme
> model right and the rest is downstream.

---

## 0. Stance — silicaui is the product

silicaui is built for a **universe of consumers**, not for any one platform. The
first and reference consumer is sparx, and sparx's needs are a valuable **source of
requirements** — multi-tenant theming, dynamic data, a security boundary for
user/AI-authored content, forms, dark mode, a builder. But sparx is **not** a source
of design. We take the *requirements*; we reject the *implementation*.

**The operating rule for every decision in this doc:**

1. **Consumer-parochial → drop.** Anything that exists only to make one host's
   integration cheaper. (Example: we do **not** shape the node schema to minimize a
   particular host's adapter — we design the best universal schema and the host
   adapts.)
2. **Genuinely good universal design → keep, on its own merit.** The three opaque
   data primitives, class-as-sole-styling behind a host-supplied allowlist,
   container-relative responsiveness for portable blocks, the `[data-theme]` island
   isolation. We keep these because they are right for *any* consumer.
3. **A host's actual domain → stays behind the adapter.** Products, CMS entries,
   endpoints, persistence, tenancy. Opaque references. Never silicaui's concern.

Where a consumer's prior art capped the ceiling, we go **beyond** it — e.g. silicaui
must produce legible foregrounds **standalone** (a universal consumer has no
dashboard to inject WCAG contrast), with an injected value winning when present.

---

## 1. Design principles

- **One shape, no translation layer.** A template, a live document, a stored record,
  and the input to every projection are the *same* node tree. The only transform in
  the whole system is `template → document` (mint ids), and it runs at stamp,
  duplicate, and paste — nowhere else.
- **`class` is the sole styling surface.** No inline `style`, no style object, no
  second channel. Layout, spacing, surface, and skin are all silicaui classes + an
  allowed utility subset. This is what makes the tree portable, themeable, and
  **governable** (a host gates class strings at one choke point).
- **The tree is framework-neutral and JSON-serializable.** No functions, no JSX. JSX
  permits arbitrary JS that can't be lowered back to a static tree, and the largest
  consumers (structured hosts, the builder) render markup, not React. React is an
  *output* projection, never the source.
- **Themeable by `[data-theme]` islands.** A themed subtree can nest inside a
  differently-themed host; tokens resolve by nearest-ancestor inheritance. This is
  silicaui's native isolation model and it is what the builder canvas reuses.
- **Container-relative, not viewport-relative, for portable layout.** A block
  responds to *its own* width, so it behaves identically full-width, in a column, or
  in a narrow builder canvas. (The base *component* classes bake in neither; see §5
  and §9.)
- **Extensible on every axis.** N arbitrary named theme colors, arbitrary tokens,
  arbitrary blocks. New names work the moment their rule exists — no codegen, no
  cartesian class explosion.

---

## 2. The package family

```
silicaui          Tailwind v4 plugin — tokens + component CLASSES        the vocabulary
   │              (addBase only; ships NO utilities → widens no allowlist)
   ├── silicaui-react     typed React components over the classes        one projection
   │
   ├── silicaui-html      framework-neutral NODE-TREE source (the el/atom/slot/
   │        │             behave/part kit) + the HTML projection. Renders plain
   │        │             native elements with silicaui classes — NOT web components.
   │        └── /blocks    composed patterns (navbar, hero, pricing, footer)
   │
   ├── silicaui-behaviors  framework-agnostic runtime for the behavior markers
   │
   └── silicaui-builder    domain-blind visual editor for silicaui documents
```

One node shape (§3) flows through all of them. `silicaui-html` is where the schema,
the authoring kit, and the projections live; `silicaui-builder` consumes them.

---

## 3. The node schema (the foundation)

Designed fresh. The prior-art `BuilderNode` muddied things by smushing a node's own
props, its text, its HTML attributes, and system markers into one `props` bag. We
separate **what a node is** from **system metadata**, make the element/component
distinction a clean discriminated union, and make the mutually-exclusive data
primitives a single field.

```ts
/** The tree is built from these. JSON-serializable; no functions. */
type Node = ElementNode | ComponentNode;

/** A child is another node, or a plain string (a text node). */
type Child = Node | string;

interface NodeBase {
  /** GLOBALLY-UNIQUE instance id. Present on DOCUMENT nodes (selection, React keys,
   *  dnd ids); ABSENT on template/block nodes. Minted on stamp, duplicate, paste. */
  id?: string;
  /** The ONLY styling surface: silicaui component classes + the allowed utility
   *  subset. A host gates these (§8). No inline style, ever. */
  class?: string;
  children?: Child[];

  // ── system metadata — typed, and NEVER mixed into attrs/props ──────────────
  /** Dynamic content. At most one binding; the union makes "at most one"
   *  structural instead of a runtime rule. Opaque `ref` — silicaui never parses
   *  it (§8). Absent → the node renders its own static content. */
  data?: DataBinding;
  /** Marks this node as an editable region for a builder/host (§6-blocks). */
  slot?: SlotDef;
  /** Marks this node as a behavior ROOT (§7). */
  behavior?: BehaviorMarker;
  /** Marks this node as a structural PART of an ancestor behavior (§7). */
  part?: string;
}

interface ElementNode extends NodeBase {
  kind: 'element';
  tag: string;                                   // 'div','section','nav','h1','a','img',…
  attrs?: Record<string, string | number | boolean>;  // whitelisted HTML attrs ONLY
}

interface ComponentNode extends NodeBase {
  kind: 'component';
  component: string;                             // a silicaui atom: 'Button','Card','Image',…
  props?: Record<string, unknown>;               // the component's OWN typed API
}

/** Dynamic-content primitives — three, and only three (§8). */
type DataBinding =
  | { kind: 'value'; ref: string }               // fill this node from a resolved value
  | { kind: 'collection'; ref: string }          // render `children` once per item
  | { kind: 'action'; ref: string; href?: string };  // this node triggers a host action
```

**Why this shape:**

- **`kind` discriminates cleanly** — an element carries `tag` + `attrs`; a component
  carries `component` + `props`. No `'el:<tag>'` string-prefix encoding to parse.
- **Text is a string child** (`children: ['Ship your store']`), so mixed inline
  content composes naturally (`['Hello ', { kind:'element', tag:'strong', children:['world'] }]`)
  without a `text` prop that can't hold markup.
- **System metadata is top-level and typed**, not smuggled through `props`. A linter,
  a projection, and the builder can each reason about `data` / `slot` / `behavior`
  without inspecting an untyped bag.
- **`data` is one field**, so the "a node carries at most one dynamic primitive"
  invariant is enforced by the type, not by convention.
- **`id` is optional at the type level** with a hard invariant: templates omit it,
  documents require it. (Stamping/duplicating/pasting mints fresh ids so instances
  never collide.)

### 3.1 Template vs document

```ts
/** An authored, id-free, reusable template (a block or a user-saved component). */
interface Template {
  key: string;                 // stable slug: 'hero_split_cta'
  name: string;
  category: string;
  version: string;             // semver — the class vocabulary is a data contract
  root: Node;                  // id-FREE
  // manifest (colors, behaviors, slots index, emailEligible, preview): see §6 (stub)
}

/** A live, editable, themed document — what loads into and extracts from the builder. */
interface Document {
  version: string;
  root: Node;                  // ids PRESENT
  theme: Theme;                // §5
  frame?: Frame;              // optional surrounding layout with one Outlet (§9 stub)
}
```

`Template.root` and `Document.root` are the **same** `Node` type. Stamping a template
is: deep-clone `root`, mint an `id` on every node. That is the only translation in the
system.

---

## 4. Projections

silicaui owns the generators; a consumer never writes them. All projections are
**byte-faithful** to the one authored tree — a node that renders differently across
projections is a generator bug, caught by snapshot tests, not something a consumer
debugs.

```ts
toHtml(node | Template | Document, opts?: { prefix?: string }): string
toReact(Template): ReactComponent          // build-time codegen; props = the template's slots
toJson(node | Template | Document): object // the validated tree, as data
```

- **`toHtml`** — walks the tree, emits tags/classes/attrs, and lowers each
  `component` node through silicaui-html's **component registry**: a component is a
  macro that *expands* to an element subtree, then renders through the same element
  path (so a new component adds a `ComponentDef`, never a renderer branch). Inlines
  slot default content, applies the host `prefix` to silicaui class names.
  Framework-free, copy-in, the production renderer.
- **`toReact`** — a generated `silicaui-react` component whose props are the
  template's slots; renders the same tree with the active `<SilicaProvider>` prefix.
  React is *output*.
- **`toJson`** — the tree itself, validated, for structured hosts and the builder.

**Preview == production is structural, not by convention:** the builder canvas
renders via the *same* `toHtml`/component-registry path that ships to production. There is
no separate canvas renderer to drift from the live output.

---

## 5. The theme model

A theme is a native silicaui token set applied via `[data-theme]`. It **loads and
extracts** with the document, and it carries **both modes** — because a consumer can
override brand identity per light/dark mode, and dark is not derivable from light in
the renderer (it's authored/host-computed).

```ts
interface Theme {
  name: string;                          // the [data-theme] value (e.g. 'tenant-x')
  tokens: Record<string, string>;        // base (light): --color-*, --color-*-content,
                                         //   --radius-*, --size-*, --font-*, --spacing, …
  dark?: Record<string, string>;         // per-mode OVERRIDE deltas for dark
  mode?: 'light' | 'dark';               // which mode to preview; either is renderable
}
```

- **Applied at a parent element**, its tokens shadow any outer theme for the whole
  subtree by inheritance — the island model. Toggling light↔dark = apply `tokens`
  (+ `dark` overrides) to that element's `[data-theme]` block; nothing else moves.
- **`-content` (foreground) is a consumed, default-backed var.** Every foreground
  resolves `var(--color-<name>-content, <fallback>)`: an injected token wins; the
  fallback covers the standalone case. **silicaui ships a genuinely good standalone
  fallback** (a consumer without a contrast engine still gets legible text); a host
  with a WCAG derivation injects and wins. silicaui never hardcodes a foreground.
- **Everything else derives in-CSS** off the base var: hover/active/tint via
  `color-mix(in oklab …)`. No baked color literal reaches the output — the sole
  resolved hex lives in the applied `[data-theme]` token block.
- **Every non-color axis is tokenized too:** radius (`box`/`field`/`selector`),
  shadow scale, fonts (`heading`/`body`), a spacing base unit, container width.

---

## 6. Blocks — the composed tier

A **block** is an opinionated, pre-composed arrangement of silicaui primitives (a
marketing navbar, a hero, a pricing table, a footer) — the "Tailwind-UI-rival" tier.
Owning blocks *in silicaui* is the point of the family: a consuming platform stops
*authoring, skinning, and visually testing a component library inside itself* and just
**imports** one.

A block **is** a single-rooted, **id-free `Template`** (§3.1): a composition of
*existing* primitives + the allowed utility surface, carrying realistic default
content, declaring its editable **slots** and any **behaviors**. A block **is not**: a
new primitive (add that to the CSS layer first, then compose), a React component
(React is a projection), a page with real data (a block ships believable placeholders
and *declares* where content plugs in), or a carrier of raw scripts / inline styles /
arbitrary utilities.

### 6.1 The manifest

```ts
interface Template {                 // §3.1, expanded for blocks
  key: string;                       // stable slug: 'hero_split_cta'
  name: string;                      // 'Hero — split with CTA'
  category: string;                  // 'navigation' | 'hero' | 'pricing' | 'footer' | …
  version: string;                   // semver — the class vocabulary is a data contract (§6.4)
  description: string;
  tags?: string[];
  colors: string[];                  // named theme colors the tree references — a host validates they exist
  behaviors: BehaviorType[];         // behaviors used (§7); [] if static
  emailEligible: boolean;            // obeys the email-degradable subset (a host email renderer's concern)
  slots: SlotDef[];                  // flat index of every editable region (§6.2), derived from the tree
  root: Node;                        // exactly one, id-free
  preview?: { thumb?: string; note?: string };
}
```

### 6.2 Slots — the editable-region contract

A block ships good defaults **and** declares which regions a consumer may edit — the
dual nature that makes one artifact serve "paste it and it looks great" *and* "make it
editable in a builder." A node's `slot` (§3) names and types an editable region
**without blanking** its default content.

```ts
interface SlotDef {
  name: string;                      // 'headline', 'cta', 'logo', 'nav_links'
  type: 'text' | 'richtext' | 'image' | 'icon' | 'link' | 'boolean' | 'select' | 'list';
  label?: string;
  required?: boolean;
  repeatable?: { min?: number; max?: number; of: SlotDef[] };  // lists: nav links, tiers, logos
}
```

Projection mapping: **HTML** — slots inert, defaults render. **React** — each slot is
a typed prop; omit → default renders. **Structured host** — maps each slot to its own
edit affordance / binding. A block with no slots is valid (a static footer); the
richer the slots, the more useful to a builder.

### 6.3 The linter (conformance guarantee)

silicaui ships a **block linter** that validates every block's `class` strings against
the allowed surface (§6.4) at build time. A conformant block is therefore *guaranteed*
to pass a host's class gate untouched, and any drift is caught in **silicaui's** CI,
not a consumer's. It also enforces the authoring bar: container-query responsive (no
viewport variants), one root, realistic copy (no lorem, **no uppercase "eyebrow"
kickers** — house rule), and email-degradability for `emailEligible` blocks.

### 6.4 The frozen class surface (a data contract)

For a *stamping* host, a block's `class` strings become **persisted data** (§1's
one-shape principle). So the class vocabulary is versioned and **frozen within a
major**: renaming a component class, a token, or a block `key` is a **major** change.
Within a major, changes are **additive only** (new blocks, new *optional* slots, new
colors) — never a rename, never a removed slot.

- **Allowed:** silicaui component classes; token utilities (resolve to theme vars —
  surfaces/ink, brand/semantic each with a `-content`, radius, shadow, motion); the
  standard spacing/layout scale; **container queries** for responsiveness.
- **Banned (a host gate rejects; never author):** `fixed`, arbitrary `z-[…]`,
  `content-[…]`, any `url(…)` in a class, raw inline `style`, `@keyframes` in a block.

### 6.5 The index

silicaui assembles all blocks into a validated index: `listBlocks()` / `getBlock(key)`
with category/tag filters, and `catalogSummary(block)` (the manifest without the tree)
for lightweight listings and a host's palette. A block's declared `colors`,
`behaviors`, `emailEligible`, and `slots` let a consumer validate compatibility
(colors exist, behaviors supported, gate passes) **before** ingesting the tree.

---

## 7. Behaviors — the marker contract

Interactivity is **declared, never scripted.** A block never contains a `<script>` or
a raw `data-*` (a governed host strips unknown `data-*`). Instead a node marks **one
behavior root** and its **structural parts** from a closed vocabulary; a runtime on
the consuming side wires it.

```ts
interface BehaviorMarker {                 // node.behavior (§3)
  type: BehaviorType;
  params?: Record<string, unknown>;        // typed per type
}
type BehaviorType =
  | 'carousel' | 'disclosure' | 'tabs' | 'menu'
  | 'marquee'  | 'scrollspy'  | 'counter' | 'dismiss' | 'toc';

// node.part (§3) is a role string from a closed set:
type BehaviorRole =
  | 'track' | 'slide' | 'prev' | 'next' | 'dot' | 'dots'
  | 'trigger' | 'panel' | 'item' | 'tab' | 'spy';
```

Example params: `carousel { autoplay?, interval? }`, `disclosure { single? }`,
`marquee { pauseOnHover? }`, `scrollspy { threshold? }`.

**Rules:**

- **The marker names are the contract; the lowering is each runtime's business.**
  silicaui's own `silicaui-behaviors` runtime lowers `behavior`/`part` to `data-sui-*`;
  a host runtime lowers the *identical* markers to its own prefix. Same names → **one
  authored block drives either runtime.**
- **Parts correlate to their root by structural nesting, never by id** — so the
  template tree stays id-free and re-stampable. A `part` belongs to its nearest
  ancestor `behavior`.
- **Both surfaces.** A behavior must work on a live page (full behavior) and preview
  sanely in an editor canvas (**autoplay suppressed, collapsed panels revealed**).
- **Closed panels ship `hidden`.** An initially-collapsed panel carries
  `attrs: { hidden: true }` so it doesn't flash open before hydration; the open one
  omits it.
- **Prefer CSS-only** where it suffices — native `details`/`summary`, `peer` checkbox
  toggles, `overflow-x-auto snap-x` scrollers — no runtime needed. Reserve markers for
  genuinely JS-driven composites (autoplay carousel, mega-menu, single-open accordion,
  JS tabs, scroll-adaptive nav).

**The runtime (`silicaui-behaviors`).** A small, closed, framework-agnostic package: it
scans for lowered markers and wires them, runs in both surfaces, and depends on no
client framework. It is what the builder canvas previews and the live site runs — the
*same* markers — so a structured host that renders markup (not React) stays fully
interactive without Base UI. (silicaui-react drives the same interactions through Base
UI for React hosts; both honor the same authored markers.)

---

## 8. Data & host integration — the seam

Dynamic content enters through **three opaque primitives** (§3's `data` union) and a
few host callbacks. silicaui never parses a `ref` — it hands it to the host and
renders what comes back. This opacity is the keystone: a CMS, a commerce backend,
and a static site each implement the same small contract (or none), and silicaui
gains no domain code.

### 8.1 The render-time resolver

Any renderer that fills dynamic content implements this — the builder for live
preview, a server renderer to hydrate a page. **Omit it entirely for a static tree**:
bindings fall back to each node's own static content, so a static-site consumer needs
no host data at all.

```ts
interface DataResolver {
  resolveValue?(ref: string, scope: DataScope): Resolved | Promise<Resolved>;
  resolveCollection?(ref: string, scope: DataScope): DataScope[] | Promise<DataScope[]>;
}
type Resolved  = { value: unknown; label?: string };  // `label` = what a builder's bound-chip shows
type DataScope = { path: string[] };                  // opaque repeat ancestry; the host interprets it
```

- **`value`** — silicaui calls `resolveValue(ref, scope)` and renders `value` into the
  node's **primary content** (text for text elements, `src`/`href` for media/links,
  the primary prop for a component). No resolver / no result → the node's static
  placeholder renders. A builder additionally paints a "bound" affordance labeled
  `label`.
- **`collection`** — silicaui calls `resolveCollection(ref, scope)` → an array of
  **item scopes**, renders `children` once per scope, and threads each scope down so
  nested `value` bindings resolve per item. **silicaui owns the repetition; the host
  owns the data** (and correlates scope → record internally, so the item shape stays
  opaque).
- **`action`** — inert at render and in the editor. The `ref` (+ optional `href`) is
  opaque; the host wires the trigger on the live surface.
- **Async / loading / error.** Resolvers may be async. The renderer shows the node's
  static content while pending **and** on rejection — never a broken node; a builder
  may surface the error on the bound affordance.

### 8.2 The class-policy seam

`class` is the sole styling surface **precisely so** a host can gate it at one point.

```ts
interface ClassPolicy {
  validateClass(cls: string): { ok: true } | { ok: false; reason: string };
}
```

- The host **defines** the policy; silicaui **enforces** it — the builder calls it
  before committing any class string (author-typed **or** AI-generated), and a
  rejected class never enters the document via the editor.
- **This is an authoring/UX gate, not the security backstop.** A stored tree can be
  mutated outside the builder (direct edit, import, API), so the *authoritative*
  boundary is the host's own compile/persistence-time validation. Editor gate = belt;
  host compile gate = suspenders.
- silicaui defines **no** policy (no baked denylist) — only the enforcement seam. And
  because its plugin adds **only** component classes and **zero** utilities (§10), it
  never widens whatever surface the policy guards.

---

---

## 9. The builder engine

`silicaui-builder` is a **domain-blind** visual editor for silicaui documents: load a
`Document`, manipulate it directly, tune the theme, extract the **same shape**. It
knows nodes/classes/tokens/themes/slots/blocks/behaviors; it knows nothing about
products, CMS entries, orders, tenants, persistence, or publishing. Every one of
those enters through the host seam (§8) as opaque references and callbacks.

**Acceptance invariant:** grep the engine package for `product`/`cms`/`tenant`/
`order` → **zero hits.** If a host concept appears in the engine, the seam leaked.

### 9.1 Load & extract (symmetric)

```ts
mountBuilder(el: HTMLElement, opts: { document: Document; host: BuilderHost }): BuilderHandle;

interface BuilderHandle {
  extract(): Document;                                   // current state — SAME shape as loaded
  getSelection(): string[];                              // selected node ids
  select(ids: string[] | null): void;
  undo(): void; redo(): void;
  setDevice(width: number | 'desktop' | 'tablet' | 'mobile'): void;
  setThemeMode(mode: 'light' | 'dark'): void;
  destroy(): void;
}
```

The engine **never persists** — it edits in memory and emits via `host.onChange`.
Save, autosave-vs-explicit, versioning, conflict policy, publish: all the host's.

### 9.2 The host (`BuilderHost`)

Composes the render-time `DataResolver` + `ClassPolicy` (§8) with editor concerns:

```ts
interface BuilderHost extends DataResolver, ClassPolicy {
  catalog(): CatalogEntry[];                             // what the Add palette offers; default = the blocks index
  onChange(document: Document): void;                    // debounced after every edit; the host saves
  pickAsset?(kind: 'image' | 'video'): Promise<AssetRef | null>;
  inspectorPanels?(node: Node): InspectorPanel[];        // host panels rendered beside the generic ones
}

type CatalogEntry  = { key: string; name: string; category: string; preview?: string };  // wraps a Template
type AssetRef      = { ref: string; kind: 'image' | 'video'; alt?: string };
interface InspectorPanel { id: string; title: string; render(node: Node, api: EditApi): unknown }
```

**Seven methods, four optional.** Required: `catalog`, `validateClass`, `onChange`.
Optional: `resolveValue`, `resolveCollection`, `pickAsset`, `inspectorPanels`. A host
with the three required methods gets a working **static-site** builder; add the
resolvers + assets and it builds a full commerce/CMS site — with **no** engine domain
code.

### 9.3 The canvas — element, not iframe

- A **scoped element** carrying the document theme's `[data-theme]`; `@scope` keeps
  its rules/reset from leaking into the host UI. **One DOM** — selection, drag, and
  the inspector operate directly, with no cross-frame style injection, event
  proxying, or coordinate mapping.
- **Renders via silicaui-html's `toHtml` / component registry — the same path as
  production.** So *preview == production* is structural, not a promise a separate
  canvas renderer can break.
- **Editor chrome** (selection outlines, drag handles, rulers) uses its **own token
  lane**, never the document palette — a selection outline must never inherit a
  tenant's colors.

### 9.4 Responsive — container queries

`setDevice()` resizes the canvas **element**; blocks respond via `@container`; block
roots carry `container-type: inline-size`. The block linter **forbids viewport
variants** (`md:`/`lg:`) — in an element canvas they'd read the host viewport, not the
canvas, and break device preview. (The base component library stays
viewport-agnostic; this is a blocks/builder commitment only — §1.)

### 9.5 Theme editing

A theme panel edits `theme.tokens` (+ the `dark` overrides); `setThemeMode` previews
either mode; the mutated theme extracts with the document. Both modes are carried in
the document (§5) because the engine can't derive dark from light.

### 9.6 Direct manipulation

- Select / multi-select; drag reorder **and** reparent; add (stamp from catalog) /
  remove / duplicate / paste.
- **Stamp, duplicate, and paste all mint fresh ids** on every node — the one
  `template → document` transform. Ids are globally unique so instances never
  collide (they double as React keys and dnd ids).
- **Undo/redo** operates on the document tree only. Resolved data lives outside the
  tree (it's the host's), so it isn't in the undo stack.

**`repeat` editing.** Render the template N times with **render-only** instance keys
`<id>-<i>` for React/dnd. Never persist or extract them — `extract()` keeps exactly
**one** template node. **Selection resolves to the template** (edit one = edit all,
surfaced in the UI so it isn't surprising); dnd *inside* a repeat is **structural**
(reorder the template's children), never per-instance (item order is the host's data).

**Custom / complex components = user-authored templates.** "Save selection as
component" extracts the selected subtree as an **id-free `Template`** and hands it to
the host to persist; it appears in `catalog()` next time. Nesting is free (a template
composes atoms *and* other templates). **Authoring-from-selection is the engine;
storage + catalog is the host.** A lead-capture form = a saved composite + an
`action` on submit (host wires the endpoint) + `name`'d inputs — **no fourth
primitive**, and the engine stays domain-blind.

### 9.7 Frame & Outlet

A page edits **inside its layout**. `Document.frame` is a layout `Node` tree
containing exactly one reserved **`Outlet`** node (`{ kind: 'outlet' }` — a third node
kind, valid only inside a `Frame`). The engine renders the frame as a backdrop (locked
or editable) and drops `root` at the `Outlet` — the same composition the live site
ships, so header/footer/nav preview correctly. Omit `frame` to edit a bare tree (or
edit the layout *as* the root).

```ts
interface Frame { root: Node; /* contains exactly one Outlet */ editable: boolean }
```

### 9.8 Behavior preview

The canvas runs `silicaui-behaviors` with **autoplay suppressed** and **collapsed
panels revealed** for authoring; the live site runs full behavior (§7).

---

## 10. Security

silicaui's security posture is **structural**, resting on one property: `class` is the
sole styling surface (§1), so **all** styling — author-typed and AI-generated — passes
through a host's class gate before becoming CSS.

- **silicaui widens no attack surface.** Its plugin emits **only** component classes
  (via `addBase`) and **zero** utilities — so "just extending Tailwind" never
  reintroduces the utilities a host's denylist exists to stop. This is a verified
  invariant, not an aspiration: there are no `addUtilities`/`matchUtilities` calls.
- **The host defines the policy; silicaui enforces it** (`ClassPolicy`, §8). silicaui
  ships **no** denylist of its own — a universal library must not hardcode one
  platform's policy.
- **Two enforcement points, deliberately.** The builder's `validateClass` gate is an
  **authoring/UX** layer (a rejected class never enters via the editor). The
  **authoritative** boundary is the host's own compile/persistence-time validation —
  a stored tree can be mutated outside the builder (direct edit, import, API). Editor
  gate = belt; host compile gate = suspenders.
- **Blocks are pre-cleared.** The block linter (§6.3) validates silicaui's own blocks
  against the allowed surface, so a conformant block passes a host gate untouched and
  drift is caught in silicaui CI, not a consumer's.
- **No side channels in the tree.** No inline `style`, no raw `<script>`, no arbitrary
  `data-*`; interactivity is markers-only (§7), backgrounds ride an `image` slot (not
  `url(…)`), and z-index/position stay in the host's bounded named scale — none of
  which silicaui can subvert, because it emits no utilities.

A typical host policy (reference — *the host's*, not silicaui's) denies `fixed`,
arbitrary `z-[…]`, `content-[…]`, and any `url(…)` in a class. silicaui neither ships
nor undermines it.

---

## 11. Appendix — host-adapter guide (sparx as the worked example)

The **only** place consumer-specific mapping lives. Everything above is universal; a
host conforms to it here and gains no foothold in the engine.

**A host implements the seam (§8–§9), nothing more:**

- **Data.** Map the host's vocabulary onto the three primitives. sparx's four-kind
  spine collapses cleanly: **field + entity → `value`**, **collection → `collection`**,
  **action → `action`**. A different host with a different model implements the same
  `resolveValue`/`resolveCollection` and gets the same builder.
- **Policy.** Supply the class denylist as `validateClass` (sparx: `fixed` / `z-[…]` /
  `content-[…]` / `url()`, plus its bounded `.fixed-*` and named z-scale). The engine
  enforces; the policy is the host's.
- **Persistence.** `onChange(document)` → the host's save / versioning / publish /
  tenancy / RLS. The engine never persists.
- **Catalog, assets, panels.** `catalog()` curates the palette (default = the blocks
  index; hide some, add domain composites); `pickAsset` fronts the media library;
  `inspectorPanels` contributes domain editors (SEO, product-pin) beside the generic
  ones.

**Consuming the tree outside the builder (a structured host / "Mode-3").** A host that
renders its own node model writes **one** adapter, `adapt(node) → HostNode`, driven by
our `Node`:

| silicaui `Node` | host node | adapter work |
| --- | --- | --- |
| `kind` + `tag`/`component` | the host's type encoding | map the discriminator |
| `class` | `class` | passthrough (host prefix applied at projection) |
| `attrs` / `props` | the host's attr/prop channel | passthrough |
| `data` (value/collection/action) | the host's binding kinds | map the union |
| `slot` | the host's editable field / binding | map to its edit affordance |
| `behavior` / `part` | the host's marker channel | passthrough (same names, host prefix) |
| *(none)* | `id` | mint a fresh globally-unique id per node |
| `children` (incl. string text) | `children` | recurse; wrap strings as the host's text node |

This is a **mechanical field mapping**, not "near-identity" — we deliberately designed
the schema on universal merit rather than to minimize any one host's adapter. That
trade is correct: a better schema for *every* consumer beats a cheaper adapter for
*one*. The host's catalog stops being hand-authored trees and becomes **imported
blocks + this adapter.**

**Email.** A host's email renderer (sparx: `@sparx/email`) consumes the neutral tree
as a structured host and produces inline styles under the email-degradable subset.
silicaui ships **no** email compiler; `emailEligible` (§6.1) is a vocabulary flag the
host's renderer honors.

**Isolation comes home.** The `[data-theme]` island + `@scope` isolation a host's
current builder reimplements by hand is silicaui's *own* model (§5, §9.3) — adopting
the builder puts that layering back with the system that defines it.

---

## Open items folded from review (to resolve while filling the stubs)

- Name the canonical semantic color set on merit (`danger` over `error`; `dashed`
  over `dash`) and alias the daisyUI names for compatibility; add field
  `filled`/`ghost` variants. (Vocabulary lives in the CSS layer.)
- Improve the standalone `-content` fallback beyond a fixed lightness threshold.
- ~~Confirm the atom registry (component name → markup) as the shared contract
  between `toHtml`, `toReact`, and the builder canvas.~~ **Done** — it's the
  `ComponentDef` **component registry**: each component is a macro that expands to an
  element subtree, so every projection renders it through one element path and a new
  component adds a def, not a renderer branch.
