# @wizeworks/silicaui-builder — UX Design Principles & Prior-Art Synthesis

> **Status:** design authority (v0.1, 2026-07-06). Companion to `silicaui-architecture.md`.
> This document is the *product/UX* authority for @wizeworks/silicaui-builder, the way
> `silicaui-architecture.md` is the *technical* authority. It exists because the
> engine + element canvas are proven, and the next phase — the authoring surface
> (tree, inspector, palette, drag-and-drop) — is a **UX problem, not an engineering
> one**. Getting it wrong is expensive rework.

## Provenance

Synthesized from five independent prior-art research streams (2022–2026 sentiment,
official docs, teardowns, ~120 web searches total):

1. **Pro / class-based builders** — Webflow, Framer, Plasmic, Builder.io, Onlook,
   Webstudio, Windframe, Pinegrow. *(Our closest precedents; class-only is our model.)*
2. **SMB section builders** — Wix (Editor/Studio/ADI), Squarespace (Classic + Fluid
   Engine), Shopify OS 2.0, GoDaddy, Weebly, Carrd.
3. **WordPress ecosystem** — Gutenberg + FSE, Elementor, Divi, Beaver Builder, Bricks.
4. **Interaction mechanics & perceived speed** — drag-drop, selection, tree, inspector,
   undo, keyboard, empty states, latency (cross-builder).
5. **Progressive disclosure, guardrails, onboarding, AI & anti-features** — NN/g,
   Material 3, daisyUI, the AI-builder wave.

The striking result: the streams **converged independently**. Where five differently-framed
investigations reach the same conclusion, that conclusion is load-bearing. Those are §1.

---

## §0 — The one thesis

