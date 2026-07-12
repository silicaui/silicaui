// Generates the static catalog `@wizeworks/silicaui-mcp` ships with — real
// class names, tokens, blocks, behaviors, and component docs, extracted
// straight from the monorepo's source (never hand-authored, so it can't
// drift into fiction).
// Run via `pnpm --filter @wizeworks/silicaui-mcp gen`; output is committed
// under src/data/ (same discipline as silicaui-builder's gen-icons.mjs).
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(here, "..");
const packagesRoot = path.join(pkgRoot, "..");
const repoRoot = path.join(packagesRoot, "..");
const dataDir = path.join(pkgRoot, "src", "data");
mkdirSync(dataDir, { recursive: true });

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
for (const p of PACKAGES) {
  try {
    const pj = JSON.parse(readFileSync(path.join(packagesRoot, p.name, "package.json"), "utf8"));
    p.version = pj.version;
  } catch {
    p.version = "unknown";
  }
}
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
const NON_CATALOG_EXPORTS = new Set(["SilicaProvider"]);

// A file where AT LEAST ONE export is documented is a compound whose OTHER
// exports are Base-UI-style sub-parts (DialogTrigger next to documented
// Dialog, CardBody next to documented Card, ...) — not a gap, don't warn.
// Only flag files where NOTHING they export made it into the README at all.
const undocumentedFiles = Object.entries(reactNamesByFile).filter(
  ([, names]) => names.some((n) => !NON_CATALOG_EXPORTS.has(n)) && !names.some((n) => documentedNames.has(n)),
);
if (undocumentedFiles.length) {
  const summary = undocumentedFiles.map(([file, names]) => `${file} (${names.join(", ")})`).join("; ");
  console.warn(
    `  ! ${undocumentedFiles.length} @wizeworks/silicaui-react source file(s) have NO export in README's component table — likely a missing row, not a sub-part (won't appear in list_components until fixed): ${summary}`,
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
    usageExample = readFileSync(
      path.join(repoRoot, "examples/playground/src/demos", `${meta.name}.tsx`),
      "utf8",
    ).trim();
  } catch {
    // no demo file — leave null
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

const allComponents = [...components, ...htmlComponents];
writeJson("components.json", allComponents);

console.log(
  `\n✅ catalog generated (${allComponents.length} components [${components.length} react, ${htmlComponents.length} html], ${Object.keys(classesByComponent).length} class groups, ${Object.keys(BEHAVIOR_FILES).length} behaviors)`,
);
