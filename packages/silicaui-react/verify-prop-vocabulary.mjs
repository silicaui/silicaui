/**
 * Static probe: `size` must always mean the SAME thing.
 *
 * A design system's value is that one prop name means one concept everywhere.
 * `size` drifted into three: the `xs`–`xl` token scale (most components), a raw
 * CSS length (`RadialProgress`, where `size="lg"` type-checked and emitted the
 * invalid `--size: lg`, silently collapsing the ring), and a numeric heading
 * scale (`Heading`). Those two were renamed to `diameter` and `visualLevel`.
 *
 * Typecheck can't catch the next one — `size?: string` is perfectly valid TS.
 * So this reads the source and asserts every `size` prop resolves to the scale,
 * or to a documented SUBSET of it (some components genuinely only ship `sm`/`lg`
 * in CSS, and a type that promises `xs` the stylesheet can't honor is its own
 * papercut).
 *
 *   node verify-prop-vocabulary.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const SRC = fileURLToPath(new URL("./src", import.meta.url));
const SCALE = new Set(["xs", "sm", "md", "lg", "xl"]);

let failed = 0;
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  failed++;
};

/** Is a type's right-hand side the control scale, or a subset of it? */
function isScale(rhs) {
  const t = rhs.trim().replace(/;$/, "");
  if (t === "SilicaSize") return true;
  const parts = t.split("|").map((p) => p.trim());
  if (!parts.length) return false;
  return parts.every((p) => {
    const m = /^"([^"]+)"$/.exec(p);
    return m && SCALE.has(m[1]);
  });
}

// Typographic components (Heading/Display/Text) are a DELIBERATE exception: their
// `size` is the type/display scale, not the xs–xl control scale. The rule `size`
// enforces is still "a step on a silicaui scale, never a raw length or arbitrary
// string" (the RadialProgress bug) — the scale is just typographic here. A heading
// h-level (1–6), a display step (`display-1..3`), or a `text-*` step all qualify.
const TYPE_SCALE = new Set([...SCALE, "base", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl", "10xl"]);
function isTypographicSize(rhs) {
  const t = rhs.trim().replace(/;$/, "");
  const parts = t.split("|").map((p) => p.trim());
  if (!parts.length) return false;
  return parts.every((p) => {
    if (/^[1-6]$/.test(p)) return true; // h-level / display step
    if (p === "HeadingLevel" || p === "DisplayStep") return true;
    if (/^`display-\$\{DisplayStep\}`$/.test(p)) return true; // template → display-1..3
    const m = /^"([^"]+)"$/.exec(p);
    return Boolean(m) && (m[1] === "display" || /^display-[123]$/.test(m[1]) || TYPE_SCALE.has(m[1]));
  });
}

const files = readdirSync(SRC).filter((f) => f.endsWith(".tsx"));
let checked = 0;

// Type aliases are resolved package-wide, not per file: several components
// (Button, Badge) import their `XSize` from lib/*-classes.ts, which the
// `/server` entry also needs, so the alias genuinely lives elsewhere.
const aliases = new Map();
const libDir = join(SRC, "lib");
const sources = [
  ...files.map((f) => join(SRC, f)),
  ...readdirSync(libDir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
    .map((f) => join(libDir, f)),
];
for (const p of sources) {
  for (const m of readFileSync(p, "utf8").matchAll(/export type (\w+)\s*=\s*([^;]+);/g)) {
    aliases.set(m[1], m[2]);
  }
}

// `size` on the typographic components is the type/display scale, not xs–xl.
const TYPOGRAPHIC_FILES = new Set(["typography.tsx"]);

for (const file of files) {
  const src = readFileSync(join(SRC, file), "utf8");
  const typographic = TYPOGRAPHIC_FILES.has(file);

  for (const m of src.matchAll(/^\s*size\?:\s*([^;]+);/gm)) {
    checked++;
    const declared = m[1].trim();
    const resolved = aliases.get(declared) ?? declared;
    const ok = typographic ? isTypographicSize(resolved) : isScale(resolved);
    if (!ok) {
      fail(
        `${file}: \`size?: ${declared}\`${declared === resolved ? "" : ` (= ${resolved.trim()})`} ` +
          `is not a recognized silicaui size scale. \`size\` means a step on a scale everywhere in ` +
          `Silica — the xs–xl control scale, or the type/display scale on typographic components — ` +
          `never a CSS length or arbitrary string. If it means something else, give it its own name.`,
      );
    }
  }
}

console.log(`  checked ${checked} \`size\` prop declaration(s) across ${files.length} files`);
console.log(
  failed
    ? `\n❌ ${failed} prop-vocabulary check(s) failed\n`
    : "\n✅ `size` means a silicaui scale everywhere (xs–xl for controls, type/display for typographic)\n",
);
process.exit(failed ? 1 : 0);
