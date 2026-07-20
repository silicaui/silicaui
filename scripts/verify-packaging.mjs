/**
 * Packaging invariants that fail SILENTLY if broken.
 *
 * Both checks here shipped broken to npm at least once, and neither surfaces
 * in `build` or `typecheck`:
 *
 *   1. A React-layer bundle missing `'use client'` builds fine and only
 *      explodes in a consumer's Next.js App Router app. tsup's `banner` looks
 *      like it would do this and silently doesn't (esbuild strips the
 *      directive), so the working implementation is a post-write text prepend
 *      that nothing else validates.
 *
 *   2. A `peerDependenciesMeta` entry with no matching `peerDependencies` key
 *      is a no-op. npm and pnpm both accept it without a word, so the intended
 *      "optional peer" warning never fires and a consumer who skipped the CSS
 *      package just gets an unstyled app.
 *
 *   3. A package with `verify:*` scripts but no aggregate `verify` is skipped
 *      by `pnpm -r verify` without comment, so its probes never run while the
 *      root command still reports success. Unrun probes are worse than none:
 *      they read as coverage.
 *
 * Run after `pnpm build`.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Packages whose main bundle MUST carry the client directive. */
const CLIENT_BUNDLES = [
  "silicaui-react",
  "silicaui-charts",
  "silicaui-table",
  "silicaui-editor",
  "silicaui-dnd",
  "silicaui-panels",
];

/** Entries that must NOT carry it — the whole reason they exist. */
const SERVER_BUNDLES = [["silicaui-react", "server.js"]];

const failures = [];
let checks = 0;

const read = (...p) => readFileSync(join(root, ...p), "utf8");

for (const pkg of CLIENT_BUNDLES) {
  checks++;
  const js = read("packages", pkg, "dist", "index.js");
  if (!js.startsWith("'use client';") && !js.startsWith('"use client";')) {
    failures.push(
      `${pkg}/dist/index.js is missing the 'use client' directive — ` +
        `importing it from a Next.js App Router page will throw.`,
    );
  }
}

for (const [pkg, file] of SERVER_BUNDLES) {
  checks++;
  const js = read("packages", pkg, "dist", file);
  if (js.startsWith("'use client';") || js.startsWith('"use client";')) {
    failures.push(
      `${pkg}/dist/${file} carries 'use client' but is the server-safe entry ` +
        `point — stamping it defeats its only purpose.`,
    );
  }
}

// Every declared optional peer needs a real peerDependencies range to attach
// to, or the declaration does nothing at all.
for (const pkg of [...CLIENT_BUNDLES, "silicaui", "silicaui-html", "silicaui-behaviors"]) {
  const json = JSON.parse(read("packages", pkg, "package.json"));
  for (const name of Object.keys(json.peerDependenciesMeta ?? {})) {
    checks++;
    if (!json.peerDependencies?.[name]) {
      failures.push(
        `${pkg}: peerDependenciesMeta declares "${name}" but peerDependencies ` +
          `has no matching entry — the optional-peer declaration is a silent no-op.`,
      );
    }
  }
}

// A package whose probes never run is worse than a package with no probes: it
// reads as covered. The root `verify` is `pnpm -r verify`, which SILENTLY SKIPS
// any package without a `verify` script — so a package can accumulate
// `verify:*` scripts that nothing ever invokes. That already happened twice:
// six packages shipped unrun suites, and later silicaui-builder reached TEN
// `verify:*` scripts with no aggregate at all. Both were invisible because the
// root run still reported success.
for (const dir of readdirSync(join(root, "packages"))) {
  const manifest = join(root, "packages", dir, "package.json");
  if (!existsSync(manifest)) continue;
  const scripts = JSON.parse(readFileSync(manifest, "utf8")).scripts ?? {};
  const suites = Object.keys(scripts).filter((k) => k.startsWith("verify:"));
  if (!suites.length) continue;

  checks++;
  if (!scripts.verify) {
    failures.push(
      `${dir}: has ${suites.length} verify:* script(s) but no aggregate \`verify\`, ` +
        `so \`pnpm -r verify\` skips the package entirely: ${suites.join(", ")}`,
    );
    continue;
  }
  const missed = suites.filter((s) => !scripts.verify.includes(s));
  if (missed.length) {
    failures.push(
      `${dir}: \`verify\` does not run ${missed.join(", ")} — ` +
        `the suite exists but nothing invokes it.`,
    );
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} packaging check(s) failed:\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ packaging: ${checks} checks passed`);
