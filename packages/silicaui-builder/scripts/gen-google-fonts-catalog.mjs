// Bakes Google's public font-family metadata into src/site/react/google-fonts-catalog.ts
// — a static, zero-runtime-dependency list (same convention as gen-icons.mjs: fetch
// external data once, commit the output). Source: https://fonts.google.com/metadata/fonts
// (Google's own unauthenticated metadata endpoint, no API key). Re-run to refresh.
// Run: node scripts/gen-google-fonts-catalog.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../src/site/react/google-fonts-catalog.ts");
const SOURCE = "https://fonts.google.com/metadata/fonts";

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`fetch ${SOURCE} failed: ${res.status}`);
const data = await res.json();

const entries = data.familyMetadataList.map((f) => {
  const weightSet = new Set();
  let italic = false;
  for (const key of Object.keys(f.fonts ?? {})) {
    const isItalic = key.endsWith("i");
    if (isItalic) italic = true;
    const weight = Number.parseInt(key, 10);
    if (Number.isFinite(weight)) weightSet.add(weight);
  }
  const weights = [...weightSet].sort((a, b) => a - b);
  return {
    family: f.family,
    category: f.category ?? "Sans Serif",
    weights: weights.length ? weights : [400],
    italic,
    popularity: f.popularity ?? Number.MAX_SAFE_INTEGER,
  };
});

// Most popular first — a sensible default order for a searchable picker; Google's
// `popularity` is a 1-based rank (1 = most popular), not a score.
entries.sort((a, b) => a.popularity - b.popularity);
for (const e of entries) delete e.popularity;

const body = entries
  .map(
    (e) =>
      `  { family: ${JSON.stringify(e.family)}, category: ${JSON.stringify(e.category)}, weights: [${e.weights.join(", ")}], italic: ${e.italic} },`,
  )
  .join("\n");

const out = `/**
 * Google Fonts family catalog — baked from ${SOURCE} at build time (no API key, no
 * runtime dependency). Sorted by Google's own popularity ranking, most popular
 * first. Regenerate with \`node scripts/gen-google-fonts-catalog.mjs\`.
 *
 * DO NOT EDIT BY HAND.
 */
export interface GoogleFontEntry {
  family: string;
  category: string;
  /** Numeric weights this family ships, e.g. [400, 700]. */
  weights: number[];
  /** Whether an italic variant exists for at least one weight. */
  italic: boolean;
}

export const googleFontsCatalog: readonly GoogleFontEntry[] = [
${body}
];
`;

writeFileSync(OUT, out);
console.log(`Wrote ${entries.length} families to ${OUT}`);
