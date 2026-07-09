/**
 * Saved blocks (reusable snippets) — a header/footer/promo section saved once
 * and re-inserted across this and other email documents. Deliberately simple
 * compared to the site builder's symbols: a saved block is a STATIC template
 * (a deep clone, re-stamped with fresh ids on every insert via
 * `EmailEditor.insert`), not a live master with propagating instances — an
 * email doesn't need edit-the-master-updates-everywhere semantics the way a
 * multi-page site's shared components do.
 *
 * Persisted to `localStorage` (not the `DraftStore`/IndexedDB path — that's
 * for one document's autosave; this is a small named list, not a snapshot)
 * under a FIXED key, so it's shared across every email document opened in
 * this browser, not scoped to one `persistKey`. A tiny module-level external
 * store (not per-component `useState`) so the Palette (reads the list) and the
 * Inspector (writes "Save as block") always see the SAME live state — two
 * independent `useState`s each seeded from `localStorage` would go stale the
 * moment one of them wrote.
 */
import * as React from "react";
import type { EmailNode } from "../schema";

export interface SavedBlock {
  id: string;
  name: string;
  node: EmailNode;
  savedAt: number;
}

const STORAGE_KEY = "silicaui-email-saved-blocks";

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

function getSnapshot(): SavedBlock[] {
  if (cache === null) cache = readStorage();
  return cache;
}

/** Non-hook accessor for a saved block's template node — for the Canvas's drag
 *  handlers, which resolve a `saved:<id>` drag key outside React render. */
export function getSavedBlockNode(id: string): EmailNode | undefined {
  return getSnapshot().find((b) => b.id === id)?.node;
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

export function useSavedBlocks(): {
  blocks: SavedBlock[];
  save: (name: string, node: EmailNode) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
} {
  const blocks = React.useSyncExternalStore(subscribe, getSnapshot, () => []);

  const save = React.useCallback((name: string, node: EmailNode) => {
    setBlocks([
      ...getSnapshot(),
      { id: makeId(), name: name.trim() || "Untitled block", node: structuredClone(node), savedAt: Date.now() },
    ]);
  }, []);

  const remove = React.useCallback((id: string) => {
    setBlocks(getSnapshot().filter((b) => b.id !== id));
  }, []);

  const rename = React.useCallback((id: string, name: string) => {
    const value = name.trim();
    if (!value) return;
    setBlocks(getSnapshot().map((b) => (b.id === id ? { ...b, name: value } : b)));
  }, []);

  return { blocks, save, remove, rename };
}
