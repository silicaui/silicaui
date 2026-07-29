/**
 * Global editor keyboard shortcuts — the table-stakes builder keys. Active only
 * while `enabled` (Page/Layout mode, not Theme). Bails the moment focus is in a
 * text field, so typing (including the browser's own Cmd+Z inside an input, and
 * the Pages/Inspector rename inputs) is never hijacked.
 *
 *   Delete / Backspace   remove the selection
 *   Cmd/Ctrl+Z           undo      ·  +Shift (or Cmd/Ctrl+Y)  redo
 *   Cmd/Ctrl+D           duplicate the selection
 *   Cmd/Ctrl+C / X / V   copy / cut / paste a node
 *   Cmd/Ctrl+G           wrap the selection in a container
 *   ↑ ↓                  select the previous / next sibling
 *   ← →                  select the parent / the first child
 *   Cmd/Ctrl+↑ ↓         MOVE the selection among its siblings
 *   Escape               step up to the parent (deselect at the root)
 *
 * WHY ARROWS NAVIGATE AND MODIFIER-ARROWS MOVE. Plain arrows walk the tree, the
 * way every tree UI walks one; the modifier reorders. There is deliberately no
 * pixel "nudge": this is a flow layout addressed by classes, with no x/y for an
 * arrow key to add one to. Two nodes are aligned by giving their parent
 * `items-center`, not by pushing them a pixel at a time — a nudge would either
 * do nothing or have to invent an inline offset the schema bans outright.
 *
 * There is also no Cmd+A. `selection` is a single id, so "select all" has
 * nothing to land in; wiring it to something else (the root, the parent) would
 * be a different feature wearing the shortcut everyone recognises. It arrives
 * with a selection SET or not at all.
 *
 * The tree moves themselves live in `../commands` — pure functions over the
 * engine, so they're testable without a DOM and reusable by a host's own chrome.
 * This hook is only the key mapping.
 *
 * Handlers read live off the (stable) editor, so the listener is bound once and
 * never goes stale.
 */
import * as React from "react";
import { cutNode, groupNode, moveSibling, selectFirstChild, selectParent, selectSibling } from "../commands";
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
      } else if (mod && key === "x") {
        if (sel) {
          e.preventDefault();
          cutNode(editor, sel);
        }
      } else if (mod && key === "v") {
        if (editor.canPaste) {
          e.preventDefault();
          editor.paste();
        }
      } else if (mod && key === "g") {
        if (sel) {
          e.preventDefault();
          groupNode(editor, sel);
        }
      } else if (key === "arrowup" || key === "arrowdown") {
        if (!sel) return;
        const delta = key === "arrowup" ? -1 : 1;
        // preventDefault only when the key actually did something, so a press at
        // the end of a list still scrolls the canvas instead of dying silently.
        const acted = mod ? moveSibling(editor, sel, delta) : selectSibling(editor, sel, delta);
        if (acted) e.preventDefault();
      } else if (key === "arrowleft") {
        if (sel && selectParent(editor, sel)) e.preventDefault();
      } else if (key === "arrowright") {
        if (sel && selectFirstChild(editor, sel)) e.preventDefault();
      } else if (key === "delete" || key === "backspace") {
        if (sel) {
          e.preventDefault();
          editor.remove(sel);
        }
      } else if (key === "escape") {
        if (sel) {
          e.preventDefault();
          // Step UP rather than clearing outright: the common reason to press
          // Escape mid-edit is "I meant the thing around this", and dropping to
          // nothing makes the author re-find it by clicking. At the root there
          // is nowhere up, so `selectParent` fails and we clear — the old
          // behavior, in the one case where it's the sensible one.
          if (!selectParent(editor, sel)) editor.select(undefined);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, enabled]);
}
