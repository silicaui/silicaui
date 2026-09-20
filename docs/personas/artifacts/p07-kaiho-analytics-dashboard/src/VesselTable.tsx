/**
 * All 800 vessels, sortable.
 *
 * Three columns are the reason this is in the test:
 *
 *  - **Delay** carries NEGATIVE values. A ship arriving early is a real value,
 *    not an error, and it has to sort below "on time" rather than being read as
 *    a big number or dropped.
 *  - **Vessel** carries CJK (`MV 東京丸`) and diacritics (`Königsberg`,
 *    `Navegação`). Sorting those by code point puts every Japanese ship after
 *    every Latin one, which is wrong for a Yokohama operations desk.
 *  - **Vessel** also carries a 43-character name that has to do something
 *    deliberate rather than pushing the other five columns off the screen.
 */
import * as React from "react";
import { DataTable } from "@wizeworks/silicaui-table";
import type { DataTableColumn } from "@wizeworks/silicaui-table";
import { Badge } from "@wizeworks/silicaui-react";
import { delayTone } from "./data";
import type { Vessel } from "./data";

const nf = new Intl.NumberFormat("en-GB");

/**
 * A real collator, not `<`.
 *
 * `"MV 東京丸" < "MV Emerald Strait"` is false by code point, so a default sort
 * files every Japanese vessel after every Latin one. `Intl.Collator` with the
 * operations desk's own locale puts them where a person looks for them, and
 * `numeric` keeps `Berth 2` before `Berth 10`.
 */
const collator = new Intl.Collator(["ja", "en"], { numeric: true, sensitivity: "variant" });

function delayLabel(hours: number): string {
  if (hours === 0) return "on time";
  if (hours < 0) return `${Math.abs(hours)}h early`;
  return `${hours}h late`;
}

const columns: DataTableColumn<Vessel>[] = [
  {
    accessorKey: "name",
    header: "Vessel",
    sortingFn: (a, b) => collator.compare(a.original.name, b.original.name),
    cell: (c) => (
      // Truncate, not wrap: every row has to stay one line tall or 800 rows of
      // mixed name lengths turn the table into a ragged wall. The full name is
      // on the title, so nothing is lost.
      <span className="block max-w-[20rem] truncate" title={c.row.original.name}>
        {c.row.original.name}
      </span>
    ),
  },
  { accessorKey: "line", header: "Line" },
  {
    accessorKey: "teu",
    header: "TEU",
    // `meta.align` moves the HEADER with the figures. Right-aligned numbers under
    // a left-aligned label read as two columns.
    meta: { align: "right" },
    cell: (c) => <span className="tabular-nums">{nf.format(c.row.original.teu)}</span>,
  },
  {
    accessorKey: "utilisation",
    header: "Utilisation",
    meta: { align: "right" },
    cell: (c) => <span className="tabular-nums">{c.row.original.utilisation.toFixed(2)}%</span>,
  },
  { accessorKey: "lastPort", header: "Last port" },
  {
    accessorKey: "delayHours",
    header: "Delay",
    cell: (c) => (
      <Badge color={delayTone(c.row.original.delayHours)} size="sm">
        {delayLabel(c.row.original.delayHours)}
      </Badge>
    ),
  },
];

export function VesselTable({
  rows,
  loading = false,
}: {
  rows: Vessel[];
  loading?: boolean;
}) {
  if (typeof window !== "undefined") window.__kaihoFleet = rows;
  return (
    <DataTable
      data={rows}
      columns={columns}
      sortable
      selectable
      zebra
      stickyHeader
      size="sm"
      pagination={25}
      loading={loading}
      loadingRows={8}
      emptyState={
        <div className="flex flex-col gap-1 p-6 text-base text-base-content">
          <span className="font-semibold">No vessels match that filter.</span>
          <span>Clear the line filter to see the whole fleet again.</span>
        </div>
      }
      onSelectionChange={(sel) => {
        window.__kaihoSelected = sel;
      }}
    />
  );
}

declare global {
  interface Window {
    __kaihoFleet?: Vessel[];
    __kaihoSelected?: Vessel[];
  }
}
