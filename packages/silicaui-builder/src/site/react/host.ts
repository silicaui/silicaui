/**
 * The host adapter (builder-contract.md §5) — the entire domain-specific seam.
 * Every field is optional; a host implements only what its use case needs.
 * `resolveBinding`/`resolveCollection` (the data-resolution layer, §3) are a
 * separate, larger effort — see builder-engine-roadmap.md §6 — and land
 * alongside `resolveTree`, not here.
 */
import type * as React from "react";
import type { DataBinding, DataScope, DataSource, Node, Resolved } from "@wizeworks/silicaui-html";
import type { ClassValidator } from "@wizeworks/silicaui-html";
import type { PaletteGroup } from "../palette";

export type { DataScope, Resolved } from "@wizeworks/silicaui-html";

export interface AssetRef {
  url: string;
  alt?: string;
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
}
