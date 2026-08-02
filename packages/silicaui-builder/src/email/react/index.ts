/**
 * @wizeworks/silicaui-builder (Email React) — the email editor chrome, a peer of the
 * site chrome (`../../site/react`), built on the same @wizeworks/silicaui + shared/
 * foundations but over the closed email schema.
 */
export { EmailBuilder } from "./EmailBuilder";
export type { EmailBuilderProps, EmailBuilderHandle } from "./EmailBuilder";
// The state-and-intent-out contract types, re-exported so a host wiring the
// email builder doesn't have to reach into the framework-neutral entry.
export type { Op, OpKind, OpTarget, OpMeta } from "../ops";
export type { HistoryDelegate } from "../engine";
// Host chrome composed around the authored email — the `frame` prop's type,
// plus the composition a host's own send path should reuse.
export { composeEmailDocument, isEmptyFrame, frameLabel } from "../frame";
export type { EmailFrame } from "../frame";
export {
  EmailEditorProvider,
  useEmailEditor,
  useEmailDocument,
  useEmailTemplates,
  useEmailSelection,
  useEmailSelectedNode,
  useEmailHistory,
} from "./editor-context";
export { EmailCanvas } from "./Canvas";
export { EmailPreview } from "./EmailPreview";
export { EmailPalette } from "./Palette";
export { EmailInspector } from "./Inspector";
export { Navigator as EmailNavigator } from "./Navigator";
export { TemplatesPanel as EmailTemplatesPanel } from "./TemplatesPanel";
export { resolveEmailColorDefaults } from "./theme-defaults";
// The saved-block library. `readLocalSavedBlocks`/`clearLocalSavedBlocks` are the
// migration seam a host uses once when it takes ownership of the library via the
// `savedBlocks`/`onSavedBlocksChange` props.
export {
  useSavedBlocks,
  getSavedBlockNode,
  readLocalSavedBlocks,
  clearLocalSavedBlocks,
} from "./saved-blocks";
export type { SavedBlock, SavedBlockChange, SavedBlocksApi } from "./saved-blocks";
export { EmailHostProvider, useEmailHost } from "./host-context";
export type {
  EmailBuilderHost,
  EmailInspectorPanel,
  EmailInspectorPanelCtx,
  // Site parity — the same two-tier inspector seam, same names with an Email prefix.
  EmailInspectorTabDef,
  EmailInspectorTabBase,
  EmailInspectorNodeTab,
  EmailInspectorPanelTab,
} from "./host";
// Site parity — the same status-bar item, for the email shell's `statusBarSlot`.
export { StatusItem } from "../../shared/react/chrome";
