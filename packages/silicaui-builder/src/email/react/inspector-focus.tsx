/**
 * A request to put the Inspector on a particular tab.
 *
 * Why this is not just `editor.select(id)`. Selecting a node tells the Inspector
 * WHICH node, never which of its tabs — and the tab an author needs is often not
 * the one they left open. The subject of an email lives on the root's **Settings**
 * tab, so a control that takes them "to the subject" and lands them on Design has
 * taken them to the right rail and the wrong page of it, which is most of the
 * original complaint over again (docs/personas/issues/112).
 *
 * It is a React context and not a field on the editor on purpose: which tab is
 * open is a fact about this rail in this browser, not about the document. The
 * editor is a document engine and nothing in a saved email should know that a
 * rail exists.
 *
 * The request is CONSUMED — read once and cleared — so it moves the rail exactly
 * once. Left standing it would pin the tab, and the author could never move off
 * it while the same node stayed selected.
 */
import * as React from "react";

interface InspectorFocus {
  /** The tab the rail has been asked to show, if any. */
  wanted: string | undefined;
  /** Ask for a tab. */
  request: (tabId: string) => void;
  /** Called by the rail once it has moved. */
  clear: () => void;
}

const Ctx = React.createContext<InspectorFocus | undefined>(undefined);

export function InspectorFocusProvider({ children }: { children: React.ReactNode }) {
  const [wanted, setWanted] = React.useState<string | undefined>(undefined);
  const value = React.useMemo<InspectorFocus>(
    () => ({ wanted, request: setWanted, clear: () => setWanted(undefined) }),
    [wanted],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Undefined outside the provider, so a host embedding a bare Inspector still
 *  renders — the feature is absent, not broken. */
export function useInspectorFocus(): InspectorFocus | undefined {
  return React.useContext(Ctx);
}
