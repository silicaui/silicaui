import { DisposeBag, ownParts, parseParams, PART_ATTR } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `menu` — a triggered popup (dropdown/mega-menu/context-menu) of `item`
 * parts: `params.trigger` (default `"click"`) can be `"context"` (right-click
 * — ContextMenu; positions the panel at the pointer instead of the trigger
 * rect). Escape and outside-click dismiss; Up/Down/Home/End rove focus across
 * items while open. This is the vanilla counterpart to @wizeworks/silicaui-react's
 * Base-UI-backed `DropdownMenu`/`ContextMenu` — same authored markers, same
 * `.dropdown*` classes, no React required.
 */
export const menu: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const isContext = params.trigger === "context";
  const trigger = ownParts(root, "trigger")[0];
  const panel = ownParts(root, "panel")[0];
  const bag = new DisposeBag();
  if (!trigger || !panel) return () => bag.dispose();

  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");

  const getItems = () => {
    const items = ownParts(root, "item");
    for (const item of items) {
      const el = item as HTMLElement;
      if (!el.hasAttribute("tabindex") && el.tagName !== "BUTTON" && el.tagName !== "A") {
        el.setAttribute("tabindex", "-1");
      }
    }
    return items;
  };

  const isOpen = () => !panel.hasAttribute("hidden");

  const close = (focusTrigger: boolean) => {
    panel.setAttribute("hidden", "");
    trigger.setAttribute("aria-expanded", "false");
    if (focusTrigger) (trigger as HTMLElement).focus?.();
  };

  const open = (at?: { x: number; y: number }) => {
    if (at) {
      const el = panel as HTMLElement;
      el.style.position = "fixed";
      el.style.zIndex = "50";
      el.style.left = `${at.x}px`;
      el.style.top = `${at.y}px`;
    }
    panel.removeAttribute("hidden");
    trigger.setAttribute("aria-expanded", "true");
    (getItems()[0] as HTMLElement | undefined)?.focus?.();
  };

  // Reveals the panel in the editor canvas so its contents are editable
  // without first opening the menu (§9.8).
  if (opts.preview) panel.removeAttribute("hidden");

  if (isContext) {
    bag.listen(trigger, "contextmenu", (ev) => {
      const e = ev as MouseEvent;
      e.preventDefault();
      open({ x: e.clientX, y: e.clientY });
    });
  } else {
    bag.listen(trigger, "click", () => (isOpen() ? close(false) : open()));
  }

  bag.listen(root, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      close(true);
      return;
    }
    // APG menu: Tab closes the menu. Refocus the trigger and let the default
    // Tab proceed, so focus lands on the element after (or before) it.
    if (e.key === "Tab" && isOpen()) {
      close(true);
      return;
    }
    if (!isOpen()) return;
    const items = getItems();
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as Element);
    const focusAt = (i: number) => (items[i] as HTMLElement | undefined)?.focus?.();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(current === -1 ? 0 : (current + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(current === -1 ? items.length - 1 : (current - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        break;
    }
  });

  // Clicking an item closes the menu (items are one-shot actions).
  bag.listen(panel, "click", (ev) => {
    const target = ev.target as Element;
    if (target.closest(`[${PART_ATTR}="item"]`)) close(false);
  });

  bag.listen(
    document,
    "click",
    (ev) => {
      if (!isOpen()) return;
      if (!root.contains(ev.target as Node)) close(false);
    },
    { capture: true },
  );

  return () => bag.dispose();
};
