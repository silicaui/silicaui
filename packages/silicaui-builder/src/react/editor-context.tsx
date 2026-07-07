/**
 * React bindings for the framework-neutral `Editor`. The engine has its own
 * subscription model; these hooks bridge it to React via `useSyncExternalStore`,
 * caching each snapshot so getSnapshot stays referentially stable between commits.
 */
import * as React from "react";
import type { Document, Node, SymbolDef, Theme } from "silicaui-html";
import type { ActiveTree, Editor, PagesView } from "../engine";

const EditorContext = React.createContext<Editor | null>(null);

export function EditorProvider({ editor, children }: { editor: Editor; children: React.ReactNode }) {
  return <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>;
}

// The chrome's `[data-theme]` value. Base UI popups (dropdowns, dialogs) render in a
// PORTAL at document.body — outside the chrome's theme island — so a portaled popup
// must re-stamp this on its own root to recover the studio tokens (else base/primary
// resolve to nothing). Threaded here so any chrome popup can read it.
const StudioThemeContext = React.createContext<string>("studio");

export function StudioThemeProvider({ value, children }: { value: string; children: React.ReactNode }) {
  return <StudioThemeContext.Provider value={value}>{children}</StudioThemeContext.Provider>;
}

/** The chrome's `[data-theme]` name — stamp it on portaled popups to keep tokens. */
export function useStudioTheme(): string {
  return React.useContext(StudioThemeContext);
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

/**
 * The page roster + active page id (for the page switcher). The engine hands back
 * a stable object that only changes when the roster or active page mutate, so
 * getSnapshot is referentially safe and unrelated edits don't re-render the switcher.
 */
export function usePages(): PagesView {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.pagesView,
  );
}

/**
 * The site's saved symbols (reusable components) — a stable roster from the engine
 * that only changes when a symbol is added/removed/renamed, so getSnapshot is
 * referentially safe and unrelated edits don't re-render the Components palette.
 */
export function useSymbols(): readonly SymbolDef[] {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.symbols,
  );
}

/**
 * The symbol master currently open for editing (id + name), or undefined. Cached
 * by id so getSnapshot stays referentially stable (the engine returns a fresh
 * object each call, which would otherwise loop useSyncExternalStore).
 */
export function useEditingSymbol(): { id: string; name: string } | undefined {
  const editor = useEditor();
  const ref = React.useRef<{ id: string; name: string } | undefined>(undefined);
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    React.useCallback(() => {
      const next = editor.editingSymbol;
      const prev = ref.current;
      if (next?.id !== prev?.id || next?.name !== prev?.name) ref.current = next;
      return ref.current;
    }, [editor]),
  );
}

/** Which tree the spine edits — "page" body or "frame" shell (re-read on switch). */
export function useActiveTree(): ActiveTree {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.activeTree,
  );
}

/**
 * The root of the currently-active tree: the page body, or the frame shell when
 * Layout mode is on. Everything that renders/edits the tree (Canvas, Navigator,
 * the selected-node lookup) reads through here so a single switch retargets the
 * whole spine.
 */
export function useActiveRoot(): Node {
  const editor = useEditor();
  const doc = useDocument(); // subscribe so a re-render fires on every commit
  const which = useActiveTree();
  // Symbol masters live on the site (not in the page Document); read the live one
  // straight from the engine. `useDocument` above still drives the re-render.
  if (which === "symbol") return editor.activeRootNode;
  return which === "frame" && doc.frame ? doc.frame.root : doc.root;
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
  const root = useActiveRoot();
  const id = useSelection();
  return React.useMemo(() => (id ? findNode(root, id) : undefined), [root, id]);
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
