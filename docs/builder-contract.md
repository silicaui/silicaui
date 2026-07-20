# @wizeworks/silicaui-builder — Engine & Host Contract

**Version:** 1.1
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-09

> **v1.1 changelog** (see [builder-engine-roadmap.md](builder-engine-roadmap.md) for the full reasoning): `resolveBinding`/`resolveCollection` are now synchronous-only (§3); `DataScope` carries the resolved item, not a path (§3); `Resolved` gained `visible` (§3); a new `resolveTree` primitive is specced (§3); `catalog()` uses merge semantics (§5); a new `dataSources()` + engine-owned `scopeAt()` power the binding picker (§5); `validateClass` now composes with a built-in, non-optional floor (§5, §9); a new §9 specs the raw-element/attribute whitelist as an unconditional engine floor.

> **Purpose.** `@wizeworks/silicaui-builder` is a **domain-blind visual editor for @wizeworks/silicaui documents**. It loads a document (a @wizeworks/silicaui node tree + a theme), lets a human manipulate it directly (select, drag, edit, add blocks, tune the theme), and extracts the document back — in the *same shape it loaded*. It knows @wizeworks/silicaui: nodes, classes, tokens, themes, slots, blocks, behaviors. It knows **nothing** about products, CMS entries, orders, tenants, versioning, or publishing. Every one of those enters through a single **host adapter** as opaque references and callbacks.
>
> **Read this first, one line:** the contract is two surfaces — **the document it loads/extracts** (§2) and **the host seam it plugs into** (§5). Get those two right and the builder is a focused tool that any host can mount; get them wrong and you rebuild the fused everything-machine under a new name. The whole design is: *the engine is generic, the host is specific, and the boundary between them is opaque references.*

---

## 0. What it is — and what it deliberately is NOT

The current sparx builder is "OK" because the editing engine is **fused** with every sparx domain. This contract exists to un-fuse it.

**The engine owns (its whole job):**
- Render a @wizeworks/silicaui document faithfully — **preview == production** (same @wizeworks/silicaui, same `[data-theme]`, same behaviors).
- Direct manipulation: select, multi-select, drag-reorder/re-parent, edit props + classes, add/remove/duplicate/paste nodes.
- The **palette** (stamp @wizeworks/silicaui blocks + components), the **layers tree**, the **inspector framework**.
- **Theme editing** (the `[data-theme]` token set the canvas renders under).
- Responsive **device preview** (container-query widths), **undo/redo**, keyboard + a11y.
- **Behavior preview** (@wizeworks/silicaui-behaviors, autoplay suppressed for authoring).
- The **`[data-theme]` island + `@scope` isolation** (§8) — because that's @wizeworks/silicaui's own model, not a host concern.
- **Load and extract** a clean, portable document.

**The engine does NOT own (all of it is a host plug):**
- What a binding *resolves to* — products, CMS entries, collections, prices. It sees an **opaque ref** and asks the host (§3).
- **Persistence, versioning, publish, tenancy, RLS.** It emits changes; the host saves.
- The **security policy.** The host supplies the class allowlist; the engine enforces it via a hook (§5).
- **Domain inspector panels** (SEO, product-pin, per-module editors) — host-contributed (§5).
- **Multi-site / multi-property scoping, email projection, the `custom:*` component system.** Host concerns. The engine edits **one document at a time.**

If a capability is about *how a great site is built and edited*, it's the engine's. If it's about *what the content means to a specific business*, it's the host's.

---

## 1. The one-shape principle

There is exactly **one** node shape, and it is the same shape in four places: what loads, what extracts, what persists, and what @wizeworks/silicaui-blocks are authored in. **No translation layer, ever.**

```
@wizeworks/silicaui-blocks (id-free templates)
        │  stamp → mint ids
        ▼
BuilderDocument.root  ═══ loaded ═══► [ EDIT ] ═══ extracted ═══►  BuilderDocument.root
        │                                                                    │
        └──────────────── host persists this exact shape ◄──────────────────┘
```

Today's builder pays a tax at every boundary because its internal node model needs adapters to and from blocks, persistence, and rendering. Here the loaded document, the edited state, the extracted document, and the stored record are byte-compatible. The only transform in the whole system is **block template → document node** (add ids), and it runs once, at stamp time.

---

## 2. The document — what loads and extracts

This is the structure you asked for. Load hands the engine a `BuilderDocument`; extract returns one; they are the same type.

