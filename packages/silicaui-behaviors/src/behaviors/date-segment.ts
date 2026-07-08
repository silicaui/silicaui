import { DisposeBag, ownParts } from "../dom";
import type { BehaviorHandler } from "../types";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * `date-segment` — `role=spinbutton` `segment` divs (non-form-associated —
 * value lives only in `aria-valuenow`), each configured via `data-role`
 * (`month`/`day`/`year`/`hour`/`minute`/`second`/`period`), `data-min`,
 * `data-max`, `data-digits`, and an optional `data-cycle` JSON array (AM/PM).
 * Ports `lib/date-time-segment.tsx`'s digit-buffer commit rule verbatim: a
 * typed digit commits once the buffer hits `digits` length OR one more digit
 * could no longer stay ≤ max. The day segment's max is recomputed live from
 * sibling month/year segments (real calendar-aware clamping, not a static 31).
 * Covers DateInput/DateTimeInput/TimeInput; DateRangeInput is two of these
 * roots side by side (a shared `-` separator needs no behavior of its own).
 */
export const dateSegment: BehaviorHandler = (root, _opts) => {
  const segments = ownParts(root, "segment") as HTMLElement[];
  const hidden = root.querySelector('input[type="hidden"]') as HTMLInputElement | null;
  const bag = new DisposeBag();
  if (!segments.length) return () => bag.dispose();

  const buffers = new Map<HTMLElement, string>();

  const roleOf = (seg: HTMLElement) => seg.getAttribute("data-role") ?? "";
  const valueOf = (seg: HTMLElement): number | null => {
    const raw = seg.getAttribute("aria-valuenow");
    return raw != null && raw !== "" ? Number(raw) : null;
  };
  const cycleOf = (seg: HTMLElement): string[] | null => {
    const raw = seg.getAttribute("data-cycle");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      return null;
    }
  };
  const minOf = (seg: HTMLElement) => Number(seg.getAttribute("data-min") ?? 0);
  const maxOf = (seg: HTMLElement): number => {
    if (roleOf(seg) === "day") {
      const monthSeg = segments.find((s) => roleOf(s) === "month");
      const yearSeg = segments.find((s) => roleOf(s) === "year");
      const month = monthSeg ? (valueOf(monthSeg) ?? 1) : 1;
      const year = yearSeg ? (valueOf(yearSeg) ?? 2000) : 2000;
      return daysInMonth(year, month);
    }
    return Number(seg.getAttribute("data-max") ?? 31);
  };
  const digitsOf = (seg: HTMLElement) => Number(seg.getAttribute("data-digits") ?? 2);

  const syncHidden = () => {
    if (!hidden) return;
    if (segments.some((s) => valueOf(s) == null)) {
      hidden.value = "";
    } else {
      hidden.value = segments.map((s) => String(valueOf(s))).join("-");
    }
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const render = (seg: HTMLElement) => {
    const cycle = cycleOf(seg);
    const v = valueOf(seg);
    if (cycle) {
      seg.textContent = v != null ? (cycle[v] ?? "") : (seg.getAttribute("data-placeholder") ?? "--");
    } else if (v != null) {
      seg.textContent = String(v).padStart(digitsOf(seg), "0");
    } else {
      seg.textContent = seg.getAttribute("data-placeholder") ?? "–".repeat(digitsOf(seg));
    }
    seg.setAttribute("aria-valuetext", seg.textContent ?? "");
    syncHidden();
  };

  const setValue = (seg: HTMLElement, v: number | null) => {
    if (v == null) seg.removeAttribute("aria-valuenow");
    else seg.setAttribute("aria-valuenow", String(v));
    render(seg);
  };

  const advance = (seg: HTMLElement) => segments[segments.indexOf(seg) + 1]?.focus();
  const retreat = (seg: HTMLElement) => segments[segments.indexOf(seg) - 1]?.focus();

  const commitDigit = (seg: HTMLElement, digit: string) => {
    if (cycleOf(seg)) return;
    const min = minOf(seg);
    const max = maxOf(seg);
    const digits = digitsOf(seg);
    const buf = (buffers.get(seg) ?? "") + digit;
    const num = Number(buf);
    if (num > max || buf.length >= digits) {
      setValue(seg, Math.min(max, Math.max(min, num)));
      buffers.set(seg, "");
      advance(seg);
    } else {
      buffers.set(seg, buf);
      setValue(seg, num);
    }
  };

  for (const seg of segments) {
    seg.setAttribute("role", "spinbutton");
    if (!seg.hasAttribute("tabindex")) seg.tabIndex = 0;
    seg.setAttribute("aria-valuemin", String(minOf(seg)));
    seg.setAttribute("aria-valuemax", String(maxOf(seg)));
    render(seg);

    bag.listen(seg, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      const cycle = cycleOf(seg);
      if (/^[0-9]$/.test(e.key) && !cycle) {
        e.preventDefault();
        commitDigit(seg, e.key);
        return;
      }
      switch (e.key) {
        case "ArrowUp": {
          e.preventDefault();
          buffers.set(seg, "");
          if (cycle) {
            const v = valueOf(seg);
            setValue(seg, v == null ? 0 : (v + 1) % cycle.length);
          } else {
            const v = valueOf(seg);
            const next = v == null ? minOf(seg) : v + 1;
            setValue(seg, next > maxOf(seg) ? minOf(seg) : next);
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          buffers.set(seg, "");
          if (cycle) {
            const v = valueOf(seg);
            setValue(seg, v == null ? cycle.length - 1 : (v - 1 + cycle.length) % cycle.length);
          } else {
            const v = valueOf(seg);
            const next = v == null ? maxOf(seg) : v - 1;
            setValue(seg, next < minOf(seg) ? maxOf(seg) : next);
          }
          break;
        }
        case "ArrowRight":
          e.preventDefault();
          advance(seg);
          break;
        case "ArrowLeft":
          e.preventDefault();
          retreat(seg);
          break;
        case "Backspace": {
          e.preventDefault();
          const buf = buffers.get(seg) ?? "";
          if (buf.length > 1) {
            const trimmed = buf.slice(0, -1);
            buffers.set(seg, trimmed);
            setValue(seg, Number(trimmed));
          } else if (valueOf(seg) != null) {
            buffers.set(seg, "");
            setValue(seg, null);
          } else {
            retreat(seg);
          }
          break;
        }
      }
    });
  }

  bag.listen(root, "paste", (ev) => {
    const e = ev as ClipboardEvent;
    const text = e.clipboardData?.getData("text") ?? "";
    const nums = text.match(/\d+/g);
    if (!nums) return;
    e.preventDefault();
    nums.slice(0, segments.length).forEach((n, i) => {
      const seg = segments[i]!;
      if (!cycleOf(seg)) setValue(seg, Math.min(maxOf(seg), Math.max(minOf(seg), Number(n))));
    });
  });

  return () => bag.dispose();
};
