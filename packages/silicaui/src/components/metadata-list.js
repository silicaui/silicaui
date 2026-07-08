/**
 * MetadataList — a key/value property list (a real `<dl>`; `MetadataItem`
 * renders a `<dt>`+`<dd>` pair as direct grid children, so the whole list is
 * one two-column CSS Grid — no wrapper divs needed per row).
 *
 * `data-layout="row"` (default): label left, value right-aligned, one row
 * each. `data-layout="stack"`: label above value, single column — for narrow
 * cards/sidebars.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function metadataList(prefix = "") {
  const sel = (suffix = "") => `.${prefix}metadata-list${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel()]: {
      display: "grid",
      gridTemplateColumns: "max-content 1fr",
      columnGap: "1rem",
      margin: "0",
      fontSize: "0.875rem",
    },

    [sel("-label")]: {
      margin: "0",
      paddingBlock: "0.5rem",
      fontWeight: "400",
      color: muted(65),
      borderBottom: "1px solid var(--color-base-200)",
    },
    [sel("-value")]: {
      margin: "0",
      paddingBlock: "0.5rem",
      textAlign: "end",
      minWidth: "0",
      overflowWrap: "break-word",
      color: "var(--color-base-content)",
      borderBottom: "1px solid var(--color-base-200)",
    },
    [`${sel()} dt:last-of-type`]: { borderBottom: "0" },
    [`${sel()} dd:last-of-type`]: { borderBottom: "0" },

    // Stacked: single column, label above value, tighter row.
    [`${sel()}[data-layout="stack"]`]: {
      gridTemplateColumns: "1fr",
      rowGap: "0",
    },
    [`${sel()}[data-layout="stack"] ${sel("-label")}`]: {
      paddingBlockEnd: "0.1rem",
      fontSize: "0.75rem",
      fontWeight: "600",
      borderBottom: "0",
    },
    [`${sel()}[data-layout="stack"] ${sel("-value")}`]: {
      textAlign: "start",
      paddingBlockStart: "0",
    },
  };
}
