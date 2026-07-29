/**
 * @wizeworks/silicaui-builder (React) — the editor chrome, built ON @wizeworks/silicaui (Tailwind v4
 * plugin) + @wizeworks/silicaui-react, styled entirely with Tailwind + @wizeworks/silicaui classes.
 */
export { Builder } from "./Builder";
export type { BuilderProps, BuilderHandle, PublishPayload } from "./Builder";
// `Editor` is what `useEditor()` returns — a host that holds the handle (or
// types a variable around it) needs to be able to name it.
export type { Editor, PageMeta } from "../engine";
// The shape `editor.subscribe` hands back. A host that listens directly (rather
// than through `onChange`) filters on `ChangeEvent.kinds`.
export type { ChangeEvent, ChangeKind, HistoryDelegate } from "../engine";
// The semantic operation vocabulary — what `onChange` hands back alongside the
// state, and what `applyRemoteOps` accepts.
export type { Op, OpKind, OpTarget, OpMeta, SymbolDetachment } from "../ops";
// Per-breakpoint class authoring: the pure token layer under `setClassToken`.
// Exported so a host writing its own responsive control gets the cascade rules
// (and the prefix arithmetic) rather than re-deriving them.
export { BREAKPOINT_ORDER, declaredBreakpoints, declaresContainer, setTokenAt, splitToken, tokenStateAt } from "../class-tokens";
export type { TokenState } from "../class-tokens";
export { BREAKPOINT_CHOICES, useBreakpoint } from "./breakpoint-context";
export type { BuilderHost, InspectorPanel, InspectorPanelCtx, AssetRef } from "./host";
export { useHost } from "./host-context";
export {
  EditorProvider,
  useEditor,
  useDocument,
  useTheme,
  useSavedThemes,
  useSelection,
  useSelectedNode,
  useHistory,
} from "./editor-context";
export { Canvas } from "./Canvas";
export { Navigator } from "./Navigator";
export { Palette } from "./Palette";
export { Inspector } from "./Inspector";
export { paletteGroups, paletteItemByKey, mergeCatalog } from "../palette";
export type { PaletteGroup, PaletteItem } from "../palette";
export { componentStarterGroups } from "../component-starters";
export type { StarterGroup, StarterContribution, StarterOptions } from "../component-starters";
// Structural tree COMMANDS — the moves the built-in keyboard shortcuts perform,
// as plain functions over the engine. Exported so a host's own toolbar or
// context menu drives the same verbs, rather than re-deriving `move`'s
// pre-removal gap index against a contract written for drag-and-drop.
export {
  childNodes,
  cutNode,
  groupNode,
  moveSibling,
  placeOf,
  selectFirstChild,
  selectParent,
  selectSibling,
} from "../commands";
