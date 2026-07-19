"use client";

import { useEffect } from "react";
import {
  SilicaProvider,
  ToastProvider,
  ImperativeAlertDialogProvider,
} from "@wizeworks/silicaui-react";
import { hydrate } from "@wizeworks/silicaui-behaviors";

// A dedicated client boundary for third-party context providers, per Next's
// own guidance for rendering third-party providers in Server Components:
// importing SilicaProvider directly into a Server Component (layout.tsx)
// doesn't reliably establish the client boundary during static export's
// page-data-collection pass, even though the package ships "use client".
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Wires every data-sui-behavior marker in the (server-rendered, static)
    // page HTML — tabs/accordion/dropdown/disclosure — the same runtime a
    // non-React host would run. Idempotent, so mounting once here (rather
    // than per-page) is sufficient; it re-scans nothing already hydrated.
    return hydrate(document);
  }, []);

  return (
    <SilicaProvider>
      <ToastProvider>
        <ImperativeAlertDialogProvider>{children}</ImperativeAlertDialogProvider>
      </ToastProvider>
    </SilicaProvider>
  );
}
