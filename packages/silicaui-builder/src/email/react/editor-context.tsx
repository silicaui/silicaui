/**
 * React bindings for the framework-neutral `EmailEditor`, mirroring the site
 * editor's `editor-context.tsx` shape (`useSyncExternalStore`, cached snapshots)
 * over the email schema instead of the site's `Document`.
 */
import * as React from "react";
import type { EmailDocument, EmailNode } from "../schema";
import type { EmailEditor, TemplatesView } from "../engine";

const EmailEditorContext = React.createContext<EmailEditor | null>(null);

export function EmailEditorProvider({ editor, children }: { editor: EmailEditor; children: React.ReactNode }) {
  return <EmailEditorContext.Provider value={editor}>{children}</EmailEditorContext.Provider>;
}

/** The shared engine. Mutate through it; reads go through the hooks below. */
export function useEmailEditor(): EmailEditor {
  const editor = React.useContext(EmailEditorContext);
  if (!editor) throw new Error("useEmailEditor must be used within an <EmailEditorProvider>");
  return editor;
}

/** The current document, re-read (cloned) after every committed edit. */
export function useEmailDocument(): EmailDocument {
  const editor = useEmailEditor();
  const ref = React.useRef<EmailDocument>(undefined as unknown as EmailDocument);
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

/**
 * The template roster + active template id (for the template switcher) —
 * mirrors the site editor's `usePages`. The engine hands back a stable object
 * that only changes when the roster or active template mutate, so
 * getSnapshot is referentially safe and unrelated edits don't re-render the
 * switcher.
 */
export function useEmailTemplates(): TemplatesView {
  const editor = useEmailEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.templatesView,
  );
}

/** The selected node's id (undefined when nothing is selected). */
export function useEmailSelection(): string | undefined {
  const editor = useEmailEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    () => editor.selection,
  );
}

/** The currently-selected node, re-read after every commit — a live reference
 *  into the extracted document tree, so consumers read freely but mutate
 *  through the engine. */
export function useEmailSelectedNode(): EmailNode | undefined {
  const root = useEmailDocument().root;
  const id = useEmailSelection();
  return React.useMemo(() => (id ? findNode(root, id) : undefined), [root, id]);
}

function findNode(root: EmailNode, id: string): EmailNode | undefined {
  if (root.id === id) return root;
  const kids = "children" in root ? (root.children as EmailNode[]) : undefined;
  for (const child of kids ?? []) {
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return undefined;
}

/** Undo/redo availability AND what each one would do, re-read on every commit.
 *  The labels are what the toolbar says instead of a bare "Undo" — see
 *  `EmailEditor.undoLabel` and docs/personas/issues/047. */
export interface EmailHistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
}

export function useEmailHistory(): EmailHistoryState {
  const editor = useEmailEditor();
  return React.useSyncExternalStore(
    React.useCallback((onChange) => editor.subscribe(onChange), [editor]),
    useStableHistory(editor),
  );
}

function useStableHistory(editor: EmailEditor): () => EmailHistoryState {
  const ref = React.useRef<EmailHistoryState>({ canUndo: false, canRedo: false });
  return React.useCallback(() => {
    const next: EmailHistoryState = {
      canUndo: editor.canUndo,
      canRedo: editor.canRedo,
      undoLabel: editor.undoLabel,
      redoLabel: editor.redoLabel,
    };
    const c = ref.current;
    if (
      next.canUndo !== c.canUndo ||
      next.canRedo !== c.canRedo ||
      next.undoLabel !== c.undoLabel ||
      next.redoLabel !== c.redoLabel
    ) {
      ref.current = next;
    }
    return ref.current;
  }, [editor]);
}
