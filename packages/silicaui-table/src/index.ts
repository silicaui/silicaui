export { DataTable } from "./data-table";
export type { DataTableProps, DataTableColumn } from "./data-table";

// Re-export the common TanStack column-def helpers so consumers can build typed
// columns (accessors, cell renderers) without importing @tanstack directly.
export { createColumnHelper } from "@tanstack/react-table";
export type { ColumnDef, CellContext, Row } from "@tanstack/react-table";
