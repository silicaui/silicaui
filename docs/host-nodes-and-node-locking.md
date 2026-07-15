# Host Nodes & Node Locking — Design Spec

**Version:** 0.2
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-15
**Status:** SHIPPED (both batches) — verified via `verify:lock`/`verify:host` probes + `lock.spec.ts`/`host-node.spec.ts` e2e. Not yet committed. v2 (data-bound host props) deferred.

> **Purpose.** Add two orthogonal, universal capabilities to the SilicaUI schema + builder so an authored page can embed a live, host-owned functional region (checkout, search, cart, account, a live map, a data grid) as a first-class node — placed in flow, configured in the Inspector, and protected from deletion. Neither capability is domain-specific: they are the *code-component* and *locked-layer* primitives every mature visual editor has (Plasmic/Builder.io code components; Figma/Webflow locked layers). SilicaUI ships them on universal merit; sparx (and any consumer) is a beneficiary, not the designer.

> **Origin.** A consumer audit (sparx) found ~28 functional routes — PLP, search, cart, checkout, `/book`, all authed account, all B2B — are hardcoded React with zero SilicaUI, because the engine has **no seam to render a live host component on the canvas** and **no way to mark a node non-deletable** (`remove(id)` works on any non-root, non-outlet node; the Outlet's pin is a `kind`-specific special case, not a reusable flag). Both gaps are real. This spec closes them generically.

---

## 0. Two features, deliberately orthogonal

| # | Feature | One-line | Touches |
|---|---------|----------|---------|
| **A** | **`host` node kind** | A serializable, opaque placeholder that projects to a *mount point* in `toHtml` and renders via a host-supplied component on the canvas. | `silicaui-html` schema + `toHtml`; `silicaui-behaviors` (optional mount helper); builder engine + Canvas + Inspector + Palette; `BuilderHost` seam. |
| **B** | **`locked` node flag** | Generalizes the outlet/root protection into a **two-tier** owner flag (`"host"` \| `"author"`) the editing spine honors (no remove/move/reparent). Author UI can clear only author locks; host locks are host-owned. | `silicaui-html` schema; builder engine spine; Navigator affordance. |

They compose to unlock the origin case — *author the marketing/content shell in the builder, embed the functional core as a `locked` host node* — but each stands alone and ships value independently. Build B first (small, unblocks A's "pinned" requirement); then A.

**What we are NOT building** (see §9): a free/absolute canvas. sparx framed this as a "pinned **free-canvas** node." We take the requirement (embed a live, non-deletable widget), reject the implementation (free canvas). The host node lives in normal container-flow like every other node, and reflows under container queries like every other node.

---

## Feature A — the `host` node kind

### A.1 Naming

The node `kind` is **`"host"`**; its interface is `HostNode`. We deliberately do **not** call it `slot`, because `NodeBase.slot` (`SlotDef`) already means "an editable region for a builder/host" — a different concept. In prose: *host node* or *host mount*. The projected DOM hook is `data-sui-host`. (The `BuilderHost` seam is what renders it — the name lines up.)

### A.2 Schema

Add to [packages/silicaui-html/src/schema.ts](../packages/silicaui-html/src/schema.ts):

```ts
export type Node = ElementNode | ComponentNode | OutletNode | HostNode;

/**
 * A live, HOST-OWNED functional region embedded in an authored tree — the
 * code-component primitive (§ host-nodes spec). Opaque to the projection:
 * `toHtml` emits an empty MOUNT POINT (`<div data-sui-host="…">`), never live
 * framework code, so the framework-neutral projection promise is preserved. A
 * host mounts its real component into that point at render time (§A.4), exactly
 * as it hydrates behavior markers. A LEAF — it never carries `children`.
 */
export interface HostNode extends NodeBase {
  kind: "host";
  /** The host component key — an ALLOWLIST key the host resolves, NEVER eval'd.
   *  e.g. "CheckoutWidget" | "ProductGrid" | "AccountPanel". */
  component: string;
  /** Author-set configuration, validated by the host against the component's
   *  declared prop schema (§A.5). JSON-serializable; static literals in v1
   *  (data-bound props are v2 — §8). */
  props?: Record<string, unknown>;
}
```

Notes:
- Inherits `id`, `label`, `class` (wrapper styling — the mount point's own classes, gated by the class policy like any node), `data`, `slot`, `behavior`/`part`, `locked` (Feature B). It does **not** use `children` or `rawHtml`.
- `component` is a bare string key. The host owns the namespace; the engine treats it opaquely (mirrors how `data.ref` is opaque).

### A.3 Projection — `toHtml`

In [packages/silicaui-html/src/to-html.ts](../packages/silicaui-html/src/to-html.ts) `renderNode`, add a branch **before** the element path (peer of the `outlet`/`component` branches):

```ts
if (node.kind === "host") {
  const cls = node.class ? applyPrefix(node.class, opts.prefix ?? "") : "";
  const classAttr = cls ? ` class="${cls}"` : "";
  const meta = metaAttrs(node, opts); // id/data/behavior markers, unchanged
  const host = attr("data-sui-host", node.component);
  const props =
    node.props && Object.keys(node.props).length
      ? attr("data-sui-host-props", JSON.stringify(node.props))
      : "";
  // Empty mount point — the host fills it (client mount or SSR). Never children.
  return `<div${classAttr}${host}${props}${meta}></div>`;
}
```

Contract:
- **Empty by default.** Production markup is a bare, stable mount point. No dependency on any host framework in the HTML itself.
- `data-sui-host` = the component key; `data-sui-host-props` = JSON of author props (omitted when empty). Both are attributes, so they survive `esc`-free (props JSON is attribute-escaped by `attr`).
- `metaAttrs` still runs, so a host node participates in `ids: true` canvas mapping (`data-sui-id`) and can itself carry a `data`/`behavior` marker if ever needed.
- `sanitizeElement` is **not** invoked — the tag is a fixed `div` we emit, not author-controlled. (Forward-compat: if we ever let the host pick the wrapper tag, route it through `sanitizeElement` first.)

### A.4 Mounting / hydration

The HTML mount point is inert until a runtime fills it. Two audiences, same DOM hook:

1. **The host app (production).** The host queries `[data-sui-host]`, reads `data-sui-host` + `data-sui-host-props`, and mounts its real component (a React root, a web component, SSR hydration — the host's choice). This is *exactly* the `rawHtml`/icon precedent: a host-owned render step the core neither performs nor prescribes. The framework-neutral floor stays intact — SilicaUI never ships React into the projection.

2. **Optional vanilla helper** in `silicaui-behaviors` — for hosts that want a turnkey mount loop mirroring `hydrate()`:

```ts
// packages/silicaui-behaviors/src/host-mounts.ts (NEW, optional export)
export type HostMounter = (el: HTMLElement, props: unknown) => (() => void) | void;

/** Mounts every not-yet-mounted `[data-sui-host]` under `root` using `registry`.
 *  Idempotent (a HYDRATED-style marker guards re-mount). Returns a disposer. */
export function mountHostNodes(
  registry: Record<string, HostMounter>,
  root: ParentNode = document,
): () => void { /* symmetric with hydrate() */ }
```

This is **not** part of the closed `BehaviorType` vocabulary and adds no `data-sui-behavior` handler — host components are host-owned and framework-specific, so the *components* never live in `silicaui-behaviors`; only this generic, component-agnostic loop optionally does. Hosts on React will typically skip it and mount their own roots.

### A.5 `BuilderHost` seam extensions

Add to [packages/silicaui-builder/src/site/react/host.ts](../packages/silicaui-builder/src/site/react/host.ts) `BuilderHost` (both optional — a static-site host implements neither):

```ts
/** The host components this builder may place. Powers the Insert palette and
 *  the Inspector's per-component prop controls. Absent → no host nodes offered. */
hostComponents?(): HostComponentDef[];

/** Live canvas preview of a host node. Absent (or returns null) → the engine
 *  renders a labeled placeholder (§A.6). `ctx.preview` is true during authoring
 *  so the component can render a non-interactive / skeleton state, exactly as
 *  behavior autoplay is suppressed for authoring. */
renderHostNode?(node: HostNode, ctx: HostRenderCtx): React.ReactNode;
```

```ts
export interface HostComponentDef {
  /** Allowlist key matched against HostNode.component. */
  name: string;
  /** Palette + Navigator label, e.g. "Checkout". */
  label: string;
  /** Palette grouping + optional icon (a registered icon name). */
  category?: string;
  icon?: string;
  /** Declared props → drives Inspector controls + host-side validation. */
  props?: HostPropDef[];
  /** Values stamped into a freshly inserted node's `props`. */
  defaultProps?: Record<string, unknown>;
  /** Insert as a host-locked node (`locked: "host"`, Feature B) — the "pinned"
   *  requirement. The author sees it locked with no unlock; only the host clears
   *  it. Default false. */
  pinned?: boolean;
  /** Default wrapper classes for a freshly inserted node (LITERAL safelist strings). */
  defaultClass?: string;
}

/** Minimal, extensible prop descriptor for the Inspector. Additive union. */
export interface HostPropDef {
  name: string;
  label?: string;
  type: "text" | "number" | "boolean" | "select" | "color" | "binding";
  options?: { value: string; label: string }[]; // select
  default?: unknown;
}

export interface HostRenderCtx {
  preview: boolean; // authoring vs. production-preview
  resolveBinding?: BuilderHost["resolveBinding"]; // for future data-bound props
}
```

`renderHostNode` is a single dispatch function (the host switches on `node.component`), symmetric with `resolveBinding`. It plugs into the existing `HostProvider`/`useHost` context ([host-context.tsx](../packages/silicaui-builder/src/site/react/host-context.tsx)) — no new context.

### A.6 Engine — Canvas, Palette, Inspector, spine

**Spine / structure** ([packages/silicaui-builder/src/site/engine.ts](../packages/silicaui-builder/src/site/engine.ts)):
- `markable()` → **true** for `host` (it has an id, is selectable, keyable, draggable-as-a-unit). Only `outlet` stays unmarkable.
- Introduce an explicit **leaf** predicate. Today "can hold children" == "is not an outlet"; split that: `canHaveChildren(node)` becomes false for both `outlet` and `host`. Insert/drop-into is refused on a host node; drop-**beside** is allowed (it's a normal flow sibling).
- `locate`/`ancestorPath`/`contains` already skip only `kind === "outlet"`; update them to treat `host` as a normal markable leaf (it *is* returned by `locate`, unlike outlet) — i.e. the guards that currently read `!== "outlet"` stay correct for host (host is markable), but the child-recursion must not descend into a host node (it has none).
- `remove`/`move`/`duplicate` gain `locked` awareness via Feature B — a `pinned` host node is thereby non-deletable.

**Canvas** ([packages/silicaui-builder/src/site/react/Canvas.tsx](../packages/silicaui-builder/src/site/react/Canvas.tsx)):
- Add a `node.kind === "host"` branch (peer of the existing `outlet` branch at ~L376). If `host.renderHostNode` exists, wrap its result in the standard selectable shell (same `data-sui-id` click-select + `SelectionOverlay` every node gets) so selection/lock chrome is uniform. If absent/null, render a **labeled placeholder** modeled on the outlet placeholder ("Layout outlet — page content renders here") — e.g. a dashed panel reading `⬚ {label} — host component "{component}"`. The placeholder keeps the node selectable/inspectable even with no live renderer, so authoring never dead-ends.
- Isolation: the host component renders inside the canvas's existing nested document-theme island; the preview mount is the React child, no iframe (consistent with our no-iframe canvas).

**Palette** ([packages/silicaui-builder/src/site/react/Palette.tsx](../packages/silicaui-builder/src/site/react/Palette.tsx) + [palette.ts](../packages/silicaui-builder/src/site/palette.ts)):
- Merge `host.hostComponents()` into the Insert palette as a group ("Host" / per `category`), each item stamping a `HostNode { kind:"host", component, props: defaultProps, class: defaultClass, locked: pinned ? "host" : undefined }`. Reuses the existing `catalog()` merge semantics path.

**Inspector** ([packages/silicaui-builder/src/site/react/Inspector.tsx](../packages/silicaui-builder/src/site/react/Inspector.tsx)):
- For a selected host node, render a **Host** panel from the component's `HostPropDef[]` (text/number/boolean/select/color controls), writing through `setProp` — the same `InspectorPanelCtx.setProp` path built-in panels use. Universal controls (class chips/swatches, id/label/visibility, lock toggle) still render, as they do for every node. This is additive to the existing host `inspectorPanels()` mechanism (a host could alternatively supply a bespoke panel).

### A.7 Preview == production

Both the canvas preview *and* production render the **same host component** — on the canvas via `renderHostNode`, in production via the host mounting into `data-sui-host`. Parity is preserved through the host in both directions, exactly as icons and rich-text (`rawHtml`) achieve parity through host-supplied content. The core makes no promise about what the widget *looks* like — only that the mount point and props are identical in both paths.

---

## Feature B — the `locked` flag

### B.1 Schema

Add one optional field to `NodeBase` in [schema.ts](../packages/silicaui-html/src/schema.ts):

```ts
/** Structural immutability + its OWNER. A locked node cannot be removed, moved,
 *  or reparented by the editing spine; its class/props stay editable. Presence
 *  encodes locked; the value encodes WHO owns the lock:
 *   - "author" — the author locked it (Navigator "lock layer"); the author can
 *     unlock it the same way.
 *   - "host"   — the host locked it (a pinned host region, or the host's own
 *     runtime call); the author UI shows it as locked but offers NO unlock — only
 *     the host clears it.
 *  Generalizes the outlet/root protection. Ignored by every projection. */
locked?: "host" | "author";
```

A single field (not `locked: boolean` + `lockedBy`) so there is no invalid state — presence *is* locked, absence *is* unlocked, and `if (node.locked)` reads truthy/falsy exactly as a boolean would. Authoring metadata only — `toHtml` never reads it (like `label`/`slot`).

### B.2 Spine semantics ([engine.ts](../packages/silicaui-builder/src/site/engine.ts))

Any **truthy** `locked` (either owner) gates **structural** ops on the node itself:
- `remove(id)` → refused (returns a no-op / falsy) when the target is `locked`. This is the direct fix for "remove(id) works on any non-root node."
- `move`/reorder/reparent of a locked node → refused. (Reordering *other* siblings around it is fine — it holds its declared position.)
- `duplicate` → allowed; the copy is **not** locked (a duplicate is author-owned — the field is cleared on the clone). A host that needs duplicates pinned re-locks on insert.
- `setClass`/`setProp`/`setText`/`setData` → **allowed** — locking is about structure, not style/content. (A host that wants a fully read-only region withholds inspector controls; that's a separate concern.)

**The lock primitive.** Add one spine method:

```ts
/** Set or clear a node's lock. `owner: undefined` unlocks. This is the LOW-LEVEL
 *  primitive — it always succeeds; the TIER policy (who may clear what) lives in
 *  the UI that calls it (§B.3), not here. Undoable. */
setLocked(id: string, owner: "host" | "author" | undefined): void;
```

- **Author path:** the Navigator lock toggle calls `setLocked(id, "author")` / `setLocked(id, undefined)`, and it only *offers* unlock when the current lock is `"author"` (§B.3).
- **Host paths:** (1) `HostComponentDef.pinned` stamps `locked: "host"` at insert (§A.5) — no imperative handle needed; (2) a host that holds the `Editor` handle (the same imperative surface it loads/extracts through — `useEditor()` / the instance it mounts `<Builder>` with) may call `setLocked(id, "host" | undefined)` at runtime to lock/unlock its own regions. The primitive is deliberately unguarded so the host is never boxed out of its own locks.

Undo/redo: unchanged — a locked node's edits participate in history normally; `setLocked` is itself an undoable op.

### B.3 Navigator affordance ([Navigator.tsx](../packages/silicaui-builder/src/site/react/Navigator.tsx))

The row chrome reads the lock owner and diverges:
- **`"author"` lock** → a filled lock glyph + a working **Unlock** toggle in the row menu (calls `setLocked(id, undefined)`). The author's own lock, fully author-reversible.
- **`"host"` lock** → a distinct **host-lock glyph** (e.g. a shield/anchor, visually different from the author padlock) + **no Unlock control** (hidden, or shown disabled with a "Locked by the host" tooltip). Only the host clears it.
- **Unlocked** → the normal **Lock** action (calls `setLocked(id, "author")`).
- Keyboard delete / the remove shortcut ([use-shortcuts.ts](../packages/silicaui-builder/src/site/react/use-shortcuts.ts)) respects the spine refusal for either owner — no bypass.

### B.4 Two-tier ownership — the decided model

`locked` carries its owner so the two lock sources never collide:

| Lock set by | Value | Author can unlock? | How it's set |
|-------------|-------|--------------------|--------------|
| Author (Navigator) | `"author"` | ✅ yes | `setLocked(id, "author")` |
| Host (pinned region / runtime) | `"host"` | ❌ no (host-only) | `HostComponentDef.pinned` at insert, or `setLocked(id, "host")` via the host's `Editor` handle |

The engine primitive `setLocked` is tier-blind (always succeeds); the **UI** enforces "author can't clear a host lock" by simply not rendering that control. This keeps the engine simple and the policy legible, and guarantees a host is never locked out of un-pinning its own region.

---

## 7. Security & trust

- **`component` is an allowlist key, never code.** The host resolves `data-sui-host` against its own registry and mounts only known components. No `eval`, no dynamic import of author-controlled strings. The engine treats the key opaquely; the *host* is the trust boundary (same posture as `data.ref`).
- **`props` are author-set and host-validated.** The Inspector only writes props declared in `HostPropDef[]`; the host re-validates at its mount boundary (never trust the serialized JSON blindly — an author or a tampered document could carry arbitrary JSON). Treat `data-sui-host-props` like any untrusted input at the mount seam.
- **No new raw-HTML surface.** Unlike `rawHtml`, a host node emits an **empty** element — it introduces no unescaped content into the projection. All dynamic content lives inside the host's own component, under the host's own trust model.
- **Class policy unchanged.** The wrapper `class` flows through the existing class validator/floor like any node.

---

## 8. Data-bound props (v2, forward-compat)

v1 props are static literals. The obvious next step is props whose value is a data binding (a checkout node needs `cartId` from the route; a product grid needs a `collectionRef`). Forward-compat is preserved:
- `HostPropDef.type: "binding"` is reserved now.
- A prop value may later be a binding envelope (`{ $ref: "…" }`); `resolveTree` would resolve host-node props alongside node `data`, and `HostRenderCtx.resolveBinding` is already threaded for the canvas preview.
- The projection stays stable: bound props resolve into the same `data-sui-host-props` JSON at publish/SSR time, or the host resolves them client-side from `data-sui-*` on the mount. No schema break.

Do **not** build v2 in this batch — just don't foreclose it.

---

## 9. Non-goals

- **No free / absolute canvas.** Host nodes live in container-flow and reflow under container queries. "Pinned" means non-deletable/non-movable *within flow*, not absolutely positioned. (Explicit rejection of the sparx framing.)
- **No host component code in the core or in `silicaui-behaviors`.** The core ships the *slot + mount contract*; components are host-owned. The only optional core addition is the generic `mountHostNodes` loop.
- **No per-route/functional-page ownership.** The builder still edits one document at a time. Whether a route is "content shell + host node" vs. "hardcoded" is a host composition decision, not an engine feature.
- **Not a second editable-region system.** `host` (live widget) is distinct from `slot: SlotDef` (editable content region). They don't overlap.

---

## 10. Build plan (spec → PR sequence)

Ship **B before A** (B is small and satisfies A's "pinned" precondition).

**Batch 1 — Feature B (`locked`):**
1. `silicaui-html`: add `NodeBase.locked?: "host" | "author"`; confirm no projection reads it.
2. `silicaui-builder` engine: `remove`/`move`/reparent honor any truthy `locked`; add the `setLocked(id, owner)` primitive + undo entry; `duplicate` clears the clone's lock.
3. Navigator: owner-aware glyphs (author padlock vs host-lock) + author-only Unlock toggle; shortcuts respect refusal for either owner.
4. Tests: probe/e2e — locked node survives delete key + Navigator remove (both owners); author unlock clears an `"author"` lock but the UI offers none for a `"host"` lock; `setLocked(id, undefined)` clears either at the engine level; class/content edits still work under lock.

**Batch 2 — Feature A (`host` node):**
5. `silicaui-html`: `HostNode` in the `Node` union; `toHtml` mount-point branch; `stamp`/`toJson` cover it (id minting, round-trip). Golden test: a host node → exact `<div data-sui-host…>` string.
6. `silicaui-behaviors`: optional `mountHostNodes` helper + its own idempotency test.
7. `silicaui-builder` `BuilderHost`: `hostComponents()` + `renderHostNode()` + `HostComponentDef`/`HostPropDef`/`HostRenderCtx` types.
8. Engine: `canHaveChildren` leaf split; `markable` true for host; drop-into refused / drop-beside allowed.
9. Canvas: host render branch (live via `renderHostNode`, placeholder fallback), selectable shell.
10. Palette: `hostComponents()` merged into Insert; stamps `HostNode` (locked when `pinned`).
11. Inspector: Host prop panel from `HostPropDef[]` via `setProp`; universal controls unchanged.
12. `silicaui-mcp` catalog: regenerate so the new node kind + seam are documented ([[silica-component]] sync rule).
13. Tests: probe (projection round-trip, leaf refusal), e2e (insert a mock host component from palette → renders on canvas → props edit updates preview → pinned insert is non-deletable). A test `BuilderHost` with a trivial mock component (e.g. a "PriceTag" that renders its `amount` prop) exercises the whole seam without any real domain code.

**Docs:** promote this file to a versioned design authority on merge; cross-link from [builder-contract.md](builder-contract.md) §5 (host seam) and note the new node kind in [silicaui-architecture.md](silicaui-architecture.md) §3.

### Touchpoint summary

| Layer | Files |
|-------|-------|
| Schema | `silicaui-html/src/schema.ts` |
| Projection | `silicaui-html/src/to-html.ts` (+ `stamp.ts`, `to-json.ts` coverage) |
| Vanilla mount (opt) | `silicaui-behaviors/src/host-mounts.ts` (+ `index.ts` export) |
| Host seam | `silicaui-builder/src/site/react/host.ts` |
| Engine spine | `silicaui-builder/src/site/engine.ts` |
| Canvas | `silicaui-builder/src/site/react/Canvas.tsx` |
| Palette | `silicaui-builder/src/site/react/Palette.tsx`, `src/site/palette.ts` |
| Inspector | `silicaui-builder/src/site/react/Inspector.tsx` |
| Navigator | `silicaui-builder/src/site/react/Navigator.tsx` |
| MCP catalog | `silicaui-mcp` (regen) |

---

## 11. Resolved decisions

All prior open questions are now decided:

1. **Host-lock vs author-lock** → two-tier `locked?: "host" | "author"` (§B.4), not a plain boolean.
2. **Wrapper tag** → always emit `<div>` in v1. A `HostComponentDef`-chosen wrapper tag (routed through `sanitizeElement`) is deferred, not built now.
3. **SSR contract** → **document the pattern, ship no core helper.** A host that renders server-side fills the `[data-sui-host]` mount point in the HTML string before send (its own concern, same as any host render step); the core only guarantees a stable, empty mount point + `data-sui-host-props`.
4. **Placeholder fidelity** → the no-renderer canvas placeholder shows **label + component name + prop count** (a compact summary), not a full prop dump.
5. **Nesting inside symbols** → host nodes ride the existing symbol machinery untouched: instances mount the same component, per-instance overrides use `overrides.props`. `flattenSymbols` is kind-agnostic and passes them through — to be asserted by a test in Batch 2, not special-cased in code.
