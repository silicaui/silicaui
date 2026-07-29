/**
 * Isolated proof for the HOST-CONTRIBUTED theme shelves — no React, no DOM.
 * Covers the pure assembly in `themeShelves`: the shipped shelf intact with no
 * host, host shelves rendering ABOVE it, `hide` pruning by preset name / shelf
 * key / `"*"`, `hide` never touching the host's OWN shelves, name shadowing
 * (host wins, once, loudly), and duplicate host names collapsing rather than
 * putting two token bags under one `[data-theme]`.
 */
import { HIDE_ALL_SHIPPED, SHIPPED_THEMES_KEY, shippedThemeGroups, themeShelves } from "./src/site/theme-catalog";
import type { ThemeGroup } from "./src/site/theme-catalog";
import type { Theme } from "@wizeworks/silicaui-html";

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

const theme = (name: string, primary = "oklch(60% 0.15 250)"): Theme => ({
  name,
  tokens: { "--color-primary": primary, "--color-base-100": "oklch(98% 0 0)" },
});
const shelf = (key: string, label: string, themes: Theme[]): ThemeGroup => ({ key, label, themes });
const names = (groups: ThemeGroup[]): string[] => groups.flatMap((g) => g.themes.map((t) => t.name));
const group = (groups: ThemeGroup[], key: string) => groups.find((g) => g.key === key);

/** Run `fn` with console.warn captured, returning everything it logged. */
function captureWarnings(fn: () => void): string[] {
  const out: string[] = [];
  const real = console.warn;
  console.warn = (...args: unknown[]) => void out.push(args.join(" "));
  try {
    fn();
  } finally {
    console.warn = real;
  }
  return out;
}

const SHIPPED = shippedThemeGroups()[0]!.themes.map((t) => t.name);

// ── 1. no host: the shipped shelf, unchanged ─────────────────────────────────
console.log("the shipped shelf holds with no host adapter");
{
  const g = themeShelves();
  check("exactly one shelf", g.length === 1);
  check("it is the shipped shelf", g[0]?.key === SHIPPED_THEMES_KEY);
  check("every shipped preset is present", SHIPPED.every((n) => names(g).includes(n)));
  check("an empty contribution behaves the same", names(themeShelves({})).length === SHIPPED.length);
}

// ── 2. host shelves render ABOVE the shipped presets ─────────────────────────
console.log("host shelves come first, labels verbatim");
{
  const g = themeShelves({ extend: [shelf("acme", "Acme brand", [theme("acme-light"), theme("acme-dark")])] });
  check("the host shelf is first", g[0]?.key === "acme");
  check("its label is preserved verbatim", g[0]?.label === "Acme brand");
  check("both host themes come through", names([g[0]!]).join() === "acme-light,acme-dark");
  check("the shipped shelf still follows", g[1]?.key === SHIPPED_THEMES_KEY);
  check("shipped presets survive alongside", SHIPPED.every((n) => names(g).includes(n)));
}

// ── 3. multiple host shelves keep their order; same-key groups merge ─────────
console.log("multiple shelves order and merge predictably");
{
  const g = themeShelves({
    extend: [
      shelf("acme", "Acme brand", [theme("acme-light")]),
      shelf("seasonal", "Seasonal", [theme("holiday")]),
      shelf("acme", "Acme brand", [theme("acme-mono")]),
    ],
  });
  check("declared order is kept", g.map((x) => x.key).join() === `acme,seasonal,${SHIPPED_THEMES_KEY}`);
  check("a same-key repeat merges in rather than adding a second shelf", names([group(g, "acme")!]).join() === "acme-light,acme-mono");
  check("the other shelf is untouched", names([group(g, "seasonal")!]).join() === "holiday");
}

