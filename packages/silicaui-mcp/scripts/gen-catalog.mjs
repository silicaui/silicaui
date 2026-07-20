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
const mention = (s) => s.replace(/\bsilicaui(-[a-z]+)?\b/g, (m) => `@wizeworks/${m}`);

function writeJson(name, data) {
  writeFileSync(path.join(dataDir, name), JSON.stringify(data, null, 2) + "\n");
  console.log(`  wrote src/data/${name}`);
}

function cleanComment(raw) {
  return raw
    .replace(/^\/\*\*?/, "")
    .replace(/\*\/$/, "")
    .split("\n")
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
  { name: "silicaui-html", purpose: "Framework-neutral node-tree schema + HTML projection + composed blocks (for non-React output).", install: "pnpm add silicaui-html" },
  { name: "silicaui-behaviors", purpose: "Zero-dependency runtime that hydrates data-sui-* markers with interactivity (the vanilla-JS counterpart to silicaui-react's Base UI behavior).", install: "pnpm add silicaui-behaviors" },
  { name: "silicaui-builder", purpose: "The visual document editor/engine that powers the SilicaUI sitebuilder — also consumable directly: the framework-neutral engine at the root import, the `Builder` React component + `BuilderHost` interface (catalog/inspectorPanels/pickAsset) at `/react`, and the email editor at `/email` and `/email/react`.", install: "pnpm add silicaui-builder silicaui-react" },
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
let scalarTokens = [];
try {
  const { SCALAR_TOKENS } = await import(
    pathToFileURL(path.join(packagesRoot, "silicaui-html/dist/index.js")).href
  );
  scalarTokens = SCALAR_TOKENS;
} catch (err) {
  console.warn(`  ! failed to load @wizeworks/silicaui-html SCALAR_TOKENS (build it first: pnpm --filter @wizeworks/silicaui-html build): ${err.message}`);
}
writeJson("tokens.json", {
  semanticColors: SEMANTIC_COLORS,
  light: LIGHT,
  dark: DARK,
  scalarTokens,
  typography: {
    baseFontSize: "100% (≈16px) — an explicit anchor, not the UA default by accident; the whole rem-based type scale (text-md = 1rem) scales with it.",
    fontFamilyTokens: ["--font-sans", "--font-serif", "--font-mono"],
    note: "Every non-namespace token (see scalarTokens above, plus --duration, --ease, --focus-offset which aren't yet theme-editable) carries its default inline via var(--token, default) in each component, so an app's own :root/@theme override always wins.",
  },
});

// ── classes.json ─────────────────────────────────────────────────────────
console.log("classes.json");
const componentsDir = path.join(packagesRoot, "silicaui/src/components");
const classesByComponent = {};
for (const file of readdirSync(componentsDir).filter((f) => f.endsWith(".js"))) {
  let mod;
  try {
    mod = await import(pathToFileURL(path.join(componentsDir, file)).href);
  } catch (err) {
    console.warn(`  ! failed to import components/${file}: ${err.message}`);
    continue;
  }
  const classSet = new Set();
  for (const [, fn] of Object.entries(mod).filter(([, v]) => typeof v === "function")) {
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
        for (const m of key.matchAll(/\.([a-zA-Z0-9_-]+)/g)) classSet.add(m[1]);
      }
    }
  }
  if (classSet.size) classesByComponent[path.basename(file, ".js")] = [...classSet].sort();
}
const { colorUtilities, softUtilities, glassUtilities } = await import(
  pathToFileURL(path.join(componentsDir, "..", "color-utilities.js")).href
);
const utilClasses = new Set();
for (const key of Object.keys({ ...colorUtilities(SEMANTIC_COLORS), ...softUtilities(), ...glassUtilities() })) {
  for (const m of key.matchAll(/\.([a-zA-Z0-9_-]+)/g)) utilClasses.add(m[1]);
}
classesByComponent["color-utilities"] = [...utilClasses].sort();
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
  const { listComponents } = await import(htmlIndexUrl);
  const componentSrc = readFileSync(path.join(packagesRoot, "silicaui-html/src/component.ts"), "utf8");
  const componentSrcLines = componentSrc.split("\n");

  function lineOf(name) {
    const needle = `name: "${name}",`;
    const idx = componentSrcLines.findIndex((l) => l.includes(needle));
    return idx === -1 ? null : idx + 1;
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
    return {
      name: def.name,
      package: scoped("silicaui-html"),
      category: def.category,
      label: def.label,
      icon: def.icon,
      container: !!def.container,
      behaviors,
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
  // Deferred with a known reason (OKLCH color math needs a port).
  ColorPicker: "deferred — needs the OKLCH picker ported to vanilla",
  // Interactive; each needs a behavior handler designed, not just a macro.
  Countdown: "needs a behavior handler (ticking clock)",
  TagInput: "needs a behavior handler (token entry/removal)",
  Filter: "needs a behavior handler (filter chips)",
  PowerSearch: "needs a behavior handler (async search)",
  // The whole Chat family is unbuilt on purpose — half a family is worse than
  // none, and chat UIs are app surfaces rather than static-site content.
  Chat: "Chat family unbuilt in -html (tracked as one unit)",
  ChatComposer: "Chat family unbuilt in -html (tracked as one unit)",
  ChatLayout: "Chat family unbuilt in -html (tracked as one unit)",
  ChatMessage: "Chat family unbuilt in -html (tracked as one unit)",
  ChatSystemMessage: "Chat family unbuilt in -html (tracked as one unit)",
  ChatToolCalls: "Chat family unbuilt in -html (tracked as one unit)",
  ChatTypingIndicator: "Chat family unbuilt in -html (tracked as one unit)",
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

const allComponents = [...components, ...htmlComponents];
writeJson("components.json", allComponents);

console.log(
  `\n✅ catalog generated (${allComponents.length} components [${components.length} react, ${htmlComponents.length} html], ${Object.keys(classesByComponent).length} class groups, ${Object.keys(BEHAVIOR_FILES).length} behaviors)`,
);
