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

// The block linter (§6.3).
export { lintBlock, assertBlockClean } from "./lint";
export type { LintIssue } from "./lint";

// The atom registry (§4).
export { atoms } from "./atoms";
export type { AtomRenderer, AtomContext } from "./atoms";

// Tree traversal (shared with the builder).
export { walk } from "./tree";

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
