/**
 * The three non-plugin packages must REFUSE to be used as a Tailwind plugin,
 * with a sentence that names themselves and gives the fix — and the real plugin
 * must not refuse.
 *
 * WHY THIS IS A PROBE. `@plugin "@wizeworks/silicaui-html"` is an easy line to
 * type: that is the package a node-tree user imports from all day, and the
 * plugin lives in a different one. Without a guard Tailwind resolves the module,
 * calls whatever it found, and dies inside its own minified code with `b is not
 * a function` — no package, no cause, no fix (docs/personas/issues/012).
 *
 * The guards were added for that, shipped, and **never fired**, because being
 * present in a bundle and being reached are different things. Tailwind's own
 * resolver:
 *
 *     if (!options)                        -> plugins: [plugin]
 *     else if ("__isOptionsFunction" in p) -> plugins: [p(options)]
 *     else throw `The plugin "x" does not accept options`
 *
 * A plain exported function has no marker, so a `@plugin "x" { … }` — the form
 * every doc, every starter and the guard's own suggested fix write — lands on
 * the third branch and the guard is never invoked. Nothing about the source
 * looks wrong; the only way to know is to ask the built artefact the same two
 * questions Tailwind asks (docs/personas/issues/105).
 *
 * The REAL plugin is checked in the same pass, on purpose. A run that reports
 * "refuses with a helpful message" for every package is checking nothing.
 */
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("..", import.meta.url));

/** [package name, entry a consumer resolves, must it refuse?] */
const CASES = [
  ["@wizeworks/silicaui-html", "packages/silicaui-html/dist/index.js", true],
  ["@wizeworks/silicaui-behaviors", "packages/silicaui-behaviors/dist/index.js", true],
  ["@wizeworks/silicaui-react", "packages/silicaui-react/dist/index.js", true],
  // The control. It IS the plugin: marked, and it must not throw.
  ["@wizeworks/silicaui", "packages/silicaui/src/index.js", false],
];

const failures = [];

for (const [pkg, entry, mustRefuse] of CASES) {
  let mod;
  try {
    mod = await import(new URL(entry, `file:///${REPO.replace(/\\/g, "/")}`).href);
  } catch (e) {
    failures.push(`${pkg}: could not import ${entry} — ${e.message}. Run a build first.`);
    continue;
  }
  const d = mod.default;

  if (typeof d !== "function") {
    failures.push(`${pkg}: default export is ${typeof d}, so Tailwind has nothing to call.`);
    continue;
  }
  // Branch two of Tailwind's resolver. Without this, `@plugin "x" { … }` never
  // reaches the export at all.
  if (!("__isOptionsFunction" in d)) {
    failures.push(
      `${pkg}: default export is not marked \`__isOptionsFunction\`, so Tailwind refuses it ` +
        `with its own generic "does not accept options" and never calls it. ` +
        `Add \`fn.__isOptionsFunction = true as const;\``,
    );
    continue;
  }

  let threw = null;
  try {
    d({ colors: "primary" });
  } catch (e) {
    threw = String(e?.message ?? e);
  }

  if (!mustRefuse) {
    if (threw) failures.push(`${pkg} IS the Tailwind plugin and must not refuse, but it threw: ${threw.split("\n")[0]}`);
    continue;
  }
  if (!threw) {
    failures.push(`${pkg}: did not refuse. A silent non-plugin is the \`b is not a function\` crash again.`);
    continue;
  }
  if (!threw.includes(pkg)) {
    failures.push(`${pkg}: refuses without naming itself — "${threw.split("\n")[0]}"`);
  }
  if (!/name the plugin package instead/.test(threw)) {
    failures.push(`${pkg}: refuses without giving the fix — "${threw.split("\n")[0]}"`);
  }
}

if (failures.length) {
  console.error("Tailwind-plugin guards are not reachable as Tailwind resolves them.\n");
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n❌ ${failures.length} problem(s). See docs/personas/issues/105.`);
  process.exit(1);
}
console.log(`  checked ${CASES.length} package(s), including the real plugin as the control`);
console.log("✅ every non-plugin package refuses by name and gives the fix; the plugin does not refuse");
