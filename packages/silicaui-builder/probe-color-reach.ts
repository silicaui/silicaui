/**
 * Isolated proof that a color INVENTED in the theme editor reaches everything —
 * no React, no DOM.
 *
 * Two defects are locked down here, both of which made the N-color promise true
 * at build time and quietly false in the builder, which is the one place a color
 * is actually invented:
 *
 *   1. The runtime cascade regenerated ONLY `btn-<c>`, because Button's mapping
 *      was the sole one factored out of its module. A live `brand` painted
 *      buttons and silently skipped Badge/Alert/Input/Tabs and 30 others.
 *   2. A color added while the theme was in DARK mode was written to
 *      `theme.dark`, but `rolesOf` scanned `theme.tokens` alone — so the role was
 *      invisible to the palette, the Inspector swatches, and the cascade, while
 *      the color picker could still edit it.
 */
import { customColorCss, themeVars } from "./src/site/color-cascade";
import { rolesOf, SEMANTIC_ROLES } from "@wizeworks/silicaui-html";
import type { Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

const BASE: Theme = {
  name: "probe",
  tokens: {
    "--color-base-100": "oklch(98% 0 0)",
    "--color-base-content": "oklch(20% 0 0)",
    "--color-primary": "oklch(60% 0.15 250)",
  },
};

const withBrand: Theme = { ...BASE, tokens: { ...BASE.tokens, "--color-brand": "oklch(62% 0.16 30)" } };

// ── 1. the cascade covers EVERY colored family, not just buttons ─────────────
console.log("a live color reaches every colored component");
{
  const css = customColorCss(withBrand, ".sui-canvas");

  // One representative per component family the plugin colors at build time.
  // If a family is added to COLOR_VARIANTS it should be added here too.
  const FAMILIES = [
    "btn-brand",
    "badge-brand",
    "alert-brand",
    "input-brand",
    "select-brand",
    "textarea-brand",
    "pin-input-cell-brand",
    "progress-brand",
    "avatar-brand",
    "step-brand",
    "link-brand",
    "rating-brand",
    "pagination-brand",
    "chat-bubble-brand",
    "range-brand",
    "status-brand",
    "dock-brand",
    "meter-brand",
    "toggle-group-brand",
    "slider-brand",
    "switch-brand",
    "filter-brand",
    "multi-select-brand",
    "segment-field-brand",
    "calendar-brand",
    "data-table-brand",
    "tag-input-brand",
    "wizard-brand",
    "wordmark-brand",
    "sidebar-brand",
    "tabs-brand",
    "checkbox-brand",
    "radio-brand",
    "toggle-brand",
  ];
  const missing = FAMILIES.filter((c) => !css.includes(`.${c}{`));
  check(`all ${FAMILIES.length} component families emit a brand variant`, missing.length === 0);
  if (missing.length) console.log(`      missing: ${missing.join(", ")}`);

  // Toast keys off `data-type`, not a class.
  check("toast emits its data-type variant", css.includes('.toast[data-type="brand"]{'));

  // The utility trio + the `-content` ink, matching build-time `colorUtilities`.
  for (const u of ["text-brand", "bg-brand", "border-brand"]) {
    check(`utility .${u}`, css.includes(`.${u}{`));
  }
  check("utility .text-brand-content (the legible ink ON brand)", css.includes(".text-brand-content{"));

  check("every rule is scoped to the container", !css.split("\n").some((l) => l && !l.startsWith(".sui-canvas ")));
  check("a theme with no custom color emits nothing", customColorCss(BASE, ".sui-canvas") === "");
  // Semantic roles are already compiled — regenerating them would be dead weight.
  check("semantic roles are not re-emitted", !css.includes(".btn-primary{"));
}

// ── 2. a color added in DARK mode is a real role ─────────────────────────────
console.log("\na color added while in dark mode is fully wired");
{
  // Exactly what ThemeEditor.addColor now writes from dark mode: base token
  // seeded, dark override on top.
  const darkAdded: Theme = {
    ...BASE,
    mode: "dark",
    tokens: { ...BASE.tokens, "--color-brand": "oklch(62% 0.16 260)" },
    dark: { "--color-brand": "oklch(70% 0.16 260)" },
  };

  check("rolesOf surfaces it", rolesOf(darkAdded).includes("brand"));
  check("the cascade paints it", customColorCss(darkAdded, ".sui-canvas").includes(".badge-brand{"));
  check("the dark value wins in dark mode", themeVars(darkAdded)["--color-brand"] === "oklch(70% 0.16 260)");

  // The affordance-level half: a role declared ONLY in a dark override is still
  // a role (a theme pasted through the CSS modal can look like this).
  const darkOnly: Theme = { ...BASE, mode: "dark", dark: { "--color-ghost": "oklch(70% 0.1 300)" } };
  check("a dark-only role is still surfaced", rolesOf(darkOnly).includes("ghost"));
  check("a dark-only role still gets utilities", customColorCss(darkOnly, ".sui-canvas").includes(".bg-ghost{"));

  check("no duplicate roles when both modes declare one", rolesOf(darkAdded).filter((r) => r === "brand").length === 1);
  check("semantic roles are unaffected", SEMANTIC_ROLES.every((r) => rolesOf(darkAdded).includes(r)));
}

console.log(failures ? `\n❌ ${failures} failure(s)\n` : "\n✅ N-color reach holds across every component and both modes\n");
process.exit(failures ? 1 : 0);
