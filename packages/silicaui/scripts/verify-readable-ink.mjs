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
 *
 * "Faux chrome" is NOT on that list either: the mockup browser's URL bar used to
 * be faded on the grounds that it is fake, but it carries the domain a marketing
 * shot exists to show off — so it reads as real text and gets real ink.
 *
 * Selection state is NOT on that list: `tabs-tab` and `outline-link` mark the
 * active item with a real accent color already, so fading the inactive ones was
 * redundant on top of a distinction that was doing the work correctly.
 *
 * TWO WAYS TO FADE, AND THIS CHECKED ONE. RULE #3 bans `soft`, `muted`,
 * `/opacity` AND `color-mix(…, transparent)` on text meant to be read — it names
 * opacity first. This probe only ever matched the `color-mix` spelling, so
 * `opacity: "0.5"` on a countdown's own label walked straight past the check
 * written to stop it. Same rule, same consequence, different property.
 *
 * `opacity` is the harder half, because it fades a whole subtree rather than an
 * ink: it is correct on a glyph, a divider or a disabled control, and wrong on
 * anything carrying words. There is no way to tell those apart from the property
 * alone, so every partial value is reported and each one is either fixed or
 * written into OPACITY_OK with a reason. `0` and `1` are not fades — they are
 * show/hide, and animation states are allowed by selector already.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const componentsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "components");
const MUTED = /color:\s*"color-mix\(in oklab, var\(--color-base-content\) (\d+)%, transparent\)"/;

/** Selector patterns that are legitimately not-for-reading. */
const ALLOW_SELECTOR =
  /data-disabled|aria-disabled|:disabled|data-outside|placeholder|starting-style|ending-style|data-dragging|data-drag-over/i;

/** `module|selector` pairs reviewed individually and confirmed non-text. */
const ALLOW_EXPLICIT = new Set([
  "segment-field|-literal", // date-field separators ("/"), userSelect: none
  "empty-state|-icon", // an icon chip, not text
  "select-menu|-scroll-arrow", // a glyph
  "calendar|.date-field-icon", // the calendar glyph, not text
]);

/** Whole rules assigned via `base[...] = {}` rather than an object literal key. */
const ALLOW_LINE_CONTEXT = [/date-range-input-sep/];

