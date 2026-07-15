/**
 * @wizeworks/silicaui-behaviors — the framework-agnostic runtime for the behavior marker
 * contract (architecture §7). It scans lowered `data-sui-*` markers (emitted
 * by `@wizeworks/silicaui-html`'s `toHtml`) and wires the closed set of interactive
 * composites: carousel, disclosure, tabs, menu, marquee, scrollspy, counter,
 * dismiss, toc. Depends on no client framework — it is what a structured host
 * that renders plain markup runs for interactivity, and what the builder
 * canvas runs for preview (§9.8).
 */
import { BEHAVIOR_ATTR, HYDRATED_ATTR } from "./dom";
import { HANDLERS } from "./registry";
import type { BehaviorType, HydrateOptions } from "./types";

export type {
  ActionPayload,
  BehaviorHandler,
  BehaviorType,
  FormSubmitPayload,
  FormValue,
  HydrateOptions,
} from "./types";

// Standalone utilities — NOT part of the closed behavior-marker vocabulary
// above (no `data-sui-behavior` involved); vanilla mirrors of the equivalent
// `@wizeworks/silicaui-react` hooks, for a host running no React.
export { getTheme, setTheme, onThemeChange } from "./theme";
export type { SetThemeOptions } from "./theme";

export { SILICA_BREAKPOINTS, matchBreakpoint, onBreakpointChange } from "./breakpoints";
export type { SilicaBreakpoint } from "./breakpoints";

export { confirm } from "./confirm";
export type { ConfirmOptions } from "./confirm";

// Host-node mounting — the optional client loop for `<div data-sui-host>` mount
// points (spec §A.4). NOT a behavior marker; host components are host-owned.
export { mountHostNodes, HOST_ATTR, HOST_PROPS_ATTR, HOST_MOUNTED_ATTR } from "./host-mounts";
export type { HostMounter } from "./host-mounts";

/**
 * Hydrates every not-yet-hydrated behavior marker under `root` (default:
 * the whole document). Idempotent — safe to call again after the DOM
 * changes (e.g. a builder edit); already-wired roots are skipped. Returns a
 * dispose function that tears down every listener/observer this call
 * registered.
 */
export function hydrate(root: ParentNode = document, opts: HydrateOptions = {}): () => void {
  const disposers: Array<() => void> = [];

  for (const el of Array.from(root.querySelectorAll(`[${BEHAVIOR_ATTR}]`))) {
    if (el.hasAttribute(HYDRATED_ATTR)) continue;
    const type = el.getAttribute(BEHAVIOR_ATTR) as BehaviorType | null;
    const handler = type ? HANDLERS[type] : undefined;
    if (!handler) continue;

    el.setAttribute(HYDRATED_ATTR, "");
    const dispose = handler(el, opts);
    disposers.push(() => {
      dispose();
      el.removeAttribute(HYDRATED_ATTR);
    });
  }

  return () => {
    for (const dispose of disposers.splice(0)) dispose();
  };
}
