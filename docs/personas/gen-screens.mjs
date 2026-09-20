/**
 * Generates the screen inventory in rating.md FROM THE CODE.
 *
 * Run it:            node docs/personas/gen-screens.mjs
 * Check it in CI:    node docs/personas/gen-screens.mjs --check
 *
 * Why it exists: a rating file that cannot show what has NOT been looked at is the
 * same lie as an empty issue list. The denominator has to be real, and it has to
 * stay real — so this script is the only thing allowed to write the rows, and it
 * THROWS when a builder pane appears that is neither classified as a screen nor
 * explicitly excluded with a reason. A denominator that silently stops counting is
 * worse than no denominator.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const START = "<!-- BEGIN GENERATED SCREENS -->";
const END = "<!-- END GENERATED SCREENS -->";

// ── 1. silicaui.com — Next.js App Router ──────────────────────────────────────
// Walk app/ for route files. The component doc pages are ONE route file that
// expands 1:1 from DEMO_META, so they are expanded here the same way the router
// expands them — one row per real address, not one row for all of them.
const APP = join(REPO, "apps", "site", "app");

function walkRoutes(dir, segments = []) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // (group) folders don't appear in the address bar.
      const seg = /^\(.*\)$/.test(entry.name) ? null : entry.name;
      out.push(...walkRoutes(full, seg ? [...segments, seg] : segments));
    } else if (/^page\.(tsx|ts|mdx)$/.test(entry.name)) {
      out.push({ route: "/" + segments.join("/"), file: relative(REPO, full) });
    } else if (entry.name === "not-found.tsx" && segments.length === 0) {
      out.push({ route: "(404)", file: relative(REPO, full) });
    }
  }
  return out;
}

const demoMetaSrc = readFileSync(
  join(REPO, "packages", "silicaui-demos", "src", "meta.ts"),
  "utf8",
);
const DEMOS = [...demoMetaSrc.matchAll(/\{ id: "([a-z0-9-]+)", title: "([^"]+)" \}/g)].map(
  (m) => ({ id: m[1], title: m[2] }),
);
if (DEMOS.length === 0) throw new Error("gen-screens: parsed 0 demos out of meta.ts");

const rawRoutes = walkRoutes(APP).sort((a, b) => a.route.localeCompare(b.route));
const siteRoutes = [];
for (const r of rawRoutes) {
  if (r.route.includes("[slug]")) {
    for (const d of DEMOS) {
      siteRoutes.push({
        name: `${d.title} — component doc`,
        key: r.route.replace("[slug]", d.id),
      });
    }
  } else {
    const name =
      r.route === "/"
        ? "Home"
        : r.route === "(404)"
          ? "Not found (404)"
          : r.route
              .slice(1)
              .split("/")
              .map((s) => s[0].toUpperCase() + s.slice(1).replace(/-/g, " "))
              .join(" › ");
    siteRoutes.push({ name, key: r.route });
  }
}

// ── 2. The playground ─────────────────────────────────────────────────────────
// One page that maps over the same DEMOS array. It is one screen, not many — the
// per-component content is already counted above as doc pages.
const playground = [{ name: "Playground (all demos, one page)", key: "localhost:5173/" }];

// ── 3. The builder — panes, not routes ────────────────────────────────────────
// The builder is one screen with panes, so the panes ARE the screens. Every source
// file in these directories must appear in exactly one of the two tables below.
const PANES = {
  "src/site/react": {
    "Canvas.tsx": ["Site builder › Canvas", "builder?editor=site"],
    "Navigator.tsx": ["Site builder › Layers (Navigator)", "left rail › Layers"],
    "Palette.tsx": ["Site builder › Insert (Palette)", "left rail › Insert"],
    "FindPanel.tsx": ["Site builder › Find", "left rail › Find"],
    "PagesPanel.tsx": ["Site builder › Pages", "left rail head, page mode"],
    "LayoutsPanel.tsx": ["Site builder › Layouts", "left rail head, layout mode"],
    "ComponentsPanel.tsx": ["Site builder › Components", "left rail head, component mode"],
    "ComponentBoard.tsx": ["Site builder › Component board", "canvas, component mode"],
    "ComponentStarterDialog.tsx": ["Site builder › New component (dialog)", "component mode › New"],
    "Inspector.tsx": ["Site builder › Inspector", "right rail"],
    "ThemeEditor.tsx": ["Site builder › Theme editor", "theme mode, right rail"],
    "ThemeLibrary.tsx": ["Site builder › Theme library", "theme mode, left rail"],
  },
  "src/email/react": {
    "Canvas.tsx": ["Email builder › Canvas", "builder?editor=email"],
    "Navigator.tsx": ["Email builder › Layers", "left rail › Layers"],
    "Palette.tsx": ["Email builder › Insert", "left rail › Insert"],
    "Inspector.tsx": ["Email builder › Inspector", "right rail"],
    "EmailPreview.tsx": ["Email builder › Preview", "toolbar › Preview"],
    "EmailStarterDialog.tsx": ["Email builder › New email (dialog)", "left rail head › Add"],
    "TemplatesPanel.tsx": ["Email builder › Templates", "left rail head"],
    "FindPanel.tsx": ["Email builder › Find", "left rail › Find"],
    "saved-blocks.tsx": ["Email builder › Saved blocks", "left rail › Insert › Saved"],
  },
  "src/shared/react": {
    "RecoveryBanner.tsx": ["Builder › Recovery banner", "shown after a crash with unsaved work"],
  },
};

// Not panes, with the reason. A file in neither table stops the generator.
const NOT_PANES = {
  "src/site/react": {
    "Builder.tsx": "the shell — its toolbar is chrome every pane shares",
    "breakpoint-context.tsx": "context",
    "editor-context.tsx": "context",
    "host-context.tsx": "context",
    "host.ts": "types",
    "index.ts": "barrel",
    "react-attrs.ts": "helper",
    "use-shortcuts.ts": "hook",
    "google-fonts-catalog.ts": "data",
    "google-fonts-loader.ts": "helper",
  },
  "src/email/react": {
    "EmailBuilder.tsx": "the shell — chrome, as above",
    "editor-context.tsx": "context",
    "host-context.tsx": "context",
    "host.ts": "types",
    "index.ts": "barrel",
    "theme-defaults.ts": "data",
    "token-query.ts": "helper",
    "inspector-focus.tsx": "context",
    "SubjectBar.tsx": "chrome above the Canvas, scored with it",
    "use-shortcuts.ts": "hook",
  },
  "src/shared/react": {
    "DropOverlay.tsx": "overlay drawn over the Canvas, scored with it",
    "SelectionOverlay.tsx": "overlay drawn over the Canvas, scored with it",
    "PeerOverlay.tsx": "overlay drawn over the Canvas, scored with it",
    "ErrorBoundary.tsx": "wrapper",
    "Hint.tsx": "inline affordance",
    "Icon.tsx": "primitive",
    "chrome.tsx": "shared PanelHead / PanelTabs primitives",
    "studio-theme.tsx": "theme island wrapper",
    "use-commit-on-hide.ts": "hook",
  },
};

const BUILDER = join(REPO, "packages", "silicaui-builder");
const builderScreens = [];
const unclassified = [];
for (const dir of Object.keys(PANES)) {
  const abs = join(BUILDER, dir);
  if (!existsSync(abs)) throw new Error(`gen-screens: missing ${dir}`);
  for (const f of readdirSync(abs).sort()) {
    if (!/\.(tsx|ts)$/.test(f)) continue;
    if (PANES[dir][f]) {
      const [name, key] = PANES[dir][f];
      builderScreens.push({ name, key });
    } else if (!NOT_PANES[dir]?.[f]) {
      unclassified.push(`${dir}/${f}`);
    }
  }
  // A pane listed here that no longer exists is just as wrong as a new one.
  for (const f of Object.keys(PANES[dir])) {
    if (!existsSync(join(abs, f))) unclassified.push(`${dir}/${f} (listed as a pane but GONE)`);
  }
}
if (unclassified.length) {
  throw new Error(
    "gen-screens: these builder files are neither a screen nor explicitly excluded.\n" +
      "Classify each one in gen-screens.mjs — a denominator that silently stops\n" +
      "counting is worse than no denominator.\n  " +
      unclassified.join("\n  "),
  );
}

// The Inspector's two built-in tabs are two different screens to a person, so the
// rail is split here the way the tab strip splits it on screen.
const idx = builderScreens.findIndex((s) => s.name === "Site builder › Inspector");
builderScreens.splice(
  idx,
  1,
  { name: "Site builder › Inspector › Design", key: "right rail › Design" },
  { name: "Site builder › Inspector › Settings", key: "right rail › Settings" },
);

// ── render ────────────────────────────────────────────────────────────────────
const HEAD =
  "| Screen | Key | Design | Ease | Gap to 10 | Persona |\n| --- | --- | --- | --- | --- | --- |";
const row = (s) => `| ${s.name} | \`${s.key}\` | — | — | | |`;
const section = (title, rows) =>
  `### ${title} — ${rows.length} screens\n\n${HEAD}\n${rows.map(row).join("\n")}\n`;

const siteCore = siteRoutes.filter((s) => !s.key.startsWith("/docs/components/"));
const siteDocs = siteRoutes.filter((s) => s.key.startsWith("/docs/components/"));
const total = siteRoutes.length + playground.length + builderScreens.length;

const ORPHANS = `### Not reachable from any nav — 0 screens

The docs sidebar is generated from \`DEMO_META\` in \`apps/site/src/lib/nav.ts\`, so a
doc page **cannot** be an orphan: adding a demo adds its nav entry in the same commit.
Every builder pane is reached from a rail, a tab or the toolbar.

This section is kept, empty, on purpose. **If it ever has a row, that row is a finding
before a run has started.**
`;

const body = [
  section("silicaui.com — the site itself", siteCore),
  section("silicaui.com — component doc pages", siteDocs),
  section("Playground", playground),
  section("The builder", builderScreens),
  ORPHANS,
].join("\n");

const generated = `${START}

**${total} screens.** Regenerated by \`node docs/personas/gen-screens.mjs\`.

${body}
${END}`;

const ratingPath = join(HERE, "rating.md");
const current = existsSync(ratingPath) ? readFileSync(ratingPath, "utf8") : "";
const hasBlock = current.includes(START) && current.includes(END);

if (process.argv.includes("--check")) {
  if (!hasBlock) {
    console.error("gen-screens: rating.md has no generated block.");
    process.exit(1);
  }
  const found = current.slice(current.indexOf(START), current.indexOf(END) + END.length);
  // Scores and gaps are written BY HAND into the generated rows as runs happen, so a
  // byte comparison would fail the moment anyone actually used the file. Compare the
  // screen SET instead — the names and keys, which is what the denominator is.
  const keysOf = (t) =>
    [...t.matchAll(/^\| ([^|]+) \| `([^`]+)` \|/gm)].map((m) => `${m[1].trim()} :: ${m[2]}`);
  const a = keysOf(found).join("\n");
  const b = keysOf(generated).join("\n");
  if (a !== b) {
    console.error(
      "gen-screens: rating.md's screen set no longer matches the code.\n" +
        "Run: node docs/personas/gen-screens.mjs",
    );
    process.exit(1);
  }
  console.log(`gen-screens: ok — ${total} screens.`);
  process.exit(0);
}

if (!hasBlock) {
  console.error("gen-screens: rating.md has no generated block to write into.");
  process.exit(1);
}
/**
 * CARRY THE SCORES OVER.
 *
 * Every row's last four cells — Design, Ease, Gap to 10, Persona — are written BY
 * HAND as runs happen, and they live inside the generated block. A plain rewrite
 * therefore erases the entire point of the file. The `--check` path above already
 * knows this ("Scores and gaps are written BY HAND … so a byte comparison would
 * fail"); the WRITE path did not, and blanked a completed persona's scoring run
 * the first time it ran after a new pane was added.
 *
 * So the write is a MERGE. A row whose `name :: key` already exists keeps its four
 * hand cells; a genuinely new row arrives empty; a row whose screen is gone
 * disappears with it, which is correct — that screen no longer exists.
 *
 * Prose inside the block (a note under a section heading) is still NOT preserved —
 * it cannot be, since the block is rebuilt section by section. Notes belong ABOVE
 * the BEGIN marker.
 */
