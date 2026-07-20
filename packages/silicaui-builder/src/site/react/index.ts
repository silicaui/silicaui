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
