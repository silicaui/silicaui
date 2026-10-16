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
 * A cell the stack treats as not there: Tailwind's `hidden` utility (this is a
 * Tailwind plugin, so that class is a known quantity) or the `hidden` attribute.
 * A list hides a column below a pane width with `hidden @xl:table-cell`, and the
 * stack must not hand the row's own line, or its end, to a cell nobody sees.
 *
 * The test is the class or the attribute, not the computed `display`, which a
 * selector cannot read. So a cell is treated as hidden whenever it CARRIES
 * `hidden`, even at a width where a variant such as `@xl:table-cell` shows it.
 * That only matters if the table stacks at a wider breakpoint than the variant
 * switches at (`table-stack-3xl` with `@xl:table-cell`); match the two. A
 * Tailwind prefix (`tw:hidden`) is not recognized; use the attribute there.
 */
const HIDDEN = ".hidden, [hidden]";
/**
 * A table that is hidden, which the stack's important `display: block` must not
 * show: the `hidden` class or attribute, and also any variant, prefix or
 * important form of the class (`md:hidden`, `@xl:hidden`, `tw:hidden`,
 * `hidden!`, `!hidden`), because an important block in this layer overrides
 * every one of them. A table hidden with a variant does not get the important
 * block at ANY width, so where the variant does not apply, Tailwind's `table`
 * utility can make it a table again; to hide a stacked table at some widths
 * only, hide its wrapper instead.
 */
const TABLE_HIDDEN = `${HIDDEN}, [class*=":hidden"], [class*="!hidden"], [class~="hidden!"]`;
/** The first, second and last cells of a row that are not hidden. */
const FIRST_SHOWN = `:nth-child(1 of :not(${HIDDEN}))`;
const SECOND_SHOWN = `:nth-child(2 of :not(${HIDDEN}))`;
const LAST_SHOWN = `:nth-last-child(1 of :not(${HIDDEN}))`;

/**
 * A cell that holds only a control to pick the row: a lone checkbox or radio
 * (the bare `<Checkbox>` renders exactly that), or any cell marked
 * `data-stack="select"`, for a control wrapped in more markup.
 */
const PICK_CONTROL = 'input:is([type="checkbox"], [type="radio"]):only-child';
const SELECT_CELL = `:is([data-stack="select"], :has(> ${PICK_CONTROL}))`;

/**
 * A stacked table, once its container is narrower than the breakpoint. Each row
 * is a block that wraps its cells: the first cell takes a line of its own (the
 * row's name), the rest flow after it and wrap as they need to, and the last one
 * (usually the row's own button) sits at the end of its line. "First" and "last"
 * mean the first and last cells that show, so hidden cells (see `HIDDEN`) are
 * skipped wherever they are in the row.
 *
 * A first cell that only picks the row (see `SELECT_CELL`) does not take that
 * line: it stays at the start of the name's line, the name fills the rest of
 * it, and the other cells move below. This only applies to the first cell that
 * shows; a selection cell further along the row is an ordinary cell.
 *
 * Cell SIZING belongs to the stack here, with `!important`. A list built for
 * table layout carries width utilities that only make sense in a table: the
 * `w-full max-w-0` truncation trick, a `min-w-56` floor, `whitespace-nowrap` on
 * a total. In a block, those same utilities squeeze the name to its floor and
 * push a nowrap cell past the row's edge, which is the bug this mode exists to
 * fix. Utilities sit in a later layer than this plugin's rules, so only an
 * important declaration here can set them aside, and only below the breakpoint.
 * A cell's `display` is left alone, so a cell hidden with `hidden` stays hidden.
 *
 * The TABLE's own `display: block` is important too, for a different reason:
 * `table` is also a Tailwind core utility, `.table { display: table }`. Any app
 * whose sources contain the word gets it, in the utilities layer, where it
 * beats this rule. A stacked table left as a table still wraps its rows, but it
 * grows to fit its longest unbroken line, so a list of truncated names ran
 * 1040px wide in a 323px pane and scrolled sideways. The important block skips
 * a table that is hidden (see `TABLE_HIDDEN`), which must stay hidden. The rows,
 * the body and the footer keep a normal `display`: no utility is documented on
 * them, and an important one would show a row hidden with `hidden`.
 */
function stacked() {
  return {
    display: "block",
    [`&:not(${TABLE_HIDDEN})`]: { display: "block !important" },
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
    // The name's own line. `:nth-child(1 of …)` rather than `:first-child`, so
    // a hidden first cell is skipped; with no hidden cell it is the same cell.
    [`& > tbody > tr > ${FIRST_SHOWN}:not(${SELECT_CELL})`]: { flexBasis: "100%" },
    // A leading selection cell: the name beside it fills the rest of the line…
    [`& > tbody > tr > ${FIRST_SHOWN}${SELECT_CELL} ~ ${SECOND_SHOWN}`]: {
      flexGrow: "1",
      flexBasis: "0",
    },
    // …and an empty full-width item breaks the line after the name. A flex row
    // can only break before an item, so the break is the row's `::before`,
    // moved after the name with `order`, and the cells after the name move with
    // it. Visual order still follows the source. This tests the selection cell
    // from the row, because a `:has()` cannot nest inside another `:has()`.
    [`& > tbody > tr:has(> ${FIRST_SHOWN}[data-stack="select"], > ${FIRST_SHOWN} > ${PICK_CONTROL})::before`]:
      {
        content: '""',
        flexBasis: "100%",
        order: "1",
      },
    [`& > tbody > tr > ${FIRST_SHOWN}${SELECT_CELL} ~ ${SECOND_SHOWN} ~ *`]: { order: "1" },
    // The break is a line of its own, so it would open a second row gap under
    // the name. Pulling the first line's bottom up by one gap closes it, and
    // the row is as tall as one without a selection cell.
    [`& > tbody > tr > ${FIRST_SHOWN}${SELECT_CELL}, & > tbody > tr > ${FIRST_SHOWN}${SELECT_CELL} ~ ${SECOND_SHOWN}`]:
      { marginBlockEnd: "calc(var(--table-pad-y) / -2)" },
    // The row's button at the end, unless it is the only cell that shows.
    [`& tr > ${LAST_SHOWN}:not(${FIRST_SHOWN})`]: { marginInlineStart: "auto" },
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
 * and a cell with `data-label="Total"` shows that label before its value. First
 * and last skip a cell hidden with Tailwind's `hidden` class or the `hidden`
 * attribute, so `hidden @xl:table-cell` on a first or last column is fine. A
 * first cell holding only a checkbox or radio (or marked `data-stack="select"`)
 * stays on the name's line instead of taking one to itself. At
 * 36rem and wider it is an ordinary table. `table-stack-sm`, `-md`, `-lg`,
 * `-xl`, `-2xl` and `-3xl` stack below 24, 28, 32, 36, 42 and 48rem instead:
 * Tailwind's container sizes, so `table-stack-lg` switches where `@lg:` does.
 * Use one of them per table. Works with zebra, hover, every size, and tfoot.
 * The stacked table stays a block even where Tailwind's own `table` utility
 * (`display: table`) is on the page. To hide a stacked table at some widths
 * only, hide its wrapper, not the table.
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
