import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/** Parses a `YYYY-MM-DD` string as a LOCAL date, not `new Date(iso)`'s
 *  UTC-midnight parse — the latter shifts a day backward in any timezone
 *  behind UTC once `.getDate()` reads it back in local time (a real bug
 *  caught by the jsdom interaction test, not the structural one). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
}
function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function toISO(d: Date): string {
  const c = startOfDay(d);
  const y = c.getFullYear();
  const m = String(c.getMonth() + 1).padStart(2, "0");
  const day = String(c.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function sameDay(a: Date, b: Date): boolean {
  return toISO(a) === toISO(b);
}

/**
 * `calendar` — the day cells aren't authored (a static tree can't represent
 * arbitrary months), so this behavior BUILDS the 42-cell grid itself into an
 * empty `grid` part on every render (month nav, selection, hover), same
 * "behavior owns its own markup" precedent as `carousel`'s track/dots.
 * `params.mode`: `"single"` (default) | `"range"`. `DatePicker`/
 * `DateRangePicker` are this behavior nested inside a `popover` root — no
 * extra code needed, `ownParts` already stops at nested behavior boundaries.
 */
export const calendar: BehaviorHandler = (root, _opts) => {
  const params = parseParams(root);
  const mode = params.mode === "range" ? "range" : "single";
  const weekStartsOn = typeof params.weekStartsOn === "number" ? params.weekStartsOn : 0;
  const grid = ownParts(root, "grid")[0] as HTMLElement | undefined;
  const title = ownParts(root, "title")[0];
  const prev = ownParts(root, "prev")[0];
  const next = ownParts(root, "next")[0];
  const hidden = root.querySelector('input[type="hidden"]') as HTMLInputElement | null;
  const bag = new DisposeBag();
  if (!grid) return () => bag.dispose();

  const initial = typeof params.defaultValue === "string" ? parseLocalDate(params.defaultValue) : new Date();
  let view = new Date(initial.getFullYear(), initial.getMonth(), 1);
  let selected: Date | null =
    mode === "single" && typeof params.defaultValue === "string" ? startOfDay(parseLocalDate(params.defaultValue)) : null;
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  let hovered: Date | null = null;
  let focused = selected ?? startOfDay(new Date());
  let shouldFocus = false;

  const monthLabel = () => new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(view);

  const cellsFor = (viewDate: Date): Date[] => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const lead = (first.getDay() - weekStartsOn + 7) % 7;
    const start = new Date(first);
    start.setDate(start.getDate() - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const inRange = (d: Date, a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    const lo = a <= b ? a : b;
    const hi = a <= b ? b : a;
    return startOfDay(d) >= startOfDay(lo) && startOfDay(d) <= startOfDay(hi);
  };

  const syncHidden = () => {
    if (!hidden) return;
    if (mode === "single") hidden.value = selected ? toISO(selected) : "";
    else hidden.value = rangeStart ? `${toISO(rangeStart)}/${rangeEnd ? toISO(rangeEnd) : ""}` : "";
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const select = (d: Date) => {
    const day = startOfDay(d);
    if (mode === "single") {
      selected = day;
    } else if (!rangeStart || rangeEnd) {
      rangeStart = day;
      rangeEnd = null;
      hovered = null;
    } else if (day < rangeStart) {
      rangeEnd = rangeStart;
      rangeStart = day;
    } else {
      rangeEnd = day;
    }
    focused = day;
    syncHidden();
    render();
  };

  const shiftMonth = (delta: number) => {
    view = new Date(view.getFullYear(), view.getMonth() + delta, 1);
    render();
  };

  const moveFocus = (days: number) => {
    const d = new Date(focused);
    d.setDate(d.getDate() + days);
    focused = startOfDay(d);
    if (focused.getMonth() !== view.getMonth() || focused.getFullYear() !== view.getFullYear()) {
      view = new Date(focused.getFullYear(), focused.getMonth(), 1);
    }
    shouldFocus = true;
    render();
  };

  function render(): void {
    grid!.innerHTML = "";
    const today = startOfDay(new Date());
    const cells = cellsFor(view);
    const paintA = rangeStart;
    const paintB = mode === "range" && rangeStart && !rangeEnd ? hovered : rangeEnd;
    for (const d of cells) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-date", toISO(d));
      const inMonth = d.getMonth() === view.getMonth();
      btn.toggleAttribute("data-outside", !inMonth);
      btn.toggleAttribute("data-today", sameDay(d, today));
      if (mode === "single") {
        btn.toggleAttribute("data-selected", !!selected && sameDay(d, selected));
      } else {
        btn.toggleAttribute("data-range-start", !!rangeStart && sameDay(d, rangeStart));
        btn.toggleAttribute("data-range-end", !!paintB && sameDay(d, paintB));
        btn.toggleAttribute("data-in-range", inRange(d, paintA, paintB));
      }
      btn.tabIndex = inMonth && sameDay(d, focused) ? 0 : -1;
      btn.textContent = String(d.getDate());
      btn.addEventListener("click", () => select(d));
      btn.addEventListener("mouseenter", () => {
        if (mode === "range" && rangeStart && !rangeEnd) {
          hovered = d;
          render();
        }
      });
      grid!.appendChild(btn);
    }
    if (title) title.textContent = monthLabel();
    if (shouldFocus) {
      shouldFocus = false;
      (grid!.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus();
    }
  }

  if (prev) bag.listen(prev, "click", () => shiftMonth(-1));
  if (next) bag.listen(next, "click", () => shiftMonth(1));
  bag.listen(grid, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-7);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(7);
        break;
      case "PageUp":
        e.preventDefault();
        shiftMonth(-1);
        break;
      case "PageDown":
        e.preventDefault();
        shiftMonth(1);
        break;
      case "Home":
        e.preventDefault();
        moveFocus(-((focused.getDay() - weekStartsOn + 7) % 7));
        break;
      case "End":
        e.preventDefault();
        moveFocus(6 - ((focused.getDay() - weekStartsOn + 7) % 7));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        select(focused);
        break;
    }
  });
  bag.listen(grid, "mouseleave", () => {
    if (mode === "range" && rangeStart && !rangeEnd) {
      hovered = null;
      render();
    }
  });

  render();
  return () => bag.dispose();
};
