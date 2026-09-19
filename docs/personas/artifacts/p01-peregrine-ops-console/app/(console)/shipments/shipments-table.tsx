"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  Table,
  Text,
} from "@wizeworks/silicaui-react";
import {
  STATUS_TONE,
  formatUsd,
  type Shipment,
} from "../../data/shipments";
import { NewShipmentDialog } from "./new-shipment-dialog";

type SortKey = "ref" | "consignee" | "route" | "status" | "valueCents" | "etaIso";

/**
 * Column order is a phone decision before it is a desktop one. At 360px the
 * table is 858px wide and only the first column and a half are on screen at
 * rest, so whatever sits in position two is what an operator actually reads.
 * Status sits there: `PFR-2026-0420` on its own answers nothing.
 *
 * `phoneHidden` drops the two columns a status glance does not need. They come
 * back at `sm` and are never removed from the DOM order, so the sort controls
 * and the `<td>` count stay in step with the header.
 */
const COLUMNS: {
  key: SortKey;
  label: string;
  /** Money and dates are compared down a column, so they sit on the right. */
  numeric?: boolean;
  /** Hidden below `sm`; still sorted, still present above it. */
  phoneHidden?: boolean;
}[] = [
  { key: "ref", label: "Reference" },
  { key: "status", label: "Status" },
  { key: "consignee", label: "Consignee" },
  { key: "route", label: "Route", phoneHidden: true },
  { key: "valueCents", label: "Declared value", numeric: true, phoneHidden: true },
  { key: "etaIso", label: "ETA", numeric: true },
];

/** One place decides a column's responsive class, so `th` and `td` cannot drift. */
const colClass = (c: (typeof COLUMNS)[number], extra?: string) =>
  [c.phoneHidden ? "hidden sm:table-cell" : null, c.numeric ? "text-end" : null, extra]
    .filter(Boolean)
    .join(" ") || undefined;

const SortArrow = ({ dir }: { dir: "asc" | "desc" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5 shrink-0"
    aria-hidden="true"
  >
    {dir === "asc" ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
  </svg>
);

const BoxIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8">
    <path d="M21 8 12 3 3 8v8l9 5 9-5Z" strokeLinejoin="round" />
    <path d="M3 8l9 5 9-5" strokeLinejoin="round" />
  </svg>
);

function sortValue(s: Shipment, key: SortKey): string | number {
  if (key === "route") return `${s.origin} → ${s.destination}`;
  if (key === "valueCents") return s.valueCents;
  return s[key];
}

export function ShipmentsTable() {
  const [rows, setRows] = useState<Shipment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [booked, setBooked] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "etaIso",
    dir: "asc",
  });

  useEffect(() => {
    let live = true;
    fetch("/api/shipments")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: Shipment[]) => live && setRows(data))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    const matched = q
      ? rows.filter((s) =>
          [s.ref, s.consignee, s.origin, s.destination, s.status]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : rows;
    return [...matched].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : // `localeCompare` and not `<`: the consignee list carries ü, ö, ī
            // and ķ, and codepoint order puts every one of them after "Z".
            String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "valueCents" ? "desc" : "asc" },
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Filter by reference, consignee, route or status"
          aria-label="Filter shipments"
          className="w-full sm:w-96"
        />
        <div className="flex items-center gap-3">
          <Text size="sm">
            {rows === null
              ? "Loading…"
              : `${visible.length} of ${rows.length} shipments`}
          </Text>
          <NewShipmentDialog onCreated={setBooked} />
        </div>
      </div>

      {/* The booking confirmation. `role="status"` rather than `role="alert"`:
          this is good news arriving after an action she took, so it is announced
          politely instead of interrupting whatever is being read. */}
      {booked ? (
        <Alert color="success" role="status">
          {booked} is booked. It will appear in the list on the next refresh.
        </Alert>
      ) : null}

      {failed ? (
        <EmptyState
          icon={BoxIcon}
          title="The shipment list did not load"
          description="The console could not reach the operations API. Nothing has been lost — the list is read-only."
          actions={
            <Button color="primary" onClick={() => location.reload()}>
              Try again
            </Button>
          }
          className="rounded-box border border-base-300"
        />
      ) : rows === null ? (
        /* Loading. A skeleton per row, at the real row count, so the table does
           not jump when the data lands. */
        <Table zebra className="w-full">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className={colClass(c)}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, i) => (
              <tr key={i}>
                {COLUMNS.map((c) => (
                  <td key={c.key} className={colClass(c)}>
                    <Skeleton shape="text" className="w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BoxIcon}
          title={`Nothing matches “${query}”`}
          description="No shipment has that reference, consignee, route or status. Check the spelling, or clear the filter to see all 14."
          actions={
            <Button variant="outline" color="neutral" onClick={() => setQuery("")}>
              Clear the filter
            </Button>
          }
          className="rounded-box border border-base-300"
        />
      ) : (
        <Table zebra hover className="w-full">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={colClass(c)}
                    aria-sort={
                      active
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {/* A real button, so the whole column is reachable by keyboard
                        and announces its own sort state. */}
                    <Button
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      onClick={() => toggleSort(c.key)}
                      className={c.numeric ? "-me-2 ms-auto" : "-ms-2"}
                    >
                      {c.label}
                      {active ? <SortArrow dir={sort.dir} /> : null}
                    </Button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.ref}>
                <td className="whitespace-nowrap font-mono text-sm">
                  <Link href={`/shipments/${s.ref}`} className="link">
                    {s.ref}
                  </Link>
                </td>
                <td>
                  <Badge color={STATUS_TONE[s.status]} size="sm">
                    {s.status}
                  </Badge>
                </td>
                {/* The 58-character consignee lives here. It wraps rather than
                    truncating: an operator reading a customs hold at 22:00 needs
                    the whole legal name, and an ellipsis on the one row that
                    matters is the row they cannot act on. The floor drops on a
                    phone so the name narrows and wraps instead of pushing the
                    columns beside it off the screen. */}
                <td className="min-w-32 max-w-80 sm:min-w-48">{s.consignee}</td>
                <td className="hidden whitespace-nowrap sm:table-cell">
                  {s.origin} → {s.destination}
                </td>
                <td className="hidden whitespace-nowrap text-end tabular-nums sm:table-cell">
                  {formatUsd(s.valueCents)}
                </td>
                <td className="whitespace-nowrap text-end tabular-nums">
                  {s.etaIso}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
