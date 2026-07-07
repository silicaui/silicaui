/**
 * Builds an Apache ECharts theme from the live Silica design tokens.
 *
 * ECharts bakes its theme in at `init()` time and reads plain color strings, not
 * CSS variables — so we resolve the current `--color-*` custom properties off a
 * live element with `getComputedStyle` and hand ECharts concrete values. Because
 * we read from a real element, a prefixed / nested-theme subtree (a client site
 * embedded in the platform shell) yields that subtree's palette, and the
 * `<Chart>` wrapper re-runs this whenever the ambient theme flips light↔dark.
 *
 * The resolved values may be `oklch(…)` / `color-mix(…)` strings; modern canvas
 * and SVG renderers accept those directly.
 */

function readVar(cs: CSSStyleDeclaration, name: string, fallback: string): string {
  const v = cs.getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * @param el - element to read tokens from; defaults to `document.documentElement`.
 * @returns an ECharts theme object (safe to pass to `echarts.registerTheme`).
 */
export function buildSilicaEChartsTheme(
  el?: HTMLElement | null,
): Record<string, unknown> {
  const root =
    el ?? (typeof document !== "undefined" ? document.documentElement : null);

  // No DOM (SSR): a neutral, transparent theme so nothing crashes.
  if (!root || typeof getComputedStyle === "undefined") {
    return { backgroundColor: "transparent" };
  }

  const cs = getComputedStyle(root);
  const base100 = readVar(cs, "--color-base-100", "#ffffff");
  const base300 = readVar(cs, "--color-base-300", "#e5e7eb");
  const content = readVar(cs, "--color-base-content", "#1f2937");

  const palette = [
    "--color-primary",
    "--color-secondary",
    "--color-accent",
    "--color-info",
    "--color-success",
    "--color-warning",
    "--color-error",
  ]
    .map((n) => readVar(cs, n, ""))
    .filter(Boolean);

  // Translucent washes of the text color for axes/gridlines — oklab, never oklch
  // (oklch rotates hue toward 0° when mixing with transparent → tinted grey).
  const faint = (pct: number) =>
    `color-mix(in oklab, ${content} ${pct}%, transparent)`;
  const label = faint(70);
  const axisLine = faint(22);
  const splitLine = faint(9);

  const axis = {
    axisLine: { show: true, lineStyle: { color: axisLine } },
    axisTick: { show: true, lineStyle: { color: axisLine } },
    axisLabel: { color: label },
    splitLine: { show: true, lineStyle: { color: splitLine } },
    splitArea: { show: false },
  };

  return {
    color: palette.length ? palette : undefined,
    backgroundColor: "transparent",
    textStyle: { color: content },
    title: { textStyle: { color: content }, subtextStyle: { color: label } },
    legend: { textStyle: { color: label } },
    tooltip: {
      backgroundColor: base100,
      borderColor: base300,
      borderWidth: 1,
      textStyle: { color: content },
      axisPointer: {
        lineStyle: { color: axisLine },
        crossStyle: { color: axisLine },
        shadowStyle: { color: faint(6) },
      },
    },
    grid: { borderColor: base300, containLabel: true },
    categoryAxis: axis,
    valueAxis: axis,
    logAxis: axis,
    timeAxis: axis,
    line: {
      symbol: "circle",
      symbolSize: 7,
      lineStyle: { width: 2 },
      smooth: false,
    },
    bar: { itemStyle: { borderRadius: [4, 4, 0, 0] } },
    pie: {
      itemStyle: { borderColor: base100, borderWidth: 2 },
      label: { color: content },
    },
    scatter: { symbolSize: 10 },
  };
}
