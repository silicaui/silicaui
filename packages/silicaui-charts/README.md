# silicaui-charts

Silica UI charts — [Apache ECharts](https://echarts.apache.org/) wrapped in a
single `<Chart>` component that **auto-themes to your Silica design tokens**.
Full ECharts API, zero manual palette wiring.

[![npm version](https://img.shields.io/npm/v/silicaui-charts.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-charts)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-charts.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-charts)
[![bundle size](https://img.shields.io/bundlephobia/minzip/silicaui-charts?style=flat-square)](https://bundlephobia.com/package/silicaui-charts)
[![license](https://img.shields.io/npm/l/silicaui-charts.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add silicaui-charts silicaui-react
pnpm add -D silicaui tailwindcss
```

## Usage

```tsx
import { Chart } from "silicaui-charts";

<Chart
  style={{ height: 320 }}
  option={{
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [120, 200, 150, 80, 70] }],
  }}
/>
```

The chart re-reads Silica's color tokens — and re-inits, since ECharts themes
are fixed at `init` — whenever the ambient theme changes (a `data-theme` flip
or an OS light/dark switch), so it tracks the rest of your UI automatically.
It also resizes with its container via a `ResizeObserver`. Give the container
a height; ECharts can't measure a zero-height box.

## `<Chart>` props

| Prop | Type | Default |
| --- | --- | --- |
| `option` | `EChartsOption` — the full ECharts option (series, axes, tooltip, legend, …) | — |
| `notMerge` | `boolean` — replace the whole option instead of merging on update | `true` |
| `loading` | `boolean` — toggle ECharts' built-in loading spinner | `false` |
| `renderer` | `"canvas" \| "svg"` | `"canvas"` |
| `onInit` | `(chart: EChartsInstance) => void` — called after each (re-)init | — |

Also ships `<Sparkline>` for compact inline trend charts, and re-exports
`EChartsOption` so you can type `option` without a direct `echarts` import.

## Links

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`silicaui-react`](https://www.npmjs.com/package/silicaui-react) — the component layer this package extends
