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
props.repeat?: { ref: string; omitWhenEmpty?: boolean; limit?: number };  // resolve a COLLECTION; render children once per item (or drop the node entirely if empty and opted in), at most `limit` of them
props.action?: { ref: string; href?: string };  // this node TRIGGERS a host action on interaction
```

- **`bind`** — "fill this node from data." Engine asks `host.resolveBinding(ref, scope)` → `{ value, label, visible? }`, shows the value, paints a "bound" chip with the label. Absent host resolver → the node's static placeholder content renders (so a **static-site builder needs no host data at all**). `visible: false` drops the node (and its subtree) from resolved output entirely — the one conditional-visibility primitive the engine supports, with no expression language attached (see the roadmap doc §1 for why this is the whole surface, deliberately).
- **`repeat`** — "this container repeats." Engine asks the host to resolve the collection ref → an array, renders `children` once per item, and passes the **resolved item itself** back down (not a path — see `DataScope` below) so inner `bind`s resolve per item. The engine owns the *repetition*; the host owns the *data*. Zero items renders the authored `children` **once, as a placeholder** by default (so an empty-but-not-yet-loaded collection still shows its template in the editor); `repeat.omitWhenEmpty: true` opts a specific node out of that convention, dropping it entirely instead — same effect as a `bind`'s `visible: false`, for a host whose live site should render nothing rather than an empty shell (e.g. a "related products" block with no matches).

  `repeat.limit` is the **per-instance** count: at most that many items render. It exists because the ref and the count are different questions and the ref cannot answer both — a `DataSource.key` says what a source *is*, and `scopeAt` narrows a descendant's bindable fields by matching an ancestor's ref against that key, so a ref carrying an options suffix (`products|limit=4`) matches nothing and silently empties the inner field list. One catalog wanting a strip of 4 above the fold, a full grid at `/shop` and a rail of 12 on the product page is **one source and three counts**; without `limit` the count is whatever the host chose when it fetched, uniform per source across the whole site. It caps how many items **load**, not how many are visible at a time — a carousel showing 4 of 12 is layout (`basis-1/4` on a snap rail), and keeping those two numbers apart is deliberate. Must be a positive integer; anything else is ignored, so a malformed limit renders the whole collection rather than nothing. A host doing its own pre-fetch walk reads `limit` off the tree and narrows the query, and can share the engine's clamp via the exported `applyCollectionLimit(items, limit)`.
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
  // `hide` matches item keys OR whole group keys, and covers the host-component
  // rows below (`host:<name>`) as well as the built-in ones.
  catalog?(): { extend?: CatalogEntry[]; hide?: string[] };

  // DATA SOURCES — the flat, host-computed-ONCE catalog that powers the binding
  // picker (Q6). The engine derives per-node availability itself via the exported
  // `scopeAt(dataSources, ancestors)` helper (walks a node's ancestors; a `repeat`
  // ancestor narrows the returned sources to `item.*` fields) — that narrowing is
  // pure tree structure, not domain knowledge, so it's the engine's job, not the
  // host's. Absent `dataSources` → the Inspector's Bind picker falls back to a raw
  // ref text input.
  dataSources?(): DataSource[];

  // THEMES — the shelves the Themes panel offers as starting points, for a
  // PLATFORM that curates a brand catalog centrally across every site it hosts.
  // Same merge shape as `catalog()`: `extend` adds labeled shelves (rendered
  // ABOVE the shipped presets), `hide` prunes SHIPPED entries by preset name, by
  // the shipped shelf key (`'silicaui'`), or `'*'` for all of them — the
  // white-label case. `hide` never touches the host's own `extend`.
  //
  // A host theme whose `name` matches a shipped preset SHADOWS it (host wins,
  // logged): the name IS the `[data-theme]` value, so two token bags cannot share
  // one. Host shelves are apply-only — no delete affordance, unlike the site's
  // own `savedThemes` ("This site"), which stays the author's editable library.
  //
  // Applying COPIES the theme into `site.theme`. A site that adopts a host preset
  // holds a snapshot, so later edits to this catalog do NOT propagate to sites
  // already on it — deliberate (the author can edit an applied theme and a live
  // upstream overwrite would discard their work), but a host's own UI must not
  // promise propagation.
  themes?(): { extend?: ThemeGroup[]; hide?: string[] };

  // POLICY — the class allowlist. The engine calls this before committing ANY class
  // string (hand-typed OR AI-generated); a rejected class never enters the document.
  // This COMPOSES with a built-in engine floor (the fixed/z-[…]/content-[…]/url()
  // denylist, §9) that a host can only ADD to, never lift — the insecure state
  // (accidentally loosening the floor) is structurally unrepresentable. Most hosts
  // don't need custom logic; use `buildClassValidator({ blocks })` (§9) instead of
  // hand-writing this function.
  validateClass?(cls: string): { ok: true } | { ok: false; reason: string };

  // PANELS — host-contributed inspector SECTIONS for specific node types (SEO,
  // product-pin, a per-module editor), rendered after the built-in sections
  // INSIDE the Settings tab. ADDITIVE only — a host panel never replaces a
  // built-in one. `ctx` exposes the engine's own mutation primitives
  // (setProp/setData/…) so a host panel writes through the same paths the
  // built-ins use, never a second node-mutation API.
  inspectorPanels?(node: BuilderNode): InspectorPanel[];

  // TABS — the coarse half of the same seam: a whole panel in the inspector
  // rail, a top-level peer of Design and Settings. This is how a host adds a
  // PANEL to the right rail rather than a section within one.
  //
  // Called with the selected node, or `undefined` when nothing is selected.
  // Return node-scoped tabs conditionally and panel-scoped tabs unconditionally
  // (see below) — a host that filters everything on `node` makes its own
  // document-level panel unreachable the moment the author clicks empty canvas.
  inspectorTabs?(node: SelectableNode | undefined): InspectorTabDef[];

  // ASSETS — the media picker. The engine invokes it when an image/video slot
  // asks for a source; the host returns a ref (and owns upload, the library, CDN).
  pickAsset?(kind: 'image' | 'video'): Promise<AssetRef | null>;

  // HOST COMPONENTS — the regions the HOST renders (a cart, a related-posts
  // strip, an analytics tile). Each def becomes an Insert palette row that
  // places a `host` node, and `renderHostNode` draws it live on the canvas.
  // Absent → the builder offers no host nodes; a static-site host needs neither.
  //
  // The def is the component's whole identity, and every field of it is read:
  // `icon` is the row's glyph AND the Navigator/Inspector glyph, `hint` is its
  // tooltip and a search field, `label` is stamped onto the placed node so the
  // rail never shows the allowlist key. `category` is DISPLAY COPY — a category
  // naming a built-in group merges into it rather than repeating its heading.
  //
  // These rows are the one part of the palette the host does NOT author, so
  // `catalog().hide` reaches them by key (`host:<name>`): registering a
  // component is what makes it render and take props, and a host frequently
  // wants that WITHOUT offering it for direct placement — when it's the raw
  // ingredient of a curated block rather than a finished thing.
  hostComponents?(): HostComponentDef[];

  // Live canvas preview of a host node — the host renders its real component.
  // Absent (or returns null) → the engine draws a labeled placeholder.
  renderHostNode?(node: HostNode, ctx: { preview: boolean }): ReactNode;

  // NOTE: change notification is NOT on the host object — it's a `<Builder>`
  // prop, `onChange(site, ops, meta)`. See §5.1.
}

// A tab is either about the SELECTED NODE (the default, and what the built-in
// Design/Settings are) or about the DOCUMENT/session. The distinction is not
// cosmetic: it decides whether the tab renders with an empty selection, and
// whether the rail shows its node chrome (identity header, Duplicate/Delete)
// alongside. A panel-scoped tab deliberately receives NO node and NO mutation
// ctx — those are per-node primitives, and handing them to a tab that is showing
// something else invites it to edit "the selection" while displaying a history.
type InspectorTabDef =
  | { id: string; label: string; icon?: string; order?: number; scope?: 'node';
      render(node: SelectableNode, ctx: InspectorPanelCtx): ReactNode }
  | { id: string; label: string; icon?: string; order?: number; scope: 'panel';
      render(): ReactNode };

// An outlet is a layout placeholder, not a thing with properties — the rail
// treats it as no selection at all, so a node-scoped tab is never handed one.
type SelectableNode = Exclude<BuilderNode, { kind: 'outlet' }>;

interface InspectorPanel {
  id: string;
  title: string;
  order?: number;
  render(node: BuilderNode, ctx: InspectorCtx): unknown; // a host-rendered subtree
}

interface HostComponentDef {
  name: string;      // the allowlist key matched against a host node's `component`
  label: string;     // what the AUTHOR reads; stamped onto the placed node
  category?: string; // the group heading, verbatim (default "Host")
  icon?: string;     // a registered icon name; unknown → the plug, warned once
  hint?: string;     // the row's tooltip + a ranked search field
  props?: HostPropDef[];              // → the Inspector's Host panel
  defaultProps?: Record<string, unknown>;
  defaultClass?: string;              // LITERAL safelist strings
  pinned?: boolean;                   // insert host-LOCKED (author cannot clear)
}

interface DataSource {
  key: string;
  label: string;
  cardinality: 'scalar' | 'array' | 'object';
  fields?: DataSource[]; // nested shape, for scopeAt's ancestor-narrowing walk
}

interface ThemeGroup {
  key: string;    // hide matches this to drop the whole shelf; same-keyed groups merge
  label: string;  // the shelf heading, verbatim
  themes: Theme[];
}
```

