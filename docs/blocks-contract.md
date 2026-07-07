# silicaui Blocks — Authoring & Consumption Contract

**Version:** 1.1
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-05

> **Purpose.** silicaui ships three layers, not two. Below the React layer and below the CSS layer sits the thing this doc governs: **blocks** — opinionated, pre-composed arrangements of silicaui primitives (a marketing navbar, a hero, a pricing table, a footer). Blocks are the "Tailwind-UI-rival" tier. The point of owning them **in silicaui** is that a consuming platform (sparx first) stops *authoring, skinning, and visually testing a component library inside itself* and just **imports** one. This contract is the interface that makes that safe: one canonical block, many render targets, a frozen class vocabulary, and a security posture a governed host can trust without re-vetting.
>
> **Read this first, one line:** a block's canonical source is a **framework-neutral node tree** — never React. React and copy-in HTML are *projections* of that tree; a structured host (sparx) consumes the tree directly. If blocks were authored in JSX, the non-React consumers (the largest reason to build this) couldn't consume them at all.

---

## 0. Where blocks sit

```
silicaui            (Tailwind v4 plugin: tokens + component CLASSES)      ← the vocabulary
   │
   ├── silicaui-react   (typed React components over the classes)         ← one consumer
   │
   └── silicaui/blocks  (composed patterns: navbar, hero, pricing, …)     ← THIS DOC
             │   canonical source = a neutral node tree
             ├──►  .html         (copy-in, framework-free)
             ├──►  <Block/>       (generated silicaui-react component)
             └──►  block.json     (the neutral tree — for structured hosts)
```

Three consumers, one source:

