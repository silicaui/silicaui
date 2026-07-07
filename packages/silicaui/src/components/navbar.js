/**
 * The Navbar component — a horizontal top bar with start / center / end slots.
 *
 * Colorless. A flex row painted with the base surface. The three slots use
 * `flex: 1` on start/end and `flex-shrink: 0` on center, so a centered slot
 * stays optically centered whether or not the start/end content is balanced —
 * and it degrades gracefully to a simple two-side bar when center is omitted.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function navbar(prefix = "") {
  const sel = (suffix = "") => `.${prefix}navbar${suffix}`;

  const slot = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  return {
    [sel()]: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      width: "100%",
      minHeight: "4rem",
      paddingBlock: "0.5rem",
      paddingInline: "1rem",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
    },

    [sel("-start")]: { ...slot, flex: "1 1 0%", justifyContent: "flex-start" },
    [sel("-center")]: { ...slot, flexShrink: "0", justifyContent: "center" },
    [sel("-end")]: { ...slot, flex: "1 1 0%", justifyContent: "flex-end" },
  };
}