Every field is optional. A host that passes no adapter at all gets a working static-site builder off the default catalog. Add `catalog`/`dataSources`/`resolveBinding`/`resolveCollection`/`inspectorPanels`/`inspectorTabs`/`pickAsset`/`themes` and it builds a full commerce/CMS site — **without the engine gaining a single line of domain code.**

### 5.0.1 Where host UI can go

The rails are not uniformly open, and the asymmetry is deliberate:

| Surface | Seam | Grain |
| --- | --- | --- |
| Right rail — a whole panel | `inspectorTabs()` | A tab beside Design/Settings. Node- or document-scoped. |
| Right rail — a few fields | `inspectorPanels()` | A section inside Settings, after the built-ins. |
| Header — status | `toolbarStatusSlot` | Leads the right cluster. Facts, not controls. |
| Header — actions | `toolbarSlot` | Buttons, beside Publish. |
| Footer | `statusBarSlot` | Session facts, after the engine's own. A fact may disclose its own detail (`StatusItem`); it may not act. |
| Left rail | *(none)* | Contents extend via `catalog()` / `componentStarters()` / `themes()`; the rail's own structure does not. |

Pick the grain that matches the contribution. A host that wraps three fields in a tab has buried them behind a click; a host that stuffs a change-history log into a Settings section has put a document-level surface under a node-level heading, where it disappears the moment nothing is selected.

