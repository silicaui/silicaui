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
// TWO THINGS THIS FILE EXISTS TO GET RIGHT, both learned by the release failing:
//
// 1. DEDUPLICATION. A changeset that names four packages is written verbatim into
//    all four CHANGELOGs, so concatenating the sections repeats the same release
//    note four times. v0.57.0 had sixteen changesets across ten packages and the
//    body came to 129,644 characters of mostly-duplicate text.
//
// 2. A BUDGET. GitHub rejects a release body over 125,000 characters with a bare
//    `HTTP 422: body is too long`, AFTER `changeset publish` has already pushed to
//    npm — so the packages ship and the release step fails behind them. The length
//    of a release note is not something a person should have to ration while
//    writing a changeset, so this file rations it instead: over budget, entries
//    fall back to their headline and point at the CHANGELOG for the rest. It says
//    so on stderr, and it never emits a body it knows GitHub will refuse.
//
// Usage: node scripts/release-notes.mjs [--version 0.44.0] > notes.md

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PKGS_DIR = "packages";

/** GitHub's hard limit on a release body. A 422 after publish is the failure mode. */
const GITHUB_BODY_LIMIT = Number(process.env.RELEASE_NOTES_LIMIT ?? 125_000);
/** Headroom under the limit, so a near-miss degrades rather than gambling on it. */
const BUDGET = Number(process.env.RELEASE_NOTES_BUDGET ?? 120_000);
// Both are env-overridable ONLY so `scripts/verify-release-notes.mjs` can drive the
// two degradation paths against this file rather than against a copy of it. CI sets
// neither. A copy is how a guard ends up proving something the real script no longer
// does, which is the failure this whole file was rewritten to stop repeating.

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
 * The lines of `## <version>` in a CHANGELOG, up to the next `## ` heading.
 * Empty when the package has no section for this version, or an empty one — which
 * is exactly what changesets writes for a package that only moved because a
 * sibling did.
 *
 * Line-based rather than one regex over the whole file: these CHANGELOGs are CRLF,
 * and `.` matching `\r` makes anchored multi-line patterns quietly misbehave.
 */
function changelogLines(dir, version) {
  let text;
  try {
    text = readFileSync(join(PKGS_DIR, dir, "CHANGELOG.md"), "utf8");
  } catch {
    return [];
  }
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## ${version}`);
  if (start === -1) return [];

  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) break;
    body.push(lines[i]);
  }
  return body;
}

/**
 * Split one package's section into individual entries.
 *
 * The shape changesets writes is `### <Level> Changes`, then one `- <sha>: <text>`
 * bullet per changeset with two-space-indented continuation lines. Returns
 * `{ level, body }`, body dedented and with the `- <sha>: ` prefix removed, so two
 * packages carrying the SAME changeset produce byte-identical bodies and collapse.
 *
 * `Updated dependencies` bullets are dropped: with every package `fixed` at one
 * version, "silicaui-react bumped because silicaui bumped" is true of all of them
 * and tells a reader nothing.
 */
function parseEntries(lines) {
  const entries = [];
  let level = "";
  let current = null;

  const flush = () => {
    if (!current) return;
    const body = current.lines.join("\n").trim();
    if (body && !/^Updated dependencies\b/.test(body)) entries.push({ level: current.level, body });
    current = null;
  };

  for (const raw of lines) {
    const heading = /^###\s+(\w+)\s+Changes\s*$/.exec(raw);
    if (heading) {
      flush();
      level = heading[1].toLowerCase();
      continue;
    }
    // A bullet at column 0 opens an entry; anything indented continues it.
    const bullet = /^-\s+(?:([0-9a-f]{7,40}):\s*)?(.*)$/.exec(raw);
    if (bullet && !raw.startsWith("  ")) {
      flush();
      current = { level, lines: [bullet[2]] };
      continue;
    }
    if (current) current.lines.push(raw.startsWith("  ") ? raw.slice(2) : raw);
  }
  flush();
  return entries;
}

/**
 * Split an entry into its headline (the first paragraph, collapsed to one line)
 * and everything after it. Done as ONE split rather than a headline function plus
 * a `slice(headline.length)` at the call site: collapsing newlines to spaces and
 * trimming each line changes the length, so slicing by it eats or repeats
 * characters whenever the first paragraph wraps — which is most of them.
 */
