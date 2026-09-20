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
  RowData,
  SortingState,
  RowSelectionState,
  PaginationState,
} from "@tanstack/react-table";
import { cx, useSilicaClass } from "@wizeworks/silicaui-react";
import type { SilicaColor, SilicaSize } from "@wizeworks/silicaui-react";

/** A TanStack column definition, re-exported so consumers type columns without a direct import. */
export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>;

/**
 * How a column's cells and its header line up.
 *
 * Set it through TanStack's own per-column `meta`, which is the designed
 * extension point:
 *
 * ```ts
 * { accessorKey: "teu", header: "TEU", meta: { align: "right" } }
 * ```
 *
 * It moves the HEADER as well as the cells, which is the whole point: a numeric
 * column whose figures are right-aligned under a left-aligned label reads as two
 * columns. A consumer cannot do this themselves - they supply a cell renderer,
 * and never touch the `<th>`, the `<td>` or the sort button inside them.
 */
export type DataTableAlign = "left" | "center" | "right";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: DataTableAlign;
  }
}

function alignOf<TData>(column: { columnDef: { meta?: { align?: DataTableAlign } } }): DataTableAlign | undefined {
  const a = column.columnDef.meta?.align;
  return a === "right" || a === "center" ? a : undefined;
}

export interface DataTableProps<TData> {
  /** Row data. */
  data: TData[];
  /** Column definitions (`accessorKey` / `header` / `cell`, TanStack shape). */
  columns: DataTableColumn<TData>[];
  /**
   * Column sorting. Default `true`.
   *
   * Clicking a header cycles through both directions and back to unsorted, and
   * **which direction comes first depends on the column's type**: a numeric
   * column starts DESCENDING and a text column starts ASCENDING. That is not an
   * accident of the engine, it is what a person means by the click — pressing
   * "Delay" on a fleet list means *show me the worst*, and pressing "Vessel"
   * means *start at A*.
   *
   * The header carries `aria-sort`, so the current direction is announced and is
   * the honest thing to assert against. (This comment used to say the cycle was
   * always asc first, which the component has never done — found by P07,
   * docs/personas/issues/088.)
   */
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
  /**
   * What makes a row THAT row, across a data change.
   *
   * Selection is remembered by this key. Leave it out and rows with an `id`
   * field are keyed by it; rows without one fall back to their position in the
   * array, which is all a table can do when nothing identifies a row.
   *
   * Position is not identity on a screen that refreshes itself. A fleet feed
   * that drops a berthed vessel shifts every row after it, and a selection held
   * by position then points at a different ship without saying so.
   */
  getRowId?: (row: TData, index: number) => string;
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
 * Ships in the optional `@wizeworks/silicaui-table` package so the core React library stays
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
  getRowId,
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

  // Rows with an `id` are identified by it unless the caller says otherwise.
  // Checked against the WHOLE dataset rather than the first row, because a
  // half-identified dataset would key some rows by id and some by position,
  // which is worse than either.
  const rowId = React.useMemo(() => {
    if (getRowId) return getRowId;
    const allIdentified =
      data.length > 0 &&
      data.every((row) => {
        const id = (row as { id?: unknown }).id;
        return typeof id === "string" || typeof id === "number";
      });
    if (!allIdentified) return undefined;
    return (row: TData) => String((row as { id: string | number }).id);
  }, [data, getRowId]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    ...(rowId ? { getRowId: rowId } : {}),
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
    // `data` is in here deliberately. Without it the caller keeps whatever rows
    // it was handed the last time the SELECTION changed -- so after a refresh it
    // is holding objects that are no longer in the table, and it has not been
    // told. The selection key can survive a data change; the row behind it
    // cannot be assumed to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, selectable, data]);

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
      // Skeleton rows are a SIGHTED signal. Without `aria-busy` a screen-reader
      // user hears the row count change and nothing else — the table quietly
      // swaps real vessels for placeholders and says so to nobody. Found by P07
      // act 3 (docs/personas/issues/088).
      aria-busy={loading || undefined}
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
                      data-align={alignOf(header.column)}
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
                    <td key={cell.id} data-align={alignOf(cell.column)}>
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
