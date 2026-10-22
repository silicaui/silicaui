// Next runs register() once, when a server starts — which for this site means
// `next dev` only. Production is a static export with no server; there the
// browser sends straight to WizeLens Cloud (src/components/wizelens.tsx).
//
// WizeLens in development: traces each request to the dev server, with Next's
// own render and fetch spans inside it, and serves the dashboard at
// /_wizelens. Node.js runtime only: the add-on needs node:http. A failure to
// start is logged and never stops the dev server.

import type { Instrumentation } from "next";

const ENABLED = process.env.NODE_ENV === "development";

// The runtime test wraps each import rather than returning early: webpack folds it per
// compile, so the edge build of this file never tries to bundle the package.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && ENABLED) {
    try {
      const { registerWizeLens } = await import("@wizeworks/lens-node/next");
      registerWizeLens({ serviceName: "silicaui-site", enabled: true });
    } catch (err) {
      console.warn("[wizelens] tracing did not start", err);
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (process.env.NEXT_RUNTIME === "nodejs" && ENABLED) {
    try {
      const { onRequestError } = await import("@wizeworks/lens-node/next");
      onRequestError(...args);
    } catch {
      // Tracing is optional: the error itself is still Next's to report.
    }
  }
};
