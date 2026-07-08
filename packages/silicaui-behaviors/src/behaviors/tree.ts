import { DisposeBag } from "../dom";
import type { BehaviorHandler } from "../types";

/**
 * `tree` — an ARIA tree (`role=treeitem` `node`s, nested `role=group`
 * containers). No `ownParts`-style single-root scoping here: nodes at any
 * depth belong to the SAME tree, unlike a carousel's slides, so this walks
 * `querySelectorAll` directly. Roving tabindex is recomputed against the
 * currently-VISIBLE set (collapsed branches are skipped) on every move,
 * since children only exist in the accessibility tree while expanded.
 */
export const tree: BehaviorHandler = (root, _opts) => {
  const bag = new DisposeBag();
  const allNodes = () => Array.from(root.querySelectorAll('[data-sui-part="node"]')) as HTMLElement[];

  const groupOf = (node: HTMLElement) => node.querySelector(':scope > [role="group"]') as HTMLElement | null;
  const toggleOf = (node: HTMLElement) => node.querySelector('[data-sui-part="toggle"]') as HTMLElement | null;
  const parentNodeOf = (node: HTMLElement) =>
    node.parentElement?.closest('[data-sui-part="node"]') as HTMLElement | null;

  const visibleNodes = () =>
    allNodes().filter((n) => {
      let p = parentNodeOf(n);
      while (p) {
        if (p.getAttribute("aria-expanded") === "false") return false;
        p = parentNodeOf(p);
      }
      return true;
    });

  const setExpanded = (node: HTMLElement, expanded: boolean) => {
    const group = groupOf(node);
    if (!group) return;
    node.setAttribute("aria-expanded", String(expanded));
    group.toggleAttribute("hidden", !expanded);
  };

  const select = (node: HTMLElement) => {
    for (const n of allNodes()) n.removeAttribute("aria-selected");
    node.setAttribute("aria-selected", "true");
  };

  const focusNode = (node: HTMLElement) => {
    for (const n of allNodes()) n.tabIndex = -1;
    node.tabIndex = 0;
    node.focus();
  };

  for (const node of allNodes()) {
    node.setAttribute("role", "treeitem");
    node.tabIndex = -1;
    if (groupOf(node) && !node.hasAttribute("aria-expanded")) node.setAttribute("aria-expanded", "false");

    const toggle = toggleOf(node);
    if (toggle) {
      bag.listen(toggle, "click", (ev) => {
        ev.stopPropagation();
        setExpanded(node, node.getAttribute("aria-expanded") !== "true");
      });
    }

    bag.listen(node, "click", (ev) => {
      if ((ev.target as Element).closest('[data-sui-part="toggle"]')) return;
      focusNode(node);
      select(node);
    });

    bag.listen(node, "keydown", (ev) => {
      const e = ev as KeyboardEvent;
      const vis = visibleNodes();
      const i = vis.indexOf(node);
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (vis[i + 1]) focusNode(vis[i + 1]!);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (vis[i - 1]) focusNode(vis[i - 1]!);
          break;
        case "ArrowRight": {
          e.preventDefault();
          if (groupOf(node) && node.getAttribute("aria-expanded") !== "true") {
            setExpanded(node, true);
          } else {
            const after = visibleNodes();
            const next = after[after.indexOf(node) + 1];
            if (next) focusNode(next);
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (node.getAttribute("aria-expanded") === "true") {
            setExpanded(node, false);
          } else {
            const parent = parentNodeOf(node);
            if (parent) focusNode(parent);
          }
          break;
        }
        case "Home":
          e.preventDefault();
          if (vis[0]) focusNode(vis[0]);
          break;
        case "End":
          e.preventDefault();
          if (vis.length) focusNode(vis[vis.length - 1]!);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          select(node);
          break;
      }
    });
  }

  const first = visibleNodes()[0];
  if (first) first.tabIndex = 0;

  return () => bag.dispose();
};
