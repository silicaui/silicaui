import { contentVar } from "./lib/auto-content.js";
import { ink as inkOf } from "./lib/ink.js";

/**
 * Every component's COLOR VARIANT mapping, in one declarative table.
 *
 * Silica's core promise is that N named colors cascade through everything: a
 * color you invent gets `btn-<c>`, `badge-<c>`, `alert-<c>`, … for free. Each
 * component honored that with its own inline `for (const name of colors)` loop
 * — 35 copies of the same shape, private to 35 module scopes. Only Button had
 * ever been factored out (as `buttonColorVars`), which is why the builder's
 * runtime cascade could re-generate exactly ONE family for a live-invented
 * color: a `brand` created in the theme editor painted `btn-brand` and nothing
 * else. The promise held at build time and quietly collapsed to a single
 * component at runtime.
 *
 * Centralizing the mapping makes the whole set addressable by both callers —
 * the plugin at build time and `customColorCss` at runtime — from the SAME
 * generator, so a live color is byte-for-byte a declared one across every
 * family, not just buttons. It also means a new colored component is one table
 * entry rather than a loop that can be forgotten (`verify-color-reach.mjs`
 * fails the build if a factory takes `colors` without registering here).
 *
 * Every entry is a pure VAR-SETTER: a color class assigns `--<c>-*` variables
 * and paints nothing itself, so it never fights the style/size classes on
 * specificity and composes with all of them for free. See button.js for the
 * full rationale of that split.
 */

/**
 * The shared "tinted resting border" for field-shaped controls — the color at
 * `--field-border-tint` strength over the surface, so an unfocused input reads
 * as its color without shouting. Guarded by verify-field-border.mjs.
 */
const fieldBorder = (name) =>
  `color-mix(in oklab, var(--color-${name}) var(--field-border-tint, 45%), var(--color-base-100))`;

// The ink derivation lives in lib/ink.js: components that paint a role colour as
// text directly (a required asterisk, a validator message) need the identical
// formula, and two copies of it would stop agreeing.
//
// See that file for why it is a mix toward `--color-base-content` rather than the
// lightness clamp issue 019 first proposed — the clamp needs to know which way to
// go, and a hand-rolled theme would omit the flag and invert it.

/** The common selector shape: `.<prefix><root>-<name>`. */
const cls = (root) => (prefix, name) => `.${prefix}${root}-${name}`;

/**
 * key → { sel, vars }, keyed by the factory name index.js calls, so this table
 * reads against that call list one-for-one.
 *
 * `vars` receives (name, color, content) where `color` is `var(--color-<name>)`
 * and `content` is the `-content` foreground (explicit token, else auto-derived).
 */
