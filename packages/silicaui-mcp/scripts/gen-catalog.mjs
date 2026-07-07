// Generates the static catalog `silicaui-mcp` ships with — real class names,
// tokens, blocks, behaviors, and component docs, extracted straight from the
// monorepo's source (never hand-authored, so it can't drift into fiction).
// Run via `pnpm --filter silicaui-mcp gen`; output is committed under
// src/data/ (same discipline as silicaui-builder's gen-icons.mjs).
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
  { name: "silicaui-builder", purpose: "The visual document editor/engine used to build the SilicaUI sitebuilder itself — not typically installed by app developers.", install: null, private: true },
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
writeJson("packages.json", PACKAGES);

// ── tokens.json ──────────────────────────────────────────────────────────
console.log("tokens.json");
const { LIGHT, DARK, SEMANTIC_COLORS } = await import(
  pathToFileURL(path.join(packagesRoot, "silicaui/src/colors.js")).href
);
writeJson("tokens.json", {
  semanticColors: SEMANTIC_COLORS,
  light: LIGHT,
  dark: DARK,
  typography: {
    baseFontSize: "100% (≈16px) — an explicit anchor, not the UA default by accident; the whole rem-based type scale (text-md = 1rem) scales with it.",
    fontFamilyTokens: ["--font-sans", "--font-serif", "--font-mono"],
    note: "Every non-namespace token (--size-field, --border, --depth, --duration, --ease, --focus-width, --focus-offset, --disabled-opacity, --noise, …) carries its default inline via var(--token, default) in each component, so an app's own :root/@theme override always wins.",
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
    let result = null;
    for (const args of [[SEMANTIC_COLORS, ""], [SEMANTIC_COLORS], []]) {
      try {
        result = fn(...args);
        break;
      } catch {
        result = null;
      }
    }
    if (result && typeof result === "object") {
      for (const key of Object.keys(result)) {
        for (const m of key.matchAll(/\.([a-zA-Z0-9_-]+)/g)) classSet.add(m[1]);
      }
    }
  }
  if (classSet.size) classesByComponent[path.basename(file, ".js")] = [...classSet].sort();
}
const { colorUtilities, softUtilities } = await import(
  pathToFileURL(path.join(componentsDir, "..", "color-utilities.js")).href
);
const utilClasses = new Set();
for (const key of Object.keys({ ...colorUtilities(SEMANTIC_COLORS), ...softUtilities() })) {
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
  console.warn(`  ! failed to load silicaui-html blocks (build it first: pnpm --filter silicaui-html build): ${err.message}`);
  writeJson("blocks.json", []);
}

// ── behaviors.json ───────────────────────────────────────────────────────
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
const BEHAVIOR_FILES = {
  carousel: "carousel.ts",
  disclosure: "disclosure.ts",
  tabs: "tabs.ts",
  menu: "menu.ts",
  marquee: "marquee.ts",
  scrollspy: "scrollspy.ts",
  counter: "counter.ts",
  dismiss: "dismiss.ts",
  toc: "scrollspy.ts",
};
writeJson(
  "behaviors.json",
  Object.entries(BEHAVIOR_FILES).map(([type, file]) => ({
    type,
    description: extractFirstDoc(path.join(behaviorsDir, file)),
  })),
);

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

// Wrapper packages: small, hand-listed (no README table covers these).
const wrapperMeta = [
  { name: "Chart", category: "wrapper", package: "silicaui-charts", file: "chart.tsx" },
  { name: "Sparkline", category: "wrapper", package: "silicaui-charts", file: "sparkline.tsx" },
  { name: "DataTable", category: "wrapper", package: "silicaui-table", file: "data-table.tsx" },
  { name: "RichTextEditor", category: "wrapper", package: "silicaui-editor", file: "rich-text-editor.tsx" },
  { name: "SortableList", category: "wrapper", package: "silicaui-dnd", file: "sortable-list.tsx" },
  { name: "ResizablePanels", category: "wrapper", package: "silicaui-panels", file: "resizable-panels.tsx" },
];

const components = [];
for (const meta of [...componentMeta, ...wrapperMeta]) {
  const fileRel = meta.file ?? `${toKebab(meta.name)}.tsx`;
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
    package: meta.package,
    category: meta.category,
    sourceFile: `${meta.package}/src/${fileRel}`,
    description: parsed.description,
    props: parsed.props,
    usageExample,
  });
}
writeJson("components.json", components);

console.log(`\n✅ catalog generated (${components.length} components, ${Object.keys(classesByComponent).length} class groups)`);
