/**
 * The email Inspector (right rail) — the property panel for the selected node.
 * Unlike the site Inspector (one class-string surface with two tiers of
 * controls over it), email nodes carry small typed prop bags — but the PANEL
 * STRUCTURE and CONTROL VOCABULARY replicate the site Inspector exactly, so
 * the two builders feel like the same product: nothing selected shows the
 * same `EmptyState`; a selection gets a toolbar (breadcrumb + move/duplicate/
 * delete, standing in for the site's identity header + footer combined) then
 * the same Design/Settings `ToggleGroup` tab switcher over `Group`/`Row`
 * sections; Design uses the SAME swatch/chip widgets as the site Inspector's
 * `SwatchGroup`/`ChipGroup`/`RadiusSwatchGroup` (over literal hex/px instead
 * of theme-role classes); Settings holds content, links, and structure. The
 * document root ("Email") is just another selectable node that flows through
 * the SAME tabs — not a bespoke settings form — with its two real background
 * layers (outer canvas vs. content card) under one Surface group, mirroring
 * the site Inspector's Surface/Background field.
 *
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes + baked <Icon> only.
 */
import * as React from "react";
import {
  ColorPicker,
  EmptyState,
  Input,
  NativeSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@wizeworks/silicaui-react";
import { useEmailDocument, useEmailEditor, useEmailSelectedNode, useEmailSelection } from "./editor-context";
import { useEmailHost } from "./host-context";
import type { EmailInspectorPanelCtx } from "./host";
import { Icon } from "../../shared/react/Icon";
import type { IconName } from "../../shared/icons";
import { ancestorPath, nodeIcon, nodeName } from "../node-display";
import { useSavedBlocks } from "./saved-blocks";
import { emailScopeAt, flattenEmailSources } from "../resolve";
import { filterTokenOptions, matchTokenQuery } from "./token-query";
import type { TokenMatch } from "./token-query";
import type {
  Align,
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  DataBinding,
  DataSource,
  DividerNode,
  EmailBody,
  EmailColorDefaults,
  EmailNode,
  FontWeight,
  HtmlNode,
  ImageNode,
  SocialLink,
  SocialNode,
  SocialPlatform,
  SpacerNode,
  TextNode,
  VideoNode,
} from "../schema";

// ── field primitives ──────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 px-3.5 py-2">
      <span className="text-xs font-medium text-base-content/55">{label}</span>
      {children}
    </label>
  );
}

/** A labeled section within a tab — same chrome as the site Inspector's `Group`.
 *  (Horizontal padding lives on the label only; `Row`'s own px-3.5 supplies the
 *  same inset for its children, so nesting doesn't double it up.) */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1 border-b border-base-200">
      <div className="px-3.5 pt-1 pb-0.5 text-xs font-semibold uppercase tracking-wider text-base-content/45">{label}</div>
      {children}
    </div>
  );
}

/** Shown in a tab with no applicable fields (e.g. Settings for a Divider). */
function EmptyTab({ text }: { text: string }) {
  return <div className="px-3.5 py-6 text-center text-xs text-base-content/40">{text}</div>;
}

/** Padding only, no label — for a single-field Group where the Group's own
 *  label already names the field (avoids a redundant duplicate label). */
function Pad({ children }: { children: React.ReactNode }) {
  return <div className="px-3.5 py-2">{children}</div>;
}

function TextField({ label, defaultValue, onCommit }: { label: string; defaultValue: string; onCommit: (v: string) => void }) {
  return (
    <Row label={label}>
      <Input size="sm" defaultValue={defaultValue} onBlur={(e: React.FocusEvent<HTMLInputElement>) => onCommit(e.target.value)} />
    </Row>
  );
}

/** The plain-input twin of the Canvas's contentEditable merge-token
 *  autocomplete (`Canvas.tsx`'s `EditableHtml`) — sharing the same
 *  `matchTokenQuery`/`filterTokenOptions` parsing so "what counts as an open
 *  token" means the same thing in both places. Used only for the prose fields
 *  `email/resolve.ts`'s `applyTokens` actually substitutes tokens into —
 *  Subject, Preview text, Button label — not every text field (a URL field
 *  has no sensible use for an inline sentence variable). Controlled (unlike
 *  the plain `TextField` above) since the popover needs to read live text;
 *  still only commits on blur/pick, matching `TextField`'s behavior. */
