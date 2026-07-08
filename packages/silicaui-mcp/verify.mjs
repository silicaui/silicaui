// Runnable proof the server actually answers every tool over real stdio — not
// just that it builds. Run against the built output:
// `pnpm --filter @wizeworks/silicaui-mcp build && node verify.mjs`.
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

const components = JSON.parse(
  text(await client.callTool({ name: "list_components", arguments: { package: "@wizeworks/silicaui-react" } })),
);
check("list_components filters by package", components.length > 0 && components.every((c) => c.package === "@wizeworks/silicaui-react"));

const button = JSON.parse(text(await client.callTool({ name: "get_component", arguments: { name: "Button" } })));
check("get_component returns real props", button.props[0]?.members?.some((m) => m.name === "variant"));
check("get_component returns a usage example", typeof button.usageExample === "string" && button.usageExample.length > 0);

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
check("list_behaviors returns 11 types", behaviors.length === 11);

const behavior = JSON.parse(text(await client.callTool({ name: "get_behavior", arguments: { type: "disclosure" } })));
check("get_behavior returns a description", behavior.description.includes("trigger"));

const search = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "accordion" } })));
check("search_docs finds cross-domain matches", search.some((r) => r.kind === "block") || search.some((r) => r.kind === "behavior"));

const classSearch = JSON.parse(text(await client.callTool({ name: "search_docs", arguments: { query: "soft" } })));
check("search_docs finds literal class names", classSearch.some((r) => r.kind === "class" && r.class === "bg-soft"));

await client.close();

console.log(failures === 0 ? "\n✅ all checks passed\n" : `\n❌ ${failures} check(s) failed\n`);
process.exit(failures ? 1 : 0);
