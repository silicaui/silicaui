/**
 * Global editor keyboard shortcuts — the table-stakes builder keys. Active only
 * while `enabled` (Page/Layout mode, not Theme). Bails the moment focus is in a
 * text field, so typing (including the browser's own Cmd+Z inside an input, and
 * the Pages/Inspector rename inputs) is never hijacked.
 *
 *   Delete / Backspace   remove the selection
 *   Cmd/Ctrl+Z           undo      ·  +Shift (or Cmd/Ctrl+Y)  redo
 *   Cmd/Ctrl+D           duplicate the selection
 *   Cmd/Ctrl+C / V       copy / paste a node
 *   Escape               deselect
 *
 * Handlers read live off the (stable) editor, so the listener is bound once and
 * never goes stale.
 */
import * as React from "react";
import { useEditor } from "./editor-context";

export function useEditorShortcuts(enabled: boolean): void {
  const editor = useEditor();
  React.useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const sel = editor.selection;

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        editor.redo();
      } else if (mod && key === "d") {
        if (sel) {
          e.preventDefault();
          editor.duplicate(sel);
        }
      } else if (mod && key === "c") {
        if (sel) {
          e.preventDefault();
          editor.copy(sel);
        }
      } else if (mod && key === "v") {
        if (editor.canPaste) {
          e.preventDefault();
          editor.paste();
        }
      } else if (key === "delete" || key === "backspace") {
        if (sel) {
          e.preventDefault();
          editor.remove(sel);
        }
      } else if (key === "escape") {
        if (sel) {
          e.preventDefault();
          editor.select(undefined);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, enabled]);
}
