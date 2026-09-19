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

/**
 * Not a Tailwind plugin — and it says so when it is mistaken for one.
 *
 * `@plugin "@wizeworks/silicaui-behaviors"` is an easy line to type: path 3 pairs
 * this runtime with the CSS plugin, so both names are in the same paragraph of the
 * setup, one line apart.
 * Without this guard Tailwind resolves the module, calls whatever it found, and
 * dies inside its own minified code with `b is not a function` — a message that
 * names no package, no cause and no fix, and reads like a crash in silicaui
 * rather than a one-word mistake (docs/personas/issues/012).
 *
 * Tailwind invokes the default export, so throwing from here puts a real
 * sentence in the build overlay in its place. Nothing else imports this.
 */
export default function notATailwindPlugin(): never {
  throw new Error(
    `@wizeworks/silicaui-behaviors is the browser runtime that hydrates data-sui-* markers, not a Tailwind plugin. ` +
      `Only @wizeworks/silicaui is.\n` +
      `  Fix: in your CSS, name the plugin package instead —\n` +
      `    @plugin "@wizeworks/silicaui" {\n` +
      `      colors: primary, secondary, accent, neutral, info, success, warning, error;\n` +
      `    }\n` +
      `  Keep importing @wizeworks/silicaui-behaviors from your page as normal; the two are ` +
      `separate packages on purpose.`,
  );
}
