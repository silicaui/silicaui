/**
 * The email builder's host adapter — the email twin of the site builder's
 * `host.ts` (builder-contract.md §5). Every field is optional; a host
 * implements only what its use case needs. Deliberately SMALLER than the
 * site's `BuilderHost`: no `validateClass` (email has no class string to
 * police) and no `pickAsset` (the email Inspector's asset fields are plain
 * URL inputs today, unlike the site's asset-picker-integrated fields).
 */
import type * as React from "react";
import type { DataBinding, DataScope, DataSource, Resolved } from "../schema";
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
  /** Host-contributed inspector panels for specific node kinds (a merge-tag
   *  picker, a per-module editor) — additive only, rendered beside the
   *  built-in Settings sections. */
  inspectorPanels?(node: EmailNode): EmailInspectorPanel[];
}
