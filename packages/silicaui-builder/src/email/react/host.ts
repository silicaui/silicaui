/**
 * The email builder's host adapter — the email twin of the site builder's
 * `host.ts` (builder-contract.md §5). Every field is optional; a host
 * implements only what its use case needs. Deliberately SMALLER than the
 * site's `BuilderHost`: no `validateClass` (email has no class string to
 * police) and no `pickAsset` (the email Inspector's asset fields are plain
 * URL inputs today, unlike the site's asset-picker-integrated fields).
 */
import type * as React from "react";
import type { DataBinding, DataScope, DataSource } from "../schema";
import type { EmailNode } from "../schema";
import type { EmailPaletteItem } from "../palette";
import type { EmailStarterContribution } from "../starters";
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
  /** The starters the "new email" picker offers, on top of the shipped set.
   *  Same merge shape as `catalog()` and as the site builder's
   *  `componentStarters()`: `extend` adds groups, `hide` prunes by key. A
   *  platform's own house newsletter belongs here (issues/063). */
  emailStarters?(): EmailStarterContribution;
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
  /**
   * SAMPLE RECIPIENTS TO PREVIEW AS.
   *
   * One marketing email is many emails: a greeting that differs per person, a
   * section that only some people see, a token that is empty for the subscribers
   * who never filled that field in. Every one of those is a different message
   * arriving in a different inbox, and until this existed the builder could show
   * exactly ONE of them — whatever the host's resolver happened to return —
   * with no way to ask for another. An author could write "show this only to the
   * Clifton lot" and never look at what anybody else got. Found by P04 act 6,
   * which is one email and three shops.
   *
   * Each entry names a recipient and the `DataScope` that IS that recipient.
   * The builder passes the chosen one to `toEmailHtml({ scope })`, so a host's
   * `resolveBinding(ref, scope)` answers as it would on the real send. Silica
   * never invents a subscriber: who the samples are, and what makes one differ
   * from another, is entirely the host's business.
   *
   * **Include the awkward ones.** The useful samples are the subscriber with no
   * first name on file and the one who never said which shop is theirs — the
   * variants an author would otherwise never see until somebody replies to say
   * the email said "Hello ,".
   *
   * Absent → no picker, and everything resolves against `{}` exactly as before.
   */
  previewAudiences?(): readonly EmailPreviewAudience[];
}

/** One sample recipient the Preview can render as — see `previewAudiences`. */
export interface EmailPreviewAudience {
  /** Stable identity for the picker's own state. */
  key: string;
  /** What to call this person in the picker, in the author's words — "Someone
   *  with no first name on file" beats "scope B". */
  label: string;
  /** The scope handed to `resolveBinding`/`resolveCollection` for this render. */
  scope: DataScope;
}
