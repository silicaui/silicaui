import { DisposeBag, ownParts, parseParams } from "../dom";
import type { BehaviorHandler } from "../types";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * `modal` — a portal-free dialog: `trigger`(s) open a `panel` behind an
 * optional `backdrop`; `close` parts and Escape always close it; `params.dismissible`
 * (default `true`) also lets a backdrop click close it (AlertDialog sets this
 * `false` — its backdrop is inert, per the ARIA alert-dialog pattern, Escape
 * still cancels). Covers Dialog/Drawer/AlertDialog directly; Lightbox and
 * CommandPalette layer optional extra parts on the same root rather than
 * getting their own type (see below).
 */
export const modal: BehaviorHandler = (root, opts) => {
  const params = parseParams(root);
  const dismissible = params.dismissible !== false;
  const triggers = ownParts(root, "trigger");
  const backdrop = ownParts(root, "backdrop")[0];
  const panel = ownParts(root, "panel")[0];
  const closes = ownParts(root, "close");
  const bag = new DisposeBag();
  if (!panel) return () => bag.dispose();

  let lastFocused: HTMLElement | null = null;

  const isOpen = () => !panel.hasAttribute("hidden");

  const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));

  const open = () => {
    lastFocused = document.activeElement as HTMLElement | null;
    panel.removeAttribute("hidden");
    backdrop?.removeAttribute("hidden");
    for (const t of triggers) t.setAttribute("aria-expanded", "true");
    (focusables()[0] ?? (panel as HTMLElement)).focus?.();
  };

  const close = () => {
    if (!isOpen()) return;
    panel.setAttribute("hidden", "");
    backdrop?.setAttribute("hidden", "");
    for (const t of triggers) t.setAttribute("aria-expanded", "false");
    lastFocused?.focus?.();
  };

  if (opts.preview) {
    panel.removeAttribute("hidden");
    backdrop?.setAttribute("hidden", "");
  }

  // Lightbox-style gallery nav. `slide` items + `prev`/`next` buttons inside
  // the panel get cycling + arrow-key nav for free; a `title` part (reused —
  // same "text this behavior keeps in sync" role `calendar` uses for its
  // month label) becomes an "N / total" counter if present. When `trigger`s
  // are positionally 1:1 with `slide`s (a gallery of thumbnails, each
  // opening ITS OWN slide — the natural authoring shape), clicking one jumps
  // straight to that slide, same positional-pairing convention as `tabs`.
  const slides = ownParts(root, "slide");
  const counter = ownParts(root, "title")[0];
  let slideIndex = Math.max(
    0,
    slides.findIndex((s) => !s.hasAttribute("hidden")),
  );
  const renderSlide = () => {
    slides.forEach((s, i) => s.toggleAttribute("hidden", i !== slideIndex));
    if (counter) counter.textContent = `${slideIndex + 1} / ${slides.length}`;
  };
  const goSlide = (delta: number) => {
    slideIndex = (slideIndex + delta + slides.length) % slides.length;
    renderSlide();
  };
  if (slides.length) renderSlide();

  for (const trigger of triggers) {
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    bag.listen(trigger, "click", () => {
      if (isOpen()) return close();
      if (slides.length && triggers.length === slides.length) {
        slideIndex = triggers.indexOf(trigger);
        renderSlide();
      }
      open();
    });
  }
  for (const c of closes) bag.listen(c, "click", () => close());
  if (backdrop && dismissible) bag.listen(backdrop, "click", () => close());

  bag.listen(root, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Optional: CommandPalette-style live filtering. A `search` input + `item`
  // rows inside the panel get filter/arrow-nav/Enter-select for free.
  const search = ownParts(root, "search")[0] as HTMLInputElement | undefined;
  const items = ownParts(root, "item");
  if (search && items.length) {
    let active = -1;
    const visible = () => items.filter((it) => !it.hasAttribute("hidden"));
    const setActive = (item: Element | undefined) => {
      active = item ? items.indexOf(item) : -1;
      items.forEach((it, i) => {
        const isActive = i === active;
        it.setAttribute("aria-selected", String(isActive));
        it.toggleAttribute("data-active", isActive);
      });
    };
    const filter = () => {
      const q = search.value.trim().toLowerCase();
      for (const it of items) {
        const match = q.length === 0 || (it.textContent ?? "").toLowerCase().includes(q);
        it.toggleAttribute("hidden", !match);
      }
      setActive(visible()[0]);
    };
    bag.listen(search, "input", filter);
    bag.listen(search, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      const vis = visible();
      if (!vis.length) return;
      const cur = vis.indexOf(items[active]!);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(vis[cur === -1 ? 0 : (cur + 1) % vis.length]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(vis[cur === -1 ? vis.length - 1 : (cur - 1 + vis.length) % vis.length]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        (items[active] as HTMLElement | undefined)?.click();
      }
    });
    for (const [i, item] of items.entries()) {
      bag.listen(item, "click", () => {
        setActive(items[i]);
        close();
      });
    }
    filter();
  }

  if (slides.length) {
    const prev = ownParts(root, "prev")[0];
    const next = ownParts(root, "next")[0];
    if (prev) bag.listen(prev, "click", () => goSlide(-1));
    if (next) bag.listen(next, "click", () => goSlide(1));
    bag.listen(root, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      if (!isOpen()) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goSlide(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goSlide(1);
      }
    });
  }

  // Optional: a global toggle hotkey (CommandPalette's ⌘K/Ctrl+K).
  if (params.hotkey) {
    const key = (typeof params.hotkey === "string" ? params.hotkey : "k").toLowerCase();
    bag.listen(document, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      if (e.key.toLowerCase() === key && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen() ? close() : open();
      }
    });
  }

  return () => bag.dispose();
};
