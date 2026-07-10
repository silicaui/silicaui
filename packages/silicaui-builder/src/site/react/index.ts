/**
 * @wizeworks/silicaui-builder (React) — the editor chrome, built ON @wizeworks/silicaui (Tailwind v4
 * plugin) + @wizeworks/silicaui-react, styled entirely with Tailwind + @wizeworks/silicaui classes.
 */
export { Builder } from "./Builder";
export type { BuilderProps, PublishPayload } from "./Builder";
export type { PageMeta } from "../engine";
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
