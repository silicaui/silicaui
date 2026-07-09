/**
 * The email Inspector (right rail) — the property panel for the selected node.
 * Unlike the site Inspector (one class-string surface with two tiers of
 * controls over it), email nodes carry small typed prop bags, so this is a
 * straightforward per-kind field form: a breadcrumb + move/duplicate/delete
 * toolbar up top, then the fields for whatever kind is selected. With nothing
 * selected it shows email-level settings (subject, preheader, canvas width,
 * colors, font).
 *
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes + baked <Icon> only.
 */
import * as React from "react";
import { ColorPicker, Input, NativeSelect, Textarea, ToggleGroup, ToggleGroupItem } from "@wizeworks/silicaui-react";
import { useEmailDocument, useEmailEditor, useEmailSelectedNode, useEmailSelection } from "./editor-context";
import { Icon } from "../../shared/react/Icon";
import type { IconName } from "../../shared/icons";
import { ancestorPath, nodeIcon, nodeName } from "../node-display";
import { useSavedBlocks } from "./saved-blocks";
import type {
  Align,
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  DividerNode,
  EmailNode,
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

function TextField({ label, defaultValue, onCommit }: { label: string; defaultValue: string; onCommit: (v: string) => void }) {
  return (
    <Row label={label}>
      <Input size="sm" defaultValue={defaultValue} onBlur={(e: React.FocusEvent<HTMLInputElement>) => onCommit(e.target.value)} />
    </Row>
  );
}

function NumberField({
  label,
  defaultValue,
  min,
  max,
  onCommit,
}: {
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  onCommit: (v: number) => void;
}) {
  return (
    <Row label={label}>
      <Input
        type="number"
        size="sm"
        min={min}
        max={max}
        defaultValue={defaultValue}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onCommit(n);
        }}
      />
    </Row>
  );
}

function ColorField({ label, value, onCommit }: { label: string; value: string; onCommit: (v: string) => void }) {
  return (
    <Row label={label}>
      <ColorPicker variant="swatch" format="hex" value={value} onValueChange={(v: string) => onCommit(v)} />
    </Row>
  );
}

function AlignField({ value, onCommit }: { value: Align; onCommit: (v: Align) => void }) {
  return (
    <Row label="Align">
      <ToggleGroup
        className="toggle-group-sm"
        aria-label="Align"
        value={[value]}
        onValueChange={(v: string[]) => v.length && onCommit(v[v.length - 1] as Align)}
      >
        <ToggleGroupItem value="left"><Icon name="alignLeft" /></ToggleGroupItem>
        <ToggleGroupItem value="center"><Icon name="alignCenter" /></ToggleGroupItem>
        <ToggleGroupItem value="right"><Icon name="alignRight" /></ToggleGroupItem>
      </ToggleGroup>
    </Row>
  );
}

// ── per-kind field sets ────────────────────────────────────────────────────────
function TextFields({ node, update }: { node: TextNode; update: (patch: Partial<TextNode>) => void }) {
  return (
    <>
      <Row label="Content">
        <Textarea
          size="sm"
          rows={3}
          defaultValue={node.html}
          onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => update({ html: e.target.value })}
        />
      </Row>
      <AlignField value={node.align} onCommit={(align) => update({ align })} />
      <ColorField label="Color" value={node.color} onCommit={(color) => update({ color })} />
      <NumberField label="Font size" defaultValue={node.fontSize} min={8} max={72} onCommit={(fontSize) => update({ fontSize })} />
      <NumberField label="Line height" defaultValue={node.lineHeight} min={8} max={96} onCommit={(lineHeight) => update({ lineHeight })} />
    </>
  );
}

function ImageFields({ node, update }: { node: ImageNode; update: (patch: Partial<ImageNode>) => void }) {
  return (
    <>
      <TextField label="Image URL" defaultValue={node.src} onCommit={(src) => update({ src })} />
      <TextField label="Alt text" defaultValue={node.alt} onCommit={(alt) => update({ alt })} />
      <TextField label="Link URL" defaultValue={node.href ?? ""} onCommit={(v) => update({ href: v || undefined })} />
      <NumberField label="Width (px)" defaultValue={node.width} min={16} max={1200} onCommit={(width) => update({ width })} />
      <AlignField value={node.align} onCommit={(align) => update({ align })} />
    </>
  );
}

