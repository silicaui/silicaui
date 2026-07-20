import { contentVar } from "../lib/auto-content.js";

/**
 * The Tabs surface — the visual half of the Base-UI-backed Tabs (no portal;
 * Base UI owns selection state, roving focus, and the moving indicator's
 * measurements). This styles the list, tabs, the sliding indicator, and panel.
 *
 * The active tab is marked **`[data-active]`** by Base UI (NOT `data-selected` —
 * that mismatch silently no-ops the text-color rules while the indicator still
 * moves, since the indicator is positioned by CSS vars, not the attribute).
 * The indicator reads Base UI's `--active-tab-left`/`-width` (and `-top`/`-height`
 * for the pill variants) and eases between positions.
 *
 * Accent is themed like the rest of the system: everything reads
 * `--tabs-accent` / `--tabs-accent-content`, defaulting to primary. A color
 * class (`.tabs-success`) re-points those, so a whole tab set recolors — and it
 * still tracks the active theme, since the fallbacks are theme tokens.
 *
 * @param {string[]} colors - color names to generate `.tabs-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function tabs(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}tabs${suffix}`;
  const ACCENT = "var(--tabs-accent, var(--color-primary))";
  const ACCENT_CONTENT =
    "var(--tabs-accent-content, var(--color-primary-content))";

  const base = {
    // Root — just a flow container.
    [sel()]: {
      display: "block",
    },

    // The tab strip; position context for the indicator + a baseline rule.
    [sel("-list")]: {
      position: "relative",
      display: "inline-flex",
      gap: "0.25rem",
      borderBottom: "var(--border, 1px) solid var(--color-base-300)",
    },

    [sel("-tab")]: {
      appearance: "none",
      background: "transparent",
      border: "0",
      cursor: "pointer",
      padding: "0.5rem 0.875rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1.4",
      color: "var(--color-base-content)",
      borderRadius:
        "var(--radius-field, 0.25rem) var(--radius-field, 0.25rem) 0 0",
      transitionProperty: "color",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
      "&:hover": { color: "var(--color-base-content)" },
      "&[data-active]": { color: ACCENT },
      "&:focus-visible": {
        outline: `var(--focus-width, 2px) solid ${ACCENT}`,
        outlineOffset: "-2px",
      },
    },

    // The moving underline. Base UI sets --active-tab-left/-width on this element.
    [sel("-indicator")]: {
      position: "absolute",
      bottom: "-1px",
      left: "var(--active-tab-left)",
      width: "var(--active-tab-width)",
      height: "2px",
      backgroundColor: ACCENT,
      borderRadius: "2px",
      transitionProperty: "left, width",
      transitionDuration: "var(--duration, 150ms)",
      transitionTimingFunction: "var(--ease, cubic-bezier(0.4, 0, 0.2, 1))",
    },

    [sel("-panel")]: {
      paddingTop: "1rem",
      outline: "none",
    },

    // ---- Variant: boxed (segmented control) --------------------------------
    // A base-200 track; the indicator becomes a raised base-100 pill that slides
    // to cover the whole active tab (reads --active-tab-top/-left/-width/-height).
    // Intentionally neutral (surface pill, base-content text) — accent shows in
    // underline/pills instead.
    [`${sel("-boxed")} ${sel("-list")}`]: {
      border: "0",
      gap: "0.25rem",
      padding: "0.25rem",
      backgroundColor: "var(--color-base-200)",
      borderRadius: "var(--radius-field, 0.25rem)",
    },
    [`${sel("-boxed")} ${sel("-tab")}`]: {
      position: "relative",
      zIndex: "1",
      padding: "0.375rem 0.75rem",
      borderRadius: "calc(var(--radius-field, 0.25rem) - 0.125rem)",
    },
    [`${sel("-boxed")} ${sel("-tab")}[data-active]`]: {
      color: "var(--color-base-content)",
    },
    [`${sel("-boxed")} ${sel("-indicator")}`]: {
      top: "var(--active-tab-top)",
      left: "var(--active-tab-left)",
      width: "var(--active-tab-width)",
      height: "var(--active-tab-height)",
      bottom: "auto",
      zIndex: "0",
      borderRadius: "calc(var(--radius-field, 0.25rem) - 0.125rem)",
      backgroundColor: "var(--color-base-100)",
      boxShadow: "0 1px 2px rgb(0 0 0 / 0.1)",
    },

    // ---- Variant: pills (accent fill) --------------------------------------
    [`${sel("-pills")} ${sel("-list")}`]: {
      border: "0",
      gap: "0.25rem",
    },
    [`${sel("-pills")} ${sel("-tab")}`]: {
      position: "relative",
      zIndex: "1",
      padding: "0.375rem 0.875rem",
      borderRadius: "9999px",
    },
    [`${sel("-pills")} ${sel("-tab")}[data-active]`]: {
      color: ACCENT_CONTENT,
    },
    [`${sel("-pills")} ${sel("-indicator")}`]: {
      top: "var(--active-tab-top)",
      left: "var(--active-tab-left)",
      width: "var(--active-tab-width)",
      height: "var(--active-tab-height)",
      bottom: "auto",
      zIndex: "0",
      borderRadius: "9999px",
      backgroundColor: ACCENT,
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Re-point the accent; underline + pills follow. Fallbacks keep theme-tracking.
  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--tabs-accent": `var(--color-${name})`,
      "--tabs-accent-content": contentVar(name),
    };
  }

  return base;
}