```ts
interface BuilderDocument {
  version: string;              // contract schema version (semver)
  root: BuilderNode;            // the editable tree — a SINGLE root
  theme: ThemeConfig;           // the [data-theme] tokens the canvas renders under
  frame?: DocumentFrame;        // optional surrounding layout (header/footer/nav) — see below
}

interface BuilderNode {
  id: string;                   // GLOBALLY-UNIQUE instance id — selection, React keys, dnd ids.
                                // (This is the ONE addition over a @wizeworks/silicaui-blocks BlockNode,
                                //  which is id-free. Stamping a block mints these.)
  type: string;                 // 'el:<tag>' (raw element) | '<SilicaComponent>' (Button, Card, …)
  class?: string;               // @wizeworks/silicaui classes + allowed utilities — the ONLY styling surface
  props?: Record<string, unknown>;  // text, whitelisted attrs, component props, + markers (§3)
  children?: BuilderNode[];
}

interface ThemeConfig {
  name: string;                 // the [data-theme] value applied to the canvas root (e.g. 'tenant-x')
  tokens: Record<string, string>;   // --color-*, --color-*-content, --radius-*, --size-*, fonts, --spacing…
  mode?: 'light' | 'dark';      // which mode this token set expresses; the engine can preview either
}

interface DocumentFrame {
  root: BuilderNode;            // a layout tree containing EXACTLY ONE Outlet node
  editable: boolean;            // true → chrome is selectable (studio); false → locked backdrop
}
```

Notes that matter:

