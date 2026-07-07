/**
 * The Card component — a surface container.
 *
 * Box-tier element: rounds with `--radius-box`. Sits on the `base-100` surface
 * with a `base-300` hairline and a `--depth`-scaled shadow (flat when
 * `--depth: 0`). Composes from parts: `.card` (frame) → `.card-body` (padded
 * stack) with `.card-title` and `.card-actions` inside. A full-bleed `<figure>`
 * (e.g. a cover image) is handled by the nested rules below.
 *
 * Card has no color variants — it's a neutral surface — so unlike the other
 * components it takes only the prefix.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function card(prefix = "") {
  const sel = (suffix = "") => `.${prefix}card${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minWidth: "0",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      borderRadius: "var(--radius-box, 0.5rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--color-base-300)",
      boxShadow:
        "0 1px 3px 0 rgb(0 0 0 / calc(var(--depth, 1) * 0.1)), 0 1px 2px -1px rgb(0 0 0 / calc(var(--depth, 1) * 0.1))",
      overflow: "hidden",

      // Full-bleed media (cover image) — cancel default figure margin and let
      // the image fill the card's width.
      "& > figure": {
        margin: "0",
      },
      "& > figure img": {
        display: "block",
        width: "100%",
        height: "auto",
      },
    },

    [sel("-body")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      flex: "1 1 auto",
      padding: "1.5rem",
    },

    [sel("-title")]: {
      fontSize: "1.125rem",
      fontWeight: "600",
      lineHeight: "1.4",
    },

    [sel("-actions")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "0.5rem",
      marginTop: "0.5rem",
    },
  };
}
