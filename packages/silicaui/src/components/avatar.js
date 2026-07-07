import { contentVar } from "../lib/auto-content.js";

/**
 * The Avatar component — a user/entity thumbnail: a photo, or an initials /
 * icon fallback on a colored chip.
 *
 * Single element by design. It does NOT clip with `overflow: hidden`; instead
 * the inner `<img>` rounds itself via `border-radius: inherit` (border-radius
 * clips a raster image to the rounded shape in every engine). That keeps the
 * clip while letting the accent ring (`box-shadow`) and the presence dot
 * (`::after`) render OUTSIDE the circle, where `overflow: hidden` would eat them.
 *
 * Orthogonal color model like the rest of the system, but scoped to the
 * fallback chip: a color class sets `--avatar-bg`/`--avatar-fg` (the initials
 * chip) and `--avatar-accent` (the ring). Circle by default; `-rounded`
 * switches to a `--radius-box` square. `-ring` adds a gap ring, `-online` /
 * `-offline` a presence dot, and `.avatar-group` overlaps a row of them.
 *
 * @param {string[]} colors - color names to generate `.avatar-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function avatar(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}avatar${suffix}`;

  const base = {
    [sel()]: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      width: "2.5rem",
      height: "2.5rem",
      borderRadius: "9999px",
      backgroundColor: "var(--avatar-bg, var(--color-base-300))",
      color: "var(--avatar-fg, var(--color-base-content))",
      fontSize: "0.875rem",
      fontWeight: "600",
      lineHeight: "1",
      userSelect: "none",
      verticalAlign: "middle",
      // Not clipped — see the file header for why the img self-rounds instead.
      overflow: "visible",

      // The photo. Rounds to the avatar's shape via `inherit` and covers.
      "& > img": {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "inherit",
        display: "block",
      },
      // An icon fallback sits smaller than initials would.
      "& > svg": {
        width: "60%",
        height: "60%",
      },
    },

    // Rounded-square instead of a circle (box-tier radius).
    [sel("-rounded")]: {
      borderRadius: "var(--radius-box, 0.5rem)",
    },

    // Accent ring with a base-100 gap. `box-shadow` renders outside the box, so
    // it survives the img clip; sized in `em` so it scales with the avatar.
    [sel("-ring")]: {
      boxShadow:
        "0 0 0 0.15em var(--color-base-100), 0 0 0 0.3em var(--avatar-accent, var(--color-primary))",
    },

    // ---- Presence dot ------------------------------------------------------
    // Shared geometry (bottom-right, sized as a % of the avatar so it tracks
    // every size); a base-100 halo separates it from the photo. Color per state.
    [`${sel("-online")}::after, ${sel("-offline")}::after`]: {
      content: '""',
      position: "absolute",
      bottom: "5%",
      right: "5%",
      width: "25%",
      height: "25%",
      borderRadius: "9999px",
      boxShadow: "0 0 0 0.12em var(--color-base-100)",
    },
    [`${sel("-online")}::after`]: {
      backgroundColor: "var(--color-success)",
    },
    [`${sel("-offline")}::after`]: {
      backgroundColor: "var(--color-base-300)",
    },

    // ---- Group (overlapping stack) -----------------------------------------
    // Each avatar carves out of its neighbor with a base-100 ring, then pulls
    // left to overlap. `em` overlap scales with the avatars' own size.
    [sel("-group")]: {
      display: "inline-flex",
      alignItems: "center",
    },
    [`${sel("-group")} > ${sel()}`]: {
      boxShadow: "0 0 0 0.15em var(--color-base-100)",
      marginInlineStart: "-0.7em",
    },
    [`${sel("-group")} > ${sel()}:first-child`]: {
      marginInlineStart: "0",
    },

    // ---- Sizes (box + initials type) ---------------------------------------
    [sel("-xs")]: { width: "1.5rem", height: "1.5rem", fontSize: "0.625rem" },
    [sel("-sm")]: { width: "2rem", height: "2rem", fontSize: "0.75rem" },
    [sel("-md")]: { width: "2.5rem", height: "2.5rem", fontSize: "0.875rem" },
    [sel("-lg")]: { width: "3rem", height: "3rem", fontSize: "1rem" },
    [sel("-xl")]: { width: "4rem", height: "4rem", fontSize: "1.25rem" },
  };

  // ---- Color variants (extensible) -----------------------------------------
  // Paint the fallback chip and the ring; a photo avatar just ignores these.
  for (const name of colors) {
    const color = `var(--color-${name})`;
    base[sel(`-${name}`)] = {
      "--avatar-bg": color,
      "--avatar-fg": contentVar(name),
      "--avatar-accent": color,
    };
  }

  return base;
}
