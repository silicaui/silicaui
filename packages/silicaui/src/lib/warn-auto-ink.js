/**
 * Say so when the CSS ink rule is about to pick the wrong foreground.
 *
 * THE PAPERCUT, and it is the quietest one in the color engine.
 *
 *   @theme { --color-brand: oklch(58% 0.24 320); }
 *   @plugin "@wizeworks/silicaui" { colors: …, brand; }
 *
 * No `--color-brand-content`, so every `btn-brand`, `badge-brand`,
 * `alert-brand` falls back to the lightness rule in `auto-content.js`. That rule
 * flips ink at `l = 0.57`; this color is `l = 0.58`, so it takes black, at
 * 4.28:1 — under WCAG AA — while white sits unused at 4.91:1.
 *
 * Nothing errors. Nothing logs. A strong purple with black text reads as a
 * design decision, not as a coin flip that landed wrong, and because a color
 * cascades through every family at once, one unlucky hue is wrong EVERYWHERE
 * simultaneously. It shipped on the site's own N-color demo button and was
 * found by a persona scoring a page, not by any check
 * (docs/personas/issues/032).
 *
 * WHY NOT JUST MOVE THE THRESHOLD. It was measured: over a 51,480-sample sweep
 * of the l/c/h space, `0.57` is the optimum for a lightness-only rule (`0.56`
 * and `0.58` are both measurably worse), and a chroma-aware variant `l - k*c`
 * more than doubles the wrong-ink count. CSS cannot compute a contrast ratio, so
 * ~2.3% of the space stays wrong no matter the constant. The repair is therefore
 * not a better guess — it is to stop guessing where the value is already known.
 *
 * `measure-ink.js` does the measuring and explains why it lives in this package
 * rather than being imported from `@wizeworks/silicaui-html`.
 */
import {
  AA,
  contrast,
  fixLine,
  inkOf,
  inkVerdict,
  looksLikeKnownFormat,
  readColor,
} from "./measure-ink.js";

/**
 * @typedef {object} InkFinding
 * @property {string} name      the color's role name
 * @property {string} value     the color as authored
 * @property {ReturnType<typeof inkVerdict>} verdict
 */

/**
 * Measure every readable color and return the ones whose derived ink fails.
 *
 * A color that cannot be read — a `var()`, a `color-mix()`, a format this does
 * not parse — is SKIPPED, never guessed at. Warning about a color nobody can
 * check is worse than silence, because it teaches people to ignore the channel.
 *
 * @param {Record<string, string>} colors  role name → authored value
 * @param {number} [threshold]             `--silica-content-threshold`
 * @returns {InkFinding[]}
 */
export function findInkProblems(colors, threshold = 0.57) {
  const out = [];
  for (const [name, value] of Object.entries(colors)) {
    if (name.endsWith("-content")) continue;
    const verdict = inkVerdict(value, threshold);
    if (!verdict) {
      // Unreadable splits in two, and only one half is anybody's fault.
      if (looksLikeKnownFormat(value)) out.push({ name, value, malformed: true });
      continue;
    }
    if (verdict.passesAA) continue;
    out.push({ name, value, verdict });
  }
  return out;
}

/**
 * The values of the colors actually registered in `colors:`, read from
 * Tailwind's theme.
 *
 * `theme("color")` returns name → VALUE, which is the fact this whole file
 * turns on: the plugin is not blind to a declared color, it simply never
 * looked. Colors it cannot see are colors declared AFTER the `@plugin` line, or
 * in plain `:root` rather than `@theme` — the same known blind spot
 * `warn-unregistered-colors.js` documents, and it fails the same way, by
 * staying quiet.
 *
 * @param {(path: string) => unknown} theme  the plugin API's `theme` accessor
 * @param {string[]} registered              the resolved `colors:` list
 */
export function registeredColorValues(theme, registered) {
  let palette;
  try {
    palette = theme("color");
  } catch {
    return {}; // Older/different Tailwind — detection is best-effort only.
  }
  if (!palette || typeof palette !== "object") return {};

  const out = {};
  for (const name of registered) {
    const value = palette[name];
    // A color whose `-content` is declared alongside it never reaches the rule.
    if (typeof value === "string" && !palette[`${name}-content`]) out[name] = value;
  }
  return out;
}

