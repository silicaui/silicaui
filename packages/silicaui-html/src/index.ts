/**
 * silicaui-html — the framework-neutral node-tree source + projections.
 *
 * See `docs/silicaui-architecture.md` for the canonical spec. Blocks (composed
 * patterns) live under the `silicaui-html/blocks` subpath.
 */

// Schema (§3) — types only.
export type * from "./schema";

// Authoring kit (§4).
export {
  el,
  atom,
  outlet,
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
export { toJson } from "./to-json";

// The template → document transform (§1, §9.6).
export { stamp, stampTree, stripIds, defaultMakeId } from "./stamp";
export type { MakeId } from "./stamp";

// The multi-page site container (§3): pages sharing one theme + frame.
export { makePage, pageBody, slugify, siteFromDocument, pageDocument, renderPage, renderSite } from "./site";
export type { RenderedPage } from "./site";

// The block linter (§6.3).
export { lintBlock, assertBlockClean } from "./lint";
export type { LintIssue } from "./lint";

// The component registry (§4) — the single definition each silicaui component
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