| Consumer | Takes | Why |
| --- | --- | --- |
| A developer, any framework | the generated **HTML** | paste-and-own, like Tailwind UI / a copy-in registry |
| A React app (incl. sparx's hand-authored `apps/site` chrome) | the generated **React** component | typed props = the block's slots |
| A **structured host** — sparx's site builder, `@sparx/email`, a CMS renderer | the **neutral tree** (`block.json`) | the host adapts the tree to its own node model; it does **not** render React |

The third consumer is the load-bearing one. It is why the canonical format is a tree, not a component.

---

## 1. What a block is — and is not

**Is:** a single-rooted composition of *existing* silicaui primitives + the allowed utility surface, carrying realistic default content, declaring its editable regions (**slots**) and any interactivity (**behavior markers**). Self-contained, themeable, responsive, and authored to pass a host's security gate untouched.

**Is not:**
- **A new primitive.** A block never introduces a component class. If a pattern needs a new primitive, that primitive is added to the silicaui CSS layer first, then composed here.
- **A React component.** (See §2.)
- **A page or a template with real data.** A block is inert-but-rich: it ships believable placeholder copy and *declares where real content plugs in*, never a concrete record.
- **A carrier of raw scripts, inline styles, or arbitrary utilities.** (See §5, §7.)

---

## 2. The canonical source is a neutral tree (never JSX)

A block is authored **once**, as a `Block` value (§3–§4): a JSON-serializable node tree using a small, closed authoring vocabulary. Everything a consumer receives is a **projection** of that tree:

- **HTML** — walk the tree, emit tags + classes + attrs, inline slot defaults.
- **React** — a generated `silicaui-react` component whose props are the block's slots; renders the same tree with the active class prefix.
- **`block.json`** — the tree itself, validated, for structured hosts.

**Why not author in React and extract a tree?** Because JSX permits arbitrary JavaScript (conditionals, maps, helper calls, spreads) that cannot be reliably lowered back to a static, serializable tree — which is exactly what a non-React host must ingest. Authoring in the neutral form is the constraint that keeps all three projections faithful and keeps the security surface finite. **The tree is the source of truth; the React component is output, not input.**

---

## 3. The node schema

silicaui deliberately adopts the node shape sparx has already proven in production (its `BuilderNode` + catalog kit), because doing so makes the most demanding consumer's adapter a **near-identity** function and gives every other consumer a battle-tested target. The neutral node:

```ts
/** A block is a single-rooted tree of these. JSON-serializable; no functions. */
interface BlockNode {
  /** What this node is:
   *  · 'el:<tag>'  — a raw HTML element (div, section, nav, h1, a, img, ul, …)
   *  · '<Component>' — a silicaui component atom by name (Button, Card, Badge,
   *                    Image, Icon, Divider, …) that "wears its own class". */
  type: string;
  /** The ONE styling surface: a space-separated string of silicaui component
   *  classes + the allowed token/layout utilities (§5). No other styling channel
   *  exists — no inline style, no style object. */
  class?: string;
  /** Content + metadata. For 'el:*' nodes: whitelisted HTML attributes live here
   *  directly, plus `text` for inline text. For component atoms: the component's
   *  own props. Markers (`slot`, `behavior`, `role`) also ride here (§6, §7). */
  props?: Record<string, unknown>;
  /** Child nodes. Omitted for void elements and text leaves. */
  children?: BlockNode[];
}

/** The authored unit: a manifest + its tree (§8). */
interface Block {
  key: string;               // stable, globally-unique slug: 'hero_split_cta'
  name: string;              // 'Hero — split with CTA'
  category: BlockCategory;   // 'navigation' | 'hero' | 'pricing' | 'footer' | …
  version: string;           // semver — the class vocabulary is a DATA contract (§11)
  description: string;
  tags?: string[];
  colors: string[];          // named theme colors the tree references (§5) — a host
                             // validates these exist before stamping
  behaviors: string[];       // behavior types the tree uses (§7); [] if static
  emailEligible: boolean;    // obeys the honored email subset (§12)
  slots: SlotDef[];          // the editable-region index (§6)
  root: BlockNode;           // exactly one root
  preview?: { thumb?: string; note?: string };
}
```

**No `id` on the canonical node.** Ids are a *consumer* concern — sparx mints fresh globally-unique ids on stamp, React uses keys, HTML needs none. Behaviors correlate parts to their root by **structural nesting** (§7), never by id, so the canonical tree stays id-free and re-stampable.

Deviations from sparx's `BuilderNode` are intentional and minimal: the canonical node drops `id` (consumer-assigned) and drops sparx's data-`binding` union in favor of the host-agnostic **slot** marker (§6). Everything else — `type: 'el:<tag>'`, class-as-sole-styling, attrs+text+markers on `props`, `children` — is identical, so the sparx adapter is a rename-and-mint, not a rewrite (§10).

---

## 4. Authoring vocabulary

Blocks are written with a tiny closed helper set (the silicaui analog of sparx's `_kit`), so authoring is readable and every node is well-formed by construction:

```ts
el(tag, class, { text?, attrs?, children? })   // raw element → { type: 'el:<tag>', … }
atom(Type, class, props?, children?)            // named silicaui component atom
slot(node, { name, type, label?, repeatable? }) // mark an editable region (§6)
behave(node, { type, ...params })               // mark a behavior ROOT (§7)
part(node, role)                                 // mark a structural PART of a behavior (§7)
block({ key, name, category, … , root })         // assemble + validate the manifest
```

- `el` is the workhorse for structure and styled text. Whitelisted attributes go in `attrs`; inline text in `text`.
- `atom` stamps a silicaui component by name; its `class` lands on the rendered element and `props` carries its API (`Button {label}`, `Image {ratio, alt}`, `Icon {name}`, …).
- `slot`, `behave`, `part` decorate a node and return it, for inline composition.
- `block(...)` validates the tree against the schema at author time, so a malformed block fails at module load, not at a consumer's stamp time.

Authoring quality bar mirrors the platform bar: realistic placeholder copy (no lorem, **no uppercase "eyebrow" kicker labels** — house rule), every block responsive and visually balanced, one root node per block.

---

## 5. The class + token contract (the frozen surface)

A block's `class` strings are the interface a host depends on. They are **not cosmetic** — for a stamping host they become persisted data. The contract:

**Allowed:**
- silicaui **component classes**: `btn`, `btn-primary`, `btn-soft`, `card`, `card-body`, `navbar`, `navbar-start`, `badge`, … (with the host's prefix applied at projection time, e.g. `st-btn`).
- **Token utilities** (resolve to theme vars, never literals): surfaces/ink `bg-base-100|200|300`, `text-base-content` (+ `/60` opacity), `border-base-200|300`; brand/semantic `primary secondary accent neutral info success warning danger highlight` each with a `-content` foreground; radius `rounded-box|field|selector` + `rounded-full|lg`; `shadow-sm|md|lg`; motion `animate-fade-in|fade-up|scale-in|…`.
- The **standard Tailwind spacing/layout** scale: `p-* gap-* flex grid grid-cols-* w-* max-w-* items-* justify-*`.
- **Container queries** for responsiveness (`@3xl:flex`, `@2xl:grid-cols-2`) — **not** viewport (`md:`/`lg:`). A block sizes to its container, so multi-column layouts must collapse to one column when narrow.

**Banned (a governed host's allowlist rejects these — never author them):**
- `fixed` — full-viewport overlay / clickjacking vector.
- arbitrary `z-[…]` — use the bounded named scale (`z-40`, `z-50`).
- `content-[…]` — CSS content-injection vector.
- any `url(…)` in a class (`bg-[url(…)]`) — external load / exfiltration; images ride a `slot` of type `image`.
- raw inline `style`, `@keyframes` in a block.

⚠️ **It is `danger`, NOT `error`.** silicaui's default color list ships `error` (the daisyUI name); the block library and every consumer configure the color set to use **`danger`**. Blocks are authored against `danger`. A block referencing `error` is non-conformant.

silicaui ships a **block linter** that validates every block's `class` strings against this surface (allowed component classes + token utilities, minus the denylist) at build time — so a conformant block is *guaranteed* to pass a consumer's gate, and a drift is caught in silicaui's CI, not in a host's.

---

## 6. Slots — the editable-region contract

A block ships with good default content **and** declares which regions a consumer may edit. That dual nature is what makes one artifact serve "paste it and it looks great" *and* "make it editable in a builder."

A `slot(node, def)` marker writes `props.slot = def`:

```ts
interface SlotDef {
  name: string;        // 'headline', 'cta_primary', 'logo', 'nav_links'
  type: 'text' | 'richtext' | 'image' | 'icon' | 'link' | 'boolean' | 'select' | 'list';
  label?: string;      // human label for a host's edit UI
  required?: boolean;
  repeatable?: {       // for lists: nav links, pricing tiers, logos
    min?: number; max?: number;
    of: SlotDef[];     // the shape of one repeated item's slots
  };
}
```

- The **node keeps its default content** (the placeholder text/image the tree already carries) — the slot names it and types it; it does not blank it.
- `Block.slots` is the flat index of every declared slot (derived from the tree), so a consumer can enumerate the block's editable surface without walking it.
- **Projection mapping:**
  - **HTML** — slots are inert; defaults render. (The registry docs list them as "what to change.")
  - **React** — each slot becomes a typed prop; omitting it renders the default.
  - **Structured host** — the host maps each slot to its own editable-field/data-binding concept (sparx: to a `binding` or an editable prop — §10).

A block that hard-codes content with no slots is still valid (a static footer), but the richer the slot declaration, the more useful the block is to a builder host.

---

## 7. Behavior — the marker contract (shared runtime vocabulary)

Interactivity is declared, never scripted. A block marks **one behavior root** and its **structural parts** with a closed vocabulary; a runtime on the consuming side wires it. No block ever contains a `<script>` or raw `data-*` (a governed host strips unknown `data-*`).

```ts
behave(node, { type, ...params })   // → props.behavior = { type, … }
part(node, role)                    // → props.role = <role>
```

**Closed vocabulary** (adopted verbatim from sparx's production runtime so the two stay in lockstep — sparx pins them with a drift test):

- **behaviors:** `carousel · disclosure · tabs · scrollspy · marquee · menu · counter · dismiss · toc`
  - params, e.g. `carousel { autoplay?, interval? }`, `disclosure { single? }`, `marquee { pauseOnHover? }`, `scrollspy { threshold? }`.
- **roles:** `track · slide · prev · next · dot · dots · trigger · panel · item · tab · spy`

Rules:
- **The marker names are the contract; the lowering is each runtime's business.** silicaui's own `silicaui-behaviors` runtime lowers `props.behavior`/`props.role` to `data-sui-*`; sparx's runtime lowers the identical markers to `data-sx-*`. Same names, different prefix — so one authored block drives either runtime.
- **Both surfaces.** A behavior must work on a live page (full behavior) and preview sanely in an editor canvas (autoplay suppressed, collapsed panels revealed).
- **Closed panels ship `hidden`.** Any initially-collapsed panel carries `attrs: { hidden: true }` so it doesn't flash open before hydration; the active/open one omits it.
- **Prefer CSS-only for simple interactivity.** Disclosure via native `details/summary`, toggles via `peer` checkboxes, scrollers via `overflow-x-auto snap-x` — no runtime needed. Reserve `behave`/`part` for genuinely JS-driven composites (autoplay carousel, mega-menu, single-open accordion, JS tabs, scroll-adaptive nav).

This is the seam identified in the parity assessment (§7 there): silicaui-react drives interactivity through Base UI *for React hosts*, but a structured host renders markup, not React — so the **marker + runtime** path, not Base UI, is how blocks stay interactive for the builder-class consumer.

---

## 8. Block manifest & the index

Every block carries the `Block` manifest (§3). silicaui assembles all blocks into a validated **index** (`blocks.json` + per-category files), analogous to a component registry, exposing:
- `listBlocks()` / `getBlock(key)` and category/tag filters — for a docs site, a palette, or a host's import step.
- `catalogSummary(block)` — the manifest without the tree, for lightweight listings.
- Each block's declared `colors`, `behaviors`, `emailEligible`, and `slots` — so a consumer can validate compatibility (colors exist, behaviors supported, gate passes) **before** ingesting the tree.

---

## 9. Projections

silicaui owns the generators; a consumer never writes them:

1. **`toHtml(block, { prefix })`** — deterministic HTML string with defaults inlined. Framework-free, copy-in.
2. **`toReact(block)`** (build-time codegen) — a `silicaui-react` component; props = slots; prefix from `<SilicaProvider>`.
3. **`block.json`** — the validated neutral tree, shipped as data.

All three are byte-faithful to the one authored tree. A block that renders differently across projections is a generator bug, caught by silicaui's snapshot tests — **not** something a consumer debugs.

---

## 10. Consumption — three modes (sparx as the worked example)

The whole reason blocks live in silicaui: a host **imports and consumes**, it does not author, skin, or visual-test. The three modes:

**Mode 1 — drop the React component.** `import { HeroSplitCta } from 'silicaui-react/blocks'`. For hand-authored React surfaces (a marketing site, sparx's `apps/site` chrome). Zero adapter.

**Mode 2 — paste the HTML.** For any framework or a static page. Zero adapter.

**Mode 3 — adapt the neutral tree.** For a structured host that renders its own node model. The host writes **one** adapter, `adaptBlock(block) → HostNode[]`, driven by the block's tree. Because the canonical node already matches sparx's shape, sparx's adapter is near-identity:

| Block tree | sparx `BuilderNode` | Adapter work |
| --- | --- | --- |
| `type: 'el:<tag>'` / `'<Component>'` | same `type` | passthrough |
| `class` | `class` | passthrough (prefix already applied, or applied here) |
| `props` (text, attrs, component props) | `props` | passthrough |
| `props.slot` | `binding` / editable prop | map slot → the builder's edit affordance |
| `props.behavior` / `props.role` | `props.behavior` / `props.sxRole` | rename the `role` key |
| *(none)* | `id` | mint a fresh globally-unique id per node (sparx's `makeId`) |
| `children` | `children` | recurse |

So sparx's catalog stops being *hand-authored composed trees* and becomes **imported silicaui blocks + this thin adapter** — the authoring, skinning, and visual regression of every navbar/hero/pricing pattern moves to silicaui. sparx keeps only what is irreducibly its own: minting ids, wiring slots to its builder's edit/data model, running the block through its allowlist as a **belt-and-suspenders re-validation** (a conformant block passes untouched), and mapping markers to its runtime.

The same Mode-3 shape serves **`@sparx/email`** (which adapts the tree to inline styles under the honored subset — email rendering is a *consumer*, not a silicaui projection; §12) and a **CMS renderer**.

---

## 11. Versioning & governance (the cross-repo data contract)

Splitting the library across a repo boundary turns the class vocabulary into a **versioned contract**, and for a stamping host those class strings are **persisted data**. Therefore:

- **Blocks are semver'd**, and the **class vocabulary is frozen within a major.** Renaming a component class, a token, or a block `key` is a **major** change — because a downstream host may have stamped the old strings into stored records.
- **Within a major, changes are additive only:** new blocks, new *optional* slots, new colors. Never a rename, never a removed slot.
- **Every block declares its dependencies** (`colors`, `behaviors`, the utility surface via the linter) so a consumer validates compatibility at import and fails fast, not at render.
- **Path A first (drop-in).** silicaui blocks author against the host's *existing* class + token vocabulary (sparx: `st-*` classes, `--st-*` tokens, `danger`). A consumer adopts blocks with **zero data migration**. A nicer-naming pass (Path B) is a later, deliberate, atomic codemod across the host's catalog + persisted records — never the entry point.
- **Two-repo dev loop** is the accepted cost: iterate a block in silicaui, publish, bump in the host. Workspace-linking smooths local dev; disciplined semver is the contract at the boundary.

---

## 12. Email eligibility — metadata + discipline, NOT a silicaui compiler

`emailEligible: true` is **cheap declarative metadata plus an authoring discipline** — it is *not* a silicaui-built email compiler. **silicaui ships no `toEmail()` projection and no email linter in v1.** Rendering a block to inline styles is a **Mode-3 consumer** concern: `@sparx/email` already owns email rendering (React-Email templates + the builder email-tree renderer) and consumes the neutral block tree like any structured host (§10). Building an inline-style compiler with named-nodes-only enforcement is weeks of work for a medium silicaui does not own — so it stays out of v1, and out of the block linter's job (which is therefore only the §5 class allowlist, nothing email-specific).

The flag is a **promise the author keeps** so a downstream email renderer *can* consume the block. An `emailEligible` block stays within the honored subset:

- **Named nodes only** — compose from container/leaf *components*, not raw `el:*` (a mail renderer has no raw-element path).
- **Base classes only** — no variants (`@3xl:`/`hover:`/`dark:`), no arbitrary `[…]`; a mail renderer drops anything prefixed or bracketed.
- **Honored subset only** — containers: `flex flex-col|flex-row` / `grid grid-cols-N` / `gap-N` / `p-N` / `bg-*`; leaves: text size/weight/leading/tracking, color, alignment, padding/margin, border, radius. Shadows/filters/transforms/sizing/position **no-op** in mail.

**Enforcement in v1 is author discipline + review, not a shipped tool.** A consumer that renders email (e.g. `@sparx/email`) may validate on ingest; silicaui does not. The flag's value is letting a host or docs site *filter* email-safe blocks without silicaui owning the medium — a future `toEmail()` projection can be added later (silicaui- or consumer-side) without changing this contract.

---

## 13. Definition of done (authoring checklist)

- [ ] Single-rooted `Block` with a complete manifest (`key`, `name`, `category`, `version`, `description`, `colors`, `behaviors`, `emailEligible`, `slots`).
- [ ] Authored as a **neutral tree** via `el`/`atom`/`slot`/`behave`/`part` — no JSX, no functions, JSON-serializable.
- [ ] `class` strings use **only** the allowed component + token + layout surface; **no** `fixed` / `z-[…]` / `content-[…]` / `url()` / inline style; **`danger` not `error`** — passes the block linter.
- [ ] Responsive via **container queries**; multi-column collapses to one column when narrow.
- [ ] Editable regions declared as **slots** with types; realistic default content retained (no lorem, no eyebrow kickers).
- [ ] Interactivity via **markers** (`behave`/`part`) from the closed vocabulary, both-surface safe, collapsed panels `hidden`; CSS-only where it suffices.
- [ ] All three **projections** (HTML, React, `block.json`) render byte-faithfully (snapshot-tested).
- [ ] Email-eligible blocks obey the **honored subset** (§12).
- [ ] Semver honored; within-major changes additive only (§11).

---

## Appendix — worked example (abbreviated)

A split hero with a headline slot, a body slot, a primary CTA slot, and an image slot — authored once, consumed three ways.

```ts
export const heroSplitCta = block({
  key: 'hero_split_cta',
  name: 'Hero — split with CTA',
  category: 'hero',
  version: '1.0.0',
  description: 'Two-column hero: copy + primary action on the left, image on the right.',
  colors: ['primary', 'base-100', 'base-content'],
  behaviors: [],
  emailEligible: false,
  root:
    el('section', 'bg-base-100 @container', {
      children: [
        el('div', 'grid grid-cols-1 @3xl:grid-cols-2 gap-8 items-center p-8', {
          children: [
            el('div', 'flex flex-col gap-4', {
              children: [
                slot(
                  el('h1', 'text-4xl @3xl:text-5xl font-semibold text-base-content', {
                    text: 'Ship your store in an afternoon',
                  }),
                  { name: 'headline', type: 'text', label: 'Headline' },
                ),
                slot(
                  el('p', 'text-lg text-base-content/70', {
                    text: 'Everything you need to sell online — no code, no wrangling.',
                  }),
                  { name: 'subhead', type: 'text', label: 'Subheadline' },
                ),
                slot(
                  atom('Button', 'btn btn-primary btn-lg', { label: 'Start free' }),
                  { name: 'cta', type: 'link', label: 'Primary button' },
                ),
              ],
            }),
            slot(
              atom('Image', 'rounded-box w-full', { ratio: 'wide', alt: 'Product preview' }),
              { name: 'image', type: 'image', label: 'Hero image' },
            ),
          ],
        }),
      ],
    }),
  slots: [
    { name: 'headline', type: 'text', label: 'Headline', required: true },
    { name: 'subhead', type: 'text', label: 'Subheadline' },
    { name: 'cta', type: 'link', label: 'Primary button' },
    { name: 'image', type: 'image', label: 'Hero image' },
  ],
});
```

- **HTML:** `toHtml(heroSplitCta, { prefix: 'st-' })` → a `<section>…` with defaults inlined.
- **React:** `<HeroSplitCta headline="…" cta={{ label, href }} image={…} />`.
- **sparx:** `adaptBlock(heroSplitCta)` → a `BuilderNode` subtree with fresh ids, the four slots wired to the builder's edit fields, ready to stamp — no hand-authoring.