import { DisposeBag, ownParts, parseParams } from "../dom";
import { wireScrollStrip } from "./scroll-strip-core";
import type { BehaviorHandler } from "../types";

/**
 * `tabs` — a `tab`/`panel` list, exclusive selection, with roving arrow-key
 * navigation (Left/Right, Up/Down, Home/End) per the standard tabs pattern.
 * Pairing is positional (Nth `tab` ↔ Nth `panel`), same nesting-scoped lookup
 * as `disclosure`.
 *
 * If the macro also emitted a `track` (the tab list) plus `prev`/`next`
 * controls, the strip announces its own overflow — a tab past the edge with
 * nothing saying so is a tab that, to the person looking, does not exist.
 * That is wired HERE rather than by nesting a `scroll-strip` root around the
 * list, because part lookup stops at a nested behavior boundary: every `tab`
 * would resolve to the inner root and this handler would find none.
 */
export const tabs: BehaviorHandler = (root, _opts) => {
  const tabEls = ownParts(root, "tab");
  const panels = ownParts(root, "panel");
  const bag = new DisposeBag();

  const track = ownParts(root, "track")[0] as HTMLElement | undefined;
  if (track) {
    const step = parseParams(root).step;
    wireScrollStrip(root, track, ownParts(root, "prev")[0], ownParts(root, "next")[0], bag, {
      step: typeof step === "number" ? step : undefined,
      // Never actually used: a tab list is full of real buttons, so it never
      // needs a tab stop of its own. Passed anyway so the one place that
      // decides that isn't silently relying on the caller's content.
      label: "tabs",
    });
  }

  const pairs = tabEls
    .map((tab, i) => ({ tab, panel: panels[i] }))
    .filter((p): p is { tab: Element; panel: Element } => p.panel != null);

  if (pairs.length === 0) return () => bag.dispose();

  let active = pairs.findIndex((p) => !p.panel.hasAttribute("hidden"));
  if (active === -1) active = 0;

  const select = (index: number, focus: boolean) => {
    active = index;
    pairs.forEach(({ tab, panel }, i) => {
      const isActive = i === index;
      panel.toggleAttribute("hidden", !isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
      if (isActive && focus) (tab as HTMLElement).focus?.();
    });
  };
  select(active, false);

  const last = pairs.length - 1;
  pairs.forEach(({ tab }, i) => {
    bag.listen(tab, "click", () => select(i, false));
    bag.listen(tab, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          select(i === last ? 0 : i + 1, true);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          select(i === 0 ? last : i - 1, true);
          break;
        case "Home":
          e.preventDefault();
          select(0, true);
          break;
        case "End":
          e.preventDefault();
          select(last, true);
          break;
      }
    });
  });

  return () => bag.dispose();
};
