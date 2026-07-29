/**
 * The Inspector (right rail in Page/Layout mode) — the property panel for the
 * selected node. Two tiers over ONE class set (the builder-UX spine): semantic
 * controls (color swatches, size/weight/align/padding/corner chips, plus a
 * recognized-family block for Buttons) sit above the raw class string, and both
 * edit the SAME `node.class`. A class is an unordered, removable set: picking a
 * value swaps out the group's other members; "Auto" clears the group back to the
 * theme default.
 *
 * STYLING RULE (hard): every control is a @wizeworks/silicaui class (`btn`, `input`,
 * `textarea`, swatch previews via `bg-*`) or a Tailwind utility, and every
 * utility a node can WEAR is a LITERAL string here so the harness safelists it.
 */
import * as React from "react";
import type { ComponentNode, DataBinding, DataSource, ElementNode, HostNode, Node, Theme } from "@wizeworks/silicaui-html";
import { applyCollectionLimit, rolesOf, colorValue, SURFACE_TOKENS, scopeAt, walk } from "@wizeworks/silicaui-html";
import { Input, Textarea, Toggle, NativeSelect, EmptyState, ToggleGroup, ToggleGroupItem } from "@wizeworks/silicaui-react";
import { useEditor, useSelectedNode, useSelectionSet, useTheme } from "./editor-context";
import { setClassTokenMany } from "../commands";
import { useHost } from "./host-context";
import type { AssetRef, HostPropDef, InspectorPanelCtx } from "./host";
import { BREAKPOINT_CHOICES, useBreakpoint } from "./breakpoint-context";
import { tokenStateAt } from "../class-tokens";
import type { TokenState } from "../class-tokens";
import { Icon } from "../../shared/react/Icon";
import { nodeIconName, nodeName, editableText } from "../node-display";
import { unbackedClasses } from "../class-support";
import {
  FONT_SIZE, WEIGHT, ALIGN, PADDING, PAD_X, PAD_Y, RADIUS, WIDTH, MAX_WIDTH, POSITION,
  SELF_ALIGN, FLEX_CHILD, DISPLAY, DIRECTION, JUSTIFY, ITEMS, GAP, WRAP, GRID_COLS,
  BTN_VARIANT, BTN_SIZE, OBJECT_FIT, OBJECT_POSITION, ANIMATE_LOAD_PRESET, ANIMATE_SCROLL_PRESET, ANIMATE_HOVER_PRESET,
  ANIMATE_DURATION, ANIMATE_DELAY, ANIMATE_TRIGGER, ALL_ANIMATE_PRESET_CLASSES,
} from "../canvas-vocab";

// ── class-set helpers ────────────────────────────────────────────────────────
// Classes already warned about (no backing CSS) — dedup so the console logs each
// unresolved class once per session, not once per re-render.
const warnedClasses = new Set<string>();
const tokensOf = (cls: string | undefined): Set<string> => new Set((cls ?? "").split(/\s+/).filter(Boolean));

/** Title-case a color role name for a swatch tooltip ("base-content" → "Base content"). */
const titleOf = (name: string): string => name.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** One color swatch option — the class it toggles, its previewed value, its title. */
interface ColorOption {
  cls: string;
  color: string;
  title: string;
}

/**
 * The color vocab is DERIVED from the live theme (not a hardcoded list), so every
 * role `rolesOf` exposes — the eight semantic roles AND any custom color a user
 * adds in the Theme editor (`brand`, …) — shows up automatically. Swatches preview
 * the real theme value (via `colorValue`) rather than a `bg-*` class, so a custom
 * color renders even though the chrome never compiled a `bg-brand` rule. The
 * `text-*`/`bg-*`/`btn-*` classes these apply are painted on the canvas by the
 * plugin (declared colors) or the runtime cascade (custom ones).
 */
const SWATCH_FALLBACK = "var(--color-base-300)";
const roleColor = (theme: Theme, name: string, mode: "light" | "dark"): string =>
  colorValue(theme, name, mode) ?? SWATCH_FALLBACK;

function textColorOptions(theme: Theme, mode: "light" | "dark"): ColorOption[] {
  return [
    { cls: "text-base-content", color: roleColor(theme, "base-content", mode), title: "Content" },
    ...rolesOf(theme).map((r) => ({ cls: `text-${r}`, color: roleColor(theme, r, mode), title: titleOf(r) })),
  ];
}

function bgColorOptions(theme: Theme, mode: "light" | "dark"): ColorOption[] {
  const surfaces = SURFACE_TOKENS.filter((s) => s !== "base-content").map((s) => ({
    cls: `bg-${s}`,
    color: roleColor(theme, s, mode),
    title: titleOf(s),
  }));
  return [
    ...surfaces,
    ...rolesOf(theme).map((r) => ({ cls: `bg-${r}`, color: roleColor(theme, r, mode), title: titleOf(r) })),
  ];
}

function btnColorOptions(theme: Theme, mode: "light" | "dark"): ColorOption[] {
  return rolesOf(theme).map((r) => ({ cls: `btn-${r}`, color: roleColor(theme, r, mode), title: titleOf(r) }));
}

// ── control vocab ────────────────────────────────────────────────────────────
// The literal utility classes a node can wear now live in ONE source of truth,
// `../canvas-vocab` (also the consumable `@wizeworks/silicaui-builder/vocab` entry),
// so the Inspector renders exactly what a consumer safelists — no drift. See that
// file for why each class is in or out.

// ── form-control prop vocab ───────────────────────────────────────────────────
// Which `props` each form component exposes for editing. Keyed by component name
// (the same family-by-name pattern as the Button block); the values map straight
// to the props the ComponentDef's `expand()` reads, so editing here changes the
// published HTML. Options for Select are edited separately (a list, not a scalar).
type PropControl = "text" | "number" | "toggle" | "select" | "list" | "asset";
interface PropField {
  key: string;
  label: string;
  control: PropControl;
  options?: readonly string[];
  placeholder?: string;
}
const INPUT_TYPES = ["text", "email", "password", "number", "tel", "url", "search"] as const;
/** Image `ratio` prop — the aspect box its ComponentDef maps to a utility.
 *  Empty = no aspect box (the image keeps its intrinsic ratio). */
const IMAGE_RATIOS = ["", "wide", "square", "portrait"] as const;
const COMPONENT_PROPS: Record<string, readonly PropField[]> = {
  Input: [
    { key: "type", label: "Type", control: "select", options: INPUT_TYPES },
    { key: "placeholder", label: "Placeholder", control: "text" },
    { key: "name", label: "Name", control: "text" },
    { key: "required", label: "Required", control: "toggle" },
  ],
  Textarea: [
    { key: "placeholder", label: "Placeholder", control: "text" },
    { key: "name", label: "Name", control: "text" },
    { key: "rows", label: "Rows", control: "number" },
    { key: "required", label: "Required", control: "toggle" },
  ],
  Select: [
    { key: "name", label: "Name", control: "text" },
    { key: "required", label: "Required", control: "toggle" },
  ],
  Checkbox: [
    { key: "name", label: "Name", control: "text" },
    { key: "value", label: "Value", control: "text" },
    { key: "checked", label: "Checked", control: "toggle" },
    { key: "required", label: "Required", control: "toggle" },
  ],
  Radio: [
    { key: "name", label: "Name", control: "text" },
    { key: "value", label: "Value", control: "text" },
    { key: "checked", label: "Checked", control: "toggle" },
  ],
  Toggle: [
    { key: "name", label: "Name", control: "text" },
    { key: "checked", label: "Checked", control: "toggle" },
  ],
  // Form — the host action a valid submit dispatches to (lowers to data-sui-action;
  // the `form` behavior runtime reads it). Empty → validate-only / native submit.
  Form: [{ key: "action", label: "Submit action", control: "text", placeholder: "host action id" }],

  // ── navigation ──
  Breadcrumb: [{ key: "items", label: "Items", control: "list" }],
  Menu: [{ key: "items", label: "Items", control: "list" }],
  Steps: [
    { key: "items", label: "Items", control: "list" },
    { key: "current", label: "Current step", control: "number" },
  ],
  Pagination: [{ key: "pages", label: "Pages", control: "number" }],

  // ── feedback ──
  Alert: [{ key: "text", label: "Message", control: "text" }],
  Progress: [{ key: "value", label: "Value (0–100)", control: "number" }],
  Kbd: [{ key: "text", label: "Key", control: "text" }],

  // ── data ──
  Stat: [
    { key: "title", label: "Title", control: "text" },
    { key: "value", label: "Value", control: "text" },
    { key: "desc", label: "Description", control: "text" },
  ],
  // Image — the source, its alt, and the aspect box. `srcset`/`sizes` are the
  // responsive variants: a host's `pickAsset` fills them automatically, and the
  // fields stay editable so a host WITHOUT an asset picker can still paste a set
  // it generated elsewhere. Both are `text`, not `asset` — they're descriptor
  // lists, not a single URL to browse for.
  Image: [
    { key: "src", label: "Image URL", control: "asset" },
    { key: "alt", label: "Alt text", control: "text" },
    { key: "ratio", label: "Aspect", control: "select", options: IMAGE_RATIOS },
    { key: "srcset", label: "Responsive set", control: "text", placeholder: "/img-640.jpg 640w, /img-1280.jpg 1280w" },
    { key: "sizes", label: "Rendered size", control: "text", placeholder: "(min-width: 60rem) 50vw, 100vw" },
  ],
  Avatar: [
    { key: "src", label: "Image URL", control: "asset" },
    { key: "alt", label: "Alt text", control: "text" },
  ],
  // Wordmark — the brand lockup. `src` is the one-control path to "put the logo
  // in the wordmark" (the richer path is nesting an Image/Icon child, which the
  // ComponentDef honors first). `alt` defaults to "" — decorative, since the
  // name renders beside it. `href` lowers the whole mark to an <a>.
  Wordmark: [
    { key: "text", label: "Name", control: "text" },
    { key: "src", label: "Logo", control: "asset" },
    { key: "alt", label: "Logo alt text", control: "text", placeholder: "Decorative — leave empty if the name shows" },
    { key: "href", label: "Link", control: "text", placeholder: "/" },
  ],
  // Video — src/poster are asset URLs; playback flags are booleans (see the
  // ComponentDef's `=== true` convention). Nested <source> sets are an authoring
  // concern (children), not surfaced here — the single `src` covers the common case.
  Video: [
    { key: "src", label: "Video URL", control: "asset" },
    { key: "poster", label: "Poster image", control: "asset" },
    { key: "ratio", label: "Aspect ratio", control: "select", options: ["wide", "square", "portrait"] },
    { key: "controls", label: "Show controls", control: "toggle" },
    { key: "autoplay", label: "Autoplay", control: "toggle" },
    { key: "loop", label: "Loop", control: "toggle" },
    { key: "muted", label: "Muted", control: "toggle" },
    { key: "playsinline", label: "Plays inline", control: "toggle" },
  ],
  // Embed — a curated third-party embed. Only YouTube/Vimeo/Google Maps URLs
  // produce a (sandboxed) iframe; anything else falls back to a link.
  Embed: [
    { key: "url", label: "Embed URL", control: "text", placeholder: "YouTube / Vimeo / Google Maps URL" },
    { key: "ratio", label: "Aspect ratio", control: "select", options: ["wide", "square", "portrait"] },
    { key: "title", label: "Title (a11y)", control: "text" },
  ],
  Collapse: [
    { key: "title", label: "Title", control: "text" },
    { key: "content", label: "Content", control: "text" },
  ],
  Timeline: [{ key: "items", label: "Items", control: "list" }],

  // ── gap-fill components ──
  Sidebar: [{ key: "defaultCollapsed", label: "Start collapsed", control: "toggle" }],
  SelectionList: [{ key: "multiple", label: "Multi-select", control: "toggle" }],
};

