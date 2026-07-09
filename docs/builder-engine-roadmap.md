# The Builder Engine Roadmap — answers to the gap questions

**Version:** 1.0
**Author:** Brandon Korous / WizeWorks (drafted with Claude)
**Last Updated:** 2026-07-09
**Answers:** [sparx's 119-silicaui-builder-gap-questions.md](../../sparx.works/docs/119-silicaui-builder-gap-questions.md)

> **Purpose.** sparx's gap doc turned "should we adopt the engine?" into 19 generic design questions and proposed "candidate directions" for each. This doc **answers them** — not by re-stating the candidates, but by first auditing what `silicaui-builder` and `silicaui-html` **actually ship today** (2026-07-09), then deciding, sometimes agreeing with the candidate, sometimes proposing something better, grounded in sparx's own reference implementations where they exist. This is a decision record, not a spec — the concrete contract deltas it lands on get folded into [`builder-contract.md`](builder-contract.md) directly.

---

## 0. The corrected starting picture

The gap doc was written against the *contract's* aspirational shape. The real shipped shape is different in ways that change the answer:

- **The dynamic-content schema is already shipped**, further along than the gap doc assumed. `DataBinding = {kind:'value'|'collection'|'action', ref, href?}` is fully typed in `silicaui-html/src/schema.ts:84-87`, the site Inspector edits it, `toHtml` already lowers it to `data-sui-bind`/`data-sui-repeat`/`data-sui-action` attrs. **What's missing is not the marker — it's any resolver.** `silicaui-behaviors/src/behaviors/form.ts` is the *only* place anything reads a `resolve` callback (form-field prefill). No collection expander, no shared renderer, exists anywhere.
- **Symbols/instances are shipped and better than the contract implied**: `instanceOf` + `overrides` + `flattenSymbols` (`silicaui-html/src/symbols.ts`), live-propagating (edit the master, every instance updates immediately — no expand-at-stamp-time step).
- **Frame/Outlet is shipped and wired into the real editor**, not just a data shape — `Builder.tsx`'s Theme/Layout/Page/Component mode toggle retargets the whole editing spine.
- **The host seam is *entirely* absent — except for two things that turn out to already be solved by the data model itself, not a hook.** Zero of `catalog()`, `validateClass()`, `inspectorPanels()`, `resolveBinding()`, `resolveCollection()`, `pickAsset()` exist as callbacks. `<Builder/>` takes `document`, `studioTheme`, `onChange`, `onPublish`, `persistKey` — no `host` object at all. But:
  - **A host's theme needs no hook.** `Theme` (name/tokens/dark/mode) is just a field on `Document.theme`/`Site.theme` — a host loads its theme by putting it in the `document`/`site` object it passes in. `studioTheme` is a different, unrelated thing: the builder chrome's *own* `[data-theme]` skin, not the document being edited.
  - **A host's custom components need no hook either — but only for the Components panel.** `Site.symbols` (`engine.ts:192,335-419`) is a plain field on `Site`; the Components panel reads it live off the site object. A host can pre-populate `site.symbols` with its own master components before ever mounting the builder and they show up fully editable, with instances propagating, exactly like user-created ones. **This is a genuinely separate surface from the Insert/Add palette** (`listBlocks()`-driven, hardcoded, no host injection point) — the missing `catalog()` hook (Q10, below) is about *insertable templates* in the Add palette, not about custom components in general. Two palette surfaces, only one of them is a real gap.
  - Palette (Insert/Add, `listBlocks()`) is hardcoded; Inspector is a monolithic 1459-line component with zero prop-based extension point — these two remain real gaps.
- **There is no runtime class-string policy at all today**, only a build-time `lintBlock`/`assertBlockClean` denylist (`silicaui-html/src/lint.ts`) that runs against *authored blocks* in CI — never against a live user edit in the Inspector.
- **There is no raw-element/attribute whitelist.** `to-html.ts`'s `renderNode` emits `node.tag` and every `attrs` entry verbatim — no tag allowlist, no `on*` stripping, no `rel=noopener` enforcement, no URL scheme check. This has been safe so far only because every tree that reaches `toHtml` today is an authored, trusted block. **The moment the builder lets a user (or an AI assist) type an `el:<tag>` with attrs, this is a live XSS hole**, independent of anything else in this doc.

This reprioritizes the work. The "load-bearing five" aren't equally sized: **Q10/Q12/Q14 are a few days of plumbing** (the palette, Inspector, and `setClass` call sites already exist — they just need an extension point wired on). **Q1–Q3/Q19 (the data layer) is a real design-and-build project** — it needs a new resolution primitive in `silicaui-html`, and a data-aware render path in the canvas. Treat them as two stages, not one bundle (§6).

---

## 1. The dynamic-content layer (Q1–Q6) — decided

### The resolution model is synchronous, not async — correct the contract

`builder-contract.md` §5 currently specs `resolveBinding?(ref, scope): Resolved | Promise<Resolved>`. **Change this to synchronous-only: `resolveBinding?(ref, scope): Resolved`.**

Evidence: sparx's own reference implementation (`builder-schemas/src/runtime.ts`) is 100% synchronous by deliberate design. Data is fetched **once, up front** (`buildPreviewData` in the editor, `loadBuilderData` on the live site) into a plain object; the entire tree walk that follows — canvas render *and* storefront render — is a pure sync function over that pre-loaded data. sparx converged on this specifically to avoid async-in-the-render-walk (waterfalls, Suspense boundaries, "what renders while this one binding is still loading" — a real UX problem an async-per-node API creates and a sync one sidesteps entirely).

The generic version of this split: a host that needs async data (a DB call, an API) awaits **once**, outside the engine, to build whatever closure or cache its synchronous `resolveBinding`/`resolveCollection` then reads from. The engine's resolving walk never awaits mid-tree. This is a plumbing pattern the *host* owns (matches §0 of the contract — "the host does not persist, but it does prepare"), not a capability the engine needs to grow.

### One shared walker, not a shared leaf — go further than sparx did

sparx's `renderLeaf` (`builder-render/src/render-leaf.tsx`) is shared between canvas and storefront, and that sharing is exactly the reason they get preview==production. But it's a narrower win than the gap doc implies: **only leaf rendering is shared. Repetition (the loop over a collection, and the item-scope threading) is reimplemented independently in the dashboard's tree walker and in `apps/site`'s tree walker.** That's a residual seam — two walkers to keep in sync, not one.

silicaui can close that seam completely, because the engine already owns the *entire* tree walk (both `toHtml` and the canvas's React renderer walk the same `Node` type). The generic primitive should be a single function that owns **bind, repeat, and action together**, not just leaves:

```ts
// silicaui-html — new module, e.g. resolve.ts
interface ResolveHost {
  resolveBinding?(ref: string, scope: DataScope): Resolved;
  resolveCollection?(ref: string, scope: DataScope): unknown[];
}
type DataScope = { item?: unknown; index?: number };  // NOT a path array — see below
type Resolved = { value: unknown; label?: string; visible?: boolean };

/** Pure, sync. Walks `tree`, substitutes `data:'value'` nodes with resolved values,
 *  expands `data:'collection'` nodes into N cloned children (one per resolved item,
 *  each with an extended scope), and returns a plain Node tree — ready for `toHtml`,
 *  or for the canvas's own React walk. Absent both hooks → returns `tree` unchanged
 *  (zero cost; a static host never needs to call this at all). */
function resolveTree(tree: Node, host: ResolveHost, scope?: DataScope): Node;
```

This is the Q3/Q19 keystone, landed as a single new function, not a rewrite of `toHtml`. `toHtml` stays pure, sync, and untouched (its existing snapshot tests are unaffected) — a host's live-render path becomes `toHtml(resolveTree(doc.root, host))`, and the canvas's edit-time preview becomes the *same* `resolveTree` call feeding the canvas's React walker instead of `toHtml`. One resolution primitive, three consumers (canvas, `toHtml`, and a future `toReact`), which is the actual generic version of what sparx built with two walkers and a shared leaf.

### `DataScope` carries the real item, not an opaque path

The contract currently specs `DataScope = { path: string[] }` — "opaque, host interprets." sparx's actual `Scope` (`runtime.ts:18-23`) is `{ root, item?, index? }` — it threads the **real resolved item value** down through the recursion, not a structural path the host has to re-resolve. Re-deriving "which item am I on" from a path string on every nested bind is strictly worse than just carrying the item: it forces the host to either re-run `resolveCollection` per nested bind (wasteful, especially for async-backed collections) or maintain its own path→item cache (duplicate bookkeeping the engine could avoid handing back in the first place).

**Adopt sparx's shape, minus the domain-specific `root`:** `DataScope = { item?: unknown; index?: number }`. `resolveTree`, on descending into a resolved collection item, calls `resolve(childRef, { item: resolvedItem, index: i })` for every nested bind. The engine never inspects `item` — it's opaque cargo, exactly like `ref` — it's just cargo that happens to be useful instead of cargo that has to be reconstituted.

### Conditional visibility, without an expression language

Agree with the gap doc: no expression language, ever — it's a large, security-relevant surface for a marginal authoring win, and it doesn't fit the domain-blind engine's job. But **do** close the single most common real need — "hide this node when the data is absent" — for free, by extending `Resolved` with one optional field: `visible?: boolean` (default `true`). When a host's `resolveBinding` returns `{ value: undefined, visible: false }`, `resolveTree` drops that node (and its subtree) from the output entirely. Formatting (`"$" + price/100`) stays 100% host-side — the host's `resolveBinding` does the formatting before returning `value`, no engine change needed. This is the smallest change that answers Q5 without inventing anything expression-shaped.

### The binding picker: one host call, engine-owned scope narrowing

The gap doc's Q6 candidate (`host.dataSchema(scope) → fields`, called per node) copies the wrong half of sparx's design. sparx's real `BindingCatalog` (`builder-schemas/src/binding.ts` + `binding-catalog.ts`) is fetched **once** (`DataSource[]`, a flat catalog) and cached — the *per-node* work is a pure derivation (`scopeAt(catalog, ancestorChain)`) that walks a node's ancestors and narrows the pickable fields based on which ancestor `repeat`/pin is in scope. That narrowing logic is pure tree structure, not domain knowledge — it belongs in the engine, not duplicated per host.

**Adopt:**
```ts
host.catalog?(): DataSource[];   // fetched once, cached by the engine
// silicaui-builder ships this, generically, over the SAME tree shape it already walks:
function scopeAt(catalog: DataSource[], ancestors: Node[]): DataSource[];
```
`scopeAt` walks up from the selected node; any ancestor whose `data.kind === 'collection'` narrows the returned sources to that source's nested `fields` (rendered as `item.*` in the picker). The Inspector's "Bind" button renders a generic picker over whatever `scopeAt` returns; absent `host.catalog`, it falls back to a raw-ref text input. This is a **new, additive** contract hook (`catalog` here is data-source metadata, distinct from the palette's `catalog()` in §5 of the existing contract — naming collision to fix when this lands: call this one `host.dataSources()`).

---

## 2. Actions (Q4) — no engine change

Confirmed already-correct at the schema/`toHtml` layer: an `action` node renders inert (`data-sui-action` attr, no handler) in both editor and static output today. The only remaining piece is documentation, not code: a one-paragraph recipe in `builder-contract.md` telling a host "attach one delegated listener at the document/app root, keyed by `[data-sui-action]`, that reads the ref off the DOM node and dispatches to your own handler." No package should own this — it's a five-line pattern, and baking it into `silicaui-behaviors` would smuggle a domain-shaped assumption (a single global handler shape) into a package whose whole job is staying behavior-specific and domain-blind.

---

## 3. Security floors — make them non-optional (Q14, Q15)

Two related but distinct gaps, both currently **zero** at runtime, and both belong at the *engine* layer as a hard floor a host can only tighten, never the other way around — mirroring sparx's own `AllowlistConfig` design, which is deliberately "add-only, unblock impossible" so the insecure state is unrepresentable.

### Q15 — the raw-element/attribute whitelist (ship this regardless of the builder work)

`silicaui-html/src/to-html.ts` renders `node.tag` and `attrs` with zero validation today. This is a real, live gap the moment anything other than a trusted authored block reaches `toHtml` — which the site builder's palette already lets a user do (insert an `el:<tag>`). **This should ship independent of everything else in this doc, as a correctness/security fix, not a builder feature.**

sparx's `element.ts` is the reference shape, and it's worth adopting close to verbatim because the design pattern is exactly right: a **closed positive union**, not a denylist regex. `RAW_ELEMENTS: Map<tag, {group, attrs: AttrKey[], void, ...}>` (~65 tags, explicitly *excluding* `script style object embed link meta base noscript template iframe`), a closed `AttrKey` union mapped to real attribute names (so `on*` handlers are excluded **by omission** — never enumerated, so never copyable — rather than stripped by a fragile pattern match), `GLOBAL_ATTRS` + per-tag `TAG_ATTRS`, `rel="noopener noreferrer"` force-set whenever `target="_blank"`, and a `SAFE_URL` scheme check on `href`/`src` (relative/http(s)/mailto/tel/anchor only, nothing else). Land this as `silicaui-html/src/element.ts`, enforced unconditionally inside `to-html.ts`'s `renderAttrs`/`renderNode` — not behind a host hook. It's the same category of thing HTML-escaping already is: a floor every consumer gets for free, no opt-in.

### Q14 — `validateClass`, with a non-optional floor underneath it

Keep `host.validateClass(cls) → {ok}|{ok:false,reason}` as specced (§5) for a host that wants custom logic. But **the engine should not treat the floor as fully host-owned from scratch** — `silicaui-html/src/lint.ts` already has the exact right shape (`fixed`, arbitrary `z-[…]`, arbitrary `content-[…]`, `url(...)` — a near-identical convergence with sparx's own `allowlist.ts` denylist, built independently). Wire it in as the engine's **built-in, unconditional first gate** on every `setClass` call site (`site/engine.ts:650-657` today accepts any string; this is the actual fix); `host.validateClass`, if supplied, runs *after* and can only add restrictions, never lift the built-in ones.

Additionally, adopt sparx's config-not-code pattern for the common case: most hosts don't need arbitrary logic, they need "add these prefixes/substrings to the denylist." Ship a helper —

```ts
// a host that just wants to add tenant rules never writes a validator function:
host: { validateClass: buildClassValidator({ blocks: [{ kind: 'prefix', value: 'tenant-unsafe-' }] }) }
```

— that always ANDs with the built-in floor, so "loosen the floor" is structurally impossible, matching sparx's "insecure state unrepresentable" property. `AllowlistRule = { kind: 'prefix'|'exact'|'substring'; value: string }` (deliberately enumerated, never a free regex, to avoid ReDoS) — lift this type verbatim.

---

## 4. Composition & reuse (Q7–Q9) — mostly already correct, one real divergence

**Q7 (single outlet):** shipped, adequate, matches sparx's own single-slot need exactly. No change.

**Q8 (symbols vs. sparx's version-pinning):** these are genuinely different models, and that's fine — **no engine change needed.** silicaui's `instanceOf`/`flattenSymbols` is always-latest, live-propagating; there is no version field on an instance node, by design (§0 of the contract: the engine doesn't persist or version). sparx's `expandTreeForPublish` (`component-service.ts:343`) resolves a *separate* pin-or-latest model **entirely in host code**, using its own version table and an explicit `upgradeAllPlacements` opt-in-propagation step — a master edit does **not** retroactively touch a draft; propagation to unpinned placements happens lazily at next publish.

The reconciliation: `flattenSymbols` (engine) powers the **editing experience** — always show the latest master, so what you're building previews correctly. A host that wants version pinning for its **published** artifact runs its *own* flatten pass (structurally identical to `expandCustomNodes` — walk the tree, replace `instanceOf` refs, apply overrides) over the extracted `Site`, using its own version table instead of the engine's `symbols` map, at publish time. The two flattens are allowed to diverge (draft canvas sees latest; a published page can lag behind on a pin) and that divergence is 100% host territory. This works *today*, with the existing `extract()`/`onChange` seam — nothing to build.

**Q9 (two-zone editing):** the shipped Builder.tsx mode toggle (`Theme / Layout / Page / Component`) is **not** the contract's naive "one document at a time" nor sparx's simultaneous dual-canvas — it's a third, better answer already built. `Canvas.tsx:239-243` composes frame + page **together, always** (whichever layer isn't the active edit target renders inert as visual context, never hidden), and only the *interactivity* (selection, click-to-edit) toggles between layers via the mode switch. This avoids sparx's dual-store/dual-autosave-debounce complexity entirely — there's exactly one active tree, one undo history, one save-debounce, at any moment — while still giving full visual "does this look right in its real chrome" context at all times. **Recommend this as the answer, not a question**: hosts should adopt the mode-toggle pattern rather than asking the engine to grow simultaneous multi-zone editing; it's simpler and sparx's own two-zone need is served by it (page mode shows the frame as locked context; layout mode shows the page as locked context — exactly sparx's requirement, achieved with one editing spine instead of two).

---

## 5. Palette, inspector, theme (Q10–Q13) — mechanical, sequence first

**Q10 (catalog):** narrower than it first looks — **this is only about the Insert/Add palette** (`listBlocks()`, hardcoded). The *other* "add a component" surface, the Components panel backed by `Site.symbols`, is already host-seedable today with zero engine changes (§0 above) — a host that wants its own reusable masters available in a site can just put them in `site.symbols` before mounting. `catalog()` is for the narrower, still-real gap: letting a host add a *template* (not yet an instantiated symbol) to the Insert palette itself. `<Builder/>` needs a `catalog` prop today — it has none. Recommend **merge semantics over flat replace**: `host.catalog?(): { extend?: CatalogEntry[]; hide?: string[] }` rather than forcing a host to re-enumerate all of `silicaui-blocks` just to add one composite. A domain composite is a normal `Template` whose tree already carries `data`/`slot` markers — confirmed zero engine changes needed for this part (§0 above: the schema already supports it).

**Q12 (inspector panels):** `Inspector.tsx` needs a prop-based extension point. Ship `InspectorPanel = { id, title, order?, render: (node, ctx) => ReactNode }` where `ctx` exposes the engine's own mutation primitives (`ctx.setProp`, `ctx.setData`, …) so a host panel edits through the same paths the built-in panels use — never a second, parallel node-mutation API. Host panels render as an additional section, never a replacement, in v1 (a replace capability is speculative until a real host asks).

**Q14:** see §3 above.

**Q13 (design surface):** agree with the gap doc — this is generic, already the reason to adopt the engine, and mostly shipped (padding/corner/color/box-model controls exist in the 1459-line Inspector per the current build). **One real, verified gap**: there is no breakpoint-scoped editing control today (`grep` for `@3xl`/`breakpoint` in `Inspector.tsx` returns nothing) — responsive editing is currently raw-class-only (hand-type `@3xl:grid-cols-2`). sparx's `ContextSelect` ("Editing for: Every screen / Hover / Dark mode / Screen size") is the reference shape: a single pill that retargets every control below it into a variant-prefixed write, backed by a clean `class-controls.ts` separation between "widget" and "class algebra" (`activeValue`/`applyValue`/`contextPrefix`). This is real, valuable, unshipped work — flag it as a concrete Q13 follow-up, not assumed-done.

---

## 6. Sequencing — stage the roadmap, don't gate everything on the keystone

The gap doc treats the load-bearing five as one bundle that must all land before Phase F is viable. The audit in §0 shows they're not the same size, and gating adoption on the hardest one (§1) delays real, immediate wins on the cheap ones (§3, §5). Recommend two stages:

**Stage F1 — host-seam plumbing (days, not weeks).** `catalog` (merge), `validateClass` (+ built-in floor), `inspectorPanels`, `pickAsset`, plus the §3 security floors (`element.ts` whitelist ships regardless). Every piece here has its engine-side mechanism already built (palette rendering, Inspector panel rendering, `setClass` call sites, `toHtml`) — this is wiring an extension point onto existing code, not new architecture. **This alone unlocks adopting the engine for any static/non-data-bound host today** — delete WS-7's editor-chrome re-skin immediately, independent of the data layer.

**Stage F2 — the data-resolution layer (real design-and-build).** `resolveTree` (§1), the canvas's data-aware render path (feed `resolveTree`'s output into the canvas's React walk instead of the raw tree), `host.dataSources()` + `scopeAt`, the "bound" chip UI. This is the keystone and deserves its own focused build, not a bundle with F1 — but per §1, it is now a **concrete, scoped, sync-only design**, not an open question.

Doc 118's Phase D-vs-F call: **F1 changes the calculus immediately** — it is cheap enough to fund now, independent of whether F2 is funded on the original timeline. sparx's static surfaces (marketing pages, layout, anything without live commerce/CMS binding) can move to the engine as soon as F1 lands; the data-bound surfaces wait on F2. This turns "keep sparx's engine vs. adopt silicaui's" from a single binary decision into a per-surface migration that starts sooner.

---

## 7. What this changes in `builder-contract.md`

Concrete deltas to land there directly (companion edit, this session):
- §3: `resolveBinding`/`resolveCollection` → synchronous only, drop `| Promise<...>`.
- §3: `DataScope` → `{ item?: unknown; index?: number }`, replacing the path-array shape.
- §3: `Resolved` → add `visible?: boolean`.
- §3: new `resolveTree(tree, host, scope?)` primitive in `silicaui-html`, single walker owning bind+repeat+action.
- §5: `catalog()` → merge semantics (`extend`/`hide`), not flat replace.
- §5: new `dataSources()` + engine-owned `scopeAt()` (rename to avoid the `catalog()`/`dataSources()` naming collision).
- §5: `validateClass` gets a built-in engine-side floor (the `lint.ts` denylist) it can only add to; ship `buildClassValidator(config)` as the declarative common case.
- New §: the `element.ts`-shaped raw-element/attribute whitelist, enforced unconditionally in `to-html.ts`, not host-optional.
- Note Q9's mode-toggle pattern as the documented answer to "multi-document editing," not an open question.