function TokenTextField({
  label,
  defaultValue,
  sources,
  onCommit,
}: {
  label: string;
  defaultValue: string;
  sources: readonly DataSource[] | undefined;
  onCommit: (v: string) => void;
}) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  const [text, setText] = React.useState(defaultValue);
  const [match, setMatch] = React.useState<TokenMatch | undefined>(undefined);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const flatSources = React.useMemo(() => (sources ? flattenEmailSources(sources) : []), [sources]);
  const options = match ? filterTokenOptions(flatSources, match.query) : [];

  const sync = () => {
    const el = ref.current;
    if (!el || !sources) return;
    const caret = el.selectionStart ?? el.value.length;
    setMatch(matchTokenQuery(el.value, caret));
    setActiveIndex(0);
  };

  const pick = (value: string) => {
    const el = ref.current;
    if (!el || !match) return;
    const caret = el.selectionStart ?? el.value.length;
    const next = el.value.slice(0, match.start) + `{{${value}}}` + el.value.slice(caret);
    const cursor = match.start + value.length + 4;
    setText(next);
    setMatch(undefined);
    onCommit(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <Row label={label}>
      <div className="relative">
        <Input
          ref={ref}
          size="sm"
          className="w-full"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          onKeyUp={sync}
          onClick={sync}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!match || options.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => (i + 1) % options.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => (i - 1 + options.length) % options.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(options[activeIndex]!.value);
            } else if (e.key === "Escape") {
              setMatch(undefined);
            }
          }}
          onBlur={() => {
            setMatch(undefined);
            onCommit(text);
          }}
        />
        {match && options.length > 0 && (
          <div
            className="absolute left-0 top-full z-30 mt-1 max-h-48 w-56 overflow-auto rounded-btn border border-base-300 bg-base-100 py-1 shadow-md"
            data-testid="token-autocomplete"
          >
            {options.map((o, i) => (
              <button
                key={o.value}
                type="button"
                className={`block w-full truncate px-2.5 py-1 text-left text-xs ${i === activeIndex ? "bg-base-200" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Row>
  );
}

/** A bare numeric field (px/pt values with no site-chip analog — width, thickness,
 *  height, gap). Still gets the same leading "Auto" reset every other Design
 *  field has when a fresh-insert default exists (`autoValue`), so the
 *  affordance is consistent even where the value itself has no preset ladder. */
function NumberField({
  label,
  defaultValue,
  min,
  max,
  onCommit,
  autoValue,
}: {
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  onCommit: (v: number) => void;
  autoValue?: number;
}) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-1.5">
        {autoValue !== undefined && (
          <button
            type="button"
            title="Reset to default"
            className={`btn btn-xs ${defaultValue === autoValue ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onCommit(autoValue)}
          >
            Auto
          </button>
        )}
        <Input
          type="number"
          size="sm"
          className="flex-1"
          min={min}
          max={max}
          defaultValue={defaultValue}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onCommit(n);
          }}
        />
      </div>
    </Row>
  );
}

// ── Design-tab control vocab — the SAME swatch/chip widgets the site
// Inspector's Design tab uses, ported to email's literal hex/px values instead
// of theme-role classes. An email prop is never null/inherited the way a class
// token is — every field always holds a concrete value — but each field still
// gets the SAME leading "Auto" affordance site's chips/swatches have, wired to
// reset to whatever value a FRESH insert of that kind gets (`../palette.ts`'s
// `make()` defaults), so it reads and behaves the same even though there's no
// real "unset" state underneath.
function chipActive<T>(value: T, options: ReadonlyArray<{ value: T }>): T | "" {
  return options.some((o) => o.value === value) ? value : "";
}

/** A wrapping row of small btn chips — visually identical to the site
 *  Inspector's `ChipGroup`, including the leading "Auto" chip when the field
 *  has a known default to reset to. */
