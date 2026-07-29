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
 *   Cmd/Ctrl+A           select every sibling (everything at this level)
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
 * Cmd+A selects every SIBLING — everything at the level the author is looking
 * at — rather than every node in the document. A flat select-all in a nested
 * tree returns a set whose members are each other's ancestors, and then every
 * structural verb on it has to decide what deleting a parent and its child
 * together means. Siblings are unambiguous, and match what a canvas tool means.
 *
 * Multi-node verbs (delete, duplicate) run through the set-aware commands, so a
 * six-node gesture is ONE undo step rather than six.
 *
 * The tree moves themselves live in `../commands` — pure functions over the
 * engine, so they're testable without a DOM and reusable by a host's own chrome.
 * This hook is only the key mapping.
 *
 * Handlers read live off the (stable) editor, so the listener is bound once and
 * never goes stale.
 */
import * as React from "react";
import {
  cutNode,
  duplicateMany,
  groupNode,
  moveSibling,
  removeMany,
  selectFirstChild,
  selectParent,
  selectSibling,
  selectSiblings,
} from "../commands";
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
      // The whole selection for the verbs that act on all of it; `sel` stays the
      // primary, for the single-node moves (navigation, reorder, group) where a
      // set has no meaning.
      const all = editor.selectedIds;

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        editor.redo();
      } else if (mod && key === "a") {
        if (selectSiblings(editor)) e.preventDefault();
      } else if (mod && key === "d") {
        if (all.length) {
          e.preventDefault();
          duplicateMany(editor, all);
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
        if (all.length) {
          e.preventDefault();
          removeMany(editor, all);
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
