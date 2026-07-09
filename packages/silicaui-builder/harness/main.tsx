import "./styles.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Builder } from "@wizeworks/silicaui-builder/react";
import { EmailBuilder } from "@wizeworks/silicaui-builder/email/react";
import { stamp } from "@wizeworks/silicaui-html";
import { heroSplitCta } from "@wizeworks/silicaui-html/blocks";

// The editable DOCUMENT theme — a complete "lightsilica" palette (every surface +
// role) so the Theme editor's tile grid and the component board are fully
// populated. A nested `[data-theme]` island, distinct from the chrome's studio
// theme; editing it must never move the chrome.
const theme = {
  name: "lightsilica",
  tokens: {
    "--color-base-100": "oklch(98% 0.003 250)",
    "--color-base-200": "oklch(95% 0.004 250)",
    "--color-base-300": "oklch(90% 0.006 250)",
    "--color-base-content": "oklch(21% 0.012 255)",
    "--color-primary": "oklch(42% 0.055 252)",
    "--color-primary-content": "oklch(98% 0.004 250)",
    "--color-secondary": "oklch(55% 0.035 255)",
    "--color-secondary-content": "oklch(98% 0.004 250)",
    "--color-accent": "oklch(64% 0.13 211)",
    "--color-accent-content": "oklch(15% 0.02 255)",
    "--color-neutral": "oklch(26% 0.014 255)",
    "--color-neutral-content": "oklch(95% 0.004 250)",
    "--color-info": "oklch(68% 0.1 232)",
    "--color-success": "oklch(70% 0.12 150)",
    "--color-warning": "oklch(80% 0.11 85)",
    "--color-error": "oklch(58% 0.17 25)",
  },
  dark: {
    "--color-base-100": "oklch(16% 0.01 255)",
    "--color-base-200": "oklch(13.5% 0.01 255)",
    "--color-base-300": "oklch(11% 0.01 255)",
    "--color-base-content": "oklch(93% 0.006 250)",
    "--color-primary": "oklch(72% 0.06 252)",
    "--color-secondary": "oklch(78% 0.035 255)",
    "--color-accent": "oklch(72% 0.13 211)",
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
  __exported?: string;
  __sentTest?: { to: string; subject: string };
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

// `?editor=email` mounts the email builder instead of the site builder — a query
// switch (not a route) since this is a single-page dev harness, not the product.
const editorMode = params.get("editor");

const root = createRoot(document.getElementById("app") as HTMLElement);
if (editorMode === "email") {
  root.render(
    <React.StrictMode>
      <EmailBuilder
        theme={theme}
        persistKey={persist ? "silicaui-designer-email" : null}
        onChange={(doc) => {
          bus.__lastChange = doc;
          bus.__changeCount += 1;
        }}
        onExport={(html) => {
          bus.__exported = html;
        }}
        onSendTest={async ({ to, subject }) => {
          // Simulate a real (slow, sometimes-fails) send: a host's ESP call.
          await new Promise((r) => setTimeout(r, 150));
          bus.__sentTest = { to, subject };
        }}
      />
    </React.StrictMode>,
  );
} else {
  root.render(
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
}

// Signal readiness for Playwright.
bus.__ready = true;
