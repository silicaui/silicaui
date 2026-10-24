/**
 * Probe: the dev guard must use the literal `process.env.NODE_ENV` so bundlers can fold it.
 *
 *   pnpm --filter @wizeworks/silicaui-react build && node verify-dev-guard.mjs
 */
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./dist/lib/dev.js", import.meta.url), "utf8");
const optional = /process\?\./.test(src);
const literal = /process\.env\.NODE_ENV/.test(src);
console.log("Dev guard");
console.log(`  ${!optional ? "✓" : "✗"} no optional chain on process`);
console.log(`  ${literal ? "✓" : "✗"} literal process.env.NODE_ENV present`);
process.exit(optional || !literal ? 1 : 0);
