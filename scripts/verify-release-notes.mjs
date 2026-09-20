#!/usr/bin/env node
// Guards the body `scripts/release-notes.mjs` hands to `gh release create`.
//
// WHY THIS EXISTS. v0.57.0 published twelve packages to npm and then failed on the
// last step of the release job:
//
//     HTTP 422: Validation Failed
//     body is too long (maximum is 125000 characters)
//
// The packages were already on the registry and the tags already pushed, so the
// release was half-done and the only signal was a red job. The body was 129,644
// characters — not because the changesets were unreasonable, but because a
// changeset naming four packages is copied verbatim into all four CHANGELOGs and
// the notes concatenated every copy.
//
// So this probe asserts the two properties that failure came down to:
//   1. the body fits, for the version actually in the tree;
//   2. it fits because entries are DEDUPLICATED, not because someone wrote less.
// And it drives both degradation paths, so "it fits" cannot quietly become "it was
// truncated" without the truncation itself being exercised.
//
// Run: node scripts/verify-release-notes.mjs   (wired into `pnpm verify`)

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SCRIPT = "scripts/release-notes.mjs";
const GITHUB_BODY_LIMIT = 125_000;

let failures = 0;
function check(label, ok, detail) {
  console.log(`  ${ok ? "✓" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

/**
 * Run the real script, returning `{ out, err, status }`.
 *
 * `spawnSync`, not `execFileSync`: the degradation paths report themselves on
 * STDERR while still exiting 0, and `execFileSync` hands back only stdout on a
 * successful exit — so the two "is it loud?" checks below would pass vacuously
 * against a script that had gone silent.
 */
function run(env = {}) {
  const r = spawnSync(process.execPath, [SCRIPT], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  if (r.error) throw r.error;
  return { out: r.stdout ?? "", err: r.stderr ?? "", status: r.status };
}

const version = JSON.parse(readFileSync("packages/silicaui/package.json", "utf8")).version;
console.log(`release notes for ${version}`);

// ---------------------------------------------------------------------------
// 1. The body GitHub would actually receive.
// ---------------------------------------------------------------------------
const { out, status } = run();
check("the script exits 0", status === 0, `exit ${status}`);
check(
  "the body fits GitHub's release limit",
  out.length <= GITHUB_BODY_LIMIT,
  `${out.length.toLocaleString()} / ${GITHUB_BODY_LIMIT.toLocaleString()} characters`,
);
check("the body is not empty", out.trim().length > 0);

// ---------------------------------------------------------------------------
// 2. It fits because of deduplication.
//
// One `## ` heading and one `` `level` · packages `` line per entry. If a changeset
// naming four packages were emitted once per package, the same heading would appear
// four times — which is exactly the state that produced the 422.
// ---------------------------------------------------------------------------
const headings = [...out.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
const levelLines = [...out.matchAll(/^`(?:major|minor|patch)` · /gm)];
check(
  "every entry has exactly one heading and one level line",
  headings.length === levelLines.length,
  `${headings.length} headings, ${levelLines.length} level lines`,
);
const dupes = headings.filter((h, i) => headings.indexOf(h) !== i);
check(
  "no entry is repeated once per package it names",
  dupes.length === 0,
  dupes.length ? `repeated: ${[...new Set(dupes)][0]}` : `${headings.length} distinct entries`,
);
// A changeset body of its own containing `## What changed` must nest under the entry
// heading, not read as a sibling entry. Demotion is what keeps the two counts equal
// above, so assert the demoted form is actually present when a body has headings.
check(
  "headings inside a changeset body are demoted, not left at `## `",
  !/^## (What changed|Migrating)\s*$/m.test(out),
);

// ---------------------------------------------------------------------------
// 3. Both degradation paths, driven against THIS script.
// ---------------------------------------------------------------------------
const small = run({ RELEASE_NOTES_BUDGET: "2000" });
check(
  "over budget, it falls back to headlines",
  small.out.length < out.length && /Summarised to fit GitHub's release-body limit/.test(small.out),
  `${small.out.length.toLocaleString()} characters`,
);
check("the fallback is reported on stderr, not silent", /over the .* budget/.test(small.err));

const tiny = run({ RELEASE_NOTES_BUDGET: "500", RELEASE_NOTES_LIMIT: "1500" });
check(
  "when even headlines overrun, it hard-truncates to the limit",
  tiny.out.length <= 1500 && /_Truncated: too many entries/.test(tiny.out),
  `${tiny.out.length} / 1500 characters`,
);
check("the truncation is reported on stderr", /Hard-truncating/.test(tiny.err));

if (failures > 0) {
  console.error(`\n❌ ${failures} check(s) failed`);
  process.exit(1);
}
console.log("✅ release notes: deduplicated, within GitHub's limit, and loud when it degrades");
