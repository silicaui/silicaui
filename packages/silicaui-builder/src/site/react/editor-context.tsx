/**
 * React bindings for the framework-neutral `Editor`. The engine has its own
 * subscription model; these hooks bridge it to React via `useSyncExternalStore`,
 * caching each snapshot so getSnapshot stays referentially stable between commits.
 */
import * as React from "react";
import type { Document, Node, SymbolDef, Theme } from "@wizeworks/silicaui-html";
import type { ActiveTree, Editor, PagesView, Peer } from "../engine";

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
  // Symbol masters and named LAYOUTS both live on the site rather than in the
  // page `Document`, so read them straight from the engine; the `useDocument`
  // subscription above still drives the re-render. `activeRootNode` is a
  // per-commit SNAPSHOT (see the engine), so the identity this returns changes
  // whenever the tree does — same guarantee `doc.root` gets from `extract()`,
  // which is what everything downstream memoizes on.
  //
  // The frame case matters as much as the symbol one now: `doc.frame` is the
  // layout resolved for the ACTIVE PAGE, which stopped being the same thing as
  // "the layout being edited" the moment a site could have more than one. Using
  // it meant Layout mode rendered — and let you click — a tree the Inspector
  // wasn't writing to.
  if (which === "symbol" || which === "frame") return editor.activeRootNode;
  return doc.root;
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
 * The FULL selection, for chrome that has to reflect every selected node — the
 * canvas outlines, the Navigator's highlighted rows, the Inspector's "3
 * selected" header.
 *
 * Separate from `useSelection` (the primary) so a component that only ever
 * describes one node doesn't re-render every time the set changes around it.
 * The engine hands back the same array identity until the set actually changes,
 * which `useSyncExternalStore` requires — it compares snapshots by reference and
 * would loop forever on a fresh array each read.
 */
export function useSelectionSet(): readonly string[] {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.selectedIds,
  );
}

/**
 * The other editors in this document. The engine hands back the same array
 * identity until the roster's CONTENT changes, so a presence heartbeat carrying
 * no news doesn't re-render every ring on the canvas — which `useSyncExternalStore`
 * requires anyway (it compares snapshots by reference).
 */
export function usePeers(): readonly Peer[] {
  const editor = useEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.peers,
  );
}

/**
 * Who is holding the subtree `id` sits in, if anyone — the question the Inspector
 * and the Navigator ask about one node.
 *
 * Re-read on every commit, not just on `"peers"`: a claim covers a subtree, so
 * moving a node under a claimed ancestor changes the answer for that node
 * without the roster changing at all.
 */
export function useClaim(id: string | undefined): Peer | undefined {
  const editor = useEditor();
  // Both subscriptions are the point, not the values: `claimOn` reads live
  // engine state, so this hook needs a re-render on either signal. It isn't
  // memoized because there is nothing to save — the subscriptions have already
  // re-rendered us, and `claimOn` returns immediately when no claim is held,
  // which is the overwhelmingly common case.
  usePeers();
  useDocument();
  return id ? editor.claimOn(id) : undefined;
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
