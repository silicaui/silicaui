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
import { rolesOf, colorValue, SURFACE_TOKENS, scopeAt, walk } from "@wizeworks/silicaui-html";
import { Input, Textarea, Toggle, NativeSelect, EmptyState, ToggleGroup, ToggleGroupItem } from "@wizeworks/silicaui-react";
import { useEditor, useSelectedNode, useTheme } from "./editor-context";
import { useHost } from "./host-context";
import type { HostPropDef, InspectorPanelCtx } from "./host";
import { Icon } from "../../shared/react/Icon";
import { nodeIconName, nodeName, editableText } from "../node-display";

// ── class-set helpers ────────────────────────────────────────────────────────
const tokensOf = (cls: string | undefined): Set<string> => new Set((cls ?? "").split(/\s+/).filter(Boolean));
/** Which member of `group` the class currently wears ("" = none). */
const activeIn = (cls: string | undefined, group: readonly string[]): string =>
  group.find((c) => tokensOf(cls).has(c)) ?? "";

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

// ── control vocab (LITERAL classes — this block IS the canvas safelist) ───────
const FONT_SIZE: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "text-xs", label: "XS" },
  { cls: "text-sm", label: "SM" },
  { cls: "text-md", label: "MD" },
  { cls: "text-lg", label: "LG" },
  { cls: "text-xl", label: "XL" },
  { cls: "text-2xl", label: "2XL" },
  { cls: "text-3xl", label: "3XL" },
  { cls: "text-4xl", label: "4XL" },
  { cls: "text-5xl", label: "5XL" },
];
const WEIGHT: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "font-normal", label: "Normal" },
  { cls: "font-medium", label: "Medium" },
  { cls: "font-semibold", label: "Semibold" },
  { cls: "font-bold", label: "Bold" },
];
const ALIGN: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "text-left", label: "Left" },
  { cls: "text-center", label: "Center" },
  { cls: "text-right", label: "Right" },
];
const PADDING: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "p-0", label: "0" },
  { cls: "p-2", label: "2" },
  { cls: "p-4", label: "4" },
  { cls: "p-6", label: "6" },
  { cls: "p-8", label: "8" },
];
const RADIUS: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "rounded-none", label: "None" },
  { cls: "rounded-field", label: "Field" },
  { cls: "rounded-box", label: "Box" },
  { cls: "rounded-full", label: "Full" },
];
// Sizing utilities a layout object can wear. Literal strings (the canvas safelist).
const WIDTH: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "w-full", label: "Full" },
  { cls: "w-1/2", label: "1/2" },
  { cls: "w-1/3", label: "1/3" },
  { cls: "w-2/3", label: "2/3" },
  { cls: "w-fit", label: "Fit" },
];
const MAX_WIDTH: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "max-w-none", label: "None" },
  { cls: "max-w-xs", label: "XS" },
  { cls: "max-w-sm", label: "SM" },
  { cls: "max-w-md", label: "MD" },
  { cls: "max-w-lg", label: "LG" },
  { cls: "max-w-xl", label: "XL" },
  { cls: "max-w-2xl", label: "2XL" },
  { cls: "max-w-3xl", label: "3XL" },
  { cls: "max-w-4xl", label: "4XL" },
  { cls: "max-w-5xl", label: "5XL" },
  { cls: "max-w-full", label: "Full" },
];
// Horizontal position via auto side margins — how a width/max-width-constrained
// block sits in its parent (e.g. `max-w-4xl` + `mx-auto` to center a section).
const POSITION: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "mr-auto", label: "Left" },
  { cls: "mx-auto", label: "Center" },
  { cls: "ml-auto", label: "Right" },
];
// Self-alignment on the cross axis — only meaningful when the node's parent is
// a flex or grid container, but offered unconditionally like the rest of this vocab.
const SELF_ALIGN: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "self-start", label: "Start" },
  { cls: "self-center", label: "Center" },
  { cls: "self-end", label: "End" },
  { cls: "self-stretch", label: "Stretch" },
];
const BTN_VARIANT: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "btn-outline", label: "Outline" },
  { cls: "btn-ghost", label: "Ghost" },
  { cls: "btn-soft", label: "Soft" },
  { cls: "btn-link", label: "Link" },
];
const BTN_SIZE: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "btn-xs", label: "XS" },
  { cls: "btn-sm", label: "SM" },
  { cls: "btn-md", label: "MD" },
  { cls: "btn-lg", label: "LG" },
];