**We have a structural chance to be Framer-fast for novices and Webflow-powerful for pros
*at the same time* — precisely *because* we are class-only.** Every competitor that chased
this with **freedom** (Wix's absolute positioning) lost the floor; every competitor that
chased it with a **second product** (Wix Editor vs Studio) blurred both audiences. We win it
a third way: **progressive disclosure over one constrained-but-escapable class/token
vocabulary.** That single design decision is simultaneously the low floor, the high ceiling,
the guardrail, and the AI target. Everything below serves it.

---

## §1 — Convergent findings (what every stream agreed on)

Each is stated as **finding → evidence → our decision.**

### 1. The two-layer class control is the spine of the whole product.
- **Finding:** A curated *semantic* surface as the default (tone / size / emphasis /
  spacing-scale / layout-intent, all resolving to classes), with the raw class string
  editable one disclosure beneath — **same node, no second product.**
- **Evidence:** All five streams. daisyUI (`btn btn-primary` = floor; underlying utilities =
  ceiling, same file). Bricks' class-first workflow is *why* developers love it. NN/g's
  progressive-disclosure model. Webstudio's two-tier tokens+Local-Styles. Beaver Builder's
  restraint (~30 modules) earns trust where Elementor's option-dump loses beginners.
- **Decision:** The inspector is a **two-tier utility composer**: novice tier = visual
  controls only (never type a class), pro tier = raw class-string editor with autocomplete
  over the @wizeworks/silicaui + utility vocabulary. Both edit the *same* underlying class set, live-synced.

### 2. Container-query "design once" is the headline wedge; the separate mobile editor is the category's worst wound.
- **Finding:** "Design twice" (a separate per-breakpoint layout pass) is the single most-hated
  thing in the entire SMB category.
- **Evidence:** Wix's separate mobile view and Squarespace Fluid Engine's independent mobile
  grid draw the loudest complaints ("move boxes all day like a warehouse employee," "mobile
  never looks as intended," elements silently auto-hidden). Google advises against separate
  mobile sites. Framer's breakpoint overrides are "duplicated intent you must maintain" — the
  same disease, milder.
- **Decision:** Container-query-first, **no separate mobile editor, ever.** Device preview =
  resize the canvas element (a CSS width change — near-instant, no re-render, no reload). Default
  responsiveness is *intrinsic* (wrap/flex/auto-fit); per-node responsive overrides exist but are
  rare and disclosed. **Two required affordances:** (a) an explicit phone/tablet/desktop preview
  control (users expect a device toggle even though the mechanism is CQ), and (b) automatic
  containment-wrapper management so users never hit "a container can't query itself." Market this
  as **"design once,"** not "breakpoints."

### 3. The node-tree / Navigator is table-stakes, not a toggle — and it's free for us.
- **Finding:** The tree is the reliable counterpart to the fragile canvas. It becomes *essential*
  the moment layouts nest — it's the only way to select empty/tiny/covered nodes, reparent across
  distant regions, and understand structure.
- **Evidence:** Gutenberg's List View went from afterthought to indispensable. Webflow's Navigator
  selects elements you *can't* click. Shopify's left tree is its most-praised mechanic. Our editor
  *is* a node-tree — the tree is the source of truth, so this is cheap.
- **Decision:** A **permanent, prominent tree panel** with bidirectional canvas-sync, drag-reorder/
  reparent (shared DnD engine with the canvas), inline rename, visibility toggle, multi-select, and
  per-node badges (component instance, active component-class).

### 4. Absolute / free-XY positioning is the most-regretted freedom.
- **Finding:** "Drag anything anywhere" feels empowering in the demo and produces broken,
  non-responsive, unmaintainable pages in practice.
- **Evidence:** Wix's freeform editor is *why* Wix loses to Squarespace for beginners — position
  has no relationship to content or container, so it can't reflow; the mobile "translation
  algorithm" guesses and yields overlaps, gaps, hidden elements. Even in Webflow's hands, absolute
  positioning "breaks when you change anything."
- **Decision:** Layout is **container-owned** (flow / flex / grid via utility classes). Movement =
  reorder/reparent in the tree (a `move` op), **not** XY drag. This makes "can't make it ugly" a
  *structural* guarantee and reflows for free. Positioning is an advanced, rare, opt-in — never the
  default gesture. If we want overlap, express it as a flow-aware grid stack, not pixel offset.

### 5. The combo-class / global-vs-local scope terror is Webflow's cardinal sin — and our architecture is the antidote, *if the UI shows scope.*
- **Finding:** Editing a shared class silently restyles every element using it; users can't tell
  whether they're changing "this element" or "everything." This is the scariest moment for
  non-technical users and burns pros too.
- **Evidence:** Webflow's combo-class "marriage" (stacked classes can't be reordered or individually
  removed; strip-all-to-remove-one). Class explosion — Webflow sites carry ~256% more classes than
  token-based Webstudio, driven by auto-forking duplicates (`button 2`, `card 3`) and forced
  naming-per-tweak. Gutenberg's synced-pattern footgun ("you thought you edited this page, you
  edited every page"; the docs *beg* you to Detach first).
- **Decision — four moves:**
  - **Unordered, individually-removable class chips.** Applied classes are an unordered *set*;
    each chip removable/toggleable independently. No stacking order, no "marriage." (Headline
    anti-Webflow feature.)
  - **Local-override default (Webstudio's Local Styles).** Novices get local-feeling edits;
    classes graduate to "shared/reusable" only on **explicit promotion** ("Save as reusable
    style"). This inverts Webflow's global-by-accident.
  - **Persistent scope indicator.** The inspector always shows the active class + scope —
    *"editing `.card` — affects 6 elements"* vs *"this element only."* Our host-gated `updateClass`
    is the mechanism; **surface it, never hide it.**
  - **Duplicate reuses classes**, never auto-forks numbered clones; an explicit "Detach / make
    unique" action covers the exception.

### 6. Beat the blank canvas — patterns/templates first; AI is a first-draft *into the editor*, not a finished site.
- **Finding:** Time-to-first-win is the metric; the blank canvas is "where conversion goes to die."
- **Evidence:** Canva's "start with a template" converts ~75% of first sessions vs ~40% blank;
  guided empty states lift completion 30–45% (NN/g). Gutenberg's block *patterns* are the single
  biggest low-floor accelerator in WordPress. Wix **retired ADI** (Nov 2024) — "full AI site from
  one prompt" produced generic output needing hours of cleanup and had data-loss bugs. AI builders
  that emit raw code hit the "Sea of Sameness" (Tailwind-blue, Inter, purple gradient).
- **Decision:** Open on a **pattern/template gallery or a pre-filled starter page**, never a void.
  Pre-populate with the merchant's *real* Sparx data where possible (starter content that's already
  theirs beats lorem ipsum). **AI emits our node schema + class vocabulary, never freeform markup** —
  so every generation is editable in the same inspector, inherits the brand theme (launders out the
  sameness), and is diffable. AI is the on-ramp; the constrained editor is the road.

### 7. Perceived speed is <100 ms optimistic direct-manipulation — and our re-render-on-edit model is the #1 risk.
- **Finding:** NN/g's budget: **0.1 s = instantaneous** (the zone for selection/drag/hover/typing/
  class-toggle); 1 s = noticed; 10 s = attention lost. What makes a builder feel slow *even when
  technically fast* is input-to-feedback latency on direct manipulation, mode-switch tax, and
  "hunting" for controls (cognitive latency).
- **Evidence:** Elementor's panel freezes mid-drag; padding edits take ~3 s to register. Gutenberg
  loads the whole tree into memory and re-renders on every mutation → typing lags. Framer rebuilt its
  canvas renderer (300 ms → 90 ms/frame) specifically to fix this.
- **Decision:** **Patch-on-edit, not re-render.** For `updateClass`/`updateProps`, mutate the node's
  `classList`/attributes directly and optimistically (synchronous, client-side, <100 ms); reserve
  re-render for structural ops, and even those patch the subtree, not replace it. Breakpoint preview =
  canvas resize (no reload — a structural advantage over Elementor; protect it). Kill "hunting" with a
  command palette + settings search. **This is the single most important thing to fix in our current
  canvas before adding surface area.**

### 8. The slash / `+` fuzzy inserter is the most-loved compose gesture; click-to-insert before drag.
- **Finding:** Keyboard-first fuzzy insertion is unanimously "the fastest way to build."
- **Evidence:** Gutenberg's `/` slash-inserter ("once you have muscle memory, the `+` button feels
  slow"). Webflow's click-to-insert (click an element in the Add panel to place it relative to
  selection) is faster and more reliable than dragging for the common case.
