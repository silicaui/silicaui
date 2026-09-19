/**
 * Generates `src/lib/catalog.ts` — a per-component description and nav group for
 * every page under /docs/components — from the MCP catalog the repo already ships.
 *
 * Run it:            node apps/site/scripts/gen-catalog.mjs
 * Check it in CI:    node apps/site/scripts/gen-catalog.mjs --check
 *
 * Why it exists (docs/personas/issues/006 and 007):
 *
 *   - 101 of 116 component pages had no description. They fell back to a template
 *     sentence with the component's name slotted in, which is also the page's
 *     `<meta description>`, its OG description and its llms.txt abstract. A reader
 *     comparing "Table" with "Data Table" got one real sentence and one template,
 *     so the comparison could not be made.
 *   - The docs nav was 116 items under a single "Components" heading.
 *
 * Both were already solved in `packages/silicaui-mcp/src/data/components.json`,
 * which carries a real `description` and a `category` per component, extracted from
 * the source. The site was hand-maintaining a 15-entry map beside it. This reads the
 * catalog instead, so there is one source of truth and it cannot drift.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_META } from "@wizeworks/silicaui-demos/meta";

const here = dirname(fileURLToPath(import.meta.url));
const REPO = join(here, "..", "..", "..");
const OUT = join(here, "..", "src", "lib", "catalog.ts");

/**
 * The API reference lives in its OWN module, imported only by the Server Component
 * that renders a component page. The demo sources average ~2KB each (240KB across
 * 116) — fine as per-page prerendered HTML, not fine in a module the client nav also
 * pulls in. Keeping them apart is what makes that safe. See issues/008.
 */
const OUT_API = join(here, "..", "src", "lib", "catalog-api.ts");

const catalog = JSON.parse(
  readFileSync(join(REPO, "packages", "silicaui-mcp", "src", "data", "components.json"), "utf8"),
);

const classIndex = JSON.parse(
  readFileSync(join(REPO, "packages", "silicaui-mcp", "src", "data", "classes.json"), "utf8"),
);

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Index by name AND by package, because a component exists on up to three paths and
 * they are different entries.
 *
 * The first version of this kept only the first entry per name, so whichever package
 * happened to come first in the file won — `@wizeworks/silicaui-react` for Button —
 * and the CSS and node-tree entries were silently discarded. That is how every page
 * came to tell a Django developer to `npm i @wizeworks/silicaui-react`. See
 * docs/personas/issues/009.
 */
const CSS_PKG = "@wizeworks/silicaui";
const REACT_PKG = "@wizeworks/silicaui-react";
const HTML_PKG = "@wizeworks/silicaui-html";

/**
 * The opt-in composites are React too — they are just not in `silicaui-react`.
 * Matching only on `REACT_PKG` dropped the React section from Data Table, Chart,
 * Rich Text Editor, Sortable List and Resizable Panels, which are exactly the five
 * components a reader is most likely to need an install line for.
 */
const COMPOSITE_PKGS = [
  "@wizeworks/silicaui-table",
  "@wizeworks/silicaui-charts",
  "@wizeworks/silicaui-editor",
  "@wizeworks/silicaui-dnd",
  "@wizeworks/silicaui-panels",
];

const byNameAndPkg = new Map();
const byName = new Map();
for (const e of catalog) {
  if (!e?.name) continue;
  const k = `${norm(e.name)}::${e.package ?? ""}`;
  if (!byNameAndPkg.has(k)) byNameAndPkg.set(k, e);
  // The React entry is the richest (props + usage), so it stays the one the
  // description and grouping are read from.
  if (!byName.has(norm(e.name)) || e.package === REACT_PKG) {
    if (!byName.has(norm(e.name)) || byName.get(norm(e.name)).package !== REACT_PKG) {
      byName.set(norm(e.name), e);
    }
  }
}

const lookup = (demo, pkg) =>
  byNameAndPkg.get(`${norm(demo.title)}::${pkg}`) ?? byNameAndPkg.get(`${norm(demo.id)}::${pkg}`);