- **`id` is the only delta from a @wizeworks/silicaui-blocks node.** Blocks are id-free templates; document nodes are live instances that need stable identity for selection and drag. Ids must be **globally unique and persisted** (not a per-session counter) — the same invariant sparx already learned the hard way, because ids double as React keys and dnd-kit sortable ids.
- **`class` is the sole styling channel.** No inline style object, no second styling surface. Everything — layout, spacing, surface, skin — is @wizeworks/silicaui classes + the allowed utility subset (the host's allowlist gates them, §5).
- **`frame` is how a page edits inside its layout.** The engine renders `frame.root` as a backdrop (locked or editable) and drops `root` at the frame's single `Outlet` node — the same composition the site ships, so header/footer/nav preview correctly. Omit it to edit a bare tree (or to edit the layout *as* the root). The two trees are **always composed together on one canvas**; a mode toggle (Layout ⇄ Page) flips which one is the live *editable* target while the other renders inert as visual context — never truly simultaneous dual-editing, and deliberately so: one active tree means one undo history and one save-debounce at any moment, while still showing the real chrome around whatever you're editing. This is the engine's answer to "can it edit more than one document at once" — see the roadmap doc §4.
- **`theme` loads and extracts too.** A theme panel edits `theme.tokens`; the mutated theme comes back in `extract()`. The theme is native @wizeworks/silicaui — a token map applied via `[data-theme]`.

---

## 3. Dynamic content — three opaque primitives (the focus keystone)

This is the single most important decision in the whole contract. A site builder for a real platform needs dynamic content (a product grid, a blog list, an add-to-cart button). But the **engine must not know what any of it means.** It carries **three generic dynamic primitives**, each a node marker holding an **opaque reference** the engine never parses — it just hands the ref to the host and renders what comes back.

```ts
// A node's props may carry AT MOST one of these markers:

props.bind?:   { ref: string };              // resolve a VALUE for this node (text, image, price…)
props.repeat?: { ref: string; omitWhenEmpty?: boolean };  // resolve a COLLECTION; render children once per item (or drop the node entirely if empty and opted in)
props.action?: { ref: string; href?: string };  // this node TRIGGERS a host action on interaction
```

- **`bind`** — "fill this node from data." Engine asks `host.resolveBinding(ref, scope)` → `{ value, label, visible? }`, shows the value, paints a "bound" chip with the label. Absent host resolver → the node's static placeholder content renders (so a **static-site builder needs no host data at all**). `visible: false` drops the node (and its subtree) from resolved output entirely — the one conditional-visibility primitive the engine supports, with no expression language attached (see the roadmap doc §1 for why this is the whole surface, deliberately).
- **`repeat`** — "this container repeats." Engine asks the host to resolve the collection ref → an array, renders `children` once per item, and passes the **resolved item itself** back down (not a path — see `DataScope` below) so inner `bind`s resolve per item. The engine owns the *repetition*; the host owns the *data*. Zero items renders the authored `children` **once, as a placeholder** by default (so an empty-but-not-yet-loaded collection still shows its template in the editor); `repeat.omitWhenEmpty: true` opts a specific node out of that convention, dropping it entirely instead — same effect as a `bind`'s `visible: false`, for a host whose live site should render nothing rather than an empty shell (e.g. a "related products" block with no matches).
- **`action`** — "this is a trigger" (a button that adds to cart, submits, navigates). Inert in the editor; the host wires it on the live site by attaching one delegated listener (click/submit) at its app root keyed on `[data-sui-action]`, reading the ref off the DOM node. No package owns this wiring — it's a five-line host pattern, not engine or `silicaui-behaviors` code.

The host maps its own vocabulary onto these three. sparx's four-kind spine (field / entity / collection / action) collapses cleanly: field + entity → `bind`, collection → `repeat`, action → `action`. **A different host with a different data model implements the same three callbacks and gets the same builder.** That opacity is what keeps the engine focused and reusable.

```ts
/** Threaded down through a `repeat` walk. Carries the actual resolved item —
 *  not a structural path — so a nested `bind` never has to re-derive "which
 *  item am I on" by re-resolving the collection. The engine never inspects
 *  `item`; it's opaque cargo, same as `ref`. */
type DataScope = { item?: unknown; index?: number };
```

### Resolution is synchronous — the host pre-loads, the walk never awaits

`resolveBinding`/`resolveCollection` are **synchronous**. A host with an async data source (a DB call, an API) fetches **once, up front**, into whatever closure or cache its synchronous resolver then reads from — the resolving walk itself never awaits mid-tree. This sidesteps the waterfalls and "what renders while this one binding is still loading" problem an async-per-node API creates, and matches the one production reference implementation this contract is modeled on (sparx's `runtime.ts`, which pre-loads all data before a fully synchronous render walk, on both the editor-preview and the live-site paths).

```ts
type Resolved = { value: unknown; label?: string; visible?: boolean };

interface ResolveHost {
  resolveBinding?(ref: string, scope: DataScope): Resolved;
  resolveCollection?(ref: string, scope: DataScope): unknown[];
}

/** The Q3/Q19 keystone: ONE walker owns bind + repeat + action together (not
 *  just leaf rendering — see the roadmap doc §1 for why splitting repetition
 *  out, as sparx's two-walker split does, just recreates a sync seam). Pure,
 *  sync, ships in @wizeworks/silicaui-html. Absent both hooks → returns `tree`
 *  unchanged (a static host never has a reason to call this at all). Feeds
 *  BOTH the canvas's React walk and `toHtml` (`toHtml(resolveTree(root, host))`),
 *  so preview == production is structural, not hoped-for. */
function resolveTree(tree: Node, host: ResolveHost, scope?: DataScope): Node;
```

---

## 4. Load & extract

```ts
function mountBuilder(el: HTMLElement, opts: {
  document: BuilderDocument;
  host: BuilderHost;               // the seam (§5)
}): BuilderHandle;

interface BuilderHandle {
  extract(): BuilderDocument;      // current state — SYMMETRIC with the loaded shape
  getSelection(): string[];        // selected node ids
  select(ids: string[] | null): void;
  undo(): void; redo(): void;
  setDevice(d: 'desktop' | 'tablet' | 'mobile'): void;
  setThemeMode(m: 'light' | 'dark'): void;   // preview either mode of the loaded theme
  destroy(): void;
}
```

- **Load** = pass a `BuilderDocument`. That's the entire input.
- **Extract** = `extract()` returns the current `BuilderDocument`, same shape. The host decides when to call it (on `onChange`, on a Save button, on unload).
- **The engine never persists.** It edits in memory and notifies via the `<Builder>` `onChange(site, ops, meta)` prop (§5.1). Persistence, autosave-vs-explicit-save, versioning, conflict policy — all the host's call.

---

## 5. The host adapter — the seam

Everything domain-specific enters here. This is the *entire* sparx-facing surface; if it's not on this interface, the engine doesn't know it exists.

```ts
interface BuilderHost {
  // DATA — resolve the three opaque primitives (§3), synchronously. Omit
  // resolveBinding entirely for a static-site builder.
  resolveBinding?(ref: string, scope: DataScope): Resolved;
  resolveCollection?(ref: string, scope: DataScope): unknown[];

  // CATALOG — what the Add palette offers. Default: the @wizeworks/silicaui-blocks
  // index. MERGE semantics, not a flat replace — a host adding one domain composite
  // should never have to re-enumerate the whole default index to keep it.
  catalog?(): { extend?: CatalogEntry[]; hide?: string[] };

  // DATA SOURCES — the flat, host-computed-ONCE catalog that powers the binding
  // picker (Q6). The engine derives per-node availability itself via the exported
  // `scopeAt(dataSources, ancestors)` helper (walks a node's ancestors; a `repeat`
  // ancestor narrows the returned sources to `item.*` fields) — that narrowing is
  // pure tree structure, not domain knowledge, so it's the engine's job, not the
  // host's. Absent `dataSources` → the Inspector's Bind picker falls back to a raw
  // ref text input.
  dataSources?(): DataSource[];

  // POLICY — the class allowlist. The engine calls this before committing ANY class
  // string (hand-typed OR AI-generated); a rejected class never enters the document.
  // This COMPOSES with a built-in engine floor (the fixed/z-[…]/content-[…]/url()
  // denylist, §9) that a host can only ADD to, never lift — the insecure state
  // (accidentally loosening the floor) is structurally unrepresentable. Most hosts
  // don't need custom logic; use `buildClassValidator({ blocks })` (§9) instead of
  // hand-writing this function.
  validateClass?(cls: string): { ok: true } | { ok: false; reason: string };

  // PANELS — host-contributed inspector panels for specific node types (SEO,
  // product-pin, a per-module editor). The engine renders the generic panels
  // (class, props, slots, theme) and slots these in beside them — ADDITIVE only
  // in v1, a host panel never replaces a built-in one. `ctx` exposes the engine's
  // own mutation primitives (setProp/setData/…) so a host panel writes through the
  // same paths the built-ins use, never a second node-mutation API.
  inspectorPanels?(node: BuilderNode): InspectorPanel[];

  // ASSETS — the media picker. The engine invokes it when an image/video slot
  // asks for a source; the host returns a ref (and owns upload, the library, CDN).
  pickAsset?(kind: 'image' | 'video'): Promise<AssetRef | null>;

  // NOTE: change notification is NOT on the host object — it's a `<Builder>`
  // prop, `onChange(site, ops, meta)`. See §5.1.
}

interface InspectorPanel {
  id: string;
  title: string;
  order?: number;
  render(node: BuilderNode, ctx: InspectorCtx): unknown; // a host-rendered subtree
}

interface DataSource {
  key: string;
  label: string;
  cardinality: 'scalar' | 'array' | 'object';
  fields?: DataSource[]; // nested shape, for scopeAt's ancestor-narrowing walk
}
```

Every field is optional. A host that passes no adapter at all gets a working static-site builder off the default catalog. Add `catalog`/`dataSources`/`resolveBinding`/`resolveCollection`/`inspectorPanels`/`pickAsset` and it builds a full commerce/CMS site — **without the engine gaining a single line of domain code.**

---

## 5.1 Changes out, changes in (state **and intent**)

Change notification is a `<Builder>` prop, not a host method:

```ts
onChange(site: Site, ops: readonly Op[], meta: { baseSeq: number }): void;
```

**`site`** is the whole document, as it always was. Storing it verbatim is correct
for a single author and **lossy for two**: both hold a complete `Site`, so whoever
saves last silently reverts the other's work on pages they never opened.

**`ops`** is what the author *did* — semantic operations in causal order (see
`src/site/ops.ts`). Apply these instead and two authors can edit one site without
erasing each other. Three properties make them commute, which is what removes the
need for an operational-transform layer:

1. **Nodes are addressed by id**, never by index or tree path.
2. **Position is a fractional key** (`Node.ord`), not an index — so an insert
   touches only the inserted node and concurrent inserts can't collide.
3. **Property writes are shallow merges** — two authors editing different props
   of one node (copy and image, the common case) don't conflict.

Ops carry **intent, never ambient state**: a sender's view of the rest of the
document is stale by definition under concurrent edit. The rule is *anything
randomly minted must travel, anything computable must not* — which is why
`node.insert` carries a whole subtree and `symbol.delete` carries its detach
cascade (node ids are minted client-side and cannot be re-derived), while nothing
carries a slug roster or a sibling list.

`site.replace` is the escape hatch, emitted only where there is genuinely no
delta — today, undo/redo restoring a snapshot. **Its frequency is the signal that
the vocabulary has a gap**, not a shortcut.

Changes come back in through an imperative handle (a ref, not a prop — `document`
is read once at boot by design):

```ts
interface BuilderHandle {
  applyRemoteOps(ops: readonly Op[]): { applied: number; dropped: Op[] };
  replaceState(site: Site, seq: number): void;
  ackSeq(seq: number): void;
  setHistoryDelegate(delegate: HistoryDelegate | undefined): void;
}
```

Three rules a host needs to know:

- **Remote ops never echo and never become undoable.** Applying one emits a
  change event (the canvas must repaint) but no ops, so wiring `onChange`
  straight to a broadcast cannot loop.
- **A remote op invalidates local undo history.** A whole-document snapshot is
  only a truthful "before" while this client is the only writer; once another
  author's edit lands, undoing one would revert work this client never did.
  Supply a `HistoryDelegate` to keep undo working in a shared session — it is
  left untouched.
- **Persist the `site` argument at least once, not ops alone.** Loading a site
  that lacks a frame materializes one with fresh random ids, so two clients
  normalizing the same raw site independently can never converge. After the
  first save this is moot.

### The email builder carries the same contract

`<EmailBuilder>` emits `onChange(project, ops, meta)` and takes an
`EmailBuilderHandle` ref with the same four methods. Everything above — ops carry
intent not context, remote ops don't echo, remote ops invalidate local undo
unless a `HistoryDelegate` is supplied, `project.replace` is the escape hatch —
holds identically. A host integrating both builders writes the transport once.

The op **vocabulary** is smaller, because the email schema is closed. Email nodes
carry typed fields instead of a class string plus a props bag, so there is one
`node.update` where the site needs `setClass`/`setProps`/`setAttrs`/`setTag`, and
there are no symbol, frame, or page scopes — an email is one canvas, so those
don't exist rather than being stubbed. Two additions have no site equivalent:

- **`columns.rebalance`** — add/remove/duplicate-column rewrites every sibling
  column's `widthPct`. Emitting that as N separate updates would let a peer
  observe a row that briefly doesn't sum to 100, and would race badly against a
  concurrent column edit. One op keeps the row's invariant atomic.
- **`colors.set`** carries the resulting per-node `repaint`. Those colors are
  derivable from the palette in principle, but only by a receiver that
  reimplements the auto-color rules exactly — and drift between the two would
  paint two authors' canvases differently with neither noticing.

The closed schema is enforced on **incoming** ops too: a remote `node.insert` or
`node.move` that would nest a section inside a section is rejected, not applied.
A peer cannot smuggle in a structure the local editing API would have refused.

---

## 6. Engine owns vs. host owns (the focus table)

| Concern | Engine (`@wizeworks/silicaui-builder`) | Host (sparx) |
|---|:---:|:---:|
| Render @wizeworks/silicaui tree faithfully (preview==prod) | ● | |
| Select / drag / edit / add / duplicate | ● | |
| Palette, layers tree, inspector *framework* | ● | |
| Theme editing (`[data-theme]` tokens) | ● | |
| `[data-theme]` island + `@scope` isolation | ● | |
| Undo/redo, device preview, behavior preview | ● | |
| Load / extract the document | ● | |
| What a binding *means* (product/CMS/price) | | ● (opaque ref) |
| Persistence, versioning, publish, tenancy | | ● |
| Security allowlist *policy* | (enforces) | ● (defines) |
| Domain inspector panels (SEO, product-pin) | (hosts them) | ● (supplies) |
| Media library / upload / CDN | (invokes) | ● |
| Multi-site scoping, email projection, `custom:*` | | ● |

The rule of thumb: **the engine is about *editing*; the host is about *meaning and durability*.**

---

## 7. Relationship to the rest of @wizeworks/silicaui

`@wizeworks/silicaui-builder` completes the family and consumes the others natively:

- **@wizeworks/silicaui (CSS)** — the classes the document is made of; the canvas renders under it.
- **@wizeworks/silicaui-blocks** — the palette's default catalog. Because a block is the same node shape (minus ids), **stamping is native** — no adapter, just mint ids (§1). The `block → document node` transform *is* the only translation in the system.
- **@wizeworks/silicaui-behaviors** — the runtime the canvas previews (autoplay suppressed) and the live site runs.
- **@wizeworks/silicaui-react** — not required by the engine; a host may render extracted documents through it on React surfaces, but the engine renders the tree directly.

One node shape flows through all of them. That's the consistency that makes the whole thing tractable.

---

## 8. Isolation is native, not a host hack

The engine renders the document as a **`[data-theme]` themed island** (the canvas root carries `theme.name`; its tokens shadow the host's for everything inside) and **`@scope`s** the document's rules/reset so they don't leak into the surrounding host UI. This is not new machinery — it is **@wizeworks/silicaui's own island model** (a themed subtree inside a differently-themed host), which today's sparx builder reimplements by hand. Owning the builder in @wizeworks/silicaui puts that layering back with the model that defines it. The host provides the theme values; the engine does the isolation. (Editor chrome the engine draws inside the canvas uses its own token lane, never the document's palette — the same discipline that keeps a selection outline from inheriting a tenant's colors.)

---

## 9. Security floors — engine-owned, host may only tighten

Two floors that exist **unconditionally in the engine**, never behind an opt-in host hook — the same category of thing HTML-escaping already is. A host's `validateClass` (§5) composes *on top of* the first; the second has no host hook at all.

**The class-string floor.** `@wizeworks/silicaui-html`'s `lint.ts` denylist (`fixed`, arbitrary `z-[…]`, arbitrary `content-[…]`, any `url(...)`) runs as the built-in first gate on every class mutation (typed edit, paste, import, AI-assist) — today it only runs at build time against authored blocks; it must also run live, in the engine, at every `setClass` call site. `host.validateClass`, if supplied, runs *after* this floor and can only add restrictions:

```ts
type AllowlistRule = { kind: 'prefix' | 'exact' | 'substring'; value: string }; // never a free regex — avoids ReDoS

/** The declarative common case — most hosts never need to hand-write a validator.
 *  Always ANDs with the built-in floor. */
function buildClassValidator(config: { blocks: AllowlistRule[] }): BuilderHost['validateClass'];
```

**The raw-element/attribute floor.** `to-html.ts` renders `node.tag` and `attrs` verbatim today — no tag allowlist, no `on*` stripping, no `rel=noopener` enforcement, no URL scheme check. This is a live gap independent of the builder (any `el:<tag>` node with attrs is unsanitized output) and must be fixed regardless of host-seam work. `@wizeworks/silicaui-html` ships a canonical, closed whitelist (`element.ts`) enforced **unconditionally**, with no host hook:

- A closed tag set (excluding `script style object embed link meta base noscript template iframe`), each mapped to its allowed attribute keys.
- Attribute names are a **closed positive union** — `on*` handlers are excluded by never being enumerated, not stripped by pattern-matching (fails closed, not open).
- `rel="noopener noreferrer"` force-set whenever `target="_blank"`.
- `href`/`src` scheme-checked against a safe-URL pattern (relative / `http(s)` / `mailto` / `tel` / anchor only).
- Raw `style` attributes are never accepted, on any tag.

## 10. Definition of done — the minimal buildable surface

- [ ] `BuilderDocument` / `BuilderNode` / `ThemeConfig` / `DocumentFrame` types (§2), one shape shared with @wizeworks/silicaui-blocks (+ `id`).
- [ ] `mountBuilder(el, { document, host })` → `BuilderHandle` with `extract()` symmetric to load (§4).
- [ ] The three dynamic primitives (`bind` / `repeat` / `action`) as **opaque** markers resolved only through the host (§3).
- [ ] `BuilderHost` (§5): `catalog` + `validateClass` required (`onChange` is a `<Builder>` prop, §5.1); `resolveBinding` + `resolveCollection` + `inspectorPanels` + `pickAsset` optional.
- [ ] Canvas renders preview==production under a `[data-theme]` island with `@scope` isolation (§8); editor chrome on its own token lane.
- [ ] Direct manipulation: select/multi-select, drag reorder+reparent, add (from catalog)/remove/duplicate/paste, edit class + props + slots.
- [ ] Layers tree, inspector framework (generic panels + host panels), theme panel, device preview, undo/redo, behavior preview.
- [ ] Zero domain vocabulary in the engine — grep the package for "product", "cms", "tenant", "order": there must be no hits.

That last checkbox is the whole point. If the engine's source mentions a sparx concept, the seam leaked and it's drifting back toward the everything-machine. Keep it domain-blind and it stays the focused tool that builds great sites.