// Assignable animations — one preset list per trigger (packages/silicaui/src/
// components/animations.js generates the matching `sui-animate-*`/`sui-reveal-*`/
// `sui-hover-*` classes). Load/Scroll share the same preset NAMES under a
// different class prefix; Hover has its own small set (interactive feedback,
// not an entrance shape).
const ANIMATE_LOAD_PRESET: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "sui-animate-fade-in", label: "Fade in" },
  { cls: "sui-animate-slide-up", label: "Slide up" },
  { cls: "sui-animate-slide-down", label: "Slide down" },
  { cls: "sui-animate-slide-left", label: "Slide left" },
  { cls: "sui-animate-slide-right", label: "Slide right" },
  { cls: "sui-animate-scale-in", label: "Scale in" },
  { cls: "sui-animate-zoom-in", label: "Zoom in" },
];
const ANIMATE_SCROLL_PRESET: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "sui-reveal-fade-in", label: "Fade in" },
  { cls: "sui-reveal-slide-up", label: "Slide up" },
  { cls: "sui-reveal-slide-down", label: "Slide down" },
  { cls: "sui-reveal-slide-left", label: "Slide left" },
  { cls: "sui-reveal-slide-right", label: "Slide right" },
  { cls: "sui-reveal-scale-in", label: "Scale in" },
  { cls: "sui-reveal-zoom-in", label: "Zoom in" },
];
const ANIMATE_HOVER_PRESET: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "sui-hover-lift", label: "Lift" },
  { cls: "sui-hover-scale", label: "Scale" },
  { cls: "sui-hover-glow", label: "Glow" },
];
const ANIMATE_DURATION: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "sui-duration-fast", label: "Fast" },
  { cls: "sui-duration-normal", label: "Normal" },
  { cls: "sui-duration-slow", label: "Slow" },
];
const ANIMATE_DELAY: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "sui-delay-1", label: "1" },
  { cls: "sui-delay-2", label: "2" },
  { cls: "sui-delay-3", label: "3" },
];
const ANIMATE_TRIGGER: ReadonlyArray<{ cls: "load" | "scroll" | "hover"; label: string }> = [
  { cls: "load", label: "Load" },
  { cls: "scroll", label: "Scroll" },
  { cls: "hover", label: "Hover" },
];
const ALL_ANIMATE_PRESET_CLASSES: readonly string[] = [
  ...ANIMATE_LOAD_PRESET,
  ...ANIMATE_SCROLL_PRESET,
  ...ANIMATE_HOVER_PRESET,
].map((o) => o.cls);

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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 text-xs text-base-content/55">{label}</div>
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
  const setToken = (group: readonly string[], value: string) => {
    const t = tokensOf(cls);
    for (const c of group) t.delete(c);
    if (value) t.add(value);
    editor.setClass(id, [...t].join(" "));
  };

  // Animate: which trigger (if any) is active, derived from which preset
  // family's class is currently worn — same "read state back out of the class
  // string" approach as every other group here.
  const existingBehavior = node.kind !== "outlet" ? node.behavior : undefined;
  const animateTrigger: "" | "load" | "scroll" | "hover" = activeIn(cls, ANIMATE_LOAD_PRESET.map((o) => o.cls))
    ? "load"
    : activeIn(cls, ANIMATE_SCROLL_PRESET.map((o) => o.cls))
      ? "scroll"
      : activeIn(cls, ANIMATE_HOVER_PRESET.map((o) => o.cls))
        ? "hover"
        : "";
  const animatePresetList =
    animateTrigger === "load" ? ANIMATE_LOAD_PRESET : animateTrigger === "scroll" ? ANIMATE_SCROLL_PRESET : animateTrigger === "hover" ? ANIMATE_HOVER_PRESET : [];
  // A node's `behavior` marker is a single slot (architecture §7) — Scroll
  // would clobber an existing interactive behavior (Tabs, Carousel, …), so
  // it's disabled rather than silently stealing the slot.
  const behaviorConflict = !!existingBehavior && existingBehavior.type !== "reveal";
  const setAnimateTrigger = (next: "" | "load" | "scroll" | "hover") => {
    const t = tokensOf(cls);
    for (const c of ALL_ANIMATE_PRESET_CLASSES) t.delete(c);
    if (next) {
      const defaults = next === "load" ? ANIMATE_LOAD_PRESET : next === "scroll" ? ANIMATE_SCROLL_PRESET : ANIMATE_HOVER_PRESET;
      t.add(defaults[0]!.cls);
    }
    editor.setClass(id, [...t].join(" "));
    // Only ever touch OUR OWN "reveal" marker — never clobber an unrelated
    // behavior root (Tabs, Carousel, …) the Scroll button is disabled for.
    if (!existingBehavior || existingBehavior.type === "reveal") {
      editor.setBehavior(id, next === "scroll" ? { type: "reveal", params: { once: true } } : undefined);
    }
  };

  return (
    <>
      {node.kind === "component" && node.component === "Button" && (
        <Group label="Button">
          <Row label="Color">
            <SwatchGroup options={btnColors} active={activeIn(cls, btnColors.map((o) => o.cls))} onPick={(v) => setToken(btnColors.map((o) => o.cls), v)} />
          </Row>
          <Row label="Style">
            <ChipGroup options={BTN_VARIANT} active={activeIn(cls, BTN_VARIANT.map((o) => o.cls))} onPick={(v) => setToken(BTN_VARIANT.map((o) => o.cls), v)} />
          </Row>
          <Row label="Size">
            <ChipGroup options={BTN_SIZE} active={activeIn(cls, BTN_SIZE.map((o) => o.cls))} onPick={(v) => setToken(BTN_SIZE.map((o) => o.cls), v)} />
          </Row>
        </Group>
      )}

      <Group label="Text">
        <Row label="Color">
          <SwatchGroup options={textColors} active={activeIn(cls, textColors.map((o) => o.cls))} onPick={(v) => setToken(textColors.map((o) => o.cls), v)} />
        </Row>
        <Row label="Size">
          <ChipGroup options={FONT_SIZE} active={activeIn(cls, FONT_SIZE.map((o) => o.cls))} onPick={(v) => setToken(FONT_SIZE.map((o) => o.cls), v)} />
        </Row>
        <Row label="Weight">
          <ChipGroup options={WEIGHT} active={activeIn(cls, WEIGHT.map((o) => o.cls))} onPick={(v) => setToken(WEIGHT.map((o) => o.cls), v)} />
        </Row>
        <Row label="Align">
          <ChipGroup options={ALIGN} active={activeIn(cls, ALIGN.map((o) => o.cls))} onPick={(v) => setToken(ALIGN.map((o) => o.cls), v)} />
        </Row>
      </Group>

      <Group label="Surface">
        <Row label="Background">
          <SwatchGroup options={bgColors} active={activeIn(cls, bgColors.map((o) => o.cls))} onPick={(v) => setToken(bgColors.map((o) => o.cls), v)} />
        </Row>
        <Row label="Padding">
          <ChipGroup options={PADDING} active={activeIn(cls, PADDING.map((o) => o.cls))} onPick={(v) => setToken(PADDING.map((o) => o.cls), v)} />
        </Row>
        <Row label="Corners">
          <RadiusSwatchGroup options={radiusOpts} active={activeIn(cls, RADIUS.map((o) => o.cls))} onPick={(v) => setToken(RADIUS.map((o) => o.cls), v)} />
        </Row>
      </Group>

      <Group label="Layout">
        <Row label="Width">
          <ChipGroup options={WIDTH} active={activeIn(cls, WIDTH.map((o) => o.cls))} onPick={(v) => setToken(WIDTH.map((o) => o.cls), v)} />
        </Row>
        <Row label="Max width">
          <ChipGroup options={MAX_WIDTH} active={activeIn(cls, MAX_WIDTH.map((o) => o.cls))} onPick={(v) => setToken(MAX_WIDTH.map((o) => o.cls), v)} />
        </Row>
        <Row label="Position">
          <ChipGroup options={POSITION} active={activeIn(cls, POSITION.map((o) => o.cls))} onPick={(v) => setToken(POSITION.map((o) => o.cls), v)} />
        </Row>
        <Row label="Self align">
          <ChipGroup options={SELF_ALIGN} active={activeIn(cls, SELF_ALIGN.map((o) => o.cls))} onPick={(v) => setToken(SELF_ALIGN.map((o) => o.cls), v)} />
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
                active={activeIn(cls, animatePresetList.map((o) => o.cls))}
                onPick={(v) => setToken(animatePresetList.map((o) => o.cls), v)}
              />
            </Row>
            <Row label="Speed">
              <ChipGroup
                options={ANIMATE_DURATION}
                active={activeIn(cls, ANIMATE_DURATION.map((o) => o.cls))}
                onPick={(v) => setToken(ANIMATE_DURATION.map((o) => o.cls), v)}
              />
            </Row>
            <Row label="Delay">
              <ChipGroup
                options={ANIMATE_DELAY}
                active={activeIn(cls, ANIMATE_DELAY.map((o) => o.cls))}
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
}: {
  value: string;
  reseed: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  mono?: boolean;
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
 *  slot. For `collection`, an "Omit when empty" toggle sets `omitWhenEmpty` —
 *  drops the node entirely (like `visible: false`) instead of the default
 *  one-placeholder-item convention when the collection resolves to zero items
 *  (builder-contract.md §3). Lowers to `data-sui-*` in `toHtml`. When the host
 *  supplies `dataSources()`, the Reference field becomes a generic picker
 *  scoped to the node's ancestors (`scopeAt`) instead of a raw text input. */
function DataSection({ id, node }: { id: string; node: Node }) {
  const editor = useEditor();
  const host = useHost();
  const data = node.kind !== "outlet" ? node.data : undefined;
  const kind = data?.kind ?? "";
  const ref = data?.ref ?? "";
  const href = data?.kind === "action" ? data.href ?? "" : "";
  const attr = data?.kind === "value" ? data.attr ?? "" : "";
  const omitWhenEmpty = data?.kind === "collection" ? (data.omitWhenEmpty ?? false) : false;
  const write = (k: string, r: string, h: string, a: string, omit = omitWhenEmpty) => {
    if (!k) return editor.setData(id, undefined);
    if (k === "action") {
      const b: DataBinding = { kind: "action", ref: r };
      if (h) b.href = h;
      editor.setData(id, b);
    } else if (k === "value") {
      const b: DataBinding = { kind: "value", ref: r };
      if (a) b.attr = a;
      editor.setData(id, b);
    } else if (k === "html") {
      editor.setData(id, { kind: "html", ref: r });
    } else {
      const b: DataBinding = { kind: "collection", ref: r };
      if (omit) b.omitWhenEmpty = true;
      editor.setData(id, b);
    }
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
        <NativeSelect data-testid="data-kind" size="sm" value={kind} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => write(e.target.value, ref, href, attr)}>
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
            <NativeSelect data-testid="data-ref-picker" size="sm" value={ref} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => write(kind, e.target.value, href, attr)}>
              <option value="">Choose a field…</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <CommitInput value={ref} reseed={id} placeholder="host data reference" mono onCommit={(v) => write(kind, v, href, attr)} />
          )}
        </Row>
      )}
      {kind === "collection" && (
        <Row label="Omit when empty">
          <label className="flex items-center gap-2 text-xs text-base-content/60">
            <Toggle
              size="sm"
              checked={omitWhenEmpty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => write(kind, ref, href, attr, e.target.checked)}
            />
            {omitWhenEmpty ? "Node is dropped" : "Renders a placeholder"}
          </label>
        </Row>
      )}
      {kind === "action" && (
        <Row label="Fallback href">
          <CommitInput value={href} reseed={id} placeholder="optional link fallback" onCommit={(v) => write(kind, ref, v, attr)} />
        </Row>
      )}
      {kind === "value" && (
        <Row label="Target attribute">
          <CommitInput
            value={attr}
            reseed={id}
            placeholder="auto-detected (e.g. leave blank for text/src)"
            mono
            onCommit={(v) => write(kind, ref, href, v)}
          />
        </Row>
      )}
      {kind && kind !== "action" && ref && <DataPreview id={id} kind={kind} ref_={ref} omitWhenEmpty={omitWhenEmpty} />}
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
function DataPreview({ id, kind, ref_, omitWhenEmpty }: { id: string; kind: string; ref_: string; omitWhenEmpty?: boolean }) {
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
  if (kind === "collection") {
    if (!host?.resolveCollection) return null;
    const items = host.resolveCollection(ref_, {});
    if (!items) return <UnknownRef ref_={ref_} />;
    return (
      <Row label="Preview">
        <p className="text-xs text-base-content/70">
          {items.length === 0
            ? omitWhenEmpty
              ? "0 items — the node is omitted entirely"
              : "0 items — the template renders once as a placeholder"
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
          onPick={set("src")}
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
        onPick={(url) => editor.setProp(id, field.key, url || undefined)}
        field={field}
        id={id}
      />
    );
  }
  return <TextProp id={id} field={field} value={raw != null ? String(raw) : ""} />;
}

/** A URL field with an optional "Browse" button when the host supplies
 *  `pickAsset` — without a host, it's a plain text field (paste a URL). */
function AssetProp({ id, field, value, onPick }: { id: string; field: PropField; value: string; onPick: (url: string) => void }) {
  const host = useHost();
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value, id]);
  const commit = () => {
    if (draft !== value) onPick(draft);
  };
  const browse = async () => {
    const asset = await host?.pickAsset?.("image");
    if (asset) {
      setDraft(asset.url);
      onPick(asset.url);
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
    </Group>
  );
}