function ButtonFields({ node, update }: { node: ButtonNode; update: (patch: Partial<ButtonNode>) => void }) {
  return (
    <>
      <TextField label="Label" defaultValue={node.label} onCommit={(label) => update({ label })} />
      <TextField label="Link URL" defaultValue={node.href} onCommit={(href) => update({ href })} />
      <ColorField label="Background" value={node.bg} onCommit={(bg) => update({ bg })} />
      <ColorField label="Text color" value={node.color} onCommit={(color) => update({ color })} />
      <NumberField label="Corner radius" defaultValue={node.radius} min={0} max={40} onCommit={(radius) => update({ radius })} />
      <div className="grid grid-cols-2 gap-x-2">
        <NumberField label="Padding X" defaultValue={node.paddingX} min={0} max={80} onCommit={(paddingX) => update({ paddingX })} />
        <NumberField label="Padding Y" defaultValue={node.paddingY} min={0} max={60} onCommit={(paddingY) => update({ paddingY })} />
      </div>
      <AlignField value={node.align} onCommit={(align) => update({ align })} />
    </>
  );
}

function DividerFields({ node, update }: { node: DividerNode; update: (patch: Partial<DividerNode>) => void }) {
  return (
    <>
      <ColorField label="Color" value={node.color} onCommit={(color) => update({ color })} />
      <NumberField label="Thickness (px)" defaultValue={node.thickness} min={1} max={12} onCommit={(thickness) => update({ thickness })} />
    </>
  );
}

