export { Chart } from "./chart";
export type { ChartProps, EChartsInstance } from "./chart";

export { Sparkline } from "./sparkline";
export type { SparklineProps } from "./sparkline";

export { buildSilicaEChartsTheme } from "./theme";

// Re-export ECharts' option type so consumers can type `option` without adding
// a direct import of echarts.
export type { EChartsOption } from "echarts";