// ── small building blocks ─────────────────────────────────────────────────────
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3.5 py-3 border-b border-base-200">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/45">{label}</div>
      {children}
    </div>
  );
}

/** One labeled control row. `testid` scopes it for tests — several rows share
 *  chip labels ("Start", "3"), so a bare label lookup is ambiguous. */
function Row({
  label,
  testid,
  state,
  children,
}: {
  label: string;
  testid?: string;
  /** When given, the row shows whether its value is inherited from a smaller
   *  breakpoint — see `Inherited`. Rows whose control isn't breakpoint-scoped
   *  (content, links, attributes) omit it. */
  state?: TokenState;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 last:mb-0" data-testid={testid}>
      <div className="mb-1 flex items-baseline gap-2 text-xs text-base-content">
        <span>{label}</span>
        {state && <Inherited state={state} />}
      </div>
      {children}
    </div>
  );
}

/** A wrapping row of small btn chips; `Auto` clears the group. */
function ChipGroup({
  options,
  active,
  onPick,
}: {
  options: ReadonlyArray<{ cls: string; label: string }>;
  active: string;
  onPick: (cls: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <button type="button" className={`btn btn-xs ${active === "" ? "btn-primary" : "btn-ghost"}`} onClick={() => onPick("")}>
        Auto
      </button>
      {options.map((o) => (
        <button
          key={o.cls}
          type="button"
          className={`btn btn-xs ${active === o.cls ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onPick(o.cls)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Which SIZE the Design controls below are editing. Sits at the top of the tab,
 * above everything it governs, because it changes what every control beneath it
 * means — an author who misses it is authoring at the wrong breakpoint and has
 * no way to tell.
 *
 * "All sizes" is the base value everything inherits, and the default. Picking a
 * larger one writes a container variant that adds from that width up; it never
 * removes the base, so the small screen keeps working whatever happens here.
 */
function BreakpointBar() {
  const { prefix, setPrefix, choices } = useBreakpoint();
  return (
    <div
      className="sticky top-0 z-10 flex items-center gap-2 border-b border-base-300 bg-base-100 px-3 py-2"
      data-testid="breakpoint-bar"
    >
      <span className="text-xs font-medium text-base-content">Editing</span>
      <div className="flex flex-wrap gap-1">
        {choices.map((c) => (
          <button
            key={c.prefix || "base"}
            type="button"
            title={c.hint}
            aria-pressed={prefix === c.prefix}
            data-testid={`breakpoint-${c.prefix || "base"}`}
            className={`btn btn-xs ${prefix === c.prefix ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setPrefix(c.prefix)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Marks a control whose value came from a SMALLER breakpoint rather than from
 * this one. Without it the cascade is invisible: a chip reading "3 columns" at
 * Desktop looks identical whether that was set here or inherited from base, and
 * the author can't tell whether changing it will affect mobile too.
 *
 * Nothing renders at base — there is nothing below it to inherit from.
 */
function Inherited({ state }: { state: TokenState }) {
  if (!state.inherited || !state.value) return null;
  const from = BREAKPOINT_CHOICES.find((c) => c.prefix === state.setAt);
  return (
    <span
      className="text-xs text-base-content"
      title={`Inherited from ${from?.label ?? "a smaller size"} — changing it here overrides only this size and up`}
      data-testid="token-inherited"
    >
      ↳ from {from?.label ?? "smaller"}
    </span>
  );
}

/** Is this node an image — the raw element or the `Image` atom that lowers to
 *  one? Both wear `object-*` on the same rendered `<img>`. */
function isImageNode(node: Node): boolean {
  if (node.kind === "element") return node.tag === "img";
  return node.kind === "component" && (node.component === "Image" || node.component === "Avatar");
}

/**
 * The focal point as a literal 3×3 grid — where the subject sits once the image
 * is cropped. Rendered as the shape it describes rather than nine chips in a
 * row, because "top left" is a position and a list of positions is a worse way
 * to show positions. Centre doubles as the reset (it IS the CSS default), so
 * there's no separate Auto that means the same thing.
 */
function FocalGrid({ active, onPick }: { active: string; onPick: (cls: string) => void }) {
  return (
    <div className="grid w-fit grid-cols-3 gap-1" data-testid="focal-grid">
      {OBJECT_POSITION.map((o) => (
        <button
          key={o.cls}
          type="button"
          title={o.label}
          aria-label={o.label}
          aria-pressed={active === o.cls}
          data-testid={`focal-${o.cls}`}
          className={`btn btn-xs btn-square ${active === o.cls ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onPick(active === o.cls ? "" : o.cls)}
        >
          <span className="size-1.5 rounded-full bg-current" />
        </button>
      ))}
    </div>
  );
}

/** A wrapping row of color swatches; `Auto` (crossed) clears the group. Swatch
 *  fills come from the theme value (inline style), so custom roles preview too. */
function SwatchGroup({
  options,
  active,
  onPick,
}: {
  options: ReadonlyArray<ColorOption>;
  active: string;
  onPick: (cls: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        title="Auto"
        onClick={() => onPick("")}
        className={`size-6 rounded-field border border-base-300 bg-base-100 grid place-items-center text-base-content/40 ${
          active === "" ? "ring-2 ring-primary ring-offset-1 ring-offset-base-100" : ""
        }`}
      >
        <Icon name="close" className="text-[10px]" />
      </button>
      {options.map((o) => (
        <button
          key={o.cls}
          type="button"
          title={o.title}
          onClick={() => onPick(o.cls)}
          style={{ backgroundColor: o.color }}
          className={`size-6 rounded-field border border-base-300 ${
            active === o.cls ? "ring-2 ring-primary ring-offset-1 ring-offset-base-100" : ""
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Corner-radius picker — square swatches that PREVIEW each option's real corner
 * (the same visual language as the Theme editor's Radius control), rather than a
 * text chip. The `rounded-field` / `rounded-box` previews use the live theme's own
 * radius tokens, so a swatch shows the actual corner the canvas will render; `Auto`
 * (crossed) clears the class back to the element's default. Same `{active,onPick}`
 * contract as ChipGroup, so it drops into the one-class-set model unchanged.
 */
function RadiusSwatchGroup({
  options,
  active,
  onPick,
}: {
  options: ReadonlyArray<{ cls: string; label: string; radius: string }>;
  active: string;
  onPick: (cls: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        title="Auto"
        onClick={() => onPick("")}
        className={`grid size-[30px] place-items-center border bg-base-200 text-base-content/40 ${
          active === "" ? "border-primary ring-1 ring-inset ring-primary" : "border-base-300"
        }`}
      >
        <Icon name="close" className="text-[10px]" />
      </button>
      {options.map((o) => (
        <button
          key={o.cls}
          type="button"
          title={o.label}
          onClick={() => onPick(o.cls)}
          style={{ borderTopLeftRadius: o.radius }}
          className={`size-[30px] border bg-base-200 ${
            active === o.cls ? "border-primary ring-1 ring-inset ring-primary" : "border-base-300"
          }`}
        />
      ))}
    </div>
  );
}

// ── the panel ─────────────────────────────────────────────────────────────────
type InspectorTab = "design" | "settings";

export function Inspector() {
  const node = useSelectedNode();
  // Which tab is showing. Persists across selection changes (the Inspector stays
  // mounted), so moving between nodes keeps you in Design or Settings.
  const [tab, setTab] = React.useState<InspectorTab>("design");

  if (!node || node.kind === "outlet" || !node.id) {
    return (
      <div className="grid flex-1 min-h-0 place-items-center p-6">
        <EmptyState
          size="sm"
          icon={<Icon name="sliders" />}
          title="No selection"
          description="Select an element on the canvas to edit it."
        />
      </div>
    );
  }

  const id = node.id;

  // A symbol instance is a LINKED copy — its own wrapper class/text don't reach
  // output (flatten renders the master). So it gets its own focused panel (edit the
  // master / detach / rename), not the generic style controls, which would mislead.
  if (node.instanceOf) {
    return <InstancePanel id={id} symbolId={node.instanceOf} node={node} />;
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <IdentityHeader node={node} />
      <div className="flex-none border-b border-base-200 px-3 py-2">
        <ToggleGroup
          className="toggle-group-sm w-full"
          aria-label="Inspector tab"
          value={[tab]}
          onValueChange={(v: string[]) => v.length && setTab(v[0] as InspectorTab)}
        >
          <ToggleGroupItem value="design" className="flex-1">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="sliders" /> Design
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem value="settings" className="flex-1">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="settings" /> Settings
            </span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {tab === "design" ? <DesignTab id={id} node={node} /> : <SettingsTab id={id} node={node} />}
      </div>

      <NodeFooter id={id} node={node} />
    </div>
  );
}

/**
 * The DESIGN tab — pure visual styling over the one class set: the recognized
 * family block (Button), Text (color/size/weight/align), Surface (bg/padding/
 * corners), and the raw class escape hatch. Content, semantics, and bindings live
 * in the Settings tab.
 */
function DesignTab({ id, node }: { id: string; node: Node }) {
  const editor = useEditor();
  // Every semantic control below reads AND writes at this breakpoint. Reading at
  // one and writing at another is the failure mode to avoid: the chip would show
  // the base value while the click landed on `@5xl:`, so the control would look
  // like it did nothing.
  const { prefix } = useBreakpoint();
  const selection = useSelectionSet();
  const theme = useTheme();
  const mode = theme.mode ?? "light";
  const textColors = React.useMemo(() => textColorOptions(theme, mode), [theme, mode]);
  const bgColors = React.useMemo(() => bgColorOptions(theme, mode), [theme, mode]);
  const btnColors = React.useMemo(() => btnColorOptions(theme, mode), [theme, mode]);
  // Corner swatches preview each class against the live theme's real radius tokens,
  // so `Field` / `Box` show the actual corner the canvas renders.
  const radiusOpts = React.useMemo(
    () => [
      { cls: "rounded-none", label: "None", radius: "0" },
      { cls: "rounded-field", label: "Field", radius: theme.tokens?.["--radius-field"] ?? "0.25rem" },
      { cls: "rounded-box", label: "Box", radius: theme.tokens?.["--radius-box"] ?? "0.5rem" },
      { cls: "rounded-full", label: "Full", radius: "14px" },
    ],
    [theme],
  );

  const cls = node.kind !== "outlet" ? node.class ?? "" : "";

  /**
   * Write one member of a group AT THE ACTIVE BREAKPOINT. Delegates to the
   * engine's `setClassToken`, which owns the prefix arithmetic and the
   * container guarantee — the Inspector doesn't re-implement either, and
   * neither does any other host.
   */
  // Design edits apply to the WHOLE selection. `id` (the primary) is what the
  // controls READ, because a panel has to show one node's values — but writing
  // to only the primary would make a multi-select look like it did nothing to
  // the other five nodes the author had highlighted.
  const targets = selection.length > 1 ? selection : [id];
  const setToken = (group: readonly string[], value: string) => {
    setClassTokenMany(editor, targets, group, value, prefix);
  };
  /** Several groups in ONE action — a display switch that also clears the
   *  classes the new display can't honor, or a padding shorthand expanding onto
   *  the axis it's leaving. Chained through the same engine seam (each call
   *  re-reads the node, so the edits compose) inside one batch, so it's a single
   *  undo step and a single ops emission, across every selected node. */
  const commitTokens = (edits: readonly (readonly [readonly string[], string])[]) =>
    editor.batch(() => {
      for (const target of targets) {
        for (const [group, value] of edits) editor.setClassToken(target, group, value, prefix);
      }
    });
  /** What a group resolves to HERE, and whether it was set here or inherited
   *  from a smaller size. */
  const tokenAt = (group: readonly string[]): TokenState => tokenStateAt(cls, group, prefix);
  const activeAt = (group: readonly string[]): string => tokenAt(group).value;

  // Padding: `p-4` is a shorthand for both axes, so editing ONE axis must expand
  // it rather than drop it — picking a new X on a `p-4` node has to leave the
  // vertical padding standing at 4 (as `py-4`), not silently zero it. The opposite
  // axis is looked up BY INDEX across the aligned scales, keeping it a literal.
  const padAll = activeAt(PADDING.map((o) => o.cls));
  const padX = activeAt(PAD_X.map((o) => o.cls));
  const padY = activeAt(PAD_Y.map((o) => o.cls));
  const setPadAll = (value: string) =>
    commitTokens([
      [PAD_X.map((o) => o.cls), ""],
      [PAD_Y.map((o) => o.cls), ""],
      [PADDING.map((o) => o.cls), value],
    ]);
  const setPadAxis = (axis: "x" | "y", value: string) => {
    const own = (axis === "x" ? PAD_X : PAD_Y).map((o) => o.cls);
    const other = axis === "x" ? PAD_Y : PAD_X;
    const otherWorn = axis === "x" ? padY : padX;
    // Expand the shorthand onto the axis we're NOT editing before dropping it.
    const i = PADDING.findIndex((o) => o.cls === padAll);
    commitTokens([
      ...(i !== -1 && !otherWorn ? ([[other.map((o) => o.cls), other[i]!.cls]] as const) : []),
      ...(i !== -1 ? ([[PADDING.map((o) => o.cls), ""]] as const) : []),
      [own, value],
    ]);
  };

  // Container layout: which display the node wears drives which child-arrangement
  // rows are meaningful. Switching display drops the classes the new display can't
  // honor (a `flex-col` left on a grid, a `grid-cols-3` left on a flex row) so the
  // class set never carries inert leftovers — same hygiene as setAnimateTrigger.
  const display = activeAt(DISPLAY.map((o) => o.cls));
  const FLEX_ONLY = [...DIRECTION, ...WRAP].map((o) => o.cls);
  const GRID_ONLY = GRID_COLS.map((o) => o.cls);
  const SHARED_AXIS = [...JUSTIFY, ...ITEMS, ...GAP].map((o) => o.cls);
  const setDisplay = (next: string) => {
    const drop = next === "flex" ? GRID_ONLY : next === "grid" ? FLEX_ONLY : [...FLEX_ONLY, ...GRID_ONLY, ...SHARED_AXIS];
    commitTokens([
      // Each dropped class is its own one-member group: clearing at THIS
      // breakpoint only, so switching display on tablet doesn't silently strip
      // the flex settings the base still needs.
      ...drop.map((c) => [[c], ""] as [readonly string[], string]),
      [DISPLAY.map((o) => o.cls), next],
    ]);
  };

  // Animate: which trigger (if any) is active, derived from which preset
  // family's class is currently worn — same "read state back out of the class
  // string" approach as every other group here.
  const existingBehavior = node.kind !== "outlet" ? node.behavior : undefined;
  const animateTrigger: "" | "load" | "scroll" | "hover" = activeAt(ANIMATE_LOAD_PRESET.map((o) => o.cls))
    ? "load"
    : activeAt(ANIMATE_SCROLL_PRESET.map((o) => o.cls))
      ? "scroll"
      : activeAt(ANIMATE_HOVER_PRESET.map((o) => o.cls))
        ? "hover"
        : "";
  const animatePresetList =
    animateTrigger === "load" ? ANIMATE_LOAD_PRESET : animateTrigger === "scroll" ? ANIMATE_SCROLL_PRESET : animateTrigger === "hover" ? ANIMATE_HOVER_PRESET : [];
  // A node's `behavior` marker is a single slot (architecture §7) — Scroll
  // would clobber an existing interactive behavior (Tabs, Carousel, …), so
  // it's disabled rather than silently stealing the slot.
  const behaviorConflict = !!existingBehavior && existingBehavior.type !== "reveal";
  const setAnimateTrigger = (next: "" | "load" | "scroll" | "hover") => {
    const defaults = next === "load" ? ANIMATE_LOAD_PRESET : next === "scroll" ? ANIMATE_SCROLL_PRESET : ANIMATE_HOVER_PRESET;
    editor.batch(() => {
      commitTokens([[ALL_ANIMATE_PRESET_CLASSES, next ? defaults[0]!.cls : ""]]);
      // Only ever touch OUR OWN "reveal" marker — never clobber an unrelated
      // behavior root (Tabs, Carousel, …) the Scroll button is disabled for.
      if (!existingBehavior || existingBehavior.type === "reveal") {
        editor.setBehavior(id, next === "scroll" ? { type: "reveal", params: { once: true } } : undefined);
      }
    });
  };

  return (
    <>
      <BreakpointBar />
      {selection.length > 1 && (
        <div className="flex items-center gap-2 border-b border-base-300 bg-base-200 px-3 py-2" data-testid="multi-select-note">
          <span className="text-xs font-medium text-base-content">{selection.length} selected</span>
          {/* Say which node the VALUES belong to. Without this, a control reading
              the primary's value looks like it's describing all of them. */}
          <span className="text-xs text-base-content">— values shown for the last; changes apply to all</span>
        </div>
      )}
      {node.kind === "component" && node.component === "Button" && (
        <Group label="Button">
          <Row label="Color">
            <SwatchGroup options={btnColors} active={activeAt(btnColors.map((o) => o.cls))} onPick={(v) => setToken(btnColors.map((o) => o.cls), v)} />
          </Row>
          <Row label="Style">
            <ChipGroup options={BTN_VARIANT} active={activeAt(BTN_VARIANT.map((o) => o.cls))} onPick={(v) => setToken(BTN_VARIANT.map((o) => o.cls), v)} />
          </Row>
          <Row label="Size">
            <ChipGroup options={BTN_SIZE} active={activeAt(BTN_SIZE.map((o) => o.cls))} onPick={(v) => setToken(BTN_SIZE.map((o) => o.cls), v)} />
          </Row>
        </Group>
      )}

      <Group label="Text">
        <Row label="Color">
          <SwatchGroup options={textColors} active={activeAt(textColors.map((o) => o.cls))} onPick={(v) => setToken(textColors.map((o) => o.cls), v)} />
        </Row>
        <Row label="Size">
          <ChipGroup options={FONT_SIZE} active={activeAt(FONT_SIZE.map((o) => o.cls))} onPick={(v) => setToken(FONT_SIZE.map((o) => o.cls), v)} />
        </Row>
        <Row label="Weight">
          <ChipGroup options={WEIGHT} active={activeAt(WEIGHT.map((o) => o.cls))} onPick={(v) => setToken(WEIGHT.map((o) => o.cls), v)} />
        </Row>
        <Row label="Align" testid="row-text-align" state={tokenAt(ALIGN.map((o) => o.cls))}>
          <ChipGroup options={ALIGN} active={activeAt(ALIGN.map((o) => o.cls))} onPick={(v) => setToken(ALIGN.map((o) => o.cls), v)} />
        </Row>
      </Group>

      <Group label="Surface">
        <Row label="Background">
          <SwatchGroup options={bgColors} active={activeAt(bgColors.map((o) => o.cls))} onPick={(v) => setToken(bgColors.map((o) => o.cls), v)} />
        </Row>
        <Row label="Padding" testid="row-padding" state={tokenAt(PADDING.map((o) => o.cls))}>
          <ChipGroup options={PADDING} active={padAll} onPick={setPadAll} />
        </Row>
        <Row label="Padding X" testid="row-padding-x">
          <ChipGroup options={PAD_X} active={padX} onPick={(v) => setPadAxis("x", v)} />
        </Row>
        <Row label="Padding Y" testid="row-padding-y">
          <ChipGroup options={PAD_Y} active={padY} onPick={(v) => setPadAxis("y", v)} />
        </Row>
        <Row label="Corners">
          <RadiusSwatchGroup options={radiusOpts} active={activeAt(RADIUS.map((o) => o.cls))} onPick={(v) => setToken(RADIUS.map((o) => o.cls), v)} />
        </Row>
      </Group>

      {isImageNode(node) && (
        <Group label="Image">
          <Row label="Fit">
            <ChipGroup options={OBJECT_FIT} active={activeAt(OBJECT_FIT.map((o) => o.cls))} onPick={(v) => setToken(OBJECT_FIT.map((o) => o.cls), v)} />
          </Row>
          <Row label="Focal point">
            <FocalGrid active={activeAt(OBJECT_POSITION.map((o) => o.cls))} onPick={(v) => setToken(OBJECT_POSITION.map((o) => o.cls), v)} />
          </Row>
        </Group>
      )}

      <Group label="Layout">
        <Row label="Display">
          <div className="flex flex-wrap gap-1" data-testid="display-group">
            <button
              type="button"
              data-testid="display-auto"
              className={`btn btn-xs ${display === "" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setDisplay("")}
            >
              Auto
            </button>
            {DISPLAY.map((o) => (
              <button
                key={o.cls}
                type="button"
                data-testid={`display-${o.cls}`}
                className={`btn btn-xs ${display === o.cls ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDisplay(o.cls)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Row>

        {display === "flex" && (
          <Row label="Direction" testid="row-direction" state={tokenAt(DIRECTION.map((o) => o.cls))}>
            <ChipGroup options={DIRECTION} active={activeAt(DIRECTION.map((o) => o.cls))} onPick={(v) => setToken(DIRECTION.map((o) => o.cls), v)} />
          </Row>
        )}
        {display === "grid" && (
          <Row label="Columns" testid="row-columns" state={tokenAt(GRID_COLS.map((o) => o.cls))}>
            <ChipGroup options={GRID_COLS} active={activeAt(GRID_COLS.map((o) => o.cls))} onPick={(v) => setToken(GRID_COLS.map((o) => o.cls), v)} />
          </Row>
        )}
        {(display === "flex" || display === "grid") && (
          <>
            <Row label="Justify" testid="row-justify" state={tokenAt(JUSTIFY.map((o) => o.cls))}>
              <ChipGroup options={JUSTIFY} active={activeAt(JUSTIFY.map((o) => o.cls))} onPick={(v) => setToken(JUSTIFY.map((o) => o.cls), v)} />
            </Row>
            <Row label="Align" testid="row-align" state={tokenAt(ITEMS.map((o) => o.cls))}>
              <ChipGroup options={ITEMS} active={activeAt(ITEMS.map((o) => o.cls))} onPick={(v) => setToken(ITEMS.map((o) => o.cls), v)} />
            </Row>
            <Row label="Gap" testid="row-gap" state={tokenAt(GAP.map((o) => o.cls))}>
              <ChipGroup options={GAP} active={activeAt(GAP.map((o) => o.cls))} onPick={(v) => setToken(GAP.map((o) => o.cls), v)} />
            </Row>
          </>
        )}
        {display === "flex" && (
          <Row label="Wrap" testid="row-wrap">
            <ChipGroup options={WRAP} active={activeAt(WRAP.map((o) => o.cls))} onPick={(v) => setToken(WRAP.map((o) => o.cls), v)} />
          </Row>
        )}

        <Row label="Width" state={tokenAt(WIDTH.map((o) => o.cls))}>
          <ChipGroup options={WIDTH} active={activeAt(WIDTH.map((o) => o.cls))} onPick={(v) => setToken(WIDTH.map((o) => o.cls), v)} />
        </Row>
        <Row label="Max width" state={tokenAt(MAX_WIDTH.map((o) => o.cls))}>
          <ChipGroup options={MAX_WIDTH} active={activeAt(MAX_WIDTH.map((o) => o.cls))} onPick={(v) => setToken(MAX_WIDTH.map((o) => o.cls), v)} />
        </Row>
        <Row label="Position">
          <ChipGroup options={POSITION} active={activeAt(POSITION.map((o) => o.cls))} onPick={(v) => setToken(POSITION.map((o) => o.cls), v)} />
        </Row>
        <Row label="Self align" testid="row-self-align">
          <ChipGroup options={SELF_ALIGN} active={activeAt(SELF_ALIGN.map((o) => o.cls))} onPick={(v) => setToken(SELF_ALIGN.map((o) => o.cls), v)} />
        </Row>
        <Row label="Self size" testid="row-self-size">
          <ChipGroup options={FLEX_CHILD} active={activeAt(FLEX_CHILD.map((o) => o.cls))} onPick={(v) => setToken(FLEX_CHILD.map((o) => o.cls), v)} />
        </Row>
      </Group>

      <Group label="Animate">
        <Row label="Trigger">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              data-testid="animate-trigger-none"
              className={`btn btn-xs ${animateTrigger === "" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setAnimateTrigger("")}
            >
              None
            </button>
            {ANIMATE_TRIGGER.map((t) => {
              const disabled = t.cls === "scroll" && behaviorConflict;
              return (
                <button
                  key={t.cls}
                  type="button"
                  data-testid={`animate-trigger-${t.cls}`}
                  disabled={disabled}
                  title={disabled ? `Already used by this element's "${existingBehavior?.type}" behavior` : undefined}
                  className={`btn btn-xs ${animateTrigger === t.cls ? "btn-primary" : "btn-ghost"} ${disabled ? "btn-disabled" : ""}`}
                  onClick={() => setAnimateTrigger(t.cls)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Row>

        {animateTrigger !== "" && (
          <>
            <Row label="Preset">
              <ChipGroup
                options={animatePresetList}
                active={activeAt(animatePresetList.map((o) => o.cls))}
                onPick={(v) => setToken(animatePresetList.map((o) => o.cls), v)}
              />
            </Row>
            <Row label="Speed">
              <ChipGroup
                options={ANIMATE_DURATION}
                active={activeAt(ANIMATE_DURATION.map((o) => o.cls))}
                onPick={(v) => setToken(ANIMATE_DURATION.map((o) => o.cls), v)}
              />
            </Row>
            <Row label="Delay">
              <ChipGroup
                options={ANIMATE_DELAY}
                active={activeAt(ANIMATE_DELAY.map((o) => o.cls))}
                onPick={(v) => setToken(ANIMATE_DELAY.map((o) => o.cls), v)}
              />
            </Row>
          </>
        )}

        {animateTrigger === "scroll" && (
          <div className="text-xs text-base-content/55">
            Plays in Preview &amp; the published site — the canvas shows its final state while editing.
          </div>
        )}
      </Group>

      <ClassField id={id} cls={cls} />
    </>
  );
}

/** Node-level actions, pinned below the tabs so they're reachable from either. */
function NodeFooter({ id, node }: { id: string; node: Node }) {
  const editor = useEditor();
  return (
    <div className="flex-none border-t border-base-200 px-3.5 py-3">
      <button
        type="button"
        className="btn btn-sm btn-soft btn-secondary w-full mb-2"
        onClick={() => editor.createSymbol(nodeName(node))}
      >
        <Icon name="box" /> Save as component
      </button>
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm btn-ghost flex-1" onClick={() => editor.duplicate(id)}>
          Duplicate
        </button>
        <button type="button" className="btn btn-sm btn-ghost flex-1 text-error" onClick={() => editor.remove(id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────
/** Tag families offered by the semantic-tag control. A node can only be retagged
 *  within its own family (a heading stays text-level, a container stays a block),
 *  so changing the tag never turns an `<img>` into a `<section>`. */
const TAG_FAMILIES: readonly (readonly string[])[] = [
  ["h1", "h2", "h3", "h4", "h5", "h6", "p"],
  ["div", "section", "article", "nav", "header", "footer", "aside", "main"],
  ["span", "a", "strong", "em", "small", "label"],
  ["ul", "ol"],
];
const familyOf = (tag: string): readonly string[] | undefined =>
  TAG_FAMILIES.find((f) => f.includes(tag));

/** A text/number input that commits on blur / Enter (one undo step per edit), with
 *  draft state reseeded when the selection (`reseed`) or upstream value changes. */
function CommitInput({
  value,
  reseed,
  onCommit,
  placeholder,
  type = "text",
  mono = false,
  testId,
}: {
  value: string;
  reseed: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  mono?: boolean;
  /** A stable hook for e2e / host tooling, so a field isn't located by the
   *  label text beside it (which is copy, and changes). */
  testId?: string;
}) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, reseed]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <Input
      className={`w-full ${mono ? "font-mono text-xs" : ""}`}
      size="sm"
      type={type}
      data-testid={testId}
      value={draft}
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
    />
  );
}

/**
 * The SETTINGS tab — everything that isn't visual style: the element's identity
 * (name/tag/id/visibility), its content, links & host actions, dynamic data
 * bindings, accessibility, raw HTML attributes, and custom `data-*`. Fields map
 * straight onto the typed schema slots (`label`, `tag`, `attrs`, `data`), so
 * editing here changes the published HTML.
 */
function SettingsTab({ id, node }: { id: string; node: Node }) {
  return (
    <>
      <ElementSection id={id} node={node} />
      {editableText(node) !== undefined && <ContentField id={id} node={node} />}
      {node.kind === "host" && <HostSection id={id} node={node} />}
      {node.kind === "component" && node.component in COMPONENT_PROPS && <PropsGroup id={id} node={node} />}
      {node.kind === "element" && node.tag === "a" && <LinkSection id={id} node={node} />}
      <DataSection id={id} node={node} />
      {node.kind === "element" && <AccessibilitySection id={id} node={node} isImg={node.tag === "img"} />}
      {node.kind === "element" && <AttributesSection id={id} node={node} />}
      {node.kind === "element" && <CustomDataSection id={id} node={node} />}
      <HostPanels id={id} node={node} />
    </>
  );
}

/** Host-contributed domain panels (SEO, product-pin, a per-module editor) — ADDITIVE
 *  only, rendered after every built-in Settings section, writing through the SAME
 *  mutation primitives the built-ins use. Absent `host.inspectorPanels` → renders
 *  nothing (a static-site host needs none of this). */
function HostPanels({ id, node }: { id: string; node: Node }) {
  const editor = useEditor();
  const host = useHost();
  const panels = host?.inspectorPanels?.(node) ?? [];
  if (panels.length === 0) return null;
  const ctx: InspectorPanelCtx = {
    setProp: (key, value) => editor.setProp(id, key, value),
    setAttr: (key, value) => editor.setAttr(id, key, value),
    setData: (binding) => editor.setData(id, binding),
    setClass: (className) => editor.setClass(id, className),
  };
  return (
    <>
      {[...panels]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((panel) => (
          <Group key={panel.id} label={panel.title}>
            {panel.render(node, ctx)}
          </Group>
        ))}
    </>
  );
}

/** Identity + semantics: the Navigator name (`label`), the element tag (retag
 *  within its family), the read-only node id (for anchor links / host reference),
 *  and a visibility toggle (a `hidden` class token). */
function ElementSection({ id, node }: { id: string; node: Node }) {
  const editor = useEditor();
  const tag = node.kind === "element" ? node.tag : undefined;
  const family = tag ? familyOf(tag) : undefined;
  const cls = node.kind !== "outlet" ? node.class ?? "" : "";
  const hidden = tokensOf(cls).has("hidden");
  const toggleHidden = (on: boolean) => {
    const t = tokensOf(cls);
    if (on) t.add("hidden");
    else t.delete("hidden");
    editor.setClass(id, [...t].join(" "));
  };
  // Structural lock (host-nodes spec §B). A host lock is host-owned — shown, but
  // the author gets NO unlock; an author lock is theirs to toggle.
  const locked = node.kind !== "outlet" ? node.locked : undefined;
  return (
    <Group label="Element">
      <Row label="Name">
        <CommitInput
          value={node.kind !== "outlet" ? node.label ?? "" : ""}
          reseed={id}
          placeholder={nodeName(node)}
          onCommit={(v) => editor.setLabel(id, v)}
        />
      </Row>
      {tag && family && (
        <Row label="Tag">
          <NativeSelect size="sm" data-testid="settings-tag" value={tag} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => editor.setTag(id, e.target.value)}>
            {family.map((t) => (
              <option key={t} value={t}>
                {`<${t}>`}
              </option>
            ))}
          </NativeSelect>
        </Row>
      )}
      <Row label="ID">
        <div className="flex items-center gap-1">
          <Input className="w-full font-mono text-xs" size="sm" value={id} readOnly spellCheck={false} />
          <button
            type="button"
            title="Copy id"
            className="btn btn-xs btn-ghost flex-none"
            onClick={() => navigator.clipboard?.writeText(id)}
          >
            <Icon name="hash" />
          </button>
        </div>
      </Row>
      <Row label="Visibility">
        <label className="flex items-center gap-2 text-xs text-base-content/60">
          <Toggle size="sm" checked={hidden} onChange={(e: React.ChangeEvent<HTMLInputElement>) => toggleHidden(e.target.checked)} />
          <Icon name={hidden ? "eyeOff" : "eye"} /> {hidden ? "Hidden" : "Visible"}
        </label>
      </Row>
      <Row label="Lock">
        {locked === "host" ? (
          <span
            className="flex items-center gap-2 text-xs text-base-content/60"
            title="Locked by the host — only the host can unlock this region"
            data-testid="settings-lock-host"
          >
            <Icon name="shield" /> Locked by host
          </span>
        ) : (
          <label className="flex items-center gap-2 text-xs text-base-content/60">
            <Toggle
              size="sm"
              data-testid="settings-lock"
              checked={locked === "author"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => editor.setLocked(id, e.target.checked ? "author" : undefined)}
            />
            <Icon name={locked === "author" ? "lock" : "lockOpen"} /> {locked === "author" ? "Locked" : "Unlocked"}
          </label>
        )}
      </Row>
    </Group>
  );
}

/** A static link (`<a>`): href + open-in-new-tab (target/rel) + nofollow. Distinct
 *  from a host action (a Data binding of kind "action"). */
function LinkSection({ id, node }: { id: string; node: ElementNode }) {
  const editor = useEditor();
  const attrs = node.attrs ?? {};
  const href = attrs.href != null ? String(attrs.href) : "";
  const rel = attrs.rel != null ? String(attrs.rel) : "";
  const newTab = attrs.target === "_blank";
  const nofollow = /\bnofollow\b/.test(rel);
  const setRel = (parts: string[]) => editor.setAttr(id, "rel", parts.length ? parts.join(" ") : undefined);
  const setNewTab = (on: boolean) => {
    editor.setAttr(id, "target", on ? "_blank" : undefined);
    // A new tab needs noopener for safety; add/remove it alongside.
    const parts = rel.split(/\s+/).filter(Boolean).filter((p) => p !== "noopener");
    setRel(on ? [...parts, "noopener"] : parts);
  };
  const setNofollow = (on: boolean) => {
    const parts = rel.split(/\s+/).filter(Boolean).filter((p) => p !== "nofollow");
    setRel(on ? [...parts, "nofollow"] : parts);
  };
  return (
    <Group label="Link">
      <Row label="URL">
        <CommitInput value={href} reseed={id} placeholder="https:// or /page or #anchor" onCommit={(v) => editor.setAttr(id, "href", v || undefined)} />
      </Row>
      <Row label="Open in new tab">
        <Toggle size="sm" checked={newTab} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTab(e.target.checked)} />
      </Row>
      <Row label="Nofollow">
        <Toggle size="sm" checked={nofollow} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNofollow(e.target.checked)} />
      </Row>
    </Group>
  );
}

const DATA_KINDS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "None" },
  { value: "value", label: "Value (fill this node)" },
  { value: "html", label: "Rich text / HTML (trusted)" },
  { value: "collection", label: "Collection (repeat children)" },
  { value: "visible", label: "Visible when… (show/hide this node)" },
  { value: "action", label: "Action (host handler)" },
];

/** Flatten a `DataSource` tree into pickable options, deepest-first label path
 *  (`"Products > Price"`) — presentation-only, so it stays local to the picker. */
function flattenSources(sources: readonly DataSource[], pathLabel = ""): Array<{ value: string; label: string }> {
  return sources.flatMap((s) => {
    const label = pathLabel ? `${pathLabel} > ${s.label}` : s.label;
    const own = s.cardinality === "scalar" ? [{ value: s.key, label }] : [];
    const nested = s.fields ? flattenSources(s.fields, label) : [];
    return [...own, ...nested];
  });
}

/** Dynamic content — the node's single `DataBinding`. A kind selector plus an
 *  opaque `ref` (@wizeworks/silicaui never parses it; the host interprets it), an
 *  optional href for the action kind, and (for `value`) an optional target
 *  `attr` — set it to write the resolved value onto a specific attribute/prop
 *  (e.g. `href` on a card's own anchor) instead of the auto-detected primary
 *  slot. For `collection`, a "How many" field sets `limit` (blank = all, and
 *  only a positive integer is written, so a half-typed value never caps a
 *  collection to nothing) and an "Omit when empty" toggle sets `omitWhenEmpty` —
 *  drops the node entirely (like `visible: false`) instead of the default
 *  one-placeholder-item convention when the collection resolves to zero items
 *  (builder-contract.md §3). Lowers to `data-sui-*` in `toHtml`. When the host
 *  supplies `dataSources()`, the Reference field becomes a generic picker
 *  scoped to the node's ancestors (`scopeAt`) instead of a raw text input. */
function DataSection({ id, node }: { id: string; node: Node }) {
  const editor = useEditor();
  const host = useHost();
  const data = node.kind !== "outlet" ? node.data : undefined;

  // Current state as one bag. Every per-kind field reads from here, so switching
  // kinds keeps what still applies (the ref, above all) instead of resetting.
  const current = {
    kind: data?.kind ?? "",
    ref: data?.ref ?? "",
    href: data?.kind === "action" ? data.href ?? "" : "",
    attr: data?.kind === "value" ? data.attr ?? "" : "",
    omitWhenEmpty: data?.kind === "collection" ? (data.omitWhenEmpty ?? false) : false,
    // Held as the RAW string the field contains, not a number: an empty box has
    // to mean "no limit" and survive a keystroke that leaves it momentarily
    // blank, which `0` and `NaN` both fail to express.
    limit: data?.kind === "collection" && data.limit != null ? String(data.limit) : "",
    negate: data?.kind === "visible" ? (data.negate ?? false) : false,
  };
  const { kind, ref, href, attr, omitWhenEmpty, limit, negate } = current;

  /** Commit a PATCH over the current binding — a bag, not six positional args,
   *  so adding a per-kind field doesn't rewrite every call site. */
  const write = (patch: Partial<typeof current>) => {
    const next = { ...current, ...patch };
    if (!next.kind) return editor.setData(id, undefined);
    if (next.kind === "action") {
      const b: DataBinding = { kind: "action", ref: next.ref };
      if (next.href) b.href = next.href;
      return editor.setData(id, b);
    }
    if (next.kind === "value") {
      const b: DataBinding = { kind: "value", ref: next.ref };
      if (next.attr) b.attr = next.attr;
      return editor.setData(id, b);
    }
    if (next.kind === "html") return editor.setData(id, { kind: "html", ref: next.ref });
    if (next.kind === "visible") {
      const b: DataBinding = { kind: "visible", ref: next.ref };
      if (next.negate) b.negate = true;
      return editor.setData(id, b);
    }
    const b: DataBinding = { kind: "collection", ref: next.ref };
    if (next.omitWhenEmpty) b.omitWhenEmpty = true;
    // Only a positive integer becomes a limit; blank, 0 and junk all mean "no
    // cap" and leave the key OFF the binding entirely, so an untouched control
    // never adds a field to the document.
    const n = Number(next.limit);
    if (next.limit.trim() !== "" && Number.isInteger(n) && n >= 1) b.limit = n;
    return editor.setData(id, b);
  };
  const options = React.useMemo(() => {
    if (!host?.dataSources) return undefined;
    const scoped = scopeAt(host.dataSources(), editor.ancestorsOf(id));
    return kind === "collection"
      ? scoped.filter((s) => s.cardinality !== "scalar").map((s) => ({ value: s.key, label: s.label }))
      : flattenSources(scoped);
  }, [host, editor, id, kind]);
  return (
    <Group label="Data binding">
      <Row label="Bind">
        <NativeSelect data-testid="data-kind" size="sm" value={kind} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => write({ kind: e.target.value })}>
          {DATA_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </NativeSelect>
      </Row>
      {kind && (
        <Row label="Reference">
          {options ? (
            <NativeSelect data-testid="data-ref-picker" size="sm" value={ref} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => write({ ref: e.target.value })}>
              <option value="">Choose a field…</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <CommitInput value={ref} reseed={id} placeholder="host data reference" mono onCommit={(v) => write({ ref: v })} />
          )}
        </Row>
      )}
      {kind === "collection" && (
        <Row label="How many">
          <CommitInput
            value={limit}
            reseed={id}
            type="number"
            placeholder="All"
            testId="data-limit"
            onCommit={(v) => write({ limit: v })}
          />
        </Row>
      )}
      {kind === "collection" && (
        <Row label="Omit when empty">
          <label className="flex items-center gap-2 text-xs text-base-content">
            <Toggle
              size="sm"
              checked={omitWhenEmpty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => write({ omitWhenEmpty: e.target.checked })}
            />
            {omitWhenEmpty ? "Node is dropped" : "Renders a placeholder"}
          </label>
        </Row>
      )}
      {kind === "visible" && (
        <Row label="Condition">
          <label className="flex items-center gap-2 text-xs text-base-content" data-testid="data-visible-negate">
            <Toggle size="sm" checked={negate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => write({ negate: e.target.checked })} />
            {negate ? "Shown when EMPTY" : "Shown when it has a value"}
          </label>
        </Row>
      )}
      {kind === "action" && (
        <Row label="Fallback href">
          <CommitInput value={href} reseed={id} placeholder="optional link fallback" onCommit={(v) => write({ href: v })} />
        </Row>
      )}
      {kind === "value" && (
        <Row label="Target attribute">
          <CommitInput
            value={attr}
            reseed={id}
            placeholder="auto-detected (e.g. leave blank for text/src)"
            mono
            onCommit={(v) => write({ attr: v })}
          />
        </Row>
      )}
      {kind && kind !== "action" && ref && (
        <DataPreview id={id} kind={kind} ref_={ref} omitWhenEmpty={omitWhenEmpty} limit={limit} negate={negate} />
      )}
    </Group>
  );
}

/**
 * The host returned `undefined` — it doesn't know this ref at all (§A of
 * data-resolution-and-brand-mark.md). Say so in as many words: this exact
 * silence is what made a consumer spend an afternoon misdiagnosing an empty
 * span as a ref-path bug. The node keeps its authored content, so name that
 * too — otherwise "unknown" reads as "your page is broken".
 */
function UnknownRef({ ref_ }: { ref_: string }) {
  return (
    <Row label="Preview">
      <p className="text-xs text-error" data-testid="data-unknown-ref">
        Unknown ref <code className="kbd kbd-xs">{ref_}</code> — this host doesn&rsquo;t resolve it. The authored content
        renders instead.
      </p>
    </Row>
  );
}

/**
 * A live preview of what this bind/repeat resolves to RIGHT NOW, using the
 * host's own `resolveBinding`/`resolveCollection` (§3) — so an author sees
 * realistic data while editing, without leaving the canvas. Only meaningful at
 * top-level scope (`{}`); a bind nested under a `repeat` ancestor has no single
 * representative item to preview, so it says so rather than guessing one.
 */
function DataPreview({
  id,
  kind,
  ref_,
  omitWhenEmpty,
  limit,
  negate,
}: {
  id: string;
  kind: string;
  ref_: string;
  omitWhenEmpty?: boolean;
  /** The raw field value — parsed here through the SAME clamp the resolver uses. */
  limit?: string;
  negate?: boolean;
}) {
  const editor = useEditor();
  const host = useHost();
  const nestedUnderRepeat = React.useMemo(
    () => editor.ancestorsOf(id).some((a) => a.kind !== "outlet" && a.data?.kind === "collection"),
    [editor, id],
  );
  if (nestedUnderRepeat) {
    return (
      <Row label="Preview">
        <p className="text-xs text-base-content/45">No preview — this is nested inside a repeat, one per item.</p>
      </Row>
    );
  }
  if (kind === "value") {
    if (!host?.resolveBinding) return null;
    const resolved = host.resolveBinding(ref_, {});
    if (!resolved) return <UnknownRef ref_={ref_} />;
    return (
      <Row label="Preview">
        <p className="truncate text-xs text-base-content/70" data-testid="data-preview">
          {resolved.visible === false ? (
            <em className="text-base-content/45">hidden (visible: false)</em>
          ) : (
            String(resolved.value ?? "")
          )}
        </p>
      </Row>
    );
  }
  if (kind === "html") {
    if (!host?.resolveBinding) return null;
    const resolved = host.resolveBinding(ref_, {});
    if (!resolved) return <UnknownRef ref_={ref_} />;
    const raw = resolved.visible === false ? "" : String(resolved.value ?? "");
    return (
      <Row label="Preview">
        <p className="truncate text-xs text-base-content/70" title="Trusted HTML — the host must sanitize this value at its data boundary">
          {resolved.visible === false ? (
            <em className="text-base-content/45">hidden (visible: false)</em>
          ) : raw ? (
            `${raw.length} chars of trusted HTML`
          ) : (
            <em className="text-base-content/45">empty</em>
          )}
        </p>
      </Row>
    );
  }
  if (kind === "visible") {
    if (!host?.resolveBinding) return null;
    const resolved = host.resolveBinding(ref_, {});
    if (!resolved) return <UnknownRef ref_={ref_} />;
    // Mirrors `isPresent` in the resolver. Kept in step by the shared rule being
    // short and stated: nothing / "" / false / [] is absent, everything else —
    // including 0 — is present.
    const v = resolved.value;
    const present =
      resolved.visible === false ? false : Array.isArray(v) ? v.length > 0 : !(v == null || v === false || v === "");
    const shown = negate ? !present : present;
    return (
      <Row label="Preview">
        <p className="text-xs text-base-content" data-testid="data-preview">
          {shown ? "Shown — the node renders" : "Hidden — the node and its children are dropped"}
        </p>
      </Row>
    );
  }
  if (kind === "collection") {
    if (!host?.resolveCollection) return null;
    const all = host.resolveCollection(ref_, {});
    if (!all) return <UnknownRef ref_={ref_} />;
    // The clamp the resolver will apply, not a re-implementation of it — so
    // this row can never claim a count the published page contradicts. It also
    // names what was CAPPED: "4 items" when the source has 30 reads as a data
    // problem; "4 of 30" reads as the setting the author just typed.
    const items = applyCollectionLimit(all, Number(limit));
    const capped = items.length < all.length;
    return (
      <Row label="Preview">
        <p className="text-xs text-base-content/70" data-testid="data-collection-preview">
          {items.length === 0
            ? omitWhenEmpty
              ? "0 items — the node is omitted entirely"
              : "0 items — the template renders once as a placeholder"
            : capped
              ? `${items.length} of ${all.length} items — limited`
              : `${items.length} item${items.length === 1 ? "" : "s"}`}
        </p>
      </Row>
    );
  }
  return null;
}

/** Accessibility attributes on an element — aria-label, role, tabindex, and (for
 *  images) alt text. Each writes a whitelisted `attr` the projection emits verbatim. */
function AccessibilitySection({ id, node, isImg }: { id: string; node: ElementNode; isImg: boolean }) {
  const editor = useEditor();
  const attrs = node.attrs ?? {};
  const val = (k: string) => (attrs[k] != null ? String(attrs[k]) : "");
  const set = (k: string) => (v: string) => editor.setAttr(id, k, v || undefined);
  return (
    <Group label="Accessibility">
      {isImg && (
        <AssetProp
          id={id}
          field={{ key: "src", label: "Source", control: "asset" }}
          value={val("src")}
          onPick={(asset) =>
            // One action, so a picked image lands as a single undo step — and so
            // the variants can never persist without the src they describe.
            editor.batch(() => {
              editor.setAttr(id, "src", asset.url || undefined);
              editor.setAttr(id, "srcset", asset.srcset || undefined);
              editor.setAttr(id, "sizes", asset.sizes || undefined);
              if (asset.alt) editor.setAttr(id, "alt", asset.alt);
            })
          }
        />
      )}
      {isImg && (
        <Row label="Alt text">
          <CommitInput value={val("alt")} reseed={id} placeholder="Describe the image" onCommit={set("alt")} />
        </Row>
      )}
      <Row label="ARIA label">
        <CommitInput value={val("aria-label")} reseed={id} placeholder="Accessible name" onCommit={set("aria-label")} />
      </Row>
      <Row label="Role">
        <CommitInput value={val("role")} reseed={id} placeholder="e.g. button, region" onCommit={set("role")} />
      </Row>
      <Row label="Tab index">
        <CommitInput value={val("tabindex")} reseed={id} type="number" placeholder="0, -1" onCommit={set("tabindex")} />
      </Row>
    </Group>
  );
}

/** Common HTML attributes — the DOM id (for anchor targets) and title tooltip. */
function AttributesSection({ id, node }: { id: string; node: ElementNode }) {
  const editor = useEditor();
  const attrs = node.attrs ?? {};
  const val = (k: string) => (attrs[k] != null ? String(attrs[k]) : "");
  const set = (k: string) => (v: string) => editor.setAttr(id, k, v || undefined);
  return (
    <Group label="Attributes">
      <Row label="DOM id (anchor target)">
        <CommitInput value={val("id")} reseed={id} placeholder="pricing" mono onCommit={set("id")} />
      </Row>
      <Row label="Title (tooltip)">
        <CommitInput value={val("title")} reseed={id} onCommit={set("title")} />
      </Row>
    </Group>
  );
}

/** Custom `data-*` attributes — a freeform key/value list stored in `attrs` under
 *  the `data-` prefix. Editing a key renames the attribute; blanking a row (or its
 *  key) removes it. A trailing blank row adds a new pair. */
function CustomDataSection({ id, node }: { id: string; node: ElementNode }) {
  const attrs = node.attrs ?? {};
  const pairs = Object.entries(attrs)
    .filter(([k]) => k.startsWith("data-"))
    .map(([k, v]) => ({ key: k.slice("data-".length), value: String(v) }));
  return (
    <Group label="Custom data">
      {pairs.length === 0 && (
        <p className="mb-2 text-xs text-base-content/45">Add <code className="font-mono">data-*</code> attributes for host scripts.</p>
      )}
      {pairs.map((p) => (
        <CustomDataRow key={p.key} id={id} attrs={attrs} existingKey={p.key} value={p.value} />
      ))}
      <CustomDataRow id={id} attrs={attrs} existingKey={null} value="" />
    </Group>
  );
}

/** One `data-*` row. An existing row edits/renames/clears its attribute; the blank
 *  trailing row (existingKey === null) creates a new one once both fields are set. */
function CustomDataRow({
  id,
  attrs,
  existingKey,
  value,
}: {
  id: string;
  attrs: Record<string, string | number | boolean>;
  existingKey: string | null;
  value: string;
}) {
  const editor = useEditor();
  const [k, setK] = React.useState(existingKey ?? "");
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    setK(existingKey ?? "");
    setV(value);
  }, [existingKey, value, id]);

  const commit = () => {
    const key = k.trim().replace(/^data-/, "");
    if (existingKey) {
      // An existing row: a blank key removes it; a changed key renames it.
      if (!key) return editor.setAttr(id, `data-${existingKey}`, undefined);
      if (key !== existingKey) editor.setAttr(id, `data-${existingKey}`, undefined);
      editor.setAttr(id, `data-${key}`, v);
      return;
    }
    // The creator row materializes only once it has a key — and only from the
    // VALUE field, so tabbing key→value doesn't write a half-filled pair.
    if (!key) return;
    editor.setAttr(id, `data-${key}`, v);
    setK("");
    setV("");
  };
  return (
    <div className="mb-1.5 flex items-center gap-1 last:mb-0">
      <Input
        className="w-2/5 font-mono text-xs"
        size="sm"
        value={k}
        placeholder="key"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setK(e.target.value)}
        onBlur={existingKey !== null ? commit : undefined}
      />
      <Input
        className="flex-1 text-xs"
        size="sm"
        value={v}
        placeholder="value"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {existingKey !== null && (
        <button
          type="button"
          title="Remove"
          className="btn btn-xs btn-ghost flex-none text-error"
          onClick={() => editor.setAttr(id, `data-${existingKey}`, undefined)}
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}

/**
 * The panel for a selected symbol INSTANCE: rename the component (propagates to
 * the roster + every instance's label), open its master for editing, or detach
 * this one into an independent copy. No style controls — an instance's own wrapper
 * doesn't survive to output, so editing happens on the master.
 */
function InstancePanel({ id, symbolId, node }: { id: string; symbolId: string; node: Node }) {
  const editor = useEditor();
  const sym = editor.symbol(symbolId);
  const name = sym?.name ?? (node.kind !== "outlet" ? node.label : undefined) ?? "Component";
  const [draft, setDraft] = React.useState(name);
  React.useEffect(() => setDraft(name), [name, id]);
  const commitName = () => {
    if (draft.trim() && draft !== name) editor.renameSymbol(symbolId, draft.trim());
  };
  return (
    <div className="flex-1 min-h-0 overflow-auto" data-testid="instance-panel">
      <IdentityHeader node={node} />
      <Group label="Component instance">
        <p className="mb-2 text-xs text-base-content/55">
          A linked copy of <span className="font-medium text-base-content/80">{name}</span>. Edit the component to
          change every instance.
        </p>
        <Row label="Name">
          <Input
            className="w-full"
            size="sm"
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitName();
              }
            }}
          />
        </Row>
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm btn-primary flex-1" onClick={() => editor.enterSymbol(symbolId)}>
            Edit component
          </button>
          <button type="button" className="btn btn-sm btn-ghost flex-1" onClick={() => editor.detachInstance(id)}>
            Detach
          </button>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-ghost w-full mt-2 text-error"
          title="Delete this component everywhere — every instance is unlinked into a real copy"
          onClick={() => editor.deleteSymbol(symbolId)}
        >
          <Icon name="trash" /> Delete component
        </button>
      </Group>
      <OverridesGroup instanceId={id} node={node} symbolId={symbolId} />
      <Group label="Node">
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm btn-ghost flex-1" onClick={() => editor.duplicate(id)}>
            Duplicate
          </button>
          <button type="button" className="btn btn-sm btn-ghost flex-1 text-error" onClick={() => editor.remove(id)}>
            Delete
          </button>
        </div>
      </Group>
    </div>
  );
}

function IdentityHeader({ node }: { node: Node }) {
  const kindLabel =
    node.kind === "component" ? "Component" : node.kind === "element" ? `<${node.tag}>` : "Outlet";
  return (
    <div className="flex items-center gap-2 px-3.5 py-3 border-b border-base-200">
      <span className="grid size-7 flex-none place-items-center rounded-field bg-base-200 text-base-content/70">
        <Icon name={nodeIconName(node)} />
      </span>
      <div className="min-w-0">
        <div className="font-semibold truncate">{nodeName(node)}</div>
        <div className="text-xs text-base-content/45 truncate">{kindLabel}</div>
      </div>
    </div>
  );
}

/** One override target discovered on a symbol master: a text-bearing node. */
interface OverrideTarget {
  masterId: string;
  label: string;
  text: string;
}

/** The master's text-bearing nodes — the fields an instance can override. */
function overrideTargets(masterRoot: Node): OverrideTarget[] {
  const out: OverrideTarget[] = [];
  walk(masterRoot, (n) => {
    if (n.kind === "outlet" || !n.id) return;
    const text = editableText(n);
    if (text !== undefined) out.push({ masterId: n.id, label: nodeName(n), text });
  });
  return out;
}

/**
 * Per-instance overrides — a field per text-bearing node in the master. Typing a
 * value overrides just THIS instance (an overridden field is immune to later
 * master edits); clearing it (or matching the master's text) removes the override.
 */
function OverridesGroup({ instanceId, node, symbolId }: { instanceId: string; node: Node; symbolId: string }) {
  const editor = useEditor();
  const master = editor.symbol(symbolId)?.root;
  const targets = master ? overrideTargets(master) : [];
  const overrides = node.kind !== "outlet" ? node.overrides : undefined;
  if (targets.length === 0) return null;
  return (
    <Group label="Overrides">
      <p className="mb-2 text-xs text-base-content/45">Customize this instance without detaching.</p>
      {targets.map((t) => (
        <OverrideRow
          key={t.masterId}
          instanceId={instanceId}
          target={t}
          current={overrides?.[t.masterId]?.text}
        />
      ))}
    </Group>
  );
}

/** One override field: seeded with the master default; commits on blur/Enter. A
 *  reset (•) appears when the field diverges, clearing the override. */
function OverrideRow({
  instanceId,
  target,
  current,
}: {
  instanceId: string;
  target: OverrideTarget;
  current: string | undefined;
}) {
  const editor = useEditor();
  const value = current ?? target.text;
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, instanceId, target.masterId]);
  const commit = () => {
    if (draft === value) return;
    // Empty or back-to-master → clear the override; else record it.
    editor.setInstanceOverrideText(instanceId, target.masterId, draft === "" || draft === target.text ? undefined : draft);
  };
  return (
    <Row label={target.label}>
      <div className="flex items-center gap-1">
        <Input
          className="w-full"
          size="sm"
          value={draft}
          placeholder={target.text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        {current !== undefined && (
          <button
            type="button"
            title="Reset to component default"
            className="btn btn-xs btn-ghost flex-none text-secondary"
            onClick={() => editor.setInstanceOverrideText(instanceId, target.masterId, undefined)}
          >
            <Icon name="undo" />
          </button>
        )}
      </div>
    </Row>
  );
}

/** Live-editable text content (a heading's words, a button's label). Commits on
 *  blur / Enter so a keystroke isn't its own undo step. */
function ContentField({ id, node }: { id: string; node: Node }) {
  const editor = useEditor();
  const value = editableText(node) ?? "";
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, id]);
  const commit = () => {
    if (draft !== value) editor.setText(id, draft);
  };
  return (
    <Group label="Content">
      <Input
        className="w-full"
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
    </Group>
  );
}

// ── form-control props ────────────────────────────────────────────────────────
/** The recognized-family block for a form control — its editable `props`. */
function PropsGroup({ id, node }: { id: string; node: ComponentNode }) {
  const fields = COMPONENT_PROPS[node.component];
  if (!fields) return null;
  return (
    <Group label={node.component}>
      {fields.map((f) => (
        <PropRow key={f.key} id={id} node={node} field={f} />
      ))}
      {node.component === "Select" && <OptionsProp id={id} node={node} />}
      {node.component === "SelectionList" && <SelectionListItemsProp id={id} node={node} />}
    </Group>
  );
}

/**
 * The Host panel (spec §A.5) — prop controls declared by the selected host
 * node's `HostComponentDef`. Absent def (the host doesn't declare this
 * component) or no declared props → a short note. Writes through `setProp`, the
 * SAME mutation path component props use.
 */
function HostSection({ id, node }: { id: string; node: HostNode }) {
  const host = useHost();
  const def = host?.hostComponents?.().find((d) => d.name === node.component);
  const fields = def?.props ?? [];
  return (
    <Group label={`Host · ${def?.label ?? node.component}`}>
      {fields.length === 0 ? (
        <p className="text-xs text-base-content/45" data-testid="host-no-props">
          No editable props declared for “{node.component}”.
        </p>
      ) : (
        fields.map((f) => <HostPropRow key={f.name} id={id} node={node} field={f} />)
      )}
    </Group>
  );
}

/** One host-prop editor — a toggle, a fixed dropdown, or a committed text/number
 *  input, mapped from `HostPropDef.type`. `color`/`binding` fall back to a text
 *  field in v1 (data-bound props are a later revision). */
function HostPropRow({ id, node, field }: { id: string; node: HostNode; field: HostPropDef }) {
  const editor = useEditor();
  const raw = node.props?.[field.name];
  const label = field.label ?? field.name;

  if (field.type === "boolean") {
    return (
      <Row label={label}>
        <Toggle
          size="sm"
          data-testid={`host-prop:${field.name}`}
          checked={raw === true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => editor.setProp(id, field.name, e.target.checked || undefined)}
        />
      </Row>
    );
  }
  if (field.type === "select") {
    const value = raw != null ? String(raw) : field.options?.[0]?.value ?? "";
    return (
      <Row label={label}>
        <NativeSelect
          size="sm"
          data-testid={`host-prop:${field.name}`}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => editor.setProp(id, field.name, e.target.value)}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </Row>
    );
  }
  return <HostTextProp id={id} field={field} value={raw != null ? String(raw) : ""} />;
}

/** A committed text/number/color input for a host prop — number coerces, empty
 *  clears the prop. Debounced to blur/Enter so a keystroke isn't a history entry. */
function HostTextProp({ id, field, value }: { id: string; field: HostPropDef; value: string }) {
  const editor = useEditor();
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, id]);
  const commit = () => {
    if (draft === value) return;
    if (field.type === "number") {
      const trimmed = draft.trim();
      const n = trimmed === "" ? undefined : Number(trimmed);
      editor.setProp(id, field.name, n != null && !Number.isNaN(n) ? n : undefined);
    } else {
      editor.setProp(id, field.name, draft || undefined);
    }
  };
  return (
    <Row label={field.label ?? field.name}>
      <Input
        className="w-full"
        size="sm"
        type={field.type === "number" ? "number" : "text"}
        data-testid={`host-prop:${field.name}`}
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
    </Row>
  );
}

/** One prop editor — a toggle, a fixed dropdown, or a debounced text/number input. */
function PropRow({ id, node, field }: { id: string; node: ComponentNode; field: PropField }) {
  const editor = useEditor();
  const raw = node.props?.[field.key];

  if (field.control === "toggle") {
    return (
      <Row label={field.label}>
        <Toggle
          size="sm"
          checked={raw === true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            editor.setProp(id, field.key, e.target.checked || undefined)
          }
        />
      </Row>
    );
  }
  if (field.control === "select") {
    const value = raw != null ? String(raw) : field.options?.[0] ?? "";
    return (
      <Row label={field.label}>
        <NativeSelect
          size="sm"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            editor.setProp(id, field.key, e.target.value)
          }
        >
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </NativeSelect>
      </Row>
    );
  }
  if (field.control === "list") {
    return <ListProp id={id} field={field} value={node.props?.[field.key]} />;
  }
  if (field.control === "asset") {
    return (
      <AssetProp
        value={raw != null ? String(raw) : ""}
        onPick={(asset) =>
          editor.batch(() => {
            editor.setProp(id, field.key, asset.url || undefined);
            // Only the PRIMARY source field carries responsive variants — a
            // component's secondary asset props (a poster, a fallback) have no
            // `srcset` in their expansion to receive them.
            if (field.key === "src") {
              editor.setProp(id, "srcset", asset.srcset || undefined);
              editor.setProp(id, "sizes", asset.sizes || undefined);
            }
          })
        }
        field={field}
        id={id}
      />
    );
  }
  return <TextProp id={id} field={field} value={raw != null ? String(raw) : ""} />;
}

/**
 * A URL field with an optional "Browse" button when the host supplies
 * `pickAsset` — without a host, it's a plain text field (paste a URL).
 *
 * `onPick` receives the whole picked asset, not just its URL, because a host's
 * picker can hand back the responsive variants it already generated
 * (`srcset`/`sizes`). Typing a URL by hand yields `{ url }` alone — and clears
 * any variants that were there, since they described a different image.
 */
function AssetProp({
  id,
  field,
  value,
  onPick,
}: {
  id: string;
  field: PropField;
  value: string;
  onPick: (asset: AssetRef) => void;
}) {
  const host = useHost();
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, id]);
  const commit = () => {
    if (draft !== value) onPick({ url: draft });
  };
  const browse = async () => {
    const asset = await host?.pickAsset?.("image");
    if (asset) {
      setDraft(asset.url);
      onPick(asset);
    }
  };
  return (
    <Row label={field.label}>
      <div className="flex items-center gap-1">
        <Input
          className="w-full"
          size="sm"
          value={draft}
          placeholder={field.placeholder ?? "https://…"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        {host?.pickAsset && (
          <button type="button" className="btn btn-xs btn-ghost flex-none" title="Browse…" onClick={() => void browse()}>
            <Icon name="image" />
          </button>
        )}
      </div>
    </Row>
  );
}

/** A string-list prop (Breadcrumb/Menu/Steps/Timeline items) — one item per line,
 *  committed on blur / Cmd+Enter into the `props[key]` string array `expand()` reads. */
function ListProp({ id, field, value }: { id: string; field: PropField; value: unknown }) {
  const editor = useEditor();
  const text = listToText(value);
  const [draft, setDraft] = React.useState(text);
  React.useEffect(() => setDraft(text), [text, id]);
  const commit = () => {
    if (draft === text) return;
    const items = textToList(draft);
    editor.setProp(id, field.key, items.length ? items : undefined);
  };
  return (
    <Row label={field.label}>
      <Textarea
        className="w-full text-xs"
        rows={4}
        spellCheck={false}
        placeholder={"One item per line"}
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
        }}
      />
    </Row>
  );
}

/** `props.items` (string array) ↔ the newline-list editor text. */
function listToText(value: unknown): string {
  return Array.isArray(value) ? value.map(String).join("\n") : "";
}
function textToList(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A text/number prop — draft state committed on blur/Enter (one undo step). An
 *  empty value clears the prop (deletes the key), so it falls back to its default. */
function TextProp({ id, field, value }: { id: string; field: PropField; value: string }) {
  const editor = useEditor();
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, id]);
  const commit = () => {
    if (draft === value) return;
    if (field.control === "number") {
      const n = draft.trim() === "" ? undefined : Number(draft);
      editor.setProp(id, field.key, n != null && Number.isFinite(n) ? n : undefined);
    } else {
      editor.setProp(id, field.key, draft === "" ? undefined : draft);
    }
  };
  return (
    <Row label={field.label}>
      <Input
        className="w-full"
        size="sm"
        type={field.control === "number" ? "number" : "text"}
        value={draft}
        placeholder={field.placeholder}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
    </Row>
  );
}

/** Select options as a newline list ("value | label", or one token for both).
 *  Commits on blur / Cmd+Enter into the `props.options` array `expand()` reads. */
function OptionsProp({ id, node }: { id: string; node: ComponentNode }) {
  const editor = useEditor();
  const value = optionsToText(node.props?.options);
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, id]);
  const commit = () => {
    if (draft !== value) editor.setProp(id, "options", textToOptions(draft));
  };
  return (
    <Row label="Options">
      <Textarea
        className="w-full text-xs"
        rows={4}
        spellCheck={false}
        placeholder={"One per line —\nvalue | Label"}
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
        }}
      />
    </Row>
  );
}