/** A partial `opacity`. `0` and `1` are show/hide, not a fade. */
const FADED = /(?:^|[\s{,])opacity:\s*"(0\.\d+)"/;

/**
 * Selectors whose subtree carries no words: glyphs, rules, chrome. Matched
 * against the same selector string the color pass tracks.
 */
const OPACITY_NOT_TEXT =
  /icon|glyph|arrow|chevron|caret|divider|separator|-sep\b|handle|thumb|track|dot|bullet|swatch|overlay|backdrop|scrim|grain|shine|glow|ring|indicator|close|dismiss|remove|clear|resize|grip|drag/i;

/**
 * Reviewed one by one and confirmed not-for-reading. `module|selector` — the
 * same shape ALLOW_EXPLICIT uses, with the reason on the line.
 */
const OPACITY_OK = new Set([
  "breadcrumb|& li:not(:first-child::before", // the chevron: two borders rotated 45deg, content: ""
  "collapse|&::after", // the same chevron shape on the collapse marker
  "mockup|& pre[data-prefix]::before", // terminal line numbers, userSelect: none
  "pagination|-ellipsis", // the "..." gap marker, userSelect: none — structural punctuation
]);

/**
 * Selectors the pattern matched AND that were then read one by one, grouped by
 * the reason each is allowed. Every group is a case RULE #3 names in its own
 * words; not one of them is here because "it looked like a glyph".
 *
 * This list started EMPTY on purpose. The probe printed all 37 and each was read
 * before it went in, which is the only way a list like this means anything. A
 * new fade that happens to match the pattern now fails the build with its
 * selector named, and has to be looked at or given real ink.
 */
const PATTERN_REVIEWED = new Set([
  // DISABLED controls. RULE #3 names them itself: "disabled controls" is one of
  // the three things faded text is FOR. Words inside are meant to read as
  // unavailable.
  "calendar|&:disabled",
  "calendar|&[data-disabled]",
  "card|&:disabled, &[data-disabled]",
  "card|&:has(:disabled",
  "color-picker|${}[data-disabled]",
  "color-picker|&[data-disabled]",
  "command-palette|&[data-disabled]",
  "dropdown|&[data-disabled]",
  "dropzone|${}[data-disabled]",
  "input-group|&:disabled",
  "label|&:has(> input:disabled",
  "lightbox|&:disabled",
  "multi-select|${}[data-disabled]",
  "rich-text-editor|${}[data-disabled]",
  "rich-text-editor|&:disabled",
  "segment-field|${}[data-disabled]",
  "select-menu|&[data-disabled]",
  "selection-list|${-item}[aria-disabled=true]",
  "sidebar|${-item}[data-disabled=true]",
  "tag-input|${}[data-disabled]",
  "tree-view|${-node}[data-disabled]",
  "wizard|${-step}[data-disabled]",

  // PLACEHOLDER text, in a field or a segment with no value yet. A prompt for
  // what to type rather than content to read, and the convention every field
  // in the system follows.
  "calendar|.date-field[data-placeholder] .date-field-value",
  "input|&::placeholder",
  "multi-select|&::placeholder",
  "pin-input|&::placeholder",
  "segment-field|&[data-placeholder]",
  "select-menu|-placeholder",
  "tag-input|&::placeholder",
  "textarea|&::placeholder",

  // Days OUTSIDE the month on a calendar — the same date drawn twice, and the
  // faded one is exactly the "de-emphasized duplicate" RULE #3 names.
  "calendar|&[data-outside]",

  // The row being DRAGGED, and the row it is over. A transient state under the
  // pointer, not a reading surface.
  "tree-view|${-node}[data-dragging]",

  // GLYPHS with no words inside them: a close cross, a sort caret, a chevron,
  // the typing dots.
  "alert|-close",
  "chat-suite|chat-typing-dot",
  "collapsible|-trigger-icon",
  "data-table|${-sort-icon} [data-part]",
  "toast|-close",
]);

const failures = [];

/**
 * Every exemption, named, and by which rule let it through.
 *
 * It used to be `let allowed = 0`, and the count was printed and nothing else.
 * Forty-six exemptions under one number is not a record of anything: a new fade
 * whose selector happens to contain "indicator" or "close" joined them silently
 * and the run stayed green. The probe's own comment already promised better —
 * "every partial value is reported and each one is either fixed or written into
 * OPACITY_OK with a reason" — and the code did not do it, because a broad
 * pattern was consulted first. This is that promise implemented.
 */
const allowedBy = { explicit: [], pattern: [], context: [] };
const allow = (rule, what) => allowedBy[rule].push(what);

for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  const name = file.replace(/\.js$/, "");
  const lines = readFileSync(join(componentsDir, file), "utf8").split("\n");
  let selector = null;

  lines.forEach((line, i) => {
    const sel =
      // Greedy to the LAST `]` before the colon: a computed key can nest its own
      // brackets (`[`${sel("-item")}[data-disabled="true"]`]`), and stopping at
      // the first one drops the attribute that makes the rule allowed.
      line.match(/^\s*\[(.+)\]:\s*\{/) || line.match(/^\s*['"](&[^'"]*)['"]:\s*\{/);
    if (sel) selector = sel[1].replace(/sel\(/g, "").replace(/[`"']/g, "").replace(/\)/g, "");
    // `base[`.${prefix}foo`] = {` — a different assignment shape. Capture the
    // WHOLE selector, not just its first segment: these compose descendant and
    // attribute parts (`.date-field[data-placeholder] .date-field-value`), and
    // truncating drops exactly the `[data-placeholder]` that makes it allowed.
    const assigned = line.match(/base\[`([^`]+)`\]\s*=\s*\{/);
    if (assigned) selector = assigned[1].replace(/\$\{prefix\}/g, "");

    // ---- the opacity half -------------------------------------------------
    const fade = line.match(FADED);
    if (fade) {
      const where = selector ?? "(base)";
      if (OPACITY_OK.has(`${name}|${where}`)) {
        allow("explicit", `${name}|${where}`);
      } else if (ALLOW_SELECTOR.test(where) || OPACITY_NOT_TEXT.test(where)) {
        allow("pattern", `${name}|${where}`);
      } else {
        failures.push(
          `${file}:${i + 1} \`${where}\` fades a whole subtree to ${Math.round(+fade[1] * 100)}% ` +
            `with \`opacity\` — if words are inside it, they are faded text (RULE #3). ` +
            `Give the text real ink, or add it to OPACITY_OK in this script with a reason.`,
        );
      }
    }

    const m = line.match(MUTED);
    if (!m) return;

    const context = lines.slice(Math.max(0, i - 4), i + 1).join("\n");
    if (ALLOW_EXPLICIT.has(`${name}|${selector ?? "(base)"}`)) {
      allow("explicit", `${name}|${selector ?? "(base)"}`);
      return;
    }
    if (ALLOW_LINE_CONTEXT.some((re) => re.test(context))) {
      allow("context", `${name}|${selector ?? "(base)"}`);
      return;
    }
    if (ALLOW_SELECTOR.test(selector ?? "")) {
      allow("pattern", `${name}|${selector ?? "(base)"}`);
      return;
    }
    failures.push(
      `${file}:${i + 1} \`${selector ?? "(base)"}\` fades readable text to ${m[1]}% — ` +
        `use var(--color-base-content). If this genuinely isn't meant to be read, ` +
        `add it to ALLOW_EXPLICIT in this script with a reason.`,
    );
  });
}

// A pattern match is a GUESS that a selector carries no words. Each one has to
// have been looked at, or the regex is a hole with a count in front of it.
const pattern = [...new Set(allowedBy.pattern)].sort();
const unreviewed = pattern.filter((k) => !PATTERN_REVIEWED.has(k));
for (const k of unreviewed) {
  failures.push(
    `${k} is faded and was excused only because its SELECTOR looks like a glyph. ` +
      `Open it: if any words are inside, give them real ink. If there are none, ` +
      `add it to PATTERN_REVIEWED in this script.`,
  );
}

for (const f of failures) console.log(`  ✗ ${f}`);
const total = allowedBy.explicit.length + allowedBy.pattern.length + allowedBy.context.length;
console.log(`  ${total} faded instance(s) allowed — ` +
  `${allowedBy.explicit.length} named individually, ${allowedBy.context.length} by line context, ` +
  `${pattern.length} distinct selector(s) matched by pattern and reviewed`);
console.log(
  failures.length
    ? `\n❌ ${failures.length} readable-text instance(s) use faded ink (RULE #3)\n`
    : "\n✅ readable text uses real ink everywhere\n",
);
process.exit(failures.length ? 1 : 0);
