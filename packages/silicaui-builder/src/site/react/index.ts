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
export type {
  BuilderHost,
  InspectorPanel,
  InspectorPanelCtx,
  // The two-tier inspector seam: `InspectorPanel` is a section inside Settings,
  // `InspectorTabDef` is a whole tab beside it. A host implementing either needs
  // these names, so both tiers are exported together.
  InspectorTabDef,
  InspectorTabBase,
  InspectorNodeTab,
  InspectorPanelTab,
  SelectableNode,
  AssetRef,
} from "./host";
// Other editors. `Peer` is what `<Builder peers>` / `editor.setPeers` take;
// `peerColor` is exported so a host's own presence UI (a toolbar avatar stack, a
// "3 editing" pill) paints the same person the same color the canvas ring does —
// two different colors for one person is worse than no color at all.
export type { Peer } from "../engine";
export { peerColor } from "../peers";
export { usePeers, useClaim } from "./editor-context";
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
// The Themes panel's apply-only shelves. A host that curates a brand catalog
// passes `BuilderHost.themes`; these are exported so it can name the type, reuse
// the shipped shelf, and hide with the same constants the merge reads.
export { themeShelves, shippedThemeGroups, SHIPPED_THEMES_KEY, HIDE_ALL_SHIPPED } from "../theme-catalog";
export type { ThemeGroup, ThemeContribution } from "../theme-catalog";
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
// The status-bar item shape. `statusBarSlot` takes any node, but a host that
// wants a count to reveal what it counts should use this rather than a bare
// `<button>`: it keeps the 28px strip's height, carries the disclosure ARIA, and
// stays a plain `<span>` for the ordinary non-interactive case.
export { StatusItem } from "../../shared/react/chrome";
