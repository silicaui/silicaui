/**
 * A rule that re-points the base tokens must also paint the surface.
 *
 *   node verify-surface-paint.mjs
 *
 * WHY THIS IS A PROBE. `buildBase()` emits the base color tokens from several
 * selectors, and a separate rule paints the page with them. Those two facts have
 * to stay in step, and nothing enforces it: adding a selector that re-points
 * `--color-base-content` without painting compiles, renders, and looks correct.
 *
 * It looked correct for a whole release. `prefersdark` was added beside the token
 * blocks and re-pointed every `--color-*` to its dark value; the paint rule
 * matched `[data-theme]` alone and was left behind. An OS-dark visitor with no
 * stored choice got Silica's LIGHT ink swapped for its DARK ink over a background
 * Silica never painted — readable only because the UA darkens its own canvas
 * under `color-scheme: dark`, and never once the actual `--color-base-100`. The
 * product's own site shipped its own dark theme in the browser's grey.
 * (docs/personas/issues/013.)
 *
 * That is the failure this probe exists for: not "the colors are wrong", which a
 * contrast check would catch, but "the ink moved and the background did not".
 *
 * THE RULE. Any selector that declares `--color-base-content` must also declare
 * `background-color`, either on itself or through a rule that matches the same
 * elements.
 *
 * The exceptions, and why each is real:
 *
 *   :root                  Deliberately unpainted. This is the embeddable
 *                          default — Silica must never repaint a host page that
 *                          did not opt in, which is what keeps it mountable
 *                          under another design system. It is also SAFE
 *                          unpainted, because these are the light tokens: dark
 *                          ink on an unknown background is the readable
 *                          direction. The dark branch is the dangerous one, and
 *                          it is not exempt.
 *
 *   [data-theme="light"]   Painted by the generic `[data-theme]` rule, which
 *   [data-theme="dark"]    matches every element these two match. Checked below
 *                          rather than assumed.
 */
import { buildBase, surfaceScopes } from "../src/theme.js";
import { typography } from "../src/components/typography.js";

/** Selectors allowed to set ink without painting, with the reason above. */
const UNPAINTED_BY_DESIGN = new Set([":root"]);

/** Selectors painted by a more general rule that matches the same elements. */
const PAINTED_BY = new Map([
  ['[data-theme="light"]', "[data-theme]"],
  ['[data-theme="dark"]', "[data-theme]"],
]);

/**
 * Walk the nested object `buildBase()` returns, yielding every real CSS rule as
 * `[selector, declarations]`. At-rules (`@media …`) are containers, not rules,
 * so we recurse through them and keep the inner selector.
 */
function* rules(node, selector = null) {
  for (const [key, value] of Object.entries(node)) {
    if (value === null || typeof value !== "object") continue;
    if (key.startsWith("@")) {
      yield* rules(value, selector);
    } else {
      yield [key, value];
      // A selector block can nest further selectors; keep looking.
      yield* rules(value, key);
    }
  }
  if (selector) return;
}

const failures = [];

// Both shapes of the plugin's output: the default, and `prefersdark: true`.
for (const prefersDark of [false, true]) {
  const base = buildBase({ prefersDark });
  const all = [...rules(base)];
  const painted = new Set(
    all.filter(([, d]) => "backgroundColor" in d).map(([sel]) => sel),
  );

  for (const [selector, decls] of all) {
    if (!("--color-base-content" in decls)) continue;
    if (UNPAINTED_BY_DESIGN.has(selector)) continue;

    if ("backgroundColor" in decls) continue;

    // The SAME selector, painted by a different rule in the same output. This
    // is how `prefersdark` is built: the paint is declared once at
    // `:root:not([data-theme])` and the media query re-points only the tokens
    // underneath it, because `surface()` names `var(--color-base-100)` rather
    // than a value. Identical selector means identical elements, so the ink and
    // the background cannot come apart — which is the only thing this probe is
    // asking. It is not a loophole: the shape issue 013 actually shipped had
    // this selector appearing ONLY inside the media query, painted nowhere, and
    // that still fails here.
    if (painted.has(selector)) continue;

    const by = PAINTED_BY.get(selector);
    if (by && painted.has(by)) continue;

    failures.push(
      `  prefersdark: ${prefersDark} — \`${selector}\` sets --color-base-content ` +
        `but nothing paints it.\n` +
        `    It changes the ink and leaves the background to the browser. Add ` +
        `...surface() to it,\n` +
        `    or add it to PAINTED_BY naming the rule that covers the same elements.`,
    );
  }
}

// ── part two: everything else scoped to a surface follows the same list ─────
//
// The paint is not the only thing `[data-theme]` carries. The type ramp does
// too, and it shipped hardcoded to that one selector — so an app on
// `prefersdark`, which must NOT set the attribute, got no typography at all and
// every `<h1>` rendered at 16px/400, identical to a paragraph (issues/015).
//
// Asserted by RUNNING the module in both modes rather than grepping for the
// string: what matters is the selectors that come out, not how they were built.
for (const prefersDark of [false, true]) {
  const scopes = surfaceScopes(prefersDark);
  const selectors = Object.keys(typography("", prefersDark));
  // The global element defaults are the scoped ones; `.h1`, `.lead` etc. are
  // plain classes and deliberately reach anywhere.
  const globals = selectors.filter((sel) => sel.includes(":where("));

  if (!globals.length) {
    failures.push("  typography(): no scoped element defaults found at all — did the shape change?");
    continue;
  }
  for (const sel of globals) {
    for (const scope of scopes) {
      if (!sel.includes(scope)) {
        failures.push(
          `  prefersdark: ${prefersDark} — typography rule \`${sel}\`\n` +
            `    is missing the surface \`${scope}\`. Build the key with surfaceScopes(),\n` +
            `    not a hardcoded selector — that is how the whole type ramp went missing.`,
        );
      }
    }
  }
}

if (failures.length) {
  console.error("❌ surface scoping\n");
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log("✅ surface paint: ink is painted, and the type ramp reaches every surface");
