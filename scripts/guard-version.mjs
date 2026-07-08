#!/usr/bin/env node
// Hard backstop for the release workflow: SilicaUI has not reached 1.0 yet, so no
// package may publish at 1.0.0 or above, no matter what a changeset's bump type
// computes to. Run before `changeset publish` — a non-zero exit here must stop
// the release job before npm is ever touched.
//
// To intentionally leave 0.x, bump this to 1 first in a reviewed commit.
const MAX_ALLOWED_MAJOR = 0;

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const pkgsDir = "packages";
const offenders = [];

for (const dir of readdirSync(pkgsDir)) {
  const pkgPath = join(pkgsDir, dir, "package.json");
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    continue;
  }
  if (pkg.private) continue;
  const major = Number.parseInt(String(pkg.version).split(".")[0], 10);
  if (major > MAX_ALLOWED_MAJOR) {
    offenders.push(`${pkg.name}@${pkg.version}`);
  }
}

if (offenders.length > 0) {
  console.error(
    `Refusing to release: these packages would publish at major >${MAX_ALLOWED_MAJOR}, ` +
      `but SilicaUI hasn't reached 1.0 yet:\n  ${offenders.join("\n  ")}\n\n` +
      `If this is intentional, raise MAX_ALLOWED_MAJOR in scripts/guard-version.mjs in its own reviewed commit.`,
  );
  process.exit(1);
}

console.log("guard-version: all public packages are within the allowed major version.");
