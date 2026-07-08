/**
 * Chart container — the box an ECharts canvas/SVG renders into.
 *
 * The actual chart theming is done in JS (the `@wizeworks/silicaui-charts` package reads the
 * live color tokens and hands ECharts a matching theme); this class only owns the
 * container so ECharts has a sized, block-level box to measure. Colorless.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function chart(prefix = "") {
  const sel = (suffix = "") => `.${prefix}chart${suffix}`;

  return {
    [sel()]: {
      display: "block",
      position: "relative",
      width: "100%",
      minHeight: "3rem",
    },
  };
}
