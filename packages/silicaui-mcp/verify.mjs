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
// Counted from the source rather than hardcoded — the same lesson the
// BehaviorType check below already learned the hard way: a literal number
// fails the moment a tool is added, reporting a stale test as a broken server
// and giving a genuinely unreachable tool nowhere to show up distinctly. What
// this actually proves is that every REGISTERED tool is reachable over stdio.
const registered = (readFileSync("src/server.ts", "utf8").match(/server\.registerTool\(/g) ?? []).length;
check(
  `every registered tool is reachable over stdio (${registered})`,
  registered > 0 && tools.tools.length === registered,
);

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
// The colorVariants list is the DEFAULT roles, not the whole set. Without a
// pattern + an explicit openness note, an agent read the 8 literal names as
// exhaustive and refused to write `btn-brand` — with the preamble's "never
// invent a color" rule reinforcing exactly the wrong conclusion.
check("CSS entry gives an open-set color pattern", cssButton.colorPattern === "btn-<color>");
check("CSS entry says the color set is open", /not the whole set/i.test(cssButton.colorNote ?? ""));
// The three families whose color selector is NOT `<root>-<color>` — a consumer
// that assumes the uniform shape writes dead classes for these.
const nonUniform = [
  ["Chat", "chat-bubble-<color>"],
  ["pin-input", "pin-input-cell-<color>"],
  ["Toast", 'toast[data-type="<color>"]'],
];
for (const [name, pattern] of nonUniform) {
  const entry = JSON.parse(
    text(await client.callTool({ name: "get_component", arguments: { name, package: "@wizeworks/silicaui" } })),
  );
  check(`${name} reports its non-uniform color pattern`, entry.colorPattern === pattern);
}
// Field's `field-error` is a VALIDATION part that merely looks like a color
// variant; the old heuristic advertised Field as colorable-but-only-in-error.
const cssField = JSON.parse(
  text(await client.callTool({ name: "get_component", arguments: { name: "Field", package: "@wizeworks/silicaui" } })),
);
check("Field is not advertised as colorable", cssField.colorPattern === undefined);
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
// "How do I add a `brand` color?" was unanswerable from MCP data alone.
check("get_tokens explains how to register a custom color", /@plugin/.test(tokens.customColors?.howToDeclare ?? ""));
check(
  "get_tokens covers every colorable component",
  tokens.customColors?.componentPatterns?.length === 35 &&
    tokens.customColors.componentPatterns.includes("badge-<color>"),
);
check("get_tokens documents the auto-derived -content ink", /auto-derive/i.test(tokens.customColors?.contentNote ?? ""));
// The concept has no literal name to match, so it needed its own search entry.
const brandHits = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "brand" } })));
check("search_docs surfaces custom colors for 'brand'", brandHits.some((r) => r.kind === "concept"));
const customHits = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "custom color" } })));
check("search_docs surfaces custom colors for 'custom color'", customHits.some((r) => r.kind === "concept"));

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

// ── the email document schema ───────────────────────────────────────────────
// A separate surface from the three paths, and the one with no other source of
// truth an agent could fall back on: an invented kind or an illegal nesting is
// dropped by the engine SILENTLY. These assert the catalog is actually derived
// from the engine rather than describing it — the failure mode being a matrix
// that reads plausibly and disagrees with what `insert` accepts.
const emailNodes = JSON.parse(text(await client.callTool({ name: "list_email_nodes", arguments: {} })));
const kindNames = new Set(emailNodes.kinds.map((k) => k.kind));
// Compare against the schema's own EmailNode union rather than a hardcoded
// count — same anti-drift reasoning as the BehaviorType check above.
const schemaKinds = new Set(
  [...readFileSync("../silicaui-builder/src/email/schema.ts", "utf8").matchAll(/^\s+kind: "([a-z]+)";$/gm)].map(
    (m) => m[1],
  ),
);
const missingKinds = [...schemaKinds].filter((k) => !kindNames.has(k));
check(
  `list_email_nodes returns every kind in the schema (${schemaKinds.size})`,
  schemaKinds.size > 0 && missingKinds.length === 0,
);
if (missingKinds.length) console.log(`      missingKinds: ${missingKinds.join(", ")}`);
check(
  "nesting rules come from the engine: a section holds content, a columns row holds only columns",
  emailNodes.kinds.find((k) => k.kind === "section")?.holds.includes("text") &&
    emailNodes.kinds.find((k) => k.kind === "columns")?.holds.join() === "column",
);
check(
  "a link group holds content but never another link (nested anchors)",
  emailNodes.kinds.find((k) => k.kind === "link")?.holds.includes("image") &&
    !emailNodes.kinds.find((k) => k.kind === "link")?.holds.includes("link"),
);
check(
  "palette presets resolve to a real kind",
  emailNodes.palette.length > 0 && emailNodes.palette.every((p) => kindNames.has(p.kind)),
);

const linkNode = JSON.parse(text(await client.callTool({ name: "get_email_node", arguments: { kind: "link" } })));
check(
  "get_email_node returns real typed fields with their source docs",
  linkNode.fields.some((f) => f.name === "href" && f.type === "string" && f.doc.length > 0),
);
check("get_email_node returns the shared BaseNode fields once", linkNode.sharedFields.some((f) => f.name === "data"));
check(
  "get_email_node returns the bind contract (which attr, and the default)",
  linkNode.binding?.default === "href" && "href" in linkNode.binding.fields,
);
check(
  "get_email_node reports where the kind may be placed",
  linkNode.allowedParents.includes("section") && linkNode.allowedParents.includes("column"),
);