**Status vs action, and the one thing that is both.** The two status slots take facts and the two action slots take controls, which is why the engine's own `mode` and `device` read in the footer rather than beside the toggles that set them. The exception is a status item that discloses its **own** detail — clicking "3 broken" to see which three. That is reading the same fact at more depth, not a second action, and splitting it (a count in the strip, its trigger two floors up in the toolbar) is what stops a status bar being one. Use `StatusItem`:

```tsx
import { StatusItem } from '@wizeworks/silicaui-builder/react';

<StatusItem onClick={() => setOpen(!open)} expanded={open} controls="site-check">
  3 broken · 15 to fix
</StatusItem>
```

With no `onClick` it is a plain `<span>` — no tab stop, identical to the engine's own labels. With one it is a ghost `btn-xs`: 24px inside the 28px strip, so the row height never moves, and it carries `aria-expanded`/`aria-controls`. Anything that **acts** — send, save, publish, navigate away — is a `toolbarSlot` button instead; `expanded` is the test, since an item with no disclosed panel to point at is an action in a status item's clothes.

**The inspector rail has no header of its own** — its tab strip *is* the header. There is no title to theme or override, and a host tab reads as a peer of the built-ins rather than a guest inside them. When the tabs outgrow the rail's width, the strip pages with explicit circle buttons that take layout space beside it; there is no horizontal scrollbar, and nothing is hidden under an overlay.

The **email** builder carries the same two inspector seams, under `EmailBuilderHost`, with the same scopes and the same merge rules. It has no Theme-mode seam and needs none: there is no `[data-theme]`/custom-property mechanism in email HTML — Outlook and Gmail don't support it — so a host hands it one resolved `Theme` prop and the builder folds that into its color defaults. See "The email builder carries the same contract" below.

