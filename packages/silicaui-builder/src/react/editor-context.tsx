/**
 * React bindings for the framework-neutral `Editor`. The engine has its own
 * subscription model; these hooks bridge it to React via `useSyncExternalStore`,
 * caching each snapshot so getSnapshot stays referentially stable between commits.
 */
import * as React from "react";
import type { Document, Node, Theme } from "silicaui-html";
import type { Editor } from "../engine";

const EditorContext = React.createContext<Editor | null>(null);

export function EditorProvider({ editor, children }: { editor: Editor; children: React.ReactNode }) {
  return <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>;
}

/** The shared engine. Mutate through it; reads go through the hooks below. */
export function useEditor(): Editor {
  const editor = React.useContext(EditorContext);
  if (!editor) throw new Error("useEditor must be used within an <EditorProvider>");
  return editor;
}

/** The current document, re-read (cloned) after every committed edit. */
export function useDocument(): Document {
  const editor = useEditor();
  const ref = React.useRef<Document>(undefined as unknown as Document);
  if (ref.current === undefined) ref.current = editor.extract();
  return React.useSyncExternalStore(
    React.useCallback(
      (onChange) =>
        editor.subscribe(() => {
          ref.current = editor.extract();
          onChange();
        }),
      [editor],
    ),
    () => ref.current,
  );
}

/** The document theme (re-read on every commit, incl. theme edits). */
export function useTheme(): Theme {
  return useDocument().theme;
}

/**
 * The site's saved-theme library. The engine hands back a stable array that only
 * changes when the library mutates, so getSnapshot is referentially safe and
 * theme-only edits don't re-render the list.
 */
export function useSavedThemes(): readonly Theme[] {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.savedThemes,
  );
}

/** The selected node's id (undefined when nothing is selected). */
export function useSelection(): string | undefined {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.selection,
  );
}

/**
 * The currently-selected node, re-read after every commit. Returns a live
 * reference into the extracted document tree (already cloned by `useDocument`),
 * so consumers can read it freely but must mutate through the engine.
 */
export function useSelectedNode(): Node | undefined {
  const doc = useDocument();
  const id = useSelection();
  return React.useMemo(() => (id ? findNode(doc.root, id) : undefined), [doc, id]);
}

/** Depth-first id lookup within an extracted tree (view-side; the engine owns writes). */
function findNode(root: Node, id: string): Node | undefined {
  if (root.kind === "outlet") return undefined;
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    if (typeof child === "string") continue;
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return undefined;
}

/** Undo/redo availability, re-read on every commit (for toolbar button state). */
export function useHistory(): { canUndo: boolean; canRedo: boolean } {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    // Two booleans → a fresh object each read would break referential equality;
    // cache and only swap when a flag actually changes.
    useStableHistory(editor),
  );
}

function useStableHistory(editor: Editor): () => { canUndo: boolean; canRedo: boolean } {
  const ref = React.useRef<{ canUndo: boolean; canRedo: boolean }>({ canUndo: false, canRedo: false });
  return React.useCallback(() => {
    const next = { canUndo: editor.canUndo, canRedo: editor.canRedo };
    if (next.canUndo !== ref.current.canUndo || next.canRedo !== ref.current.canRedo) {
      ref.current = next;
    }
    return ref.current;
  }, [editor]);
}
