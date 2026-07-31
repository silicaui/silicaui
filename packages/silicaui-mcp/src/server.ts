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

/**
 * The version this catalog documents, read from our OWN package.json at
 * startup rather than baked into the generated catalog.
 *
 * Every package in the family is released in lockstep — they're all listed in
 * `fixed` in .changeset/config.json, so their versions are identical by
 * construction — which makes our own version the right answer for all of them.
 *
 * This used to be snapshotted into `packages.json` at catalog-generation time,
 * but `gen` isn't part of `build` or the release, so the number froze at
 * whichever version happened to be current the last time someone ran it by
 * hand, and the server reported 0.26.0 while npm served 0.29.0. Reading it at
 * runtime makes that drift structurally impossible instead of a step someone
 * has to remember.
 */
function readOwnVersion(): string {
  // `here` is dist/ in a build and src/ in dev; package.json sits one level up
  // from both, and npm always includes it in the published tarball.
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(here, "..", "package.json"), "utf8"),
    ) as { version?: unknown };
    if (typeof pkg.version === "string" && pkg.version) return pkg.version;
    console.error(
      "[silicaui-mcp] package.json has no usable `version`; reporting 'unknown'.",
    );
  } catch (err) {
    console.error(
      `[silicaui-mcp] could not read own package.json (${(err as Error).message}); reporting 'unknown'.`,
    );
  }
  return "unknown";
}

const VERSION = readOwnVersion();

interface PackageMeta {
  name: string;
  purpose: string;
  install: string | null;
  private?: boolean;
}

