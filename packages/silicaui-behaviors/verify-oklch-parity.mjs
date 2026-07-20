/**
 * The two OKLCH implementations must agree, exactly.
 *
 *   node verify-oklch-parity.mjs
 *
 * `silicaui-behaviors/src/oklch.ts` is a deliberate copy of
 * `silicaui-react/src/lib/oklch.ts` — this package is a zero-dependency runtime,
 * so importing the React package to share the math would pull React into every
 * vanilla page that hydrates a color picker.
 *
 * Duplicated math is a different risk from a duplicated string union. A drifted
 * union fails loudly the moment a marker doesn't match; drifted math keeps
 * running and just returns slightly different colors, so a picker would report
 * one hex in React and another in a static page for the same OKLCH input. This
 * sweeps the space and fails on ANY difference rather than trusting the copy.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cache = join(here, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });

/** Strip TS types crudely — both files are plain math with simple annotations. */
function loadAsJs(tsPath, outName) {
  const src = readFileSync(tsPath, "utf8")
    .replace(/^export interface [\s\S]*?^}$/gm, "")
    .replace(/: \[number, number, number\]/g, "")
    .replace(/: Oklch \| null/g, "")
    .replace(/: (number|string|boolean)\b/g, "")
    .replace(/ as [A-Za-z<>[\]]+/g, "");
  const out = join(cache, outName);
  writeFileSync(out, src);
  return import(`file://${out.replace(/\\/g, "/")}`);
}

const react = await loadAsJs(
  join(here, "..", "silicaui-react", "src", "lib", "oklch.ts"),
  "oklch-react.mjs",
);
const vanilla = await loadAsJs(join(here, "src", "oklch.ts"), "oklch-vanilla.mjs");

let failures = 0;
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  failures++;
};

let compared = 0;

// Exported CONSTANTS first. The sweep below bounds itself by `react.MAX_CHROMA`,
// so a drifted constant in the other copy would never be exercised by it — the
// probe reported "agree exactly" against a deliberately broken copy until this
// check existed.
for (const name of ["MAX_CHROMA"]) {
  compared++;
  if (react[name] !== vanilla[name]) {
    fail(`constant ${name}: ${react[name]} vs ${vanilla[name]}`);
  }
}

// Sweep the space rather than spot-check: drift is likeliest at the edges
// (near-black, near-white, out-of-gamut chroma, hue wraparound).
for (let l = 0; l <= 1.0001; l += 0.1) {
  for (let c = 0; c <= react.MAX_CHROMA + 1e-9; c += 0.05) {
    for (let h = 0; h < 360; h += 30) {
      compared++;
      const a = react.oklchToHex(l, c, h);
      const b = vanilla.oklchToHex(l, c, h);
      if (a !== b) fail(`oklchToHex(${l.toFixed(2)}, ${c.toFixed(3)}, ${h}) → ${a} vs ${b}`);

      if (react.inGamut(l, c, h) !== vanilla.inGamut(l, c, h)) {
        fail(`inGamut(${l.toFixed(2)}, ${c.toFixed(3)}, ${h}) disagrees`);
      }
      if (react.formatOklch(l, c, h) !== vanilla.formatOklch(l, c, h)) {
        fail(`formatOklch(${l.toFixed(2)}, ${c.toFixed(3)}, ${h}) disagrees`);
      }
    }
  }
}

// Round-trip through hex, including the 3-digit shorthand and junk input.
for (const hex of ["#000", "#fff", "#ff0000", "#00ff00", "#0000ff", "#3b82f6", "#7c3aed", "nonsense", "#12345"]) {
  compared++;
  const a = react.hexToOklch(hex);
  const b = vanilla.hexToOklch(hex);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    fail(`hexToOklch(${hex}) → ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  }
}

for (const s of ["oklch(0.7 0.15 250)", "oklch(70% 0.15 250)", "oklch(0.5 0.1 0)", "not a color"]) {
  compared++;
  const a = react.parseOklch(s);
  const b = vanilla.parseOklch(s);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    fail(`parseOklch(${s}) → ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  }
}

console.log(`  compared ${compared} case(s) across both implementations`);
console.log(
  failures
    ? `\n❌ ${failures} OKLCH parity failure(s) — the copies have drifted\n`
    : "\n✅ oklch parity: both implementations agree exactly\n",
);
process.exit(failures ? 1 : 0);
