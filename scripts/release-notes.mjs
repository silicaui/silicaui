#!/usr/bin/env node
// Assembles the body of the GitHub Release for the version that was just cut.
//
// All twelve public packages are `fixed` in .changeset/config.json, so they always
// carry the same version — twelve near-identical GitHub Releases per bump would be
// noise. This emits ONE body covering the whole family, and the per-package git
// tags `changeset publish` creates still make `@wizeworks/silicaui@0.44.0`
// checkout-able.
//
// Changesets writes each package's entry as a `## <version>` section in its own
// CHANGELOG.md. A package that only moved because a sibling did gets an EMPTY
// section, so "has a non-empty section" is exactly the test for "actually changed".
//
// Usage: node scripts/release-notes.mjs [--version 0.44.0] > notes.md

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PKGS_DIR = "packages";

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** Every public package, paired with its parsed package.json. */
function publicPackages() {
  const out = [];
  for (const dir of readdirSync(PKGS_DIR)) {
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(join(PKGS_DIR, dir, "package.json"), "utf8"));
    } catch {
      continue;
    }
    if (!pkg.private && pkg.name && pkg.version) out.push({ dir, pkg });
  }
  return out;
}

/**
 * The body of `## <version>` in a CHANGELOG, up to the next `## ` heading.
 * Returns "" when the package has no section for this version, or an empty one —
 * which is exactly what changesets writes for a package that only moved because a
 * sibling did.
 *
 * Line-based rather than one regex over the whole file: these CHANGELOGs are CRLF,
 * and `.` matching `\r` makes anchored multi-line patterns quietly misbehave.
 */
function changelogSection(dir, version) {
  let text;
  try {
    text = readFileSync(join(PKGS_DIR, dir, "CHANGELOG.md"), "utf8");
  } catch {
    return "";
  }
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## ${version}`);
  if (start === -1) return "";

  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) break;
    body.push(lines[i]);
  }
  return body.join("\n").trim();
}

const packages = publicPackages();
if (packages.length === 0) {
  console.error("release-notes: found no public packages under packages/.");
  process.exit(1);
}

// Default to the shared `fixed` version. Every public package carries it, so any
// of them answers — read the first rather than hard-coding one package's path.
const version = argValue("--version") ?? packages[0].pkg.version;

const drifted = packages.filter((p) => p.pkg.version !== version);
if (drifted.length > 0) {
  // Not fatal: the notes are still useful. But `fixed` should make this impossible,
  // so say it loudly rather than quietly emitting a body that misrepresents a release.
  console.error(
    `release-notes: expected every public package at ${version}, but found ` +
      drifted.map((p) => `${p.pkg.name}@${p.pkg.version}`).join(", "),
  );
}

const changed = [];
for (const { dir, pkg } of packages) {
  const body = changelogSection(dir, version);
  if (body) changed.push({ name: pkg.name, body });
}

const lines = [];
if (changed.length === 0) {
  lines.push("Dependency and internal-version maintenance only — no package changelog entries.");
} else {
  for (const { name, body } of changed) {
    lines.push(`## ${name}`, "", body, "");
  }
}

lines.push(
  "---",
  "",
  `All ${packages.length} packages publish together at \`${version}\`:`,
  "",
  packages.map(({ pkg }) => `- \`${pkg.name}@${version}\``).join("\n"),
  "",
  "```sh",
  `npm i @wizeworks/silicaui@${version}`,
  "```",
);

process.stdout.write(lines.join("\n") + "\n");
