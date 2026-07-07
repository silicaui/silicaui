/**
 * The Join component — groups adjacent items (buttons, inputs) into one
 * seamless segmented control.
 *
 * Colorless / structural. It resets every child's corners to square, rounds
 * only the outer ends of the group (`--radius-field`), and pulls each item back
 * by one border-width so shared edges don't double up. The hovered/focused
 * child lifts via `z-index` so its border/ring sits above its neighbours.
 * Horizontal by default; `-vertical` stacks them.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function join(prefix = "") {
  const sel = (suffix = "") => `.${prefix}join${suffix}`;
  const h = `${sel()}:not(${sel("-vertical")})`;
  const v = sel("-vertical");
  const R = "var(--radius-field, 0.25rem)";
  const NEG = "calc(var(--border, 1px) * -1)";

  return {
    [sel()]: {
      display: "inline-flex",
      "& > *": { borderRadius: "0" },
      // Keep the active item's border/ring above its overlapped neighbours.
      "& > *:hover, & > *:focus-visible, & > *:focus-within": {
        position: "relative",
        zIndex: "1",
      },
    },
    [v]: { flexDirection: "column" },

    // ---- Horizontal outer corners + border overlap -------------------------
    [`${h} > :first-child`]: {
      borderStartStartRadius: R,
      borderEndStartRadius: R,
    },
    [`${h} > :last-child`]: {
      borderStartEndRadius: R,
      borderEndEndRadius: R,
    },
    [`${h} > :not(:first-child)`]: {
      marginInlineStart: NEG,
    },

    // ---- Vertical outer corners + border overlap ---------------------------
    [`${v} > :first-child`]: {
      borderStartStartRadius: R,
      borderStartEndRadius: R,
    },
    [`${v} > :last-child`]: {
      borderEndStartRadius: R,
      borderEndEndRadius: R,
    },
    [`${v} > :not(:first-child)`]: {
      marginTop: NEG,
    },
  };
}
