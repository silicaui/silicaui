/**
 * Runtime color cascade — the live-editing half of @wizeworks/silicaui's N-color promise.
 *
 * @wizeworks/silicaui's plugin emits color utilities (`text-brand`, `bg-brand`) and component
 * variants (`btn-brand`) for every color DECLARED at build time. The builder lets
 * a user INVENT a color in the theme editor, so its classes aren't in the compiled
 * CSS yet — this module generates exactly those missing rules at runtime, for the
 * theme's custom roles, scoped to a container, reusing @wizeworks/silicaui's OWN generators
 * (`buttonColorVars`, `colorUtilityRules`) so a live color behaves byte-for-byte
 * like a declared one. Both generators return FLAT rule maps, so serialization is
 * trivial (no nested-selector handling).
 */
import { buttonColorVars } from "@wizeworks/silicaui/button";
import { colorUtilityRules } from "@wizeworks/silicaui/color-utilities";
import { rolesOf, SEMANTIC_ROLES } from "@wizeworks/silicaui-html";
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
  const rules: RuleMap = {
    ...colorUtilityRules(custom),
    ...buttonColorVars(custom),
  };
  return serialize(rules, scope);
}
