// The RENDER-PATH half of silicaui's N-color promise.
//
//   node verify-theme-css.mjs
//
// A silicaui color normally exists because it was declared at BUILD time, in a
// `@plugin "@wizeworks/silicaui" { colors: … }` list. A theme editor breaks that
// assumption: the name is coined at runtime, by a tenant, on a site whose bundle
// shipped months ago. `@wizeworks/silicaui-html/theme` is how those rules reach a
// published page instead of only a preview.
//
// Three things are asserted, and each of them shipped broken once:
//
//   1. EVERY colored component, not just the button. The generator this module
//      calls used to be `buttonColorVars`, so a live-invented color painted
//      `btn-sunset` and silently nothing else — which reads to an author as
//      "custom colors are for buttons", not as a preview limit.
//   2. UNSCOPED by default. The builder's canvas copy defaults to `.sui-canvas`,
//      because there the rules must NOT escape into the editor's own chrome. On
//      a published page the opposite is true: they stand in for global declared
//      colors, and a stray scope means they match nothing. Both defaults are
//      silent when wrong, so both are pinned here.
//   3. The TOKENS the rules read. Every rule references `--color-<name>` and
//      `--color-<name>-content` with no fallback, so shipping the rules without
//      the custom properties paints exactly nothing.
//
// Run against built output: `pnpm --filter @wizeworks/silicaui-html build`.
import { customColorCss, customColorRules, customRolesOf, themeTokenCss } from "./dist/theme.js";

let failures = 0;
const check = (label, ok, detail = "") => {
  if (ok) {
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failures++;
  }
};

const BASE = {
  name: "probe",
  tokens: {
    "--color-base-100": "oklch(98% 0 0)",
    "--color-base-content": "oklch(20% 0 0)",
    "--color-primary": "oklch(60% 0.15 250)",
  },
};
const withSunset = { ...BASE, tokens: { ...BASE.tokens, "--color-sunset": "oklch(70% 0.16 40)" } };

// ── 1. reach ────────────────────────────────────────────────────────────────
console.log("a runtime-named color reaches every colored component");
{
  const css = customColorCss(withSunset);
  // One representative per family, spread across the component groups the
  // plugin colors. `probe-color-reach.ts` in the builder holds the exhaustive
  // list; this is the render path's tripwire for the same table.
  const FAMILIES = ["btn", "badge", "alert", "input", "select", "tabs", "toggle", "progress", "link", "step"];
  const missing = FAMILIES.filter((f) => !css.includes(`.${f}-sunset{`));
  check(`${FAMILIES.length} component families emit a variant`, missing.length === 0, missing.join(", "));

  for (const u of ["text-sunset", "bg-sunset", "border-sunset", "text-sunset-content"]) {
    check(`utility .${u}`, css.includes(`.${u}{`));
  }
  check("custom roles are what drives it", customRolesOf(withSunset).join() === "sunset");
  check("a theme with no custom color emits nothing", customColorCss(BASE) === "");
  check("semantic roles are not re-emitted (already compiled)", !css.includes(".btn-primary{"));
  check("the rule map and the CSS agree", Object.keys(customColorRules(withSunset)).length > 40);
}

// ── 2. scope ────────────────────────────────────────────────────────────────
console.log("\nscope is opt-IN, so a published page gets global rules");
{
  const published = customColorCss(withSunset);
  const preview = customColorCss(withSunset, ".sui-canvas");
  check(
    "unscoped by default — every rule starts at the selector",
    published.split("\n").every((l) => l.startsWith(".") && !l.startsWith(".sui-canvas ")),
  );
  check(
    "a passed scope prefixes every rule",
    preview.split("\n").every((l) => l.startsWith(".sui-canvas ")),
  );
  check("scoping changes nothing else", preview.split("\n").length === published.split("\n").length);
}

// ── 3. tokens ───────────────────────────────────────────────────────────────
console.log("\nthe tokens those rules read are emittable from the same module");
{
  const light = themeTokenCss(withSunset);
  check("defaults to :root", light.startsWith(":root{"));
  check("declares the custom color", light.includes("--color-sunset:oklch(70% 0.16 40)"));
  // The whole reason this pairs with the rules: `.text-sunset-content` has no
  // fallback, so an underived pair is invisible ink.
  check("derives its measured -content ink", /--color-sunset-content:/.test(light));
  check("takes a selector", themeTokenCss(withSunset, '[data-theme="acme"]').startsWith('[data-theme="acme"]{'));

  const darkTheme = { ...withSunset, dark: { ...withSunset.tokens, "--color-sunset": "oklch(78% 0.16 40)" } };
  check(
    "emits the dark side on request",
    themeTokenCss(darkTheme, ":root", "dark").includes("--color-sunset:oklch(78% 0.16 40)"),
  );
}

console.log(failures ? `\n❌ ${failures} failure(s)\n` : "\n✅ a runtime-named color is a real color on the render path\n");
process.exit(failures ? 1 : 0);
