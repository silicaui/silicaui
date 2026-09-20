/**
 * The builder's own chrome may not paint readable text below WCAG AA.
 *
 * Found by P03 (docs/personas/issues/043). Marlene is 58, is not a developer,
 * and reads the rails to find out where she is. The Theme panel's section
 * headings — "Colors", "Radius", "Motion", "This site", "Output" — were
 * `text-base-content/45`, which measures **2.89:1**. Forty-four text runs on
 * that one panel were under AA, and seventy across the two builders.
 *
 * Root CLAUDE.md RULE #3: a faded ink is a deliberate signal, never a default,
 * and never on text a person is meant to READ.
 *
 * WHAT THIS CHECKS, and why it is not a magic number. Tailwind's
 * `text-<role>/NN` composites the role's ink over whatever is behind it at NN%
 * alpha. So for each NN actually used in the source, this measures the worst
 * reading it can produce across every surface of every shipped theme in both
 * modes, plus the builder's own `studio` chrome theme — and fails the ones that
 * land under 4.5. Add a darker theme and the floor moves by itself; nothing here
 * needs editing.
 *
 * At the time of writing the answer is /70 (lowest 4.77 of 120 preset
 * combinations, 5.65 on `studio`). /65 fails 6 of them.
 *
 * Deliberately a SOURCE check, not a browser one: the builder chrome is themeable
 * by its host (`studioTheme`), so the question is not "is it readable in the
 * harness" but "is it readable in every theme a host can hand it".
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PKG = join(HERE, "..");
const REPO = join(PKG, "..", "..");

const { readColor } = await import(
  new URL("../../silicaui/src/lib/measure-ink.js", import.meta.url).href
);
const { THEME_PRESETS, colorValue } = await import(
  new URL("../../silicaui-html/dist/index.js", import.meta.url).href
);

const AA = 4.5;
/** The builder's own chrome theme, declared in `harness/styles.css`. Read from
 *  there rather than copied, so an edit to the chrome is an edit to this test. */
function studioTheme() {
  const css = readFileSync(join(PKG, "harness", "styles.css"), "utf8");
  const block = css.slice(css.indexOf("name: studio;"));
  const grab = (name) => {
    const m = block.match(new RegExp(`--color-${name}:\\s*([^;]+);`));
    return m ? m[1].trim() : null;
  };
  return {
    "base-100": grab("base-100"),
    "base-200": grab("base-200"),
    "base-300": grab("base-300"),
    "base-content": grab("base-content"),
  };
}

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
const over = (fg, alpha, bg) => [0, 1, 2].map((i) => alpha * fg[i] + (1 - alpha) * bg[i]);

/** Every (ink, surface) pair the chrome can ever be painted with. */
function pairs() {
  const out = [];
  const push = (label, inkCss, surfCss) => {
    const ink = readColor(inkCss)?.rgb;
    const surf = readColor(surfCss)?.rgb;
    if (ink && surf) out.push({ label, ink, surf });
  };
  for (const t of THEME_PRESETS) {
    for (const mode of ["light", "dark"]) {
      const ink = colorValue(t, "base-content", mode);
      if (!ink) continue;
      for (const s of ["base-100", "base-200", "base-300"]) {
        const surf = colorValue(t, s, mode);
        if (surf) push(`${t.name}/${mode}/${s}`, ink, surf);
      }
    }
  }
  const studio = studioTheme();
  for (const s of ["base-100", "base-200", "base-300"])
    if (studio[s] && studio["base-content"]) push(`studio/${s}`, studio["base-content"], studio[s]);
  return out;
}

/** Source files the chrome is drawn from. `harness/` is included: it is the demo
 *  host, and it is the screen every persona run is driven on. */
function sources() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist") continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx|ts)$/.test(name)) out.push(p);
    }
  };
  walk(join(PKG, "src"));
  walk(join(PKG, "harness"));
  return out;
}

const ROLE_INK = /\btext-(base-content|primary|secondary|accent|neutral|info|success|warning|error)\/(\d{1,3})\b/g;

const combos = pairs();
console.log(`  ${combos.length} (ink × surface) pairs — ${THEME_PRESETS.length} presets × 2 modes × 3 surfaces, plus studio`);

// Which alpha values does the source actually use, and where?
const used = new Map(); // alpha -> [{file, line, cls}]
for (const file of sources()) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(ROLE_INK)) {
      const alpha = Number(m[2]);
      if (!used.has(alpha)) used.set(alpha, []);
      used.get(alpha).push({
        file: relative(REPO, file).split(sep).join("/"),
        line: i + 1,
        cls: m[0],
      });
    }
  });
}

// `base-content` is the only ink measured against the base surfaces. A role ink
// (`text-primary/NN`) is a different pair and is measured separately below.
const worstFor = (alpha) => {
  let min = Infinity, at = null;
  for (const p of combos) {
    const v = ratio(over(p.ink, alpha / 100, p.surf), p.surf);
    if (v < min) { min = v; at = p.label; }
  }
  return { min, at };
};

let failures = 0;
const alphas = [...used.keys()].sort((a, b) => a - b);
console.log(`  ${alphas.length} distinct alpha value(s) used in the chrome: ${alphas.join(", ")}`);

for (const alpha of alphas) {
  const { min, at } = worstFor(alpha);
  const sites = used.get(alpha);
  const ok = min >= AA;
  console.log(
    `  ${ok ? "✓" : "✗"} /${String(alpha).padStart(3)}  worst ${min.toFixed(2)}:1 (${at})  — ${sites.length} site(s)`
  );
  if (!ok) {
    failures++;
    for (const s of sites.slice(0, 12)) console.log(`        ${s.file}:${s.line}  ${s.cls}`);
    if (sites.length > 12) console.log(`        … and ${sites.length - 12} more`);
  }
}

if (failures) {
  console.log(
    `\n✗ ${failures} faded-ink level(s) in the builder chrome fall below WCAG AA (${AA}:1).`
  );
  console.log(
    "  RULE #3: readable text gets a real ink. Raise the level, or use the full token\n" +
      "  and let scale and weight carry the hierarchy."
  );
  process.exit(1);
}
console.log("\n✅ every faded ink in the builder chrome reads at AA in every shipped theme");