interface TokensData {
  semanticColors: string[];
  /** How an app registers extra color roles, and everything one reaches once declared. */
  customColors: {
    summary: string;
    howToDeclare: string;
    declareNote: string;
    contentNote: string;
    utilities: string[];
    componentPatterns: string[];
    componentPatternsNote: string;
    builderNote: string;
  };
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

/**
 * The routing preamble every connecting client receives from `initialize`,
 * before it calls a single tool.
 *
 * Silica ships one design system through three delivery paths, and the choice
 * between them is made BEFORE any tool call — by which point per-tool
 * descriptions are too late to help. Without this, an agent got ten tools in a
 * bag and inferred the architecture from their names; the standard failure was
 * reaching for `@wizeworks/silicaui-react` while emitting non-React output, or
 * shipping node-tree markup with no behavior runtime and wondering why nothing
 * opened.
 *
 * Deliberately names no counts and no version — those drift. Package names are
 * asserted against the real catalog by verify.mjs.
 */
const INSTRUCTIONS = `Silica UI is ONE design system delivered through THREE paths. Decide which path matches the code you are writing BEFORE writing any markup — the paths share a class vocabulary but are not interchangeable, and mixing them is the most common way an integration breaks.

1. CSS — \`@wizeworks/silicaui\`
   A Tailwind v4 plugin. You write plain HTML and put Silica's classes on it: \`<button class="btn btn-primary">\`. No JavaScript ships, so nothing is interactive — a dialog styled this way will not open. Use it for static markup, server-rendered templates (Rails, Django, PHP, Go, …), email, or any framework at all. It is the floor the other two paths stand on.
   → get_component(name, package "@wizeworks/silicaui") for a family's root class, its parts, and its color variants; list_classes for the literal names.

2. React — \`@wizeworks/silicaui-react\`
   Typed React components over those same classes, with Base UI supplying real behavior and accessibility: \`<Button color="primary" size="lg">\`. Use it whenever the output is React or Next.js.
   → get_component(name, package "@wizeworks/silicaui-react") for real props (extracted from the TypeScript source) and a working usage example.

3. HTML / node-tree — \`@wizeworks/silicaui-html\` + \`@wizeworks/silicaui-behaviors\`
   A framework-neutral node-tree schema that projects to HTML — for generated or user-authored documents: site builders, CMS output, static export. Component macros expand to element subtrees carrying \`data-sui-*\` markers, which the zero-dependency \`@wizeworks/silicaui-behaviors\` runtime hydrates at load. That runtime is what makes path 3 interactive; without it you have path 1.
   → get_node_schema FIRST for the tree's own shape: the node kinds, the data-binding vocabulary (how a node draws live content, repeats over a collection, or hides itself), the resolution contract, and the tag/attribute allowlist \`toHtml\` enforces. Then get_component(name, package "@wizeworks/silicaui-html") for the macro; list_blocks / get_block for composed sections; list_behaviors for the marker contract.
   Path 3 fails SILENTLY where the others fail loudly — an unlisted tag becomes a <div>, an unlisted attribute is dropped, an invented binding field is not persisted, and the output still looks plausible. Look it up.

Rules that hold on every path:
- Never invent a class, prop, or block key. Everything this server returns is extracted from Silica's source at release time — look it up rather than guessing, including when you are fairly confident.
- Colors are semantic tokens (get_tokens), never hex — but the eight built-in roles are a DEFAULT, not a closed set. Silica's core promise is that N named colors cascade through everything: an app registers extra roles (get_tokens → customColors for the two-line syntax) and each works everywhere a built-in does, so \`btn-brand\` is exactly as real as \`btn-primary\`. Read a component's \`colorPattern\` (get_component) and substitute the registered name — most are \`<root>-<color>\`, but chat, pin-input and toast are not. A REGISTERED color is the one name you may use that this catalog does not list literally; an unregistered one is still an invention, and renders unstyled.
- Do not re-skin a component with inline styles or arbitrary hex — it defeats theming and light/dark.
- The same name can exist on more than one path with a different shape. get_component with no \`package\` returns every path's answer at once; pass \`package\` to narrow.
- Don't know the name? search_docs first. Unsure what to install? list_packages.

Authoring an EMAIL through \`@wizeworks/silicaui-builder/email\`? That is a separate surface, not a fourth path: a CLOSED document schema of typed nodes that projects to table-based inline-styled HTML. Its kinds, fields, and nesting rules are enforced — an invented kind or an illegal nesting is dropped silently, with no error to read — so call list_email_nodes / get_email_node rather than reasoning from the paths above. Classes and components do not apply there; colors are literal hex.

Signs you are on the wrong path: importing @wizeworks/silicaui-react into output that is not React; hand-writing \`data-sui-*\` markers (they come from macro expansion, never from you); shipping path-3 markup without loading @wizeworks/silicaui-behaviors; expecting path 1 alone to open a dialog.`;

interface ComponentData {
  name: string;
  package: string;
  category: string;
  sourceFile: string;
  /** silicaui-react entries: extracted from source via TS AST. silicaui-html
   *  macros carry no static description (never hand-authored — see label/icon
   *  instead) and omit these two fields. */
  description?: string;
  props?: PropsInterface[];
  usageExample?: string | null;
  /** silicaui-html macros only: palette label/icon, whether it's a container,
   *  and the BehaviorType(s) its expansion carries (found by actually calling
   *  expand(), not guessed — see get_behavior for the marker contract). */
  label?: string;
  icon?: string;
  container?: boolean;
  behaviors?: string[];
  /** silicaui (CSS) entries only: the family's root class (null when it has
   *  none — see familyPrefix/rootNote), every literal class it generates, its
   *  color variants, and any compound selector that reveals required structure. */
  root?: string | null;
  familyPrefix?: string;
  rootNote?: string;
  classes?: string[];
  colorVariants?: string[];
  /** Selector template for the color axis, e.g. `btn-<color>` — substitute any registered color. */
  colorPattern?: string;
  colorNote?: string;
  compoundSelectors?: string[];
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

interface EmailFieldData {
  name: string;
  optional: boolean;
  type: string;
  doc: string;
}

interface EmailKindData {
  kind: string;
  typeName: string;
  doc: string;
  isContent: boolean;
  container: boolean;
  holds: string[];
  allowedParents: string[];
  fields: EmailFieldData[];
  binding: { default?: string; fields: Record<string, string> } | null;
  sourceFile: string;
}

interface EmailData {
  entrypoint: string;
  reactEntrypoint: string;
  note: string;
  sharedFields: EmailFieldData[];
  bindingNote: string;
  /** The envelope around the node tree — EmailDocument/EmailProject/
   *  EmailColorDefaults and friends. A kind list alone can't answer "what do I
   *  wrap this in". */
  documentTypes: Array<{ typeName: string; doc: string; fields: EmailFieldData[] }>;
  kinds: EmailKindData[];
  palette: Array<{ key: string; label: string; hint: string; icon: string; kind: string }>;
}

interface FieldData {
  name: string;
  optional: boolean;
  type: string;
  doc: string;
}

/** Path 3's DOCUMENT schema — the node tree itself, as opposed to what you put
 *  in it. Generated from silicaui-html's own source; see gen-catalog's
 *  schema.json section for why each part is extracted rather than described. */
interface SchemaData {
  entrypoint: string;
  behaviorRuntime: string;
  sourceFile: string;
  note: string;
  child: string;
  nodeBase: FieldData[];
  kinds: Array<{ kind: string; typeName: string; doc: string; sharedFields: boolean; fields: FieldData[] }>;
  bindingNote: string;
  dataBindings: Array<{ kind: string; doc: string; fields: Array<{ name: string; optional: boolean; type: string }> }>;
  resolution: {
    note: string;
    honesty: string;
    host: FieldData[];
    resolved: FieldData[];
    scope: FieldData[];
    options: FieldData[];
    diagnostic: FieldData[];
  };
  elementFloor: {
    note: string;
    globalAttrs: string[];
    tags: Array<{ tag: string; group: string; void: boolean; attrs: string[] }>;
  };
}

const packages = loadJson<PackageMeta[]>("packages");
const tokens = loadJson<TokensData>("tokens");
const classesByComponent = loadJson<Record<string, string[]>>("classes");
const blocks = loadJson<BlockData[]>("blocks");
const behaviors = loadJson<BehaviorData[]>("behaviors");
const components = loadJson<ComponentData[]>("components");
const email = loadJson<EmailData>("email");
const schema = loadJson<SchemaData>("schema");

/** CSS → React → HTML: the order the instructions introduce the paths in, so a
 *  multi-path get_component answer reads the same way every time. Packages not
 *  listed (the wrappers) sort last via indexOf's -1... which sorts them FIRST,
 *  so map those to a large index instead. */
const PATH_ORDER_LIST = [
  "@wizeworks/silicaui",
  "@wizeworks/silicaui-react",
  "@wizeworks/silicaui-html",
];
const PATH_ORDER = {
  indexOf(pkg: string): number {
    const i = PATH_ORDER_LIST.indexOf(pkg);
    return i === -1 ? PATH_ORDER_LIST.length : i;
  },
};

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
  const server = new McpServer(
    {
      name: "@wizeworks/silicaui-mcp",
      version: VERSION,
    },
    { instructions: INSTRUCTIONS },
  );

