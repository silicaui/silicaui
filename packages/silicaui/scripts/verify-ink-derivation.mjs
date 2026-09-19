/**
 * A role colour painted as TEXT must go through `ink()`, never the raw token.
 *
 *   node verify-ink-derivation.mjs
 *
 * WHY THIS IS A PROBE. A palette tunes each role as a FILL. Light mode's
 * `warning` is `oklch(80% 0.11 85)` — right behind near-black `warning-content`
 * at 8.8:1, and **1.77:1** when it is the text instead. `lib/ink.js` derives the
 * ink form, and `color-variants.js` hands every coloured family a `--<root>-ink`
 * so `soft`/`outline`/`ghost` get it for free (docs/personas/issues/019).
 *
 * That covers the families. It does NOT cover a component that paints a role
 * colour as text directly, and fifteen of them did: a required asterisk, a
 * validator message, an upload error, an active menu item. The asterisk measured
 * **4.42:1** in light — under AA — while `verify-token-contrast.mjs` reported
 * `error` at 9.56, because that probe measures the DERIVED ink. Two numbers for
 * one colour, and the reassuring one was the one being printed
 * (docs/personas/issues/024).
 *
 * `primary` happens to pass raw (7.97), so most of the fifteen were not failing.
 * They were still wrong: `btn-primary btn-ghost` painted the derived ink at 12.20
 * while `.menu-item-active` painted the raw token at 7.97 — one system, one
 * colour, two answers, depending on which component you happened to be in.
 *
 * WHAT IT CHECKS. No `color:` declaration in a component may name a bare role
 * token. `--color-base-*` is exempt: those ARE the surface's own ink and need no
 * derivation. Borders, backgrounds and fills are untouched — the fill form is
 * what the palette tunes, and this probe is only about text.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const componentsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "components");

/**
 * Two kinds of token are exempt, and both are already inks:
 *
 *   `--color-base-content`  the surface's own ink, per-theme by construction
 *   `--color-<role>-content` the ink DESIGNED to sit on that role's fill
 *
 * The first draft of this regex caught `--color-primary-content` in carousel.js
 * and `--color-neutral-content` in mockup.js and told them to derive an ink from
 * an ink. Both were correct as written; the probe was wrong, and running it is
 * what said so.
 */
const RAW_ROLE_AS_TEXT = /^\s*color:\s*"var\(--color-(?!base-)([a-z0-9-]+?)(?<!-content)\)"/;

const failures = [];
let files = 0;

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const lines = readFileSync(join(componentsDir, file), "utf8").split("\n");
  files++;
  lines.forEach((line, i) => {
    const m = line.match(RAW_ROLE_AS_TEXT);
    if (!m) return;
    failures.push(
      `${file}:${i + 1} \`color: var(--color-${m[1]})\` paints the FILL form as text.\n` +
        `    A palette tunes a role to sit BEHIND text, not to be it — in light,\n` +
        `    \`warning\` is 1.77:1 as a label and \`error\` is 4.40:1.\n` +
        `    Use \`inkOfRole("${m[1]}")\` from ../lib/ink.js.`,
    );
  });
}

for (const f of failures) console.error(`  ✗ ${f}`);
console.log(`  ${files} component module(s) checked`);
console.log(
  failures.length
    ? `\n❌ ${failures.length} rule(s) paint a raw role token as text\n`
    : "\n✅ every role colour painted as text goes through ink()\n",
);
process.exit(failures.length ? 1 : 0);
