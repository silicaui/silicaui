import { isDev } from "./dev";

/**
 * Dev-only check that the `@wizeworks/silicaui` CSS plugin is actually wired
 * into the app's stylesheet.
 *
 * WHY THIS EXISTS. Forgetting the one `@plugin` line is completely silent.
 * These components go on rendering `class="btn btn-primary"` exactly as they
 * always do; the classes resolve to no rules; the page renders as bare unstyled
 * text. There is no build error, no console warning, and the dev server prints a
 * clean `GET / 200`. Tailwind's own utilities keep working, so the result reads
 * as *deliberate* rather than broken — which is why it costs a first-time user
 * their whole evaluation rather than a minute (docs/personas/issues/011).
 *
 * The plugin cannot report this: a plugin that was never loaded cannot warn. The
 * React layer is the only part of the system that is running, in the browser,
 * with both halves in view — it knows which classes it emitted, and it can look
 * for the CSS behind them.
 *
 * HOW. `buildBase()` in `@wizeworks/silicaui` emits one sentinel custom property
 * on `:root` — `--sui-plugin: 1`. Only its PRESENCE is read, never its value. A
 * custom property, not a class, because the plugin's `prefix` option renames
 * classes and leaves custom properties alone: the sentinel is spelled the same
 * in a prefixed install as in a plain one.
 */

/** Fires once per page, not once per component. */
let checked = false;

function report(): void {
  const sentinel = getComputedStyle(document.documentElement)
    .getPropertyValue("--sui-plugin")
    .trim();

  if (sentinel) return;

  console.error(
    `[silicaui] The @wizeworks/silicaui CSS plugin is not loaded, so every Silica ` +
      `class on this page resolves to nothing.\n` +
      `  Components still render class="btn btn-primary", but no rules exist behind ` +
      `those names — the page renders unstyled, with no build error and a clean 200.\n` +
      `  Fix: add the plugin to the CSS file your app imports (app/globals.css in a ` +
      `Next.js app):\n` +
      `    @import "tailwindcss";\n` +
      `    @plugin "@wizeworks/silicaui" {\n` +
      `      colors: primary, secondary, accent, neutral, info, success, warning, error;\n` +
      `    }\n` +
      `  If that line is already there, check it is in the stylesheet your root layout ` +
      `imports — a plugin declared in a CSS file nobody imports is the same as no plugin.`,
  );
}

/**
 * Called from the two hooks every Silica component builds its class names
 * through, so this covers the component set rather than one call site.
 *
 * Safe to call during render: it is a boolean test after the first page load,
 * a no-op on the server (no `document`), and stripped from production builds by
 * the `isDev` guard, which bundlers fold to a literal `false`.
 *
 * The read is DEFERRED to the `load` event when the document is still parsing.
 * Reading `--sui-plugin` before the stylesheet has been applied would report a
 * correctly-wired app as broken, and a false alarm here is worse than silence —
 * it would teach people to ignore the message that matters.
 */
export function assertPluginPresent(): void {
  if (!isDev || checked) return;
  if (typeof document === "undefined") return;

  checked = true;

  if (document.readyState === "complete") {
    report();
  } else {
    window.addEventListener("load", report, { once: true });
  }
}
