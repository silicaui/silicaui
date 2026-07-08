# @wizeworks/silicaui-table

Silica UI's `<DataTable>` — [TanStack Table](https://tanstack.com/table) wrapped
in the Silica table CSS. Sorting, row selection, and pagination as simple
boolean/number props over TanStack's typed column-def API.

[![Website](https://img.shields.io/badge/website-silicaui.com-8b5cf6?style=flat-square)](https://silicaui.com)
[![npm version](https://img.shields.io/npm/v/@wizeworks/silicaui-table.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-table)
[![npm downloads](https://img.shields.io/npm/dm/@wizeworks/silicaui-table.svg?style=flat-square)](https://www.npmjs.com/package/@wizeworks/silicaui-table)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@wizeworks/silicaui-table?style=flat-square)](https://bundlephobia.com/package/@wizeworks/silicaui-table)
[![license](https://img.shields.io/npm/l/@wizeworks/silicaui-table.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add @wizeworks/silicaui-table @wizeworks/silicaui-react
pnpm add -D @wizeworks/silicaui tailwindcss
```

## Usage

```tsx
import { DataTable, createColumnHelper } from "@wizeworks/silicaui-table";

interface Row {
  name: string;
  status: "active" | "invited";
}

const columns = [
  createColumnHelper<Row>().accessor("name", { header: "Name" }),
  createColumnHelper<Row>().accessor("status", { header: "Status" }),
];

<DataTable data={rows} columns={columns} sortable selectable pagination={10} zebra />
```

## `<DataTable>` props

| Prop | Type | Default |
| --- | --- | --- |
| `data` | `TData[]` — row data | — |
| `columns` | `DataTableColumn<TData>[]` — TanStack `accessorKey`/`header`/`cell` shape | — |
| `sortable` | `boolean` — click a header to cycle asc → desc → none | `true` |
| `selectable` | `boolean` — adds a leading row-selection checkbox column | `false` |
| `pagination` | `boolean \| number` — a number sets the page size, `true` uses 10, `false` shows everything | `false` |
| `zebra` | `boolean` — zebra striping | `false` |
| `hover` | `boolean` — row hover highlight | `true` |
| `stickyHeader` | `boolean` — sticky header while the body scrolls | `false` |

Also re-exports `createColumnHelper` and the `ColumnDef`/`CellContext`/`Row`
types from `@tanstack/react-table`, so you can build typed columns without a
direct TanStack install.

## Links

- [silicaui.com](https://silicaui.com) — website & docs

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`@wizeworks/silicaui-react`](https://www.npmjs.com/package/@wizeworks/silicaui-react) — the component layer this package extends
