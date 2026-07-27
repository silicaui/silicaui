/**
 * Saved blocks (reusable snippets) — a header/footer/promo section saved once
 * and re-inserted across this and other email documents. Deliberately simple
 * compared to the site builder's symbols: a saved block is a STATIC template
 * (a deep clone, re-stamped with fresh ids on every insert via
 * `EmailEditor.insert`), not a live master with propagating instances — an
 * email doesn't need edit-the-master-updates-everywhere semantics the way a
 * multi-page site's shared components do.
 *
 * TWO MODES, and which one is live depends on a single prop:
 *
 *  - UNCONTROLLED (default, `<EmailBuilder>` given no `savedBlocks`): the list
 *    lives in `localStorage` (not the `DraftStore`/IndexedDB path — that's for
 *    one document's autosave; this is a small named list, not a snapshot) under
 *    a FIXED key, so it's shared across every email document opened in this
 *    browser, not scoped to one `persistKey`. It does NOT survive a device or
 *    user change and can't be shared — which is exactly the ceiling the
 *    controlled mode exists to lift.
 *
 *  - CONTROLLED (`<EmailBuilder savedBlocks={…} onSavedBlocksChange={…}>`): the
 *    HOST owns the list — an account-level, server-backed library that follows a
 *    user across devices and can be shared between them. The builder renders
 *    exactly the `savedBlocks` prop and writes nothing to `localStorage`; each
 *    author action calls `onSavedBlocksChange(next, change)` and the host is
 *    expected to render the result back down. Standard controlled-component
 *    semantics (`value`/`onChange`), deliberately NOT a set of fire-and-forget
 *    write callbacks: the host's persisted list stays the single source of
 *    truth, so a server-assigned id, a rejected save, or another user's
 *    concurrent edit all reconcile by re-rendering — there is no second shadow
 *    copy in here to drift out of sync with the account.
 *
 * The local store is a module-level external store (not per-component
 * `useState`) so the Palette (reads the list) and the Inspector (writes "Save
 * as block") always see the SAME live state — two independent `useState`s each
 * seeded from `localStorage` would go stale the moment one of them wrote. The
 * controlled list rides React context instead, and must NOT go through that
 * external store: a host is free to hand down a fresh array identity on every
 * render, which would either break `useSyncExternalStore`'s cached-snapshot
 * contract or spin a render loop.
 */
import * as React from "react";
import type { EmailNode } from "../schema";

export interface SavedBlock {
  id: string;
  name: string;
  node: EmailNode;
  savedAt: number;
}

/** What the author just did, handed to `onSavedBlocksChange` alongside the
 *  resulting list — the same intent-out shape as the builder's `Op` stream, so
 *  a host can persist one row rather than diffing two arrays. */
export type SavedBlockChange =
  | { type: "save"; block: SavedBlock }
  | { type: "rename"; id: string; name: string }
  | { type: "delete"; id: string };

export interface SavedBlocksApi {
  blocks: readonly SavedBlock[];
  save: (name: string, node: EmailNode) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  /** True when a host owns the list (the `savedBlocks` prop is supplied) — UI can
   *  use it to say "account library" rather than "saved in this browser". */
  controlled: boolean;
  /** Controlled with no `onSavedBlocksChange` — the library is insert-only.
   *  The UI hides Save/rename/delete rather than offering controls that silently
   *  do nothing (a host publishing a fixed, curated block set is a real case). */
  readOnly: boolean;
}

const STORAGE_KEY = "silicaui-email-saved-blocks";

/** Stable empty snapshot. `useSyncExternalStore` compares snapshots by identity,
 *  so returning a fresh `[]` per call would break its cached-snapshot invariant. */
const EMPTY: readonly SavedBlock[] = [];

function readStorage(): SavedBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedBlock[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(blocks: SavedBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  } catch {
    // Storage disabled/full — saved blocks just won't persist this session.
  }
}