/**
 * The catalog's descriptions are written for a developer reading the MCP, so they
 * are `Silica <Name> — <prose>. <code example>`. Take the prose and drop the
 * example: cut at the first JSX tag with a capital letter (a lowercase one inside
 * backticks, like `<table>`, is prose and must survive) or the first `//` comment.
 */
function prose(raw, title) {
  if (!raw) return null;
  let s = String(raw).replace(/\s+/g, " ").trim();

  // "Silica Button — …" / "Silica Button - …"
  s = s.replace(new RegExp(`^Silica\\s+${title.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[—-]\\s*`, "i"), "");
  s = s.replace(/^Silica\s+[A-Z][\w ()/]*\s*[—-]\s*/, "");

  const cut = Math.min(
    ...[s.search(/\s<[A-Z]/), s.search(/\s\/\//), s.indexOf("\n")].filter((i) => i > 0).concat([s.length]),
  );
  s = s.slice(0, cut).trim();

  // Markdown links are for the MCP's reader, not a meta description.
  s = s.replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, "$1");
  s = s.replace(/[:;,]$/, "").replace(/`/g, "").trim();
  if (!s) return null;
  s = s[0].toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += ".";

  return capToSentence(s, 200);
}

/**
 * Trim to at most `max` characters, ending on a real sentence boundary.
 *
 * THE ONE implementation. There were three near-copies of this loop in this file
 * and I fixed the abbreviation handling in only one of them — so Dialog's
 * `nativeButton` still came out ending at "e.g." while the function that was
 * supposed to prevent exactly that passed its own test. Fixing a rule in one of
 * three renderers is the defect this repo has a memory note about, and I wrote it
 * into the tool that was finding it.
 */
function capToSentence(s, max) {
  if (s.length <= max) return s;
  const ends = [];
  let acc = 0;
  for (const sentence of splitSentences(s)) {
    acc = s.indexOf(sentence, acc) + sentence.length;
    ends.push(acc);
  }
  const fits = ends.filter((e) => e <= max);
  return s.slice(0, fits.length ? fits[fits.length - 1] : (ends[0] ?? max)).trim();
}

/**
 * `css` and `wrapper` are package-origin markers, not places a person would look.
 * These twelve are the editorial judgement no data source has — a reader hunting
 * for a toast is not thinking "this one happens to be CSS-only".
 */
const REGROUP = {
  // was "css"
  Typography: "Foundations",
  Animations: "Foundations",
  Mockup: "Layout",
  Toast: "Feedback & overlay",
  "Select (Advanced)": "Data input",
  "Chat Suite": "Advanced / composite",
  Dropdown: "Navigation",
  // was "wrapper" — all five are the opt-in composite packages
  "Data Table": "Advanced / composite",
  Chart: "Advanced / composite",
  "Rich Text Editor": "Advanced / composite",
  "Sortable List": "Advanced / composite",
  "Resizable Panels": "Advanced / composite",
  // matches no catalog entry at all
  Hooks: "Foundations",
};

// A 2-item "Typography" group beside a 37-item "Data input" reads as an accident,
// so the base layer collects together.
const MERGE = { Typography: "Foundations" };

/** Reading order, not alphabetical: what you reach for first comes first. */
export const GROUP_ORDER = [
  "Actions",
  "Data input",
  "Data display",
  "Feedback & overlay",
  "Navigation",
  "Layout",
  "Advanced / composite",
  "Foundations",
];

/**
 * The exported symbol a consumer actually imports. The catalog's `name` is the
 * component's real export name, so this is derived rather than guessed — and where
 * there is no React package at all (the CSS-only components), it stays null so the
 * page can show absence as absence instead of inventing an import that would fail.
 */
function importLine(entry) {
  if (!entry?.package || !entry?.name) return null;
  if (!/^@wizeworks\//.test(entry.package)) return null;
  return `import { ${entry.name} } from "${entry.package}";`;
}

/**
 * A prop's doc comment, fit for a table cell.
 *
 * The raw docs are TSDoc written for someone reading the source, so some carry a
 * code example and a multi-paragraph caveat — `render`'s is ~600 characters and
 * turned one row into a wall. Cut at the first code example (same rule as the
 * component descriptions) and cap on a sentence boundary; the full text stays
 * reachable through the MCP and the source.
 */
/**
 * Split on sentence ends found BY POSITION. A `.` only ends a sentence when
 * whitespace or the end follows it, so `Intl.RelativeTimeFormat` and `btn-<color>.`
 * stay whole. Used by both the prop docs and the length cap below.
 */
const ABBREV = /(?:^|[\s("])(?:e\.g|i\.e|etc|vs|cf|approx|Fig|No|Dr|Mr|Ms|St|Inc|Ltd)$/i;

function splitSentences(s) {
  const out = [];
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (!".!?".includes(s[i])) continue;
    if (i !== s.length - 1 && !/\s/.test(s[i + 1])) continue;
    // "…something else, e.g. a div" is one sentence. Without this guard the docs
    // for Dialog's `nativeButton` and Combobox's `popupProps` both ended at "e.g."
    if (s[i] === "." && ABBREV.test(s.slice(Math.max(0, i - 8), i))) continue;
    out.push(s.slice(start, i + 1).trim());
    start = i + 1;
  }
  const tail = s.slice(start).trim();
  if (tail) out.push(tail);
  return out.filter(Boolean);
}

function propDoc(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/\s+/g, " ").trim();

  // Strip a source-file SECTION BANNER — `── form controls ──────────…`.
  //
  // A component that happens to be first in its section of the source inherits the
  // file's divider comment as its doc, so Input, Alert, Dialog, Breadcrumb, Stat,
  // Label and ChatImage were all publishing a rule of box-drawing characters and an
  // internal note like "(2026-07-08 bucket-2b sync pass)" as their documentation.
  // Seven of 150 — found by reading a page I had navigated to by accident.
  s = s.replace(/^\s*─+[^─]*─{2,}\s*/, "").trim();

  s = s.replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, "$1");

  // Drop whole SENTENCES that are code, keep every sentence that is prose —
  // including prose AFTER an example.
  //
  // Two earlier attempts got this wrong in opposite directions, so the reasoning is
  // written down. Cutting at the first example lost `render`'s "CLIENT COMPONENTS
  // ONLY" caveat, which is a correctness warning, not a nicety. Stripping tags
  // instead ate the `<color>` out of "maps to `btn-<color>`" and left fragments like
  // "}>Docs" behind. Sentence-level filtering keeps both cases right: the test is
  // for JSX *syntax* (a capitalised tag, a self-close, an attribute brace), none of
  // which appears in prose, and `<color>` is lowercase so it survives.
  const isCode = (t) => /<[A-Z]|\/>|\}>|=\{|^\s*import\s/.test(t);
  const sentences = splitSentences(s);
  const kept = sentences.filter((t) => !isCode(t));
  // Some docs are ONE long sentence that happens to contain an inline example —
  // Combobox's `popupProps` is a single 300-character sentence with
  // `popupProps={{…}}` in the middle. Filtering it out leaves nothing, and an empty
  // cell is worse than a slightly code-ish one, so fall back to the full text.
  s = (kept.length ? kept : sentences).join(" ").replace(/\s+/g, " ").trim();

  // Backticks are TSDoc's code markers. In a plain table cell they read as typos.
  //
  // No whitespace-before-punctuation collapse here: it was added to tidy up after
  // tag-stripping, and since that is gone it only did harm — "(default: `.label`)"
  // came out as "(default:.label)" because the token legitimately starts with a dot.
  s = s.replace(/`/g, "").replace(/[:;,]$/, "").trim();
  if (!s) return null;

  s = capToSentence(s, 220);
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

/** Flatten the catalog's prop interfaces into rows a table can render. */
function propRows(entry) {
  const groups = Array.isArray(entry?.props) ? entry.props : [];
  const out = [];
  for (const g of groups) {
    for (const m of g.members ?? []) {
      if (!m?.name) continue;
      out.push({
        iface: g.name ?? null,
        name: m.name,
        type: (m.type ?? "").replace(/\s+/g, " ").trim() || "—",
        required: m.optional === false,
        doc: propDoc(m.doc),
      });
    }
  }
  return out;
}

const entries = [];
const api = [];
const unresolved = [];
for (const d of DEMO_META) {
  const e = byName.get(norm(d.title)) ?? byName.get(norm(d.id));
  const description = prose(e?.description, d.title);
  const raw = e?.category;
  const group = REGROUP[d.title] ?? MERGE[raw] ?? raw ?? null;
  if (!group || !GROUP_ORDER.includes(group)) unresolved.push(`${d.title} → ${group ?? "(none)"}`);
  entries.push({ id: d.id, title: d.title, description, group: group ?? "Foundations" });

  // ---- path 1: CSS classes -------------------------------------------------
  const cssEntry = lookup(d, CSS_PKG);
  const classes = classIndex[d.id] ?? classIndex[norm(d.title)] ?? null;
  const css =
    cssEntry || classes
      ? {
          classes: Array.isArray(classes) ? classes : [],
          root: Array.isArray(classes) ? (classes[0] ?? null) : null,
        }
      : null;

  // ---- path 2: React -------------------------------------------------------
  const reactEntry =
    lookup(d, REACT_PKG) ?? COMPOSITE_PKGS.map((p) => lookup(d, p)).find(Boolean) ?? null;
  const react = reactEntry
    ? {
        importLine: importLine(reactEntry),
        packageName: reactEntry.package,
        props: propRows(reactEntry),
        source: reactEntry.usageExample ?? null,
      }
    : null;

  // ---- path 3: node tree → HTML -------------------------------------------
  const htmlEntry = lookup(d, HTML_PKG);
  const html = htmlEntry
    ? {
        name: htmlEntry.name,
        container: htmlEntry.container === true,
        behaviors: Array.isArray(htmlEntry.behaviors) ? htmlEntry.behaviors : [],
        doc: propDoc(htmlEntry.doc),
      }
    : null;

  api.push({ id: d.id, css, react, html });
}

if (unresolved.length) {
  throw new Error(
    "gen-catalog: these components have no nav group, so the docs sidebar would\n" +
      "silently drop them into the wrong place. Add them to REGROUP in this script.\n  " +
      unresolved.join("\n  "),
  );
}

const missingDesc = entries.filter((e) => !e.description);
const banner = `// GENERATED by apps/site/scripts/gen-catalog.mjs — do not edit.
//
// Per-component description + nav group, read from the MCP catalog
// (packages/silicaui-mcp/src/data/components.json) so the docs have ONE source of
// truth. 101 of these pages used to fall back to a template sentence with the name
// slotted in — see docs/personas/issues/006 and 007.
//
// Regenerate with \`node apps/site/scripts/gen-catalog.mjs\`; \`pnpm verify\` fails if
// this file and the catalog disagree.
`;

const body = `${banner}
export interface CatalogEntry {
  id: string;
  title: string;
  /** Null only where the catalog has no prose for it; the caller falls back. */
  description: string | null;
  group: string;
}

/** Reading order for the docs sidebar — what you reach for first comes first. */
export const GROUP_ORDER = [
${GROUP_ORDER.map((g) => `  ${JSON.stringify(g)},`).join("\n")}
] as const;

export const CATALOG: Record<string, CatalogEntry> = {
${entries
  .map(
    (e) =>
      `  ${JSON.stringify(e.id)}: { id: ${JSON.stringify(e.id)}, title: ${JSON.stringify(
        e.title,
      )}, description: ${JSON.stringify(e.description)}, group: ${JSON.stringify(e.group)} },`,
  )
  .join("\n")}
};
`;

const apiBody = `// GENERATED by apps/site/scripts/gen-catalog.mjs — do not edit.
//
// The API reference for each component page: what to import, the props, and the
// source of the demo rendered above it. Read from the MCP catalog
// (packages/silicaui-mcp/src/data/components.json).
//
// **Import this ONLY from a Server Component.** The demo sources average ~2KB each;
// they are meant to become prerendered HTML on one page, never a client bundle that
// every page pays for. See docs/personas/issues/008.

export interface PropRow {
  /** Which interface it came from, when a component has more than one. */
  iface: string | null;
  name: string;
  type: string;
  required: boolean;
  doc: string | null;
}

/** Path 1 — the Tailwind plugin. Classes only; this path ships no JavaScript. */
export interface CssPath {
  /** Every class in the family, root first. */
  classes: string[];
  root: string | null;
}

/** Path 2 — React components over those same classes, behavior from Base UI. */
export interface ReactPath {
  importLine: string | null;
  packageName: string | null;
  props: PropRow[];
  /**
   * The demo's own source, so it cannot drift from what is rendered above it.
   * NOT paste-able — it imports this site's \`../lib/*\` helpers — so it must be
   * labelled as the demo's source and never as a usage snippet.
   */
  source: string | null;
}

/** Path 3 — the framework-neutral node tree, hydrated by silicaui-behaviors. */
export interface HtmlPath {
  /** The name \`atom()\` takes. */
  name: string;
  /** Whether it accepts children. */
  container: boolean;
  /** Behaviors the vanilla runtime hydrates on it; empty means it is static. */
  behaviors: string[];
  doc: string | null;
}

export interface ComponentApi {
  id: string;
  /** Null when the component does not exist on that path — never invented. */
  css: CssPath | null;
  react: ReactPath | null;
  html: HtmlPath | null;
}

export const COMPONENT_API: Record<string, ComponentApi> = {
${api
  .map(
    (a) =>
      `  ${JSON.stringify(a.id)}: {\n` +
      `    id: ${JSON.stringify(a.id)},\n` +
      `    css: ${JSON.stringify(a.css)},\n` +
      `    react: ${JSON.stringify(a.react)},\n` +
      `    html: ${JSON.stringify(a.html)},\n` +
      `  },`,
  )
  .join("\n")}
};
`;

const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
const currentApi = existsSync(OUT_API) ? readFileSync(OUT_API, "utf8") : "";
const withCss = api.filter((a) => a.css?.classes.length).length;
const withReact = api.filter((a) => a.react?.importLine).length;
const withProps = api.filter((a) => a.react?.props.length).length;
const withSource = api.filter((a) => a.react?.source).length;
const withHtml = api.filter((a) => a.html).length;
const withNone = api.filter((a) => !a.css && !a.react && !a.html).map((a) => a.id);

if (process.argv.includes("--check")) {
  if (current !== body || currentApi !== apiBody) {
    console.error(
      `gen-catalog: ${current !== body ? "catalog.ts" : "catalog-api.ts"} is stale.\n` +
        "Run: node apps/site/scripts/gen-catalog.mjs",
    );
    process.exit(1);
  }
  console.log(
    `gen-catalog: ok — ${entries.length} components · css ${withCss} · react ${withReact} · html ${withHtml}.`,
  );
  process.exit(0);
}

writeFileSync(OUT, body);
writeFileSync(OUT_API, apiBody);
console.log(`gen-catalog: wrote ${entries.length} components into catalog.ts + catalog-api.ts`);
console.log(`  with a description: ${entries.length - missingDesc.length}`);
if (missingDesc.length) console.log(`  without: ${missingDesc.map((e) => e.title).join(", ")}`);
console.log(
  `  paths — css: ${withCss} · react: ${withReact} (props ${withProps}, source ${withSource}) · html: ${withHtml}`,
);
if (withNone.length) console.log(`  NO path at all: ${withNone.join(", ")}`);
const counts = {};
for (const e of entries) counts[e.group] = (counts[e.group] ?? 0) + 1;
console.log(
  "  groups: " + GROUP_ORDER.map((g) => `${g} ${counts[g] ?? 0}`).join(" · "),
);