function ChipGroup<T extends string | number>({
  options,
  active,
  onPick,
  onAuto,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  active: T | "";
  onPick: (value: T) => void;
  onAuto?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {onAuto && (
        <button
          type="button"
          title="Reset to default"
          className={`btn btn-xs ${active === "" ? "btn-primary" : "btn-ghost"}`}
          onClick={onAuto}
        >
          Auto
        </button>
      )}
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={`btn btn-xs ${active === o.value ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface ColorOption {
  hex: string;
  title: string;
}

/** The theme's full semantic-role + surface palette, resolved to hex — the
 *  SAME breadth (8 roles + 4 surfaces) as the site Inspector's `rolesOf`
 *  swatch vocab, not just the handful of colors new blocks seed from. */
function colorOptionsOf(colors: EmailColorDefaults): ColorOption[] {
  return [
    { hex: colors.primary, title: "Primary" },
    { hex: colors.secondary, title: "Secondary" },
    { hex: colors.accent, title: "Accent" },
    { hex: colors.neutral, title: "Neutral" },
    { hex: colors.info, title: "Info" },
    { hex: colors.success, title: "Success" },
    { hex: colors.warning, title: "Warning" },
    { hex: colors.error, title: "Error" },
    { hex: colors.baseContent, title: "Base content" },
    { hex: colors.base100, title: "Base 100" },
    { hex: colors.base200, title: "Base 200" },
    { hex: colors.base300, title: "Base 300" },
    { hex: colors.primaryContent, title: "Primary content" },
  ];
}

/** A row of color swatches — same square/ring styling as the site
 *  Inspector's `SwatchGroup`, previewing the document's real brand hex
 *  values instead of theme-role classes. A leading "Auto" (crossed) swatch —
 *  present whenever the field has a known default — resets to it, same as
 *  site's; it's a plain action button (not ring-highlighted) since the
 *  trailing custom swatch below already owns "is this value non-preset". A
 *  trailing swatch previews the CURRENT value and opens a full picker — the
 *  escape hatch for a one-off hex outside the palette above; it rings active
 *  whenever the value isn't one of the presets. */
function SwatchGroup({
  options,
  active,
  onPick,
  onAuto,
}: {
  options: ReadonlyArray<ColorOption>;
  active: string;
  onPick: (hex: string) => void;
  onAuto?: () => void;
}) {
  const isPreset = options.some((o) => o.hex.toLowerCase() === active.toLowerCase());
  return (
    <div className="flex flex-wrap gap-1.5">
      {onAuto && (
        <button
          type="button"
          title="Reset to default"
          onClick={onAuto}
          className="size-6 rounded-field border border-base-300 bg-base-100 grid place-items-center text-base-content/40"
        >
          <Icon name="close" className="text-[10px]" />
        </button>
      )}
      {options.map((o) => (
        <button
          key={o.hex}
          type="button"
          title={o.title}
          onClick={() => onPick(o.hex)}
          style={{ backgroundColor: o.hex }}
          className={`size-6 rounded-field border border-base-300 ${
            active.toLowerCase() === o.hex.toLowerCase() ? "ring-2 ring-primary ring-offset-1 ring-offset-base-100" : ""
          }`}
        />
      ))}
      <Popover>
        <PopoverTrigger>
          <button
            type="button"
            title="Custom color"
            style={{ backgroundColor: active }}
            className={`size-6 rounded-field border border-dashed border-base-content/40 ${
              !isPreset ? "ring-2 ring-primary ring-offset-1 ring-offset-base-100" : ""
            }`}
          />
        </PopoverTrigger>
        <PopoverContent className="p-2">
          <ColorPicker variant="panel" format="hex" value={active} onValueChange={onPick} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const RADIUS_PX: ReadonlyArray<{ value: number; label: string; previewPx: number }> = [
  { value: 0, label: "None", previewPx: 0 },
  { value: 4, label: "Small", previewPx: 4 },
  { value: 8, label: "Medium", previewPx: 8 },
  { value: 9999, label: "Full", previewPx: 14 },
];

/** Corner-radius swatches — same square-preview styling as the site
 *  Inspector's `RadiusSwatchGroup` (each swatch previews its OWN real
 *  corner), over literal px instead of theme radius tokens. Leading "Auto"
 *  (crossed) swatch resets to the field's default, ring-highlighted whenever
 *  the value doesn't match one of the presets — same convention as `ChipGroup`. */
function RadiusSwatchGroup({
  active,
  onPick,
  onAuto,
}: {
  active: number;
  onPick: (value: number) => void;
  onAuto?: () => void;
}) {
  const isPreset = RADIUS_PX.some((o) => o.value === active);
  return (
    <div className="flex flex-wrap gap-1.5">
      {onAuto && (
        <button
          type="button"
          title="Reset to default"
          onClick={onAuto}
          className={`grid size-[30px] place-items-center border bg-base-200 text-base-content/40 ${
            !isPreset ? "border-primary ring-1 ring-inset ring-primary" : "border-base-300"
          }`}
        >
          <Icon name="close" className="text-[10px]" />
        </button>
      )}
      {RADIUS_PX.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.label}
          onClick={() => onPick(o.value)}
          style={{ borderTopLeftRadius: o.previewPx }}
          className={`size-[30px] border bg-base-200 ${
            active === o.value ? "border-primary ring-1 ring-inset ring-primary" : "border-base-300"
          }`}
        />
      ))}
    </div>
  );
}

const FONT_SIZE_PX: ReadonlyArray<{ value: number; label: string }> = [
  { value: 12, label: "XS" },
  { value: 14, label: "SM" },
  { value: 16, label: "MD" },
  { value: 18, label: "LG" },
  { value: 20, label: "XL" },
  { value: 24, label: "2XL" },
  { value: 30, label: "3XL" },
  { value: 36, label: "4XL" },
  { value: 48, label: "5XL" },
];
const PADDING_PX: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: "0" },
  { value: 8, label: "2" },
  { value: 16, label: "4" },
  { value: 24, label: "6" },
  { value: 32, label: "8" },
];
const ALIGN_OPTS: ReadonlyArray<{ value: Align; label: string }> = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];
/** Same vocab as the site Inspector's `WEIGHT` chips (`font-normal`…`font-bold`). */
const WEIGHT_OPTS: ReadonlyArray<{ value: FontWeight; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
];

function ColorField({
  label,
  value,
  onCommit,
  autoRole,
}: {
  label: string;
  value: string;
  /** `auto` is true only for the "Auto" reset click — callers persist it
   *  alongside the hex (e.g. `bgAuto`) so this field keeps tracking the
   *  theme live; any other pick (a preset swatch or the custom picker)
   *  passes `false`, freezing the field as a manual override. */
  onCommit: (v: string, auto: boolean) => void;
  /** The `EmailColorDefaults` key this field's "Auto" resets to — the SAME
   *  value a fresh insert of this kind gets from `../palette.ts`. */
  autoRole?: keyof EmailColorDefaults;
}) {
  const editor = useEmailEditor();
  // Not memoized on `editor` alone: the editor's identity never changes, but
  // its `colorDefaults` can (a live theme update) — a stale memo would leave
  // these swatches showing colors the rest of the canvas has moved past.
  const options = colorOptionsOf(editor.colorDefaults);
  const onAuto = autoRole ? () => onCommit(editor.colorDefaults[autoRole], true) : undefined;
  return (
    <Row label={label}>
      <SwatchGroup options={options} active={value} onPick={(v) => onCommit(v, false)} onAuto={onAuto} />
    </Row>
  );
}

/** A chip-driven size field (font size / padding) — same clean chip-only look
 *  as the site Inspector for the common case (a preset value). Unlike site's
 *  chips (which ARE the class vocab, with no ceiling to hit), email's px
 *  fields can legitimately hold a value outside the preset list (a restored
 *  document, a value site never offered) — when that happens a compact
 *  numeric override appears so that value stays visible and editable instead
 *  of silently rounding to the nearest chip. */
function SizeChipField({
  label,
  value,
  options,
  onCommit,
  autoValue,
}: {
  label: string;
  value: number;
  options: ReadonlyArray<{ value: number; label: string }>;
  onCommit: (v: number) => void;
  autoValue?: number;
}) {
  const active = chipActive(value, options);
  return (
    <Row label={label}>
      <div className="flex flex-col gap-1.5">
        <ChipGroup
          options={options}
          active={active}
          onPick={onCommit}
          onAuto={autoValue !== undefined ? () => onCommit(autoValue) : undefined}
        />
        {active === "" && (
          <Input
            type="number"
            size="sm"
            className="w-24"
            defaultValue={value}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onCommit(n);
            }}
          />
        )}
      </div>
    </Row>
  );
}

function RadiusField({
  label,
  value,
  onCommit,
  autoValue,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  autoValue?: number;
}) {
  return (
    <Row label={label}>
      <RadiusSwatchGroup
        active={value}
        onPick={onCommit}
        onAuto={autoValue !== undefined ? () => onCommit(autoValue) : undefined}
      />
    </Row>
  );
}

function AlignField({ value, onCommit, autoValue }: { value: Align; onCommit: (v: Align) => void; autoValue?: Align }) {
  return (
    <Row label="Align">
      <ChipGroup
        options={ALIGN_OPTS}
        active={value}
        onPick={onCommit}
        onAuto={autoValue !== undefined ? () => onCommit(autoValue) : undefined}
      />
    </Row>
  );
}

// ── per-kind field sets ────────────────────────────────────────────────────────
// Split Design (pure visual: color/size/align/padding/corners) vs Settings
// (content, links, structure) — same split as the site Inspector's tabs. Design
// groups draw from the SAME universal vocab the site Inspector always renders
// (Text / Surface / Layout, plus a recognized-family "Button" group) — not a
// group per node kind — so a Group header means the same thing in both
// builders. A kind only gets the groups its own fields actually populate.
function TextDesignFields({ node, update }: { node: TextNode; update: (patch: Partial<TextNode>) => void }) {
  return (
    <Group label="Text">
      <ColorField label="Color" value={node.color} onCommit={(color, colorAuto) => update({ color, colorAuto })} autoRole="baseContent" />
      <SizeChipField label="Font size" value={node.fontSize} options={FONT_SIZE_PX} onCommit={(fontSize) => update({ fontSize })} autoValue={16} />
      <Row label="Weight">
        <ChipGroup
          options={WEIGHT_OPTS}
          active={node.fontWeight}
          onPick={(fontWeight) => update({ fontWeight })}
          onAuto={() => update({ fontWeight: "normal" as FontWeight })}
        />
      </Row>
      <NumberField label="Line height" defaultValue={node.lineHeight} min={8} max={96} onCommit={(lineHeight) => update({ lineHeight })} autoValue={24} />
      <AlignField value={node.align} onCommit={(align) => update({ align })} autoValue="left" />
    </Group>
  );
}
function TextSettingsFields({ node, update }: { node: TextNode; update: (patch: Partial<TextNode>) => void }) {
  return (
    <Group label="Content">
      <Pad>
        <Textarea
          size="sm"
          rows={3}
          defaultValue={node.html}
          onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => update({ html: e.target.value })}
        />
      </Pad>
    </Group>
  );
}

function ImageDesignFields({ node, update }: { node: ImageNode; update: (patch: Partial<ImageNode>) => void }) {
  return (
    <Group label="Layout">
      <NumberField label="Width (px)" defaultValue={node.width} min={16} max={1200} onCommit={(width) => update({ width })} autoValue={300} />
      <AlignField value={node.align} onCommit={(align) => update({ align })} autoValue="center" />
    </Group>
  );
}
function ImageSettingsFields({ node, update }: { node: ImageNode; update: (patch: Partial<ImageNode>) => void }) {
  return (
    <>
      <Group label="Content">
        <TextField label="Image URL" defaultValue={node.src} onCommit={(src) => update({ src })} />
      </Group>
      <Group label="Link">
        <TextField label="Link URL" defaultValue={node.href ?? ""} onCommit={(v) => update({ href: v || undefined })} />
      </Group>
      <Group label="Accessibility">
        <TextField label="Alt text" defaultValue={node.alt} onCommit={(alt) => update({ alt })} />
      </Group>
    </>
  );
}

function ButtonDesignFields({ node, update }: { node: ButtonNode; update: (patch: Partial<ButtonNode>) => void }) {
  return (
    <>
      {/* The recognized-family block — the site Inspector's Button group is
          just one role-color swatch (auto-contrast text comes free from the
          `btn-<role>` class); email has no such class, so Background and Text
          color are both explicit here. */}
      <Group label="Button">
        <ColorField label="Background" value={node.bg} onCommit={(bg, bgAuto) => update({ bg, bgAuto })} autoRole="primary" />
        <ColorField label="Text color" value={node.color} onCommit={(color, colorAuto) => update({ color, colorAuto })} autoRole="primaryContent" />
      </Group>
      <Group label="Surface">
        <RadiusField label="Corner radius" value={node.radius} onCommit={(radius) => update({ radius })} autoValue={8} />
        <SizeChipField label="Padding X" value={node.paddingX} options={PADDING_PX} onCommit={(paddingX) => update({ paddingX })} autoValue={16} />
        <SizeChipField label="Padding Y" value={node.paddingY} options={PADDING_PX} onCommit={(paddingY) => update({ paddingY })} autoValue={8} />
      </Group>
      <Group label="Layout">
        <AlignField value={node.align} onCommit={(align) => update({ align })} autoValue="center" />
      </Group>
    </>
  );
}
function ButtonSettingsFields({ node, update }: { node: ButtonNode; update: (patch: Partial<ButtonNode>) => void }) {
  const editor = useEmailEditor();
  const host = useEmailHost();
  const sources = host?.dataSources ? emailScopeAt(host.dataSources(), editor.ancestorsOf(node.id)) : undefined;
  return (
    <>
      <Group label="Content">
        <TokenTextField label="Label" defaultValue={node.label} sources={sources} onCommit={(label) => update({ label })} />
      </Group>
      <Group label="Link">
        <TextField label="Link URL" defaultValue={node.href} onCommit={(href) => update({ href })} />
      </Group>
    </>
  );
}

function DividerDesignFields({ node, update }: { node: DividerNode; update: (patch: Partial<DividerNode>) => void }) {
  return (
    <Group label="Surface">
      <ColorField label="Color" value={node.color} onCommit={(color, colorAuto) => update({ color, colorAuto })} autoRole="base300" />
      <NumberField label="Thickness (px)" defaultValue={node.thickness} min={1} max={12} onCommit={(thickness) => update({ thickness })} autoValue={1} />
    </Group>
  );
}

function SpacerDesignFields({ node, update }: { node: SpacerNode; update: (patch: Partial<SpacerNode>) => void }) {
  return (
    <Group label="Layout">
      <NumberField label="Height (px)" defaultValue={node.height} min={0} max={240} onCommit={(height) => update({ height })} autoValue={24} />
    </Group>
  );
}

const SOCIAL_PLATFORM_LABEL: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
};

function SocialDesignFields({ node, update }: { node: SocialNode; update: (patch: Partial<SocialNode>) => void }) {
  return (
    <Group label="Layout">
      <AlignField value={node.align} onCommit={(align) => update({ align })} autoValue="center" />
      <div className="grid grid-cols-2 gap-x-2">
        <NumberField label="Icon size" defaultValue={node.iconSize} min={16} max={64} onCommit={(iconSize) => update({ iconSize })} autoValue={32} />
        <NumberField label="Gap" defaultValue={node.gap} min={0} max={40} onCommit={(gap) => update({ gap })} autoValue={12} />
      </div>
    </Group>
  );
}
function SocialSettingsFields({ node, update }: { node: SocialNode; update: (patch: Partial<SocialNode>) => void }) {
  const setLink = (i: number, patch: Partial<SocialLink>) =>
    update({ links: node.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const addLink = () => update({ links: [...node.links, { platform: "facebook", url: "" }] });
  const removeLink = (i: number) => update({ links: node.links.filter((_, idx) => idx !== i) });
  return (
    <Group label={`Links (${node.links.length})`}>
      <Pad>
        <div className="flex flex-col gap-2">
          {node.links.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <NativeSelect
                size="sm"
                value={l.platform}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLink(i, { platform: e.target.value as SocialPlatform })}
              >
                {(Object.keys(SOCIAL_PLATFORM_LABEL) as SocialPlatform[]).map((p) => (
                  <option key={p} value={p}>
                    {SOCIAL_PLATFORM_LABEL[p]}
                  </option>
                ))}
              </NativeSelect>
              <Input
                size="sm"
                placeholder="https://…"
                defaultValue={l.url}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => setLink(i, { url: e.target.value })}
              />
              <IconButton icon="close" label="Remove link" onClick={() => removeLink(i)} />
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={addLink}>
            <Icon name="plus" /> Add link
          </button>
        </div>
      </Pad>
    </Group>
  );
}

function HtmlSettingsFields({ node, update }: { node: HtmlNode; update: (patch: Partial<HtmlNode>) => void }) {
  return (
    <Group label="Content">
      <Row label="Raw HTML">
        <Textarea
          size="sm"
          rows={8}
          className="font-mono text-xs"
          defaultValue={node.html}
          onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => update({ html: e.target.value })}
        />
      </Row>
    </Group>
  );
}

function VideoDesignFields({ node, update }: { node: VideoNode; update: (patch: Partial<VideoNode>) => void }) {
  return (
    <Group label="Layout">
      <NumberField label="Width (px)" defaultValue={node.width} min={80} max={1200} onCommit={(width) => update({ width })} autoValue={400} />
      <AlignField value={node.align} onCommit={(align) => update({ align })} autoValue="center" />
      <Row label="Play button overlay">
        <ToggleGroup
          className="toggle-group-sm"
          aria-label="Play button overlay"
          value={[node.showPlayButton ? "on" : "off"]}
          onValueChange={(v: string[]) => v.length && update({ showPlayButton: v[v.length - 1] === "on" })}
        >
          <ToggleGroupItem value="off">No</ToggleGroupItem>
          <ToggleGroupItem value="on">Yes</ToggleGroupItem>
        </ToggleGroup>
      </Row>
    </Group>
  );
}
function VideoSettingsFields({ node, update }: { node: VideoNode; update: (patch: Partial<VideoNode>) => void }) {
  return (
    <Group label="Content">
      <TextField label="Thumbnail image URL" defaultValue={node.thumbnail} onCommit={(thumbnail) => update({ thumbnail })} />
      <TextField label="Video URL" defaultValue={node.href} onCommit={(href) => update({ href })} />
    </Group>
  );
}

function ColumnDesignFields({ node, update }: { node: ColumnNode; update: (patch: Partial<ColumnNode>) => void }) {
  return (
    <Group label="Layout">
      <NumberField
        label="Width (% of row)"
        defaultValue={node.widthPct}
        min={5}
        max={100}
        onCommit={(widthPct) => update({ widthPct })}
      />
    </Group>
  );
}

function ColumnsDesignFields({ node, update }: { node: ColumnsNode; update: (patch: Partial<ColumnsNode>) => void }) {
  return (
    <Group label="Layout">
      <Row label="Stack on mobile">
        <ToggleGroup
          className="toggle-group-sm"
          aria-label="Stack on mobile"
          value={[node.stackOnMobile ? "on" : "off"]}
          onValueChange={(v: string[]) => v.length && update({ stackOnMobile: v[v.length - 1] === "on" })}
        >
          <ToggleGroupItem value="off">No</ToggleGroupItem>
          <ToggleGroupItem value="on">Yes</ToggleGroupItem>
        </ToggleGroup>
      </Row>
    </Group>
  );
}
function ColumnsSettingsFields({ node }: { node: ColumnsNode }) {
  const editor = useEmailEditor();
  return (
    <Group label="Structure">
      <Row label={`Columns (${node.children.length})`}>
        <button
          type="button"
          className="btn btn-outline btn-sm w-full"
          disabled={node.children.length >= 6}
          onClick={() => editor.addColumn(node.id)}
        >
          <Icon name="plus" /> Add column
        </button>
      </Row>
    </Group>
  );
}

function SectionDesignFields({ node, update }: { node: import("../schema").SectionNode; update: (patch: Record<string, unknown>) => void }) {
  return (
    <Group label="Surface">
      <ColorField label="Background" value={node.bg} onCommit={(bg, bgAuto) => update({ bg, bgAuto })} autoRole="base100" />
      <Row label="Background image URL">
        <div className="flex gap-1.5">
          <Input
            size="sm"
            defaultValue={node.bgImage ?? ""}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => update({ bgImage: e.target.value || undefined })}
            placeholder="https://…"
          />
          {node.bgImage && (
            <IconButton icon="close" label="Clear background image" onClick={() => update({ bgImage: undefined })} />
          )}
        </div>
      </Row>
      <SizeChipField label="Padding X" value={node.paddingX} options={PADDING_PX} onCommit={(paddingX) => update({ paddingX })} autoValue={24} />
      <SizeChipField label="Padding Y" value={node.paddingY} options={PADDING_PX} onCommit={(paddingY) => update({ paddingY })} autoValue={24} />
    </Group>
  );
}

// ── body (the document root) — selecting "Email" in the Navigator/breadcrumb
// routes through the SAME Design/Settings tabs as any other node, not a
// bespoke settings form. Design holds the two real background layers email
// HTML has (the outer canvas "wallpaper" behind a centered email, and the
// content card itself) under one Surface group, same as the site Inspector's
// Surface/Background field; Settings holds Subject/Preview text (Content),
// Canvas width (Layout), and Font family.
function BodyDesignFields({ node, update }: { node: EmailBody; update: (patch: Record<string, unknown>) => void }) {
  return (
    <Group label="Surface">
      <ColorField label="Background" value={node.bg} onCommit={(bg, bgAuto) => update({ bg, bgAuto })} autoRole="base200" />
      <ColorField label="Content background" value={node.contentBg} onCommit={(contentBg, contentBgAuto) => update({ contentBg, contentBgAuto })} autoRole="base100" />
    </Group>
  );
}
function BodySettingsFields({ node, update }: { node: EmailBody; update: (patch: Record<string, unknown>) => void }) {
  const editor = useEmailEditor();
  const doc = useEmailDocument();
  const host = useEmailHost();
  const sources = host?.dataSources ? emailScopeAt(host.dataSources(), editor.ancestorsOf(node.id)) : undefined;
  return (
    <>
      <Group label="Content">
        <TokenTextField label="Subject" defaultValue={doc.subject} sources={sources} onCommit={(v) => editor.setSubject(v)} />
        <TokenTextField label="Preview text" defaultValue={doc.preheader} sources={sources} onCommit={(v) => editor.setPreheader(v)} />
      </Group>
      <Group label="Layout">
        <NumberField label="Canvas width (px)" defaultValue={node.width} min={320} max={800} onCommit={(width) => update({ width })} autoValue={600} />
      </Group>
      <Group label="Font">
        <TextField label="Font family" defaultValue={node.fontFamily} onCommit={(fontFamily) => update({ fontFamily })} />
      </Group>
    </>
  );
}

// ── toolbar (breadcrumb + move/duplicate/delete) ────────────────────────────────
function Toolbar({ selectedId, node }: { selectedId: string; node: EmailNode }) {
  const editor = useEmailEditor();
  const doc = useEmailDocument();
  const { save: saveBlock } = useSavedBlocks();
  const path = ancestorPath(doc.root, selectedId) ?? [];
  const sibling = editor.siblingInfo(selectedId);
  // A column's `widthPct`s must keep summing to 100 — duplicate/delete route
  // through the rebalancing engine methods instead of the generic ones.
  const isColumn = node.kind === "column";
  // The root has no parent (`sibling` is undefined) — the engine already
  // no-ops move/duplicate/remove on it, but the buttons should read as
  // disabled rather than silently doing nothing when clicked.
  const isRoot = node.kind === "body";
  const duplicate = () => (isColumn ? editor.duplicateColumn(selectedId) : editor.duplicate(selectedId));
  const remove = () => (isColumn ? editor.removeColumn(selectedId) : editor.remove(selectedId));
  const saveAsBlock = () => {
    const name = window.prompt("Name this saved block", nodeName(node));
    if (name) saveBlock(name, node);
  };
  return (
    <div className="flex flex-col gap-1.5 border-b border-base-200 px-3.5 py-2">
      <div className="flex items-center gap-1 overflow-x-auto text-xs text-base-content/55">
        {path.map((n, i) => (
          <React.Fragment key={n.id}>
            {i > 0 && <span className="text-base-content/30">/</span>}
            <button
              type="button"
              className={`inline-flex shrink-0 items-center gap-1 rounded px-1 py-0.5 hover:bg-base-200 ${n.id === selectedId ? "font-semibold text-base-content" : ""}`}
              onClick={() => editor.select(n.id)}
            >
              <Icon name={nodeIcon(n)} />
              <span className="max-w-[90px] truncate">{nodeName(n)}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <IconButton
          icon="chevronUp"
          label="Move up"
          disabled={!sibling || sibling.index <= 0}
          onClick={() => editor.moveUp(selectedId)}
        />
        <IconButton
          icon="chevronDown"
          label="Move down"
          disabled={!sibling || sibling.index >= sibling.count - 1}
          onClick={() => editor.moveDown(selectedId)}
        />
        <IconButton
          icon="copy"
          label="Duplicate"
          disabled={isRoot || (isColumn && (sibling?.count ?? 0) >= 6)}
          onClick={duplicate}
        />
        {!isRoot && <IconButton icon="saved" label="Save as block" onClick={saveAsBlock} />}
        <div className="flex-1" />
        <IconButton
          icon="trash"
          label="Delete"
          tone="error"
          disabled={isRoot || (isColumn && (sibling?.count ?? 0) <= 1)}
          onClick={remove}
        />
      </div>
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "error";
}) {
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-xs btn-square ${tone === "error" ? "text-error" : ""}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

type InspectorTab = "design" | "settings";

/** Design tab body for one node kind, or `undefined` for kinds with no visual
 *  fields (falls back to an `EmptyTab` note, same as Settings below). */
function designFieldsFor(node: EmailNode, update: (patch: Record<string, unknown>) => void): React.ReactNode {
  switch (node.kind) {
    case "body":
      return <BodyDesignFields node={node} update={update} />;
    case "text":
      return <TextDesignFields node={node} update={update} />;
    case "image":
      return <ImageDesignFields node={node} update={update} />;
    case "button":
      return <ButtonDesignFields node={node} update={update} />;
    case "divider":
      return <DividerDesignFields node={node} update={update} />;
    case "spacer":
      return <SpacerDesignFields node={node} update={update} />;
    case "social":
      return <SocialDesignFields node={node} update={update} />;
    case "video":
      return <VideoDesignFields node={node} update={update} />;
    case "column":
      return <ColumnDesignFields node={node} update={update} />;
    case "columns":
      return <ColumnsDesignFields node={node} update={update} />;
    case "section":
      return <SectionDesignFields node={node} update={update} />;
    default:
      return undefined;
  }
}

function settingsFieldsFor(node: EmailNode, update: (patch: Record<string, unknown>) => void): React.ReactNode {
  switch (node.kind) {
    case "body":
      return <BodySettingsFields node={node} update={update} />;
    case "text":
      return <TextSettingsFields node={node} update={update} />;
    case "image":
      return <ImageSettingsFields node={node} update={update} />;
    case "button":
      return <ButtonSettingsFields node={node} update={update} />;
    case "social":
      return <SocialSettingsFields node={node} update={update} />;
    case "html":
      return <HtmlSettingsFields node={node} update={update} />;
    case "video":
      return <VideoSettingsFields node={node} update={update} />;
    case "columns":
      return <ColumnsSettingsFields node={node} />;
    default:
      return undefined;
  }
}

// ── data binding (Q1/Q2/Q19 ported from the site Inspector's DataSection/
// DataPreview — same kind vocab, same "Reference" picker-or-raw-input split,
// same live-preview row) ────────────────────────────────────────────────────
const EMAIL_DATA_KINDS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "None" },
  { value: "value", label: "Value (fill this node)" },
  { value: "collection", label: "Collection (repeat children)" },
  { value: "action", label: "Action (host handler)" },
];

/** Dynamic content — the node's single `DataBinding`, ported field-for-field
 *  from the site Inspector's `DataSection`: a kind selector, an opaque `ref`
 *  (the engine never parses it — the host interprets it), an optional href
 *  for the action kind, and (for `value`) an optional target `attr` — see
 *  `email/resolve.ts`'s `BINDABLE_FIELDS` for which attrs a given node kind
 *  actually accepts. "Collection" only appears for a node that HAS
 *  `children` (body/section/columns/column) — repeating a leaf content node
 *  is structurally impossible in this schema, so the option is hidden rather
 *  than offered-and-silently-ignored. */
function EmailDataSection({ id, node }: { id: string; node: EmailNode }) {
  const editor = useEmailEditor();
  const host = useEmailHost();
  const data = node.data;
  const kind = data?.kind ?? "";
  const ref = data?.ref ?? "";
  const href = data?.kind === "action" ? data.href ?? "" : "";
  const attr = data?.kind === "value" ? data.attr ?? "" : "";
  const omitWhenEmpty = data?.kind === "collection" ? (data.omitWhenEmpty ?? false) : false;
  const canRepeat = "children" in node;
  const kinds = canRepeat ? EMAIL_DATA_KINDS : EMAIL_DATA_KINDS.filter((k) => k.value !== "collection");
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
    } else {
      const b: DataBinding = { kind: "collection", ref: r };
      if (omit) b.omitWhenEmpty = true;
      editor.setData(id, b);
    }
  };
  const options = React.useMemo(() => {
    if (!host?.dataSources) return undefined;
    const scoped = emailScopeAt(host.dataSources(), editor.ancestorsOf(id));
    return kind === "collection"
      ? scoped.filter((s) => s.cardinality !== "scalar").map((s) => ({ value: s.key, label: s.label }))
      : flattenEmailSources(scoped);
  }, [host, editor, id, kind]);
  return (
    <Group label="Data binding">
      <Row label="Bind">
        <NativeSelect size="sm" value={kind} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => write(e.target.value, ref, href, attr)}>
          {kinds.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </NativeSelect>
      </Row>
      {kind && (
        <Row label="Reference">
          {options ? (
            <NativeSelect size="sm" value={ref} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => write(kind, e.target.value, href, attr)}>
              <option value="">Choose a field…</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <Input size="sm" className="w-full font-mono text-xs" defaultValue={ref} placeholder="host data reference" onBlur={(e: React.FocusEvent<HTMLInputElement>) => write(kind, e.target.value, href, attr)} />
          )}
        </Row>
      )}
      {kind === "action" && (
        <Row label="Fallback href">
          <Input size="sm" className="w-full" defaultValue={href} placeholder="optional link fallback" onBlur={(e: React.FocusEvent<HTMLInputElement>) => write(kind, ref, e.target.value, attr)} />
        </Row>
      )}
      {kind === "value" && (
        <Row label="Target field">
          <Input size="sm" className="w-full font-mono text-xs" defaultValue={attr} placeholder="auto-detected (leave blank)" onBlur={(e: React.FocusEvent<HTMLInputElement>) => write(kind, ref, href, e.target.value)} />
        </Row>
      )}
      {kind === "collection" && (
        <Row label="Omit when empty">
          <ToggleGroup
            className="toggle-group-sm"
            aria-label="Omit when empty"
            value={[omitWhenEmpty ? "on" : "off"]}
            onValueChange={(v: string[]) => v.length && write(kind, ref, href, attr, v[v.length - 1] === "on")}
          >
            <ToggleGroupItem value="off">No</ToggleGroupItem>
            <ToggleGroupItem value="on">Yes</ToggleGroupItem>
          </ToggleGroup>
        </Row>
      )}
      {kind && kind !== "action" && ref && <EmailDataPreview id={id} kind={kind} ref_={ref} omitWhenEmpty={omitWhenEmpty} />}
    </Group>
  );
}

/** A live preview of what this bind/repeat resolves to RIGHT NOW, using the
 *  host's own `resolveBinding`/`resolveCollection` — so an author sees
 *  realistic data while editing, without leaving the canvas. Only meaningful
 *  at top-level scope; a bind nested under a collection ancestor has no
 *  single representative item to preview. */
function EmailDataPreview({ id, kind, ref_, omitWhenEmpty }: { id: string; kind: string; ref_: string; omitWhenEmpty?: boolean }) {
  const editor = useEmailEditor();
  const host = useEmailHost();
  const nestedUnderCollection = React.useMemo(
    () => editor.ancestorsOf(id).some((a) => a.data?.kind === "collection"),
    [editor, id],
  );
  if (nestedUnderCollection) {
    return (
      <Row label="Preview">
        <p className="text-xs text-base-content/45">No preview — this is nested inside a repeat, one per item.</p>
      </Row>
    );
  }
  if (kind === "value") {
    if (!host?.resolveBinding) return null;
    const resolved = host.resolveBinding(ref_, {});
    return (
      <Row label="Preview">
        <p className="truncate text-xs text-base-content/70">
          {resolved.visible === false ? (
            <em className="text-base-content/45">hidden (visible: false)</em>
          ) : (
            String(resolved.value ?? "")
          )}
        </p>
      </Row>
    );
  }
  if (kind === "collection") {
    if (!host?.resolveCollection) return null;
    const items = host.resolveCollection(ref_, {});
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

/** Host-contributed domain panels (a merge-tag picker, a per-module editor)
 *  — ADDITIVE only, rendered after the built-in Settings sections, writing
 *  through the SAME mutation primitives the built-ins use. Absent
 *  `host.inspectorPanels` → renders nothing (a static host needs none of this). */
function EmailHostPanels({ id, node }: { id: string; node: EmailNode }) {
  const editor = useEmailEditor();
  const host = useEmailHost();
  const panels = host?.inspectorPanels?.(node) ?? [];
  if (panels.length === 0) return null;
  const ctx: EmailInspectorPanelCtx = {
    update: (patch) => editor.update(id, patch),
    setData: (binding) => editor.setData(id, binding),
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

export function EmailInspector() {
  const editor = useEmailEditor();
  const selectedId = useEmailSelection();
  const node = useEmailSelectedNode();
  // Persists across selection changes (the Inspector stays mounted), so moving
  // between nodes keeps you in Design or Settings — same as the site Inspector.
  const [tab, setTab] = React.useState<InspectorTab>("design");

  // Same empty state as the site Inspector — nothing selected means nothing
  // to edit. Select "Email" (the document root) in the Navigator or
  // breadcrumb to reach subject/preview text/canvas width/backgrounds/font.
  if (!selectedId || !node) {
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

  const update = (patch: Record<string, unknown>) => editor.update(selectedId, patch);
  const design = designFieldsFor(node, update);
  const settings = settingsFieldsFor(node, update);

  return (
    <div key={selectedId} className="flex flex-1 flex-col min-h-0">
      <Toolbar selectedId={selectedId} node={node} />

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

      {/* Fields are `defaultValue`-based (uncontrolled, committed on blur) so
          typing doesn't fight a re-render — but that means they'd go stale if
          the node changes from elsewhere (a canvas inline text edit, an
          undo/redo) while the same node stays selected. Keying on the node's
          own content forces a remount — and fresh `defaultValue`s — whenever
          that happens. */}
      <div key={JSON.stringify(node)} className="flex-1 min-h-0 overflow-auto">
        {tab === "design" ? (
          design ?? <EmptyTab text="No design options for this element." />
        ) : (
          <>
            {settings ?? <EmptyTab text="No settings for this element." />}
            <EmailDataSection id={selectedId} node={node} />
            <EmailHostPanels id={selectedId} node={node} />
          </>
        )}
      </div>
    </div>
  );
}
