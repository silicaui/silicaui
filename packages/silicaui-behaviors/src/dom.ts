/**
 * Shared DOM helpers for behavior handlers — scoped part lookup, param parsing,
 * and dispose-list bookkeeping. Every handler receives a `root` (the element
 * carrying `data-sui-behavior`) and reads its structural parts from here so the
 * "correlate by nesting, not id" rule (architecture §7) lives in one place.
 */

export const BEHAVIOR_ATTR = "data-sui-behavior";
export const PARAMS_ATTR = "data-sui-behavior-params";
export const PART_ATTR = "data-sui-part";
export const HYDRATED_ATTR = "data-sui-hydrated";

/**
 * Descendants of `root` matching `[data-sui-part="role"]`, stopping at any
 * nested `[data-sui-behavior]` boundary — a part belongs to its NEAREST
 * ancestor behavior root, so a nested carousel's `slide` parts never leak into
 * an outer root's query.
 */
export function ownParts(root: Element, role: string): Element[] {
  const all = Array.from(root.querySelectorAll(`[${PART_ATTR}="${role}"]`));
  return all.filter((el) => nearestBehaviorRoot(el, root) === root);
}

/** The nearest ancestor (inclusive of `stop`) carrying `data-sui-behavior`. */
function nearestBehaviorRoot(el: Element, stop: Element): Element {
  let node: Element | null = el.parentElement;
  while (node && node !== stop.parentElement) {
    if (node.hasAttribute(BEHAVIOR_ATTR)) return node;
    if (node === stop) return stop;
    node = node.parentElement;
  }
  return stop;
}

/** Parse `data-sui-behavior-params`; malformed/missing JSON → `{}`. */
export function parseParams(root: Element): Record<string, unknown> {
  const raw = root.getAttribute(PARAMS_ATTR);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Collects dispose callbacks so a handler can tear itself down as one unit. */
export class DisposeBag {
  #fns: Array<() => void> = [];

  add(fn: () => void): void {
    this.#fns.push(fn);
  }

  listen<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K | (string & {}),
    handler: (ev: Event) => void,
    opts?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, handler, opts);
    this.#fns.push(() => target.removeEventListener(type, handler, opts));
  }

  dispose(): void {
    for (const fn of this.#fns.splice(0)) fn();
  }
}

export function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
