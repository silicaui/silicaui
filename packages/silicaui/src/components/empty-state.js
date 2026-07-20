/**
 * EmptyState — the centered "nothing here yet" placeholder.
 *
 * A vertical stack: an optional icon chip, a title, a description, and an action
 * row. Colorless (neutral by design); it just reads the base tokens so it sits
 * quietly inside any surface (card, table body, panel). The React `<EmptyState>`
 * fills the slots.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function emptyState(prefix = "") {
  const sel = (suffix = "") => `.${prefix}empty-state${suffix}`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "0.75rem",
      padding: "3rem 1.5rem",
      color: "var(--color-base-content)",
    },

    // Icon chip.
    [sel("-icon")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "3rem",
      height: "3rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-base-200)",
      color: "color-mix(in oklab, var(--color-base-content) 55%, transparent)",
      "& svg": { width: "1.5rem", height: "1.5rem", flexShrink: "0" },
    },

    [sel("-title")]: {
      fontSize: "1.05rem",
      fontWeight: "600",
      lineHeight: "1.3",
    },

    [sel("-description")]: {
      maxWidth: "34ch",
      fontSize: "0.9rem",
      lineHeight: "1.5",
      color: "var(--color-base-content)",
    },

    [sel("-actions")]: {
      display: "inline-flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "0.5rem",
      marginTop: "0.5rem",
    },

    // ---- Sizes ------------------------------------------------------------
    // The full xs–xl scale, like every other sized component. `-md` restates
    // the base on purpose so a hand-written `class="empty-state empty-state-md"`
    // resolves in the class-first (vanilla / silicaui-html) layer, where there's
    // no React wrapper to omit the default for you.
    [sel("-xs")]: { padding: "1.25rem 0.75rem", gap: "0.375rem" },
    [sel("-sm")]: { padding: "1.75rem 1rem", gap: "0.5rem" },
    [sel("-md")]: { padding: "3rem 1.5rem", gap: "0.75rem" },
    [sel("-lg")]: { padding: "4rem 2rem", gap: "1rem" },
    [sel("-xl")]: { padding: "5rem 2.5rem", gap: "1.25rem" },
  };
}
