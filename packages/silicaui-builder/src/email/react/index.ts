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
export { useSavedBlocks, getSavedBlockNode } from "./saved-blocks";
export type { SavedBlock } from "./saved-blocks";
export { EmailHostProvider, useEmailHost } from "./host-context";
export type { EmailBuilderHost, EmailInspectorPanel, EmailInspectorPanelCtx } from "./host";