/**
 * Roles whose TEXT form cannot be read on the theme's own surface.
 *
 * A different failure from the ink one, and the one a lightness threshold can
 * never touch. `--color-primary` at `l = 0.58` on `--color-base-100` at
 * `l = 0.60` carries a perfectly legible ink ON the fill (4.85:1) — and every
 * `text-primary`, `link-primary`, `btn-primary-ghost` and
 * `badge-primary-outline` disappears into the page, because those paint the
 * color as TEXT.
 *
 * WHAT IS MEASURED, AND WHY NOT THE RAW COLOR. The first version of this check
 * compared the role's FILL to the surface against WCAG 1.4.11's 3:1, and it was
 * wrong — run against a real palette it warned on five well-chosen colors at
 * once (a verdigris at 2.77:1, an amber `warning` at 2.36:1), which is simply
 * what a mid-tone accent measures against a near-white page and is not a defect
 * at all. A filled button is identified by its label and its shape, not by its
 * fill's contrast with the page.
 *
 * So the value measured here is the one actually painted: `lib/ink.js`'s
 * derivation, mixed halfway toward `--color-base-content` and re-chromatised,
 * against `--color-base-100`, at WCAG 1.4.3's 4.5:1 for body text. That is a
 * real text requirement on a real painted value, with no invented constant —
 * and it separates cleanly: the same two palettes measure 6.33 and 6.01 (quiet)
 * where a deliberately pathological one measures 2.77 and 2.56 (named).
 *
 * Only a theme block can run this: it is the one place the role,
 * `--color-base-content` and `--color-base-100` arrive together as literals.
 *
 * @param {Record<string, string>} colors  role name → authored value
 * @param {string} surface                 the authored `--color-base-100`
 * @param {string} baseInk                 the authored `--color-base-content`
 */
export function findInkTextProblems(colors, surface, baseInk) {
  const base = readColor(surface);
  if (!base || !readColor(baseInk)) return [];
  const out = [];
  for (const [name, value] of Object.entries(colors)) {
    if (name.startsWith("base-")) continue;
    const painted = inkOf(value, baseInk);
    if (!painted) continue;
    const ratio = contrast(painted.rgb, base.rgb);
    if (ratio >= AA) continue;
    out.push({ name, value, ratio: +ratio.toFixed(2) });
  }
  return out;
}

/** Report the roles that cannot be read as text. */
export function warnInkTextProblems(findings, surface, where, warn = console.warn) {
  for (const { name, value, ratio } of findings) {
    warn(
      `[silicaui] ${name} (${value}) cannot be read as TEXT on this theme's surface${where}: ${ratio}:1, under WCAG AA (${AA}).\n` +
        `  Its ink on a solid btn-${name} is fine — this is text-${name}, link-${name}, btn-${name}-ghost and ` +
        `badge-${name}-outline, which paint the color itself on --color-base-100 (${surface}).\n` +
        `  Silica already mixes the color halfway toward --color-base-content before painting it as text; ` +
        `this is what is left after that. No --color-${name}-content fixes it — the ink sits on the color, ` +
        `not on the page. Move ${name}'s lightness away from the surface's.`,
    );
  }
}

/**
 * Report those findings, naming both measurements and the line that fixes it.
 *
 * One shape, not two. An earlier version split "avoidable" from "hopeless" — a
 * color no ink can sit on — and the second branch turned out to be unreachable:
 * black and white contrast multiply to exactly 21 against any color, so the
 * better of the two never drops below 4.58. `measure-ink.js` carries the proof.
 * Every finding here is therefore fixable by one declared token, which is why
 * every message can end by naming it.
 *
 * @param {InkFinding[]} findings
 * @param {string} where          a phrase naming the block, for the message
 * @param {(msg: string) => void} [warn]  injectable for testing
 */
