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

createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <Builder document={stamp(heroSplitCta, theme)} />
  </React.StrictMode>,
);

// Signal readiness for Playwright.
(window as unknown as { __ready: boolean }).__ready = true;
