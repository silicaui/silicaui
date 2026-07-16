# Data Resolution Honesty & the Brand Mark — Design Spec

**Version:** 0.3
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-16
**Status:** **ALL THREE BATCHES SHIPPED** (A honesty, C brand mark, B canvas resolution). Verified via `verify-resolve.mjs` (+38 checks), `verify.mjs` (+11 golden/`primary` checks), `host-seam.spec.ts`, and `wordmark.spec.ts` (real-browser aspect-ratio measurement + the origin case end to end). Repo builds clean; **99/99 e2e, green on repeated runs**. MCP catalog regenerated. Not committed.

The origin case now works: bind a Wordmark → the host's real brand renders **on the canvas**, with a Data on/off toggle back to the authored placeholder.

**Found while building** (each its own defect, all fixed here):
- `BuilderHost` and `EmailBuilderHost` **re-declared** the resolver hooks instead of extending `ResolveHost` — so the widened signature didn't propagate and both Inspectors read `.value` off a possibly-`undefined` with the compiler silent. Now `extends`; that alone surfaced 13 real crash sites. Duplication like this is what let the original bug class exist.
- The site demo host had **exactly the sparx bug**: it declared `product.title`/`product.price`/`empty-collection` in `dataSources()` but never handled them in `resolveBinding`/`resolveCollection` — they "worked" only via the `visible:false` fallthrough. Our own harness modeled the footgun.
- Two e2e tests **asserted the footgun as intended behavior** ("a ref the demo host doesn't recognize resolves visible:false").
- `Canvas.isEmptyContainer` read AUTHORED children only, so `container: true` made a prop-populated Wordmark render as an empty drop-zone. It now asks the expansion (§C.3).
- `useEditor()` returned `Editor`, but the type wasn't re-exported — a host couldn't name it.
- `email-templates.spec.ts` had a **genuinely flaky test** (unrelated to this work; confirmed against a clean tree): it asserted `toHaveCount(0)` against a Select popup that may not have opened yet — vacuous AND non-synchronizing, so `Escape` raced the open animation and Base UI's inert backdrop then swallowed every later click. Fixed by anchoring on the popup actually being open/closed; 60/60 under `--repeat-each=15`.
- Two tests broke on Batch 3 by asserting bare text (`getByText("Acme Storefront")`) that now matches **twice** — the Inspector preview AND the canvas. Both were written when only the preview resolved; the strict-mode violation was the feature landing. Now scoped (`data-testid="data-preview"` vs. the canvas node).

> **Purpose.** Close three gaps between what the data-resolution layer *promises* and what it *does*: an unresolved ref silently destroys authored content instead of reporting; the canvas never resolves bindings at all, so "preview == production" is half-built; and `Wordmark` cannot hold a logo despite its own CSS and React wrapper being built for one. None is domain-specific — each is a defect against our own written contract.

> **Origin.** A consumer audit (sparx) tried to bind a logo to a `Wordmark` and got an empty span. Three distinct failures stacked: the component has no image surface, the canvas never resolves so nothing would have shown anyway, and the unresolved ref blanked the node with no diagnostic. They spent an afternoon misdiagnosing #3 as a ref-path bug — which is itself the evidence that the silence is the defect. SilicaUI ships these on universal merit; sparx is a beneficiary, not the designer.

