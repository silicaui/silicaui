// Generates the static catalog `@wizeworks/silicaui-mcp` ships with — real
// class names, tokens, blocks, behaviors, and component docs, extracted
// straight from the monorepo's source (never hand-authored, so it can't
// drift into fiction).
// Run via `pnpm --filter @wizeworks/silicaui-mcp gen`; output is committed
// under src/data/ (same discipline as silicaui-builder's gen-icons.mjs).
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(here, "..");
const packagesRoot = path.join(pkgRoot, "..");
const repoRoot = path.join(packagesRoot, "..");
const dataDir = path.join(pkgRoot, "src", "data");
mkdirSync(dataDir, { recursive: true });

// Where `usageExample` comes from. Asserted up front rather than discovered
// per-component: the per-component read has to tolerate a missing demo (most
// components have none), so a wrong directory here degrades silently into
// "every component has no example" — which is exactly what happened when the
// demos moved out of examples/playground into their own package and this path
// wasn't updated. All 344 examples vanished with no error.
const demosDir = path.join(packagesRoot, "silicaui-demos", "src", "demos");
if (!existsSync(demosDir)) {
  throw new Error(
    `gen-catalog: demos directory not found at ${demosDir} — usageExample would be null for every component. Fix the path rather than letting the catalog ship without examples.`,
  );
}

// Folder names on disk stay unscoped (packages/silicaui-react/...); only the
// published/installable identity gets the @wizeworks scope. `scoped()` and
// `mention()` do that conversion at the point data is written to the catalog,
// never at the point a path is built from a folder name.
const scoped = (n) => `@wizeworks/${n}`;
// IDEMPOTENT on purpose. Source prose written before the scope rename says
// "silicaui-behaviors" and needs scoping; prose written after it already says
// "@wizeworks/silicaui-behaviors" and must be left alone. Without the lookbehind
// the second kind got scoped a second time, and nine component descriptions
// shipped naming `@wizeworks/@wizeworks/silicaui-charts` — a package that does
// not exist, in the one file whose whole job is to not invent names.
const mention = (s) => s.replace(/(?<!@wizeworks\/)\bsilicaui(-[a-z]+)?\b/g, (m) => `@wizeworks/${m}`);

function writeJson(name, data) {
  // Newlines inside extracted source text (usage examples, doc comments) are
  // whatever the working copy has on disk — CRLF on a Windows checkout. Left
  // alone, regenerating on Windows rewrote every one of them to `\r\n` and
  // produced a 178-line diff of pure line-ending churn that buried the real
  // change. The catalog is a build artifact about CONTENT, so normalize here,
  // at the single point everything is written, and the output is identical on
  // every platform.
  const json = JSON.stringify(data, null, 2).replace(/\\r\\n/g, "\\n");
  writeFileSync(path.join(dataDir, name), json + "\n");
  console.log(`  wrote src/data/${name}`);
}

