/**
 * Quarrystone's presence channel.
 *
 * Two people from the same account can be in the same plant page at once, so we
 * already run presence — it is ours, it predates this builder, and it is the
 * whole reason `<Builder peers>` interested us: we do not want a second
 * presence system, we want to hand the one we have to the editor.
 *
 * In production this is a socket. Here it is the same store with the socket
 * replaced by `push`, which is what our server calls anyway.
 */

/** One other person in the page, as our server describes them. */
export interface QuarrystoneEditor {
  /** Their session id — stable for as long as the socket is. */
  id: string;
  name: string;
  /** Their colour in our own UI, so the builder's rings match our avatars. */
  color: string;
  /** Node ids they have selected. Drawn, never enforced. */
  selection?: readonly string[];
  /** Node ids they are HOLDING. Enforced: we refuse local edits inside these. */
  claim?: readonly string[];
}

type Listener = (editors: readonly QuarrystoneEditor[]) => void;

let editors: readonly QuarrystoneEditor[] = [];
const listeners = new Set<Listener>();

/** What the socket calls on every roster change. Always the FULL roster. */
export function push(next: readonly QuarrystoneEditor[]): void {
  editors = next.map((e) => ({ ...e }));
  for (const l of listeners) l(editors);
}

export function current(): readonly QuarrystoneEditor[] {
  return editors;
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  l(editors);
  return () => {
    listeners.delete(l);
  };
}

declare global {
  interface Window {
    __quarrystonePresence?: { push: typeof push; current: typeof current };
  }
}

// The seam our own integration tests drive, standing in for the socket.
if (typeof window !== "undefined") window.__quarrystonePresence = { push, current };
