/**
 * The RadialProgress component — a circular progress ring with a centered label.
 *
 * Colorless accent (defaults to primary). Drawn with a single `conic-gradient`
 * (filled arc + base-300 track) and a `::before` inner disc that punches out the
 * centre to leave a ring of `--thickness`. No mask, no SVG — `conic-gradient`
 * ships across every engine (2020+). The `--value` (0–100), `--size`, and
 * `--thickness` custom properties are set inline by the React wrapper.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function radialProgress(prefix = "") {
  const sel = (suffix = "") => `.${prefix}radial-progress${suffix}`;

  return {
    [sel()]: {
      "--value": "0",
      "--size": "5rem",
      "--thickness": "0.5rem",

      position: "relative",
      display: "inline-grid",
      placeItems: "center",
      width: "var(--size)",
      height: "var(--size)",
      borderRadius: "9999px",
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "var(--color-base-content)",
      backgroundColor: "transparent",
      backgroundImage:
        "conic-gradient(var(--radial-accent, var(--color-primary)) calc(var(--value) * 1%), var(--color-base-300) 0)",

      // Punch out the centre to leave a ring.
      "&::before": {
        content: '""',
        position: "absolute",
        inset: "var(--thickness)",
        borderRadius: "9999px",
        backgroundColor: "var(--color-base-100)",
      },
      // Keep the label above the disc.
      "& > *": {
        position: "relative",
        zIndex: "1",
      },
    },
  };
}
