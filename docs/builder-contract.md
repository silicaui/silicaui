# silicaui-builder — Engine & Host Contract

**Version:** 1.0
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-05

> **Purpose.** `silicaui-builder` is a **domain-blind visual editor for silicaui documents**. It loads a document (a silicaui node tree + a theme), lets a human manipulate it directly (select, drag, edit, add blocks, tune the theme), and extracts the document back — in the *same shape it loaded*. It knows silicaui: nodes, classes, tokens, themes, slots, blocks, behaviors. It knows **nothing** about products, CMS entries, orders, tenants, versioning, or publishing. Every one of those enters through a single **host adapter** as opaque references and callbacks.
>
> **Read this first, one line:** the contract is two surfaces — **the document it loads/extracts** (§2) and **the host seam it plugs into** (§5). Get those two right and the builder is a focused tool that any host can mount; get them wrong and you rebuild the fused everything-machine under a new name. The whole design is: *the engine is generic, the host is specific, and the boundary between them is opaque references.*

---

## 0. What it is — and what it deliberately is NOT

The current sparx builder is "OK" because the editing engine is **fused** with every sparx domain. This contract exists to un-fuse it.

**The engine owns (its whole job):**
- Render a silicaui document faithfully — **preview == production** (same silicaui, same `[data-theme]`, same behaviors).
- Direct manipulation: select, multi-select, drag-reorder/re-parent, edit props + classes, add/remove/duplicate/paste nodes.
- The **palette** (stamp silicaui blocks + components), the **layers tree**, the **inspector framework**.
- **Theme editing** (the `[data-theme]` token set the canvas renders under).
- Responsive **device preview** (container-query widths), **undo/redo**, keyboard + a11y.
- **Behavior preview** (silicaui-behaviors, autoplay suppressed for authoring).
- The **`[data-theme]` island + `@scope` isolation** (§8) — because that's silicaui's own model, not a host concern.
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

There is exactly **one** node shape, and it is the same shape in four places: what loads, what extracts, what persists, and what silicaui-blocks are authored in. **No translation layer, ever.**

```
silicaui-blocks (id-free templates)
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
                                // (This is the ONE addition over a silicaui-blocks BlockNode,
                                //  which is id-free. Stamping a block mints these.)
  type: string;                 // 'el:<tag>' (raw element) | '<SilicaComponent>' (Button, Card, …)
  class?: string;               // silicaui classes + allowed utilities — the ONLY styling surface
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

- **`id` is the only delta from a silicaui-blocks node.** Blocks are id-free templates; document nodes are live instances that need stable identity for selection and drag. Ids must be **globally unique and persisted** (not a per-session counter) — the same invariant sparx already learned the hard way, because ids double as React keys and dnd-kit sortable ids.
- **`class` is the sole styling channel.** No inline style object, no second styling surface. Everything — layout, spacing, surface, skin — is silicaui classes + the allowed utility subset (the host's allowlist gates them, §5).
- **`frame` is how a page edits inside its layout.** The engine renders `frame.root` as a backdrop (locked or editable) and drops `root` at the frame's single `Outlet` node — the same composition the site ships, so header/footer/nav preview correctly. Omit it to edit a bare tree (or to edit the layout *as* the root).
- **`theme` loads and extracts too.** A theme panel edits `theme.tokens`; the mutated theme comes back in `extract()`. The theme is native silicaui — a token map applied via `[data-theme]`.

---

## 3. Dynamic content — three opaque primitives (the focus keystone)

This is the single most important decision in the whole contract. A site builder for a real platform needs dynamic content (a product grid, a blog list, an add-to-cart button). But the **engine must not know what any of it means.** It carries **three generic dynamic primitives**, each a node marker holding an **opaque reference** the engine never parses — it just hands the ref to the host and renders what comes back.

```ts
// A node's props may carry AT MOST one of these markers:

props.bind?:   { ref: string };              // resolve a VALUE for this node (text, image, price…)
props.repeat?: { ref: string };              // resolve a COLLECTION; render children once per item
props.action?: { ref: string; href?: string };  // this node TRIGGERS a host action on interaction
```

- **`bind`** — "fill this node from data." Engine asks `host.resolveBinding(ref, scope)` → `{ value, label }`, shows the value, paints a "bound" chip with the label. Absent host resolver → the node's static placeholder content renders (so a **static-site builder needs no host data at all**).
- **`repeat`** — "this container repeats." Engine asks the host to resolve the collection ref → an array, renders `children` once per item, and passes an **item-scoped** token back down so inner `bind`s resolve per item. The engine owns the *repetition*; the host owns the *data*.
- **`action`** — "this is a trigger" (a button that adds to cart, submits, navigates). Inert in the editor; the host wires it on the live site.

The host maps its own vocabulary onto these three. sparx's four-kind spine (field / entity / collection / action) collapses cleanly: field + entity → `bind`, collection → `repeat`, action → `action`. **A different host with a different data model implements the same three callbacks and gets the same builder.** That opacity is what keeps the engine focused and reusable.

```ts
type DataScope = { path: string[] };   // opaque structural scope (repeat ancestry); host interprets
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
- **Extract** = `extract()` returns the current `BuilderDocument`, same shape. The host decides when to call it (on `host.onChange`, on a Save button, on unload).
- **The engine never persists.** It edits in memory and notifies via `host.onChange`. Persistence, autosave-vs-explicit-save, versioning, conflict policy — all the host's call.

