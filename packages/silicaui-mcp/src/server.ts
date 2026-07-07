import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(dataDir, `${name}.json`), "utf8")) as T;
}

interface PackageMeta {
  name: string;
  purpose: string;
  install: string | null;
  private?: boolean;
  version: string;
}

interface TokensData {
  semanticColors: string[];
  light: Record<string, string>;
  dark: Record<string, string>;
  typography: { baseFontSize: string; fontFamilyTokens: string[]; note: string };
}

interface PropMember {
  name: string;
  optional: boolean;
  type: string;
  doc: string;
}

interface PropsInterface {
  name: string;
  extends?: string;
  members: PropMember[];
}

interface ComponentData {
  name: string;
  package: string;
  category: string;
  sourceFile: string;
  description: string;
  props: PropsInterface[];
  usageExample: string | null;
}

interface BlockSlot {
  name: string;
  [key: string]: unknown;
}

interface BlockData {
  key: string;
  name: string;
  category: string;
  version: string;
  description: string;
  tags?: string[];
  colors: string[];
  behaviors: string[];
  emailEligible: boolean;
  slots: BlockSlot[];
  root: unknown;
  preview?: unknown;
}

interface BehaviorData {
  type: string;
  description: string;
}

const packages = loadJson<PackageMeta[]>("packages");
const tokens = loadJson<TokensData>("tokens");
const classesByComponent = loadJson<Record<string, string[]>>("classes");
const blocks = loadJson<BlockData[]>("blocks");
const behaviors = loadJson<BehaviorData[]>("behaviors");
const components = loadJson<ComponentData[]>("components");

function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

