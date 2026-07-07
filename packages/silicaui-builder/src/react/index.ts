/**
 * silicaui-builder (React) — the editor chrome, built ON silicaui (Tailwind v4
 * plugin) + silicaui-react, styled entirely with Tailwind + silicaui classes.
 */
export { Builder } from "./Builder";
export type { BuilderProps } from "./Builder";
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
export { Inspector } from "./Inspector";
