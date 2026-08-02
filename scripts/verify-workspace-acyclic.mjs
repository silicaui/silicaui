// No two workspace packages may depend on each other.
//
//   node scripts/verify-workspace-acyclic.mjs
//
// pnpm is perfectly happy with a dependency cycle between workspace packages —
// it just materializes the edges as symlinks and moves on. Webpack is not. Each
// `workspace:*` edge becomes `packages/A/node_modules/@wizeworks/B -> ../../B`,
// so a cycle A→B→A is a symlink loop on disk, and any tool that walks a package
// directory following symlinks recurses until it dies.
//
// That is not hypothetical. `@wizeworks/silicaui-html/theme` needs silicaui's
// own color generators, so it took a `workspace:*` devDependency on it — while
// `@wizeworks/silicaui` already had one on silicaui-html for its contrast probe.
// Nothing complained: install, build, typecheck, lint and every package's verify
// were green, on Linux and Windows alike. The site build then died in CI with
//
//     uncaughtException RangeError: Invalid array length
//         at Array.push (<anonymous>)
//
// and nothing else — webpack's FileSystemInfo snapshotting the silicaui-html
// directory, walking the loop, pushing entries until the array hit its 2^32
// ceiling. It took a Linux container and a patched stack-trace limit to read
// that as "symlink loop"; there is no reason for the next person to pay that
// again when the cycle itself is trivially checkable.
//
// The fix in that case is the general one: a package that needs a sibling only
// for its own tests or types does not have to depend on it. `@wizeworks/silicaui`
// is an OPTIONAL PEER of silicaui-html — the honest relationship — and the
// workspace ROOT carries the devDependency that makes the peer resolvable for
// the probe. A root edge cannot close a cycle, because nothing depends on the
// root.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Mirrors pnpm-workspace.yaml. Kept literal rather than parsed: it is three
// entries that have not changed in the life of the repo, and adding a YAML
// parser to a guard script is a worse trade than this comment.
const GROUPS = ["packages", "examples", "apps"];

/** Every workspace package, as name → { dir, edges }. */
const pkgs = new Map();
for (const group of GROUPS) {
  const groupDir = join(root, group);
  if (!existsSync(groupDir)) continue;
  for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(groupDir, entry.name, "package.json");
    if (!existsSync(manifest)) continue;
    const json = JSON.parse(readFileSync(manifest, "utf8"));
    pkgs.set(json.name, { dir: `${group}/${entry.name}`, json });
  }
}

/**
 * The edges that become a symlink on disk. Ordinary peerDependencies do NOT —
 * pnpm resolves a peer from the dependent's own tree rather than installing one
 * — which is exactly why demoting a devDependency to a peer breaks a cycle.
 */
const LINKING_FIELDS = ["dependencies", "devDependencies", "optionalDependencies"];

const edges = new Map();
for (const [name, { json }] of pkgs) {
  const out = new Map();
  for (const field of LINKING_FIELDS) {
    for (const [dep, range] of Object.entries(json[field] ?? {})) {
      // Only workspace-protocol edges link to a sibling directory. A sibling
      // pinned to a published version resolves into the pnpm store instead and
      // cannot form a loop through the workspace tree.
      if (pkgs.has(dep) && String(range).startsWith("workspace:")) out.set(dep, field);
    }
  }
  edges.set(name, out);
}

/** Depth-first search, reporting the first cycle reached from each root. */
const cycles = [];
const state = new Map(); // name → "open" | "done"
const stack = [];

function walk(name) {
  if (state.get(name) === "done") return;
  const at = stack.indexOf(name);
  if (at !== -1) {
    cycles.push(stack.slice(at).concat(name));
    return;
  }
  stack.push(name);
  for (const dep of edges.get(name)?.keys() ?? []) walk(dep);
  stack.pop();
  state.set(name, "done");
}

for (const name of pkgs.keys()) walk(name);

if (cycles.length) {
  // Dedupe rotations of the same cycle (A→B→A and B→A→B are one finding).
  const seen = new Set();
  const unique = cycles.filter((c) => {
    const key = [...c.slice(0, -1)].sort().join("|");
    return seen.has(key) ? false : (seen.add(key), true);
  });
  console.error("verify-workspace-acyclic: workspace dependency cycle\n");
  for (const cycle of unique) {
    console.error(`  ${cycle.join(" → ")}`);
    for (let i = 0; i < cycle.length - 1; i++) {
      const field = edges.get(cycle[i]).get(cycle[i + 1]);
      console.error(`    ${pkgs.get(cycle[i]).dir}/package.json  ${field}: ${cycle[i + 1]}`);
    }
    console.error("");
  }
  console.error(
    "Each edge above is a symlink on disk, so this cycle is a symlink loop that\n" +
      "makes any directory walk recurse forever. If the edge exists only for a probe\n" +
      "or for types, declare a peerDependency instead and put the devDependency on\n" +
      "the workspace ROOT, which nothing depends on.",
  );
  process.exit(1);
}

console.log(`verify-workspace-acyclic: ${pkgs.size} workspace packages, no dependency cycles.`);
