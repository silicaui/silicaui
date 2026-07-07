import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  RowSelectionState,
  PaginationState,
} from "@tanstack/react-table";
import { cx, useSilicaClass } from "silicaui-react";
import type { SilicaColor, SilicaSize } from "silicaui-react";

/** A TanStack column definition, re-exported so consumers type columns without a direct import. */
export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>;

export interface DataTableProps<TData> {
  /** Row data. */
  data: TData[];
  /** Column definitions (`accessorKey` / `header` / `cell`, TanStack shape). */
  columns: DataTableColumn<TData>[];
  /** Column sorting (click header to cycle asc → desc → none). Default `true`. */
  sortable?: boolean;
  /** Row-selection checkboxes (adds a leading column). Default `false`. */
  selectable?: boolean;
  /**
   * Client-side pagination: a number sets the page size, `true` uses 10, `false`
   * shows everything. Default `false`.
   */
  pagination?: boolean | number;
  /** Zebra striping. Default `false`. */
  zebra?: boolean;
  /** Row hover highlight. Default `true`. */
  hover?: boolean;
  /** Sticky header while the body scrolls. Default `false`. */
  stickyHeader?: boolean;
  /** Cell density (maps to `.table-<size>`). Default `"md"`. */
  size?: SilicaSize;
  /** Accent color for sort hover + selected-row tint. */
  color?: SilicaColor;
  /** Rendered in place of the body when there are zero rows. */
  emptyState?: React.ReactNode;
  /** Show placeholder skeleton rows instead of data. */
  loading?: boolean;
  /** Number of skeleton rows to show while `loading`. Default `5`. */
  loadingRows?: number;
  /** Fired when a body row is clicked (whole-row affordance). */
  onRowClick?: (row: TData) => void;
  /** Fired with the selected originals whenever selection changes. */
  onSelectionChange?: (rows: TData[]) => void;
  className?: string;
}

function SortIcon() {
  return (
    <span aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path data-part="up" d="M8 2.5l3.5 4h-7z" />
        <path data-part="down" d="M8 13.5l-3.5-4h7z" />
      </svg>
    </span>
  );
}

/**
 * A data grid over [TanStack Table](https://tanstack.com/table) dressed in the
 * Silica `.table` CSS. The heavy sorting/selection/pagination logic is TanStack's
 * (headless); everything visual — sort carets, selection column, selected-row
 * tint, sticky header, pagination toolbar, empty + loading states — is Silica.
 *
 * Ships in the optional `silicaui-table` package so the core React library stays
 * dependency-free.
 */
export function DataTable<TData>({
  data,
  columns,
  sortable = true,
  selectable = false,
  pagination = false,
  zebra = false,
  hover = true,
  stickyHeader = false,
  size = "md",
  color,
  emptyState,
  loading = false,
  loadingRows = 5,
  onRowClick,
  onSelectionChange,
  className,
}: DataTableProps<TData>) {
  const sc = useSilicaClass();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const pageSize =
    typeof pagination === "number" ? pagination : pagination ? 10 : undefined;
  const paginationEnabled = pageSize != null;
  const [paginationState, setPaginationState] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? 10,
  });

  // Prepend a selection column when selectable.
  const tableColumns = React.useMemo<DataTableColumn<TData>[]>(() => {
    if (!selectable) return columns;
    const selectionColumn: ColumnDef<TData> = {
      id: "__select__",
      size: 44,
      enableSorting: false,
      header: ({ table }) => (
        <input
          type="checkbox"
          className={cx(sc("checkbox"))}
          checked={table.getIsAllRowsSelected()}
          ref={(el) => {
            if (el)
              el.indeterminate =
                table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className={cx(sc("checkbox"))}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
    };
    return [selectionColumn, ...columns];
  }, [selectable, columns, sc]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      ...(sortable ? { sorting } : {}),
      ...(selectable ? { rowSelection } : {}),
      ...(paginationEnabled ? { pagination: paginationState } : {}),
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPaginationState,
    enableSorting: sortable,
    enableRowSelection: selectable,
    getCoreRowModel: getCoreRowModel(),
    ...(sortable ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(paginationEnabled ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  });

  // Surface selection changes to the caller.
  const selectionChangeRef = React.useRef(onSelectionChange);
  selectionChangeRef.current = onSelectionChange;
  React.useEffect(() => {
    if (!selectable) return;
    selectionChangeRef.current?.(
      table.getSelectedRowModel().rows.map((r) => r.original),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, selectable]);

  const rows = table.getRowModel().rows;
  const leafColumnCount = table.getVisibleLeafColumns().length;

  const total = data.length;
  const { pageIndex, pageSize: activePageSize } = table.getState().pagination;
  const pageStart = total === 0 ? 0 : pageIndex * activePageSize + 1;
  const pageEnd = Math.min(total, (pageIndex + 1) * activePageSize);
  const pageCount = table.getPageCount();

  return (
    <div
      className={cx(
        sc("data-table"),
        color && sc(`data-table-${color}`),
        stickyHeader && sc("data-table-sticky"),
        className,
      )}
    >
      <div className={cx(sc("data-table-scroll"))}>
        <table
          className={cx(
            sc("table"),
            zebra && sc("table-zebra"),
            hover && sc("table-hover"),
            sc(`table-${size}`),
          )}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={
                        header.getSize() ? { width: header.getSize() } : undefined
                      }
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={cx(sc("data-table-sort"))}
                          data-sort={sorted || undefined}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <span className={cx(sc("data-table-sort-icon"))}>
                            <SortIcon />
                          </span>
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: loadingRows }).map((_, r) => (
                <tr key={`skeleton-${r}`}>
                  {Array.from({ length: leafColumnCount }).map((__, c) => (
                    <td key={`skeleton-${r}-${c}`}>
                      <span className={cx(sc("skeleton"), sc("data-table-skeleton"))} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={leafColumnCount} className={cx(sc("data-table-empty"))}>
                  {emptyState ?? "No data"}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-selected={row.getIsSelected() || undefined}
                  className={cx(onRowClick && sc("data-table-row-clickable"))}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginationEnabled && !loading && rows.length > 0 && (
        <div className={cx(sc("data-table-pagination"))}>
          <span className={cx(sc("data-table-pageinfo"))}>
            {pageStart}–{pageEnd} of {total}
          </span>
          <div className={cx(sc("data-table-pager"))}>
            <button
              type="button"
              className={cx(sc("btn"), sc("btn-sm"), sc("btn-ghost"))}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </button>
            <span>
              Page {pageIndex + 1} of {Math.max(pageCount, 1)}
            </span>
            <button
              type="button"
              className={cx(sc("btn"), sc("btn-sm"), sc("btn-ghost"))}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
