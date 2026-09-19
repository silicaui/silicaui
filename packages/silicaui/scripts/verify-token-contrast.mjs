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
import { colorVariantRules } from "../src/color-variants.js";

let failures = 0;

// ── the JS simulation below must stay tied to the CSS it stands in for ───────
//
// Everything this file says about "role as ink" is computed by a JS copy of
// `inkOf` from color-variants.js. Two copies of one formula is exactly the shape
// the header warns about for `contrastRatio` — the probe goes on printing
// reassuring numbers while the stylesheet does something else.
//
// So the constants are read back out of the GENERATED CSS and checked. Change
// the mix ratio or the chroma multiplier in one place and this fails until both
// agree.
const MIX = 50;
const CHROMA = 2;
{
  const emitted = colorVariantRules("button", ["warning"], "")[".btn-warning"]["--btn-ink"];
  const want = [`${MIX}%`, `calc(c * ${CHROMA})`, "var(--color-base-content)"];
  const missing = want.filter((w) => !emitted.includes(w));
  if (missing.length) {
    failures++;
    console.error(
      `  ✗ the ink derivation in color-variants.js no longer matches this probe.
` +
        `    emitted: ${emitted}
` +
        `    missing: ${missing.join(", ")}
` +
        `    Update MIX / CHROMA here to match, and re-check the numbers below.`,
    );
  } else {
    console.log(`ink derivation: role mixed ${MIX}% toward base-content, chroma x${CHROMA} — CSS and probe agree`);
  }
}

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

// ── the other direction: a role used as INK on the page ─────────────────────
//
// Everything above asks "is the -content legible ON this colour?" — the SOLID
// pairing. It is only half the contract, and the half that was tested.
//
// `soft`, `outline` and `ghost` do the reverse: they paint the role colour as
// TEXT on the base surface. Nothing checked that, for any role, in either mode.
// `neutral` failed it at 1.5:1 in dark — invisible column headers on the screen
// a night shift reads for six hours — while this probe stayed green at 10.4:1
// on the pairing it does test (docs/personas/issues/018).
//
// FILL_ONLY_ROLES in color-variants.js re-points the ink for roles whose colour
// is deliberately a fill, so they are exempt HERE and covered THERE: the check
// below is what proves such a role needs that treatment in the first place.
const FILL_ONLY = new Set(["neutral"]);

/**
 * The same derivation `inkOf` does in CSS, in JS, so this probe measures what a
 * label is ACTUALLY painted with rather than the token it came from.
 *
 * Measuring the raw token was right while the raw token WAS the ink. It is not
 * any more: `soft`/`outline`/`ghost`/`link` read `--<root>-ink`, which is the
 * role mixed halfway to `--color-base-content` with its chroma doubled back
 * (docs/personas/issues/019). A probe left pointing at the token would now go on
 * reporting `warning` at 1.77 while the screen shows 5.58 — and, worse, would
 * stay green through a regression in the derivation itself.
 *
 * `color-mix(in oklab, …)` interpolates in OKLab, so go through a/b rather than
 * lerping hue, which would take the wrong way round the wheel.
 */
const toLab = ({ l, c, h }) => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
const fromLab = ([l, a, b]) => ({ l, c: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 });
function inkOf(role, baseContent) {
  const x = toLab(role);
  const y = toLab(baseContent);
  const p = MIX / 100;
  const mixed = fromLab(x.map((v, i) => v * p + y[i] * (1 - p)));
  return { l: mixed.l, c: mixed.c * CHROMA, h: mixed.h };
}

// KNOWN AND TRACKED, NOT ACCEPTED. Turning this check on found that LIGHT mode
// fails it for most chromatic roles — `warning` reads 1.78:1 as a ghost label on
// the default surface. Real, measured in the browser as well as here, and filed
// as docs/personas/issues/019 with the fix designed.
//
// It is not fixed in the same breath because the honest fix is a fill/ink SPLIT
// across ~28 component families: the clamped colour is right for a label and
// wrong for the hover fill that reuses the same variable. That is a deliberate,
// wide, visible change to the default theme and it gets its own pass.
//
// Listed here so the build is green while the numbers stay LOUD — every one is
// printed on every run with its real ratio and its issue number. An exemption
// that printed nothing would be this file telling the same lie it was written to
// catch. Deleting an entry must make the build fail, not merely go quiet.
const TRACKED_BELOW_AA = new Map([["LIGHT", new Set([])]]);

for (const [mode, bag] of [
  ["LIGHT", LIGHT],
  ["DARK", DARK],
]) {
  console.log(`\n${mode} — role as ink on the page:`);
  const surface = parseColor(bag["base-100"]);
  for (const name of Object.keys(bag)) {
    if (name.endsWith("-content") || name.startsWith("base-")) continue;
    if (FILL_ONLY.has(name)) {
      console.log(`  – ${name} — fill-only; its ink is base-content (see FILL_ONLY_ROLES)`);
      continue;
    }
    const color = parseColor(bag[name]);
    const baseContent = parseColor(bag["base-content"]);
    if (!color || !surface || !baseContent) {
      failures++;
      console.error(`  ✗ ${name}: unparseable against base-100`);
      continue;
    }
    const raw = contrastRatio(color, surface);
    const ratio = contrastRatio(inkOf(color, baseContent), surface);
    if (ratio >= AA_NORMAL) {
      // A tracked entry that now passes has to be deleted, or the list quietly
      // becomes a list of things nobody rechecks — which is how an exemption
      // outlives the defect it was written for.
      if (TRACKED_BELOW_AA.get(mode)?.has(name)) {
        failures++;
        console.error(
          `  ✗ ${name} — ${ratio.toFixed(2)}:1 on base-100 PASSES AA now, but it is still ` +
            `listed in TRACKED_BELOW_AA["${mode}"].\n` +
            `    Remove it from that list; it is fixed.`,
        );
        continue;
      }
      console.log(
        `  ✓ ${name} — ${ratio.toFixed(2)}:1 on base-100 as ink` +
          (raw < AA_NORMAL ? `  (the raw token would be ${raw.toFixed(2)})` : ""),
      );
      continue;
    }
    if (TRACKED_BELOW_AA.get(mode)?.has(name)) {
      console.log(
        `  ! ${name} — ${ratio.toFixed(2)}:1 on base-100, BELOW AA (${AA_NORMAL}). ` +
          `Known, tracked in docs/personas/issues/019.`,
      );
      continue;
    }

    failures++;
    console.error(
      `  ✗ ${name} — ${ratio.toFixed(2)}:1 on base-100 is below AA (${AA_NORMAL}).\n` +
        `    ${name}-soft, ${name}-outline and ${name}-ghost paint this colour as TEXT\n` +
        `    on the page, so they are unreadable in ${mode}. Either retune the token for\n` +
        `    this mode, or — if the colour is meant as a FILL rather than an ink — add it\n` +
        `    to FILL_ONLY_ROLES in src/color-variants.js and to FILL_ONLY here.`,
    );
  }
}

if (failures > 0) {
  console.error(`\n✗ token contrast: ${failures} pair(s) below WCAG AA`);
  process.exit(1);
}
console.log(
  "\n✅ token contrast: -content reads on its colour, and every ink role reads on the page",
);
