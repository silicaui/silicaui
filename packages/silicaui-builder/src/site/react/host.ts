/**
 * The host adapter (builder-contract.md §5) — the entire domain-specific seam.
 * Every field is optional; a host implements only what its use case needs.
 * `resolveBinding`/`resolveCollection` (the data-resolution layer, §3) are a
 * separate, larger effort — see builder-engine-roadmap.md §6 — and land
 * alongside `resolveTree`, not here.
 */
import type * as React from "react";
import type { DataBinding, DataSource, HostNode, Node, ResolveHost } from "@wizeworks/silicaui-html";
import type { ClassValidator } from "@wizeworks/silicaui-html";
import type { PaletteGroup } from "../palette";
import type { StarterContribution } from "../component-starters";
import type { ThemeContribution } from "../theme-catalog";

export type { DataScope, ResolveDiagnostic, Resolved } from "@wizeworks/silicaui-html";

export interface AssetRef {
  url: string;
  alt?: string;
  /**
   * A ready `srcset` for the picked asset — the responsive variants the HOST
   * generated, e.g. `"/img/hero-640.jpg 640w, /img/hero-1280.jpg 1280w"`.
   *
   * The host owns this because the host owns the asset pipeline: only it knows
   * which derivatives exist, at what URLs, and whether making more is cheap.
   * The builder's job is to carry the string into the markup, which it does
   * through the shared projector — so the canvas and the published page get the
   * same one.
   *
   * Omit it and the image ships as a single resolution, exactly as before.
   */
  srcset?: string;
  /**
   * The `sizes` hint that tells the browser how wide the image will RENDER, e.g.
   * `"(min-width: 60rem) 50vw, 100vw"`. Without it a `w`-descriptor `srcset`
   * makes the browser assume full viewport width and over-fetch.
   *
   * Independent of `srcset` rather than bundled with it: the density form
   * (`"… 1x, … 2x"`) is a complete, correct `srcset` that takes no `sizes` at
   * all, and requiring one would invite a meaningless value.
   */
  sizes?: string;
}

/** A host component the builder may place as a `HostNode` (spec §A.5). Drives the
 *  Insert palette (an entry per def) and the Inspector's per-component prop panel. */
export interface HostComponentDef {
  /** Allowlist key matched against `HostNode.component`. */
  name: string;
  /** Palette + Navigator label, e.g. "Checkout". */
  label: string;
  /** Palette grouping + optional icon (a registered icon name). */
  category?: string;
  icon?: string;
  /** Declared props → Inspector controls + host-side validation. */
  props?: HostPropDef[];
  /** Values stamped into a freshly-inserted node's `props`. */
  defaultProps?: Record<string, unknown>;
  /** Insert host-LOCKED (`locked: "host"`) — the "pinned" region requirement.
   *  The author sees it locked with no unlock; only the host clears it. */
  pinned?: boolean;
  /** Default wrapper classes for a freshly-inserted node (LITERAL safelist strings). */
  defaultClass?: string;
}

/** Minimal, extensible prop descriptor for the Inspector's Host panel. */
export interface HostPropDef {
  name: string;
  label?: string;
  type: "text" | "number" | "boolean" | "select" | "color" | "binding";
  /** `select` options. */
  options?: { value: string; label: string }[];
  default?: unknown;
}

/** Context handed to `renderHostNode` for the canvas preview. */
export interface HostRenderCtx {
  /** True during authoring — a component can render a non-interactive / skeleton
   *  state (as behavior autoplay is suppressed for authoring). */
  preview: boolean;
}

/** The mutation primitives a host inspector panel writes through — the SAME
 *  paths the engine's own built-in panels use, never a second node-mutation API. */
export interface InspectorPanelCtx {
  setProp(key: string, value: unknown): void;
  setAttr(key: string, value: string | number | boolean | undefined): void;
  setData(binding: DataBinding | undefined): void;
  setClass(className: string): { ok: true } | { ok: false; reason: string };
}

export interface InspectorPanel {
  id: string;
  title: string;
  order?: number;
  render(node: Node, ctx: InspectorPanelCtx): React.ReactNode;
}

/**
 * A node the Inspector can actually select and edit. An `outlet` is a layout
 * placeholder, not a thing with properties — the rail treats it as no selection
 * at all — so a node-scoped tab is never handed one, and saying so in the type
 * spares every host a narrowing branch it would only ever write to satisfy the
 * compiler.
 */
export type SelectableNode = Exclude<Node, { kind: "outlet" }>;

/** Fields common to both tab scopes. `icon` is a registered icon name (same
 *  loose-string convention as `HostComponentDef.icon`); an unknown one renders
 *  the tab without an icon and warns. `order` sorts against the builder's own —
 *  Design is 0 and Settings is 10, so `5` lands between them and an omitted
 *  `order` lands after both. */
export interface InspectorTabBase {
  id: string;
  label: string;
  icon?: string;
  order?: number;
}

/** A tab ABOUT THE SELECTED NODE — the default, and what the built-in Design and
 *  Settings tabs are. It renders only when something is selected; with an empty
 *  selection the tab still appears in the strip but its body is the same
 *  "no selection" state the built-ins show. It gets the node and the standard
 *  mutation ctx, so it edits through exactly the paths the built-ins use. */
export interface InspectorNodeTab extends InspectorTabBase {
  scope?: "node";
  render(node: SelectableNode, ctx: InspectorPanelCtx): React.ReactNode;
}

