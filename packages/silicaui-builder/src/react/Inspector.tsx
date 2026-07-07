/**
 * The Inspector (right rail in Page/Layout mode) — the property panel for the
 * selected node. Two tiers over ONE class set (the builder-UX spine): semantic
 * controls (color swatches, size/weight/align/padding/corner chips, plus a
 * recognized-family block for Buttons) sit above the raw class string, and both
 * edit the SAME `node.class`. A class is an unordered, removable set: picking a
 * value swaps out the group's other members; "Auto" clears the group back to the
 * theme default.
 *
 * STYLING RULE (hard): every control is a silicaui class (`btn`, `input`,
 * `textarea`, swatch previews via `bg-*`) or a Tailwind utility, and every
 * utility a node can WEAR is a LITERAL string here so the harness safelists it.
 */
import * as React from "react";
import type { ComponentNode, Node, Theme } from "silicaui-html";
import { rolesOf, colorValue, SURFACE_TOKENS } from "silicaui-html";
import { Input, Textarea, Toggle, NativeSelect, EmptyState } from "silicaui-react";
import { useEditor, useSelectedNode, useTheme } from "./editor-context";
import { Icon } from "./Icon";
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

// ── form-control prop vocab ───────────────────────────────────────────────────
// Which `props` each form component exposes for editing. Keyed by component name
// (the same family-by-name pattern as the Button block); the values map straight
// to the props the ComponentDef's `expand()` reads, so editing here changes the
// published HTML. Options for Select are edited separately (a list, not a scalar).
type PropControl = "text" | "number" | "toggle" | "select";
interface PropField {
  key: string;
  label: string;
  control: PropControl;
  options?: readonly string[];
  placeholder?: string;
}
const INPUT_TYPES = ["text", "email", "password", "number", "tel", "url", "search"] as const;
const FORM_PROPS: Record<string, readonly PropField[]> = {
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

// ── the panel ─────────────────────────────────────────────────────────────────
export function Inspector() {
  const editor = useEditor();
  const node = useSelectedNode();
  const theme = useTheme();
  const mode = theme.mode ?? "light";
  // Theme-derived color vocab — recomputed as the theme (or its roles) change.
  const textColors = React.useMemo(() => textColorOptions(theme, mode), [theme, mode]);
  const bgColors = React.useMemo(() => bgColorOptions(theme, mode), [theme, mode]);
  const btnColors = React.useMemo(() => btnColorOptions(theme, mode), [theme, mode]);

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
  const cls = node.class ?? "";
  // Swap a group's active member for `value` ("" clears the group).
  const setToken = (group: readonly string[], value: string) => {
    const t = tokensOf(cls);
    for (const c of group) t.delete(c);
    if (value) t.add(value);
    editor.setClass(id, [...t].join(" "));
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <IdentityHeader node={node} />

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

      {node.kind === "component" && node.component in FORM_PROPS && (
        <PropsGroup id={id} node={node} />
      )}

      {editableText(node) !== undefined && <ContentField id={id} node={node} />}

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
          <ChipGroup options={RADIUS} active={activeIn(cls, RADIUS.map((o) => o.cls))} onPick={(v) => setToken(RADIUS.map((o) => o.cls), v)} />
        </Row>
      </Group>

      <ClassField id={id} cls={cls} />

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
  const fields = FORM_PROPS[node.component];
  if (!fields) return null;
  return (
    <Group label={node.component}>
      {fields.map((f) => (
        <PropRow key={f.key} id={id} node={node} field={f} />
      ))}
      {node.component === "Select" && <OptionsProp id={id} node={node} />}
    </Group>
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
  return <TextProp id={id} field={field} value={raw != null ? String(raw) : ""} />;
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

/** The raw class string — the low tier. Commits on blur / Enter so a half-typed
 *  utility never fights the semantic chips mid-keystroke. */
function ClassField({ id, cls }: { id: string; cls: string }) {
  const editor = useEditor();
  const [draft, setDraft] = React.useState(cls);
  // Re-seed when the selection (or the class from a chip edit) changes.
  React.useEffect(() => setDraft(cls), [cls, id]);
  const commit = () => {
    if (draft !== cls) editor.setClass(id, draft);
  };
  return (
    <Group label="Classes">
      <Textarea
        className="w-full font-mono text-xs leading-relaxed"
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
      <p className="mt-1 text-xs text-base-content/40">The one styling surface. Chips above edit this same set.</p>
    </Group>
  );
}
