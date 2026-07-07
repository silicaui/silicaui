import "./styles.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "silicaui-builder/react";
import { stamp } from "silicaui-html";
import { heroSplitCta } from "silicaui-html/blocks";

// The editable DOCUMENT theme — a complete "lightsilica" palette (every surface +
// role) so the Theme editor's tile grid and the component board are fully
// populated. A nested `[data-theme]` island, distinct from the chrome's studio
// theme; editing it must never move the chrome.
const theme = {
  name: "lightsilica",
  tokens: {
    "--color-base-100": "#ffffff",
    "--color-base-200": "#f4f4f5",
    "--color-base-300": "#e5e7eb",
    "--color-base-content": "#18181b",
    "--color-primary": "#7c3aed",
    "--color-primary-content": "#ffffff",
    "--color-secondary": "#2563eb",
    "--color-secondary-content": "#ffffff",
    "--color-accent": "#14b8a6",
    "--color-accent-content": "#ffffff",
    "--color-neutral": "#3d4451",
    "--color-neutral-content": "#ffffff",
    "--color-info": "#3b82f6",
    "--color-success": "#16a34a",
    "--color-warning": "#f59e0b",
    "--color-error": "#dc2626",
  },
  dark: {
    "--color-base-100": "#0b1020",
    "--color-base-200": "#161b2e",
    "--color-base-300": "#1f2740",
    "--color-base-content": "#e5e7eb",
    "--color-primary": "#a78bfa",
    "--color-secondary": "#60a5fa",
    "--color-accent": "#2dd4bf",
  },
  mode: "light",
} as const;

// Surface the data-out API on window so the harness (and Playwright) can observe
// what a real host would persist/deploy: the latest onChange site + publish result.
const bus = window as unknown as {
  __ready: boolean;
  __lastChange?: unknown;
  __changeCount: number;
  __published?: unknown;
};
bus.__changeCount = 0;

// Local crash-recovery: ON for the real designer, OFF under test automation (so
// e2e specs start clean and don't restore a prior test's edits) — unless a spec
// opts back in with `?persist=1` (the persistence spec, which cleans up after).
const params = new URLSearchParams(location.search);
const persist = params.has("persist")
  ? params.get("persist") !== "0"
  : !navigator.webdriver;
const persistKey = persist ? "silicaui-designer" : null;

createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <Builder
      document={stamp(heroSplitCta, theme)}
      persistKey={persistKey}
      onChange={(site) => {
        bus.__lastChange = site;
        bus.__changeCount += 1;
      }}
      onPublish={(payload) => {
        bus.__published = payload;
      }}
    />
  </React.StrictMode>,
);

// Signal readiness for Playwright.
bus.__ready = true;
