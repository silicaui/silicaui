// Runnable proof the server actually answers every tool over real stdio — not
// just that it builds. Run against the built output:
// `pnpm --filter @wizeworks/silicaui-mcp build && node verify.mjs`.
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

function text(result) {
  return result.content?.[0]?.text ?? "";
}

const client = new Client({ name: "@wizeworks/silicaui-mcp-verify", version: "0.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["bin/silicaui-mcp.mjs"],
});
await client.connect(transport);

const tools = await client.listTools();
check("server registers all 10 tools", tools.tools.length === 10);

const packages = JSON.parse(text(await client.callTool({ name: "list_packages", arguments: {} })));
check("list_packages returns the family", packages.some((p) => p.name === "@wizeworks/silicaui-react"));

// The catalog once snapshotted versions at generation time, and since `gen`
// runs neither in `build` nor at release, the number froze — the server
// advertised 0.26.0 after 0.29.0 had shipped. Versions are now stamped at
// runtime from our own package.json, so assert against that rather than
// against any value stored in the catalog.
const ownVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
check(
  `list_packages reports the live version (${ownVersion}) for every package`,
  packages.length > 0 && packages.every((p) => p.version === ownVersion),
);
check(
  "server identity reports the live version",
  client.getServerVersion()?.version === ownVersion,
);
// Guards the generator: a re-baked `version` would silently win again.
check(
  "catalog does NOT store versions (they must stay runtime-stamped)",
  JSON.parse(readFileSync("src/data/packages.json", "utf8")).every(
    (p) => !("version" in p),
  ),
);

const components = JSON.parse(
  text(await client.callTool({ name: "list_components", arguments: { package: "@wizeworks/silicaui-react" } })),
);
check("list_components filters by package", components.length > 0 && components.every((c) => c.package === "@wizeworks/silicaui-react"));

// ── the three delivery paths ────────────────────────────────────────────────
// The routing preamble clients read at `initialize`, before any tool call. It
// used to not exist at all: an agent got ten tools and had to infer that CSS,
// React, and node-tree output are three different ways to consume Silica.
const instructions = client.getInstructions() ?? "";
check("server exposes routing instructions", instructions.length > 0);
check(
  "instructions name all three delivery paths",
  ["@wizeworks/silicaui-react", "@wizeworks/silicaui-html", "@wizeworks/silicaui-behaviors"].every((p) =>
    instructions.includes(p),
  ) && /THREE paths/.test(instructions),
);
// Anti-drift: prose can name a package that was renamed or never existed, and
// nothing else would catch it. Every @wizeworks/* package the instructions
// mention must be a real entry in the catalog.
const catalogNames = new Set(packages.map((p) => p.name));
const bogus = [...new Set(instructions.match(/@wizeworks\/[a-z-]+/g) ?? [])].filter(
  (n) => !catalogNames.has(n),
);
check(`instructions only name real packages${bogus.length ? ` (bogus: ${bogus.join(", ")})` : ""}`, bogus.length === 0);

const multi = JSON.parse(text(await client.callTool({ name: "get_component", arguments: { name: "Button" } })));
check(
  "get_component with no package returns every path's shape",
  Array.isArray(multi.paths) &&
    ["@wizeworks/silicaui", "@wizeworks/silicaui-react", "@wizeworks/silicaui-html"].every((p) =>
      multi.paths.some((m) => m.package === p),
    ),
);
check("multi-path answer leads with the CSS path", multi.paths?.[0]?.package === "@wizeworks/silicaui");