> **What we explicitly reject from the report.** sparx diagnosed the binding failure as *"your node stores `{ref:'logo'}` — a bare field key; the resolver reads it as `root.logo` → undefined."* **That is not what happens.** Refs are opaque by design ([schema.ts:41](../packages/silicaui-html/src/schema.ts#L41)) — `resolveTree` never parses, splits, or path-walks a ref; it hands the string verbatim to `host.resolveBinding` ([resolve.ts:66](../packages/silicaui-html/src/resolve.ts#L66)). The picker can only ever emit keys the host itself declared in its own `DataSource` catalog ([Inspector.tsx:959-966](../packages/silicaui-builder/src/site/react/Inspector.tsx#L959-L966), `value: s.key`). A ref that doesn't resolve means **the host's catalog and the host's resolver disagree** — a host-side bug. We are **not** adding a path/root convention, and `ref` stays opaque (§6). What we *are* fixing is that the engine gave them no way to see that.

---

## 0. Three features, deliberately orthogonal

| # | Feature | One-line | Touches |
|---|---------|----------|---------|
| **A** | **Resolution honesty** | Distinguish *"I don't know this ref"* from *"the value is empty"*; on unknown, keep authored content and report a diagnostic instead of blanking. | `silicaui-html` `resolve.ts`; builder + email resolvers; harness hosts. |
| **B** | **Canvas resolution** | The canvas walk resolves value/html binds through the same primitive `toHtml` uses, behind an author-facing Data toggle. | `silicaui-builder` Canvas, toolbar, Inspector. |
| **C** | **Brand mark** | `Wordmark` becomes a container that can hold a logo (`src`/`alt` or a slotted mark) — plus `ComponentDef.primary`, which kills the hardcoded bind-target list. | `silicaui-html` `component.ts`; `silicaui`/`silicaui-react` Wordmark; builder palette + inspector. |

A is the precondition for B (resolving on the canvas *without* A would blank every placeholder the moment a host attaches a resolver — strictly worse than today). C stands alone but consumes A's `primary` mechanism. **Build order: A → C → B.**

---

## Feature A — resolution honesty

### A.1 The defect

[resolve.ts:149](../packages/silicaui-html/src/resolve.ts#L149) is:

```ts
return { ...node, children: [String(value ?? "")] };
```

An unresolved ref yields `value: undefined` → `[""]` → the node renders empty, and the authored placeholder is destroyed. Same at `:147` (input `value=""`), `:82` (`rawHtml: ""`), and in the email twin ([email/resolve.ts:56](../packages/silicaui-builder/src/email/resolve.ts#L56)). There is no `console.warn`, no dev diagnostic, and — the root cause — **no representable difference between these two states:**

| Host means | Host returns today | Engine does today | Engine *should* |
|---|---|---|---|
| "I know `site.title`; it's currently empty" | `{ value: undefined }` | renders empty | renders empty ✅ |
| "I've never heard of `logo`" | `{ value: undefined }` | renders empty | **keep authored content + report** |

Both are `{ value: undefined }`. The engine cannot tell them apart, so it cannot be honest. Everything else in this feature follows from making that distinction representable.

Our own harness models the trap: [harness/main.tsx:112](../packages/silicaui-builder/harness/main.tsx#L112) falls through to `{ value: undefined, visible: false }` for any unrecognized ref — silently *dropping the node*. We shipped the footgun and then demoed it.

### A.2 Schema — `undefined` means "unknown ref"

Widen the hook's return type in [resolve.ts:40](../packages/silicaui-html/src/resolve.ts#L40):

```ts
export interface ResolveHost {
  /** Resolve `ref` to a value. Return `undefined` — NOT `{ value: undefined }` —
   *  when the ref is UNKNOWN to this host (a typo, a stale document, a catalog
   *  the resolver doesn't actually implement). The two are different states and
   *  the engine treats them differently: an unknown ref keeps the node's authored
   *  content and reports a diagnostic (§A.3); a KNOWN ref whose value is empty
   *  renders empty, which is a legitimate result. */
  resolveBinding?(ref: string, scope: DataScope): Resolved | undefined;
  resolveCollection?(ref: string, scope: DataScope): readonly unknown[] | undefined;
  /** Structured report of every unresolved ref encountered in a walk. Absent →
   *  the walk is silent (pure; a static publish path pays nothing). The builder
   *  always supplies one (§A.5). */
  onDiagnostic?(d: ResolveDiagnostic): void;
}

export interface ResolveDiagnostic {
  /** `unknown-ref` — the host returned `undefined` for a ref it was asked about.
   *  Additive union; new codes are non-breaking. */
  code: "unknown-ref";
  ref: string;
  /** The bound node's id, so an editor can jump to / badge the exact node. */
  nodeId?: string;
  kind: DataBinding["kind"];
}
```

**Why widening is safe.** `Resolved` is assignable to `Resolved | undefined`, so every existing host still typechecks unchanged and keeps today's behavior for every ref it actually handles. Only hosts that *want* honesty opt in by returning `undefined`. The one behavior change for a non-updated host is that `{ value: undefined }` still blanks — which is now the *documented* meaning of "known but empty", so it is correct rather than accidental.

**Why not `{ unresolved: true }`.** A sentinel field on `Resolved` makes the invalid state `{ value: 42, unresolved: true }` representable. Bare `undefined` is unrepresentable-when-wrong, reads naturally at the call site (`if (!resolved)`), and matches the `Map.get` / `find` idiom every JS host already knows.

### A.3 Engine policy — keep, don't blank

In `resolveNode`, all three bind branches gain the same shape:

```ts
if (node.data?.kind === "value" && host.resolveBinding) {
  const resolved = host.resolveBinding(node.data.ref, scope);
  if (!resolved) {
    // UNKNOWN ref: the authored content is the best thing we have. Keep the node
    // exactly as authored — including its `data` marker, so a downstream runtime
    // (or a re-resolve against a fixed catalog) still sees the bind — and report.
    host.onDiagnostic?.({ code: "unknown-ref", ref: node.data.ref, nodeId: node.id, kind: "value" });
    return node;
  }
  if (resolved.visible === false) return undefined;
  // …unchanged from here
}
```

Contract:
- **Unknown ref → the node passes through untouched**, marker included. This is the *same* thing `resolveTree` already does when a host supplies no hooks at all ([resolve.ts:54](../packages/silicaui-html/src/resolve.ts#L54)) — we are extending an existing, tested behavior from all-or-nothing to per-ref, not inventing a policy.
- **Unknown ref never drops a node.** Only an explicit `visible: false` drops. "I don't know" and "hide this" are different answers and must not collide.
- **Collections**: `resolveCollection` returning `undefined` → keep authored children once (today's zero-items placeholder path, [resolve.ts:90-94](../packages/silicaui-html/src/resolve.ts#L90-L94)) + diagnostic. Notably `omitWhenEmpty` **does not apply** to an unknown ref — that flag means "this collection is legitimately empty, render nothing," which is a claim only a host that *knows* the ref can make.
- **`html` binds**: unknown → keep authored children, no `rawHtml`. Never emit `rawHtml: ""` for a ref we couldn't resolve.

### A.4 The email resolver

[email/resolve.ts](../packages/silicaui-builder/src/email/resolve.ts) gets the same treatment, with one deliberate divergence retained: merge tokens. An unresolved `{{ref}}` mid-sentence currently elides to `""` ([:99](../packages/silicaui-builder/src/email/resolve.ts#L99)). Under this spec an **unknown** token renders **its own literal source** (`{{logo}}`) rather than vanishing, and reports — a visible artifact in a test send beats a silently mangled sentence, and it's the same "keep what was authored" rule as everywhere else. A **known-but-empty** token still elides to `""`, which is the deliberate behavior documented at `:88-90` and stays.

`fillEmailValue`'s existing no-op-when-nothing-to-write-to path ([:70](../packages/silicaui-builder/src/email/resolve.ts#L70), `:73`) is untouched — "a bind with nothing to write to is inert, not an error" is a different and correct rule.

### A.5 Surfacing — where "loudly" actually happens

The core stays **pure**: no `console` in `silicaui-html`, no `NODE_ENV` sniffing. It reports through `onDiagnostic` and nothing more. Loudness is the *consumer's* job, and the consumer that matters is the builder:

- **Canvas** — a bound node with an unknown ref renders its authored content wearing an error affordance (a warning badge on the selection chrome + a `data-sui-unresolved` hook for chrome styling). You see the placeholder *and* that it's broken. This is what would have saved sparx the afternoon.
- **Inspector** — the Data group's `DataPreview` row ([Inspector.tsx:1073-1079](../packages/silicaui-builder/src/site/react/Inspector.tsx#L1073-L1079)) shows `Unknown ref "logo" — this host doesn't resolve it` in a Field error state, reusing the existing `FieldStatus` error surface rather than a bespoke widget ([[feedback-fieldstatus-on-existing-inputs]]).
- **Publish/`toHtml`** — a host wanting CI enforcement passes its own `onDiagnostic` and decides (warn, throw, fail the build). We don't decide for them.

**Resolved decision — no default `console.warn`.** Tempting, and it *is* what a lone integrator on the `toHtml` path would want. Rejected because the core is a pure, framework-neutral, synchronous walker that may run per-render on a server, and a warn-per-node-per-render is a performance and log-noise hazard we'd never be able to take back. The builder — where the reported pain actually occurred — is always loud. Revisit only if a real host reports the publish path is too quiet.

### A.6 Fix the harness

[harness/main.tsx:112](../packages/silicaui-builder/harness/main.tsx#L112) and `:165` must stop returning `{ value: undefined, visible: false }` for unrecognized refs and return `undefined` instead. Our demo host should model the contract, not the footgun.

---

## Feature C — the brand mark

*(Specced before B because B's e2e wants a bindable logo to prove itself with.)*

### C.1 The defect

Three layers disagree about what a `Wordmark` is:

| Layer | Believes | Evidence |
|---|---|---|
| React wrapper | holds a mark as a child | [wordmark.tsx:23](../packages/silicaui-react/src/wordmark.tsx#L23) — `<Wordmark as="a" href="/"><LogoMark />Acme</Wordmark>` |
| CSS | holds a mark as a child | [wordmark.js:29](../packages/silicaui/src/components/wordmark.js#L29) — `& svg { width: 1.15em; height: 1.15em }` |
| **Schema** | **text only** | [component.ts:780](../packages/silicaui-html/src/component.ts#L780) — `elementDef("Wordmark", "content", "wordmark", "span")` → `container: false`, `expand` = `textChildren(n, "text")` |

The schema is the layer the builder reads, so the builder wins and the answer is text-only. A brand lockup that can't hold a brand mark is broken for every consumer of a visual builder.

### C.2 `ComponentDef.primary` — the enabling cleanup

Before touching Wordmark: `fillValue` currently hardcodes its bind-target guesses ([resolve.ts:155](../packages/silicaui-html/src/resolve.ts#L155)):

```ts
if (typeof value === "string" && ("src" in props || node.component === "Image" || node.component === "Avatar")) {
```

A name-list in the resolver is exactly the "new component needs an engine edit" coupling `ComponentDef.container` was introduced to kill. And it's about to bite: give Wordmark a `src` prop and `"src" in props` makes a bare bind of `site.identity.name` write the site name **into the image URL**. We'd ship a new silent failure while fixing one.

So add to `ComponentDef` ([component.ts:56](../packages/silicaui-html/src/component.ts#L56)):

```ts
/** The prop a bare `data:'value'` bind fills when no explicit `attr` is given —
 *  this component's PRIMARY content. Replaces the resolver's hardcoded
 *  name-list: a component declares its own bind target, so a new component needs
 *  no `resolve.ts` edit. Absent → the existing auto-detection applies
 *  (label → text). Render-neutral; `expand()` never reads it. */
primary?: string;
```

- `Image`, `Avatar` → `primary: "src"` (deletes the name-list).
- `Wordmark` → `primary: "text"` — an explicit declaration that binding a Wordmark means binding its *name*, and the logo is bound via `attr: "src"` or authored as a child.
- Element nodes are unaffected (the `img`/`source`/`input` tag checks are tag-driven, already principled, and stay).

`fillValue` takes the def registry it already has access to via the component lookup; the `"src" in props` heuristic is **removed**, not kept as a fallback — a silent guess that can write a name into an image URL is worse than the explicit `attr` escape hatch that already exists for anything undeclared.

### C.3 Wordmark becomes a container with a mark

Replace the `elementDef` line with a real def:

```ts
{
  name: "Wordmark",
  category: "content",
  label: "Wordmark",
  icon: "wordmark",
  container: true,
  primary: "text",
  expand: (n) => {
    const href = n.props?.href;
    const tag = href != null ? "a" : "span";
    const attrs = href != null ? { href: href as string } : undefined;
    // Authored children win outright — the `<Wordmark><LogoMark/>Acme</Wordmark>`
    // composition the React wrapper has always documented.
    if (n.children?.length) return lower(n, tag, { attrs, children: n.children });
    const src = n.props?.src;
    const children: Child[] = [];
    if (typeof src === "string" && src) {
      children.push({
        kind: "element", tag: "img", class: "wordmark-mark",
        attrs: { src, alt: (n.props?.alt ?? "") as string },
      } as ElementNode);
    }
    if (n.props?.text != null) children.push(String(n.props.text));
    return lower(n, tag, { attrs, children });
  },
}
```

Decisions:
- **`container: true`** — the builder can nest an `Image`/`Icon` inside, which is the composition the React wrapper and CSS already assume. This alone fixes the reported case.
- **`src`/`alt` props too, not just nesting.** Nesting is the power path; a `src` prop is the one-control Inspector path — "assign the logo to the wordmark" should be a swatch-adjacent control, not a tree operation. Both lower to the same DOM.
- **`href` → `<a>`**, mirroring `Button`'s existing `href` sugar ([component.ts:~575](../packages/silicaui-html/src/component.ts#L575)) and the React wrapper's `as`/`href`. Same idiom, no new vocabulary.
- **`alt` defaults to `""`** — a wordmark's mark is decorative when the name renders beside it. An author who ships mark-only sets `alt` explicitly. (Matches `Image`'s existing `alt: (n.props?.alt ?? "")`.)

**CSS** ([wordmark.js](../packages/silicaui/src/components/wordmark.js)): generalize the `& svg` rule at `:29` to cover the img — `& :is(svg, img, .wordmark-mark) { width: auto; height: 1.15em }` (height-locked, width-auto, since a logo is rarely square and the existing square `svg` sizing would squash it). Verify in a real browser per [[verify-css-in-users-browser-not-just-playwright]].

**React** ([wordmark.tsx](../packages/silicaui-react/src/wordmark.tsx)): add optional `src`/`alt` rendering the same `img` before `children`. The existing children path is untouched and stays the documented primary.

**Builder**: the palette entries ([palette.ts:209](../packages/silicaui-builder/src/site/palette.ts#L209), `:123`, `:542`) keep seeding `{ text: "SilicaUI" }` — a blank logo slot is the right default. The Inspector's Settings tab gains `src`/`alt`/`href` for Wordmark via the existing component-props mechanism ([[builder-inspector-design-settings-tabs]] — props live in **Settings**, and e2e must click Settings first).

**Not building:** a separate `Brand`/`Logo` primitive. The CSS and React wrapper are already a lockup; a second component would be two half-answers competing in the palette. `Wordmark` *is* the brand mark.

---

## Feature B — canvas resolution

### B.1 The defect

[resolve.ts:14-16](../packages/silicaui-html/src/resolve.ts#L14-L16) promises:

> "`resolveTree(tree, host)` feeds BOTH `toHtml` … **and a canvas's own React walk** — one resolution primitive, so preview == production is structural, not hoped-for."

`Canvas.tsx` contains **zero** references to `resolveTree`/`resolveBinding`. The only live resolution an author ever sees is the Inspector's `DataPreview` row, whose own comment calls itself a workaround ("so an author sees realistic data while editing, without leaving the canvas"). We wrote the promise down and shipped half of it.

### B.2 Why the canvas can't just call `resolveTree` — two landmines

Production resolution and editing resolution are **not** the same operation, and this is the crux of the feature:

1. **`visible: false` drops the node.** In production, correct. On the canvas, an author's node *vanishes with no way to select it, inspect it, or undo the binding that hid it*. A dropped node is unauthorable.
2. **Collection expansion clones children.** `items.flatMap(...)` ([resolve.ts:95](../packages/silicaui-html/src/resolve.ts#L95)) produces N copies of a subtree **carrying the same `id`s** — ids that the canvas uses for `data-sui-id` click-select and React keys. Ten products → ten nodes claiming id `abc`. Selection becomes ambiguous and React keys collide.

A third, subtler one: **a resolved bound node's text is no longer authored.** The canvas makes text nodes `contentEditable` ([Canvas.tsx:188](../packages/silicaui-builder/src/site/react/Canvas.tsx#L188), `:435`) and commits `textContent` on blur via `editor.setText` ([:870](../packages/silicaui-builder/src/site/react/Canvas.tsx#L870)). If an author edits *resolved* text, they'd silently overwrite the authored placeholder with the host's data — the placeholder they'd get back the moment the data changed.

### B.3 The shape — `ResolveOptions.editing`

`resolveTree` takes an options bag; the walker's *policy* diverges where authoring demands it, while the *resolution* stays the one shared primitive:

```ts
export interface ResolveOptions {
  /** EDIT-MODE policy. The canvas resolves the same refs through the same host,
   *  but never destroys authorability: a `visible: false` node is ANNOTATED
   *  rather than dropped (the editor renders it ghosted, still selectable), and
   *  collection expansion is suppressed (§B.4). Absent/false → production policy,
   *  byte-identical to today. */
  editing?: boolean;
}
export function resolveTree(tree: Node, host: ResolveHost, scope?: DataScope, opts?: ResolveOptions): Node;
```

Under `editing: true`:
- `visible: false` → keep the node; report `{ code: "hidden" }` via `onDiagnostic` so the canvas can ghost it. **Never drop.**
- Unknown ref → identical to production (keep + report). Feature A already got this right for both modes, which is why A ships first.
- Value/html binds → **resolve normally.** This is the actual win: your real brand name, on the canvas.

This does *not* betray "one resolution primitive". Both modes call the same walker, the same hooks, the same refs — `editing` selects a **destruction policy**, and the only thing it refuses to do is destroy. Preview == production for every *value*; it deliberately diverges only where production's answer is "show nothing," which is not an answer an editor can render.

### B.4 Scope — v1 resolves values, not collections

**v1 ships `value` + `html` binds on the canvas. Collection expansion stays as today** (authored children render once, the existing placeholder convention).

This is the whole reported ask — *"preview your real brand"* is a value bind — at a fraction of the risk. Expanding collections on the canvas requires an id-identity design (per-item suffixed ids like `${id}#${index}`, mapped back to the base id on select, with edits fanning out to all instances) that is the *same problem symbol instances already solved* and should reuse that machinery rather than invent a parallel one. That's a real feature; it isn't this one. v1 must not foreclose it: `editing` is where its policy will live.

Ship v1, then design collection expansion against the symbol-instance precedent as its own batch.

### B.5 Canvas wiring

- **The walk.** `Canvas` resolves once per render at the tree root — `resolveTree(root, host, undefined, { editing: true })` — memoized on `[root, host, dataPreview]`, feeding the existing `CanvasNode` recursion ([Canvas.tsx:383](../packages/silicaui-builder/src/site/react/Canvas.tsx#L383)) unchanged. The renderer stays dumb; resolution happens above it. Ids survive because v1 doesn't expand collections (§B.4).
- **The Data toggle.** A canvas-toolbar toggle (**Data** on/off, default **on**) flips between resolved and authored rendering. Non-negotiable, for two reasons: an author must be able to *see and edit the placeholder* that ships when data is absent, and it's the escape hatch when a host's resolver is slow or wrong. Dogfoods the existing `toggle-group` ([[builder-dogfoods-silicaui]]). Persisted per-session alongside device/theme-mode.
- **contentEditable, resolved.** A node whose text came from a *successful* bind is **not** `contentEditable` — its content isn't authored, so there's nothing to commit. The Inspector's Content field still edits the placeholder (and the Data toggle reveals it on the canvas). A node with an *unknown* ref is still showing authored content, so it **stays** editable. The rule is exactly "is this text authored right now?" — which the resolution result already tells us.
- **Unresolved chrome.** Feature A's diagnostics collect into a per-render map keyed by `nodeId`; the selection chrome badges those nodes and the Navigator marks their rows.
- **No new host seam.** `BuilderHost` already extends `ResolveHost`. A host that implements `resolveBinding` today gets canvas resolution for free the moment this lands — which is the point.

---

## 6. Non-goals

- **No ref path/root convention.** `ref` stays an opaque host-owned string (§Origin). We are not adding `root.` prefixes, dotted-path walking, or a scope-composition rule. `DataScope` carries the resolved item, not a path — that decision stands ([builder-contract.md §3](builder-contract.md)).
- **No expression language.** `visible` remains the entire conditional surface. Not adding `visibleIf`, formatters, or fallback-value expressions. (A `fallback` on `DataBinding` is *deliberately* not in this spec — the authored content **is** the fallback, which is Feature A's whole thesis.)
- **No collection expansion on the canvas in v1** (§B.4).
- **No `Brand`/`Logo` primitive** (§C.3).
- **No default `console.warn` in the core** (§A.5).
- **No async resolution.** The walk stays pure and synchronous; hosts pre-load. Unchanged.

---

## 7. Build plan

**Batch 1 — Feature A (honesty) — ✅ SHIPPED:**
1. `silicaui-html`: widen `resolveBinding`/`resolveCollection` to `| undefined`; add `ResolveDiagnostic` + `onDiagnostic`; keep-don't-blank in all three bind branches; `omitWhenEmpty` no longer applies to an unknown collection ref.
2. `silicaui-builder` email resolver: same policy; unknown merge token renders its literal source; known-but-empty still elides.
3. Harness hosts return `undefined` for unrecognized refs (`harness/main.tsx:112`, `:165`).
4. Builder surfacing: Inspector `DataPreview` error state via `FieldStatus`.
5. Probe: `verify:resolve` extended — unknown ref keeps authored content + fires exactly one diagnostic; known-empty still blanks; `visible:false` still drops; unknown collection ignores `omitWhenEmpty`; a host with no hooks is still byte-identical (regression guard).

**Batch 2 — Feature C (brand mark) — ✅ SHIPPED:**
6. `ComponentDef.primary`; `fillValue` reads it; **delete** the `Image`/`Avatar` name-list and the `"src" in props` heuristic.
7. Wordmark def: `container: true`, `primary: "text"`, `src`/`alt`/`href`, `expand` per §C.3. Golden test: byte-exact markup for text-only (**unchanged from today** — this is the regression guard), mark+text, authored-children, and `href`.
8. CSS `:is(svg, img, .wordmark-mark)` height-lock; React `src`/`alt`; Inspector Settings controls.
9. Browser verify per [[verify-css-in-users-browser-not-just-playwright]] + [[verify-with-playwright-cli-not-mcp]]; MCP catalog regen ([[silica-component]] sync rule).

**Batch 3 — Feature B (canvas resolution) — ✅ SHIPPED:**
10. `ResolveOptions.editing`; `visible:false` annotates instead of dropping; `hidden` diagnostic code.
11. Canvas: memoized root resolve; Data toggle in the toolbar (`toggle-group`); resolved-text is not `contentEditable`; unresolved badge + Navigator marks; ghosted rendering for `visible:false`.
12. e2e: bind a Wordmark to a real host ref → **the canvas shows the host's brand name** (the origin case, end to end, and the reason C precedes B); Data off → placeholder returns and is editable again; bind an unknown ref → placeholder renders wearing a badge, never blank.

**Docs:** promote this file to a versioned design authority on merge. Correct the `resolve.ts:14-16` docblock — it currently describes B as though it exists. Cross-link from [builder-contract.md](builder-contract.md) §3 and note `primary` in [silicaui-architecture.md](silicaui-architecture.md).

### Touchpoint summary

| Layer | Files |
|-------|-------|
| Resolution core | `silicaui-html/src/resolve.ts` |
| Component registry | `silicaui-html/src/component.ts` |
| Email resolver | `silicaui-builder/src/email/resolve.ts` |
| Wordmark | `silicaui/src/components/wordmark.js`, `silicaui-react/src/wordmark.tsx` |
| Canvas | `silicaui-builder/src/site/react/Canvas.tsx` (+ toolbar) |
| Inspector | `silicaui-builder/src/site/react/Inspector.tsx` (site + email) |
| Navigator | `silicaui-builder/src/site/react/Navigator.tsx` |
| Harness | `silicaui-builder/harness/main.tsx` |
| MCP catalog | `silicaui-mcp` (regen) |

---

## 8. Resolved decisions

1. **Unknown-vs-empty signal** → bare `undefined` return, not a `{ unresolved: true }` sentinel (§A.2).
2. **Unknown-ref policy** → keep authored content + report; never drop (§A.3). The authored content *is* the fallback — so no `DataBinding.fallback` field.
3. **Loudness** → `onDiagnostic` only; no core `console.warn` (§A.5).
4. **Ref opacity** → unchanged; sparx's path diagnosis rejected (§Origin). Their catalog/resolver mismatch is theirs to fix — Feature A just makes it a two-minute fix instead of an afternoon.
5. **Canvas policy divergence** → one walker, `editing` flag selects a destruction policy; never a second resolver (§B.3).
6. **Collections on canvas** → deferred to its own batch, reusing symbol-instance id identity (§B.4).
7. **Data toggle** → ships in v1, default on (§B.5).
8. **Brand mark** → extend `Wordmark`, no new primitive (§C.3).
9. **Bind-target declaration** → `ComponentDef.primary`, replacing the resolver's hardcoded name-list outright (§C.2).
