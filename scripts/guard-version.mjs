#!/usr/bin/env node
// Hard backstop against leaving 0.x by accident: SilicaUI has not reached 1.0 yet, so
// no package may publish at 1.0.0 or above, no matter what a changeset's bump type
// computes to.
//
// Two checks, deliberately at two different moments:
//
//   1. PENDING — does any unreleased changeset request a `major` bump? This is the one
//      that can fire on a pull request, while a human is still looking at the diff.
//   2. COMMITTED — is any public package already past the ceiling? This can only trip
//      after `changeset version` has computed the new numbers, so in the release job it
//      runs between `version` and `publish` — the last moment before anything is
//      committed, pushed, or shipped.
//
// Wired into `pnpm verify` so CI, the release job, and a local run all share one
// definition, rather than the rule living only inside a workflow file where nothing
// else can see it.
//
// To intentionally leave 0.x, raise MAX_ALLOWED_MAJOR in its own reviewed commit.
const MAX_ALLOWED_MAJOR = 0;

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PKGS_DIR = "packages";
const CHANGESET_DIR = ".changeset";

const failures = [];

// ---------------------------------------------------------------------------
// 1. Pending changesets requesting a major bump.
//
// A changeset is markdown with a YAML-ish frontmatter block of `"<pkg>": <bump>`
// lines. Read it directly rather than shelling out to `changeset status`, whose exit
// code depends on which flags you pass — that would make this script's own contract
// ("non-zero means refuse to release") ambiguous.
// ---------------------------------------------------------------------------
let changesetFiles = [];
try {
  changesetFiles = readdirSync(CHANGESET_DIR).filter(
    (f) => f.endsWith(".md") && f !== "README.md",
  );
} catch {
  // No .changeset directory — nothing pending to check.
}

for (const file of changesetFiles) {
  const text = readFileSync(join(CHANGESET_DIR, file), "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!frontmatter) continue;
  for (const line of frontmatter[1].split(/\r?\n/)) {
    const entry = /^\s*(?:"([^"]+)"|'([^']+)'|([^:\s]+))\s*:\s*([a-z]+)\s*$/.exec(line);
    if (!entry) continue;
    const name = entry[1] ?? entry[2] ?? entry[3];
    if (entry[4] === "major") {
      failures.push(
        `${CHANGESET_DIR}/${file} requests a "major" bump for ${name}, which would take it to 1.0.0.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Committed versions already past the ceiling.
// ---------------------------------------------------------------------------
for (const dir of readdirSync(PKGS_DIR)) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(PKGS_DIR, dir, "package.json"), "utf8"));
  } catch {
    continue;
  }
  if (pkg.private) continue;
  const major = Number.parseInt(String(pkg.version).split(".")[0], 10);
  if (major > MAX_ALLOWED_MAJOR) {
    failures.push(`${pkg.name}@${pkg.version} is already past major ${MAX_ALLOWED_MAJOR}.`);
  }
}

if (failures.length > 0) {
  console.error(
    `Refusing to release: SilicaUI hasn't reached 1.0 yet.\n  ${failures.join("\n  ")}\n\n` +
      `If this is intentional, raise MAX_ALLOWED_MAJOR in scripts/guard-version.mjs in its own reviewed commit.`,
  );
  process.exit(1);
}

console.log(
  `guard-version: ${changesetFiles.length} pending changeset(s), all public packages within major ${MAX_ALLOWED_MAJOR}.`,
);
