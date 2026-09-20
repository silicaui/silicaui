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
- A different PALETTE is a theme, applied as \`data-theme="<name>"\` on an element — never restyled components, a second stylesheet, or hex. Everything inside resolves against that theme's tokens, so nesting it themes one section (\`<section data-theme="dark">\`) and putting it on <html> themes the page. Dark mode is just \`data-theme="dark"\`; there is no \`.dark\` class. list_themes for the mechanism and the shipped presets, get_theme for one's resolved tokens.
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
  /** The host contract: the resolve hooks, the unknown-vs-empty honesty rule,
   *  and — separately from `bindingNote`'s `data` markers — how inline
   *  `{{ref}}` merge tokens resolve in prose fields. */
  resolution: {
    note: string;
    honesty: string;
    tokens: string;
    host: FieldData[];
    bindableFields: Record<string, { default?: string; fields: Record<string, string> }>;
  };
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

/** One shipped theme preset, with both modes already RESOLVED (dark deltas
 *  merged, `-content` inks derived) — the map a browser actually computes, not
 *  the authored bag. */
interface ThemePreset {
  name: string;
  character: string;
  /** The literal attribute to write, e.g. `data-theme="midnight"`. */
  applyAs: string;
  mode: string;
  roles: string[];
  fonts: { sans?: unknown; head?: unknown } | null;
  shape: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
  contrastWarnings: { light: Array<{ role: string; ratio: number }>; dark: Array<{ role: string; ratio: number }> };
}

/** The THEME layer: the `data-theme` mechanism, how an app declares its own,
 *  the runtime `Theme` object a host stores, and the shipped presets. */
interface ThemesData {
  note: string;
  mechanism: {
    attribute: string;
    selectors: string[];
    builtIn: string[];
    builtInNote: string;
    apply: string;
    paints: string[];
    paintsNote: string;
    darkMode: string;
    presetModes: string;
    contentInk: string;
    never: string;
  };
  declaring: Record<string, unknown>;
  themeObject: Record<string, unknown>;
  presets: ThemePreset[];
}

const packages = loadJson<PackageMeta[]>("packages");
const tokens = loadJson<TokensData>("tokens");
const themes = loadJson<ThemesData>("themes");
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
        "Get the semantic color list and the DEFAULT theme's light/dark OKLCH values, the typography token model, and the scalar theme tokens (radius/border/depth/noise/focus/disabled-opacity) with defaults, ranges, and what each one actually affects. Also returns `customColors` (how to register extra color roles beyond the built-in eight, and the selector pattern for every component a registered color reaches — call this before concluding a color like `brand` is unavailable) and `theming` (the `data-theme` mechanism these values are ACTIVATED by, including dark mode and per-section theme islands). For a different palette you want a THEME, not different values here: list_themes / get_theme.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text",
          // The token values alone never said how either map is turned ON, so
          // `data-theme` — the whole mechanism — was unreachable from the tool
          // an agent calls when it asks about color. Spliced in here rather
          // than left to a tool it has no reason to discover.
          text: JSON.stringify(
            {
              ...tokens,
              theming: {
                note: themes.note,
                ...themes.mechanism,
                declaring: themes.declaring,
                themeObject: themes.themeObject,
              },
              presets: {
                count: themes.presets.length,
                names: themes.presets.map((p) => p.name),
                note: "Considered, shipped themes — call list_themes for what each one is, get_theme for its resolved tokens. `light`/`dark` above are the DEFAULT theme (quartz); every preset re-points the same token names.",
              },
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  /**
   * A preset is a TOKEN BAG, not a stylesheet. Nothing here emits it, and the
   * Tailwind plugin emits only `light` and `dark`, so `data-theme="marble"` on a
   * page built with the CSS plugin alone matches the bare `[data-theme]` rule,
   * resolves every token to the default, and renders a page that looks fine.
   *
   * Both theme tools used to say `applyAs: data-theme="marble"` and then, in
   * `get_theme`, "do not paste these values into CSS" — which together guarantee
   * that outcome for anyone not on React or the node tree. A Django developer
   * followed exactly those two sentences and got the default palette with no
   * warning anywhere. See docs/personas/issues/030.
   *
   * One constant, read by BOTH tools, because the previous split is how the two
   * halves of the instruction drifted apart in the first place.
   */
  const EMITTED_BY_NOTE =
    'A preset is a token bag; something has to EMIT it. The Tailwind plugin `@wizeworks/silicaui` emits only `[data-theme="light"]` and `[data-theme="dark"]` — no preset name. ' +
    'Putting `data-theme="marble"` on a page that never emitted marble is silent: it matches the bare `[data-theme]` rule, every token resolves to the default, and the page renders with no error. ' +
    'On the CSS path, emit it yourself from the token map this tool returns: `@plugin "@wizeworks/silicaui/theme" { name: marble; color-scheme: light; --color-primary: …; }`, loaded after the main plugin. ' +
    "On the React and node-tree paths the host emits it for you (two `themeTokenCss` calls, one per mode).";

  server.registerTool(
    "list_themes",
    {
      title: "List Silica UI themes and the data-theme mechanism",
      description:
        "List every shipped theme preset — name, what it's for, its type faces and shape — plus the `data-theme` mechanism itself: how a theme is applied, how dark mode works (there is no `.dark` class), and how a section opts into a different palette by nesting the attribute. Call this whenever the answer involves a different palette, a dark section, or theming at all; the alternative an agent reaches for otherwise is hardcoded hex or bespoke CSS, which can never respond to the theme it ends up inside.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              note: themes.note,
              mechanism: themes.mechanism,
              // Summaries only — the resolved token maps are ~25 entries per
              // mode per preset. get_theme returns those for the one you pick.
              themes: themes.presets.map((p) => ({
                name: p.name,
                character: p.character,
                applyAs: p.applyAs,
                fonts: p.fonts,
                shape: p.shape,
                ...(p.contrastWarnings.light.length || p.contrastWarnings.dark.length
                  ? { contrastWarnings: p.contrastWarnings }
                  : {}),
              })),
              emittedBy: EMITTED_BY_NOTE,
              tokensNote: "get_theme(name) returns each preset's full resolved token map for both modes.",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerTool(
    "get_theme",
    {
      title: "Get a Silica UI theme's resolved tokens",
      description:
        "Get one theme preset's fully RESOLVED token map — dark deltas already merged over the base tokens and every `-content` ink derived by measured contrast, i.e. what a browser actually computes rather than the authored bag — plus the exact attribute to apply it, its type faces, its shape tokens, and any role whose ink fails WCAG AA. Pass mode to get just light or just dark.",
      inputSchema: {
        name: z.string().describe("Theme name — the `data-theme` value, e.g. 'midnight', 'quartz', 'clay'."),
        mode: z
          .enum(["light", "dark", "both"])
          .optional()
          .describe("Which mode's tokens to return. Defaults to both."),
      },
    },
    async ({ name, mode }) => {
      const preset = themes.presets.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (!preset) {
        return {
          content: [
            {
              type: "text",
              text:
                `No theme named "${name}". Shipped presets: ${themes.presets.map((p) => p.name).join(", ")}. ` +
                `A name that isn't here isn't unavailable — an app declares its own with @plugin "@wizeworks/silicaui/theme" (see get_tokens → theming.declaring).`,
            },
          ],
          isError: true,
        };
      }
      const { light, dark, ...rest } = preset;
      const body =
        mode === "light" ? { light } : mode === "dark" ? { dark } : { light, dark };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...rest,
                // `mode` is the Theme type's own field and reads as a
                // restriction if left unexplained — it is not one. Both maps
                // below render.
                modeNote:
                  "`mode` is which mode this theme's authored token bag expresses — not a limitation. Both maps below render. Which one a page shows is the host's dark strategy, not this field: the built-in themes switch on the `data-theme` value itself (`light`/`dark`), while a named preset is emitted as two `themeTokenCss` calls — one per mode — under whichever selectors that strategy uses.",
                apply: themes.mechanism.apply,
                emittedBy: EMITTED_BY_NOTE,
                ...body,
                tokensNote:
                  "RESOLVED, not authored: the dark map is the base tokens with this theme's dark deltas merged over them and `-content` inks re-derived. " +
                  "Do not paste these values onto a COMPONENT or into a rule of your own — a token hardcoded on an element stops tracking whatever theme it ends up inside, which is the thing to avoid. " +
                  'Declaring them once under a theme name is the opposite and is sanctioned: `@plugin "@wizeworks/silicaui/theme" { name: … }` on the CSS path, `themeTokenCss` on the others. See `emittedBy` above.',
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
              // The host contract, same as path 3's schema publishes. Without
              // it a caller can author a document and still have no idea how
              // live data reaches it — through a `data` marker or through an
              // inline `{{ref}}` token, which are different surfaces.
              resolution: email.resolution,
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
                // Whether THIS kind's prose field takes inline `{{ref}}`
                // substitution is a per-kind fact an agent asking about one
                // kind needs, and the note names them — `text`/`button` yes,
                // `html` deliberately never. Carried on every kind because the
                // negative case is the one that surprises people.
                tokenNote: email.resolution.tokens,
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
      // Every group below matches through `matches()`. It used to be a literal
      // `name.toLowerCase().includes(q)` written out thirteen times, which meant
      // the whole query had to appear verbatim — so `"app shell"` found nothing
      // while `"appshell"` found seven things, and the same for DataTable,
      // EmptyState, CommandPalette and most of the React surface. Nobody types
      // the identifier; they type the words.
      //
      // That matters more here than in a human search box, and the site's own ⌘K
      // palette is in fact fine. This server exists so an AGENT reaches for a
      // real component instead of hand-rolling one, and an agent handed `[]`
      // does not retry with the space removed — it concludes there is no app
      // shell and writes its own grid. The tool manufactures the exact RULE #1
      // violation it exists to prevent, silently.
      //
      // The two hardcoded keyword lists further down are the fossil record of
      // this: both comments say "the exact failure above", and both patched a
      // call site instead of the test. They stay — they map real synonyms that
      // no normalisation reaches — but they are no longer load-bearing.
      // (docs/personas/issues/014.)
      const terms = q.split(/\s+/).filter(Boolean);

      /**
       * Index a haystack BOTH as written and word-split, so `AppShell` answers
       * to `appshell`, `app shell` and `shell`, and `data-table` to `data table`.
       */
      const normalize = (s: string): string => {
        const raw = s.toLowerCase();
        const split = s
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
          .replace(/[-_]+/g, " ")
          .toLowerCase();
        return split === raw ? raw : `${raw} ${split}`;
      };

      /**
       * Industry words that share no substring with what this library calls the
       * thing. Normalisation cannot reach these: `snackbar` and `toast` have no
       * letters in common in the right order, so no amount of splitting or
       * casing helps.
       *
       * Measured, not invented — 41 phrases a person would actually type were run
       * against the server and these are the ones that returned NOTHING while the
       * component sat right there (docs/personas/issues/025). Everything else in
       * that run already worked, which is why this list is short and stays short:
       * it is for true synonyms, not for spelling variants.
       */
      const ALIASES: Record<string, string[]> = {
        snackbar: ["toast"],
        loader: ["loading", "spinner"],
        loading: ["skeleton", "spinner"],
        history: ["timeline"],
        audit: ["timeline"],
        trail: ["timeline"],
        activity: ["timeline"],
        feed: ["timeline"],
        log: ["timeline"],
        picture: ["avatar", "image"],
        photo: ["avatar", "image"],
        headshot: ["avatar"],
        crumbs: ["breadcrumb"],
      };
      /** A term matches if ANY of its spellings does. */
      const spellings = terms.map((t) => [t, ...(ALIASES[t] ?? [])]);

      /**
       * `strict` is the AND pass — every term must appear in the SAME entry, which
       * is what a search should do and what issue 014 established.
       *
       * It has one failure mode, and it is the one an agent hits: add an ordinary
       * descriptive word and a working query stops working. `toast` returns 12 and
       * `message` returns 22, but `toast message` returns **0**, because no single
       * entry carries both. A person reads that as "there is no toast component"
       * and hand-rolls one — the exact RULE #1 violation this tool exists to stop,
       * and the same failure issue 014 was filed for, one layer further in.
       *
       * So a zero-result query RELAXES rather than switching to OR. OR was tried
       * first and is worse than it sounds: `toast message` returned 34 entries
       * with Toast nowhere in the first eight, because every Chat* component
       * matches "message" and nothing ranks them. A result set that buries the
       * answer is not much better than an empty one.
       *
       * Dropping the least useful WORD keeps the AND, and therefore the
       * precision: `toast message` -> `toast` -> the twelve toast entries.
       * Subsets are tried largest first, so as much of the query is honoured as
       * can be. Anything that returns results today is untouched, because the
       * full query is always tried first.
       */
      let active = spellings;

      /** True when every term in the ACTIVE subset (or its alias) appears. */
      const matches = (...parts: (string | null | undefined)[]): boolean => {
        if (!active.length) return false;
        const hay = parts.filter(Boolean).map((p) => normalize(p as string)).join(" ");
        return active.every((alts) => alts.some((t) => hay.includes(t)));
      };

      const collect = () => {
      const matchedComponents = components
        .filter((c) => matches(c.name, c.description, c.label))
        .map((c) => ({ kind: "component", name: c.name, package: c.package }));
      const matchedBlocks = blocks
        .filter((b) => matches(b.name, b.description))
        .map((b) => ({ kind: "block", key: b.key, name: b.name }));
      const matchedBehaviors = behaviors
        .filter((b) => matches(b.type, b.description))
        .map((b) => ({ kind: "behavior", type: b.type }));
      const matchedClasses = Object.entries(classesByComponent).flatMap(([component, classes]) =>
        classes
          .filter((cls) => matches(cls))
          .map((cls) => ({ kind: "class" as const, component, class: cls })),
      );
      const matchedTokens = tokens.semanticColors
        .filter((name) => matches(name))
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
      // Themes, by name or by character ("warm", "serif", "navy"). A preset's
      // name is the only handle an agent has on it, and twenty of them are
      // unguessable — `clay`, `dune`, `frost` match nothing else in the catalog.
      const matchedThemes = themes.presets
        .filter((p) => matches(p.name, p.character))
        .map((p) => ({ kind: "theme" as const, name: p.name, applyAs: p.applyAs, tool: "get_theme" }));
      // Theming is a MECHANISM, not a literal name — the exact failure the
      // custom-colors entry above was added for. "dark mode", "data-theme",
      // "light/dark" and "theme" all matched nothing, so an agent asked to make
      // a dark section concluded it had to write hex or its own CSS.
      const THEME_CONCEPT = [
        "theme",
        "theming",
        "data-theme",
        "dark mode",
        "dark",
        "light mode",
        "light",
        "color scheme",
        "colour scheme",
        "prefers-color-scheme",
        "toggle",
        "island",
        "skin",
        "white label",
        "white-label",
        "multi-tenant",
      ];
      const matchedThemeConcept = THEME_CONCEPT.some((k) => k.includes(q) || q.includes(k))
        ? [
            {
              kind: "concept" as const,
              name: "themes (data-theme)",
              summary: themes.note,
              tool: "list_themes",
              field: "mechanism",
            },
          ]
        : [];
      // The node-tree vocabulary. Without this, "repeat", "limit", "srcset" and
      // "conditional" found nothing here and an agent concluded the concept did
      // not exist — the exact failure a searchable catalog is meant to prevent.
      const matchedBindings = schema.dataBindings
        .filter((b) => matches(b.kind, b.doc, ...b.fields.map((f) => f.name)))
        .map((b) => ({ kind: "data-binding" as const, binding: b.kind, tool: "get_node_schema" }));
      const matchedNodeKinds = schema.kinds
        .filter((k) => matches(k.kind, k.typeName, k.doc))
        .map((k) => ({ kind: "node-kind" as const, node: k.kind, tool: "get_node_schema" }));
      const matchedTags = schema.elementFloor.tags
        .filter((t) => t.tag.toLowerCase() === q || t.attrs.some((a) => a.toLowerCase() === q))
        .map((t) => ({ kind: "element-tag" as const, tag: t.tag, group: t.group, tool: "get_node_schema" }));
      // Email node kinds match on their own name, their doc, or any field they
      // declare — "href" should find the `link` group even though no component
      // or class is called that.
      const matchedEmail = email.kinds
        .filter((k) => matches(k.kind, k.typeName, k.doc, ...k.fields.map((f) => f.name)))
        .map((k) => ({ kind: "email-node" as const, node: k.kind, typeName: k.typeName }));
      const matchedEmailTypes = email.documentTypes
        .filter((t) => matches(t.typeName, t.doc, ...t.fields.map((f) => f.name)))
        .map((t) => ({ kind: "email-type" as const, typeName: t.typeName }));
      return [
        ...matchedComponents,
        ...matchedBlocks,
        ...matchedBehaviors,
        ...matchedClasses,
        ...matchedTokens,
        ...matchedColorConcept,
        ...matchedThemes,
        ...matchedThemeConcept,
        ...matchedBindings,
        ...matchedNodeKinds,
        ...matchedTags,
        ...matchedEmail,
        ...matchedEmailTypes,
      ];
      };

      let results = collect();
      // Relax one word at a time and keep the MOST SPECIFIC relaxation that finds
      // anything — the smallest non-empty result set, not the first one.
      //
      // Position is not a reliable signal and trying it proved that: dropping the
      // first word is right for `status history` (-> `history` -> Timeline) and
      // wrong for `toast message` (-> `message` -> twenty-two Chat entries with
      // Toast nowhere). Dropping the last is exactly the reverse. Fewest results
      // gets both right, because the word that narrows most is the one that
      // carries the meaning.
      let ignored: string[] = [];
      if (!results.length) {
        for (let keep = spellings.length - 1; keep >= 1 && !results.length; keep--) {
          let best: typeof results | null = null;
          let bestDrop = -1;
          for (let drop = 0; drop < spellings.length; drop++) {
            active = spellings.filter((_, i) => i !== drop).slice(0, keep);
            if (active.length !== keep) continue;
            const got = collect();
            if (got.length && (best === null || got.length < best.length)) {
              best = got;
              bestDrop = drop;
            }
          }
          const dropped = terms[bestDrop];
          if (best && dropped !== undefined) {
            results = best;
            ignored = [dropped];
          }
        }
      }
      active = spellings;

      // SAY when the query was relaxed. A silent relaxation is its own lie: the
      // caller asked for two words, got results, and has no way to know one word
      // was dropped — so `phone zzzznotathing` would read as "zzzznotathing is a
      // real thing in this library". The note is a first entry rather than a new
      // response shape, so every existing caller keeps working and an agent
      // reading the list sees exactly what happened.
      if (ignored.length) {
        results = [
          {
            kind: "search-note" as const,
            note: `No entry matched every word. Showing results for "${terms.filter((t) => !ignored.includes(t)).join(" ")}".`,
            ignored,
          },
          ...results,
        ] as typeof results;
      }
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
