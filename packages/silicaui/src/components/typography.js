/**
 * Typography — @wizeworks/silicaui's UI type ramp (distinct from `.prose`, which styles a
 * block of long-form/markdown content). This gives the *application* a designed
 * default: bare `<h1>`–`<h6>` and `<p>` look right with zero classes, plus
 * explicit `.display` / `.display-1`–`.display-3` / `.h1`–`.h6` / `.lead` /
 * `.caption` classes to apply any step to any element (a semantic `<h1>` that
 * should read as an h3, or a hero `<h1>` sized up to `.display-1`, etc.).
 *
 * Anchored to the 16px root + the `text-*` scale (see index.js/theme.js).
 * Heading sizes are in `rem` so they track the base font size; the oversized
 * display ramp is fluid (`clamp` + container units) — see DISPLAY_STEPS.
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

  // The heading ramp — one source of truth, shared by the global element defaults
  // and the explicit override classes. `tag` maps each step to the native element
  // whose bare default it drives. The oversized DISPLAY ramp is separate (it maps
  // to no tag and is fluid) — see DISPLAY_STEPS below.
  const STEP = {
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
    color: "var(--color-base-content)",
  };
  // Bare `<blockquote>` — a pull-quote/testimonial treatment (distinct from
  // `.prose`'s smaller, italic, inline-quote-in-a-paragraph style).
  rules["[data-theme] :where(blockquote)"] = {
    margin: "0",
    paddingInlineStart: "1.25rem",
    borderInlineStart: "0.25rem solid var(--color-primary)",
    fontSize: "1.125rem",
    lineHeight: "1.6",
    color: "var(--color-base-content)",
  };
  rules["[data-theme] :where(blockquote > footer, blockquote > cite)"] = {
    display: "block",
    marginTop: "0.5rem",
    fontSize: "0.875rem",
    fontStyle: "normal",
    color: "var(--color-base-content)",
  };

  // ── explicit override classes (normal specificity) ────────────────────────
  // `.display` + `.h1`–`.h6` apply any step to any element; utilities still win
  // (they're emitted in the higher `utilities` layer).
  // Oversized display ramp — hero/marketing type above the headings. FLUID by
  // design: each step is `clamp(min, 1rem + N·cqi, max)`, so it scales with its
  // CONTAINER instead of overflowing a phone at a fixed size. `max` is the old
  // fixed desktop size (unchanged where there's room); `min` is a sane mobile
  // floor. `cqi` (1% of the container's inline size) resolves against the nearest
  // `container-type` ancestor — block/section roots set `inline-size`, matching
  // the canvas's container-query-first model — and falls back to the small
  // viewport when there is none, so both a block on the canvas AND a bare page
  // scale sensibly with NO breakpoints and no per-device editing.
  //
  // `.display-1` is the largest; bare `.display` is a synonym of `.display-3`
  // (the ramp's foot), not a fourth orphaned size. Tighter leading + heavier
  // negative tracking as size climbs — big type needs both to hold together.
  const DISPLAY_STEPS = {
    "display-1": { fontSize: "clamp(2.5rem, 1rem + 6cqi, 4.5rem)", lineHeight: "1.02", fontWeight: "800", letterSpacing: "-0.035em" }, // 40 → 72
    "display-2": { fontSize: "clamp(2.125rem, 1rem + 4.5cqi, 3.75rem)", lineHeight: "1.04", fontWeight: "800", letterSpacing: "-0.03em" }, // 34 → 60
    "display-3": { fontSize: "clamp(1.875rem, 1rem + 3.5cqi, 3rem)", lineHeight: "1.06", fontWeight: "800", letterSpacing: "-0.03em" }, // 30 → 48
  };
  const displayDecls = (s) => ({ fontFamily: "var(--font-head, var(--font-sans))", textWrap: "balance", ...decls(s) });
  rules[cls("display")] = displayDecls(DISPLAY_STEPS["display-3"]);
  for (const [name, s] of Object.entries(DISPLAY_STEPS)) rules[cls(name)] = displayDecls(s);
  for (const [name, s] of Object.entries(STEP)) {
    if (s.tag) rules[cls(name)] = { fontFamily: "var(--font-head, var(--font-sans))", textWrap: "balance", ...decls(s) };
  }
  // Body-text roles.
  rules[cls("lead")] = {
    fontSize: "1.125rem",
    lineHeight: "1.6",
    fontWeight: "400",
    color: "var(--color-base-content)",
  };
  rules[cls("caption")] = {
    fontSize: "0.875rem",
    lineHeight: "1.4",
    color: "var(--color-base-content)",
  };
  rules[cls("blockquote")] = {
    margin: "0",
    paddingInlineStart: "1.25rem",
    borderInlineStart: "0.25rem solid var(--color-primary)",
    fontSize: "1.125rem",
    lineHeight: "1.6",
    color: "var(--color-base-content)",
  };
  rules[cls("blockquote-cite")] = {
    display: "block",
    marginTop: "0.5rem",
    fontSize: "0.875rem",
    fontStyle: "normal",
    color: "var(--color-base-content)",
  };

  return rules;
}
