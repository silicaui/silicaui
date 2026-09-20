/**
 * Monthly TEU throughput — four lines, eighteen months.
 *
 * Two months are the reason this chart is in the test:
 *
 *  - **March 2026 is ZERO** for Nordhaven. A port strike; nothing moved. That is
 *    a measurement and it has to be drawn as one — a point sitting on the axis.
 *  - **July 2026 is UNKNOWN** for Pacific Bridge. The feed was down and nobody
 *    counted. `null`, never `0`, and it has to look different from the strike.
 *
 * If a gap and a zero look the same, the chart says a line moved nothing in a
 * month when in truth nobody knows what it moved. That is the whole failure this
 * exercise exists to catch, drawn in pixels.
 *
 * NOT ONE COLOUR IS WRITTEN HERE. The palette comes from the active Silica
 * theme, which is what act 2 is checking.
 */
import { Chart } from "@wizeworks/silicaui-charts";
import type { EChartsOption } from "@wizeworks/silicaui-charts";
import { LINES } from "./data";
import type { MonthPoint } from "./data";

declare global {
  interface Window {
    /** Our own test seam: the live ECharts instance and the data behind it, so
     *  a check reads what was DRAWN rather than what we think we passed. */
    __kaihoChart?: { getOption(): { series: { name: string; data: (number | null)[] }[] } };
    __kaihoThroughput?: MonthPoint[];
  }
}

export function ThroughputChart({ data }: { data: MonthPoint[] }) {
  const months = data.map((d) => d.month);
  if (typeof window !== "undefined") window.__kaihoThroughput = data;

  const series = LINES.map((line) => ({
    name: line,
    type: "line" as const,
    // ECharts draws `null` as a break in the line and `0` as a point on the
    // axis. That difference is the honesty, and it is free — as long as the
    // data never coerces one into the other on the way in.
    data: data.map((d) => d.teu[line]),
    connectNulls: false,
    showSymbol: true,
    symbolSize: 6,
    emphasis: { focus: "series" as const },
  }));

  const option: EChartsOption = {
    // The legend gets its own band at the top, and the plot starts below it. At
    // 360px the four names wrap onto two lines, so the band has to be tall
    // enough for both -- at 36px the second line of the legend sat on top of the
    // y-axis labels.
    // 40px on the right, not 16. The last x-axis label is centred on the last
    // data point, so half of "2026-09" hangs past it -- on the 2560px wall screen
    // it read "2026-0", a month that does not exist.
    grid: { left: 56, right: 40, top: 72, bottom: 28 },
    // A PLAIN legend, which wraps. `type: "scroll"` showed two of the four lines
    // with a 1/3 pager -- on a dashboard whose whole point is comparing four
    // shipping lines, a legend you have to page through is worse than one that
    // takes two rows.
    legend: { top: 0 },
    tooltip: {
      trigger: "axis",
      // Say "not measured" in words. A tooltip that prints nothing for a gap
      // leaves the reader to guess, and the guess is always "zero".
      valueFormatter: (v) => (v === null || v === undefined ? "not measured" : new Intl.NumberFormat("en-GB").format(Number(v))),
    },
    xAxis: { type: "category", data: months, boundaryGap: false },
    // No axis name. The card above this says "Monthly TEU throughput", so a "TEU"
    // label on the axis is the same word twice -- and at 360px it landed on top
    // of the legend.
    yAxis: { type: "value" },
    series,
  };

  return (
    <Chart
      option={option}
      style={{ height: "18rem" }}
      aria-label="Monthly TEU throughput by line"
      onInit={(chart) => {
        window.__kaihoChart = chart as unknown as Window["__kaihoChart"];
      }}
    />
  );
}