let makeId = (): string => `sb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
/** Test-only override so specs can produce deterministic ids. */
export function __setSavedBlockIdFactory(factory: () => string): void {
  makeId = factory;
}

let cache: SavedBlock[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): readonly SavedBlock[] {
  if (cache === null) cache = readStorage();
  return cache;
}

function getServerSnapshot(): readonly SavedBlock[] {
  return EMPTY;
}

function setBlocks(next: SavedBlock[]): void {
  cache = next;
  writeStorage(next);
  for (const l of listeners) l();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/**
 * The browser-local list, read straight from storage — the MIGRATION seam. A
 * host adopting controlled mode calls this once (on first load after login),
 * uploads whatever it finds to the account, then calls
 * `clearLocalSavedBlocks()`, so blocks an author saved before the host owned the
 * library aren't orphaned the moment `savedBlocks` is supplied.
 */
export function readLocalSavedBlocks(): SavedBlock[] {
  return readStorage();
}

/** Drop the browser-local list. Pairs with `readLocalSavedBlocks()` — call it
 *  only AFTER the host has durably stored what it read. */
export function clearLocalSavedBlocks(): void {
  setBlocks([]);
}

/* -------------------------------------------------------------------------- */
/* Controlled (host-owned) mode                                               */
/* -------------------------------------------------------------------------- */

interface SavedBlocksController {
  blocks: readonly SavedBlock[];
  onChange?: (next: SavedBlock[], change: SavedBlockChange) => void;
}

const ControllerContext = React.createContext<SavedBlocksController | null>(null);

/** Mirror of the controlled list for `getSavedBlockNode` — the drag path
 *  resolves a `saved:<id>` key OUTSIDE React render and so can't read context. */
let controlledMirror: readonly SavedBlock[] | null = null;

/** Wraps the builder when a host supplies `savedBlocks`; `value === null` keeps
 *  the browser-local store live (the default). Mounted by `<EmailBuilder>` — a
 *  host never renders this itself. */
export function SavedBlocksProvider({
  value,
  children,
}: {
  value: SavedBlocksController | null;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    controlledMirror = value?.blocks ?? null;
    return () => {
      controlledMirror = null;
    };
  }, [value]);
  return <ControllerContext.Provider value={value}>{children}</ControllerContext.Provider>;
}

/** Non-hook accessor for a saved block's template node — for the Canvas's drag
 *  handlers, which resolve a `saved:<id>` drag key outside React render. Reads
 *  the host-owned list when one is mounted, else the browser-local one. */
export function getSavedBlockNode(id: string): EmailNode | undefined {
  return (controlledMirror ?? getSnapshot()).find((b) => b.id === id)?.node;
}

export function useSavedBlocks(): SavedBlocksApi {
  const controller = React.useContext(ControllerContext);
  const local = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const blocks = controller ? controller.blocks : local;

  const save = React.useCallback(
    (name: string, node: EmailNode) => {
      const block: SavedBlock = {
        id: makeId(),
        name: name.trim() || "Untitled block",
        node: structuredClone(node),
        savedAt: Date.now(),
      };
      if (controller) controller.onChange?.([...controller.blocks, block], { type: "save", block });
      else setBlocks([...getSnapshot(), block]);
    },
    [controller],
  );

  const remove = React.useCallback(
    (id: string) => {
      const drop = (list: readonly SavedBlock[]) => list.filter((b) => b.id !== id);
      if (controller) controller.onChange?.(drop(controller.blocks), { type: "delete", id });
      else setBlocks(drop(getSnapshot()));
    },
    [controller],
  );

  const rename = React.useCallback(
    (id: string, name: string) => {
      const value = name.trim();
      if (!value) return;
      const apply = (list: readonly SavedBlock[]) => list.map((b) => (b.id === id ? { ...b, name: value } : b));
      if (controller) controller.onChange?.(apply(controller.blocks), { type: "rename", id, name: value });
      else setBlocks(apply(getSnapshot()));
    },
    [controller],
  );

  return {
    blocks,
    save,
    remove,
    rename,
    controlled: controller !== null,
    readOnly: controller !== null && !controller.onChange,
  };
}
