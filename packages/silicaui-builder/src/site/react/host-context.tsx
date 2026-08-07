/** React plumbing for the optional `BuilderHost` (see `host.ts`). Absent host →
 *  every consumer falls back to its own default (the static block catalog, a
 *  raw-ref text input, no domain panels) — a static-site host needs none of this. */
import * as React from "react";
import type { BuilderHost } from "./host";
import type { HostDisplayLookup } from "../node-display";

const HostContext = React.createContext<BuilderHost | undefined>(undefined);

export function HostProvider({ host, children }: { host?: BuilderHost; children: React.ReactNode }) {
  return <HostContext.Provider value={host}>{children}</HostContext.Provider>;
}

export function useHost(): BuilderHost | undefined {
  return React.useContext(HostContext);
}

/**
 * How a `host` node should READ — its registered label and glyph, indexed by the
 * allowlist key stored on the node.
 *
 * Every surface that names a node (Navigator, Inspector header, canvas selection
 * chip) takes this, so a host component looks the same everywhere it appears
 * instead of being a plug labelled `Site.map` in three places and its real name
 * in the palette. `undefined` when the host declares no components — every
 * display helper falls back to what it did before.
 */
export function useHostDisplay(): HostDisplayLookup | undefined {
  const host = useHost();
  return React.useMemo(() => {
    const defs = host?.hostComponents?.();
    if (!defs?.length) return undefined;
    const byName = new Map(defs.map((def) => [def.name, def]));
    return (component: string) => byName.get(component);
  }, [host]);
}