- **Decision:** Ship a **fuzzy inserter** (`/` and `+`) spanning primitives, component classes, *and*
  the pattern/component catalog. **Ship click-to-insert (relative to selection) *before* full canvas
  drag** — it carries ~70% of insertions, needs zero geometry math, works on tiny/empty targets, and
  is keyboard-reachable. Drag is the polish layer.

### 9. Clean, portable HTML output is a moat — it's the thing that drives every migration.
- **Finding:** "Div soup" and proprietary serialization (lock-in) are the top reasons people leave
  Elementor/Divi.
- **Evidence:** Elementor emits 1,500+ DOM nodes where Bricks emits 400–600 for the same page. Divi's
  shortcodes turned content into visible gibberish on deactivation — the ecosystem's cautionary tale;
  Divi spent 3+ years rewriting to escape it. Framer/Builder.io lose trust to builder-vs-published
  mismatch.
- **Decision:** We **own the node-tree → HTML projection.** Guarantee **flat, semantic, portable HTML
  that survives without the builder** — never a wrapper-div per control. The **real-DOM element canvas
  is WYSIWYG by construction**; never introduce a divergent preview/iframe render path. Market "clean
  output that outlives the builder."

### 10. Solve low-floor/high-ceiling with disclosure inside ONE editor — never a forked product.
- **Finding:** The meta-trap the entire brief exists to avoid.
- **Evidence:** Wix now maintains Editor *and* Studio; Studio "overwhelms beginners," the classic one
  caps pros, neither audience is fully served. Squarespace's coexisting Classic + Fluid modes (with a
  one-way conversion) confuse users about which rules apply.
- **Decision:** **One editor, progressive disclosure.** Never ship two layout paradigms the user must
  distinguish; never a one-way mode conversion.

---

## §2 — Anti-features: the DO-NOT-BUILD list

The centerpiece of the user's original question ("what should *not* be implemented"). Each is a
trap the market has already sprung. Treat this as a standing guardrail on scope.