export function warnInkProblems(findings, where, warn = console.warn) {
  for (const { name, value, verdict, malformed } of findings) {
    if (malformed) {
      // Measured on a real build: `--color-x: oklch(nonsense)` compiles, emits
      // `.btn-x` and every sibling class, and paints a color the browser throws
      // away — no error, no warning, a control that renders with no fill.
      warn(
        `[silicaui] ${name} (${value}) is not a color this can read${where}.
` +
          `  Every class for it is still emitted, so btn-${name} renders — with a fill the browser drops, ` +
          `silently, because an invalid color value is simply ignored.
` +
          `  Check the value. oklch(), rgb(), rgba() and #hex are understood here.`,
      );
      continue;
    }
    warn(
      `[silicaui] ${name} (${value}) will render ${verdict.ink} text at ${verdict.picked}:1 — under WCAG AA (${AA})${where}.
` +
        `  The ink is derived from lightness (l=${verdict.l}) because no --color-${name}-content is declared, ` +
        `and CSS cannot compare contrast. ${verdict.otherInk} measures ${verdict.alternative}:1 on this color.
` +
        `  Fix: ${fixLine(name, verdict)}`,
    );
  }
}

/**
 * A `-content` somebody WROTE that cannot be read on the color it names.
 *
 * THE HOLE THIS CLOSES. The derivation check above opens with "a color whose
 * `-content` is declared alongside it never reaches the rule" — correct, because
 * nothing is being derived. The consequence is that the engine measures the ink
 * it picks for you and accepts without a glance the ink you picked yourself.
 * Declaring the pair by hand is the one case where a human eye chose it, at
 * night, from a swatch, and it is the case most likely to be wrong.
 *
 * Found at 3.22:1 on a `--color-error` / `--color-error-content` pair written by
 * hand for a freight dashboard, where it painted the "this ship is in serious
 * trouble" badge — the one label on the screen that has to be readable
 * (docs/personas/issues/096).
 *
 * Both values are literals in the theme block, so this costs one contrast
 * calculation and needs nothing the block does not already have.
 *
 * @param {Record<string, string>} tokens  the theme block's raw `--color-*` map
 */
export function findDeclaredContentProblems(tokens) {
  const out = [];
  for (const key of Object.keys(tokens)) {
    const match = /^--color-(.+)$/.exec(key);
    if (!match || match[1].endsWith("-content")) continue;
    const role = match[1];
    if (role.startsWith("base-")) continue;
    const contentKey = `--color-${role}-content`;
    const declared = tokens[contentKey];
    if (typeof declared !== "string") continue;
    const fill = readColor(tokens[key]);
    const ink = readColor(declared);
    if (!fill || !ink) continue;
    const ratio = contrast(fill.rgb, ink.rgb);
    if (ratio >= AA) continue;
    // What the engine would have chosen if it had been left to choose.
    const verdict = inkVerdict(tokens[key]);
    out.push({
      role,
      fill: tokens[key],
      content: declared,
      ratio: Math.round(ratio * 100) / 100,
      best: verdict ? Math.max(Number(verdict.picked), Number(verdict.alternative)) : null,
      bestInk:
        verdict && Number(verdict.alternative) > Number(verdict.picked)
          ? verdict.otherInk
          : verdict
            ? verdict.ink
            : null,
    });
  }
  return out;
}

/** Print what `findDeclaredContentProblems` found. */
export function warnDeclaredContentProblems(findings, where, warn = console.warn) {
  for (const f of findings) {
    warn(
      `[silicaui] --color-${f.role}-content (${f.content}) measures ${f.ratio}:1 on --color-${f.role} (${f.fill}) — under WCAG AA (${AA})${where}.
` +
        `  This pair is DECLARED, so nothing derived it and nothing else checks it: every btn-${f.role}, badge-${f.role} and alert-${f.role} paints this text at ${f.ratio}:1.
` +
        (f.best
          ? `  Fix: remove --color-${f.role}-content and let it be derived (${f.bestInk} measures ${f.best}:1 here), or darken the fill.
`
          : `  Fix: remove --color-${f.role}-content and let it be derived, or darken the fill.
`),
    );
  }
}