---

## 5. The host adapter — the seam

Everything domain-specific enters here. This is the *entire* sparx-facing surface; if it's not on this interface, the engine doesn't know it exists.

```ts
interface BuilderHost {
  // DATA — resolve the three opaque primitives (§3). Omit resolveBinding entirely
  // for a static-site builder. `resolveCollection` returns items; the engine
  // re-invokes resolveBinding with each item's scope.
  resolveBinding?(ref: string, scope: DataScope): Resolved | Promise<Resolved>;
  resolveCollection?(ref: string, scope: DataScope): unknown[] | Promise<unknown[]>;

  // CATALOG — what the Add palette offers. Default: the silicaui-blocks index.
  // The host curates (hide some, add domain composites, reorder categories).
  catalog(): CatalogEntry[];

  // POLICY — the class allowlist. The engine calls this before committing ANY class
  // string (hand-typed OR AI-generated); a rejected class never enters the document.
  // The host owns the policy (sparx: the fixed/z-[…]/content-[…]/url() denylist).
  validateClass(cls: string): { ok: true } | { ok: false; reason: string };

  // PANELS — host-contributed inspector panels for specific node types (SEO,
  // product-pin, a per-module editor). The engine renders the generic panels
  // (class, props, slots, theme) and slots these in beside them.
  inspectorPanels?(node: BuilderNode): InspectorPanel[];

  // ASSETS — the media picker. The engine invokes it when an image/video slot
  // asks for a source; the host returns a ref (and owns upload, the library, CDN).
  pickAsset?(kind: 'image' | 'video'): Promise<AssetRef | null>;

  // CHANGES — the engine emits the current document (debounced) after every edit.
  // The host owns save / versioning / publish. The engine never persists.
  onChange(document: BuilderDocument): void;
}

type Resolved = { value: unknown; label?: string };
```

That's it. Six methods, three of them optional. A host that implements `catalog`, `validateClass`, and `onChange` gets a working static-site builder. Add the three data/asset methods and it builds a full commerce/CMS site — **without the engine gaining a single line of domain code.**

---

## 6. Engine owns vs. host owns (the focus table)

| Concern | Engine (`silicaui-builder`) | Host (sparx) |
|---|:---:|:---:|
| Render silicaui tree faithfully (preview==prod) | ● | |
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

## 7. Relationship to the rest of silicaui

`silicaui-builder` completes the family and consumes the others natively:

- **silicaui (CSS)** — the classes the document is made of; the canvas renders under it.
- **silicaui-blocks** — the palette's default catalog. Because a block is the same node shape (minus ids), **stamping is native** — no adapter, just mint ids (§1). The `block → document node` transform *is* the only translation in the system.
- **silicaui-behaviors** — the runtime the canvas previews (autoplay suppressed) and the live site runs.
- **silicaui-react** — not required by the engine; a host may render extracted documents through it on React surfaces, but the engine renders the tree directly.

One node shape flows through all of them. That's the consistency that makes the whole thing tractable.

---

## 8. Isolation is native, not a host hack

The engine renders the document as a **`[data-theme]` themed island** (the canvas root carries `theme.name`; its tokens shadow the host's for everything inside) and **`@scope`s** the document's rules/reset so they don't leak into the surrounding host UI. This is not new machinery — it is **silicaui's own island model** (a themed subtree inside a differently-themed host), which today's sparx builder reimplements by hand. Owning the builder in silicaui puts that layering back with the model that defines it. The host provides the theme values; the engine does the isolation. (Editor chrome the engine draws inside the canvas uses its own token lane, never the document's palette — the same discipline that keeps a selection outline from inheriting a tenant's colors.)

---

## 9. Definition of done — the minimal buildable surface

- [ ] `BuilderDocument` / `BuilderNode` / `ThemeConfig` / `DocumentFrame` types (§2), one shape shared with silicaui-blocks (+ `id`).
- [ ] `mountBuilder(el, { document, host })` → `BuilderHandle` with `extract()` symmetric to load (§4).
- [ ] The three dynamic primitives (`bind` / `repeat` / `action`) as **opaque** markers resolved only through the host (§3).
- [ ] `BuilderHost` (§5): `catalog` + `validateClass` + `onChange` required; `resolveBinding` + `resolveCollection` + `inspectorPanels` + `pickAsset` optional.
- [ ] Canvas renders preview==production under a `[data-theme]` island with `@scope` isolation (§8); editor chrome on its own token lane.
- [ ] Direct manipulation: select/multi-select, drag reorder+reparent, add (from catalog)/remove/duplicate/paste, edit class + props + slots.
- [ ] Layers tree, inspector framework (generic panels + host panels), theme panel, device preview, undo/redo, behavior preview.
- [ ] Zero domain vocabulary in the engine — grep the package for "product", "cms", "tenant", "order": there must be no hits.

That last checkbox is the whole point. If the engine's source mentions a sparx concept, the seam leaked and it's drifting back toward the everything-machine. Keep it domain-blind and it stays the focused tool that builds great sites.