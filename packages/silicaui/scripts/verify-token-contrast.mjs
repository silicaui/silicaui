/**
 * Every `-content` token in the default palette must be LEGIBLE on the color it
 * names.
 *
 *   node verify-token-contrast.mjs
 *
 * WHY THIS IS A PROBE. `verify-readable-ink.mjs` catches text that was faded on
 * purpose. This catches the other half: ink that is full-strength and still
 * unreadable, because the pair was chosen by eye. A hand-authored `-content`
 * looks right in the swatch row and can still be 4.26:1 on the button it
 * actually lands on — which is what `error-content` was.
 *
 * The measurement is imported, never reimplemented: `@wizeworks/silicaui-html`
 * owns `contrastRatio`/`deriveContent` because the theme resolver, the builder,
 * and a host's compiler all have to agree, and a second copy of the math is how
 * they stop agreeing. (Requires that package to be built — CI runs `pnpm build`
 * before `pnpm verify`.)
 *
 * WHY THE IMPORT RESOLVES FROM THE WORKSPACE ROOT. This package deliberately does
 * NOT depend on `@wizeworks/silicaui-html`: silicaui is the CSS floor and
 * silicaui-html builds on top of it, so an edge back down would invert the stack
 * — and since silicaui-html now takes a real `workspace:*` dev edge on silicaui
 * for its `/theme` subpath, that inversion would close a cycle. A cycle here is
 * not a style question: each edge is a symlink, so A→B→A is a symlink loop, and
 * the one that briefly existed killed the Next site build with a bare
 * `RangeError: Invalid array length` out of webpack's directory walk.
 * `@wizeworks/silicaui-html` is a devDependency of the workspace ROOT instead,
 * which resolves for this probe and cannot close a cycle because nothing depends
 * on the root. `scripts/verify-workspace-acyclic.mjs` holds that line.
 */
import { AA_NORMAL, contrastRatio, deriveContent, parseColor } from "@wizeworks/silicaui-html";
import { DARK, LIGHT } from "../src/colors.js";

let failures = 0;

for (const [mode, bag] of [
  ["LIGHT", LIGHT],
  ["DARK", DARK],
]) {
  console.log(`\n${mode}:`);
  for (const name of Object.keys(bag)) {
    if (name.endsWith("-content")) continue;
    const ink = bag[`${name}-content`];
    if (!ink) continue; // no declared pair — the resolver/CSS fallback derives one

    const color = parseColor(bag[name]);
    const fg = parseColor(ink);
    if (!color || !fg) {
      failures++;
      console.error(`  ✗ ${name}: unparseable (${bag[name]} / ${ink})`);
      continue;
    }

    const ratio = contrastRatio(color, fg);
    if (ratio >= AA_NORMAL) {
      console.log(`  ✓ ${name} — ${ratio.toFixed(2)}:1`);
      continue;
    }

    failures++;
    const best = deriveContent(color);
    console.error(
      `  ✗ ${name} — ${ratio.toFixed(2)}:1 is below AA (${AA_NORMAL}). ` +
        `Best available is ${best?.ink} ink at ${best?.ratio}:1 → ${best?.value}`,
    );
  }
}

if (failures > 0) {
  console.error(`\n✗ token contrast: ${failures} pair(s) below WCAG AA`);
  process.exit(1);
}
console.log("\n✅ token contrast: every declared -content pair clears WCAG AA");
