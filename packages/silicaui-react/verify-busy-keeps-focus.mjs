/**
 * A BUSY control must not use the native `disabled` attribute.
 *
 *   node verify-busy-keeps-focus.mjs
 *
 * WHY THIS IS A PROBE. `disabled={loading}` is the obvious line to write, it
 * type-checks, it looks right on screen, and it breaks the keyboard in a way
 * nothing reports: when the element a keyboard user is standing on gains
 * `disabled`, the browser moves focus to `<body>`.
 *
 * So pressing Enter on a submit button stranded them for the length of the
 * request — no focus ring anywhere, the next Tab restarting from the top of the
 * document, and a screen reader losing its place with `aria-busy` set and
 * nothing focused to announce it. Found by driving a form on the keyboard alone
 * (docs/personas/issues/023); no typecheck, lint rule or unit test can see it,
 * because nothing is wrong with the markup — the defect is in what the browser
 * does next.
 *
 * `aria-disabled` says the same thing to assistive technology, keeps the element
 * focusable, and is already styled identically in button.js
 * (`&:disabled, &[aria-disabled='true']` share one rule). A genuinely `disabled`
 * control still takes the real attribute: that state is not temporary, the user
 * did not just press it, and leaving the tab order is correct there.
 *
 * WHAT IT CHECKS. For every component that accepts a `loading` prop, the value
 * passed to a native `disabled={…}` must not be derived from `loading`. The
 * derivation is followed one hop — `disabled={isDisabled}` is resolved to the
 * `const isDisabled = …` line in the same file — because that indirection is
 * exactly how the Button defect hid.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "src");

/** Identifiers whose name alone says the value is a busy state. */
const BUSY = /\bloading\b|\bbusy\b|\bpending\b|\bsubmitting\b/;

const failures = [];
let checked = 0;

for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".tsx"))) {
  const src = readFileSync(join(srcDir, file), "utf8");
  if (!/loading\??:\s*boolean/.test(src)) continue; // takes no loading prop
  checked++;

  const lines = src.split("\n");
  lines.forEach((line, i) => {
    // `disabled={…}` on an element. Not `aria-disabled`, not `data-disabled`.
    const m = line.match(/(?<![a-z-])disabled=\{([^}]+)\}/);
    if (!m) return;
    const expr = m[1].trim();

    // Inline: `disabled={disabled || loading}`.
    if (BUSY.test(expr)) {
      failures.push(
        `${file}:${i + 1} \`disabled={${expr}}\` — a busy control that takes the ` +
          `native attribute drops the keyboard user's focus to <body>. Use ` +
          `\`aria-disabled\` for the busy half and keep \`disabled\` for a real one.`,
      );
      return;
    }

    // One hop: `disabled={isDisabled}` where `isDisabled` is built from loading.
    const ident = expr.match(/^[A-Za-z_$][\w$]*$/)?.[0];
    if (!ident) return;
    const decl = src.match(new RegExp(`\\b(?:const|let)\\s+${ident}\\s*=([^;]+);`));
    if (decl && BUSY.test(decl[1])) {
      failures.push(
        `${file}:${i + 1} \`disabled={${ident}}\`, and \`${ident}\` is built from a ` +
          `busy state:\n      ${ident} =${decl[1].trim()}\n` +
          `    That drops the keyboard user's focus to <body> for the length of the ` +
          `request. Pass the busy half through \`aria-disabled\` instead.`,
      );
    }
  });
}

for (const f of failures) console.error(`  ✗ ${f}`);
console.log(`  ${checked} component(s) with a \`loading\` prop checked`);
console.log(
  failures.length
    ? `\n❌ ${failures.length} control(s) go native-disabled while busy\n`
    : "\n✅ busy controls keep their focus\n",
);
process.exit(failures.length ? 1 : 0);
