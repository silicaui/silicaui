/**
 * No source file may contain a raw C0 control character.
 *
 * Found by P04 (docs/personas/issues/078). A scripted edit wrote the escape
 * sequence `\b` as the byte it names, so a regex that read
 * `/<a\b([^>]*)>/gi` in the editor was really `<a` followed by U+0008 — a
 * pattern that matches nothing, in any input, ever. One of the two was inside a
 * live test assertion, so half of that check had been decoration for as long as
 * it had existed, going green every run.
 *
 * The same accident produces a raw NUL where an escaped U+0000 was meant. That one is
 * harmless at runtime — same value, unreadable source — but it is the identical
 * mistake and there is no reason to allow it either.
 *
 * Tab, newline and carriage return are the three that belong in a text file.
 * Everything else below U+0020, plus DEL, is a mistake. Write the escape.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("..", import.meta.url));

/** Source we author. Built output and vendored code legitimately contain
 *  control bytes (minifiers emit them), so neither is walked. */
const EXTENSIONS = /\.(ts|tsx|mjs|cjs|js|jsx|css|json|md|mdx|yml|yaml)$/;
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
  ".turbo",
  "coverage",
  "test-results",
  "playwright-report",
  ".venv",
  "staticfiles",
  "__pycache__",
]);

/** Everything below U+0020 except tab/LF/CR, plus DEL. */
const ALLOWED = new Set([9, 10, 13]); // tab, newline, carriage return
/** Built from code points on purpose. Writing this as a character class of
 *  `\u00NN` escapes is how the defect this file exists to catch gets INTO
 *  this file — it happened once already while writing it. */
const isBad = (code) => (code < 0x20 && !ALLOWED.has(code)) || code === 0x7f;

const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTENSIONS.test(entry)) continue;
    const text = readFileSync(full, "utf8");
    if (![...text].some((c) => isBad(c.codePointAt(0)))) continue;
    // Report by line, with the offending code point named, so the fix is
    // obvious from the output alone.
    text.split(/\r?\n/).forEach((line, i) => {
      const index = [...line].findIndex((c) => isBad(c.codePointAt(0)));
      if (index < 0) return;
      const code = line.codePointAt(index);
      findings.push({
        file: relative(REPO, full).replaceAll("\\", "/"),
        line: i + 1,
        code: `U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
        near: line.slice(Math.max(0, index - 40), index + 40).trim(),
      });
    });
  }
}

walk(REPO);

if (findings.length === 0) {
  console.log("✅ no raw control characters in source");
  process.exit(0);
}

console.error("Raw control characters in source. Write the escape instead.\n");
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  ${f.code}`);
  console.error(`    …${f.near}…`);
}
console.error(
  `\n${findings.length} line(s). A literal U+0008 where \\b was meant makes a regex that can never match;` +
    " a raw NUL where \\u0000 was meant is the same accident with a milder symptom.",
);
process.exit(1);
