import { contentVar } from "./lib/auto-content.js";

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
    rules[spec.sel(prefix, name)] = spec.vars(name, `var(--color-${name})`, contentVar(name));
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
