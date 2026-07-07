import * as React from "react";
import type { EChartsOption } from "echarts";
import { Chart } from "./chart";
import type { ChartProps } from "./chart";

export interface SparklineProps extends Omit<ChartProps, "option"> {
  /** The series values. */
  data: number[];
  /** `"line"` (default) or `"bar"`. */
  type?: "line" | "bar";
  /** Fill under a line sparkline. */
  area?: boolean;
  /** Series color. Defaults to the Silica primary via the theme palette. */
  color?: string;
  /** Show a tooltip on hover. Default `false` — sparklines are glanceable. */
  tooltip?: boolean;
  /** Optional category labels (used only in the tooltip). */
  labels?: (string | number)[];
}

/**
 * A compact, axis-less trend line/bar for inline metrics (KPI cards, table
 * cells). It builds the ECharts option for you and renders through {@link Chart},
 * so it inherits Silica theming and container-resize behavior.
 */
export const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  function Sparkline(
    { data, type = "line", area = false, color, tooltip = false, labels, style, ...rest },
    ref,
  ) {
    const option = React.useMemo<EChartsOption>(
      () => ({
        grid: { left: 1, right: 1, top: 3, bottom: 3 },
        xAxis: {
          type: "category",
          show: false,
          boundaryGap: type === "bar",
          data: labels ?? data.map((_, i) => i),
        },
        yAxis: { type: "value", show: false, scale: true },
        tooltip: tooltip
          ? { trigger: "axis", axisPointer: { type: "line" } }
          : undefined,
        series: [
          {
            type,
            data,
            symbol: "none",
            smooth: type === "line",
            lineStyle: { width: 2 },
            areaStyle: area && type === "line" ? { opacity: 0.18 } : undefined,
            itemStyle: color ? { color } : undefined,
            barCategoryGap: type === "bar" ? "30%" : undefined,
          } as never,
        ],
      }),
      [data, type, area, color, tooltip, labels],
    );

    return (
      <Chart ref={ref} option={option} style={{ height: "3rem", ...style }} {...rest} />
    );
  },
);
