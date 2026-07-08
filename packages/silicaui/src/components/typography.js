/**
 * Typography — @wizeworks/silicaui's UI type ramp (distinct from `.prose`, which styles a
 * block of long-form/markdown content). This gives the *application* a designed
 * default: bare `<h1>`–`<h6>` and `<p>` look right with zero classes, plus
 * explicit `.display` / `.h1`–`.h6` / `.lead` / `.caption` classes to apply any
 * step to any element (a semantic `<h1>` that should read as an h3, etc.).
 *
 * Anchored to the 16px root + the `text-*` scale (see index.js/theme.js). Sizes
 * are in `rem` so the whole ramp tracks the base font size.
 *
 * Two deliberate scoping choices:
 *  • Global element defaults are scoped to `[data-theme]` — the same opt-in
 *    surface @wizeworks/silicaui paints (theme.js) — so @wizeworks/silicaui NEVER restyles a host
 *    page's headings you didn't opt into (the embeddable/Sparx case).
 *  • They use `:where(...)` (zero specificity) so a Tailwind utility
 *    (`text-sm`) OR a `.h*` class always wins without `!important`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function typography(prefix = "") {
  const cls = (name) => `.${prefix}${name}`;

  // The ramp — one source of truth, shared by the global element defaults and
  // the explicit override classes. `tag` maps each step to the native element
  // whose bare default it drives.
  const STEP = {
    display: { tag: "", fontSize: "3rem", lineHeight: "1.05", fontWeight: "800", letterSpacing: "-0.03em" }, // 48
    h1: { tag: "h1", fontSize: "2.25rem", lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }, // 36
    h2: { tag: "h2", fontSize: "1.875rem", lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.02em" }, // 30
    h3: { tag: "h3", fontSize: "1.5rem", lineHeight: "1.25", fontWeight: "650", letterSpacing: "-0.01em" }, // 24
    h4: { tag: "h4", fontSize: "1.25rem", lineHeight: "1.3", fontWeight: "650", letterSpacing: "-0.01em" }, // 20
    h5: { tag: "h5", fontSize: "1.125rem", lineHeight: "1.4", fontWeight: "600", letterSpacing: "0" }, // 18
    h6: { tag: "h6", fontSize: "1rem", lineHeight: "1.5", fontWeight: "600", letterSpacing: "0" }, // 16
  };

  const decls = (s) => ({
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    fontWeight: s.fontWeight,
    letterSpacing: s.letterSpacing,
  });

  const rules = {};

  // ── global element defaults (scoped + zero-specificity) ───────────────────
  // Shared heading treatment: balance the ragged line, inherit the head font.
  rules["[data-theme] :where(h1, h2, h3, h4, h5, h6)"] = {
    fontFamily: "var(--font-head, var(--font-sans))",
    color: "var(--color-base-content)",
    textWrap: "balance",
  };
  for (const s of Object.values(STEP)) {
    if (s.tag) rules[`[data-theme] :where(${s.tag})`] = decls(s);
  }
  // Body copy: comfortable measure-independent leading; `<small>` as caption.
  rules["[data-theme] :where(p)"] = { lineHeight: "1.6" };
  rules["[data-theme] :where(small)"] = {
    fontSize: "0.875rem",
    color: "color-mix(in oklab, var(--color-base-content) 62%, transparent)",
  };

  // ── explicit override classes (normal specificity) ────────────────────────
  // `.display` + `.h1`–`.h6` apply any step to any element; utilities still win
  // (they're emitted in the higher `utilities` layer).
  rules[cls("display")] = {
    fontFamily: "var(--font-head, var(--font-sans))",
    textWrap: "balance",
    ...decls(STEP.display),
  };
  for (const [name, s] of Object.entries(STEP)) {
    if (s.tag) rules[cls(name)] = { fontFamily: "var(--font-head, var(--font-sans))", textWrap: "balance", ...decls(s) };
  }
  // Body-text roles.
  rules[cls("lead")] = {
    fontSize: "1.125rem",
    lineHeight: "1.6",
    fontWeight: "400",
    color: "color-mix(in oklab, var(--color-base-content) 82%, transparent)",
  };
  rules[cls("caption")] = {
    fontSize: "0.875rem",
    lineHeight: "1.4",
    color: "color-mix(in oklab, var(--color-base-content) 62%, transparent)",
  };

  return rules;
}