| # | Do NOT build | Why it's a trap |
|---|---|---|
| 1 | **Absolute / free-XY positioning** in the default path | Root cause of Wix's mobile breakage; can't reflow; "breaks when you change anything." |
| 2 | **A separate mobile editor / per-breakpoint manual re-layout** | The category's #1 complaint; doubles maintenance; SEO duplicate-content; the desktop↔mobile whack-a-mole loop. Our CQ model exists to avoid this. |
| 3 | **A raw-CSS / inline-style path; custom-JS embed as a headline** | Destroys the token guarantee (contrast/theme/consistency leak); custom code is "the first source of vulnerabilities" and the lock-in/tech-debt hatch. Pros will beg for it; granting it globally poisons the guardrail for everyone. |
| 4 | **A large arbitrary token set + a raw hex picker on the main surface** | "Death by a thousand tokens" / palette dump. Reintroduces the bad-color, contrast-failure surface tokens exist to remove. Color = semantic *roles*; any raw picker lives behind advanced disclosure. |
| 5 | **Ordered / "married" combo-class stacks; unbounded class stacking as the primary mechanism** | Webflow's cardinal sin. Recreates class-management hell. Classes are an unordered set + a small curated modifier set per node. |
| 6 | **Auto-forking numbered duplicate classes** (`button 2/3`) | The mechanical driver of class explosion (+256% classes). Duplicate reuses classes; detach is explicit. |
| 7 | **Option-overload inspector** (every property on the default panel) | Complexity scales as the *square* of exposed options (Norman); Elementor is the poster child. Default = the 5–7 controls that matter for that node type; the rest disclosed. |
| 8 | **"AI generates a whole finished site" as the core loop** | Wix killed ADI; generic output, hours of cleanup, data-loss bugs. AI is a first-draft *into* the editor, not a site factory. |
| 9 | **AI that emits raw HTML/CSS** instead of our node schema | Inherits the "Sea of Sameness"; unmaintainable; creates a two-caste editor (AI-zone vs hand-zone). Constrain AI to nodes+classes. |
| 10 | **Two coexisting layout engines the user must distinguish** | The Squarespace Classic-vs-Fluid confusion; one-way conversions. |
| 11 | **Irreversible actions** (locked template, one-way section/mode conversion) | An early low-information choice becomes an expensive prison; kills experimentation. Everything reversible; themes swappable anytime via tokens. |
| 12 | **Full code export as a v1 promise** | Sounds pro-friendly; actually constrains internal architecture and sets an expectation every future feature must honor. Defer indefinitely. |
| 13 | **A forked classic-vs-advanced product** | The meta-trap (§1.10). Disclosure inside one editor instead. |
| 14 | **Non-linear / branching undo** | Users expect a single linear chain they can rock back and forth. |
| 15 | **A divergent preview / iframe render path** | Framer/Builder.io lose trust to builder-vs-published mismatch. Our real-DOM canvas is WYSIWYG; don't break it. |
| 16 | **Dev-gating** (mandatory component/model setup before a novice can build) | Builder.io/Plasmic's low-floor failure. Our prebuilt @wizeworks/silicaui component classes mean novices never hit an "ask a developer" wall. |
| 17 | **Overly granular "anything-in-anything" blocks** | Shopify's own guidance: granularity adds complexity to code *and* editing. Favor a curated palette of meaningful sections. |

---

## §3 — What makes editing FAST vs SLOW

**Fast:** <100 ms optimistic direct-manipulation (patch-on-edit) · pattern/template-first (edit >
author) · keyboard-first fuzzy inserter · container-query = free device preview (no reload) ·
tree + breadcrumb reliable selection · multi-select → one `updateClass` on the whole set ·
duplicate + copy/paste-style · command palette + settings search (instant control-finding) ·
local-override default (no naming ceremony) · smart defaults (inserted nodes look finished) ·
clean, predictable visual→class mapping.

**Slow:** full re-render on every edit · failed/ambiguous drops · mode-switch / breakpoint reload ·
hunting through option walls (cognitive latency) · class-management overhead (naming/hunting/de-duping/
combo surgery) · prerequisite CSS box-model knowledge · preview↔published mismatch · setup/config
gates before first pixel · the blank canvas · fear of breaking (shallow undo, global-edit surprises).

**Ranked levers (most → least determinative of "feels fast"):**
1. Direct-manipulation latency <100 ms (patch-on-edit, not re-render). *The* biggest lever.
2. Drag-and-drop trust — accurate drop indicator + guard-at-pickup so drops never fail.
3. No mode-switch tax — breakpoint = canvas resize, never a document reload.
4. Instant control-finding — command palette + settings search.
5. Selection reliability — breadcrumb + tree + instant sync.
6. Large-page resilience — virtualized tree, patch-not-replace.
7. Undo that maps to mental steps.
8. Empty-state guidance — removes the "what now?" stall.

---

## §4 — Table-stakes for v1

- **Tree/Navigator panel** (permanent): select · drag-reorder/reparent (shared DnD engine) · rename ·
  visibility · multi-select · bidirectional canvas-sync · instance/class badges.
- **Fuzzy inserter** (`/` and `+`) over primitives + component classes + pattern/component catalog;
  **click-to-insert relative to selection** (ship before canvas drag).
