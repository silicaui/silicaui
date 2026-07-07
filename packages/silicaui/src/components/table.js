/**
 * The Table component — a styled native `<table>`.
 *
 * Colorless (like Card/Skeleton → `table(prefix)` only). Rather than wrapping
 * every cell in a class, `.table` styles the native table elements it contains
 * (`th`, `td`, `thead`, `tbody tr`) via descendant selectors — so it works on
 * plain semantic HTML (`<table class="table"><thead>…`) with no per-cell
 * classes, and the React layer can stay a single `<Table>` over raw rows.
 *
 * Modifiers: `-zebra` (striped rows), `-hover` (row highlight — a translucent
 * base-content wash so it stays visible ON TOP of a zebra stripe too), and
 * sizes `-xs…-xl` (cell padding + type). Neutral by design; no color variants.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function table(prefix = "") {
  const sel = (suffix = "") => `.${prefix}table${suffix}`;

  return {
    [sel()]: {
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "left",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      color: "var(--color-base-content)",

      "& th, & td": {
        paddingInline: "1rem",
        paddingBlock: "0.75rem",
        verticalAlign: "middle",
      },
      // Header + footer labels read a touch stronger than body cells.
      "& thead th, & tfoot th, & tfoot td": {
        fontWeight: "600",
      },
      "& thead th": {
        borderBottom: "var(--border, 1px) solid var(--color-base-300)",
      },
      // Hairline row separators; the last body row drops its rule so it doesn't
      // double up with a container border.
      "& tbody tr": {
        borderBottom: "var(--border, 1px) solid var(--color-base-200)",
      },
      "& tbody tr:last-child": {
        borderBottom: "0",
      },
    },

    // Striped rows.
    [sel("-zebra")]: {
      "& tbody tr:nth-child(even)": {
        backgroundColor: "var(--color-base-200)",
      },
    },

    // Row hover. A translucent wash (oklab, not oklch — see the color-mix note)
    // so it darkens whatever's beneath and stays visible over a zebra stripe.
    [sel("-hover")]: {
      "& tbody tr:hover": {
        backgroundColor:
          "color-mix(in oklab, var(--color-base-content) 6%, transparent)",
      },
    },

    // ---- Sizes (cell padding + type) ---------------------------------------
    [sel("-xs")]: {
      fontSize: "0.75rem",
      "& th, & td": { paddingInline: "0.5rem", paddingBlock: "0.375rem" },
    },
    [sel("-sm")]: {
      fontSize: "0.8125rem",
      "& th, & td": { paddingInline: "0.75rem", paddingBlock: "0.5rem" },
    },
    [sel("-md")]: {
      fontSize: "0.875rem",
      "& th, & td": { paddingInline: "1rem", paddingBlock: "0.75rem" },
    },
    [sel("-lg")]: {
      fontSize: "1rem",
      "& th, & td": { paddingInline: "1.25rem", paddingBlock: "1rem" },
    },
    [sel("-xl")]: {
      fontSize: "1.125rem",
      "& th, & td": { paddingInline: "1.5rem", paddingBlock: "1.25rem" },
    },
  };
}
