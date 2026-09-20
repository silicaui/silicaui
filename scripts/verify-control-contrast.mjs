/**
 * A CONTROL painted as a faded ink must still be visible: 3:1 against the
 * surface behind it, in every theme the system ships, in both modes.
 *
 * WHY 3:1 AND NOT 4.5. This is WCAG 2.1 SC 1.4.11 Non-text Contrast, which
 * governs the visual information needed to identify a control and its states.
 * `verify-readable-ink.mjs` already guards the 4.5:1 that applies to words; this
 * is the other half of RULE #3, on the parts of a component that carry meaning
 * without carrying text — a carousel dot, a scrollbar thumb, a drag grip.
 *
 * WHY IT IS A PROBE. Nothing errors and nothing looks wrong in the source: a
 * scrollbar thumb at `base-content 25%` is a perfectly ordinary line of CSS, and
 * it measured **1.60:1 at worst — under 3:1 in all 120 combinations**, which is
 * a scrollbar you cannot see even after it has faded in. The carousel's inactive
 * dot, the control that navigates it, was under in 57 of 120. Neither is
 * visible as a defect until somebody composites the alpha over every surface of
 * every theme, which is what this does (docs/personas/issues/108).
 *
 * It was found as a LEAD rather than a number: P07 noticed both faded "the same
 * way the drag handle did", tried to measure it in a browser, could not pin down
 * the docs page's theme state, and refused to publish a figure it could not
 * stand behind. That was right, and it is why this is a SOURCE check — the
 * question is not "is it visible in one page's theme" but "is it visible in
 * every theme a consumer can pick".
 *
 * DEFAULT STRICT, EXEMPT BY REVIEW. Every faded-ink background is checked. A
 * rule that is a surface TINT rather than a control goes in `NOT_A_CONTROL`
 * with its reason — the same discipline `verify-readable-ink.mjs` uses for its
 * pattern list, and for the same reason: an exemption nobody can see is how a
 * real defect hides inside a green run.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const componentsDir = join(REPO, "packages", "silicaui", "src", "components");

const { readColor } = await import(
  new URL("../packages/silicaui/src/lib/measure-ink.js", import.meta.url).href
);
const { THEME_PRESETS, colorValue } = await import(
  new URL("../packages/silicaui-html/dist/index.js", import.meta.url).href
);

const BAR = 3.0;

/**
 * `module|selector` pairs that paint a SURFACE rather than a control — a zebra
 * stripe, a track behind something else. A tint is meant to be barely there;
 * the thing ON it is what has to be visible, and that is checked where it is
 * painted.
 */
const NOT_A_CONTROL = new Set([
  // HOVER TINTS. A hover highlight is not information required to identify a
  // component: the pointer is already sitting on it, and the row's own text and
  // borders are unchanged. 1.4.11 is about telling a control apart from its
  // background and telling its states apart — which is why FOCUS rings are
  // guarded (see the focus-ring work in issues/092) and a mouse-only tint is
  // not. Both of these were read before they went in here.
  "table|& tbody tr:hover",
  "toggle-group|&:hover:not([data-pressed]",
]);

const q = (v) => Math.round(Math.max(0, Math.min(255, v)));
const lum = (rgb) => {
  const s = rgb.map((v) => {
    const c = q(v) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
};
const ratio = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
/** `color-mix(in oklab, INK N%, transparent)` composites over the backdrop in sRGB. */
const over = (ink, alpha, surf) => [0, 1, 2].map((i) => alpha * ink[i] + (1 - alpha) * surf[i]);

// The instrument proves itself before it judges anything.
const W = [255, 255, 255], K = [0, 0, 0];
if (ratio(K, W).toFixed(1) !== "21.0" || ratio(W, W).toFixed(1) !== "1.0") {
  console.error("✗ contrast maths is wrong: black-on-white and white-on-white do not read 21.0 and 1.0");
  process.exit(1);
}

/** Every surface of every shipped theme, in both modes. */
const surfaces = [];
for (const t of THEME_PRESETS) {
  for (const mode of ["light", "dark"]) {
    const inkCss = colorValue(t, "base-content", mode);
    const ink = inkCss && readColor(inkCss)?.rgb;
    if (!ink) continue;
    for (const s of ["base-100", "base-200", "base-300"]) {
      const surfCss = colorValue(t, s, mode);
      const surf = surfCss && readColor(surfCss)?.rgb;
      if (surf) surfaces.push({ label: `${t.name}/${mode}/${s}`, ink, surf });
    }
  }
}
if (surfaces.length === 0) {
  console.error("✗ no theme surfaces were read — build @wizeworks/silicaui-html first");
  process.exit(1);
}

const MIX = /color-mix\(in oklab, var\(--color-base-content\) (\d+)%, transparent\)/;

const failures = [];
const exempt = [];
let checked = 0;

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const name = file.replace(/\.js$/, "");
  const lines = readFileSync(join(componentsDir, file), "utf8").split("\n");
  let selector = "(base)";

  lines.forEach((line, i) => {
    const sel =
      line.match(/^\s*\[(.+)\]:\s*\{/) || line.match(/^\s*['"](&[^'"]*)['"]:\s*\{/);
    if (sel) selector = sel[1].replace(/sel\(/g, "").replace(/[`"']/g, "").replace(/\)/g, "");

    // The value can sit on the same line or wrap to the next one.
    const isBg = /background(?:Color)?:/.test(line);
    const here = line.match(MIX);
    const next = isBg && !here ? (lines[i + 1] ?? "").match(MIX) : null;
    const m = here && isBg ? here : next;
    if (!m) return;

    const key = `${name}|${selector}`;
    const alpha = Number(m[1]) / 100;
    if (NOT_A_CONTROL.has(key)) {
      exempt.push(`${key} @ ${m[1]}%`);
      return;
    }
    checked++;
    let worst = Infinity, worstAt = "", under = 0;
    for (const s of surfaces) {
      const r = ratio(over(s.ink, alpha, s.surf), s.surf);
      if (r < BAR) under++;
      if (r < worst) { worst = r; worstAt = s.label; }
    }
    if (under > 0) {
      failures.push(
        `${file}:${i + 1} \`${selector}\` paints a control at ${m[1]}% ink — ` +
          `worst ${worst.toFixed(2)}:1 at ${worstAt}, under 3:1 in ${under} of ${surfaces.length} ` +
          `theme/mode/surface combinations. Raise the alpha (55% clears all of them), ` +
          `or add it to NOT_A_CONTROL in this script with a reason if it is a surface tint.`,
      );
    }
  });
}

for (const f of failures) console.error(`  ✗ ${f}`);
console.log(`  ${checked} control(s) checked against ${surfaces.length} theme/mode/surface combinations`);
if (exempt.length) console.log(`  ${exempt.length} surface tint(s) exempt: ${exempt.join(", ")}`);
if (failures.length) {
  console.error(`\n❌ ${failures.length} control(s) below WCAG 1.4.11's 3:1. See docs/personas/issues/108.`);
  process.exit(1);
}
console.log("✅ every faded-ink control reads at 3:1 in every shipped theme");
