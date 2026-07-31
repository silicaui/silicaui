/**
 * The email builder's host adapter — the email twin of the site builder's
 * `host.ts` (builder-contract.md §5). Every field is optional; a host
 * implements only what its use case needs. Deliberately SMALLER than the
 * site's `BuilderHost`: no `validateClass` (email has no class string to
 * police) and no `pickAsset` (the email Inspector's asset fields are plain
 * URL inputs today, unlike the site's asset-picker-integrated fields).
 */
import type * as React from "react";
import type { DataBinding, DataSource } from "../schema";
import type { EmailNode } from "../schema";
import type { EmailPaletteItem } from "../palette";
import type { EmailResolveHost } from "../resolve";

export type { DataScope, Resolved } from "../schema";

/** The mutation primitives a host inspector panel writes through — the SAME
 *  paths the engine's own built-in panels use, never a second node-mutation API. */
export interface EmailInspectorPanelCtx {
  update(patch: Record<string, unknown>): void;
  setData(binding: DataBinding | undefined): void;
}

export interface EmailInspectorPanel {
  id: string;
  title: string;
  order?: number;
  render(node: EmailNode, ctx: EmailInspectorPanelCtx): React.ReactNode;
}

/** Shared tab fields. Mirrors the site host's `InspectorTabBase` exactly — the
 *  two shells expose the same seam so a host that learns one knows the other. */
export interface EmailInspectorTabBase {
  id: string;
  label: string;
  /** A registered icon name; an unknown one renders no icon and warns. */
  icon?: string;
  /** Sorts against the built-ins (Design 0, Settings 10); omitted lands last. */
  order?: number;
}

/** A tab about the SELECTED NODE — the default, and what Design/Settings are.
 *  Appears in the strip with nothing selected, but its body is the empty state. */
export interface EmailInspectorNodeTab extends EmailInspectorTabBase {
  scope?: "node";
  render(node: EmailNode, ctx: EmailInspectorPanelCtx): React.ReactNode;
}

/** A tab about the DOCUMENT or session — a change history, a send-test log —
 *  which renders whether or not anything is selected, and gets no node or
 *  mutation ctx for the reasons the site host's `InspectorPanelTab` spells out. */
export interface EmailInspectorPanelTab extends EmailInspectorTabBase {
  scope: "panel";
  render(): React.ReactNode;
}

export type EmailInspectorTabDef = EmailInspectorNodeTab | EmailInspectorPanelTab;

/**
 * The data-resolution hooks come from `EmailResolveHost` by EXTENSION, never by
 * re-declaration — same rule (and same past drift) as the site host's. Feeds
 * `resolveEmailTree` at export/send time (a host calls `toEmailHtml(doc, host)`
 * directly) AND the Inspector's live Preview row. SYNCHRONOUS by design.
 */
export interface EmailBuilderHost extends EmailResolveHost {
  /** What the Insert palette offers, ON TOP of the default 8-block email
   *  catalog — merge semantics, not a flat replace, mirroring the site host's
   *  `catalog()`. */
  catalog?(): { extend?: EmailPaletteItem[]; hide?: string[] };
  /** The flat, host-computed-ONCE catalog that powers the binding picker (§3,
   *  §6). The engine derives per-node availability itself via `emailScopeAt`. */
  dataSources?(): readonly DataSource[];
  /** Host-contributed inspector SECTIONS for specific node kinds (a merge-tag
   *  picker, a per-module editor) — additive only, rendered after the built-in
   *  sections INSIDE the Settings tab. The finer of the two seams; for a whole
   *  panel, or anything not about a node, use `inspectorTabs`. */
  inspectorPanels?(node: EmailNode): EmailInspectorPanel[];
  /** Host-contributed TABS in the inspector rail — top-level peers of Design and
   *  Settings. Called with the selected node, or `undefined` when nothing is
   *  selected: return node-scoped tabs conditionally and panel-scoped tabs
   *  unconditionally. Site parity — see the site host's `inspectorTabs`. */
  inspectorTabs?(node: EmailNode | undefined): EmailInspectorTabDef[];
}