// No `$` anchor, and split on `\r?\n` — rating.md is CRLF on Windows, and a `$`
// after `(.*)` never matches when a `\r` sits between the two. The `--check` path
// above gets this right by accident (it has no `$`); the first version of this
// merge did not, matched zero rows, and carried nothing over while reporting
// success. That is exactly the failure this merge exists to prevent, so: the row
// count is asserted below rather than assumed.
const ROW = /^\| ([^|]+) \| `([^`]+)` \|(.*)/;
const hand = new Map();
for (const line of current.slice(current.indexOf(START), current.indexOf(END)).split(/\r?\n/)) {
  const m = line.match(ROW);
  if (!m) continue;
  // design | ease | gap | persona, then the trailing empty from the closing pipe
  const cells = m[3].replace(/\r$/, "").split("|");
  if (cells.length >= 4) hand.set(`${m[1].trim()} :: ${m[2]}`, cells.slice(0, 4).join("|"));
}
// A block that yielded no rows means the parse is broken, not that the file is
// empty — refuse rather than quietly overwrite somebody's run.
if (hasBlock && current.includes("| Screen | Key |") && hand.size === 0) {
  console.error(
    "gen-screens: the existing block has rows but none parsed, so a rewrite would\n" +
      "throw away every score. Refusing. (Check the row regex against the file's\n" +
      "line endings.)",
  );
  process.exit(1);
}

const merged = generated
  .split("\n")
  .map((line) => {
    const m = line.match(ROW);
    if (!m) return line;
    const kept = hand.get(`${m[1].trim()} :: ${m[2]}`);
    return kept === undefined ? line : `| ${m[1]} | \`${m[2]}\` |${kept}|`;
  })
  .join("\n");

const carried = [...hand.values()].filter((v) => /\d/.test(v)).length;
const next =
  current.slice(0, current.indexOf(START)) +
  merged +
  current.slice(current.indexOf(END) + END.length);
writeFileSync(ratingPath, next);
if (carried) console.log(`gen-screens: carried ${carried} scored row(s) over`);
console.log(`gen-screens: wrote ${total} screens into rating.md`);
console.log(
  `  site core: ${siteCore.length}  docs: ${siteDocs.length}  ` +
    `playground: ${playground.length}  builder: ${builderScreens.length}`,
);