const badKind = await client.callTool({ name: "get_email_node", arguments: { kind: "carousel" } });
check("get_email_node reports isError for a kind that doesn't exist", badKind.isError === true);

check(
  "list_email_nodes carries the document envelope, not just the nodes",
  emailNodes.documentTypes?.some((t) => t.typeName === "EmailDocument" && t.fields.some((f) => f.name === "subject")),
);

const fieldSearch = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "thumbnail" } })));
check("search_docs reaches email node fields", fieldSearch.some((r) => r.kind === "email-node" && r.node === "video"));

const envelopeSearch = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "preheader" } })));
check(
  "search_docs reaches the document envelope too",
  envelopeSearch.some((r) => r.kind === "email-type" && r.typeName === "EmailDocument"),
);

// ── the node-tree (path 3) schema ───────────────────────────────────────────
// The catalog used to answer "what can I put in a silica tree" and nothing at
// all about the tree's own shape — so the data-binding vocabulary, which is how
// a generated document draws live content, existed in the source and in two
// hand-written docs and NOWHERE an agent could look it up. These checks are
// less about the tool answering and more about it staying TRUE: the union is
// re-read from silicaui-html's source and compared field by field, so adding a
// binding option and forgetting the catalog fails here instead of shipping a
// server that quietly describes last release's schema.
const nodeSchema = JSON.parse(text(await client.callTool({ name: "get_node_schema", arguments: {} })));
check(
  "get_node_schema returns all four node kinds",
  ["element", "component", "outlet", "host"].every((k) => nodeSchema.kinds.some((n) => n.kind === k)),
);
check(
  "...and says which of them carry the shared metadata band (an outlet does not)",
  nodeSchema.kinds.find((k) => k.kind === "element")?.sharedFields === true &&
    nodeSchema.kinds.find((k) => k.kind === "outlet")?.sharedFields === false,
);
check(
  "...and the shared band names the typed system metadata, not just ids",
  ["data", "slot", "behavior", "part", "locked"].every((f) => nodeSchema.nodeBase.some((m) => m.name === f)),
);

// The load-bearing one: the REAL union, re-parsed, versus what we publish.
const bindingSource = new Map(
  [
    ...readFileSync("../silicaui-html/src/schema.ts", "utf8").matchAll(/\|\s*\{\s*kind:\s*"(\w+)";([^}]*)\}/g),
  ].map(([, kind, body]) => [kind, [...body.matchAll(/(\w+)\??:/g)].map((m) => m[1]).sort().join(",")]),
);
check(
  `every DataBinding kind in the source is published (${bindingSource.size})`,
  bindingSource.size >= 5 && [...bindingSource.keys()].every((k) => nodeSchema.dataBindings.some((b) => b.kind === k)),
);
check(
  "...with the exact field set the source declares, on every one of them",
  nodeSchema.dataBindings.every(
    (b) => b.fields.map((f) => f.name).sort().join(",") === bindingSource.get(b.kind),
  ),
);
check(
  "...and each one carries its real source doc, not a placeholder",
  nodeSchema.dataBindings.every((b) => b.doc.length > 20 && !b.doc.startsWith("//") && !b.doc.startsWith("*")),
);
check(
  "the resolution contract carries the unknown-vs-empty rule the hooks depend on",
  /undefined/.test(nodeSchema.resolution.honesty) &&
    nodeSchema.resolution.host.some((m) => m.name === "resolveCollection") &&
    nodeSchema.resolution.resolved.some((m) => m.name === "visible"),
);
check(
  "the element floor is the real allowlist, with per-tag attrs",
  nodeSchema.elementFloor.tags.length > 50 &&
    nodeSchema.elementFloor.tags.find((t) => t.tag === "img")?.attrs.includes("srcset") &&
    !nodeSchema.elementFloor.tags.some((t) => t.tag === "iframe"),
);

const sectioned = JSON.parse(
  text(await client.callTool({ name: "get_node_schema", arguments: { section: "bindings" } })),
);
check(
  "get_node_schema(section) narrows the answer",
  sectioned.dataBindings.length === nodeSchema.dataBindings.length && sectioned.elementFloor === undefined,
);

// The concrete regression that prompted all of this: a per-instance `limit` was
// added to a collection binding and the catalog said nothing about it, so an
// agent reading this server would have kept authoring uncapped repeats.
const limitSearch = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "limit" } })));
check(
  "search_docs reaches the binding vocabulary (the gap that started this)",
  limitSearch.some((r) => r.kind === "data-binding" && r.binding === "collection"),
);
const attrSearch = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "srcset" } })));
check(
  "search_docs reaches an allowlisted attribute by name",
  attrSearch.some((r) => r.kind === "element-tag" && r.tag === "img"),
);

await client.close();

console.log(failures === 0 ? "\n✅ all checks passed\n" : `\n❌ ${failures} check(s) failed\n`);
process.exit(failures ? 1 : 0);
