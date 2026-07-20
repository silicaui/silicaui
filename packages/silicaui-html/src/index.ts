/**
 * @wizeworks/silicaui-html — the framework-neutral node-tree source + projections.
 *
 * See `docs/silicaui-architecture.md` for the canonical spec. Blocks (composed
 * patterns) live under the `@wizeworks/silicaui-html/blocks` subpath.
 */

// Schema (§3) — types only.
export type * from "./schema";

// Authoring kit (§4).
export {
  el,
  atom,
  outlet,
  host,
  slot,
  behave,
  part,
  bind,
  repeat,
  action,
  block,
  collectSlots,
  validateBlockTree,
} from "./kit";
export type { BlockInput } from "./kit";

// Projections (§4).
export { toHtml } from "./to-html";
export type { ToHtmlOptions } from "./to-html";

// The default icon set + resolver `toHtml` inlines for `data-icon` spans, so a
// published page is self-contained. Exported so a host can reuse the same map
// (e.g. the builder canvas) or supply its own.
export { LUCIDE_ICONS, iconSvg } from "./icons";
export type { IconResolver } from "./icons";
export { toJson } from "./to-json";

// The template → document transform (§1, §9.6).
export { stamp, stampTree, stripIds, defaultMakeId } from "./stamp";
export type { MakeId } from "./stamp";

// Fractional sibling ordering (`Node.ord`) — the transportable position key that
// lets concurrent inserts into one parent commute.
export { generateKeyBetween, compareOrd, ordNeighbors, ordAt, assignOrds, stripOrds } from "./ord";

// The multi-page site container (§3): pages sharing one theme + frame.
export { makePage, pageBody, slugify, siteFromDocument, pageDocument, renderPage, renderSite } from "./site";
export type { RenderedPage } from "./site";

// The block linter (§6.3).
export { lintBlock, assertBlockClean, deniedToken } from "./lint";
export type { LintIssue, ClassDenial } from "./lint";

// The raw-element/attribute security floor (builder-contract.md §9) — enforced
// unconditionally inside `toHtml`; exported so a consumer can reason about or
// test the whitelist directly.
export { RAW_ELEMENTS, GLOBAL_ATTRS, sanitizeElement } from "./element";
export type { ElementGroup, RawElementMeta, SanitizedElement } from "./element";

// The runtime class-string policy floor (builder-contract.md §9, §5) — a live
// builder's `setClass` composes this with an optional host validator.
export { validateClassString, buildClassValidator, composeValidators } from "./class-policy";
export type { ClassValidator, AllowlistRule } from "./class-policy";

// The binding-picker scope model (builder-contract.md §5, §3).
export { scopeAt } from "./data-sources";
export type { DataSource } from "./data-sources";

// The data-resolution layer (builder-contract.md §3, the Q3/Q19 keystone) — ONE
// synchronous walker owning bind + repeat, shared by the canvas and a host's
// live-render path so preview == production is structural.
export { resolveTree } from "./resolve";
export type {
  DataScope,
  Resolved,
  ResolveDiagnostic,
  ResolveHost,
  ResolveOptions,
} from "./resolve";

// The component registry (§4) — the single definition each @wizeworks/silicaui component
// derives from. A component is a macro that EXPANDS to an element subtree, so a
// projection (toHtml) and the builder render it through their normal element
// path; new components add a def, not a renderer branch.
export {
  expandComponent,
  registerComponent,
  getComponent,
  listComponents,
  BUILTIN_COMPONENTS,
} from "./component";
export type { ComponentDef } from "./component";

// Tree traversal (shared with the builder).
export { walk, composeFrame } from "./tree";

// Symbols (user-saved reusable components): flatten instances → plain markup for
// output, so the projection stays symbol-agnostic (§ authoring vs output).
export { flattenSymbols, hasInstances, applyOverrides } from "./symbols";
export type { SymbolResolver } from "./symbols";

// The theme model (§5) — the shared source of truth for a theme's color roles,
// scalar tokens, and the preset library. Consumed by the builder's theme editor
// and property panel so nobody hardcodes a color list.
export {
  SURFACE_TOKENS,
  SEMANTIC_ROLES,
  SCALAR_TOKENS,
  THEME_PRESETS,
  rolesOf,
  colorValue,
  presetByName,
} from "./themes";
export type { SurfaceToken, SemanticRole } from "./themes";
