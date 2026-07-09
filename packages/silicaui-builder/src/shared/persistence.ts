/**
 * Local draft persistence — a crash-proof safety net so a user never loses work to
 * a reload, a closed tab, a lost connection, or a power cut. It is INDEPENDENT of
 * the host's `onChange` (a builder stays backend-agnostic): the host may persist
 * to its own server, and this still keeps a durable local copy that restores on the
 * next load. Generic over the persisted document type `T` — shared by the site
 * editor (`Site`) and the email editor (`EmailDocument`), keyed apart by distinct
 * `persistKey` defaults so they never collide in the same store.
 *
 * Durability strategy (belt AND suspenders):
 *  - PRIMARY: debounced writes to IndexedDB during editing, so a HARD crash (power
 *    loss, tab kill) loses at most `delay` ms of work.
 *  - FLUSH: on `visibilitychange`/`pagehide`/unmount we write the pending snapshot
 *    to localStorage SYNCHRONOUSLY (guaranteed to complete before the page dies)
 *    plus kick the IndexedDB write. So a graceful reload always keeps the very last
 *    edit.
 *  - LOAD reads both and returns whichever is newest (`savedAt`).
 */

/** A persisted draft: the document plus when it was saved (for newest-wins). */
export interface DraftSnapshot<T> {
  savedAt: number;
  /** Payload schema version — bump to invalidate incompatible old drafts. */
  schema: number;
  data: T;
}

const SCHEMA = 2;
const DB_NAME = "silicaui-builder";
const STORE = "drafts";
const lsKey = (key: string) => `silicaui-draft:${key}`;

// ── IndexedDB (primary) ───────────────────────────────────────────────────────
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<DraftSnapshot<T> | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as DraftSnapshot<T> | undefined);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    } finally {
      db.close();
    }
  });
}

function idbPut<T>(key: string, snap: DraftSnapshot<T>): void {
  void openDb().then((db) => {
    if (!db) return;
    try {
      db.transaction(STORE, "readwrite").objectStore(STORE).put(snap, key);
    } catch {
      /* best-effort */
    }
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    } finally {
      db.close();
    }
  });
}

// ── localStorage (synchronous flush guarantee + fallback) ─────────────────────
function lsRead<T>(key: string): DraftSnapshot<T> | undefined {
  try {
    const raw = localStorage.getItem(lsKey(key));
    return raw ? (JSON.parse(raw) as DraftSnapshot<T>) : undefined;
  } catch {
    return undefined;
  }
}

function lsWrite<T>(key: string, snap: DraftSnapshot<T>): void {
  try {
    localStorage.setItem(lsKey(key), JSON.stringify(snap));
  } catch {
    // Quota exceeded on a big document, or storage disabled — IndexedDB carries it.
  }
}

function lsDelete(key: string): void {
  try {
    localStorage.removeItem(lsKey(key));
  } catch {
    /* ignore */
  }
}

/**
 * A per-key draft store. One lives on a Builder for its `persistKey`. Writes are
 * debounced; `flush` forces an immediate durable write; `load` returns the newest
 * saved snapshot (IndexedDB vs localStorage).
 */
export class DraftStore<T> {
  private pending: T | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly key: string,
    private readonly delay = 600,
  ) {}

  /** Record the latest document and schedule a debounced durable write. Cheap to
   *  call on every edit — only the trailing snapshot in a burst hits storage. */
  save(data: T): void {
    this.pending = data;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delay);
  }

  /** Write the pending snapshot NOW — synchronously to localStorage (guaranteed to
   *  land before the page unloads) and to IndexedDB (primary, best-effort). */
  flush(): void {
    if (this.pending == null) return;
    const snap: DraftSnapshot<T> = { savedAt: Date.now(), schema: SCHEMA, data: this.pending };
    this.pending = null;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    lsWrite(this.key, snap);
    idbPut(this.key, snap);
  }

  /** The newest saved draft for this key, or undefined if none / schema-stale. */
  async load(): Promise<DraftSnapshot<T> | undefined> {
    const [idb, ls] = [await idbGet<T>(this.key), lsRead<T>(this.key)];
    const candidates = [idb, ls].filter(
      (s): s is DraftSnapshot<T> => Boolean(s) && s!.schema === SCHEMA && s!.data != null,
    );
    if (!candidates.length) return undefined;
    return candidates.sort((a, b) => b.savedAt - a.savedAt)[0];
  }

  /** Discard the saved draft (both stores). Cancels any pending write. */
  async clear(): Promise<void> {
    this.pending = null;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    lsDelete(this.key);
    await idbDelete(this.key);
  }
}