function SpacerFields({ node, update }: { node: SpacerNode; update: (patch: Partial<SpacerNode>) => void }) {
  return <NumberField label="Height (px)" defaultValue={node.height} min={0} max={240} onCommit={(height) => update({ height })} />;
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

function SocialFields({ node, update }: { node: SocialNode; update: (patch: Partial<SocialNode>) => void }) {
  const setLink = (i: number, patch: Partial<SocialLink>) =>
    update({ links: node.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const addLink = () => update({ links: [...node.links, { platform: "facebook", url: "" }] });
  const removeLink = (i: number) => update({ links: node.links.filter((_, idx) => idx !== i) });
  return (
    <>
      <AlignField value={node.align} onCommit={(align) => update({ align })} />
      <div className="grid grid-cols-2 gap-x-2">
        <NumberField label="Icon size" defaultValue={node.iconSize} min={16} max={64} onCommit={(iconSize) => update({ iconSize })} />
        <NumberField label="Gap" defaultValue={node.gap} min={0} max={40} onCommit={(gap) => update({ gap })} />
      </div>
      <Row label={`Links (${node.links.length})`}>
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
      </Row>
    </>
  );
}

function HtmlFields({ node, update }: { node: HtmlNode; update: (patch: Partial<HtmlNode>) => void }) {
  return (
    <Row label="Raw HTML">
      <Textarea
        size="sm"
        rows={8}
        className="font-mono text-xs"
        defaultValue={node.html}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => update({ html: e.target.value })}
      />
    </Row>
  );
}

function VideoFields({ node, update }: { node: VideoNode; update: (patch: Partial<VideoNode>) => void }) {
  return (
    <>
      <TextField label="Thumbnail image URL" defaultValue={node.thumbnail} onCommit={(thumbnail) => update({ thumbnail })} />
      <TextField label="Video URL" defaultValue={node.href} onCommit={(href) => update({ href })} />
      <NumberField label="Width (px)" defaultValue={node.width} min={80} max={1200} onCommit={(width) => update({ width })} />
      <AlignField value={node.align} onCommit={(align) => update({ align })} />
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
    </>
  );
}

function ColumnFields({ node, update }: { node: ColumnNode; update: (patch: Partial<ColumnNode>) => void }) {
  return (
    <NumberField
      label="Width (% of row)"
      defaultValue={node.widthPct}
      min={5}
      max={100}
      onCommit={(widthPct) => update({ widthPct })}
    />
  );
}

function ColumnsFields({ node, update }: { node: ColumnsNode; update: (patch: Partial<ColumnsNode>) => void }) {
  const editor = useEmailEditor();
  return (
    <>
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
    </>
  );
}

function SectionFields({ node, update }: { node: import("../schema").SectionNode; update: (patch: Record<string, unknown>) => void }) {
  return (
    <>
      <ColorField label="Background" value={node.bg} onCommit={(bg) => update({ bg })} />
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
      <div className="grid grid-cols-2 gap-x-2">
        <NumberField label="Padding X" defaultValue={node.paddingX} min={0} max={80} onCommit={(paddingX) => update({ paddingX })} />
        <NumberField label="Padding Y" defaultValue={node.paddingY} min={0} max={80} onCommit={(paddingY) => update({ paddingY })} />
      </div>
    </>
  );
}

// ── email-level settings (shown with nothing selected) ─────────────────────────
function EmailSettings() {
  const editor = useEmailEditor();
  const doc = useEmailDocument();
  const root = doc.root;
  return (
    // Same staleness fix as the per-node fields below: remount (fresh
    // `defaultValue`s) whenever subject/preheader/root change from elsewhere.
    <div key={`${doc.subject}:${doc.preheader}:${JSON.stringify(root)}`} className="flex flex-col divide-y divide-base-200">
      <TextField label="Subject" defaultValue={doc.subject} onCommit={(v) => editor.setSubject(v)} />
      <TextField label="Preview text" defaultValue={doc.preheader} onCommit={(v) => editor.setPreheader(v)} />
      <NumberField label="Canvas width (px)" defaultValue={root.width} min={320} max={800} onCommit={(width) => editor.update(root.id, { width })} />
      <ColorField label="Outer background" value={root.bg} onCommit={(bg) => editor.update(root.id, { bg })} />
      <ColorField label="Content background" value={root.contentBg} onCommit={(contentBg) => editor.update(root.id, { contentBg })} />
      <TextField label="Font family" defaultValue={root.fontFamily} onCommit={(fontFamily) => editor.update(root.id, { fontFamily })} />
    </div>
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
          disabled={isColumn && (sibling?.count ?? 0) >= 6}
          onClick={duplicate}
        />
        <IconButton icon="saved" label="Save as block" onClick={saveAsBlock} />
        <div className="flex-1" />
        <IconButton
          icon="trash"
          label="Delete"
          tone="error"
          disabled={isColumn && (sibling?.count ?? 0) <= 1}
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

export function EmailInspector() {
  const editor = useEmailEditor();
  const selectedId = useEmailSelection();
  const node = useEmailSelectedNode();

  if (!selectedId || !node) {
    return (
      <div className="flex-1 min-h-0 overflow-auto">
        <EmailSettings />
      </div>
    );
  }

  const update = (patch: Record<string, unknown>) => editor.update(selectedId, patch);

  return (
    <div key={selectedId} className="flex flex-1 flex-col min-h-0">
      <Toolbar selectedId={selectedId} node={node} />
      {/* Fields are `defaultValue`-based (uncontrolled, committed on blur) so
          typing doesn't fight a re-render — but that means they'd go stale if
          the node changes from elsewhere (a canvas inline text edit, an
          undo/redo) while the same node stays selected. Keying on the node's
          own content forces a remount — and fresh `defaultValue`s — whenever
          that happens. */}
      <div key={JSON.stringify(node)} className="flex-1 min-h-0 overflow-auto divide-y divide-base-200">
        {node.kind === "text" && <TextFields node={node} update={update} />}
        {node.kind === "image" && <ImageFields node={node} update={update} />}
        {node.kind === "button" && <ButtonFields node={node} update={update} />}
        {node.kind === "divider" && <DividerFields node={node} update={update} />}
        {node.kind === "spacer" && <SpacerFields node={node} update={update} />}
        {node.kind === "social" && <SocialFields node={node} update={update} />}
        {node.kind === "html" && <HtmlFields node={node} update={update} />}
        {node.kind === "video" && <VideoFields node={node} update={update} />}
        {node.kind === "column" && <ColumnFields node={node} update={update} />}
        {node.kind === "columns" && <ColumnsFields node={node} update={update} />}
        {node.kind === "section" && <SectionFields node={node} update={update} />}
        {node.kind === "body" && <EmailSettings />}
      </div>
    </div>
  );
}
