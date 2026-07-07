import * as React from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { cx, useSilicaClass } from "silicaui-react";
import { buildSilicaEChartsTheme } from "./theme";

/** The live ECharts instance type (whatever `echarts.init` returns). */
export type EChartsInstance = ReturnType<typeof echarts.init>;

export interface ChartProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** The ECharts option (series, axes, tooltip, legend, …) — full ECharts API. */
  option: EChartsOption;
  /** Replace the whole option instead of merging on update. Default `true`. */
  notMerge?: boolean;
  /** Toggle ECharts' built-in loading spinner. */
  loading?: boolean;
  /** Renderer backend. Default `"canvas"`. */
  renderer?: "canvas" | "svg";
  /** Called with the instance right after it's created (and after each re-init). */
  onInit?: (chart: EChartsInstance) => void;
}

/**
 * A thin, fully-featured wrapper over Apache ECharts that auto-themes to the
 * active Silica tokens.
 *
 * ECharts owns all rendering; Silica supplies the palette. The chart re-reads
 * the tokens (and re-inits, since ECharts themes are fixed at `init`) whenever
 * the ambient theme changes — a `data-theme` flip on `<html>` or an OS
 * light/dark switch — so charts track the rest of the UI automatically. It also
 * resizes with its container via a `ResizeObserver`.
 *
 * Give the container a height (defaults to 20rem); ECharts cannot measure a
 * zero-height box.
 */
export const Chart = React.forwardRef<HTMLDivElement, ChartProps>(function Chart(
  {
    option,
    notMerge = true,
    loading = false,
    renderer = "canvas",
    onInit,
    className,
    style,
    ...rest
  },
  forwardedRef,
) {
  const sc = useSilicaClass();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<EChartsInstance | null>(null);
  const onInitRef = React.useRef(onInit);
  onInitRef.current = onInit;

  // A DOM-safe, stable theme name unique to this instance so concurrent charts
  // don't clobber one another's registered theme.
  const themeName = `silica-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Bumped whenever the ambient Silica theme changes → forces a re-init below.
  const [themeTick, setThemeTick] = React.useState(0);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  // Watch for theme changes: attribute flips on <html> + OS scheme changes.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setThemeTick((t) => t + 1);
    const html = document.documentElement;
    const mo = new MutationObserver(bump);
    mo.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", bump);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", bump);
    };
  }, []);

  // Create / recreate the chart instance (re-runs on theme change).
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    echarts.registerTheme(themeName, buildSilicaEChartsTheme(el));
    const chart = echarts.init(el, themeName, { renderer });
    chartRef.current = chart;
    onInitRef.current?.(chart);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [themeName, renderer, themeTick]);

  // Push option updates.
  React.useEffect(() => {
    chartRef.current?.setOption(option, notMerge);
  }, [option, notMerge, themeTick]);

  // Loading overlay.
  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (loading) chart.showLoading();
    else chart.hideLoading();
  }, [loading, themeTick]);

  return (
    <div
      ref={setRefs}
      className={cx(sc("chart"), className)}
      style={{ width: "100%", height: "20rem", ...style }}
      {...rest}
    />
  );
});
