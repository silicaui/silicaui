// Guards a trap that is invisible from inside this package: `apps/site/app/globals.css`
// points Tailwind's `@source` at `packages/silicaui-html/src/**/*.{ts,tsx}`, and the
// scanner has no concept of a comment. Any text anywhere in these files that LOOKS like
// an arbitrary-value utility becomes a real class candidate and gets emitted as CSS.
//
// That already broke the site build once. `hero-spotlight.ts` carried a comment saying
// the background is an Image atom "not a bg-[url(...)] class" — the scanner extracted it,
// Tailwind emitted `background-image: url(…)`, and webpack failed trying to resolve `./…`
// as a module. A comment explaining a lint rule tripped that rule.
//
// `lint.ts` cannot catch this: it validates the class strings a block actually declares,
// and this text is in prose. So this is a separate, text-level check.
//
// Scoped to `url(` on purpose. That is the one candidate that makes the bundler resolve
// a module and therefore the one that can fail a build. Other arbitrary values emit CSS
// and stop there — and most of the ones in this tree are real, intentional utilities
// (`min-h-[32rem]`, `aspect-[3/4]`). Reporting those too produced seven lines of noise on
// every run, which is how a check teaches people to ignore its output.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

// A Tailwind arbitrary-value candidate: a utility prefix, then `[`, then anything
// that is not a closing bracket or whitespace, then `]`.
const CANDIDATE = /[a-z][a-z0-9-]*-\[[^\]\s]+\]/gi;

const files = sourceFiles(ROOT);
const fatal = [];

for (const file of files) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const match of line.match(CANDIDATE) ?? []) {
      if (/url\(/i.test(match)) fatal.push(`${file}:${i + 1}  ${match}`);
    }
  });
}

if (fatal.length > 0) {
  console.error(
    `verify-scannable: a scannable \`url(\` candidate would break the site build ` +
      `(webpack resolves it as a module):\n  ${fatal.join("\n  ")}\n\n` +
      `Rewrite the text so it is not a literal utility — describe it in words, or ` +
      `break the token. Tailwind reads comments as source.`,
  );
  process.exit(1);
}

console.log(`verify-scannable: no scannable \`url(\` candidates in ${files.length} files.`);