function splitHeadline(body) {
  const i = body.search(/\n\s*\n/);
  const first = i === -1 ? body : body.slice(0, i);
  const rest = i === -1 ? "" : body.slice(i).trim();
  return { headline: first.split("\n").map((l) => l.trim()).join(" ").trim(), rest };
}

/**
 * Push every heading inside an entry's body down one level, so a changeset that
 * writes `## What changed` nests UNDER the `## <headline>` this file puts above it
 * instead of reading as a sibling entry. Fenced code is left alone — a `#` at the
 * start of a line in a shell block is a comment, not a heading.
 */
function demoteHeadings(body) {
  let fenced = false;
  return body
    .split("\n")
    .map((line) => {
      if (/^\s{0,3}(```|~~~)/.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      return /^#{1,5}\s/.test(line) ? `#${line}` : line;
    })
    .join("\n");
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

// One record per DISTINCT entry, remembering every package that carried it and the
// strongest bump any of them recorded for it.
const RANK = { patch: 0, minor: 1, major: 2 };
const byBody = new Map();
for (const { dir, pkg } of packages) {
  for (const { level, body } of parseEntries(changelogLines(dir, version))) {
    const found = byBody.get(body);
    if (found) {
      if (!found.packages.includes(pkg.name)) found.packages.push(pkg.name);
      if ((RANK[level] ?? -1) > (RANK[found.level] ?? -1)) found.level = level;
    } else {
      byBody.set(body, { level, body, packages: [pkg.name], dir });
    }
  }
}

// Strongest bump first, so the headline change of a release leads it.
const entries = [...byBody.values()].sort((a, b) => (RANK[b.level] ?? -1) - (RANK[a.level] ?? -1));

const footer = [
  "---",
  "",
  `All ${packages.length} packages publish together at \`${version}\`:`,
  "",
  packages.map(({ pkg }) => `- \`${pkg.name}@${version}\``).join("\n"),
  "",
  "```sh",
  `npm i @wizeworks/silicaui@${version}`,
  "```",
];

/** `full`: every entry in its entirety. `headlines`: first paragraph only. */
function render(mode) {
  const lines = [];
  if (entries.length === 0) {
    lines.push("Dependency and internal-version maintenance only — no package changelog entries.");
  } else {
    if (mode === "headlines") {
      lines.push(
        `_${entries.length} changes across ${packages.length} packages. Summarised to fit GitHub's ` +
          "release-body limit — each package's `CHANGELOG.md` at this tag carries the full text._",
        "",
      );
    }
    for (const entry of entries) {
      const { headline, rest } = splitHeadline(entry.body);
      lines.push(`## ${headline}`, "");
      lines.push(`\`${entry.level}\` · ${entry.packages.map((n) => `\`${n}\``).join(", ")}`, "");
      if (mode === "full" && rest) lines.push(demoteHeadings(rest), "");
    }
  }
  return lines.concat(footer).join("\n") + "\n";
}

let out = render("full");
if (out.length > BUDGET) {
  const wasFull = out.length;
  out = render("headlines");
  console.error(
    `release-notes: the full body is ${wasFull.toLocaleString()} characters, over the ` +
      `${BUDGET.toLocaleString()} budget (GitHub rejects over ${GITHUB_BODY_LIMIT.toLocaleString()}). ` +
      `Emitting headlines only — ${out.length.toLocaleString()} characters. ` +
      "The full text is in each package's CHANGELOG.md at this tag.",
  );
}
if (out.length > GITHUB_BODY_LIMIT) {
  // Headlines alone overran, which means a LOT of changesets rather than long ones.
  // Cut to the limit rather than hand GitHub a body it will refuse after publish.
  const note = "\n\n_Truncated: too many entries to list. See each package's `CHANGELOG.md` at this tag._\n";
  console.error(
    `release-notes: even headlines came to ${out.length.toLocaleString()} characters. Hard-truncating.`,
  );
  out = out.slice(0, GITHUB_BODY_LIMIT - note.length) + note;
}

process.stdout.write(out);
