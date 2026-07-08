import { contentVar } from "../lib/auto-content.js";

/**
 * The Chat component — a message row with an avatar, header/footer, and bubble.
 *
 * A grid: the avatar (`.chat-image`) spans all rows in one column; the header,
 * bubble, and footer stack in the other. `.chat-start` puts the avatar on the
 * left (incoming), `.chat-end` flips it to the right (outgoing). The bubble
 * takes an orthogonal color (`.chat-bubble-primary`), defaulting to a neutral
 * base-200 surface.
 *
 * @param {string[]} colors - color names to generate `.chat-bubble-<name>` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function chat(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}chat${suffix}`;

  const base = {
    [sel()]: {
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      columnGap: "0.75rem",
      rowGap: "0.125rem",
      paddingBlock: "0.25rem",
    },

    // Avatar column spans the header/bubble/footer rows, top-aligned so it
    // lines up with the FIRST row of content — the message itself in the
    // common (`ChatMessage`) case of bubble-then-footer, or the name/time
    // header in the primitive header-then-bubble composition. Either way,
    // the avatar reads as attached to whatever's on top, not stranded
    // against a short trailing metadata line.
    [sel("-image")]: {
      gridRow: "1 / -1",
      alignSelf: "start",
    },
    // Everything but the avatar lives in the content column.
    [`${sel()} > *:not(${sel("-image")})`]: {
      gridColumn: "2",
    },

    [sel("-header")]: {
      fontSize: "0.75rem",
      opacity: "0.7",
    },
    [sel("-footer")]: {
      fontSize: "0.75rem",
      opacity: "0.6",
    },

    [sel("-bubble")]: {
      width: "fit-content",
      maxWidth: "min(42rem, 100%)",
      paddingBlock: "0.5rem",
      paddingInline: "0.875rem",
      borderRadius: "var(--radius-box, 0.75rem)",
      backgroundColor: "var(--chat-bubble-bg, var(--color-base-200))",
      color: "var(--chat-bubble-fg, var(--color-base-content))",
    },

    // ---- End (outgoing) ----------------------------------------------------
    [sel("-end")]: {
      gridTemplateColumns: "1fr auto",

      [`& ${sel("-image")}`]: { gridColumn: "2" },
    },
    [`${sel("-end")} > *:not(${sel("-image")})`]: {
      gridColumn: "1",
      justifySelf: "end",
      textAlign: "end",
    },
    [`${sel("-end")} ${sel("-bubble")}`]: {
      marginInlineStart: "auto",
    },
  };

  for (const name of colors) {
    base[sel(`-bubble-${name}`)] = {
      "--chat-bubble-bg": `var(--color-${name})`,
      "--chat-bubble-fg": contentVar(name),
    };
  }

  return base;
}
