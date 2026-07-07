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
import type { Node } from "silicaui-html";
import { Input, Textarea } from "silicaui-react";
import { useEditor, useSelectedNode } from "./editor-context";
import { Icon } from "./Icon";
import { nodeIconName, nodeName, editableText } from "../node-display";

// ── class-set helpers ────────────────────────────────────────────────────────
const tokensOf = (cls: string | undefined): Set<string> => new Set((cls ?? "").split(/\s+/).filter(Boolean));
/** Which member of `group` the class currently wears ("" = none). */
const activeIn = (cls: string | undefined, group: readonly string[]): string =>
  group.find((c) => tokensOf(cls).has(c)) ?? "";

// ── control vocab (LITERAL classes — this block IS the canvas safelist) ───────
const TEXT_COLORS: ReadonlyArray<{ cls: string; swatch: string; title: string }> = [
  { cls: "text-base-content", swatch: "bg-base-content", title: "Content" },
  { cls: "text-primary", swatch: "bg-primary", title: "Primary" },
  { cls: "text-secondary", swatch: "bg-secondary", title: "Secondary" },
  { cls: "text-accent", swatch: "bg-accent", title: "Accent" },
  { cls: "text-info", swatch: "bg-info", title: "Info" },
  { cls: "text-success", swatch: "bg-success", title: "Success" },
  { cls: "text-warning", swatch: "bg-warning", title: "Warning" },
  { cls: "text-error", swatch: "bg-error", title: "Error" },
];
const BG_COLORS: ReadonlyArray<{ cls: string; swatch: string; title: string }> = [
  { cls: "bg-base-100", swatch: "bg-base-100", title: "Base 100" },
  { cls: "bg-base-200", swatch: "bg-base-200", title: "Base 200" },
  { cls: "bg-base-300", swatch: "bg-base-300", title: "Base 300" },
  { cls: "bg-primary", swatch: "bg-primary", title: "Primary" },
  { cls: "bg-secondary", swatch: "bg-secondary", title: "Secondary" },
  { cls: "bg-accent", swatch: "bg-accent", title: "Accent" },
  { cls: "bg-neutral", swatch: "bg-neutral", title: "Neutral" },
];
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
const BTN_COLOR: ReadonlyArray<{ cls: string; swatch: string; title: string }> = [
  { cls: "btn-primary", swatch: "bg-primary", title: "Primary" },
  { cls: "btn-secondary", swatch: "bg-secondary", title: "Secondary" },
  { cls: "btn-accent", swatch: "bg-accent", title: "Accent" },
  { cls: "btn-neutral", swatch: "bg-neutral", title: "Neutral" },
  { cls: "btn-info", swatch: "bg-info", title: "Info" },
  { cls: "btn-success", swatch: "bg-success", title: "Success" },
  { cls: "btn-warning", swatch: "bg-warning", title: "Warning" },
  { cls: "btn-error", swatch: "bg-error", title: "Error" },
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

/** A wrapping row of color swatches; `Auto` (crossed) clears the group. */
function SwatchGroup({
  options,
  active,
  onPick,
}: {
  options: ReadonlyArray<{ cls: string; swatch: string; title: string }>;
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
          className={`size-6 rounded-field border border-base-300 ${o.swatch} ${
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

  if (!node || node.kind === "outlet" || !node.id) {
    return (
      <div className="flex-1 min-h-0 grid place-items-center p-6 text-center text-sm text-base-content/45">
        <div>
          <Icon name="sliders" className="justify-center text-2xl text-base-content/25" />
          <p className="mt-2">Select an element on the canvas to edit it.</p>
        </div>
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
            <SwatchGroup options={BTN_COLOR} active={activeIn(cls, BTN_COLOR.map((o) => o.cls))} onPick={(v) => setToken(BTN_COLOR.map((o) => o.cls), v)} />
          </Row>
          <Row label="Style">
            <ChipGroup options={BTN_VARIANT} active={activeIn(cls, BTN_VARIANT.map((o) => o.cls))} onPick={(v) => setToken(BTN_VARIANT.map((o) => o.cls), v)} />
          </Row>
          <Row label="Size">
            <ChipGroup options={BTN_SIZE} active={activeIn(cls, BTN_SIZE.map((o) => o.cls))} onPick={(v) => setToken(BTN_SIZE.map((o) => o.cls), v)} />
          </Row>
        </Group>
      )}

      {editableText(node) !== undefined && <ContentField id={id} node={node} />}

      <Group label="Text">
        <Row label="Color">
          <SwatchGroup options={TEXT_COLORS} active={activeIn(cls, TEXT_COLORS.map((o) => o.cls))} onPick={(v) => setToken(TEXT_COLORS.map((o) => o.cls), v)} />
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
          <SwatchGroup options={BG_COLORS} active={activeIn(cls, BG_COLORS.map((o) => o.cls))} onPick={(v) => setToken(BG_COLORS.map((o) => o.cls), v)} />
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
