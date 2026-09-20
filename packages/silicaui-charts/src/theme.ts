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
 * A CATEGORICAL series palette: N colours a person can tell apart.
 *
 * NOT the semantic roles, which is what this used to be
 * (`primary, secondary, accent, info, success, warning, error`). Two reasons,
 * both found by measuring a real four-line chart — see
 * docs/personas/issues/087.
 *
 * **The roles mean things.** `success` is green because something is good and
 * `error` is red because something is wrong. Handing them to series 5 and 7
 * tells an operations room that the fifth shipping line is fine and the seventh
 * is in trouble — a sentence nobody wrote and nobody can unsee.
 *
 * **And the roles do not spread.** A theme that declares one brand colour has
 * its `secondary`/`accent`/`info` derived from that colour, so four series came
 * out inside a 44-degree arc of a 360-degree wheel, two of them 13 degrees
 * apart. On a wall screen at the end of a dark room that is the same colour
 * twice.
 *
 * So the palette is built instead of borrowed: anchor on the theme's own
 * `primary` — series one still looks like the brand — and walk the hue wheel
 * from there, nudging lightness alternately so neighbours differ in more than
 * hue alone (which is what a person with a colour-vision deficiency reads).
 *
 * A theme whose `primary` is not an `oklch()` value falls back to the old role
 * list, because guessing a hue out of `color-mix()` or a named colour would be
 * worse than a palette that is merely narrow.
 */
/**
 * Six, not eight.
 *
 * Once `success`, `warning` and `error` are off limits (see `RESERVED_ARC`),
 * about 228 of the 360 degrees are left. Eight series across 228 degrees is 28
 * degrees apart -- measurably distinguishable, but only three degrees above the
 * bar, which is no margin at all for a theme whose brand colour sits somewhere
 * else. Six is 38 degrees apart.
 *
 * The seventh series repeats the first, and that is the better failure: a
 * repeated colour is obviously wrong, while two series 28 degrees apart are
 * quietly confusable, which is the exact defect this palette was built to fix
 * (issue 087). A chart with seven categories needs a different design, not a
 * seventh colour.
 */
const SERIES_COUNT = 6;

function parseOklch(value: string): { L: number; C: number; h: number } | null {
  const open = value.indexOf("(");
  const close = value.lastIndexOf(")");
  if (!value.trim().startsWith("oklch") || open < 0 || close < open) return null;
  const parts = value
    .slice(open + 1, close)
    .replace(/%/g, " ")
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  const [L, C, h] = parts;
  if (L === undefined || C === undefined || h === undefined) return null;
  if (Number.isNaN(L) || Number.isNaN(C) || Number.isNaN(h)) return null;
  return { L, C, h };
}

/**
 * How wide a berth to give `success`, `warning` and `error`, in degrees either
 * side of each.
 *
 * A categorical series is a NAME, not a judgement. Walking the whole hue wheel
 * for eight distinguishable colours necessarily walks through the reds and the
 * ambers, and a shipping line painted two degrees from the theme's own "this is
 * critical" red is saying something nobody wrote. Found on the Kaiho dashboard,
 * where colour is supposed to mean exactly one thing: how late a ship is.
 * (P07, docs/personas/issues/094.)
 */
const RESERVED_ARC = 22;

/** Shortest distance between two hue angles, in degrees. */
function hueGap(a: number, b: number): number {
  const d = Math.abs(((a % 360) + 360) % 360 - (((b % 360) + 360) % 360));
  return Math.min(d, 360 - d);
}

/**
 * Hue angles for the series, evenly spread over the part of the wheel that is
 * not already spoken for.
 *
 * The reserved hues come from the THEME, not from a constant: a theme is free to
 * make its `error` orange, and then orange is what has to be avoided.
 */
function spreadHues(startHue: number, reserved: number[], count: number): number[] {
  const free: number[] = [];
  for (let h = 0; h < 360; h++) {
    if (reserved.every((r) => hueGap(h, r) > RESERVED_ARC)) free.push(h);
  }
  // Every hue reserved (a theme with roles all over the wheel): fall back to an
  // even spread rather than returning nothing.
  if (free.length < count) {
    return Array.from({ length: count }, (_, i) => (startHue + (i * 360) / count) % 360);
  }
  // Start walking from wherever the brand colour sits, so series two follows
  // series one round the wheel rather than jumping to an arbitrary origin.
  let from = 0;
  let best = 999;
  for (let i = 0; i < free.length; i++) {
    const g = hueGap(free[i]!, startHue);
    if (g < best) {
      best = g;
      from = i;
    }
  }
  const stride = free.length / count;
  return Array.from({ length: count }, (_, i) => free[(from + Math.round(i * stride)) % free.length]!);
}

function categoricalPalette(primary: string, reservedHues: number[]): string[] | null {
  const base = parseOklch(primary);
  if (!base) return null;
  // Keep the theme's own weight: a dark theme's primary is light and a light
  // theme's is dark, and the series have to sit on that theme's surface.
  const L = Math.min(92, Math.max(38, base.L));
  const C = Math.max(0.08, Math.min(0.2, base.C));
  const hues = spreadHues(base.h, reservedHues, SERIES_COUNT);
  return hues.map((h, i) => {
    if (i === 0) return primary;
    // Alternate the lightness a little, so adjacent series differ on a second
    // axis as well as hue.
    const l = Math.min(94, Math.max(34, L + (i % 2 === 0 ? -6 : 6)));
    return `oklch(${Math.round(l * 10) / 10}% ${Math.round(C * 1000) / 1000} ${Math.round(h)})`;
  });
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

  const primary = readVar(cs, "--color-primary", "");
  // What colour already MEANS in this theme, so the series can stay off it.
  const reservedHues = ["--color-success", "--color-warning", "--color-error"]
    .map((n) => parseOklch(readVar(cs, n, "")))
    .filter((c): c is { L: number; C: number; h: number } => c !== null)
    .map((c) => c.h);
  const palette =
    categoricalPalette(primary, reservedHues) ??
    // Fallback, for a theme whose primary is not an `oklch()` value.
    ["--color-primary", "--color-secondary", "--color-accent", "--color-info", "--color-success", "--color-warning", "--color-error"]
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
      // Keep the tooltip inside the chart's own box.
      //
      // ECharts places it beside the cursor and lets it run off the edge. On a
      // 278px-wide chart on a phone that clipped the SERIES NAMES off the left --
      // "Kaiho Line" read as "o Line", "Pacific Bridge" as "c Bridge" -- which is
      // the one thing the tooltip exists to say. Measured on a 360px screen
      // (P07 act 9). A tooltip that leaves its container is never what anyone
      // wanted, so this is a default rather than an option.
      confine: true,
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
