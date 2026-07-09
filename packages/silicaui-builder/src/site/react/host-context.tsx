/** React plumbing for the optional `BuilderHost` (see `host.ts`). Absent host →
 *  every consumer falls back to its own default (the static block catalog, a
 *  raw-ref text input, no domain panels) — a static-site host needs none of this. */
import * as React from "react";
import type { BuilderHost } from "./host";

const HostContext = React.createContext<BuilderHost | undefined>(undefined);

export function HostProvider({ host, children }: { host?: BuilderHost; children: React.ReactNode }) {
  return <HostContext.Provider value={host}>{children}</HostContext.Provider>;
}

export function useHost(): BuilderHost | undefined {
  return React.useContext(HostContext);
}
