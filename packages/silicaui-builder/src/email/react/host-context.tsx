/** React plumbing for the optional `EmailBuilderHost` (see `host.ts`), mirroring
 *  the site builder's `host-context.tsx`. Absent host → every consumer falls
 *  back to its own default (the static 8-block catalog, a raw-ref text input,
 *  no domain panels, no resolution) — a static/marketing-only host needs none
 *  of this. */
import * as React from "react";
import type { EmailBuilderHost } from "./host";

const EmailHostContext = React.createContext<EmailBuilderHost | undefined>(undefined);

export function EmailHostProvider({ host, children }: { host?: EmailBuilderHost; children: React.ReactNode }) {
  return <EmailHostContext.Provider value={host}>{children}</EmailHostContext.Provider>;
}

export function useEmailHost(): EmailBuilderHost | undefined {
  return React.useContext(EmailHostContext);
}
