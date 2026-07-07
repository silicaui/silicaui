/**
 * The Status component — a small status dot, optionally pinging.
 *
 * An inline dot painted with an orthogonal accent. `-ping` adds an expanding,
 * fading ring behind it (respecting reduced-motion). Sizes scale the dot.
 *
 * @param {string[]} colors - color names to generate `.status-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function status(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}status${suffix}`;
  const COLOR = "var(--status-accent, var(--color-base-content))";

  const base = {
    "@keyframes silica-ping": {
      "75%, 100%": { transform: "scale(2.2)", opacity: "0" },
    },

    [sel()]: {
      position: "relative",
      display: "inline-block",
      width: "var(--status-size, 0.625rem)",
      height: "var(--status-size, 0.625rem)",
      borderRadius: "9999px",
      backgroundColor: COLOR,
      verticalAlign: "middle",
      flexShrink: "0",
    },

    // Expanding ring.
    [sel("-ping")]: {
      "&::before": {
        content: '""',
        position: "absolute",
        inset: "0",
        borderRadius: "9999px",
        backgroundColor: COLOR,
        animation: "silica-ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
    "@media (prefers-reduced-motion: reduce)": {
      [`${sel("-ping")}::before`]: { animation: "none" },
    },

    // ---- Sizes -------------------------------------------------------------
    [sel("-xs")]: { "--status-size": "0.375rem" },
    [sel("-sm")]: { "--status-size": "0.5rem" },
    [sel("-md")]: { "--status-size": "0.625rem" },
    [sel("-lg")]: { "--status-size": "0.875rem" },
    [sel("-xl")]: { "--status-size": "1.125rem" },
  };

  for (const name of colors) {
    base[sel(`-${name}`)] = { "--status-accent": `var(--color-${name})` };
  }

  return base;
}