- **Prebuilt section/pattern catalog**, categorized, **pre-filled with real placeholder content**,
  insert-and-diverge (unsynced by default).
- **Canvas selection:** click → shallow select; double-click/Enter → drill; **Esc / `\` = select
  parent**; **breadcrumb bar** (tag + active component-class per crumb); `Alt+click` deep-select;
  inline text editing.
- **Canvas drag-and-drop:** two-color grammar (parent-highlight + name chip *and* insertion line),
  edge auto-scroll, **guard-at-pickup** (reuse `move`'s self/descendant guards so drops never fail),
  **empty-container drop affordance** (min-height + "click to add or drop here" — canvas-only, never
  exported; fixes the 0px-drop-zone bug *and* guides the first action).
- **Inspector = two-tier utility composer:** semantic controls default ↔ raw class-string editor with
  autocomplete; grouped by mental model (Layout/Spacing/Size/Typography/Background/Border/Effects);
  settings search; **persistent active-class scope indicator**; **unordered removable class chips**;
  **state "you-are-here" indicator** (a loud colored banner when editing `:hover`/`:focus`);
  arbitrary-value escape hatch clearly marked.
- **Class model:** unordered/independently-removable set · duplicate reuses classes (explicit detach) ·
  **local-override default** · explicit "promote to shared/reusable style" · multi-select batch
  `updateClass`.
- **Components:** symbols with a **loud synced/unsynced distinction + one-click Detach**; variants +
  slots (Plasmic's clean "author-controlled variants vs consumer-fillable slots" split).
- **Theme/token panel:** OKLCH `[data-theme]` tokens, light/dark modes, **semantic color roles**
  (pre-validated contrast — "you can't pick a bad color"), folders/search/aliases — **separate from
  the class UI** (theming is a token act, not a class act).
- **Keyboard:** duplicate (`Cmd+D` / Alt-drag, copy placed as next sibling + auto-selected) · delete ·
  copy/paste (elements *and* styles) · **wrap/unwrap in container** (`Cmd+G` / `Cmd+Shift+G` — the
  core layout gesture for a class-only tool) · nudge = reorder · **command palette (`Cmd+/`**, leave
  `Cmd+K` for AI) · `?` shortcut overlay.
- **Undo:** strictly linear · **coalesced to mental steps** (a reparent = one step; typing coalesces
  by word/idle) · toast-undo ("Moved Card · Undo") · **autosave/checkpoints** that survive reload ·
  everything reversible.
- **Onboarding:** template-first / pre-filled starter (ideally seeded from Sparx data) — never blank.
- **Commerce/data (Sparx):** commerce sections (product grid, collection, single-product, cart CTA)
  that **auto-bind to Sparx data by default** and work with **sample data out of the box**; a
  per-field **"bind to data" affordance** for finer binding; **binding is never a precondition**;
  live data rendered on the canvas so the user edits against real products.

**Defer:** dedicated visual history/version-timeline panel · align/distribute UI beyond flex/grid
utilities · cross-document copy/paste · multi-drag in the tree · AI on `Cmd+K`.

---

## §5 — Revised build order (research-driven)

The research **changes our previously-planned "drag-and-drop first" sequence.** Rationale: the ranked
speed levers put *feel* and *reliable selection* ahead of drag, and click-to-insert carries most
insertions while being far simpler. Drag is the polish layer, not the foundation.

**Phase A — the feel & the spine of selection (do first):**
1. **Patch-on-edit** — refactor the canvas from re-render-on-edit to granular optimistic DOM patching.
   *This is flagged by the research as our #1 perceived-speed risk; fix it before adding surface area.*
2. **Tree/Navigator panel** — highest leverage, near-free from our node model; unblocks reliable
   selection + reorder of empty/tiny/nested nodes.
3. **Selection model** — click→drill, breadcrumb bar, Esc/`\` select-parent, multi-select.

**Phase B — compose (beat the blank canvas):**
4. **Fuzzy inserter + click-to-insert** over the pre-filled pattern/component catalog.
5. **Empty-state affordances** (empty-canvas CTA + empty-container drop zone).

**Phase C — style (the two-tier spine):**
6. **Inspector = two-tier utility composer** with scope indicator, unordered class chips, local-override
   default. *(The largest single piece; the product's spine.)*
7. **Theme/token panel** (semantic color roles, light/dark).

**Phase D — drag polish & power:**
8. **Canvas drag-and-drop** (two-color indicators, guard-at-pickup, auto-scroll) — shares the tree's
   DnD engine; build the engine once.
9. **Keyboard / command palette / copy-paste-style / wrap-unwrap / multi-select batch.**
10. **Components (synced/unsynced, variants/slots) + full `BuilderHost`** (catalog / assets / inspector
    panels / data resolvers).

---

## §6 — The single biggest lever

**Make the class/token vocabulary a two-layer control everywhere: a curated *semantic* surface as the
default (tone / size / emphasis / spacing-scale / layout-intent — all resolving to classes), with the
raw class string editable directly underneath one disclosure.**

That one decision delivers the whole brief at once — it is the low floor (novices touch only good,
guarded, semantic choices and can't produce ugly/broken/inaccessible output), the high ceiling (pros
drop to the class string in the *same* node, no second product), the guardrail (tokens guarantee
contrast, theme, spacing consistency), and the AI target (generate valid nodes+classes, immune to the
Sea of Sameness). It is also what lets us *refuse* every anti-feature in §2 without ever telling a pro
"you can't." The node-tree makes it enforceable; the class-only + OKLCH-token decision makes it possible.

Everyone who chased low-floor-high-ceiling with **freedom** lost the floor. Everyone who chased it with
a **second product** blurred both. We win it with **disclosure over one constrained-but-escapable
vocabulary** — which is exactly what @wizeworks/silicaui already is.

---

## §7 — Locked shell decisions (2026-07-06)

Settled during the shell-mockup pass — the interactive reference lives at
`packages/silicaui-builder/harness/shell-mockup.html`. This is the shape Phase A builds against.

### 7.1 The four authoring scopes
The builder owns four responsibilities. **Page, Site-layout, and Component are the SAME editor**
(tree · canvas · Design/Settings inspector), differing only by ROOT and LOCK boundary; **Theme is
its own surface** (token editor + component board).

- **Page** — edit the page body; the site chrome renders as *locked context* around the editable region.
- **Site layout** — edit the `Frame` (header/footer/nav); page content shows as the `Outlet` placeholder (Frame+Outlet, §9).
- **Theme** — global tokens + component board.
- **Component** — a **contextual drill-in** (from an instance / "Edit component"), isolated canvas, return. NOT a top-level mode.

Top-left **scope switch = `Page | Layout | Theme`** (highest-order control; the device group hides in Theme).
The **Outlet boundary is the teaching device** — visible locks resolve WordPress-FSE's "am I editing the
page, the template, or the whole site?" confusion at the document level.

### 7.2 Two altitudes
- **Assembly altitude** (Page/Layout) — arrange sections/blocks; the SMB *low floor* (section toolbar + "Add section" + block catalog).
- **Tuning altitude** (Component / class edits) — fine per-node control; the pro *high ceiling*.

**The full assembly-altitude UX (section-level select/drag/duplicate, catalog-as-primary-insert) is the next
dedicated design pass**, done just-in-time before building the palette.

### 7.3 Theme mode
Left = token editor (color **roles** grid with contrast pairing, radius Boxes/Fields/Selectors, effects,
sizes/type). Center = **component board** — a rich showcase to judge a theme across the whole library
at once; the page leaves the screen so scope is unmistakable. Right = saved themes + Export CSS. The board is
a first-class **showcase** (imagery, all states, realistic clusters), not a checklist.

### 7.4 Inspector
Right rail = **`Design | Settings`** (both per-node). **Design is class-only**; content / behavior / data /
a11y / attributes live in **Settings**. Design groups are **contextual by node type**. A component's semantic
controls are its **declared variant axes** — e.g. Button = **Color** (role, one-of) · **Style** (solid/soft/
outline/dash/ghost/link, one-of) · **Size** (one-of) · **Shape & width** (square/circle/wide/block, *stackable*).
Color is ONE control (role swatches) — never split across "Variant"+"Tone". Classes are an **unordered,
individually-removable set** (chips) behind a **Visual ⇄ Raw** two-tier; shared styles carry a 🔗+count scope signal.

### 7.5 Schema / registry implications to carry into code
- **`NodeBase` gains an optional `label?: string`** — user-set layer name; the Navigator shows name-if-set →
  else a content excerpt → never the raw id; the HTML projection ignores it.
- **The atom/component registry carries each component's variant vocabulary** (axes + their class families),
  so the semantic inspector tier is *generated*, not hardcoded per component.
- The **scope banner / local-override** is a *deferred discovery item* — decide ambient vs just-in-time during real testing.
