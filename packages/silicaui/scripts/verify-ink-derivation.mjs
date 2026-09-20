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

/**
 * THE HOLE THIS REGEX HAD, and why the file now resolves indirection.
 *
 * It only ever matched a LITERAL `color: "var(--color-primary)"`. Components do
 * not write that — they write the accent idiom:
 *
 *   const accent = "var(--tag-accent, var(--color-primary))";
 *   …
 *   color: accent,
 *
 * which is the same raw fill painted as text, one name away from the pattern.
 * `tag-input` and `multi-select` both did it and both measured 2.78:1 on a
 * terracotta chip in light — under WCAG AA — for as long as this probe has been
 * green. `power-search`, the third copy of the identical rule, used `inkOfRole`
 * and measured 6.42, so the system had the right answer in a sibling and the
 * guard could not tell them apart. Found by P06, by measuring a chip.
 *
 * So: resolve one level of `const NAME = "…"` before testing, and look for a
 * role token ANYWHERE in the resolved value rather than only at its start. The
 * two exemptions above still hold, and a value that already goes through
 * `ink()` / `inkOfRole()` / `--*-ink` is the fix itself, so it is skipped.
 */
const ROLE_ANYWHERE = /--color-(?!base-)([a-z0-9-]+?)(?<!-content)(?=[,)\s])/;
const ALREADY_INK = /\bink\(|\binkOfRole\(|--[a-z-]+-ink\b/;

/** `const x = "…"` and `const x = `…`` pairs declared in one module. */
function localConstants(src) {
  const out = {};
  for (const m of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:"([^"]*)"|`([^`]*)`)\s*;/g)) {
    out[m[1]] = m[2] ?? m[3];
  }
  return out;
}

const failures = [];
let files = 0;

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const src = readFileSync(join(componentsDir, file), "utf8");
  const lines = src.split("\n");
  const consts = localConstants(src);
  files++;
  lines.forEach((line, i) => {
    let m = line.match(RAW_ROLE_AS_TEXT);
    if (!m) {
      const decl = line.match(/^\s*color:\s*(.+?),\s*$/);
      if (!decl) return;
      let value = decl[1].trim();
      if (ALREADY_INK.test(value)) return;
      // Substitute ONLY into an expression, never into a string literal.
      // A first version substituted anywhere and rewrote the INSIDE of CSS
      // custom property names — `accent` matched within
      // `var(--filter-accent-content, …)` and turned a correct `-content` ink
      // into a false accusation. Four of its ten hits were that mistake.
      const isLiteral = value.startsWith('"') || value.startsWith("`");
      if (!isLiteral) {
        // Substitute WHOLE identifiers only, by tokenising. Two earlier
        // versions got this wrong in opposite directions and both produced
        // false accusations: a plain `split/join` rewrote the inside of CSS
        // custom property names, and a hand-built boundary regex still turned
        // `accentContent` into `var(--wz-accent, …)Content`. A tokeniser cannot
        // partially match, which is the whole problem.
        value = value.replace(/[A-Za-z_$][\w$]*/g, (token) =>
          Object.prototype.hasOwnProperty.call(consts, token) ? consts[token] : token,
        );
      }
      if (ALREADY_INK.test(value)) return;
      m = value.match(ROLE_ANYWHERE);
      if (!m) return;
    }
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
