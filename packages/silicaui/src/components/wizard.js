import { colorVariantRules } from "../color-variants.js";

/**
 * Wizard — a multi-step flow: a numbered step indicator with connectors, a
 * content pane for the active step, and a Back / Next-or-Finish footer. The
 * React `<Wizard>` owns the active-step state, linear vs. free navigation, and
 * the footer buttons; this styles the indicator (upcoming / active / complete
 * markers + the connecting rail), the content area, and the footer row.
 *
 * Colored: a `.wizard-<name>` class sets `--wz-accent` (+ its readable
 * `--wz-accent-content`), which the active/complete markers and filled
 * connectors read — orthogonal accent, same as the rest of Silica.
 *
 * @param {string[]} colors - color names to generate `.wizard-<name>` for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function wizard(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}wizard${suffix}`;
  const accent = "var(--wz-accent, var(--color-primary))";
  const accentContent = "var(--wz-accent-content, var(--color-primary-content))";
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  const base = {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      width: "100%",
      color: "var(--color-base-content)",
    },

    // Indicator row.
    [sel("-steps")]: {
      display: "flex",
      alignItems: "flex-start",
      margin: "0",
      padding: "0",
      listStyle: "none",
    },
    [sel("-step")]: {
      position: "relative",
      flex: "1 1 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0",
      border: "0",
      background: "none",
      font: "inherit",
      color: "inherit",
      textAlign: "center",
      cursor: "default",
    },
    [`${sel("-step")}[data-clickable]`]: { cursor: "pointer" },
    [`${sel("-step")}[data-disabled]`]: { opacity: "0.5", cursor: "not-allowed" },

    // The rail connecting each marker to the previous one (behind the markers).
    [`${sel("-step")}:not(:first-child)::before`]: {
      content: '""',
      position: "absolute",
      top: "1rem",
      left: "-50%",
      right: "50%",
      height: "2px",
      transform: "translateY(-50%)",
      backgroundColor: "var(--color-base-300)",
      zIndex: "0",
    },
    [`${sel("-step")}[data-state="active"]::before, ${sel("-step")}[data-state="complete"]::before`]:
      {
        backgroundColor: accent,
      },

    // The marker bubble.
    [sel("-step-marker")]: {
      position: "relative",
      zIndex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "2rem",
      height: "2rem",
      borderRadius: "9999px",
      fontSize: "1rem",
      fontWeight: "700",
      backgroundColor: "var(--color-base-200)",
      color: muted(55),
      border: "2px solid var(--color-base-300)",
      transition:
        "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
      "& svg": { width: "1.05rem", height: "1.05rem", flexShrink: "0" },
    },
    [`${sel("-step")}[data-state="active"] ${sel("-step-marker")}`]: {
      backgroundColor: accent,
      borderColor: accent,
      color: accentContent,
      boxShadow: `0 0 0 4px color-mix(in oklab, ${accent} 22%, transparent)`,
    },
    [`${sel("-step")}[data-state="complete"] ${sel("-step-marker")}`]: {
      backgroundColor: accent,
      borderColor: accent,
      color: accentContent,
    },

    [sel("-step-label")]: {
      fontSize: "1rem",
      lineHeight: "1.3",
      color: muted(70),
    },
    [`${sel("-step")}[data-state="active"] ${sel("-step-label")}`]: {
      color: "var(--color-base-content)",
      fontWeight: "600",
    },
    [sel("-step-optional")]: {
      display: "block",
      fontSize: "1rem",
      color: muted(50),
    },

    // Active step's content.
    [sel("-content")]: {
      minHeight: "3rem",
    },

    // Footer nav row.
    [sel("-footer")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
    },

    // The system's own focus ring, on controls that were falling back to the
    // BROWSER's. The browser's ring is visible -- Chromium adapts it -- but it is
    // 1px where this system's is 2px, it carries no offset, it ignores the theme,
    // and its shape is the browser's choice, not this system's. Focus should not change
    // appearance depending on which control a person is standing on.
    // Found by a sweep of all 116 component pages (P07, docs/personas/issues/092).
    [`${sel("-step")}:focus-visible`]: {
      outline: "var(--focus-width, 2px) solid var(--color-primary)",
      outlineOffset: "-2px",
    },
  };

  Object.assign(base, colorVariantRules("wizard", colors, prefix));

  return base;
}