**Merge rules for `inspectorTabs`** (all rejections warn once on the console — a contribution that silently never renders is indistinguishable from a builder bug):

- `design` and `settings` are the builder's own ids; a host tab claiming one is **rejected, not shadowed**. Letting a host replace Design would silently remove the only way to style a node.
- Duplicate host ids: first wins.
- Blank `id` or `label`: rejected (an unlabeled tab is unreachable).
- Unknown `icon`: the tab renders without one.
- `order` sorts against the built-ins — Design is `0`, Settings is `10`, an omitted `order` lands after both. Sorting is stable, so tabs without one keep the order the host returned them in.
- A node-scoped tab that stops being returned **while it is open** falls back to Design rather than blanking the rail.

---

## 5.0.2 Other editors — presence in

Two authors on one page is already safe: per-node last-write-wins, the op log and draft history keep the document right whatever order edits arrive in. What it lacked was anyone to blame. Edits appeared with no warning and no attribution — a heading rewriting itself under your cursor, with nothing on screen connecting that to the count in the toolbar.

Hand the engine whatever presence you already relay:

```ts
interface Peer {
  id: string;                     // stable per connection (a socket id)
  name: string;                   // what the editor calls them on screen
  color?: string;                 // defaults to a stable one derived from `id`
  selection?: readonly string[];  // DRAWN
  claim?: readonly string[];      // ENFORCED — each covers a node and its subtree
}

<Builder peers={roster} />        // or editor.setPeers(roster) — same thing
```

Pass the full roster on every change; the engine diffs it, so a heartbeat carrying no news costs nothing.

**`selection` is drawn.** A dashed, named ring on the canvas in that peer's color — the same measured geometry the local selection ring uses, sitting one layer below it — plus a dot on the Navigator row. Selections, not cursors: the document is a node tree with no x/y (the same reason pixel nudge and alignment guides were declined), and "Ana is in this block" is the fact that matters. Pass it alone and you gain attribution and change nothing else.

**`claim` is enforced.** Every node mutation inside a claimed subtree becomes a no-op, the canvas drops that subtree's write affordances (no drag, no drop target, no in-place edit, `cursor-not-allowed`), the Navigator won't rename inside it, and the Inspector names the holder. Reads are untouched — you can select a held node and read its classes, and the rail telling you *why* nothing lands is the point.

A claim is the **soft** half of a lock, and deliberately not `setLocked`:

| | `setLocked(id, …)` | `claim` |
| --- | --- | --- |
| Lives in | the document | this editor's memory |
| Relayed | yes, as an op | never |
| Undoable | yes | nothing to undo |
| Means | "this region is policy" | "someone is typing in here right now" |

So the host owns a claim's lifetime — start one on focus, end it on blur or a timeout. A lock that outlived its holder's tab is a support ticket; a claim that does is a stale ring you can clear by relaying a roster without it.

It is **not** correctness machinery, and one consequence is load-bearing: **`applyRemoteOps` ignores claims entirely**, including the claim held by the peer whose ops are arriving. A claim that blocked remote ops would make the feature actively destructive — the holder would find their own work silently dropped on every other client. Claims exist to stop two people making a mess they then have to untangle by hand, not to keep the document consistent; the op log already does that.

Two smaller rules, both chosen to match `locked` rather than invent a second model: a claimed node can still be **duplicated** (the copy lands beside the subtree, not in it, so it changes nothing the holder can see), and a claim on a node in another tree — a frame node while the spine is on a page body — says nothing, exactly as a cross-tree `select` does.

`peerColor(peer)` is exported so a host's own presence UI paints a person the same color the ring does; one person in two colors is worse than no color at all. Peer color is deliberately **not** a theme role: a peer painted `primary` disappears into a document built on that theme, and an eight-role palette collides as soon as there are more than a few people.

Engine behaviour is pinned by `verify:peers`; the drawn half by `e2e/peers.spec.ts`.

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

One shared op **does** exist in both vocabularies: `node.setLocked`, which pins a
node against remove/move. See
[email-frame-and-locking.md](email-frame-and-locking.md) for that and for
`<EmailBuilder frame>` — host chrome composed around an email without ever
entering the document the host persists.

