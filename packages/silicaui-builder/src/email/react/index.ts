/**
 * @wizeworks/silicaui-builder (Email React) — the email editor chrome, a peer of the
 * site chrome (`../../site/react`), built on the same @wizeworks/silicaui + shared/
 * foundations but over the closed email schema.
 */
export { EmailBuilder } from "./EmailBuilder";
export type { EmailBuilderProps } from "./EmailBuilder";
export { EmailEditorProvider, useEmailEditor, useEmailDocument, useEmailSelection, useEmailSelectedNode, useEmailHistory } from "./editor-context";
export { EmailCanvas } from "./Canvas";
export { EmailPreview } from "./EmailPreview";
export { EmailPalette } from "./Palette";
export { EmailInspector } from "./Inspector";
export { resolveEmailColorDefaults } from "./theme-defaults";
export { useSavedBlocks, getSavedBlockNode } from "./saved-blocks";
export type { SavedBlock } from "./saved-blocks";
