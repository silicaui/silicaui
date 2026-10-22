"use client";

import { useSyncExternalStore } from "react";
import { cloudEndpoint, WizeLensProvider } from "@wizeworks/lens-react";

/**
 * WizeLens in the browser: page loads, React renders, fetches, errors and console lines.
 * Only ever loaded through `app/layout.tsx`, which leaves it out of the build entirely
 * unless WizeLens is on.
 *
 *  - Production (`NEXT_PUBLIC_WIZELENS_KEY` set at build time): pages send straight to
 *    WizeLens Cloud with that public browser key. There is no server behind this static
 *    export, so nothing is read back and no HUD is drawn.
 *  - `next dev`: pages send to the dev server's own WizeLens (instrumentation.ts), HUD on.
 */
const KEY = process.env.NEXT_PUBLIC_WIZELENS_KEY;
const DEVELOPMENT = process.env.NODE_ENV === "development";

// The navigation entry never changes after load, so there is nothing to subscribe to.
const noSubscribe = () => () => undefined;

/** True when the dev server traced this page (it names its trace `wl-trace` in Server-Timing). */
function serverTraces(): boolean {
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.serverTiming?.some((entry) => entry.name === "wl-trace") ?? false;
}

export function WizeLens() {
  const traced = useSyncExternalStore(noSubscribe, serverTraces, () => false);
  if (DEVELOPMENT) return <WizeLensProvider enabled={traced} hud />;
  return <WizeLensProvider endpoint={cloudEndpoint(KEY ?? "")} hud={false} />;
}