/** `props.options` (objects or strings) → the newline-list editor text. */
function optionsToText(options: unknown): string {
  if (!Array.isArray(options)) return "";
  return options
    .map((o) => {
      if (o != null && typeof o === "object") {
        const oo = o as { value?: unknown; label?: unknown };
        const label = oo.label != null ? String(oo.label) : "";
        const val = oo.value != null ? String(oo.value) : "";
        return val && val !== label ? `${val} | ${label}` : label || val;
      }
      return String(o);
    })
    .join("\n");
}

/** The editor text → a `props.options` array of `{ value, label }`. */
function textToOptions(text: string): Array<{ value: string; label: string }> {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [a, b] = line.split("|").map((s) => s.trim());
      return b ? { value: a ?? "", label: b } : { value: a ?? "", label: a ?? "" };
    });
}

/** SelectionList `props.items` (`{id,label,description?}[]`) as "id | Label |
 *  Description" lines, plus `props.selected` as a comma-separated id list. */
function SelectionListItemsProp({ id, node }: { id: string; node: ComponentNode }) {
  const editor = useEditor();
  const itemsText = selectionItemsToText(node.props?.items);
  const [itemsDraft, setItemsDraft] = React.useState(itemsText);
  React.useEffect(() => setItemsDraft(itemsText), [itemsText, id]);
  const commitItems = () => {
    if (itemsDraft !== itemsText) editor.setProp(id, "items", textToSelectionItems(itemsDraft));
  };

  const selectedText = idsToText(node.props?.selected);
  const [selectedDraft, setSelectedDraft] = React.useState(selectedText);
  React.useEffect(() => setSelectedDraft(selectedText), [selectedText, id]);
  const commitSelected = () => {
    if (selectedDraft !== selectedText) editor.setProp(id, "selected", textToIds(selectedDraft));
  };

  return (
    <>
      <Row label="Items">
        <Textarea
          className="w-full text-xs"
          rows={4}
          spellCheck={false}
          placeholder={"One per line —\nid | Label | Description"}
          value={itemsDraft}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemsDraft(e.target.value)}
          onBlur={commitItems}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              commitItems();
            }
          }}
        />
      </Row>
      <Row label="Selected ids">
        <Input
          className="w-full"
          size="sm"
          placeholder="e.g. pro"
          value={selectedDraft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDraft(e.target.value)}
          onBlur={commitSelected}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitSelected();
            }
          }}
        />
      </Row>
    </>
  );
}

