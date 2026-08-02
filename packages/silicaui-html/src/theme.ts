/**
 * `@wizeworks/silicaui-html/theme` — a theme turned into CSS, off the RENDER path.
 *
 * A silicaui color normally exists because it was DECLARED at build time:
 *
 *   @plugin "@wizeworks/silicaui" { colors: primary, secondary, brand; }
 *
 * …and the plugin emits, for each name, the utility trio (`.text-brand`,
 * `.bg-brand`, `.border-brand`) plus every component's variant (`.btn-brand`,
 * `.badge-brand`, `.input-brand`, … — 41 rules at the time of writing). That
 * list is a build-time constant, which is exactly the assumption a THEME EDITOR
 * breaks: a multi-tenant builder, a white-label app or a CMS lets a color be
 * NAMED AT RUNTIME, by someone whose site's bundle shipped months ago. Editing
 * the `colors:` list would mean redeploying the platform every time a merchant
 * invents a color.
 *
 * So the rules have to be generated at runtime, from the theme, and shipped
 * beside it. That is what this module does — and it does it by calling
 * silicaui's OWN generators rather than reimplementing them, so a color invented
 * at runtime is byte-for-byte a declared one, and a component added in a later
 * release is picked up with no change here or in the caller.
 *
 * WHY THIS SUBPATH EXISTS SEPARATELY. The builder has had this since it let a
 * user invent a color — but only ever on the CANVAS, imported by React
 * components. Publish and export never called it, so a page that previewed
 * correctly shipped with `btn-sunset` styling nothing: a class that looks like a
 * typo nobody made. A host cannot fix that from its own seam (the `colors:` list
 * is not reachable at runtime) and the canvas copy is unreachable from a render
 * path that must not import React. This entry is that path.
 *
 * WHY NOT THE PACKAGE ROOT. It is the one part of `@wizeworks/silicaui-html`
 * that needs `@wizeworks/silicaui` — an OPTIONAL peer, so the root entry
 * (schema + kit + `toHtml`) stays dependency-free for a consumer that only
 * projects trees. Import this subpath and the CSS package must be installed.
 *
 * Pair the two exports: `themeTokenCss` declares `--color-<name>` /
 * `--color-<name>-content`, `customColorCss` emits the rules that READ them. The
 * rules reference the pair with no fallback, so shipping them without the tokens
 * paints nothing — which is the same half-a-feature this module exists to close.
 */
import { allColorVariantRules } from "@wizeworks/silicaui/color-variants";
import { colorUtilityRules } from "@wizeworks/silicaui/color-utilities";
import { rolesOf, SEMANTIC_ROLES, resolveThemeTokens } from "./themes";
import type { SemanticRole } from "./themes";
import type { Theme } from "./schema";

/** A flat selector → declarations map, the shape both silicaui generators return. */
export type RuleMap = Record<string, Record<string, string>>;

/** camelCase JS property → CSS property. Custom properties pass through. */
const kebab = (prop: string): string =>
  prop.startsWith("--") ? prop : prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Serialize a flat rule map to CSS text, optionally prefixing every selector
 * with `scope`. Exported because a host with its own emitter (a CSS-in-JS
 * pipeline, a nonce'd `<style>`, a build step that wants the rules as data)
 * should not have to re-derive the property-name conversion.
 */
export function serializeRules(rules: RuleMap, scope = ""): string {
  const prefix = scope ? `${scope} ` : "";
  return Object.entries(rules)
    .map(([sel, decls]) => {
      const body = Object.entries(decls)
        .map(([k, v]) => `${kebab(k)}:${v}`)
        .join(";");
      return `${prefix}${sel}{${body}}`;
    })
    .join("\n");
}

/** The theme's roles that are NOT part of the built-in semantic set — the ones
 *  no build-time `colors:` list can be expected to carry. */
export function customRolesOf(theme: Theme): string[] {
  return rolesOf(theme).filter((r) => !SEMANTIC_ROLES.includes(r as SemanticRole));
}

/**
 * Every rule a build-time registration of the theme's CUSTOM colors would have
 * emitted, as a flat map — the utility trio for each color AND its `-content`
 * foreground, plus every colored component's variant.
 *
 * Use this when you want the rules as data; `customColorCss` is the same thing
 * serialized.
 */
export function customColorRules(theme: Theme, prefix = ""): RuleMap {
  const custom = customRolesOf(theme);
  if (custom.length === 0) return {};
  // Utilities cover the role AND its `-content` foreground — the same pair the
  // build-time `colorUtilities` emits, so `text-brand-content` (the legible ink
  // ON brand) exists at runtime too rather than only for declared colors.
  const utilityNames = custom.flatMap((c) => [c, `${c}-content`]);
  return {
    ...colorUtilityRules(utilityNames, prefix),
    ...allColorVariantRules(custom, prefix),
  };
}

/**
 * CSS for a theme's CUSTOM colors — the rules a build-time
 * `@plugin "@wizeworks/silicaui" { colors: … }` would have emitted for names
 * that were coined after the build.
 *
 * Returns `""` when the theme adds no custom colors, which is the common case —
 * so a host can call this unconditionally on every render and inject the result
 * without a length check.
 *
 * @param scope Optional selector every rule is nested under. Omit it on a
 *   published page (the rules SHOULD be global, exactly like the declared
 *   colors they stand in for). Pass one — the builder passes `.sui-canvas` — to
 *   confine a preview's colors to the previewed region so they never repaint the
 *   editor's own chrome.
 */
export function customColorCss(theme: Theme, scope = ""): string {
  return serializeRules(customColorRules(theme), scope);
}

/**
 * A theme's tokens as a CSS rule — the `--color-*` / `--radius-*` / `--font-*`
 * custom properties a `[data-theme]` island resolves against.
 *
 * Goes through `resolveThemeTokens`, so every role carries a contrast-MEASURED
 * `-content` foreground rather than falling back to silicaui's CSS lightness
 * threshold. A color the author invents is measured the same way a shipped
 * preset is.
 *
 * @param selector The rule's selector. Defaults to `:root`; pass
 *   `[data-theme="acme"]` for a named island, or a container selector to scope a
 *   preview.
 * @param mode Which side of the theme to emit. A theme carrying a `dark` delta
 *   is two calls, one per mode, under whichever selectors the host's dark
 *   strategy uses — this function takes no view on that.
 */
export function themeTokenCss(theme: Theme, selector = ":root", mode: "light" | "dark" = "light"): string {
  const tokens = resolveThemeTokens(theme, mode);
  const body = Object.entries(tokens)
    .filter(([k]) => k.startsWith("--"))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return body ? `${selector}{${body}}` : "";
}