function cleanComment(raw) {
  return raw
    .replace(/^\/\*\*?/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    // Only the block comment's leading `*`. A `//` at the start of a line is
    // NOT stripped here: inside a JSDoc it is almost always a real line of a
    // code example ("… /> // object items: <Combobox …"), and stripping it
    // silently rewrote the docs of every component whose example had one.
    // A caller reading an actual `//` comment strips its own marker.
    .map((l) => l.replace(/^\s*\*\s?/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function toKebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

// ── packages.json ────────────────────────────────────────────────────────
console.log("packages.json");
const PACKAGES = [
  { name: "silicaui", purpose: "Tailwind v4 plugin — design tokens + component CSS classes (the vocabulary every other package builds on).", install: "pnpm add -D silicaui tailwindcss" },
  { name: "silicaui-react", purpose: "Typed React components over the silicaui classes, built on Base UI.", install: "pnpm add silicaui-react" },
  { name: "silicaui-html", purpose: "Framework-neutral node-tree schema + HTML projection + composed blocks (for non-React output). The `/theme` subpath turns a Theme into CSS off the RENDER path: `customColorCss(theme)` emits every rule a build-time `@plugin \"silicaui\" { colors: … }` registration would have — for a color NAMED AT RUNTIME by a tenant in a theme editor, which no build-time list can carry — and `themeTokenCss(theme, selector, mode)` emits the custom properties those rules read (ship both, or the rules paint nothing). Needs silicaui, an optional peer; the root import stays dependency-free.", install: "pnpm add silicaui-html" },
  { name: "silicaui-behaviors", purpose: "Zero-dependency runtime that hydrates data-sui-* markers with interactivity (the vanilla-JS counterpart to silicaui-react's Base UI behavior).", install: "pnpm add silicaui-behaviors" },
  { name: "silicaui-builder", purpose: "The visual document editor/engine that powers the SilicaUI sitebuilder — also consumable directly: the framework-neutral engine at the root import, the `Builder` React component + `BuilderHost` interface (catalog/dataSources/themes/validateClass/inspectorPanels/inspectorTabs/pickAsset, plus `hostComponents` + `renderHostNode` — the regions the HOST renders, each def carrying its own label/icon/hint/category into the palette and onto the placed node, and suppressible from the palette by `catalog().hide` on its `host:<name>` key while staying registered) at `/react`, and the email editor at `/email` and `/email/react` (its own `EmailBuilderHost` seam, plus a host-owned `frame` for fixed chrome composed around — never into — the authored email, `locked` nodes for undeletable in-document blocks, a `link` group node that gives one destination to the blocks inside it — so a card in a `collection` repeat deep-links to its own record, projected as per-child inline anchors rather than one anchor around the card, which Outlook drops — and a controlled `savedBlocks`/`onSavedBlocksChange` pair so the reusable-block library can live on the account instead of one browser).", install: "pnpm add silicaui-builder silicaui-react" },
  { name: "silicaui-charts", purpose: "Apache ECharts wrapped and auto-themed to Silica's design tokens.", install: "pnpm add silicaui-charts silicaui-react" },
  { name: "silicaui-table", purpose: "TanStack Table wrapped in Silica's table CSS.", install: "pnpm add silicaui-table silicaui-react" },
  { name: "silicaui-editor", purpose: "TipTap rich-text editor with a Silica-styled toolbar.", install: "pnpm add silicaui-editor silicaui-react" },
  { name: "silicaui-dnd", purpose: "dnd-kit wrapped — SortableList + drag primitives.", install: "pnpm add silicaui-dnd silicaui-react" },
  { name: "silicaui-panels", purpose: "react-resizable-panels wrapped in Silica styling.", install: "pnpm add silicaui-panels silicaui-react" },
];
// NOTE: versions are deliberately NOT written here. `gen` isn't part of
// `build` or the release, so a version snapshotted at generation time freezes
// at whatever was current the last time someone ran this by hand — that's how
// the catalog ended up advertising 0.26.0 after 0.29.0 shipped. The server
// stamps its own version onto every entry at runtime instead (see VERSION in
// src/server.ts); the whole family is released in lockstep via changesets
// `fixed`, so that value is correct for all of them.
writeJson(
  "packages.json",
  PACKAGES.map((p) => ({
    ...p,
    name: scoped(p.name),
    purpose: mention(p.purpose),
    install: p.install ? mention(p.install) : p.install,
  })),
);

// ── tokens.json ──────────────────────────────────────────────────────────
console.log("tokens.json");
const { LIGHT, DARK, SEMANTIC_COLORS } = await import(
  pathToFileURL(path.join(packagesRoot, "silicaui/src/colors.js")).href
);
// The canonical colorable-component table — the SAME source the plugin and the
// builder's runtime cascade read. Deriving the catalog's color facts from it
// (rather than intersecting class lists against the 8 semantic names) is what
// keeps the MCP from describing an OPEN set as a closed one.
const { COLOR_VARIANTS, colorVariantRules } = await import(
  pathToFileURL(path.join(packagesRoot, "silicaui/src/color-variants.js")).href
);

/**
 * The selector template a component uses for its color axis, with the color
 * itself left as `<color>` — e.g. `btn-<color>`, `chat-bubble-<color>`,
 * `toast[data-type="<color>"]`. Generated through the real generator, so the
 * three non-uniform families can't be mis-described by hand.
 */
function colorPatternOf(key) {
  const [sel] = Object.keys(colorVariantRules(key, ["__COLOR__"], ""));
  return sel.replace(/^\./, "").replace("__COLOR__", "<color>");
}
let scalarTokens = [];
try {
  const { SCALAR_TOKENS } = await import(
    pathToFileURL(path.join(packagesRoot, "silicaui-html/dist/index.js")).href
  );
  scalarTokens = SCALAR_TOKENS;
} catch (err) {
  console.warn(`  ! failed to load @wizeworks/silicaui-html SCALAR_TOKENS (build it first: pnpm --filter @wizeworks/silicaui-html build): ${err.message}`);
}
// The type scale, imported from the plugin's single source of truth so the
// documented ladder can never drift from what Tailwind actually emits.
const { TYPE_SCALE } = await import(pathToFileURL(path.join(packagesRoot, "silicaui/src/type-scale.js")).href);
const typeScale = Object.fromEntries(
  Object.entries(TYPE_SCALE).map(([step, [size, meta]]) => [
    step,
    { class: `text-${step}`, fontSize: size, px: Math.round(parseFloat(size) * 16), lineHeight: meta.lineHeight },
  ]),
);
writeJson("tokens.json", {
  semanticColors: SEMANTIC_COLORS,
  semanticColorsNote:
    "These eight are the DEFAULT roles, not a closed list — see customColors. An app can register any number of extra roles, and they work everywhere a built-in one does.",
  customColors: {
    summary:
      "Silica's core promise: N named colors cascade through everything. A color you register gets the full utility trio AND every component variant, with no codegen step and no safelist.",
    howToDeclare:
      '@plugin "@wizeworks/silicaui" { colors: primary, secondary, accent, neutral, info, success, warning, error, brand; }\n@theme { --color-brand: #7c3aed; }',
    declareNote:
      "The `colors:` list REPLACES the default set, so re-list the built-ins you still want. Using a `*-brand` class without registering `brand` leaves it unstyled; the plugin warns at build time (warn-unregistered-colors.js).",
    contentNote:
      "`--color-brand-content` (the legible ink ON brand) is optional — omit it and Silica auto-derives black/white by measured contrast. Declare it only to override that choice.",
    utilities: ["text-<color>", "bg-<color>", "border-<color>", "text-<color>-content", "bg-<color>-content", "border-<color>-content"],
    componentPatterns: Object.keys(COLOR_VARIANTS).map(colorPatternOf).sort(),
    componentPatternsNote:
      "Every colorable component, as a selector template — substitute a registered color name. Most are `<root>-<color>`; chat, pin-input and toast are not, so read the pattern rather than assuming.",
    builderNote:
      "In @wizeworks/silicaui-builder, a color invented live in the theme editor is generated at runtime (scoped to the canvas) from these same patterns, so it behaves identically to a build-time-declared one without a rebuild.",
  },
  light: LIGHT,
  dark: DARK,
  scalarTokens,
  typography: {
    baseFontSize: "100% (≈16px) — an explicit anchor, not the UA default by accident; the whole rem-based type scale (text-md = 1rem) scales with it.",
    scale: typeScale,
    scaleNote: "The `text-*` size ladder — `text-md` == `text-base` == 1rem == 16px. `text-8xl`/`9xl` match Tailwind's defaults; `text-10xl` (160px) extends past them. Prefer a step over a `text-[13px]` magic number.",
    fontFamilyTokens: ["--font-sans", "--font-serif", "--font-mono"],
    note: "Every non-namespace token (see scalarTokens above) carries its default inline via var(--token, default) in each component, so an app's own :root/@theme override always wins. --duration is the one token an app cannot always win: under prefers-reduced-motion: reduce it is forced to 0.01ms with !important, on :root and on every [data-theme] island.",
  },
});

// ── classes.json ─────────────────────────────────────────────────────────
console.log("classes.json");
const componentsDir = path.join(packagesRoot, "silicaui/src/components");
const classesByComponent = {};
/** component file base → its COLOR_VARIANTS key, for the components that take colors. */
const colorKeyByComponent = {};
// The generators' RAW selector keys, kept alongside the bare class names. A
// bare list can't say that `.card-selectable-indicator` is only ever written
// together with `.checkbox` — the compound selector can, and it's real output
// rather than a description of it. Feeds the CSS-path catalog entries below.
const selectorsByComponent = {};
for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  let mod;
  try {
    mod = await import(pathToFileURL(path.join(componentsDir, file)).href);
  } catch (err) {
    console.warn(`  ! failed to import components/${file}: ${err.message}`);
    continue;
  }
  const classSet = new Set();
  const selectorSet = new Set();
  for (const [exportName, fn] of Object.entries(mod).filter(([, v]) => typeof v === "function")) {
    // Colorability is a FACT read off the shared table, keyed by the factory's
    // export name — not inferred from which class strings happen to exist.
    if (exportName in COLOR_VARIANTS) colorKeyByComponent[path.basename(file, ".js")] = exportName;
    // Every generator in this directory is `(prefix = "")` or `(colors, prefix = "")`
    // — `prefix` always carries a default, so `fn.length` (params BEFORE the first
    // default) is 0 for the former, 1 for the latter. That makes the call shape
    // deterministic instead of guessed: trying `fn(SEMANTIC_COLORS, "")` first (the
    // old approach) silently succeeds against a `(prefix = "")`-only function too
    // (SEMANTIC_COLORS just becomes `prefix`), producing garbage class names with
    // no error to catch.
    let result = null;
    try {
      result = fn.length >= 1 ? fn(SEMANTIC_COLORS) : fn();
    } catch (err) {
      console.warn(`  ! ${file}: calling ${fn.name || "(anonymous)"} with fn.length=${fn.length} failed: ${err.message}`);
    }
    if (result && typeof result === "object") {
      for (const key of Object.keys(result)) {
        selectorSet.add(key);
        for (const m of key.matchAll(/\.([a-zA-Z0-9_-]+)/g)) classSet.add(m[1]);
      }
    }
  }
  if (classSet.size) {
    const base = path.basename(file, ".js");
    classesByComponent[base] = [...classSet].sort();
    selectorsByComponent[base] = [...selectorSet];
  }
}
// Drift: a table entry that matched no component file means the catalog would
// silently under-report colorability for it.
for (const key of Object.keys(COLOR_VARIANTS)) {
  if (!Object.values(colorKeyByComponent).includes(key)) {
    console.warn(`  ! COLOR_VARIANTS has "${key}" but no components/*.js exported a factory by that name`);
  }
}
const { colorUtilities, softUtilities, glassUtilities } = await import(
  pathToFileURL(path.join(componentsDir, "..", "color-utilities.js")).href
);
const utilClasses = new Set();
for (const key of Object.keys({ ...colorUtilities(SEMANTIC_COLORS), ...softUtilities(), ...glassUtilities() })) {
  for (const m of key.matchAll(/\.([a-zA-Z0-9_-]+)/g)) utilClasses.add(m[1]);
}
classesByComponent["color-utilities"] = [...utilClasses].sort();
// The `text-*` size utilities — from the plugin's `theme.extend.fontSize` (not a
// component module, so the loop above can't see them). Sourced from TYPE_SCALE so
// this list matches exactly what Tailwind emits.
classesByComponent["type-scale"] = Object.keys(TYPE_SCALE).map((step) => `text-${step}`);
writeJson("classes.json", classesByComponent);

// ── blocks.json ──────────────────────────────────────────────────────────
console.log("blocks.json");
try {
  const { listBlocks } = await import(
    pathToFileURL(path.join(packagesRoot, "silicaui-html/dist/blocks/index.js")).href
  );
  writeJson("blocks.json", listBlocks());
} catch (err) {
  console.warn(`  ! failed to load silicaui-html blocks (build it first: pnpm --filter @wizeworks/silicaui-html build): ${err.message}`);
  writeJson("blocks.json", []);
}

// ── behaviors.json ───────────────────────────────────────────────────────
// Derived from the REAL dispatch table (registry.ts's `HANDLERS`), not a
// hand-maintained list here — a hand list is exactly what went stale (missing
// `form` before this fix, and 18 more types after a later behaviors pass).
// Reading `HANDLERS`'s own source keeps this in lockstep automatically.
console.log("behaviors.json");
const behaviorsDir = path.join(packagesRoot, "silicaui-behaviors/src/behaviors");
function extractFirstDoc(filePath) {
  try {
    const src = readFileSync(filePath, "utf8");
    const m = src.match(/\/\*\*([\s\S]*?)\*\//);
    return m ? cleanComment(m[0]) : "";
  } catch {
    return "";
  }
}
const registrySrc = readFileSync(path.join(packagesRoot, "silicaui-behaviors/src/registry.ts"), "utf8");

// `import { ident, ident2 } from "./behaviors/file";` → ident → file.ts
const fileByIdent = {};
for (const m of registrySrc.matchAll(/import\s*\{([^}]+)\}\s*from\s*"\.\/behaviors\/([^"]+)"/g)) {
  for (const ident of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
    fileByIdent[ident] = `${m[2]}.ts`;
  }
}

// `export const HANDLERS: Record<BehaviorType, BehaviorHandler> = { type: ident, "kebab-type": ident2, shorthand, ... };`
// Entries can be explicit (`key: ident`) OR shorthand (`ident` alone, meaning
// key === ident) — most of this object is shorthand, so both forms matter.
const handlersMatch = registrySrc.match(/HANDLERS[^={]*=\s*\{([\s\S]*?)\n\};/);
if (!handlersMatch) throw new Error("gen-catalog: couldn't find HANDLERS object in registry.ts — behavior extraction is now broken, fix the regex above.");
const BEHAVIOR_FILES = {};
for (const m of handlersMatch[1].matchAll(/(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*(?::\s*([A-Za-z_][A-Za-z0-9_]*))?\s*,/g)) {
  const type = m[1] ?? m[2];
  const ident = m[3] ?? m[2];
  const file = fileByIdent[ident];
  if (file) BEHAVIOR_FILES[type] = file;
  else console.warn(`  ! HANDLERS entry "${type}" -> "${ident}" has no matching import; skipped`);
}
writeJson(
  "behaviors.json",
  Object.entries(BEHAVIOR_FILES).map(([type, file]) => ({
    type,
    description: extractFirstDoc(path.join(behaviorsDir, file)),
  })),
);

// ── silicaui-html components (the ComponentDef macro registry) ────────────
// These are a DIFFERENT layer than silicaui-react's components: atoms in the
// framework-neutral node-tree schema (Dialog, Popover, Combobox, ...) that
// `expand()` lowers to an element subtree at render time. There's no static
// prop-interface to parse (props are read ad hoc inside `expand`), so instead
// of guessing we ACTUALLY CALL `expand()` on a synthetic empty node and walk
// the result for `behavior.type` markers — real execution, not a hand-authored
// guess, matching this script's own "never hand-authored" discipline. Defs
// that need real props/children to expand cleanly just throw and are caught;
// `behaviors` stays `[]` for those rather than a wrong guess.
console.log("silicaui-html components");
let htmlComponents = [];
try {
  const htmlIndexUrl = pathToFileURL(path.join(packagesRoot, "silicaui-html/dist/index.js")).href;
  const { listComponents, EMBED_PROVIDERS } = await import(htmlIndexUrl);
  const componentSrc = readFileSync(path.join(packagesRoot, "silicaui-html/src/component.ts"), "utf8");
  const componentSrcLines = componentSrc.split(/\r?\n/);

  // A def is written one of two ways: an object literal with `name: "X",`, or a
  // one-line `elementDef("X", category, icon, tag)` call for the many components
  // that are just a tag with text in it. Only the first was ever looked for, so
  // 61 components also carried a `sourceFile` pointing at the file with no line.
  function lineOf(name) {
    const literal = `name: "${name}",`;
    const factory = `elementDef("${name}",`;
    const idx = componentSrcLines.findIndex((l) => l.includes(literal) || l.includes(factory));
    return idx === -1 ? null : idx + 1;
  }

  /** The tag an `elementDef(...)` one-liner lowers to, if that is how it's written. */
  function elementDefTag(name) {
    const call = componentSrcLines.find((l) => l.includes(`elementDef("${name}",`));
    // elementDef(name, category, icon, tag, container?)
    const m = call && /elementDef\(\s*"[^"]+"\s*,\s*"[^"]+"\s*,\s*"[^"]+"\s*,\s*"([^"]+)"/.exec(call);
    return m ? m[1] : undefined;
  }

  /**
   * The `//` block written above a def, as its description.
   *
   * Node-tree components had NO documentation in this catalog at all — no props,
   * no doc, nothing but a name and an icon — because they have no prop interface
   * to parse (props are read ad hoc inside `expand`). That left every consumer
   * reading the catalog unable to answer "how do I use this?" for 236 of the 368
   * components, which is how a real capability comes to look missing from the
   * outside: `Embed` gained nine providers and the catalog still described it as
   * a name and an icon.
   *
   * These comments already exist and already say the right thing, so read them
   * rather than adding a `doc` field to 236 defs that would then drift from the
   * prose right above it.
   */
  function docFor(line) {
    if (!line) return undefined;
    let i = line - 2; // 0-based index of the line above `name: "X",`
    // Step over the def's own opening brace and any blank lines.
    while (i >= 0 && /^\s*(\{)?\s*$/.test(componentSrcLines[i])) i--;
    const collected = [];
    while (i >= 0 && /^\s*\/\//.test(componentSrcLines[i])) {
      collected.unshift(componentSrcLines[i].replace(/^\s*\/\/ ?/, "").trimEnd());
      i--;
    }
    if (!collected.length) return undefined;
    // Reflow to prose: the comments are hard-wrapped to the source margin, and a
    // blank `//` line is a paragraph break worth keeping.
    const text = collected
      .join("\n")
      .split(/\n\s*\n/)
      .map((para) => para.split("\n").join(" ").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n\n");
    return text || undefined;
  }

  function collectBehaviorTypes(node, acc) {
    if (!node || typeof node !== "object") return acc;
    if (node.behavior?.type) acc.add(node.behavior.type);
    if (Array.isArray(node.children)) for (const c of node.children) collectBehaviorTypes(c, acc);
    return acc;
  }

  htmlComponents = listComponents().map((def) => {
    let behaviors = [];
    try {
      const synthetic = { kind: "component", component: def.name, children: [], props: {} };
      behaviors = [...collectBehaviorTypes(def.expand(synthetic), new Set())];
    } catch {
      // needs real props/children to expand — leave behaviors unknown, not guessed
    }
    const line = lineOf(def.name);
    // A one-line `elementDef` has no prose above it because there is nothing
    // prose would add — so state the one fact it does carry (what it lowers to)
    // rather than leaving the entry blank. Derived from the call, not written by
    // hand, so it stays true if the tag changes.
    const tag = elementDefTag(def.name);
    const doc =
      docFor(line) ??
      (tag
        ? `${def.name} — lowers to \`<${tag}>\`${def.container ? ", holding its children" : ", carrying `props.text` as its content"}.`
        : undefined);
    return {
      name: def.name,
      package: scoped("silicaui-html"),
      category: def.category,
      label: def.label,
      icon: def.icon,
      container: !!def.container,
      behaviors,
      ...(doc ? { doc: mention(doc) } : {}),
      // Embed is the one component whose behavior depends on an EXTERNAL
      // allowlist, so the answer to "what URL can I paste?" cannot be inferred
      // from its shape. Publish the list itself, from the same export the
      // resolver and its probe use — a hand-copied list here would be one more
      // thing to drift.
      ...(def.name === "Embed" && EMBED_PROVIDERS ? { providers: EMBED_PROVIDERS } : {}),
      sourceFile: line ? `silicaui-html/src/component.ts:${line}` : "silicaui-html/src/component.ts",
    };
  });
} catch (err) {
  console.warn(`  ! failed to load @wizeworks/silicaui-html components (build it first: pnpm --filter @wizeworks/silicaui-html build): ${err.message}`);
}

// ── components.json ──────────────────────────────────────────────────────
console.log("components.json");

function hasExportModifier(node) {
  return !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function getLeadingDoc(sourceText, node, sf) {
  const ranges = ts.getLeadingCommentRanges(sourceText, node.getFullStart()) || [];
  return ranges.map((r) => cleanComment(sourceText.slice(r.pos, r.end))).join(" ").trim();
}

/**
 * Members of a shared props interface the component files extend, keyed by
 * interface name. Without this the catalog reports `extends PositioningProps`
 * and stops — an agent reading it would conclude a popup can only sit against
 * its own trigger, which is exactly the wrong answer `anchor` exists to fix.
 */
let sharedPropsCache = null;
function sharedPropsInterfaces() {
  if (sharedPropsCache) return sharedPropsCache;
  sharedPropsCache = new Map();
  const file = path.join(packagesRoot, "silicaui-react", "src", "lib", "positioning.ts");
  if (!existsSync(file)) return sharedPropsCache;
  const source = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  ts.forEachChild(sf, (node) => {
    if (!ts.isInterfaceDeclaration(node) || !hasExportModifier(node)) return;
    sharedPropsCache.set(
      node.name.text,
      node.members.flatMap((member) =>
        ts.isPropertySignature(member) && member.name
          ? [{
              name: member.name.getText(sf),
              optional: !!member.questionToken,
              type: member.type ? member.type.getText(sf) : "unknown",
              doc: getLeadingDoc(source, member, sf),
              inheritedFrom: node.name.text,
            }]
          : [],
      ),
    );
  });
  return sharedPropsCache;
}

function parseComponentFile(filePath, componentName) {
  const source = readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const props = [];
  let description = "";

  ts.forEachChild(sf, (node) => {
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      /Props$/.test(node.name.text) &&
      hasExportModifier(node)
    ) {
      const members = [];
      if (ts.isInterfaceDeclaration(node)) {
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && member.name) {
            members.push({
              name: member.name.getText(sf),
              optional: !!member.questionToken,
              type: member.type ? member.type.getText(sf) : "unknown",
              doc: getLeadingDoc(source, member, sf),
            });
          }
        }
      }
      const extendsClause = ts.isInterfaceDeclaration(node) && node.heritageClauses
        ? node.heritageClauses.map((h) => h.getText(sf)).join(" ")
        : undefined;
      // Inline the members of shared props interfaces so the catalog reports
      // what the component actually ACCEPTS, not just what it inherits from.
      for (const [name, inherited] of sharedPropsInterfaces()) {
        if (extendsClause?.includes(name)) {
          const own = new Set(members.map((m) => m.name));
          members.push(...inherited.filter((m) => !own.has(m.name)));
        }
      }
      props.push({ name: node.name.text, extends: extendsClause, members });
    }

    const matchesComponentName = ts.isFunctionDeclaration(node)
      ? node.name?.text === componentName
      : ts.isVariableStatement(node) &&
        node.declarationList.declarations.some(
          (d) => ts.isIdentifier(d.name) && d.name.text === componentName,
        );
    if (!description && matchesComponentName) {
      description = getLeadingDoc(source, node, sf);
    }
  });

  return { description, props };
}

// silicaui-react: derive name/category from the README's component table —
// it's the authoritative, human-maintained list; per-component prose doesn't
// exist there on purpose (every component follows the same prop shape), so
// props/usage come from source instead (see parseComponentFile below).
const readme = readFileSync(path.join(packagesRoot, "silicaui-react/README.md"), "utf8");
const tableRowRe = /\|\s*\*\*(.+?)\*\*\s*\|\s*((?:`[^`]+`\s*)+)\|/g;
const componentMeta = [];
let rowMatch;
while ((rowMatch = tableRowRe.exec(readme))) {
  const category = rowMatch[1].trim();
  for (const nameMatch of rowMatch[2].matchAll(/`([^`]+)`/g)) {
    componentMeta.push({ name: nameMatch[1], category, package: "silicaui-react" });
  }
}

// Real export -> source-file map from the barrel itself (authoritative, can't
// drift — unlike the README prose, this is code). Used two ways: (1) fixes
// sourceFile for components whose name doesn't match their file 1:1 (several
// components share one file, e.g. InputGroupAddon lives in input-group.tsx);
// (2) powers the "undocumented export" warning below, so a component added to
// the barrel without a README row is a loud gen-time warning, not a silent gap.
const reactIndexSrc = readFileSync(path.join(packagesRoot, "silicaui-react/src/index.ts"), "utf8");
const reactFileByExport = {};
const reactNamesByFile = {};
for (const m of reactIndexSrc.matchAll(/^export\s*\{([^}]+)\}\s*from\s*"\.\/([^"]+)";/gm)) {
  const file = `${m[2]}.tsx`;
  for (const nm of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
    if (/^[A-Z][A-Za-z0-9]*$/.test(nm)) {
      reactFileByExport[nm] = file;
      (reactNamesByFile[file] ??= []).push(nm);
    }
  }
}
const documentedNames = new Set([...componentMeta.map((m) => m.name)]);

// Wrapper packages: small, hand-listed (no README table covers these).
const wrapperMeta = [
  { name: "Chart", category: "wrapper", package: "silicaui-charts", file: "chart.tsx" },
  { name: "Sparkline", category: "wrapper", package: "silicaui-charts", file: "sparkline.tsx" },
  { name: "DataTable", category: "wrapper", package: "silicaui-table", file: "data-table.tsx" },
  { name: "RichTextEditor", category: "wrapper", package: "silicaui-editor", file: "rich-text-editor.tsx" },
  { name: "SortableList", category: "wrapper", package: "silicaui-dnd", file: "sortable-list.tsx" },
  { name: "ResizablePanels", category: "wrapper", package: "silicaui-panels", file: "resizable-panels.tsx" },
];
for (const w of wrapperMeta) documentedNames.add(w.name);

// Real exports that are infrastructure, not catalog components (context
// providers, etc.) — deliberately absent from the README's component table.
const NON_CATALOG_EXPORTS = new Set(["SilicaProvider", "PortalContainerProvider"]);

// Genuine sub-parts the prefix rule below can't see, because their name isn't
// prefixed by their documented root in either direction. Keep this list SHORT
// and explicit: an entry here is an auditable "yes, reviewed, it's a sub-part",
// whereas loosening the prefix rule to cover them would silently swallow real
// missing components too.
const KNOWN_SUBPARTS = new Set(["MetadataItem"]);

// ── README table vs the barrel, checked in BOTH directions ──────────────────
// The previous check ran one way (export -> README) at FILE granularity, which
// left two blind spots that both shipped:
//
//   1. A real component sharing a file with a documented sibling was exempted
//      wholesale, so `DateRangePicker` (in date-picker.tsx next to documented
//      `DatePicker`) never appeared in the catalog and never warned.
//   2. Nothing checked README -> export at all. A row naming a component that
//      does not exist resolved via the toKebab fallback to a real file and
//      emitted a fully-formed catalog entry: `Typography` was published with
//      `HeadingProps` attached, so the catalog confidently described a
//      component that cannot be imported.
//
// (2) is an ERROR, not a warning: a phantom entry is worse than a missing one,
// because a consumer acts on it.
const phantomNames = componentMeta.filter((m) => !reactFileByExport[m.name]).map((m) => m.name);
if (phantomNames.length) {
  console.error(
    `  ✗ ${phantomNames.length} name(s) in @wizeworks/silicaui-react README's component table are NOT exported from the barrel. ` +
      `Each would be published as a catalog entry for a component that cannot be imported: ${phantomNames.join(", ")}`,
  );
  process.exitCode = 1;
  // Drop them from the emitted data as well. The exit code alone only protects
  // CI; a developer who reruns locally and moves on would otherwise still be
  // holding a catalog that documents a component nobody can import.
  const phantom = new Set(phantomNames);
  for (let i = componentMeta.length - 1; i >= 0; i--) {
    if (phantom.has(componentMeta[i].name)) componentMeta.splice(i, 1);
  }
}

// A sub-part is name-prefixed by a documented sibling in the SAME file, in
// either direction (DialogTrigger ⊃ Dialog; Steps ⊃ Step). Anything else that
// is exported but undocumented is a real missing row.
const undocumentedExports = [];
for (const [file, names] of Object.entries(reactNamesByFile)) {
  for (const name of names) {
    if (documentedNames.has(name) || NON_CATALOG_EXPORTS.has(name) || KNOWN_SUBPARTS.has(name)) continue;
    const root = names.find((o) => documentedNames.has(o) && o !== name && (name.startsWith(o) || o.startsWith(name)));
    if (!root) undocumentedExports.push(`${name} (${file})`);
  }
}
if (undocumentedExports.length) {
  console.warn(
    `  ! ${undocumentedExports.length} @wizeworks/silicaui-react export(s) have no row in README's component table and are not a sub-part of a documented sibling ` +
      `(won't appear in list_components until a row is added): ${undocumentedExports.join(", ")}`,
  );
}

const components = [];
for (const meta of [...componentMeta, ...wrapperMeta]) {
  const fileRel = (meta.package === "silicaui-react" && reactFileByExport[meta.name]) || meta.file || `${toKebab(meta.name)}.tsx`;
  const filePath = path.join(packagesRoot, meta.package, "src", fileRel);
  let parsed = { description: "", props: [] };
  try {
    parsed = parseComponentFile(filePath, meta.name);
  } catch (err) {
    console.warn(`  ! failed to parse ${meta.package}/src/${fileRel}: ${err.message}`);
  }

  let usageExample = null;
  try {
    usageExample = readFileSync(path.join(demosDir, `${meta.name}.tsx`), "utf8").trim();
  } catch {
    // No demo for this component — legitimately common, so stay quiet here.
    // A WRONG demosDir is caught once, up front, where it can't be missed.
  }

  components.push({
    name: meta.name,
    package: scoped(meta.package),
    category: meta.category,
    sourceFile: `${meta.package}/src/${fileRel}`,
    description: parsed.description,
    props: parsed.props,
    usageExample,
  });
}

// ── silicaui (CSS) components — the third delivery path ──────────────────────
// The CSS layer used to be reachable only through `list_classes`, which returns
// a flat bag of class names: real, but silent about which class is the root,
// which are its parts, and which are variants — so an agent on the CSS path
// (plain HTML + classes, no React, no node-tree) had to guess the markup, which
// is exactly what this server exists to prevent. It also meant `get_component`
// could answer for two of the three paths and not the third.
//
// Everything below is derived, never authored here: the description is the
// generator's own leading JSDoc, `colorVariants` are matched against the real
// SEMANTIC_COLORS list, and `compoundSelectors` are the generators' literal
// selector keys.
console.log("silicaui (CSS) components");

// Two class groups aren't component modules (see the classes.json section), so
// their docs live elsewhere. Named explicitly rather than pattern-matched.
const CSS_NON_COMPONENT_SOURCES = {
  "color-utilities": "silicaui/src/color-utilities.js",
  "type-scale": "silicaui/src/type-scale.js",
};

// The doc for the module's MAIN generator, not just the first comment in the
// file. `button.js` exports `buttonColorVars` above `button`, so "first JSDoc
// wins" published the helper's internals as the Button description. Matched by
// name (kebab file -> camelCase export), falling back to the file's first doc
// for modules with no name-matching export (e.g. type-scale.js).
function toCamel(kebab) {
  return kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function extractExportDoc(filePath, exportName) {
  try {
    const source = readFileSync(filePath, "utf8");
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    let found = "";
    ts.forEachChild(sf, (node) => {
      if (found) return;
      if (ts.isFunctionDeclaration(node) && node.name?.text === exportName && hasExportModifier(node)) {
        found = getLeadingDoc(source, node, sf);
      }
    });
    if (found) return found;
  } catch {
    // fall through to the file-level doc
  }
  return extractFirstDoc(filePath);
}

// The root is the class the others hang off — `btn` for the `button` module,
// which the file name alone would get wrong. Found by counting how many
// siblings a class prefixes, so it survives that mismatch.
//
// The count must also be a MAJORITY of the siblings, or a utility bag reports a
// root it doesn't have: in `color-utilities`, `bg-info` prefixes exactly one
// other class (`bg-info-content`) and was crowned root of 66 unrelated
// utilities. A real root prefixes nearly everything around it.
function deriveRoot(classes) {
  if (classes.length === 1) return classes[0];
  let best = null;
  let bestCount = 0;
  for (const c of classes) {
    const count = classes.filter((o) => o !== c && o.startsWith(`${c}-`)).length;
    if (count > bestCount || (count === bestCount && count > 0 && c.length < best.length)) {
      best = c;
      bestCount = count;
    }
  }
  return bestCount > 0 && bestCount >= (classes.length - 1) / 2 ? best : null;
}

// Several families have NO bare root class — `dialog` is entirely
// `.dialog-popup` / `.dialog-backdrop` / …, with no `.dialog` to put on
// anything. Reporting only `root: null` there loses the useful half of the
// fact, and `class="dialog"` is the obvious thing to invent in its absence. So
// when every class shares a prefix and no root exists, say what the prefix is.
function deriveFamilyPrefix(classes) {
  if (classes.length < 2) return null;
  const [first, ...rest] = classes;
  let prefix = first;
  for (const c of rest) {
    while (prefix && !c.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (!prefix) return null;
  }
  // Only report a prefix that stops on a segment boundary (`dialog-`), never a
  // mid-word coincidence (`dis` across `display`/`disabled`).
  return /-$/.test(prefix) && prefix.length > 1 ? prefix : null;
}

const categoryByName = new Map();
for (const c of [...htmlComponents, ...components]) categoryByName.set(toKebab(c.name), c.category);

const cssComponents = Object.entries(classesByComponent).map(([name, classes]) => {
  const sourceFile = CSS_NON_COMPONENT_SOURCES[name] ?? `silicaui/src/components/${name}.js`;
  const root = deriveRoot(classes);
  const familyPrefix = root ? null : deriveFamilyPrefix(classes);
  // Read colorability off the shared table. The old approach — intersecting the
  // class list with the 8 semantic names — was a heuristic that got three
  // families wrong: it MISSED chat (`.chat-bubble-<c>`), pin-input
  // (`.pin-input-cell-<c>`) and toast (`[data-type]`, not a class at all)
  // because their color selector isn't `<root>-<color>`, and it INVENTED one for
  // Field, whose `field-error` is a validation part that merely looks like a
  // color variant. It also had no way to say the set is open.
  const colorKey = colorKeyByComponent[name];
  const colorVariants = colorKey ? Object.keys(colorVariantRules(colorKey, SEMANTIC_COLORS, "")).map((s) => s.replace(/^\./, "")) : [];
  const colorPattern = colorKey ? colorPatternOf(colorKey) : null;
  // Only the keys that carry more than a single bare class — a compound
  // (`.checkbox.card-selectable-indicator`), a pseudo, or a combinator. The
  // plain `.foo` keys are already fully represented by `classes`.
  const compoundSelectors = (selectorsByComponent[name] ?? []).filter(
    (sel) => !/^\.[a-zA-Z0-9_-]+$/.test(sel),
  );
  return {
    name,
    package: scoped("silicaui"),
    category: categoryByName.get(name) ?? "css",
    sourceFile,
    description: mention(extractExportDoc(path.join(packagesRoot, sourceFile), toCamel(name))),
    root,
    ...(familyPrefix ? { familyPrefix, rootNote: `No bare \`.${familyPrefix.slice(0, -1)}\` class exists — this family is only its \`${familyPrefix}*\` parts.` } : {}),
    classes,
    ...(colorVariants.length
      ? {
          colorVariants,
          colorPattern,
          colorNote: `The eight above are the DEFAULT roles, not the whole set — \`${colorPattern}\` accepts any color the app registers (see get_tokens → customColors). \`${colorPattern.replace("<color>", "brand")}\` is as real as \`${colorPattern.replace("<color>", "primary")}\` once \`brand\` is declared.`,
        }
      : {}),
    ...(compoundSelectors.length ? { compoundSelectors } : {}),
  };
});

// A CSS module whose JSDoc didn't extract is a silently useless catalog entry —
// the description is the only prose the CSS path has (there are no props and no
// usage example to fall back on), so an empty one is worth a warning.
const undocumentedCss = cssComponents.filter((c) => !c.description).map((c) => c.name);
if (undocumentedCss.length) {
  console.warn(
    `  ! ${undocumentedCss.length} CSS module(s) produced no description — add a leading JSDoc to the source file: ${undocumentedCss.join(", ")}`,
  );
}

// ── React ↔ HTML parity ─────────────────────────────────────────────────────
// A component that exists only in silicaui-react is invisible to every
// non-React consumer (Sparx tenant sites, static export) — they cannot author
// it at all. That's a legitimate state for some components, but it has to be a
// DECISION, not an oversight, so the exemptions are enumerated here with a
// reason and anything else is a loud warning.
const HTML_EXEMPT = {
  // Imperative APIs: `toast.add()` / `alertDialog.confirm()` have no
  // pre-existing DOM node for a data-sui-behavior marker to attach to.
  ToastProvider: "imperative API — no markup to mark up",
  ImperativeAlertDialogProvider: "imperative API — no markup to mark up",
  // Not a component in schema terms: it clones its child to add a class, which
  // an authored node expresses by just putting `validator` in its class.
  Validator: "pure class-applicator — express as a class on the node",
  // The -html `Select` IS the native <select>; React splits rich vs native.
  NativeSelect: "covered by -html `Select`, which lowers to a native <select>",
  // Checked against the existing vocabulary first, per the reuse-before-forking
  // rule. What remains is exempt for a stated reason, not by oversight:
  //   PowerSearch— NOT a missing behavior: an application-integration surface.
  //                It is explicitly "a view over `usePowerSearchConfig`" — the
  //                host supplies live field configs and consumes `value.terms`
  //                to build API requests. A static document has no state loop
  //                to hold the other end, so a macro would emit markup for a
  //                component that cannot function. Same category as
  //                ToastProvider, for the same reason.
  // (`Filter` and `Countdown` both came off this list — Filter turned out to BE
  //  `toggle-group` plus an optional `close` part; Countdown got a real one.)
  PowerSearch: "application-integration surface, not a document component (see above)",
};
const htmlNames = new Set(htmlComponents.map((c) => c.name));
const reactOnly = components
  .filter((c) => c.package === "@wizeworks/silicaui-react" && !htmlNames.has(c.name) && !HTML_EXEMPT[c.name])
  .map((c) => c.name);
if (reactOnly.length) {
  console.warn(
    `  ! ${reactOnly.length} @wizeworks/silicaui-react component(s) have no @wizeworks/silicaui-html macro, so non-React consumers cannot author them. ` +
      `Add a ComponentDef, or add an entry to HTML_EXEMPT in this script saying why not: ${reactOnly.join(", ")}`,
  );
}
// Exemptions must stay honest in the other direction too: once a macro lands,
// its stale exemption should go, or the list quietly rots into fiction.
const staleExempt = Object.keys(HTML_EXEMPT).filter((n) => htmlNames.has(n));
if (staleExempt.length) {
  console.warn(
    `  ! HTML_EXEMPT lists component(s) that now DO have an -html macro — remove the stale entries: ${staleExempt.join(", ")}`,
  );
}

const allComponents = [...components, ...htmlComponents, ...cssComponents];
writeJson("components.json", allComponents);

/** Every interface in one file, by name, with members + own doc. Module-scope
 *  because three sections need it (email.json's resolve contract below, the
 *  node-tree schema after it, and themes.json, which publishes the `Theme`
 *  interface from that same file). */
const parseTypes = (relPath) => {
  const filePath = path.join(packagesRoot, relPath);
  const src = readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = {};
  ts.forEachChild(sf, (node) => {
    if (!ts.isInterfaceDeclaration(node)) return;
    out[node.name.text] = {
      doc: getLeadingDoc(src, node, sf),
      extends: (node.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.expression.getText(sf))),
      members: node.members
        // METHOD signatures too, not just properties — `ResolveHost`'s whole
        // surface is `resolveBinding?(ref, scope): Resolved | undefined`, so a
        // property-only walk published the host contract as an EMPTY member
        // list: the one interface an agent most needs, silently blank.
        .filter((m) => (ts.isPropertySignature(m) || ts.isMethodSignature(m)) && m.name)
        .map((m) => ({
          name: m.name.getText(sf),
          optional: !!m.questionToken,
          type: ts.isMethodSignature(m)
            ? `(${m.parameters.map((p) => p.getText(sf)).join(", ")}) => ${m.type ? m.type.getText(sf) : "void"}`
            : m.type
              ? m.type.getText(sf)
              : "unknown",
          doc: getLeadingDoc(src, m, sf),
        })),
    };
  });
  return { src, sf, types: out };
};

// ── email.json ───────────────────────────────────────────────────────────
// The email builder's CLOSED document schema — a different surface from the
// three delivery paths above, and the one place an agent has no other source
// of truth for. `@wizeworks/silicaui-builder/email` accepts a fixed set of node
// kinds with typed fields and hard nesting rules; a kind, field, or nesting an
// agent invents is silently dropped by `EmailEditor.insert` (it returns
// `undefined`) or projects to nothing, with no error to read. So every part of
// this is taken from the source rather than described:
//
//   - field lists + doc comments  → TS AST over email/schema.ts
//   - nesting rules               → by CALLING the real `canHold` on every
//                                   (parent, child) pair, so the matrix cannot
//                                   disagree with what the engine enforces
//   - bindable `attr` allowlist   → the exported `EMAIL_BINDABLE_FIELDS` table
//   - insertable presets          → the exported `EMAIL_PALETTE`, each item's
//                                   `make()` actually invoked for its kind
console.log("email.json");
let emailCatalog = null;
try {
  const emailUrl = pathToFileURL(path.join(packagesRoot, "silicaui-builder/dist/email/index.js")).href;
  const { canHold, isContentKind, EMAIL_BINDABLE_FIELDS, EMAIL_PALETTE } = await import(emailUrl);

  const { types: emailResolveTypes } = parseTypes("silicaui-builder/src/email/resolve.ts");

  const schemaPath = path.join(packagesRoot, "silicaui-builder/src/email/schema.ts");
  const schemaSrc = readFileSync(schemaPath, "utf8");
  const schemaSf = ts.createSourceFile(schemaPath, schemaSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  /** Every interface in the file, by name, with its members + own doc. */
  const interfaces = {};
  ts.forEachChild(schemaSf, (node) => {
    if (!ts.isInterfaceDeclaration(node)) return;
    const members = [];
    for (const member of node.members) {
      if (!ts.isPropertySignature(member) || !member.name) continue;
      members.push({
        name: member.name.getText(schemaSf),
        optional: !!member.questionToken,
        type: member.type ? member.type.getText(schemaSf) : "unknown",
        doc: getLeadingDoc(schemaSrc, member, schemaSf),
      });
    }
    interfaces[node.name.text] = {
      doc: getLeadingDoc(schemaSrc, node, schemaSf),
      extends: (node.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.expression.getText(schemaSf))),
      members,
    };
  });

  // A NODE KIND is any interface carrying a string-literal `kind` member —
  // found structurally, so a kind added to the schema appears here without
  // anyone remembering to list it (the whole point of generating this).
  const kindOf = (iface) => {
    const k = iface.members.find((m) => m.name === "kind");
    const lit = k?.type.match(/^"(.+)"$/);
    return lit ? lit[1] : null;
  };
  const nodeInterfaces = Object.entries(interfaces)
    .map(([name, iface]) => ({ name, iface, kind: kindOf(iface) }))
    .filter((e) => e.kind);

  const allKinds = nodeInterfaces.map((e) => e.kind);
  const kinds = nodeInterfaces.map(({ name, iface, kind }) => {
    // The real rule table, executed — not a restatement of it. `canHold` reads
    // only `kind` on both arguments.
    const holds = allKinds.filter((child) => canHold({ kind }, { kind: child }));
    return {
      kind,
      typeName: name,
      doc: iface.doc,
      isContent: isContentKind(kind),
      container: holds.length > 0,
      holds,
      // Which kinds accept THIS one — the question an agent actually asks
      // ("where can I put a link group?"), and a lookup it shouldn't have to
      // invert the matrix to answer.
      allowedParents: allKinds.filter((parent) => canHold({ kind: parent }, { kind })),
      fields: iface.members.filter((m) => m.name !== "kind"),
      binding: EMAIL_BINDABLE_FIELDS[kind] ?? null,
      sourceFile: `silicaui-builder/src/email/schema.ts`,
    };
  });

  // The ENVELOPE around the node tree — `EmailDocument` (subject/preheader/
  // root), the project roster, the color defaults, the webfont shape. A kind
  // list alone doesn't answer "what do I wrap this in", and these are found the
  // same structural way: every interface in the file that is neither a node
  // kind nor the shared base.
  const nodeTypeNames = new Set(nodeInterfaces.map((e) => e.name));
  const documentTypes = Object.entries(interfaces)
    .filter(([name]) => !nodeTypeNames.has(name) && name !== "BaseNode")
    .map(([name, iface]) => ({ typeName: name, doc: iface.doc, fields: iface.members }));

  emailCatalog = {
    entrypoint: `${scoped("silicaui-builder")}/email`,
    reactEntrypoint: `${scoped("silicaui-builder")}/email/react`,
    note:
      "The CLOSED node schema of the email builder — NOT one of the three delivery paths. An email document is body → section → (columns → column)* → content, projected to table-based, fully inline-styled HTML by `toEmailHtml`. Only these kinds exist and only these nestings are accepted: `EmailEditor.insert` returns undefined for anything else, silently. Fields are typed props on the node itself (not classes) and colors are literal hex (email clients can't resolve CSS custom properties or OKLCH).",
    // Shared by every kind via `BaseNode`, so it's stated once rather than
    // repeated on all of them.
    sharedFields: interfaces.BaseNode?.members ?? [],
    bindingNote:
      "A node carries AT MOST ONE `data` marker. `value` fills one field (`attr` picks which — see each kind's `binding.fields`; omitting it targets `binding.default`); `collection` repeats a node's children once per item and is only meaningful on a kind with children; `visible` keeps or drops the subtree; `action` is an inert marker the host wires. Two per-item values on one card is COMPOSITION, not two markers: a `link` group binds the href while each child binds its own field.",
    // The HOST contract — parsed from email/resolve.ts, which `documentTypes`
    // above never sees (it walks schema.ts only). Its absence was a real hole:
    // path 3's schema.json publishes a full `resolution` block, so an agent
    // could learn the site host contract and then find NOTHING for email — not
    // the hooks, and not the fact that inline `{{ref}}` substitution exists at
    // all. Both fail silently, which is exactly what this catalog is for.
    resolution: {
      note:
        "A host implements `resolveBinding` / `resolveCollection` and `resolveEmailTree` walks the document with them — the email twin of path 3's `resolveTree`, same shape and same contract. Pure and SYNCHRONOUS: a host with an async source fetches ONCE, up front. `toEmailHtml(doc, host)` runs the walk itself, so preview and send resolve identically. `action` nodes are never touched. Absent ALL the resolve hooks the walk is a no-op and the document projects exactly as authored.",
      honesty:
        "The hooks distinguish `undefined` (I have never heard of this ref) from `{ value: undefined }` (I know it and it is empty). An UNKNOWN ref keeps the node's AUTHORED content and fires a diagnostic; a KNOWN-but-empty ref renders empty, which is a legitimate result. Only `collection` differs on one point: `omitWhenEmpty` applies to a known-empty list, never to an unknown ref.",
      // Inline tokens are a SECOND substitution surface, orthogonal to the
      // `data` markers `bindingNote` covers — and the one an agent is most
      // likely to reach for, since prose is where merge fields actually live.
      tokens:
        "Inline `{{ref}}` merge tokens are substituted inside PROSE fields — `text.html`, `button.label`, and the document's `subject`/`preheader` — independently of any whole-field `data` bind on the same node. A sentence like \"Hi {{customer.firstName}}, your order shipped\" has no single field to bind wholesale, so each token resolves on its own through the SAME `resolveBinding` hook. `html` nodes are NEVER substituted: that field is raw passthrough, so an ESP's own merge tags survive it verbatim. Silica's token grammar is exactly ONE production — a bare dotted path, `[a-zA-Z0-9_.]+`. A token containing anything else (a fallback like `{{name ?? \"there\"}}`, a filter pipe) is an EXPRESSION and is handed to the optional `resolveExpression` hook VERBATIM — braces stripped and outer whitespace trimmed, nothing tokenized, unquoted or evaluated — so the expression language lives in the host and silica never parses it. Unhandled either way, the token keeps its literal source and reports (`unknown-ref` for a path, `unknown-expression` for an expression: a misspelled field and an unwired syntax need different fixes). A resolved value is HTML-escaped inside `text.html` and left raw where the projector escapes it itself, so it is never double-escaped.",
      host: emailResolveTypes.EmailResolveHost?.members ?? [],
      bindableFields: EMAIL_BINDABLE_FIELDS,
    },
    documentTypes,
    kinds,
    palette: EMAIL_PALETTE.map((item) => ({
      key: item.key,
      label: item.label,
      hint: item.hint,
      icon: item.icon,
      // Invoked, not inferred from the key.
      kind: item.make().kind,
    })),
  };
  writeJson("email.json", emailCatalog);
} catch (err) {
  console.warn(
    `  ! failed to load the email schema (build it first: pnpm --filter @wizeworks/silicaui-builder build): ${err.message}`,
  );
}

// ── schema.json ──────────────────────────────────────────────────────────
// PATH 3's document schema — the node tree itself. The catalog already covers
// what you can PUT in a silica tree (components, blocks, behaviors, classes);
// this covers the tree's own shape: node kinds, the system-metadata band, the
// DATA-BINDING vocabulary, and the resolution contract a host implements.
//
// It exists because that vocabulary had no machine-readable home at all. An
// agent could look up `Card` and `hero_split_cta` and still have no way to
// learn that a repeat takes a per-instance `limit`, that an unknown ref KEEPS
// the authored content instead of blanking it, or that an unlisted tag is
// silently downgraded to <div>. Every one of those fails quietly, which is
// exactly the class of thing a catalog should answer instead of an agent
// guessing.
//
// Same discipline as email.json — taken from source, never described:
//
//   - node kinds + fields + docs → TS AST over silicaui-html/src/schema.ts
//   - the binding vocabulary     → the real `DataBinding` union, so a kind or
//                                  field added there shows up here with no
//                                  second place to remember
//   - the resolution contract    → the real interfaces in resolve.ts
//   - the raw-element floor      → the exported RAW_ELEMENTS map, READ at
//                                  generation time, so the allowlist can't
//                                  drift from what the projector enforces
console.log("schema.json");

// `parseTypes` is defined ABOVE the email.json section — three sections need it
// now (email's resolve contract, this one, and themes.json below).

let htmlSchema = null;
try {
  const { RAW_ELEMENTS, GLOBAL_ATTRS } = await import(
    pathToFileURL(path.join(packagesRoot, "silicaui-html/dist/index.js")).href
  );

  const schema = parseTypes("silicaui-html/src/schema.ts");
  const resolve = parseTypes("silicaui-html/src/resolve.ts");

  // A union member's doc sits in one of two places and NEITHER is what
  // `getLeadingCommentRanges` returns for it: a `//` comment TRAILS the member
  // on its own line, and a `/** */` block sits before the `|` separator, which
  // is outside the member node entirely. Reading the leading ranges naively
  // returns the PREVIOUS member's trailing comment — silently shifting every
  // doc by one, which is worse than having none.
  const unionMemberDoc = (src, member, prevEnd) => {
    const trailing = ts.getTrailingCommentRanges(src, member.end) ?? [];
    // These ARE line comments, so their `//` is a marker rather than part of a
    // code example — strip it here, where that's known, and not in the shared
    // `cleanComment` (which would rewrite every JSDoc containing an example).
    if (trailing.length) {
      return trailing
        .map((r) => cleanComment(src.slice(r.pos, r.end)).replace(/^\/\/\s?/, ""))
        .join(" ")
        .trim();
    }
    const between = src.slice(prevEnd, member.getStart(schema.sf));
    const blocks = between.match(/\/\*\*[\s\S]*?\*\//g);
    return blocks?.length ? cleanComment(blocks[blocks.length - 1]) : "";
  };

  /** The `DataBinding` discriminated union, member by member. */
  const dataBindings = [];
  ts.forEachChild(schema.sf, (node) => {
    if (!ts.isTypeAliasDeclaration(node) || node.name.text !== "DataBinding") return;
    let prevEnd = node.name.end;
    for (const member of node.type.types) {
      const fields = member.members.map((m) => ({
        name: m.name.getText(schema.sf),
        optional: !!m.questionToken,
        type: m.type.getText(schema.sf),
      }));
      const kindField = fields.find((f) => f.name === "kind");
      dataBindings.push({
        kind: kindField ? kindField.type.replace(/"/g, "") : null,
        doc: unionMemberDoc(schema.src, member, prevEnd),
        fields: fields.filter((f) => f.name !== "kind"),
      });
      prevEnd = member.end;
    }
  });

  // A NODE KIND is any interface with a string-literal `kind` — found
  // structurally, so a kind added to the schema appears here on its own.
  const literalKind = (iface) => iface.members.find((m) => m.name === "kind")?.type.match(/^"(.+)"$/)?.[1] ?? null;
  const kinds = Object.entries(schema.types)
    .map(([typeName, iface]) => ({ typeName, iface, kind: literalKind(iface) }))
    .filter((e) => e.kind)
    .map(({ typeName, iface, kind }) => ({
      kind,
      typeName,
      doc: iface.doc,
      // An Outlet is the one kind that does NOT extend the shared base — it
      // carries no class, no children and no metadata — so say which kinds do
      // rather than letting an agent assume `data` works everywhere.
      sharedFields: iface.extends.includes("NodeBase"),
      fields: iface.members.filter((m) => m.name !== "kind"),
    }));

  const tags = [...RAW_ELEMENTS.entries()].map(([tag, meta]) => ({
    tag,
    group: meta.group,
    void: !!meta.void,
    attrs: meta.attrs ?? [],
  }));

  htmlSchema = {
    entrypoint: "@wizeworks/silicaui-html",
    behaviorRuntime: "@wizeworks/silicaui-behaviors",
    sourceFile: "silicaui-html/src/schema.ts",
    note:
      "A silica document is a TREE of nodes projected to HTML by `toHtml`. A node is an element (a raw tag), a component (a @wizeworks/silicaui macro that EXPANDS to an element subtree), an outlet (the reserved marker for where a routed page renders inside a frame — valid only in a frame), or a host node (an opaque mount point for a host's own live widget). A plain STRING child is a text node, so mixed inline content composes naturally. `class` is the ONLY styling surface — there is no inline style, ever.",
    child: schema.types.Node?.doc ?? "A child is another node, or a plain string (a text node).",
    // Everything in this band is TYPED and top-level — never smuggled through
    // attrs/props — which is the reason a linter, a projection and a builder
    // can each reason about it.
    nodeBase: schema.types.NodeBase?.members ?? [],
    kinds,
    bindingNote:
      "A node carries AT MOST ONE `data` marker — the union makes that structural. The `ref` is OPAQUE: silica never parses it, it hands it to the host and renders what comes back, which is what keeps the engine domain-blind. Two values on one card is COMPOSITION, not two markers: the card's own <a> binds `href` via `attr`, and each child binds its own field.",
    dataBindings,
    resolution: {
      note:
        "A host implements `resolveBinding` / `resolveCollection` and `resolveTree` walks the document with them. Pure and SYNCHRONOUS by design — a host with an async source fetches ONCE, up front, into whatever the synchronous hooks then read from, which is what stops an async-per-node API creating waterfalls. The SAME primitive feeds a live render and a builder canvas (`{ editing: true }`), so preview == production is structural.",
      honesty:
        "The hooks distinguish `undefined` (I have never heard of this ref) from `{ value: undefined }` (I know it and it is empty). They are treated differently and the difference is the whole contract: an UNKNOWN ref keeps the node's AUTHORED content and fires a diagnostic; a KNOWN-but-empty ref renders empty, which is a legitimate result. Without that split the walk blanks the node either way, and an author cannot tell a typo from real absence.",
      host: resolve.types.ResolveHost?.members ?? [],
      resolved: resolve.types.Resolved?.members ?? [],
      scope: resolve.types.DataScope?.members ?? [],
      options: resolve.types.ResolveOptions?.members ?? [],
      diagnostic: resolve.types.ResolveDiagnostic?.members ?? [],
    },
    elementFloor: {
      note:
        "`toHtml` enforces an unconditional allowlist (builder-contract.md §9): a tag that is not listed here is DOWNGRADED to <div> and an attribute that is not listed for its tag is DROPPED — silently, with the content lost. This is a security floor, not a style guide, and no host option relaxes it. Author with these tags and attrs; for a third-party player or map use the Embed component rather than a raw <iframe>, which floors to <div>.",
      globalAttrs: GLOBAL_ATTRS,
      tags,
    },
  };
  writeJson("schema.json", htmlSchema);
} catch (err) {
  console.warn(
    `  ! failed to load the node-tree schema (build it first: pnpm --filter @wizeworks/silicaui-html build): ${err.message}`,
  );
}

// ── themes.json ──────────────────────────────────────────────────────────
// The THEME layer, which the catalog did not advertise at all.
//
// `get_tokens` returned a `light` map and a `dark` map and never said how
// either one is ACTIVATED, so `data-theme` — the single attribute the whole
// system turns on, and the only sanctioned way to give a section a different
// palette — appeared nowhere in this server. An agent that knew the eight
// semantic roles and not the island had exactly one way to render a dark
// section: hardcoded hex or a bespoke stylesheet. Both look right in a
// screenshot and are permanently un-themeable, which is the same
// fails-plausibly profile the node-tree schema section exists for.
//
// Same discipline as every section above — values derived, never described:
//
//   - the selectors        → by CALLING the plugin's own `buildBase()` and
//                            reading the `[data-theme…]` keys it emits
//   - the plugin options   → read off theme-plugin.js's own `options` accesses
//   - the `Theme` shape    → TS AST over silicaui-html/src/schema.ts
//   - the presets          → the real exported THEME_PRESETS, each one RESOLVED
//                            through `resolveThemeTokens` (so a published map
//                            is what a browser computes, dark deltas merged and
//                            `-content` inks derived — not the authored bag)
//   - contrast warnings    → `contrastWarnings` actually run, per mode
//   - each preset's prose  → the comment above its own `name:` in themes.ts
console.log("themes.json");
let themesCatalog = null;
try {
  const { THEME_PRESETS, resolveThemeTokens, contrastWarnings, rolesOf, SURFACE_TOKENS, SEMANTIC_ROLES } =
    await import(pathToFileURL(path.join(packagesRoot, "silicaui-html/dist/index.js")).href);
  const { buildBase } = await import(pathToFileURL(path.join(packagesRoot, "silicaui/src/theme.js")).href);

  // The real emitted selectors. A hand-written `[data-theme="dark"]` here would
  // be a description of the CSS; this IS the CSS.
  const base = buildBase();
  const themeSelectors = Object.keys(base).filter((k) => k.startsWith("[data-theme"));
  const builtInThemes = themeSelectors
    .map((s) => /^\[data-theme="([^"]+)"\]$/.exec(s)?.[1])
    .filter(Boolean);
  // What the bare `[data-theme]` rule actually paints — the reason putting the
  // attribute on a wrapper is enough, with no per-section CSS.
  const surfaceProperties = Object.keys(base["[data-theme]"] ?? {});

  // The `@plugin "@wizeworks/silicaui/theme"` option names, read off the
  // plugin's own accesses rather than restated. `--*` token entries are
  // collected by an Object.entries loop there and so aren't (and can't be) a
  // fixed list — that's stated in prose instead.
  const themePluginRel = "silicaui/src/theme-plugin.js";
  const themePluginSrc = readFileSync(path.join(packagesRoot, themePluginRel), "utf8");
  const pluginOptions = [
    ...new Set(
      [
        ...themePluginSrc.matchAll(/options\.([a-zA-Z][a-zA-Z0-9]*)/g),
        ...themePluginSrc.matchAll(/options\["([^"]+)"\]/g),
      ].map((m) => m[1]),
    ),
  ].sort();
  if (!pluginOptions.length) {
    console.warn(`  ! no @plugin options extracted from ${themePluginRel} — the regex above is now wrong`);
  }

  // The `Theme` interface itself, plus the small function surface a host drives
  // it with. Both from source: an agent handed a theme object needs the field
  // names, and a builder/CMS needs to know `resolveThemeTokens` exists rather
  // than re-implementing the dark merge (which is where the stale-ink bug its
  // JSDoc describes came from in the first place).
  const htmlSchemaTypes = parseTypes("silicaui-html/src/schema.ts").types;
  const themesRel = "silicaui-html/src/themes.ts";
  const themesPath = path.join(packagesRoot, themesRel);
  const themeApi = ["rolesOf", "colorValue", "resolveThemeTokens", "contrastWarnings", "presetByName"].map((fn) => ({
    name: fn,
    doc: mention(extractExportDoc(themesPath, fn)),
  }));
  const runtimeCssRel = "silicaui-html/src/theme.ts";
  const runtimeCssPath = path.join(packagesRoot, runtimeCssRel);
  const runtimeCss = ["themeTokenCss", "customColorCss"].map((fn) => ({
    name: fn,
    doc: mention(extractExportDoc(runtimeCssPath, fn)),
  }));

  // Each preset's character — the comment sitting above its own `name:` inside
  // the `defineTheme({ … })` call. It's the only prose that says what a preset
  // is FOR, and twenty names alone ("clay", "dune", "frost") are unpickable
  // without it.
  const themesSrc = readFileSync(themesPath, "utf8");
  const themesSf = ts.createSourceFile(themesPath, themesSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const characterByName = {};
  ts.forEachChild(themesSf, (node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (decl.name.getText(themesSf) !== "THEME_PRESETS" || !ts.isArrayLiteralExpression(decl.initializer)) continue;
      for (const el of decl.initializer.elements) {
        const obj = ts.isCallExpression(el) ? el.arguments[0] : null;
        if (!obj || !ts.isObjectLiteralExpression(obj)) continue;
        const nameProp = obj.properties.find((p) => p.name?.getText(themesSf) === "name");
        if (!nameProp) continue;
        const key = nameProp.initializer.getText(themesSf).replace(/^["']|["']$/g, "");
        const ranges = ts.getLeadingCommentRanges(themesSrc, nameProp.getFullStart()) ?? [];
        // These ARE line comments, so `//` is a marker rather than part of a code
        // example — stripped here, where that's known, and not in the shared
        // `cleanComment` (which would rewrite every JSDoc containing one).
        characterByName[key] = mention(
          ranges
            .map((r) => themesSrc.slice(r.pos, r.end))
            .join("\n")
            .split("\n")
            .map((l) => l.replace(/^\s*\/\/\s?/, ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim(),
        );
      }
    }
  });

  const SHAPE_KEYS = new Set(["--radius-selector", "--radius-field", "--radius-box", "--border", "--depth"]);
  const presets = THEME_PRESETS.map((theme) => {
    const light = resolveThemeTokens(theme, "light");
    const dark = resolveThemeTokens(theme, "dark");
    const character = characterByName[theme.name] ?? "";
    if (!character) console.warn(`  ! preset "${theme.name}" has no character comment above its \`name:\` in ${themesRel}`);
    return {
      name: theme.name,
      character,
      applyAs: `data-theme="${theme.name}"`,
      mode: theme.mode ?? "light",
      roles: rolesOf(theme),
      // Provenance for a publish-time self-hosting step. A preset with no
      // `fonts` inherits @wizeworks/silicaui's own system stack on purpose.
      fonts: theme.fonts && Object.keys(theme.fonts).length ? theme.fonts : null,
      shape: Object.fromEntries(Object.entries(theme.tokens).filter(([k]) => SHAPE_KEYS.has(k))),
      light,
      dark,
      // Run, not asserted. Empty is the healthy state; a non-empty entry is a
      // real legibility fact about a shipped preset, and hiding it would make
      // this catalog the thing that vouched for it.
      contrastWarnings: { light: contrastWarnings(theme, "light"), dark: contrastWarnings(theme, "dark") },
    };
  });
  const unhealthy = presets.filter((p) => p.contrastWarnings.light.length || p.contrastWarnings.dark.length);
  if (unhealthy.length) {
    console.warn(
      `  ! ${unhealthy.length} preset(s) ship a role whose ink fails WCAG AA — published as-is under contrastWarnings: ${unhealthy
        .map((p) => p.name)
        .join(", ")}`,
    );
  }

  themesCatalog = {
    note:
      "A THEME is a set of token values applied through the `data-theme` attribute. It is the ONLY sanctioned way to change a palette: put the attribute on an element and everything inside resolves against that theme's tokens, with no per-theme CSS, no restyled components, and no literal hex anywhere. Colors, radii, border width, depth and the type faces all travel with it.",
    mechanism: {
      attribute: "data-theme",
      selectors: themeSelectors,
      builtIn: builtInThemes,
      builtInNote:
        "`light` and `dark` ship with the plugin — no registration needed. `[data-theme=\"light\"]` is emitted EXPLICITLY so a light island can sit inside a dark page as easily as the reverse. Every other name comes from a preset or an app's own `@plugin` block (see `declaring`).",
      apply:
        'Put it on <html> to theme a whole page: `<html data-theme="dark">`. Put it on any wrapper to theme one section: `<section data-theme="dark"> … </section>`. Nesting works and is the intended idiom — an island resolves against the nearest ancestor that carries the attribute.',
      paints: surfaceProperties,
      paintsNote:
        "The bare `[data-theme]` rule paints these on the element itself, which is why a wrapper is sufficient and a section needs no CSS of its own. It is scoped to `[data-theme]` deliberately: Silica never repaints a host page that did not opt in, so it stays embeddable under another design system.",
      darkMode:
        "There is no `.dark` class and no separate dark stylesheet — dark IS a theme. Switch by setting `data-theme=\"dark\"` (usually on <html>, from a toggle or the server). To follow the OS instead, declare a theme with `prefersdark` (see `declaring`), which applies it under `@media (prefers-color-scheme: dark)` for a root that carries no explicit `data-theme`.",
      presetModes:
        "A NAMED preset carries both modes, and which one shows is the host's dark strategy rather than anything the name encodes: emit `themeTokenCss(theme, selector, mode)` twice, once per mode, under whichever selectors that strategy uses. `[data-theme=\"light\"]`/`[data-theme=\"dark\"]` above is simply the built-in strategy, not the only one.",
      contentInk:
        "Inside an island, `--color-base-content` and each role's `-content` are already the legible ink for that theme's surfaces. That is what makes `<Button variant=\"outline\">` resolve correctly in a dark section with no per-theme prop — and what a hardcoded hex or a `/opacity` ink permanently opts out of.",
      never:
        "Do NOT hand-write per-theme CSS, an inline `style` on a control, or a literal hex to get a different palette — none of them can respond to the theme they end up inside. A component's `color`/`variant` props plus an ancestor `data-theme` are the whole mechanism.",
    },
    declaring: {
      plugin: "@wizeworks/silicaui/theme",
      sourceFile: themePluginRel,
      options: pluginOptions,
      tokenNote:
        "Any Silica token can also be set in the same block — `--color-*`, `--radius-*`, `--size-field`, `--border`, `--depth`, … (get_tokens lists them). Those entries are collected generically, so the list is open; the four named options above are the plugin's own switches.",
      doc: mention(extractFirstDoc(path.join(packagesRoot, themePluginRel))),
      contentNote:
        "A `--color-X` with no matching `--color-X-content` gets a legible foreground auto-derived by measured contrast — declare one only to override that choice.",
      partialNote:
        "Partial overrides are fine: unspecified tokens fall through to the built-in theme via the cascade. Load the theme plugin AFTER `@plugin \"@wizeworks/silicaui\"` so source order puts your values on top.",
    },
    themeObject: {
      typeName: "Theme",
      sourceFile: "silicaui-html/src/schema.ts",
      note:
        "The runtime/serializable form of a theme — what a builder, CMS or multi-tenant host stores and edits, as opposed to the build-time `@plugin` form above. `@wizeworks/silicaui-html` owns the type so the theme editor, the property panel and any headless consumer agree on what roles exist.",
      doc: htmlSchemaTypes.Theme?.doc ?? "",
      fields: htmlSchemaTypes.Theme?.members ?? [],
      fontSelection: htmlSchemaTypes.ThemeFontSelection?.members ?? [],
      surfaceTokens: [...SURFACE_TOKENS],
      semanticRoles: [...SEMANTIC_ROLES],
      rolesNote:
        "The role list is OPEN. `rolesOf(theme)` returns the eight semantic roles PLUS any custom `--color-X` the theme declares — scanning the dark bag as well as the base one, since a color added while the theme was in dark mode is still a role. Never hardcode a closed list against a Theme.",
      api: themeApi,
      runtimeCss: {
        entrypoint: "@wizeworks/silicaui-html/theme",
        sourceFile: runtimeCssRel,
        note:
          "For a color NAMED AT RUNTIME — a tenant inventing `sunset` in a theme editor months after the bundle shipped — no build-time `colors:` list can carry it. These two emit the same rules the plugin would have, by calling Silica's own generators, so a runtime color is byte-for-byte a declared one. Ship BOTH: `customColorCss` emits the rules, `themeTokenCss` declares the custom properties they read, and the rules have no fallback, so shipping one without the other paints nothing.",
        functions: runtimeCss,
      },
    },
    presets,
  };
  writeJson("themes.json", themesCatalog);
} catch (err) {
  console.warn(
    `  ! failed to load the theme presets (build it first: pnpm --filter @wizeworks/silicaui-html build): ${err.message}`,
  );
}

console.log(
  `\n✅ catalog generated (${allComponents.length} components [${components.length} react, ${htmlComponents.length} html, ${cssComponents.length} css], ${Object.keys(classesByComponent).length} class groups, ${Object.keys(BEHAVIOR_FILES).length} behaviors, ${emailCatalog ? emailCatalog.kinds.length : 0} email node kinds)`,
);
console.log(
  `   node-tree schema: ${htmlSchema ? `${htmlSchema.kinds.length} node kinds, ${htmlSchema.dataBindings.length} binding kinds, ${htmlSchema.elementFloor.tags.length} allowed tags` : "MISSING"}`,
);
console.log(
  `   themes: ${themesCatalog ? `${themesCatalog.presets.length} presets, ${themesCatalog.mechanism.selectors.length} [data-theme] selectors` : "MISSING"}`,
);