export const COLOR_VARIANTS = {
  button: {
    sel: cls("btn"),
    vars: (n, c, ct) => ({
      "--btn-bg": c,
      "--btn-fg": ct,
      "--btn-accent": c,
      "--btn-accent-content": ct,
    }),
  },
  badge: {
    sel: cls("badge"),
    vars: (n, c, ct) => ({
      "--badge-bg": c,
      "--badge-fg": ct,
      "--badge-accent": c,
      "--badge-accent-content": ct,
    }),
  },
  input: {
    sel: cls("input"),
    vars: (n, c) => ({ "--input-accent": c, "--input-border": fieldBorder(n) }),
  },
  pinInput: {
    // The color lands on the CELL, not the wrapper — the cell is what paints.
    sel: cls("pin-input-cell"),
    vars: (n, c) => ({ "--pin-input-accent": c, "--pin-input-border": fieldBorder(n) }),
  },
  select: {
    sel: cls("select"),
    vars: (n, c) => ({ "--select-accent": c, "--select-border": fieldBorder(n) }),
  },
  textarea: {
    sel: cls("textarea"),
    vars: (n, c) => ({ "--textarea-accent": c, "--textarea-border": fieldBorder(n) }),
  },
  alert: {
    sel: cls("alert"),
    vars: (n, c, ct) => ({
      "--alert-bg": c,
      "--alert-fg": ct,
      "--alert-accent": c,
      "--alert-accent-content": ct,
    }),
  },
  progress: {
    sel: cls("progress"),
    vars: (n, c) => ({ "--progress-fill": c }),
  },
  avatar: {
    sel: cls("avatar"),
    vars: (n, c, ct) => ({ "--avatar-bg": c, "--avatar-fg": ct, "--avatar-accent": c }),
  },
  steps: {
    sel: cls("step"),
    vars: (n, c, ct) => ({ "--step-bg": c, "--step-fg": ct }),
  },
  link: {
    sel: cls("link"),
    vars: (n, c, ct) => ({ "--link-accent": c, "--link-accent-content": ct }),
  },
  rating: {
    sel: cls("rating"),
    vars: (n, c, ct) => ({ "--rating-accent": c, "--rating-accent-content": ct }),
  },
  pagination: {
    sel: cls("pagination"),
    vars: (n, c, ct) => ({ "--pagination-accent": c, "--pagination-accent-content": ct }),
  },
  chat: {
    sel: cls("chat-bubble"),
    vars: (n, c, ct) => ({ "--chat-bubble-bg": c, "--chat-bubble-fg": ct }),
  },
  range: {
    sel: cls("range"),
    vars: (n, c, ct) => ({ "--range-accent": c, "--range-accent-content": ct }),
  },
  toast: {
    // Toast keys off the semantic `data-type` the runtime sets, not a class.
    sel: (prefix, name) => `.${prefix}toast[data-type="${name}"]`,
    vars: (n, c, ct) => ({ "--toast-bg": c, "--toast-fg": ct }),
  },
  status: {
    sel: cls("status"),
    vars: (n, c) => ({ "--status-accent": c }),
  },
  dock: {
    sel: cls("dock"),
    vars: (n, c, ct) => ({ "--dock-accent": c, "--dock-accent-content": ct }),
  },
  meter: {
    sel: cls("meter"),
    vars: (n, c, ct) => ({ "--meter-fill": c, "--meter-fill-content": ct }),
  },
  toggleGroup: {
    sel: cls("toggle-group"),
    vars: (n, c, ct) => ({ "--toggle-group-pill-bg": c, "--toggle-group-pill-fg": ct }),
  },
  slider: {
    sel: cls("slider"),
    vars: (n, c, ct) => ({ "--slider-accent": c, "--slider-accent-content": ct }),
  },
  switchControl: {
    sel: cls("switch"),
    vars: (n, c) => ({ "--switch-accent": c }),
  },
  filter: {
    sel: cls("filter"),
    vars: (n, c, ct) => ({ "--filter-accent": c, "--filter-accent-content": ct }),
  },
  multiSelect: {
    sel: cls("multi-select"),
    vars: (n, c) => ({ "--multi-select-accent": c, "--multi-select-border": fieldBorder(n) }),
  },
  segmentField: {
    sel: cls("segment-field"),
    vars: (n, c) => ({ "--segment-field-accent": c, "--segment-field-border": fieldBorder(n) }),
  },
  calendar: {
    sel: cls("calendar"),
    vars: (n, c, ct) => ({ "--calendar-accent": c, "--calendar-accent-content": ct }),
  },
  dataTable: {
    sel: cls("data-table"),
    vars: (n, c) => ({ "--dt-accent": c }),
  },
  tagInput: {
    sel: cls("tag-input"),
    vars: (n, c) => ({ "--tag-accent": c, "--tag-border": fieldBorder(n) }),
  },
  wizard: {
    sel: cls("wizard"),
    vars: (n, c, ct) => ({ "--wz-accent": c, "--wz-accent-content": ct }),
  },
  wordmark: {
    sel: cls("wordmark"),
    vars: (n, c) => ({ "--wordmark-color": c }),
  },
  sidebar: {
    sel: cls("sidebar"),
    vars: (n, c, ct) => ({ "--sidebar-accent": c, "--sidebar-accent-content": ct }),
  },
  tabs: {
    sel: cls("tabs"),
    vars: (n, c, ct) => ({ "--tabs-accent": c, "--tabs-accent-content": ct }),
  },
  checkbox: {
    sel: cls("checkbox"),
    vars: (n, c, ct) => ({
      "--checkbox-accent": c,
      "--checkbox-border": fieldBorder(n),
      "--checkbox-content": ct,
    }),
  },
  radio: {
    // Soft border while unchecked; `:checked` repaints border + fill solid.
    sel: cls("radio"),
    vars: (n, c) => ({ "--radio-accent": c, "--radio-border": fieldBorder(n) }),
  },
  toggle: {
    sel: cls("toggle"),
    vars: (n, c) => ({ "--toggle-accent": c }),
  },
};

