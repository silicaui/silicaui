export { RichTextEditor } from "./rich-text-editor";
export type { RichTextEditorProps } from "./rich-text-editor";

// Re-export the TipTap primitives so consumers can extend the editor (add
// extensions, drive commands) without a separate TipTap install. `@tiptap/react`
// re-exports all of `@tiptap/core`, so the core types come through here too.
export { useEditor, EditorContent, Editor } from "@tiptap/react";
export type { EditorOptions } from "@tiptap/react";