/**
 * A tab about the DOCUMENT OR SESSION, not any one node — a change history, a
 * publish queue, a site-wide audit. It renders whether or not anything is
 * selected, and keeps rendering as the selection changes underneath it.
 *
 * It deliberately receives no node and no mutation ctx: those are per-node
 * primitives, and handing them to a panel-scoped tab would invite it to edit
 * "the selection" while showing something else entirely. A panel tab that needs
 * to write reaches the editor through the host's own state, the way the rest of
 * the host's UI does.
 *
 * The node chrome — the identity header and the Duplicate/Delete footer — is
 * hidden while a panel tab is open, because both describe a selection this tab
 * isn't about.
 */
export interface InspectorPanelTab extends InspectorTabBase {
  scope: "panel";
  render(): React.ReactNode;
}

export type InspectorTabDef = InspectorNodeTab | InspectorPanelTab;

/**
 * The data-resolution hooks come from `ResolveHost` by EXTENSION, never by
 * re-declaration. They were duplicated here once and drifted: `silicaui-html`
 * widened `resolveBinding` to `Resolved | undefined` (the unknown-ref signal)
 * while this copy still said `Resolved`, so the Inspector read `.value` off an
 * `undefined` with the compiler none the wiser. One declaration, one contract —
 * see data-resolution-and-brand-mark.md §A.
 *
 * SYNCHRONOUS by design (a host with an async source fetches once, up front,
 * into whatever the resolver reads from). The same hooks feed `resolveTree` at
 * publish/render time, the canvas walk, and the Inspector's live Preview row.
 */
export interface BuilderHost extends ResolveHost {
  /** What the Insert palette offers, ON TOP of the default @wizeworks/silicaui-blocks
   *  index — merge semantics, not a flat replace (builder-engine-roadmap.md §5).
   *  Its `extend` groups also AUTO-SURFACE in the New-component starter picker
   *  (editable node-trees — a host's product card becomes a starter for free). */
  catalog?(): { extend?: PaletteGroup[]; hide?: string[] };
  /** Curate the New-component starter picker: `extend` adds starter-only groups,
   *  `hide` prunes item OR group keys (defaults included). This is additive to the
   *  auto-surfaced `catalog().extend` groups — use it only to add a curated set or
   *  trim what auto-surfacing brought in. `hostComponents()` never appears here
   *  (locked HostNodes aren't editable trees). */
  componentStarters?(): StarterContribution;
  /** The flat, host-computed-ONCE catalog that powers the binding picker (§3, §6).
   *  The engine derives per-node availability itself via `scopeAt`. */
  dataSources?(): readonly DataSource[];
  /** The theme shelves a PLATFORM curates — its brand catalog, maintained centrally
   *  and offered to every site it hosts. Rendered above the shipped presets and
   *  apply-only (no delete), unlike the site's own `savedThemes` library. Same
   *  merge shape as `catalog()`: `extend` adds shelves, `hide` prunes shipped
   *  preset names / the shipped shelf key / `"*"` for all of it. Applying COPIES
   *  the theme into the site, so later edits here don't reach adopted sites — see
   *  `theme-catalog.ts`. */
  themes?(): ThemeContribution;
  /** The class-string policy. Composes with the engine's built-in denylist floor
   *  (§9) — this can only ADD restrictions, never lift it. */
  validateClass?: ClassValidator;
  /**
   * Whether viewport variants (`md:`) may be written into a live document.
   * Defaults to `"reject"`: the canvas is an element whose width the device
   * toggle sets, so a viewport variant never reflows with it and the preview
   * quietly stops matching production. `@md:` is the honest equivalent, and
   * what the Inspector writes.
   *
   * Set `"allow"` if this host's output really is viewport-sized. Unlike the
   * denylist floor, this one is a POLICY and is meant to be overridable — a
   * viewport variant is valid CSS, just dishonest in an element canvas.
   */
  viewportVariants?: "reject" | "allow";
  /** Host-contributed inspector SECTIONS for specific node types (SEO, product-pin,
   *  a per-module editor) — additive only, rendered after the built-in sections
   *  INSIDE the Settings tab. The finer of the two inspector seams: right when the
   *  contribution is a handful of fields that belong beside a node's other
   *  settings. For a surface big enough to deserve its own tab, or one that isn't
   *  about a node at all, use `inspectorTabs`. */
  inspectorPanels?(node: Node): InspectorPanel[];
  /**
   * Host-contributed TABS in the inspector rail — top-level peers of Design and
   * Settings, not sections within them. This is how a host adds a whole panel to
   * the right rail.
   *
   * Called with the selected node, or `undefined` when nothing is selected —
   * which is exactly why panel-scoped tabs exist. Return node-scoped tabs
   * conditionally (only for the nodes they apply to) and panel-scoped tabs
   * unconditionally; a host that filters everything on `node` makes its history
   * panel unreachable the moment the author clicks empty canvas.
   *
   * A node-scoped tab that stops being returned while it is open falls back to
   * Design rather than blanking the rail.
   */
  inspectorTabs?(node: SelectableNode | undefined): InspectorTabDef[];
  /** The media picker, invoked when an image/video field asks for a source. */
  pickAsset?(kind: "image" | "video"): Promise<AssetRef | null>;
  /** The host components the Insert palette may place as `HostNode`s (spec §A.5).
   *  Absent → the builder offers no host nodes (a static-site host needs none). */
  hostComponents?(): HostComponentDef[];
  /** Live canvas preview of a host node — the host renders its real component.
   *  Absent (or returns null) → the engine renders a labeled placeholder (§A.6). */
  renderHostNode?(node: HostNode, ctx: HostRenderCtx): React.ReactNode;
}
