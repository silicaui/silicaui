# @wizeworks/silicaui-charts

Silica UI charts — [Apache ECharts](https://echarts.apache.org/) wrapped in a
single `<Chart>` component that **auto-themes to your Silica design tokens**.
Full ECharts API, zero manual palette wiring.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-charts.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-charts)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui-charts.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-charts)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wizeworks/silicaui-charts?style=flat-square)](https://bundlephobia.com/package/@wizeworks/silicaui-charts)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-charts.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add @wizeworks/silicaui-charts @wizeworks/silicaui-react
pnpm add -D @wizeworks/silicaui tailwindcss
```

## Usage

```tsx
import { Chart } from "@wizeworks/silicaui-charts";

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

- [silicaui.com](https://silicaui.com) — website & docs

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react) — the component layer this package extends
