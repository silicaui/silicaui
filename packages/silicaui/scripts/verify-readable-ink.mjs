/**
 * RULE #3 — text a person is meant to READ gets real ink.
 *
 *   node verify-readable-ink.mjs
 *
 * WHY THIS IS A PROBE. Fading text is the single easiest way to make a design
 * look tidier while quietly making it worse, and nothing catches it: it
 * compiles, it renders, it passes contrast checks often enough, and each
 * individual instance looks defensible. It accumulated to 35 violations here —
 * including `.lead`, the *lead paragraph*, at 82%, and `.accordion-content` and
 * `.collapsible-content`, which are the components' actual body copy.
 *
 * The rule: `color: color-mix(… var(--color-base-content) N%, transparent)` is
 * only allowed on things NOT meant to be read. Hierarchy comes from scale,
 * weight, and color — not from fading text out.
 *
 * Legitimately faded, and why:
 *   - disabled controls              `[data-disabled]`, `[aria-disabled]`
 *   - a de-emphasized duplicate      calendar's `[data-outside]` (other month)
 *   - placeholders                   text that disappears once it matters
 *   - transient animation states     `[data-starting-style]`/`[data-ending-style]`
 *   - icons and glyphs               not text (see ALLOW_EXPLICIT)
 *   - structural punctuation         segment separators (`/`, `–`), userSelect:none
 *   - deliberately faux chrome       the mockup browser's fake URL bar
 *
 * Selection state is NOT on that list: `tabs-tab` and `outline-link` mark the
 * active item with a real accent color already, so fading the inactive ones was
 * redundant on top of a distinction that was doing the work correctly.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const componentsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "components");
const MUTED = /color:\s*"color-mix\(in oklab, var\(--color-base-content\) (\d+)%, transparent\)"/;

/** Selector patterns that are legitimately not-for-reading. */
const ALLOW_SELECTOR = /data-disabled|aria-disabled|data-outside|placeholder|starting-style|ending-style/i;

/** `module|selector` pairs reviewed individually and confirmed non-text. */
const ALLOW_EXPLICIT = new Set([
  "segment-field|-literal", // date-field separators ("/"), userSelect: none
  "empty-state|-icon", // an icon chip, not text
  "select-menu|-scroll-arrow", // a glyph
  "mockup|browser(-input", // faux browser URL bar — deliberately fake chrome
  "calendar|.date-field-icon", // the calendar glyph, not text
]);

/** Whole rules assigned via `base[...] = {}` rather than an object literal key. */
const ALLOW_LINE_CONTEXT = [/date-range-input-sep/];

const failures = [];
let allowed = 0;

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const name = file.replace(/\.js$/, "");
  const lines = readFileSync(join(componentsDir, file), "utf8").split("\n");
  let selector = null;

  lines.forEach((line, i) => {
    const sel =
      line.match(/^\s*\[([^\]]+)\]:\s*\{/) || line.match(/^\s*['"](&[^'"]*)['"]:\s*\{/);
    if (sel) selector = sel[1].replace(/sel\(/g, "").replace(/[`"']/g, "").replace(/\)/g, "");
    // `base[`.${prefix}foo`] = {` — a different assignment shape. Capture the
    // WHOLE selector, not just its first segment: these compose descendant and
    // attribute parts (`.date-field[data-placeholder] .date-field-value`), and
    // truncating drops exactly the `[data-placeholder]` that makes it allowed.
    const assigned = line.match(/base\[`([^`]+)`\]\s*=\s*\{/);
    if (assigned) selector = assigned[1].replace(/\$\{prefix\}/g, "");

    const m = line.match(MUTED);
    if (!m) return;

    const context = lines.slice(Math.max(0, i - 4), i + 1).join("\n");
    if (
      ALLOW_SELECTOR.test(selector ?? "") ||
      ALLOW_EXPLICIT.has(`${name}|${selector ?? "(base)"}`) ||
      ALLOW_LINE_CONTEXT.some((re) => re.test(context))
    ) {
      allowed++;
      return;
    }
    failures.push(
      `${file}:${i + 1} \`${selector ?? "(base)"}\` fades readable text to ${m[1]}% — ` +
        `use var(--color-base-content). If this genuinely isn't meant to be read, ` +
        `add it to ALLOW_EXPLICIT in this script with a reason.`,
    );
  });
}

for (const f of failures) console.log(`  ✗ ${f}`);
console.log(`  ${allowed} legitimately-faded instance(s) allowed`);
console.log(
  failures.length
    ? `\n❌ ${failures.length} readable-text instance(s) use faded ink (RULE #3)\n`
    : "\n✅ readable text uses real ink everywhere\n",
);
process.exit(failures.length ? 1 : 0);
