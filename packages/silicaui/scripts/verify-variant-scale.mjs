/**
 * Components in the surface-variant system ship the WHOLE vocabulary.
 *
 *   node verify-variant-scale.mjs
 *
 * WHY THIS IS A PROBE. Identical in shape to the partial-size-scale defect this
 * package's verify-size-scale.mjs guards: `variant="ghost"` worked on a `Badge`
 * and was a type error on an `Alert`, and typecheck stayed silent because the
 * TypeScript union was *honest* — `AlertVariant` faithfully described a
 * component that really was missing `ghost`. Types can't catch a gap they
 * accurately describe.
 *
 * `solid` is deliberately NOT required as a class: it's the base rule on all
 * three components, consistently, so there's nothing to drift.
 *
 * `link` is deliberately NOT in the set. It means "render as a hyperlink" — an
 * interaction affordance that only `Button` has. Adding `badge-link` /
 * `alert-link` would be filling a grid rather than fixing a gap.
 *
 * An explicit list is used instead of a heuristic because two real classes
 * would otherwise be misread: `collapse-ghost` is a flush/borderless LAYOUT on a
 * colorless component (no solid/outline/soft/dash concept exists there), and
 * `toolbar-link` / `navigation-menu-link` are sub-part names, not variants. The
 * drift check below still catches a genuinely new surface-variant component.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const componentsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "components");

/** Modules in the surface-variant system; each must ship every REQUIRED class. */
const SURFACE_VARIANT_MODULES = ["button.js", "badge.js", "alert.js"];
const REQUIRED = ["outline", "soft", "ghost", "dash"];

const failures = [];

/** Top-level selector keys a module's factory produces. */
async function selectorsOf(file) {
  const mod = await import(`file://${join(componentsDir, file)}`);
  const fn = Object.values(mod).find((v) => typeof v === "function");
  if (!fn) return null;
  try {
    // Arity discriminates colored `(colors, prefix)` from colorless `(prefix)`.
    return Object.keys(fn.length === 2 ? fn(["primary", "error"], "") : fn(""));
  } catch {
    return null;
  }
}

for (const file of SURFACE_VARIANT_MODULES) {
  const keys = await selectorsOf(file);
  if (!keys) {
    failures.push(`${file}: no exported factory function found`);
    continue;
  }
  const missing = REQUIRED.filter((v) => !keys.some((k) => new RegExp(`^\\.[a-z-]+-${v}$`).test(k)));
  if (missing.length) {
    failures.push(
      `${file}: missing variant(s) ${missing.join("/")} — every component in the surface-variant ` +
        `system ships ${REQUIRED.join("/")} (plus solid as the base rule)`,
    );
  }
}

// Drift: a module outside the list that defines 2+ of the core variants has
// almost certainly joined the system without being registered here.
for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  if (SURFACE_VARIANT_MODULES.includes(file)) continue;
  const keys = await selectorsOf(file);
  if (!keys) continue;
  const found = REQUIRED.filter((v) => keys.some((k) => new RegExp(`^\\.[a-z-]+-${v}$`).test(k)));
  if (found.length >= 2) {
    failures.push(
      `${file}: defines ${found.join("/")} but is not in SURFACE_VARIANT_MODULES — ` +
        `add it (and ship the full set), or rename if these aren't surface variants`,
    );
  }
}

for (const f of failures) console.log(`  ✗ ${f}`);
console.log(`  checked ${SURFACE_VARIANT_MODULES.length} surface-variant module(s) + drift across all modules`);
console.log(
  failures.length
    ? `\n❌ ${failures.length} variant-vocabulary problem(s)\n`
    : "\n✅ every surface-variant component ships the full variant vocabulary\n",
);
process.exit(failures.length ? 1 : 0);
