/**
 * The nine vessels the duty officer is watching tonight.
 *
 * The order is the whole point. It is not a sort — it is a judgement about what
 * matters most right now, made by the person on watch, and it has to still be
 * there when the next person opens the dashboard. So the order is persisted,
 * and it has to be reorderable by someone who is not holding a mouse: the wall
 * screen in the operations room is driven from a keyboard on a shelf.
 */
import * as React from "react";
import { SortableList } from "@wizeworks/silicaui-dnd";
import { Badge } from "@wizeworks/silicaui-react";
import { delayTone } from "./data";
import type { Vessel } from "./data";

const KEY = "kaiho:watchlist-order";

function delayLabel(hours: number): string {
  if (hours === 0) return "on time";
  if (hours < 0) return `${Math.abs(hours)}h early`;
  return `${hours}h late`;
}

/**
 * Read the saved order and apply it to the vessels we actually have.
 *
 * Deliberately tolerant in one direction only: an id in storage that is no
 * longer on the watchlist is dropped, and a vessel that is on the watchlist but
 * not in storage is kept at the end. A saved order must never be able to make a
 * vessel disappear from a list whose purpose is that nothing is forgotten.
 */
function applySavedOrder(vessels: Vessel[]): Vessel[] {
  let saved: string[] = [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) saved = parsed.filter((v): v is string => typeof v === "string");
    }
  } catch {
    // Private mode, or somebody put something else under this key. Neither is a
    // reason to show the wrong watchlist.
    return vessels;
  }
  if (saved.length === 0) return vessels;
  const byId = new Map(vessels.map((v) => [v.id, v]));
  const out: Vessel[] = [];
  for (const id of saved) {
    const v = byId.get(id);
    if (v) {
      out.push(v);
      byId.delete(id);
    }
  }
  return [...out, ...byId.values()];
}

export function Watchlist({ vessels }: { vessels: Vessel[] }) {
  const [order, setOrder] = React.useState<Vessel[]>(() => vessels);

  // The saved order is read AFTER the first paint, not in the initializer: a
  // lazy `useState` initializer still runs during server render, and there is
  // no `localStorage` there.
  React.useEffect(() => {
    setOrder(applySavedOrder(vessels));
  }, [vessels]);

  const reorder = React.useCallback((next: Vessel[]) => {
    setOrder(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next.map((v) => v.id)));
    } catch {
      /* private mode — the list still reorders, it just will not be remembered */
    }
  }, []);

  if (typeof window !== "undefined") window.__kaihoWatchlist = () => order.map((v) => v.id);

  return (
    <SortableList
      items={order}
      getItemId={(v) => v.id}
      getItemLabel={(v) => v.name}
      onReorder={reorder}
      handle
      renderItem={(v, ctx) => (
        <>
          {/* The row around this is already a styled flex row, so these are its
              CONTENTS and not a second box; and the handle arrives with its own
              class, which is where the grab cursor and the focus ring live. */}
          <span {...ctx.handleProps} aria-label={`Reorder ${v.name}`}>
            <GripIcon />
          </span>
          <span className="min-w-0 flex-1 truncate text-base text-base-content">{v.name}</span>
          <Badge color={delayTone(v.delayHours)} size="sm">
            {delayLabel(v.delayHours)}
          </Badge>
        </>
      )}
    />
  );
}

/** Six dots — the only shape everyone already reads as "drag me". */
function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <circle cx="6" cy="4" r="1.4" />
      <circle cx="10" cy="4" r="1.4" />
      <circle cx="6" cy="8" r="1.4" />
      <circle cx="10" cy="8" r="1.4" />
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="10" cy="12" r="1.4" />
    </svg>
  );
}

declare global {
  interface Window {
    __kaihoWatchlist?: () => string[];
  }
}