  server.registerTool(
    "list_packages",
    {
      title: "List Silica UI packages",
      description:
        "List every package in the Silica UI family (@wizeworks/silicaui, @wizeworks/silicaui-react, @wizeworks/silicaui-html, @wizeworks/silicaui-behaviors, and the wrapper packages), with purpose, install command, and version.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text",
          // Version is stamped here, not stored in the catalog — see VERSION.
          text: JSON.stringify(
            packages.map((p) => ({ ...p, version: VERSION })),
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerTool(
    "list_components",
    {
      title: "List Silica UI components",
      description:
        "List component names, categories, and source packages — spans ALL THREE delivery paths: @wizeworks/silicaui (CSS class families for plain HTML), @wizeworks/silicaui-react (typed React components), and @wizeworks/silicaui-html (framework-neutral ComponentDef macros for generated/non-React output). The same component usually exists on more than one path with a completely different shape; get_component returns every path's answer unless you pass a package. Filter here with the package param (e.g. '@wizeworks/silicaui', '@wizeworks/silicaui-react', '@wizeworks/silicaui-html', '@wizeworks/silicaui-charts').",
      inputSchema: {
        package: z.string().optional().describe("Filter to one package name, e.g. '@wizeworks/silicaui-react'."),
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
      title: "Get a Silica UI component's real shape",
      description:
        "Get a component's real definition on whichever delivery path you're building on — for @wizeworks/silicaui (CSS): the family's root class, every literal class it generates, its color variants, and any compound selector that reveals required markup structure; for @wizeworks/silicaui-react: props (name, type, optional, doc — extracted from its actual TypeScript source) plus a real, working usage example; for @wizeworks/silicaui-html: its palette category/label/icon, whether it's a container, and the BehaviorType(s) it carries (cross-reference get_behavior for the marker contract). Use this instead of guessing class names, prop names, or shapes. Omit package to see every path's answer side by side; pass it to get just one.",
      inputSchema: {
        name: z.string().describe("Component name, e.g. 'Button', 'DataTable', 'Dialog'."),
        package: z.string().optional().describe("Disambiguate when the name exists in more than one package, e.g. '@wizeworks/silicaui-html'."),
      },
    },
    async ({ name, package: pkg }) => {
      let matches = components.filter((c) => c.name.toLowerCase() === name.toLowerCase());
      if (pkg) matches = matches.filter((c) => c.package === pkg);
      if (!matches.length) {
        return {
          content: [
            {
              type: "text",
              text: `No component named "${name}"${pkg ? ` in ${pkg}` : ""}. Call list_components to see valid names.`,
            },
          ],
          isError: true,
        };
      }
      // A name on more than one path used to be an isError telling the caller
      // to pick a package — which costs a round trip and, worse, asks for a
      // choice the caller can't make yet: it doesn't know how the shapes
      // differ, which is the very thing it's asking about. Returning all of
      // them answers the question AND demonstrates the three paths at the one
      // moment the distinction actually matters.
      if (matches.length > 1) {
        const ordered = [...matches].sort(
          (a, b) => PATH_ORDER.indexOf(a.package) - PATH_ORDER.indexOf(b.package),
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  name: ordered[0]?.name ?? name,
                  note:
                    `"${name}" exists on ${ordered.length} delivery paths, listed below with their real (different) shapes: ` +
                    `${ordered.map((c) => c.package).join(", ")}. Use the one matching the code you're writing — ` +
                    `they are not interchangeable. Pass \`package\` to get just one.`,
                  paths: ordered,
                },
                null,
                2,
              ),
            },
          ],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(matches[0], null, 2) }] };
    },
  );

