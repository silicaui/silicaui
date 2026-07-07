# silicaui-table

Silica UI's `<DataTable>` — [TanStack Table](https://tanstack.com/table) wrapped
in the Silica table CSS. Sorting, row selection, and pagination as simple
boolean/number props over TanStack's typed column-def API.

[![npm version](https://img.shields.io/npm/v/silicaui-table.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-table)
[![npm downloads](https://img.shields.io/npm/dm/silicaui-table.svg?style=flat-square)](https://www.npmjs.com/package/silicaui-table)
[![bundle size](https://img.shields.io/bundlephobia/minzip/silicaui-table?style=flat-square)](https://bundlephobia.com/package/silicaui-table)
[![license](https://img.shields.io/npm/l/silicaui-table.svg?style=flat-square)](https://github.com/silicaui/silicaui/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/silicaui/silicaui/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/silicaui/silicaui/actions/workflows/ci.yml)

## Install

```bash
pnpm add silicaui-table silicaui-react
pnpm add -D silicaui tailwindcss
```

## Usage

```tsx
import { DataTable, createColumnHelper } from "silicaui-table";

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

- [GitHub repo](https://github.com/silicaui/silicaui)
- [Issues](https://github.com/silicaui/silicaui/issues)
- [`silicaui-react`](https://www.npmjs.com/package/silicaui-react) — the component layer this package extends