/**
 * Roles whose colour is a FILL and never an INK.
 *
 * `neutral` is the only one today, and it is not an arbitrary exception — it is
 * the one role the dark palette deliberately keeps DARK. Every chromatic role
 * lightens for dark (`accent` 64%→72%, `info` 68%→74%); `neutral` goes 26%→32%,
 * because its job is a subtle chip a shade lighter than the page, carrying light
 * `neutral-content` on top. As a fill that is right and measures 10.4:1.
 *
 * As an ink it is invisible. `soft`/`outline`/`ghost` paint the role colour as
 * TEXT on the base surface, and `oklch(32%)` on a `oklch(16%)` page is
 * **1.5:1** — a third of the AA floor. Thirty-one of the thirty-two
 * role × variant pairs pass; these three are the failures, and they are what a
 * night-shift operator reads at 22:00 (docs/personas/issues/018).
 *
 * MOVING THE TOKEN CANNOT FIX IT, which is why this is a mapping and not a new
 * colour. The two uses pull opposite ways and no lightness satisfies both —
 * measured across the range, they cross around 53% where each is only ~3.5:
 *
 *     L  32%   38%   44%   50%   56%   62%   68%   74%
 *     as ink on the page   1.5   1.9   2.5   3.2   4.2   5.3   6.7   8.4
 *     content on top of it 10.4   8.1   6.3   4.9   3.8   3.0   2.3   1.9
 *
 * So the ink form takes its own source. "Neutral ink on a neutral surface" IS
 * the surface's own ink, which is per-theme already and therefore correct in
 * both modes without a conditional CSS cannot express. It is also what an
 * UNCOLOURED button has always used: every rule reads
 * `var(--btn-accent, var(--color-base-content))`, so this makes `btn-neutral`
 * agree with the default it was overriding rather than inventing a value.
 */
const FILL_ONLY_ROLES = new Set(["neutral"]);

/**
 * Applied to every family's output rather than to 28 table entries, so a
 * component added later is covered without anyone remembering this — and so the
 * builder's runtime cascade, which calls the same generator, fixes a live
 * colour identically.
 */
function inkSafe(name, vars) {
  if (!FILL_ONLY_ROLES.has(name)) return vars;
  const out = {};
  for (const [k, v] of Object.entries(vars)) {
    // Only the INK moves. `-accent` stays the real `neutral`, so a variant that
    // FILLS with it still fills with neutral and still carries its declared
    // `neutral-content` — which was always the correct pair and is not what
    // issue 018 was about.
    //
    // `inkOf(neutral)` would in fact clear AA on its own now (1.53 -> 5.45 in
    // dark), so this entry is no longer load-bearing for correctness. It is kept
    // because "neutral ink on a neutral surface" IS the surface's own ink, which
    // measures 15.75 rather than 5.45 and is per-theme by construction. A better
    // answer than the general formula, for the one role that has one.
    if (k.endsWith("-ink")) out[k] = "var(--color-base-content)";
    else out[k] = v;
  }
  return out;
}

/**
 * The `.<root>-<name>` variant rules for ONE component.
 *
 * @param {string} key - a key of COLOR_VARIANTS (the factory name in index.js)
 * @param {string[]} colors - color names to generate variants for
 * @param {string} [prefix] - prepended verbatim to every class
 */
export function colorVariantRules(key, colors, prefix = "") {
  const spec = COLOR_VARIANTS[key];
  if (!spec) throw new Error(`[silicaui] unknown color-variant component "${key}"`);
  const rules = {};
  for (const name of colors) {
    const vars = spec.vars(name, `var(--color-${name})`, contentVar(name));
    // Every family that has an `--<root>-accent` gets an `--<root>-ink` beside
    // it, derived here rather than declared in 28 table entries — so a component
    // added later is covered by existing, and the builder's runtime cascade
    // produces the identical pair for a colour invented live.
    for (const key of Object.keys(vars)) {
      if (key.endsWith("-accent")) vars[`${key.slice(0, -"-accent".length)}-ink`] = inkOf(`var(--color-${name})`);
    }
    rules[spec.sel(prefix, name)] = inkSafe(name, vars);
  }
  return rules;
}

/**
 * The variant rules for EVERY colored component — the whole cascade for a set
 * of colors, as one flat rule map.
 *
 * This is what the builder's runtime cascade re-generates for a color invented
 * live in the theme editor, so `brand` reaches Badge/Alert/Input/Tabs/… exactly
 * as it would had it been declared in the plugin's `colors:` list at build time.
 *
 * @param {string[]} colors - color names to generate variants for
 * @param {string} [prefix] - prepended verbatim to every class
 */
export function allColorVariantRules(colors, prefix = "") {
  const rules = {};
  for (const key of Object.keys(COLOR_VARIANTS)) {
    Object.assign(rules, colorVariantRules(key, colors, prefix));
  }
  return rules;
}