  server.registerTool(
    "list_classes",
    {
      title: "List real Silica UI CSS class names",
      description:
        "List the exact, literal CSS class names Silica UI generates for a core component (e.g. 'button', 'card', 'badge') — or all components if none given. These are extracted directly from the class generators, so they are never hallucinated. Also covers 'color-utilities' (text-*/bg-*/border-* for every declared color). This returns a flat list; for the CSS path's STRUCTURE — which class is the root, which are its parts, which are color variants — call get_component with package '@wizeworks/silicaui'.",
      inputSchema: {
        component: z
          .string()
          .optional()
          .describe("A core @wizeworks/silicaui component name, e.g. 'button'. Omit to list every component's classes."),
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
        "Get the semantic color list and their light/dark OKLCH values, the typography token model, and the scalar theme tokens (radius/border/depth/noise/focus/disabled-opacity) with defaults, ranges, and what each one actually affects. Also returns `customColors`: how to register extra color roles beyond the built-in eight, and the selector pattern for every component a registered color reaches — call this before concluding a color like `brand` is unavailable.",
      inputSchema: {},
    },
    async () => ({ content: [{ type: "text", text: JSON.stringify(tokens, null, 2) }] }),
  );

  server.registerTool(
    "list_blocks",
    {
      title: "List Silica UI composed blocks",
      description:
        "List composed page blocks from @wizeworks/silicaui-html (hero sections, FAQs, feature grids, …) without their full node tree. Optionally filter by category or tag.",
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
        "List the closed set of interactive behaviors that @wizeworks/silicaui-behaviors hydrates from data-sui-* markers (the vanilla-JS runtime for non-React output). Each type is also the BehaviorType a @wizeworks/silicaui-html ComponentDef macro carries — cross-reference with get_component. Call this to see the current set rather than assuming a fixed list; it grows over time.",
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
    "list_email_nodes",
    {
      title: "List the email builder's node kinds",
      description:
        "List every node kind an email document can contain (@wizeworks/silicaui-builder/email) with its nesting rules — what each kind may HOLD and which kinds may hold IT — plus the insertable palette presets. This schema is CLOSED and enforced: `EmailEditor.insert` returns undefined for an illegal kind or nesting, silently, so check here rather than assuming a site/HTML structure carries over. Email nodes carry typed fields, not classes, and literal hex colors, not tokens. Call get_email_node for one kind's real fields.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              entrypoint: email.entrypoint,
              reactEntrypoint: email.reactEntrypoint,
              note: email.note,
              bindingNote: email.bindingNote,
              kinds: email.kinds.map(({ kind, typeName, isContent, container, holds, allowedParents, binding }) => ({
                kind,
                typeName,
                isContent,
                container,
                holds,
                allowedParents,
                bindableFields: binding ? Object.keys(binding.fields) : [],
                defaultBindTarget: binding?.default ?? null,
              })),
              palette: email.palette,
              // The envelope, in full: it's small, and a caller that has the
              // kinds but not `EmailDocument` still can't produce a document.
              documentTypes: email.documentTypes,
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerTool(
    "get_email_node",
    {
      title: "Get an email node kind's real fields",
      description:
        "Get one email node kind's full definition: every typed field with its TypeScript type, whether it's optional, and its source doc comment; the fields shared by every node (id/ord/data/locked); its nesting rules; and its data-binding contract — which `attr` a `value` bind may target and which one a bind with no `attr` fills. Use this instead of guessing field names: an unknown field is dropped by the engine and an unknown bind target is inert, neither with an error.",
      inputSchema: {
        kind: z.string().describe("Node kind, e.g. 'link', 'image', 'section'. See list_email_nodes."),
      },
    },
    async ({ kind }) => {
      const node = email.kinds.find((k) => k.kind === kind.toLowerCase());
      if (!node) {
        return {
          content: [
            {
              type: "text",
              text: `No email node kind "${kind}". Known kinds: ${email.kinds.map((k) => k.kind).join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...node,
                sharedFields: email.sharedFields,
                bindingNote: email.bindingNote,
                palette: email.palette.filter((p) => p.kind === node.kind),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_node_schema",
    {
      title: "Get the Silica UI node-tree schema (path 3)",
      description:
        "Get the DOCUMENT schema for @wizeworks/silicaui-html — the shape of the tree itself, as opposed to what you put in it. Covers the four node kinds and their fields, the typed system-metadata band every node carries (data / slot / behavior / part / locked / instanceOf), the DATA-BINDING vocabulary with every field, the resolution contract a host implements, and the raw-element/attribute allowlist `toHtml` enforces. Call this before authoring or generating a node tree: the failures here are SILENT — an unlisted tag is downgraded to <div>, an unlisted attribute is dropped, an invented binding field is not persisted — so none of it can be inferred from output that looks like it worked. Not needed for path 1 (CSS classes on your own HTML) or path 2 (React).",
      inputSchema: {
        section: z
          .enum(["all", "nodes", "bindings", "resolution", "elements"])
          .optional()
          .describe(
            "Narrow the answer: 'nodes' (kinds + the shared metadata band), 'bindings' (the data vocabulary), 'resolution' (the host hooks and their honesty contract), 'elements' (the tag/attribute floor). Omit for everything.",
          ),
      },
    },
    async ({ section }) => {
      const head = {
        entrypoint: schema.entrypoint,
        behaviorRuntime: schema.behaviorRuntime,
        sourceFile: schema.sourceFile,
        note: schema.note,
      };
      const sections: Record<string, unknown> = {
        nodes: { child: schema.child, nodeBase: schema.nodeBase, kinds: schema.kinds },
        bindings: { bindingNote: schema.bindingNote, dataBindings: schema.dataBindings },
        resolution: schema.resolution,
        elements: schema.elementFloor,
      };
      const body =
        !section || section === "all"
          ? { ...sections.nodes as object, ...sections.bindings as object, resolution: schema.resolution, elementFloor: schema.elementFloor }
          : sections[section];
      return { content: [{ type: "text", text: JSON.stringify({ ...head, ...(body as object) }, null, 2) }] };
    },
  );

  server.registerTool(
    "search_docs",
    {
      title: "Search Silica UI catalog data",
      description:
        "Full-text search across everything this server knows: component names/descriptions, block names/descriptions, behavior descriptions, literal CSS class names, design tokens, and the email builder's node kinds + their fields. Use this when you don't know the exact name to look up.",
      inputSchema: {
        query: z.string().describe("Search term, case-insensitive."),
      },
    },
    async ({ query }) => {
      const q = query.toLowerCase();
      const matchedComponents = components
        .filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q) || (c.label ?? "").toLowerCase().includes(q))
        .map((c) => ({ kind: "component", name: c.name, package: c.package }));
      const matchedBlocks = blocks
        .filter((b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
        .map((b) => ({ kind: "block", key: b.key, name: b.name }));
      const matchedBehaviors = behaviors
        .filter((b) => b.type.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
        .map((b) => ({ kind: "behavior", type: b.type }));
      const matchedClasses = Object.entries(classesByComponent).flatMap(([component, classes]) =>
        classes
          .filter((cls) => cls.toLowerCase().includes(q))
          .map((cls) => ({ kind: "class" as const, component, class: cls })),
      );
      const matchedTokens = tokens.semanticColors
        .filter((name) => name.toLowerCase().includes(q))
        .map((name) => ({ kind: "token" as const, name }));
      // Custom colors are a CONCEPT, not a literal name, so nothing above could
      // ever match them: "brand", "custom color", "register" and "@plugin" all
      // returned empty and an agent reasonably concluded the 8 semantic roles
      // were the whole set — then refused to write `badge-brand`. Same failure
      // mode the data-binding entry below was added for.
      const COLOR_CONCEPT = [
        "custom color",
        "custom colors",
        "color role",
        "n-color",
        "brand",
        "register",
        "registered",
        "declare",
        "@plugin",
        "plugin",
        "@theme",
        "palette",
        "extra color",
        "new color",
      ];
      const matchedColorConcept = COLOR_CONCEPT.some((k) => k.includes(q) || q.includes(k))
        ? [
            {
              kind: "concept" as const,
              name: "custom colors (N-color)",
              summary: tokens.customColors.summary,
              tool: "get_tokens",
              field: "customColors",
            },
          ]
        : [];
      // The node-tree vocabulary. Without this, "repeat", "limit", "srcset" and
      // "conditional" found nothing here and an agent concluded the concept did
      // not exist — the exact failure a searchable catalog is meant to prevent.
      const matchedBindings = schema.dataBindings
        .filter(
          (b) =>
            b.kind.toLowerCase().includes(q) ||
            b.doc.toLowerCase().includes(q) ||
            b.fields.some((f) => f.name.toLowerCase().includes(q)),
        )
        .map((b) => ({ kind: "data-binding" as const, binding: b.kind, tool: "get_node_schema" }));
      const matchedNodeKinds = schema.kinds
        .filter((k) => k.kind.toLowerCase().includes(q) || k.typeName.toLowerCase().includes(q) || k.doc.toLowerCase().includes(q))
        .map((k) => ({ kind: "node-kind" as const, node: k.kind, tool: "get_node_schema" }));
      const matchedTags = schema.elementFloor.tags
        .filter((t) => t.tag.toLowerCase() === q || t.attrs.some((a) => a.toLowerCase() === q))
        .map((t) => ({ kind: "element-tag" as const, tag: t.tag, group: t.group, tool: "get_node_schema" }));
      // Email node kinds match on their own name, their doc, or any field they
      // declare — "href" should find the `link` group even though no component
      // or class is called that.
      const matchedEmail = email.kinds
        .filter(
          (k) =>
            k.kind.includes(q) ||
            k.typeName.toLowerCase().includes(q) ||
            k.doc.toLowerCase().includes(q) ||
            k.fields.some((f) => f.name.toLowerCase().includes(q)),
        )
        .map((k) => ({ kind: "email-node" as const, node: k.kind, typeName: k.typeName }));
      const matchedEmailTypes = email.documentTypes
        .filter(
          (t) =>
            t.typeName.toLowerCase().includes(q) ||
            t.doc.toLowerCase().includes(q) ||
            t.fields.some((f) => f.name.toLowerCase().includes(q)),
        )
        .map((t) => ({ kind: "email-type" as const, typeName: t.typeName }));
      const results = [
        ...matchedComponents,
        ...matchedBlocks,
        ...matchedBehaviors,
        ...matchedClasses,
        ...matchedTokens,
        ...matchedColorConcept,
        ...matchedBindings,
        ...matchedNodeKinds,
        ...matchedTags,
        ...matchedEmail,
        ...matchedEmailTypes,
      ];
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
