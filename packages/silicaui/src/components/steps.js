import { contentVar } from "../lib/auto-content.js";

/**
 * The Steps component — a horizontal progress tracker.
 *
 * A `.steps` list lays each `.step` out as an equal-width column: a numbered
 * node on top, a label under it. Two pseudo-elements do the work — `::before`
 * is the node (shows `counter(step)`, or a `data-content` override like a
 * check), `::after` is the connector line reaching back to the previous node
 * (absolutely placed at the node's center line, behind it). The first step
 * drops its connector.
 *
 * A step marked with a color (`.step-primary`) paints its node AND its incoming
 * connector via `--step-bg`/`--step-fg` — so coloring the steps up to the
 * current one reads as "completed". Extensible over the color set.
 *
 * @param {string[]} colors - color names to generate `.step-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function steps(colors, prefix = "") {
  const step = (suffix = "") => `.${prefix}step${suffix}`;
  const stepsSel = `.${prefix}steps`;

  const base = {
    [stepsSel]: {
      display: "flex",
      counterReset: "step",
      overflowX: "auto",
      listStyle: "none",
      margin: "0",
      padding: "0",
    },

    [step()]: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      flex: "1 1 0%",
      minWidth: "4rem",
      textAlign: "center",
      fontSize: "0.8125rem",
      color: "var(--color-base-content)",
    },

    // The node (in-flow, sits at the top of the column).
    [`${step()}::before`]: {
      content: "counter(step)",
      counterIncrement: "step",
      zIndex: "1",
      display: "grid",
      placeItems: "center",
      width: "2rem",
      height: "2rem",
      borderRadius: "9999px",
      fontSize: "0.8125rem",
      fontWeight: "600",
      backgroundColor: "var(--step-bg, var(--color-base-300))",
      color: "var(--step-fg, var(--color-base-content))",
    },
    // Optional glyph override (e.g. data-content="✓") — counter still advances.
    [`${step()}[data-content]::before`]: {
      content: "attr(data-content)",
    },

    // The connector back to the previous node: a bar on the node's center line,
    // behind it, spanning from the previous node's center to this one's.
    [`${step()}::after`]: {
      content: '""',
      position: "absolute",
      top: "calc(1rem - 0.125rem)",
      left: "-50%",
      width: "100%",
      height: "0.25rem",
      zIndex: "0",
      backgroundColor: "var(--step-bg, var(--color-base-300))",
    },
    [`${step()}:first-child::after`]: {
      display: "none",
    },
  };

  // ---- Color variants (extensible) -----------------------------------------
  for (const name of colors) {
    base[step(`-${name}`)] = {
      "--step-bg": `var(--color-${name})`,
      "--step-fg": contentVar(name),
    };
  }

  return base;
}