/** `props.items` (SelectionList) ↔ "id | Label | Description" editor text. */
function selectionItemsToText(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return items
    .map((raw) => {
      if (raw == null || typeof raw !== "object") return String(raw);
      const o = raw as { id?: unknown; label?: unknown; description?: unknown };
      const id = o.id != null ? String(o.id) : "";
      const label = o.label != null ? String(o.label) : id;
      const desc = o.description != null ? String(o.description) : "";
      const parts = [id, label, desc];
      while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
      return parts.join(" | ");
    })
    .join("\n");
}

/** The editor text → a `props.items` array of `{ id, label, description? }`. */
function textToSelectionItems(
  text: string,
): Array<{ id: string; label: string; description?: string }> {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [a, b, c] = line.split("|").map((s) => s.trim());
      const id = a ?? "";
      const label = b || id;
      return c ? { id, label, description: c } : { id, label };
    });
}

/** `props.selected` (SelectionList) ↔ a comma-separated id list. */
function idsToText(ids: unknown): string {
  return Array.isArray(ids) ? ids.map(String).join(", ") : "";
}
function textToIds(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The raw class string — the low tier. Commits on blur / Enter so a half-typed
 *  utility never fights the semantic chips mid-keystroke. */
function ClassField({ id, cls }: { id: string; cls: string }) {
  const editor = useEditor();
  const [draft, setDraft] = React.useState(cls);
  const [error, setError] = React.useState<string | undefined>(undefined);
  // Re-seed when the selection (or the class from a chip edit) changes.
  React.useEffect(() => {
    setDraft(cls);
    setError(undefined);
  }, [cls, id]);
  // Classes with no backing CSS render nothing, silently — surface them so an
  // unscannable utility (e.g. a responsive `@2xl:` variant not in the safelist)
  // reads as a fixable problem instead of a mystery no-op. Checks the COMMITTED
  // class, not the draft, so it reflects what's actually applied.
  const unbacked = React.useMemo(() => unbackedClasses(cls), [cls]);
  React.useEffect(() => {
    for (const c of unbacked) {
      if (warnedClasses.has(c)) continue;
      warnedClasses.add(c);
      console.warn(
        `[silicaui-builder] class "${c}" has no backing CSS — it renders nothing. ` +
          `If it's a utility, add it to your Tailwind safelist (see @wizeworks/silicaui-builder/vocab).`,
      );
    }
  }, [unbacked]);
  const commit = () => {
    if (draft === cls) return;
    const result = editor.setClass(id, draft);
    // A rejected string (the built-in denylist floor, or a host policy) is a
    // no-op on the document — keep the user's draft on screen with the reason
    // rather than silently reverting it, so they can see what to fix.
    setError(result.ok ? undefined : result.reason);
  };
  return (
    <Group label="Classes">
      <Textarea
        className={`w-full font-mono text-xs leading-relaxed ${error ? "textarea-error" : ""}`}
        rows={3}
        spellCheck={false}
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
        }}
      />
      {error ? (
        <p className="mt-1 text-xs text-error">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-base-content/40">The one styling surface. Chips above edit this same set.</p>
      )}
      {unbacked.length > 0 && (
        <p className="mt-1 text-xs text-warning" data-testid="unbacked-classes">
          No CSS found for{" "}
          {unbacked.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && ", "}
              <code className="font-mono">{c}</code>
            </React.Fragment>
          ))}
          {" "}— {unbacked.length === 1 ? "it renders" : "they render"} nothing. Add to your Tailwind safelist.
        </p>
      )}
    </Group>
  );
}
