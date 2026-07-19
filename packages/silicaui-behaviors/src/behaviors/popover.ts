import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `popover` — one or more `trigger`/`panel` pairs (positional, like
 * `disclosure`), anchored via runtime-computed position (same precedent as
 * `carousel`'s `track.style.transform` — this is live-DOM positioning, not
 * an authored inline style). `params.trigger`: `"click"` (default) |
 * `"hover"` | `"context"` (right-click, positions at the pointer instead of
 * the trigger rect). `params.single`: closes other pairs under the same
 * root when one opens (Menubar/NavigationMenu's "only one menu open").
 * Covers Popover, Tooltip, PreviewCard, ContextMenu, Menubar, NavigationMenu
 * — each is this one behavior with different params, not a broken reuse:
 * the real differences (trigger event, anchor point, single-open grouping)
 * are all genuine parameters, not papered-over mismatches.
 */
// Monotonic id source for runtime-generated tooltip ids (aria-describedby).
let tooltipSeq = 0;

export const popover: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const mode = params.trigger === "hover" || params.trigger === "context" ? params.trigger : "click";
  const single = params.single === true;
  const triggers = ownParts(root, "trigger");
  const panels = ownParts(root, "panel");
  const closes = ownParts(root, "close");
  const bag = new DisposeBag();

  const pairs = triggers
    .map((trigger, i) => ({ trigger, panel: panels[i] }))
    .filter((p): p is { trigger: Element; panel: Element } => p.panel != null);
  if (pairs.length === 0) return () => bag.dispose();

  const isOpen = (panel: Element) => !panel.hasAttribute("hidden");

  const place = (trigger: Element, panel: Element, at?: { x: number; y: number }) => {
    const el = panel as HTMLElement;
    el.style.position = "fixed";
    el.style.zIndex = "50";
    if (at) {
      el.style.left = `${at.x}px`;
      el.style.top = `${at.y}px`;
      return;
    }
    const r = (trigger as HTMLElement).getBoundingClientRect?.();
    if (!r) return;
    el.style.left = `${r.left}px`;
    el.style.top = `${r.bottom + 4}px`;
  };

  const close = (panel: Element, trigger?: Element) => {
    if (!isOpen(panel)) return;
    panel.setAttribute("hidden", "");
    trigger?.setAttribute("aria-expanded", "false");
  };
  const closeAll = (except?: Element) => {
    for (const p of pairs) if (p.panel !== except) close(p.panel, p.trigger);
  };
  const open = (trigger: Element, panel: Element, at?: { x: number; y: number }) => {
    if (single) closeAll(panel);
    place(trigger, panel, at);
    panel.removeAttribute("hidden");
    trigger.setAttribute("aria-expanded", "true");
  };

  if (opts.preview) for (const { panel } of pairs) panel.removeAttribute("hidden");

  for (const { trigger, panel } of pairs) {
    if (mode !== "hover") {
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-expanded", "false");
    }

    if (mode === "context") {
      bag.listen(trigger, "contextmenu", (ev) => {
        const e = ev as MouseEvent;
        e.preventDefault();
        open(trigger, panel, { x: e.clientX, y: e.clientY });
      });
    } else if (mode === "hover") {
      // Tooltip pattern (APG + WCAG 1.4.13 hover persistence): open on hover or
      // keyboard focus, stay open while the pointer is over trigger OR panel
      // (close on a short delay so the pointer can cross the gap), close when
      // focus leaves both. `focusin`/`focusout` — not `focus`/`blur` — so a
      // focusable CHILD of the trigger counts; those events bubble.
      let closeTimer: ReturnType<typeof setTimeout> | undefined;
      const cancelClose = () => {
        if (closeTimer !== undefined) clearTimeout(closeTimer);
        closeTimer = undefined;
      };
      const scheduleClose = () => {
        cancelClose();
        closeTimer = setTimeout(() => close(panel, trigger), 150);
      };
      bag.add(cancelClose);

      // A hover trigger must be keyboard-reachable: if neither it nor anything
      // inside it is focusable, make the trigger itself a tab stop.
      const t = trigger as HTMLElement;
      if (
        t.tabIndex < 0 &&
        !trigger.querySelector("a[href], button, input, select, textarea, [tabindex]")
      ) {
        t.tabIndex = 0;
      }
      // Name the relationship for AT: a `role=tooltip` panel describes its
      // trigger. Ids are generated here (runtime DOM), never authored — the
      // schema's correlate-by-nesting rule stays intact.
      if (panel.getAttribute("role") === "tooltip") {
        if (!panel.id) panel.id = `sui-tooltip-${++tooltipSeq}`;
        if (!trigger.hasAttribute("aria-describedby")) {
          trigger.setAttribute("aria-describedby", panel.id);
        }
      }

      bag.listen(trigger, "mouseenter", () => {
        cancelClose();
        open(trigger, panel);
      });
      bag.listen(trigger, "focusin", () => {
        cancelClose();
        open(trigger, panel);
      });
      bag.listen(trigger, "mouseleave", scheduleClose);
      bag.listen(trigger, "focusout", (ev) => {
        const to = (ev as FocusEvent).relatedTarget as Node | null;
        if (to && (trigger.contains(to) || panel.contains(to))) return;
        close(panel, trigger);
      });
      bag.listen(panel, "mouseenter", cancelClose);
      bag.listen(panel, "mouseleave", scheduleClose);
    } else {
      bag.listen(trigger, "click", () => (isOpen(panel) ? close(panel, trigger) : open(trigger, panel)));
    }
  }

  for (const c of closes) {
    bag.listen(c, "click", () => {
      const pair = pairs.find((p) => p.panel.contains(c));
      if (pair) close(pair.panel, pair.trigger);
    });
  }

  if (mode === "click") {
    bag.listen(
      document,
      "click",
      (ev) => {
        for (const { trigger, panel } of pairs) {
          if (isOpen(panel) && !panel.contains(ev.target as Node) && !trigger.contains(ev.target as Node)) {
            close(panel, trigger);
          }
        }
      },
      { capture: true },
    );
  }

  bag.listen(root, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (e.key !== "Escape") return;
    for (const { trigger, panel } of pairs) {
      if (isOpen(panel)) {
        e.preventDefault();
        close(panel, trigger);
        (trigger as HTMLElement).focus?.();
      }
    }
  });

  return () => bag.dispose();
};
