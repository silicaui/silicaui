/**
 * Runtime color cascade — the live-editing half of @wizeworks/silicaui's N-color promise.
 *
 * @wizeworks/silicaui's plugin emits color utilities (`text-brand`, `bg-brand`) and component
 * variants (`btn-brand`, `badge-brand`, `alert-brand`, …) for every color DECLARED
 * at build time. The builder lets a user INVENT a color in the theme editor, so its
 * classes aren't in the compiled CSS yet — this module generates exactly those
 * missing rules at runtime, for the theme's custom roles, scoped to a container,
 * reusing @wizeworks/silicaui's OWN generators (`allColorVariantRules`,
 * `colorUtilityRules`) so a live color behaves byte-for-byte like a declared one.
 * Both generators return FLAT rule maps, so serialization is trivial (no
 * nested-selector handling).
 *
 * `allColorVariantRules` covers EVERY colored component, not just Button. It used
 * to call `buttonColorVars`, because Button's mapping was the only one factored
 * out of its module — so a color invented live painted `btn-brand` and silently
 * nothing else (no `badge-brand`, no `input-brand`, no `tabs-brand`). That made
 * the N-color promise true at build time and false in the builder, which is the
 * one place a color is actually invented.
 */
import { allColorVariantRules } from "@wizeworks/silicaui/color-variants";
import { colorUtilityRules } from "@wizeworks/silicaui/color-utilities";
import { resolveThemeTokens, rolesOf, SEMANTIC_ROLES } from "@wizeworks/silicaui-html";
import type { Theme, SemanticRole } from "@wizeworks/silicaui-html";

type RuleMap = Record<string, Record<string, string>>;

const kebab = (prop: string): string =>
  prop.startsWith("--") ? prop : prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

function serialize(rules: RuleMap, scope: string): string {
  return Object.entries(rules)
    .map(([sel, decls]) => {
      const body = Object.entries(decls)
        .map(([k, v]) => `${kebab(k)}:${v}`)
        .join(";");
      return `${scope} ${sel}{${body}}`;
    })
    .join("\n");
}

/**
 * CSS for a theme's CUSTOM colors (roles beyond the built-in semantic set), scoped
 * under `scope` so it paints the target without leaking into the chrome. Returns ""
 * when the theme adds no custom colors (the common case).
 */
export function customColorCss(theme: Theme, scope = ".sui-canvas"): string {
  const custom = rolesOf(theme).filter((r) => !SEMANTIC_ROLES.includes(r as SemanticRole));
  if (custom.length === 0) return "";
  // Utilities cover the role AND its `-content` foreground — the same pair the
  // build-time `colorUtilities` emits, so `text-brand-content` (the legible ink
  // ON brand) exists live too rather than only for declared colors.
  const utilityNames = custom.flatMap((c) => [c, `${c}-content`]);
  const rules: RuleMap = {
    ...colorUtilityRules(utilityNames),
    ...allColorVariantRules(custom),
  };
  return serialize(rules, scope);
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
