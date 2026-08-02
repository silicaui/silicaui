/**
 * Runtime color cascade — the live-editing half of @wizeworks/silicaui's N-color promise.
 *
 * @wizeworks/silicaui's plugin emits color utilities (`text-brand`, `bg-brand`) and component
 * variants (`btn-brand`, `badge-brand`, `alert-brand`, …) for every color DECLARED
 * at build time. The builder lets a user INVENT a color in the theme editor, so its
 * classes aren't in the compiled CSS yet — those missing rules are generated at
 * runtime instead, for the theme's custom roles, scoped to a container.
 *
 * THE GENERATOR ITSELF NOW LIVES IN `@wizeworks/silicaui-html/theme`, not here.
 * It was canvas-only for as long as it lived in this package: `Canvas` and
 * `ComponentBoard` imported it, publish and export never could (a render path
 * must not import React, and the builder's entry does), so a page that PREVIEWED
 * with a custom color shipped with `btn-sunset` styling nothing — a class that
 * looks like a typo nobody made. A host can't close that from its own seam,
 * because the build-time `colors:` list isn't reachable at runtime. Moving it
 * one package down puts the canvas and the published page on the same generator.
 *
 * Re-exported rather than relocated-and-forgotten so the canvas keeps its
 * `.sui-canvas` default: on the canvas the rules MUST be scoped (they'd
 * otherwise repaint the editor's own chrome with the tenant's palette), and on a
 * published page they must NOT be (they stand in for global declared colors).
 * Getting that backwards is silent in both directions, so the default lives with
 * the caller that has an opinion.
 */
import { customColorCss as customColorCssFor } from "@wizeworks/silicaui-html/theme";
import { resolveThemeTokens } from "@wizeworks/silicaui-html";
import type { Theme } from "@wizeworks/silicaui-html";

export type { RuleMap } from "@wizeworks/silicaui-html/theme";
export { customColorRules, customRolesOf, serializeRules, themeTokenCss } from "@wizeworks/silicaui-html/theme";

/**
 * CSS for a theme's CUSTOM colors (roles beyond the built-in semantic set),
 * scoped under `scope` so it paints the target without leaking into the chrome.
 * Returns "" when the theme adds no custom colors (the common case).
 */
export function customColorCss(theme: Theme, scope = ".sui-canvas"): string {
  return customColorCssFor(theme, scope);
}

/**
 * A theme's tokens as inline CSS custom properties for a theme island — the ONE
 * place the builder turns a `Theme` into paint. Both the canvas and the
 * component board mount an island, and they must agree token-for-token.
 *
 * Goes through `resolveThemeTokens`, so every role carries a contrast-MEASURED
 * `-content` foreground. A color the author invents in the theme editor is
 * measured the same way a shipped preset is, and neither reaches @wizeworks/
 * silicaui's CSS threshold fallback.
 */
export function themeVars(theme: Theme): Record<string, string> {
  const tokens = resolveThemeTokens(theme, theme.mode === "dark" ? "dark" : "light");
  const style: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) if (k.startsWith("--")) style[k] = String(v);
  return style;
}
