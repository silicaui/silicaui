/**
 * Copy the WORKSPACE build of silicaui into this app's node_modules.
 *
 *   node sync-silica.mjs
 *
 * WHY THIS EXISTS. This app declares `"@wizeworks/silicaui": "^0.55.0"` and is
 * installed with a plain `npm install`, so `node_modules/@wizeworks/silicaui` is
 * a real installed COPY, not a workspace symlink. That is correct for the
 * persona — she installs the published package like any customer would — and it
 * means a fix made in `packages/silicaui/src` does not reach this app until it is
 * copied in.
 *
 * It bit once, in act 7: the Dialog header fix was made, the app was rebuilt
 * cold, and the screen was unchanged — because the app was still running a
 * snapshot taken 30 minutes earlier. `rm -rf .next` does not help; the stale code
 * is upstream of the build. The tell is that a computed style still reads the OLD
 * value after a cold build, which is worth remembering: it looks exactly like a
 * fix that does not work.
 *
 * Run this after ANY change to `packages/silicaui` or `packages/silicaui-react`,
 * then rebuild cold. It prints what it copied so the step cannot be silent.
 */
import { cpSync, existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..", "..", "..");

/** `from` is relative to the repo root; `to` to this app's node_modules. */
const PACKAGES = [
  { name: "@wizeworks/silicaui", pkg: "packages/silicaui", copy: ["src", "package.json"] },
  { name: "@wizeworks/silicaui-react", pkg: "packages/silicaui-react", copy: ["dist", "package.json"] },
];

let copied = 0;
for (const { name, pkg, copy } of PACKAGES) {
  const src = join(repo, pkg);
  const dest = join(here, "node_modules", name);
  if (!existsSync(dest)) {
    console.error(`  ✗ ${name} is not installed here — run \`npm install\` first.`);
    process.exitCode = 1;
    continue;
  }
  for (const entry of copy) {
    const from = join(src, entry);
    if (!existsSync(from)) {
      console.error(`  ✗ ${pkg}/${entry} does not exist. Has the package been built?`);
      process.exitCode = 1;
      continue;
    }
    const to = join(dest, entry);
    if (existsSync(to) && statSync(to).isDirectory()) rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
    copied++;
  }
  console.log(`  ✓ ${name} ← ${pkg} (${copy.join(", ")})`);
}

// Say something specific, so "did it actually land?" never has to be guessed at.
const variants = join(here, "node_modules", "@wizeworks", "silicaui", "src", "color-variants.js");
if (existsSync(variants)) {
  const s = readFileSync(variants, "utf8");
  console.log(`\n  ink split present: ${s.includes("inkOf") ? "yes" : "NO"}`);
}
console.log(`\n${process.exitCode ? "✗" : "✅"} ${copied} path(s) copied. Now delete .next and rebuild.\n`);
