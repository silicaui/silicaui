import { contentVar } from "../lib/auto-content.js";

/**
 * The Dock component — a bottom navigation bar of icon+label items.
 *
 * Colorless base with an orthogonal accent for the active item. A flex row of
 * equal-width `.dock-item` buttons, each an icon over a small label. Position it
 * yourself (`fixed bottom-0` for a real app dock). The active item lifts to full
 * opacity and the accent color.
 *
 * @param {string[]} colors - color names to generate `.dock-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function dock(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}dock${suffix}`;

  const base = {
    [sel()]: {
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-around",
      width: "100%",
      minHeight: "4rem",
      backgroundColor: "var(--color-base-100)",
      borderTop: "1px solid var(--color-base-300)",
      color: "var(--color-base-content)",
    },

    [sel("-item")]: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.15rem",
      flex: "1 1 0%",
      paddingBlock: "0.4rem",
      border: "0",
      background: "none",
      color: "inherit",
      opacity: "0.55",
      cursor: "pointer",
      transition: "color 0.15s, opacity 0.15s",

      "& svg": { width: "1.35rem", height: "1.35rem", display: "block" },
      "&:hover": { opacity: "0.85" },
    },

    [sel("-item-active")]: {
      opacity: "1",
      color: "var(--dock-accent, var(--color-primary))",
    },

    [sel("-label")]: {
      fontSize: "0.6875rem",
      fontWeight: "500",
    },
  };

  for (const name of colors) {
    base[sel(`-${name}`)] = {
      "--dock-accent": `var(--color-${name})`,
      "--dock-accent-content": contentVar(name),
    };
  }

  return base;
}
