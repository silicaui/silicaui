/**
 * Container widths a stacked table can switch at, named after Tailwind's own
 * container scale so `table-stack-lg` stacks below exactly the width where a
 * consumer's `@lg:` utilities switch on. Plain `table-stack` uses
 * `TABLE_STACK_DEFAULT`.
 */
export const TABLE_STACK_BREAKPOINTS = {
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
};

/** The width plain `table-stack` stacks below: 36rem (576px), Tailwind's `@xl`. */
export const TABLE_STACK_DEFAULT = "xl";

/** Out of sight, still read by a screen reader (the `sr-only` declarations). */
const VISUALLY_HIDDEN = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
};

/**
 * A stacked table, once its container is narrower than the breakpoint. Each row
 * is a block that wraps its cells: the first cell takes a line of its own (the
 * row's name), the rest flow after it and wrap as they need to, and the last one
 * (usually the row's own button) sits at the end of its line.
 *
 * Cell SIZING belongs to the stack here, with `!important`. A list built for
 * table layout carries width utilities that only make sense in a table: the
 * `w-full max-w-0` truncation trick, a `min-w-56` floor, `whitespace-nowrap` on
 * a total. In a block, those same utilities squeeze the name to its floor and
 * push a nowrap cell past the row's edge, which is the bug this mode exists to
 * fix. Utilities sit in a later layer than this plugin's rules, so only an
 * important declaration here can set them aside, and only below the breakpoint.
 * `display` is left alone, so a cell hidden with `hidden` stays hidden.
 */
function stacked() {
  return {
    display: "block",
    position: "relative",

    // The column headings leave the screen but not the page: a screen reader
    // still reads them. A cell that needs a visible label carries `data-label`.
    "& > thead": VISUALLY_HIDDEN,
    "& > tbody, & > tfoot, & > caption": { display: "block" },
    // Column widths mean nothing once there are no columns.
    "& > colgroup, & > col": { display: "none" },
    // The total row reads as its own block under the last row.
    "& > tfoot": {
      borderTop: "var(--border, 1px) solid var(--color-base-300)",
    },

    "& tr": {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: "var(--table-pad-x)",
      rowGap: "calc(var(--table-pad-y) / 2)",
      paddingInline: "var(--table-pad-x)",
      paddingBlock: "var(--table-pad-y)",
    },
    "& :is(td, th)": {
      padding: "0",
      minWidth: "0 !important",
      maxWidth: "100% !important",
      width: "auto !important",
      // A flex item is placed at its full width first, so a cell moves to the
      // next line whole before its text breaks. "normal" therefore only wraps
      // text that fits on no line at all, and a badge or button inside a cell
      // keeps its own nowrap.
      whiteSpace: "normal !important",
      overflowWrap: "anywhere",
    },
    // An empty cell would still open a gap in the row.
    "& :is(td, th):empty": { display: "none" },
    "& > tbody > tr > :first-child": { flexBasis: "100%" },
    "& tr > :last-child:not(:first-child)": { marginInlineStart: "auto" },
    "& :is(td, th)[data-label]::before": {
      content: "attr(data-label)",
      marginInlineEnd: "0.5em",
      fontWeight: "600",
    },
  };
}

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
 * Stacked: `table-stack` turns the rows into blocks while the table's CONTAINER
 * is narrower than 36rem, so a list fits a narrow pane instead of running past
 * it. The header is visually hidden (a screen reader still reads it), each row
 * wraps its cells with the first on a line of its own and the last at the end,
 * and a cell with `data-label="Total"` shows that label before its value. At
 * 36rem and wider it is an ordinary table. `table-stack-sm`, `-md`, `-lg`,
 * `-xl`, `-2xl` and `-3xl` stack below 24, 28, 32, 36, 42 and 48rem instead:
 * Tailwind's container sizes, so `table-stack-lg` switches where `@lg:` does.
 * Use one of them per table. Works with zebra, hover, every size, and tfoot.
 *
 * The container is the table's parent, which the plugin makes an inline-size
 * query container itself (`:has(> .table-stack)`), so nothing upstream needs
 * `@container`. That parent must take its width from its surroundings (a block,
 * or a stretched flex or grid item), not from the table: a parent sized to its
 * content measures 0 wide. `table-scroll` is that parent ready-made, a
 * full-width block that also scrolls a wide table sideways; the React `<Table>`
 * renders it.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function table(prefix = "") {
  const sel = (suffix = "") => `.${prefix}table${suffix}`;

  const rules = {
    [sel()]: {
      // Cell padding as two properties, so a stacked row pads and gaps at the
      // same density as the cells of whichever size is set.
      "--table-pad-x": "1rem",
      "--table-pad-y": "0.75rem",
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "left",
      fontSize: "1rem",
      lineHeight: "1.5",
      color: "var(--color-base-content)",

      "& th, & td": {
        paddingInline: "var(--table-pad-x)",
        paddingBlock: "var(--table-pad-y)",
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

    // The wrapper a table sits in: a full-width block that scrolls a wide table
    // sideways instead of letting it blow out the page.
    [sel("-scroll")]: {
      display: "block",
      width: "100%",
      overflowX: "auto",
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
      "--table-pad-x": "0.5rem",
      "--table-pad-y": "0.375rem",
    },
    [sel("-sm")]: {
      fontSize: "0.875rem",
      "--table-pad-x": "0.75rem",
      "--table-pad-y": "0.5rem",
    },
    [sel("-md")]: {
      fontSize: "1rem",
      "--table-pad-x": "1rem",
      "--table-pad-y": "0.75rem",
    },
    [sel("-lg")]: {
      fontSize: "1.125rem",
      "--table-pad-x": "1.25rem",
      "--table-pad-y": "1rem",
    },
    [sel("-xl")]: {
      fontSize: "1.25rem",
      "--table-pad-x": "1.5rem",
      "--table-pad-y": "1.25rem",
    },
  };

  // ---- Stacked -------------------------------------------------------------
  // Every stack class, the plain one first. Each is complete on its own.
  const stackClasses = [
    [sel("-stack"), TABLE_STACK_BREAKPOINTS[TABLE_STACK_DEFAULT]],
    ...Object.entries(TABLE_STACK_BREAKPOINTS).map(([name, width]) => [
      sel(`-stack-${name}`),
      width,
    ]),
  ];

  // The table's parent becomes the query container, so a stacked table works
  // with no `@container` anywhere above it. `:where` keeps this at zero
  // specificity, and the queries below are unnamed, so a consumer's own
  // `@container` utility on the same element serves just as well.
  rules[`:where(:has(> :is(${stackClasses.map(([s]) => s).join(", ")})))`] = {
    containerType: "inline-size",
  };

  for (const [selector, width] of stackClasses) {
    rules[selector] = { [`@container (width < ${width})`]: stacked() };
  }

  return rules;
}