// The CSS path is a first-class catalog entry, not just a bag of class names:
// `list_classes` alone never said which class is the root or which are variants.
const cssButton = JSON.parse(
  text(await client.callTool({ name: "get_component", arguments: { name: "Button", package: "@wizeworks/silicaui" } })),
);
check("CSS entry derives the real root class (btn, not the file name)", cssButton.root === "btn");
check("CSS entry lists color variants", cssButton.colorVariants?.includes("btn-primary"));
check(
  "CSS entry documents from the module's own JSDoc",
  typeof cssButton.description === "string" && cssButton.description.startsWith("The Button component"),
);
// Families with no bare root class must SAY so — `class="dialog"` is the
// obvious thing to invent when the answer is just `root: null`.
const cssDialog = JSON.parse(
  text(await client.callTool({ name: "get_component", arguments: { name: "Dialog", package: "@wizeworks/silicaui" } })),
);
check(
  "CSS entry flags families that have no root class",
  cssDialog.root === null && cssDialog.familyPrefix === "dialog-" && !!cssDialog.rootNote,
);

const button = JSON.parse(
  text(await client.callTool({ name: "get_component", arguments: { name: "Button", package: "@wizeworks/silicaui-react" } })),
);
check("get_component returns real props", button.props[0]?.members?.some((m) => m.name === "variant"));
check("get_component returns a usage example", typeof button.usageExample === "string" && button.usageExample.length > 0);

const htmlDialog = JSON.parse(
  text(await client.callTool({ name: "get_component", arguments: { name: "Dialog", package: "@wizeworks/silicaui-html" } })),
);
check("get_component returns silicaui-html macros with their real BehaviorType", htmlDialog.behaviors?.includes("modal"));

const missing = await client.callTool({ name: "get_component", arguments: { name: "NotAComponent" } });
check("get_component reports isError for unknown name", missing.isError === true);

const btnClasses = JSON.parse(text(await client.callTool({ name: "list_classes", arguments: { component: "Button" } })));
check("list_classes accepts PascalCase and normalizes", btnClasses.component === "button");
check("list_classes returns real class names", btnClasses.classes.includes("btn-outline"));

const tokens = JSON.parse(text(await client.callTool({ name: "get_tokens", arguments: {} })));
check("get_tokens returns semantic colors", tokens.semanticColors.includes("primary"));

const blocks = JSON.parse(text(await client.callTool({ name: "list_blocks", arguments: {} })));
check("list_blocks returns summaries without a root", blocks.length > 0 && !("root" in blocks[0]));

const block = JSON.parse(text(await client.callTool({ name: "get_block", arguments: { key: "hero_split_cta" } })));
check("get_block returns the full tree", block.root !== undefined);

const behaviors = JSON.parse(text(await client.callTool({ name: "list_behaviors", arguments: {} })));
// Compare against the BehaviorType union itself, not a hardcoded count. The
// literal `=== 30` this replaced started failing the moment a 31st behavior was
// registered — reporting a stale test as a broken catalog, and giving a real
// omission nowhere to show up distinctly.
const behaviorTypes = new Set(
  (
    readFileSync("../silicaui-behaviors/src/types.ts", "utf8")
      .split("export type BehaviorType =")[1]
      ?.split(";")[0] ?? ""
  )
    .split("|")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean),
);
const listed = new Set(behaviors.map((b) => b.type));
const missingBehaviors = [...behaviorTypes].filter((t) => !listed.has(t));
check(
  `list_behaviors returns every registered BehaviorType (${behaviorTypes.size})`,
  behaviorTypes.size > 0 && missingBehaviors.length === 0,
);
if (missingBehaviors.length) console.log(`      missingBehaviors: ${missingBehaviors.join(", ")}`);

const behavior = JSON.parse(text(await client.callTool({ name: "get_behavior", arguments: { type: "disclosure" } })));
check("get_behavior returns a description", behavior.description.includes("trigger"));

const search = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "accordion" } })));
check("search_docs finds cross-domain matches", search.some((r) => r.kind === "block") || search.some((r) => r.kind === "behavior"));

const classSearch = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "soft" } })));
check("search_docs finds literal class names", classSearch.some((r) => r.kind === "class" && r.class === "bg-soft"));

await client.close();

console.log(failures === 0 ? "\n✅ all checks passed\n" : `\n❌ ${failures} check(s) failed\n`);
process.exit(failures ? 1 : 0);
