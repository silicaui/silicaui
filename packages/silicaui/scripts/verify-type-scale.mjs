/**
 * The type scale has exactly ONE source of truth, and everything consumes it.
 *
 *   node verify-type-scale.mjs
 *
 * WHY THIS IS A PROBE. `text-*` sizes live in `theme.extend.fontSize`, which no
 * component module exports — so the MCP catalog generator can't scrape them the
 * way it scrapes `.btn`/`.display`. It imports `TYPE_SCALE` directly instead.
 * If someone re-inlines the scale into index.js (the pre-refactor shape), the
 * plugin and the documented catalog silently diverge: Tailwind emits one ladder,
 * the MCP describes another, and nothing errors. This asserts index.js keeps
 * consuming the shared module, and that the module's own invariants hold.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TYPE_SCALE } from "../src/type-scale.js";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const check = (cond, msg) => {
  console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failed++;
};

const index = readFileSync(join(pkgRoot, "src", "index.js"), "utf8");
check(/import\s*\{\s*TYPE_SCALE\s*\}\s*from\s*["']\.\/type-scale\.js["']/.test(index), "index.js imports TYPE_SCALE from ./type-scale.js");
check(/fontSize:\s*TYPE_SCALE\b/.test(index), "index.js registers `fontSize: TYPE_SCALE` (not a re-inlined ladder)");

// Module invariants — the anchor the whole ladder is documented against.
check(TYPE_SCALE.md?.[0] === "1rem", "text-md is 1rem (16px anchor)");
check(TYPE_SCALE.base?.[0] === TYPE_SCALE.md?.[0], "text-base is an alias of text-md");
check(Boolean(TYPE_SCALE["10xl"]), "scale reaches 10xl");
check(
  Object.values(TYPE_SCALE).every((v) => Array.isArray(v) && typeof v[0] === "string" && typeof v[1]?.lineHeight === "string"),
  "every step is [fontSize, { lineHeight }] (Tailwind fontSize shape)",
);

console.log(`  checked ${Object.keys(TYPE_SCALE).length} scale step(s)`);
console.log(failed ? `\n❌ ${failed} type-scale check(s) failed\n` : "\n✅ the type scale has one source of truth, consumed everywhere\n");
process.exit(failed ? 1 : 0);