The email schema also carries a node the site tree doesn't need, because the
site tree can express it with an `<a>` element: a **`link` group**, which holds
one destination for the blocks inside it. That is how a card inside a
`collection` repeat deep-links to its own record — the group binds `href` per
item while each child keeps its own marker for its own field. It projects by
distributing the link onto each child's own inline anchor rather than wrapping
the card in one, because an anchor around block-level content is dropped by
Outlook's Word engine. See [email-link-groups.md](email-link-groups.md).

### The saved-block library — a controlled prop, not host write hooks

The Insert palette's **Saved** section (blocks an author saved with "Save as
block") defaults to this browser's `localStorage`: durable across reloads and
across every email document opened here, but not across a device or a user, and
not shareable. A host lifts that ceiling by owning the list:

```ts
savedBlocks?: readonly SavedBlock[];
onSavedBlocksChange?(next: SavedBlock[], change: SavedBlockChange): void;
// change: {type:'save', block} | {type:'rename', id, name} | {type:'delete', id}
```

Supplying `savedBlocks` makes the library **controlled** in the ordinary React
sense: the builder renders exactly that array, writes nothing to browser storage,
and keeps no copy of its own. That is the whole reason this is a value/onChange
pair rather than the `catalog()`-style read plus three fire-and-forget write
callbacks it superficially resembles. Those callbacks would leave the builder
holding an optimistic shadow list with no defined reconciliation: a
server-assigned id, a rejected save, or another user's concurrent edit would each
drift the palette away from the account with nothing to correct it. Here the
host's persisted list *is* the rendered list, so all three reconcile by
re-rendering.

The corollary a host must implement: apply `next` to your own state immediately
to keep the palette responsive while the request is in flight, since until the
prop updates the palette still shows the previous list. A failed save then needs
no special handling — don't apply `next`, and the block simply never appeared.

Two other shapes fall out of the same prop pair. `savedBlocks` **without**
`onSavedBlocksChange` is an insert-only curated library — the builder hides
Save/rename/delete rather than offering controls that silently do nothing. And an
**empty** `savedBlocks` array is a real empty account library, not a fallback to
local: presence of the prop, not its contents, is what transfers ownership.

Migrating an existing install: `readLocalSavedBlocks()` returns whatever this
browser accumulated before the host took over (key
`silicaui-email-saved-blocks`), and `clearLocalSavedBlocks()` drops it once the
account has durably stored the upload. Skip that and an author's existing blocks
vanish from the palette the moment `savedBlocks` is first supplied.

This is deliberately NOT how the site builder's reusable components work: symbols
live on `Site.symbols`, inside the document, and reach the host through the
ordinary `onChange`. That's right for symbols (a symbol is scoped to the site
that instantiates it, and instances must resolve against the same document) and
wrong for saved blocks, which are an account-level library spanning every project
a user opens.

---

## 6. Engine owns vs. host owns (the focus table)

| Concern | Engine (`@wizeworks/silicaui-builder`) | Host (sparx) |
|---|:---:|:---:|
| Render @wizeworks/silicaui tree faithfully (preview==prod) | ● | |
| Select / drag / edit / add / duplicate | ● | |
| Palette, layers tree, inspector *framework* | ● | |
| Theme editing (`[data-theme]` tokens) | ● | |
| Theme *starting points* (shipped presets / brand catalog) | ● (shipped) | ● (platform shelves, `themes()`) |
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
- [ ] `BuilderHost` (§5): `catalog` + `validateClass` required (`onChange` is a `<Builder>` prop, §5.1); `resolveBinding` + `resolveCollection` + `inspectorPanels` + `inspectorTabs` + `pickAsset` optional.
- [ ] Canvas renders preview==production under a `[data-theme]` island with `@scope` isolation (§8); editor chrome on its own token lane.
- [ ] Direct manipulation: select/multi-select, drag reorder+reparent, add (from catalog)/remove/duplicate/paste, edit class + props + slots.
- [ ] Layers tree, inspector framework (generic panels + host panels), theme panel, device preview, undo/redo, behavior preview.
- [ ] Zero domain vocabulary in the engine — grep the package for "product", "cms", "tenant", "order": there must be no hits.

That last checkbox is the whole point. If the engine's source mentions a sparx concept, the seam leaked and it's drifting back toward the everything-machine. Keep it domain-blind and it stays the focused tool that builds great sites.