// ── 4. hide prunes shipped by name, by shelf key, and wholesale ──────────────
console.log("hide prunes the shipped shelf three ways");
{
  const one = SHIPPED[0]!;
  const byName = themeShelves({ hide: [one] });
  check(`a preset hides by name (${one})`, !names(byName).includes(one));
  check("its siblings survive", names(byName).length === SHIPPED.length - 1);

  check("the whole shelf hides by key", themeShelves({ hide: [SHIPPED_THEMES_KEY] }).length === 0);
  check('"*" hides every shipped shelf', themeShelves({ hide: [HIDE_ALL_SHIPPED] }).length === 0);

  // The white-label case: only the host's own themes, nothing of ours.
  const white = themeShelves({ extend: [shelf("acme", "Acme brand", [theme("acme-light")])], hide: [HIDE_ALL_SHIPPED] });
  check("white-label leaves ONLY the host shelf", white.length === 1 && white[0]?.key === "acme");
  check("the host's own themes are NOT swept up by \"*\"", names(white).join() === "acme-light");

  // A shelf emptied by name-hiding falls away rather than rendering a bare heading.
  const emptied = themeShelves({ hide: SHIPPED });
  check("a shelf emptied by hide falls away", emptied.length === 0);
}

// ── 5. hide never reaches into the host's own shelves ────────────────────────
console.log("hide is scoped to shipped entries");
{
  const g = themeShelves({ extend: [shelf("acme", "Acme brand", [theme("acme-light")])], hide: ["acme", "acme-light"] });
  check("a host shelf key in `hide` does not drop the host shelf", !!group(g, "acme"));
  check("a host theme name in `hide` does not drop the theme", names(g).includes("acme-light"));
}

// ── 6. a host theme SHADOWS a shipped preset of the same name (host wins) ────
console.log("name collisions resolve host-wins, and say so");
{
  const collide = SHIPPED[0]!;
  const warnings = captureWarnings(() => {
    const g = themeShelves({ extend: [shelf("acme", "Acme brand", [theme(collide, "oklch(50% 0.2 20)")])] });
    check(`only one row named ${collide}`, names(g).filter((n) => n === collide).length === 1);
    check("the surviving one is the host's", group(g, "acme")!.themes[0]!.tokens["--color-primary"] === "oklch(50% 0.2 20)");
    check("the rest of the shipped shelf is unaffected", names(g).length === SHIPPED.length);
  });
  check("the shadowing is logged, not silent", warnings.some((w) => w.includes(collide) && w.includes("shadows")));
}

// ── 7. duplicate host names collapse — one name, one [data-theme] ────────────
console.log("a duplicate host theme name collapses to one row");
{
  const warnings = captureWarnings(() => {
    const g = themeShelves({
      extend: [shelf("acme", "Acme brand", [theme("dupe", "oklch(60% 0.15 250)")]), shelf("seasonal", "Seasonal", [theme("dupe", "oklch(70% 0.1 90)")])],
    });
    check("the name appears exactly once", names(g).filter((n) => n === "dupe").length === 1);
    check("the FIRST shelf keeps it", group(g, "acme")!.themes[0]!.tokens["--color-primary"] === "oklch(60% 0.15 250)");
    check("a shelf emptied by the collapse falls away", !group(g, "seasonal"));
  });
  check("the collapse is logged", warnings.some((w) => w.includes("dupe") && w.includes("more than once")));
}

// ── 8. diagnostics are deduped, not per-render spam ──────────────────────────
console.log("diagnostics warn once per offending name");
{
  const contribution = { extend: [shelf("acme", "Acme brand", [theme("second-collision")])] };
  const shipped = shippedThemeGroups()[0]!;
  // Same name as a shipped preset, warned repeatedly: only the first call logs.
  const collide = { extend: [shelf("acme", "Acme brand", [theme(shipped.themes[1]!.name)])] };
  const first = captureWarnings(() => void themeShelves(collide));
  const second = captureWarnings(() => void themeShelves(collide));
  check("the first assembly warns", first.length === 1);
  check("a repeat assembly stays quiet", second.length === 0);
  check("an unrelated, clean contribution never warns", captureWarnings(() => void themeShelves(contribution)).length === 0);
}

console.log(failures === 0 ? "\nALL THEME-SHELF PROBES PASSED" : `\n${failures} THEME-SHELF PROBE(S) FAILED`);
if (failures) process.exit(1);
