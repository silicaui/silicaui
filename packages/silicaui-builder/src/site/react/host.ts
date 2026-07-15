/**
 * The host adapter (builder-contract.md §5) — the entire domain-specific seam.
 * Every field is optional; a host implements only what its use case needs.
 * `resolveBinding`/`resolveCollection` (the data-resolution layer, §3) are a
 * separate, larger effort — see builder-engine-roadmap.md §6 — and land
 * alongside `resolveTree`, not here.
 */
import type * as React from "react";
import type { DataBinding, DataScope, DataSource, HostNode, Node, Resolved } from "@wizeworks/silicaui-html";
import type { ClassValidator } from "@wizeworks/silicaui-html";
import type { PaletteGroup } from "../palette";

export type { DataScope, Resolved } from "@wizeworks/silicaui-html";

export interface AssetRef {
  url: string;
  alt?: string;
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

export interface BuilderHost {
  /**
   * Resolve the two data primitives (§3) — SYNCHRONOUS by design (a host with
   * an async source fetches once, up front, into whatever the resolver reads
   * from; see `@wizeworks/silicaui-html`'s `resolveTree`, which these two feed at
   * publish/render time — a host calls it directly, the builder package doesn't
   * wrap it). Also powers the Inspector's live "Preview" row on a bound node,
   * so an author sees realistic data while editing without leaving the canvas.
   */
  resolveBinding?(ref: string, scope: DataScope): Resolved;
  resolveCollection?(ref: string, scope: DataScope): readonly unknown[];
  /** What the Insert palette offers, ON TOP of the default @wizeworks/silicaui-blocks
   *  index — merge semantics, not a flat replace (builder-engine-roadmap.md §5). */
  catalog?(): { extend?: PaletteGroup[]; hide?: string[] };
  /** The flat, host-computed-ONCE catalog that powers the binding picker (§3, §6).
   *  The engine derives per-node availability itself via `scopeAt`. */
  dataSources?(): readonly DataSource[];
  /** The class-string policy. Composes with the engine's built-in denylist floor
   *  (§9) — this can only ADD restrictions, never lift it. */
  validateClass?: ClassValidator;
  /** Host-contributed inspector panels for specific node types (SEO, product-pin,
   *  a per-module editor) — additive only, rendered beside the built-in panels. */
  inspectorPanels?(node: Node): InspectorPanel[];
  /** The media picker, invoked when an image/video field asks for a source. */
  pickAsset?(kind: "image" | "video"): Promise<AssetRef | null>;
  /** The host components the Insert palette may place as `HostNode`s (spec §A.5).
   *  Absent → the builder offers no host nodes (a static-site host needs none). */
  hostComponents?(): HostComponentDef[];
  /** Live canvas preview of a host node — the host renders its real component.
   *  Absent (or returns null) → the engine renders a labeled placeholder (§A.6). */
  renderHostNode?(node: HostNode, ctx: HostRenderCtx): React.ReactNode;
}