function blockSummary(b: BlockData) {
  const { root: _root, ...summary } = b;
  return summary;
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "silicaui-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "list_packages",
    {
      title: "List Silica UI packages",
      description:
        "List every package in the Silica UI family (silicaui, silicaui-react, silicaui-html, silicaui-behaviors, and the wrapper packages), with purpose, install command, and version.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(packages, null, 2) }],
    }),
  );

  server.registerTool(
    "list_components",
    {
      title: "List Silica UI components",
      description:
        "List component names, categories, and source packages. Optionally filter to one package (e.g. 'silicaui-react', 'silicaui-charts').",
      inputSchema: {
        package: z.string().optional().describe("Filter to one package name, e.g. 'silicaui-react'."),
      },
    },
    async ({ package: pkg }) => {
      const filtered = pkg ? components.filter((c) => c.package === pkg) : components;
      const summary = filtered.map(({ name, package: p, category, sourceFile }) => ({
        name,
        package: p,
        category,
        sourceFile,
      }));
      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    },
  );

  server.registerTool(
    "get_component",
    {
      title: "Get a Silica UI component's real props and usage example",
      description:
        "Get a component's props (name, type, optional, doc — extracted from its actual TypeScript source) and a real, working usage example pulled from the playground demos. Use this instead of guessing prop names or shapes.",
      inputSchema: {
        name: z.string().describe("Component name, e.g. 'Button', 'DataTable', 'Select'."),
      },
    },
    async ({ name }) => {
      const component = components.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!component) {
        return {
          content: [
            {
              type: "text",
              text: `No component named "${name}". Call list_components to see valid names.`,
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(component, null, 2) }] };
    },
  );

  server.registerTool(
    "list_classes",
    {
      title: "List real Silica UI CSS class names",
      description:
        "List the exact, literal CSS class names Silica UI generates for a core component (e.g. 'button', 'card', 'badge') — or all components if none given. These are extracted directly from the class generators, so they are never hallucinated. Also covers 'color-utilities' (text-*/bg-*/border-* for every declared color).",
      inputSchema: {
        component: z
          .string()
          .optional()
          .describe("A core silicaui component name, e.g. 'button'. Omit to list every component's classes."),
      },
    },
    async ({ component }) => {
      if (!component) {
        return { content: [{ type: "text", text: JSON.stringify(classesByComponent, null, 2) }] };
      }
      const key = toKebab(component);
      const classes = classesByComponent[key];
      if (!classes) {
        return {
          content: [
            {
              type: "text",
              text: `No class data for "${component}". Known components: ${Object.keys(classesByComponent).join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: JSON.stringify({ component: key, classes }, null, 2) }] };
    },
  );

  server.registerTool(
    "get_tokens",
    {
      title: "Get Silica UI design tokens",
      description:
        "Get the semantic color list and their light/dark OKLCH values, plus the typography token model.",
      inputSchema: {},
    },
    async () => ({ content: [{ type: "text", text: JSON.stringify(tokens, null, 2) }] }),
  );

  server.registerTool(
    "list_blocks",
    {
      title: "List Silica UI composed blocks",
      description:
        "List composed page blocks from silicaui-html (hero sections, FAQs, feature grids, …) without their full node tree. Optionally filter by category or tag.",
      inputSchema: {
        category: z.string().optional(),
        tag: z.string().optional(),
      },
    },
    async ({ category, tag }) => {
      const filtered = blocks.filter(
        (b) => (!category || b.category === category) && (!tag || (b.tags ?? []).includes(tag)),
      );
      return { content: [{ type: "text", text: JSON.stringify(filtered.map(blockSummary), null, 2) }] };
    },
  );

  server.registerTool(
    "get_block",
    {
      title: "Get a Silica UI block's full node tree",
      description:
        "Get one composed block's full definition, including its node tree — the real, validated structure to reuse or adapt, not a guess.",
      inputSchema: {
        key: z.string().describe("The block's stable key, e.g. 'hero_split_cta'."),
      },
    },
    async ({ key }) => {
      const block = blocks.find((b) => b.key === key);
      if (!block) {
        return {
          content: [
            {
              type: "text",
              text: `No block "${key}". Known keys: ${blocks.map((b) => b.key).join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(block, null, 2) }] };
    },
  );

  server.registerTool(
    "list_behaviors",
    {
      title: "List Silica UI behavior types",
      description:
        "List the closed set of interactive behaviors (carousel, disclosure, tabs, menu, marquee, scrollspy, counter, dismiss, toc) that silicaui-behaviors hydrates from data-sui-* markers.",
      inputSchema: {},
    },
    async () => ({ content: [{ type: "text", text: JSON.stringify(behaviors, null, 2) }] }),
  );

  server.registerTool(
    "get_behavior",
    {
      title: "Get one Silica UI behavior's contract",
      description: "Get the marker contract and semantics for one behavior type.",
      inputSchema: {
        type: z.string().describe("Behavior type, e.g. 'disclosure'."),
      },
    },
    async ({ type }) => {
      const behavior = behaviors.find((b) => b.type === type);
      if (!behavior) {
        return {
          content: [
            {
              type: "text",
              text: `No behavior "${type}". Known types: ${behaviors.map((b) => b.type).join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(behavior, null, 2) }] };
    },
  );

  server.registerTool(
    "search_docs",
    {
      title: "Search Silica UI catalog data",
      description:
        "Full-text search over component names/descriptions, block names/descriptions, and behavior descriptions. Use this when you don't know the exact name to look up.",
      inputSchema: {
        query: z.string().describe("Search term, case-insensitive."),
      },
    },
    async ({ query }) => {
      const q = query.toLowerCase();
      const matchedComponents = components
        .filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
        .map((c) => ({ kind: "component", name: c.name, package: c.package }));
      const matchedBlocks = blocks
        .filter((b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
        .map((b) => ({ kind: "block", key: b.key, name: b.name }));
      const matchedBehaviors = behaviors
        .filter((b) => b.type.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
        .map((b) => ({ kind: "behavior", type: b.type }));
      const results = [...matchedComponents, ...matchedBlocks, ...matchedBehaviors];
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    },
  );

  return server;
}

export async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
