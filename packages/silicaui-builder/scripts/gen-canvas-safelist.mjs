/**
 * Generate `src/site/canvas-safelist.ts` — the literal cross product of the
 * canvas vocabulary and the authoring breakpoints.
 *
 *   node scripts/gen-canvas-safelist.mjs          # write
 *   node scripts/gen-canvas-safelist.mjs --check  # fail if stale (CI)
 *
 * WHY THIS FILE HAS TO EXIST. Tailwind finds classes by scanning source files as
 * TEXT. The harness points the scanner at `src/**`, so every class the canvas can
 * wear must appear there as a literal string — which is why the vocab lists are
 * written out longhand rather than composed.
 *
 * Per-breakpoint authoring breaks that by construction: the Inspector composes
 * `${prefix}${cls}` at runtime, and a composed string is invisible to a text
 * scan. The class would be written into the document, look correct in the
 * Navigator and the raw Classes field, and have no CSS behind it — the exact
 * silent failure the whole feature is meant to remove. So the product is
 * enumerated here, once, mechanically.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, "..");
const OUT = join(pkg, "src", "site", "canvas-safelist.ts");

// Bundle the two vocab modules so this script reads the SAME lists the Inspector
// does. Re-declaring them here is how the two silently drift apart.
const tmp = mkdtempSync(join(tmpdir(), "sui-safelist-"));
const entry = join(tmp, "entry.ts");
writeFileSync(
  entry,
  `import { CANVAS_UTILITY_CLASSES } from ${JSON.stringify(join(pkg, "src/site/canvas-vocab.ts").replace(/\\/g, "/"))};\n` +
    `import { BREAKPOINT_CHOICES } from ${JSON.stringify(join(pkg, "src/site/class-tokens.ts").replace(/\\/g, "/"))};\n` +
    `console.log(JSON.stringify({ classes: CANVAS_UTILITY_CLASSES, prefixes: BREAKPOINT_CHOICES.map((c) => c.prefix) }));\n`,
);
const bundle = join(tmp, "out.mjs");
execFileSync("npx", ["esbuild", entry, "--bundle", "--platform=node", "--format=esm", "--log-level=warning", `--outfile=${bundle}`], {
  cwd: pkg,
  shell: process.platform === "win32",
});
const { classes, prefixes } = JSON.parse(execFileSync(process.execPath, [bundle]).toString());
rmSync(tmp, { recursive: true, force: true });

// Base ("") is already covered — those literals live in `canvas-vocab.ts`.
const variants = prefixes.filter(Boolean);
const combos = variants.flatMap((p) => classes.map((c) => `${p}${c}`));

const body = `/**
 * GENERATED — do not edit. Run \`pnpm gen:safelist\` (or
 * \`node scripts/gen-canvas-safelist.mjs\`) after changing \`canvas-vocab.ts\`
 * or the breakpoint ladder; \`pnpm verify:safelist\` fails when it's stale.
 *
 * Every canvas utility at every authoring BREAKPOINT, written out as literal
 * strings so Tailwind's source scan can see them. The Inspector composes
 * \`\${prefix}\${cls}\` at runtime, and a composed string is invisible to a text
 * scan — the class would land in the document with no CSS behind it.
 *
 * Nothing imports this for its VALUE. It exists to be read as text by the
 * scanner; the export keeps it a real module rather than a comment block that a
 * formatter or a dead-code pass could quietly discard.
 *
 * ${variants.length} breakpoint(s) x ${classes.length} utilities = ${combos.length} classes.
 */
export const CANVAS_RESPONSIVE_SAFELIST: readonly string[] = [
${combos.map((c) => `  "${c}",`).join("\n")}
];
`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUT, "utf8");
  } catch {
    /* missing counts as stale */
  }
  if (current.replace(/\r\n/g, "\n") !== body) {
    console.error("✗ canvas-safelist.ts is STALE — run `pnpm gen:safelist`");
    process.exit(1);
  }
  console.log(`✅ canvas safelist is current (${combos.length} classes)`);
} else {
  writeFileSync(OUT, body);
  console.log(`✓ wrote ${combos.length} responsive classes → src/site/canvas-safelist.ts`);
}
