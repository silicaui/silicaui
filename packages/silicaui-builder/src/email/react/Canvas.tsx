/**
 * The email Canvas — renders the node tree as a LIVE DOM APPROXIMATION of the
 * email, not the literal table markup the projector emits. Email clients don't
 * share a rendering model (Outlook's Word engine vs WebKit vs Gmail's stripped
 * `<style>`), so there's no single "real" DOM to preview 1:1 the way the site
 * canvas can (browsers render what browsers render); this canvas optimizes for
 * fast, honest-enough WYSIWYG editing — flexbox stands in for the projector's
 * tables, closely enough that structure/spacing/alignment read correctly. The
 * `pnpm verify:email` probe is what guarantees the actual exported HTML is
 * correct, independent of this preview. The real projected HTML is what the
 * Preview mode (`EmailPreview.tsx`) renders instead.
 *
 * The schema is closed and shallow (body → section → columns/column → content),
 * so — unlike the site canvas's generic recursive walker over an open element
 * tree — this is explicit per-kind render functions, each threading
 * `parentId`/`index` down so drag/drop can resolve a precise placement. Every
 * node wrapper carries `data-sui-id`; the shared `SelectionOverlay` draws the
 * selection chrome.
 *
 * Drag-and-drop mirrors the site canvas's contract exactly (same `DRAG_MIME`
 * wire format from `shared/dnd`, same before/after/inside edge resolution), but
 * validity is engine-enforced: `insertRelative`/`insert`/`move` silently no-op
 * on a structurally invalid placement (e.g. a Button dropped directly on a
 * Columns row, which only holds Column) rather than the canvas pre-validating
 * — the schema's `canHold` table is the single source of truth, in `engine.ts`.
 *
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes only, and every
 * class here is a LITERAL string so the harness's `@source` scan safelists it.
 */
import * as React from "react";
import { useEmailDocument, useEmailEditor, useEmailSelectedNode, useEmailSelection } from "./editor-context";
import { SelectionOverlay } from "../../shared/react/SelectionOverlay";
import { Icon } from "../../shared/react/Icon";
import type { IconName } from "../../shared/icons";
import { DRAG_MIME, decodeDrag } from "../../shared/dnd";
import type { DropEdge } from "../../shared/dnd";
import { nodeName, SOCIAL_PLATFORM } from "../node-display";
import { emailPaletteItemByKey } from "../palette";
import { getSavedBlockNode } from "./saved-blocks";
import type { EmailEditor } from "../engine";
import { FONT_WEIGHT_CSS } from "../projector";
import type {
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  ContentNode,
  DividerNode,
  EmailBody,
  EmailColorDefaults,
  EmailNode,
  HtmlNode,
  ImageNode,
  LayoutChild,
  SectionNode,
  SocialNode,
  SpacerNode,
  TextNode,
  VideoNode,
} from "../schema";

/** True for any node that can hold children — mirrors `engine.ts`'s `isContainer`
 *  (kept local since the render tree already switches on kind everywhere). */
function isContainer(node: EmailNode): boolean {
  return node.kind === "body" || node.kind === "section" || node.kind === "columns" || node.kind === "column";
}

/** Resolve a palette drag key to the node to insert, on-brand — a `saved:<id>`
 *  key resolves to a saved block's template (a deep clone; `EmailEditor.insert`
 *  re-stamps fresh ids regardless), any other key is a static catalog item. */
function nodeForInsertKey(key: string, colors: EmailColorDefaults): EmailNode | undefined {
  if (key.startsWith("saved:")) {
    const node = getSavedBlockNode(key.slice("saved:".length));
    return node ? structuredClone(node) : undefined;
  }
  return emailPaletteItemByKey(key)?.make(colors);
}

interface NodeInfo {
  id: string;
  parentId: string | undefined;
  index: number;
  node: EmailNode;
}

interface DndCtx {
  draggingId: string | undefined;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragOver: (info: NodeInfo, e: React.DragEvent) => void;
  onDrop: (info: NodeInfo, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

interface RenderCtx {
  selectedId: string | undefined;
  hoveredId: string | undefined;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onHover: (id: string | undefined, e: React.MouseEvent) => void;
  editingId: string | undefined;
  onEditStart: (id: string) => void;
  onEditCommit: (id: string, html: string) => void;
  onEditCancel: () => void;
  mobile: boolean;
  dnd: DndCtx;
  /** The container currently showing a dashed drop-inside ring. */
  insideId: string | undefined;
  /** Where a drop-line renders: at `index` among `parentId`'s children. */
  lineGap: { parentId: string; index: number } | undefined;
}

/** Which edge of the hovered node a pointer at `clientY` targets. */
function computeEdge(clientY: number, rect: DOMRect, node: EmailNode): DropEdge {
  const y = clientY - rect.top;
  if (isContainer(node)) {
    const band = Math.min(rect.height * 0.3, 22);
    if (y < band) return "before";
    if (y > rect.height - band) return "after";
    return "inside";
  }
  return y < rect.height / 2 ? "before" : "after";
}

/** The hover/selection decoration suffix for a node's wrapper class. */
function decorations(id: string, ctx: RenderCtx): string {
  let s = "";
  if (id === ctx.dnd.draggingId) s += " opacity-40";
  if (id === ctx.insideId) return s + " outline outline-2 outline-dashed outline-accent -outline-offset-2";
  if (id === ctx.hoveredId && id !== ctx.selectedId) s += " outline outline-1 outline-primary/40 -outline-offset-1";
  return s;
}

/** A thin accent bar shown between siblings at the pending drop index. */
function DropLine() {
  return <div className="pointer-events-none h-0.5 w-full rounded-full bg-accent" aria-hidden />;
}

function interactionProps(info: NodeInfo, ctx: RenderCtx, editable = false) {
  const { id, node } = info;
  const draggable = info.parentId !== undefined; // the root can't be moved
  return {
    "data-sui-id": id,
    draggable,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.onSelect(id, e);
    },
    onMouseOver: (e: React.MouseEvent) => {
      e.stopPropagation();
      ctx.onHover(id, e);
    },
    onDragStart: (e: React.DragEvent) => {
      if (!draggable) return;
      e.stopPropagation();
      ctx.dnd.onDragStart(id, e);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.dnd.onDragOver(info, e);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.dnd.onDrop(info, e);
    },
    onDragEnd: (e: React.DragEvent) => {
      e.stopPropagation();
      ctx.dnd.onDragEnd();
    },
    ...(editable
      ? {
          onDoubleClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            ctx.onEditStart(id);
          },
        }
      : {}),
  };
}

/** In-place rich-text editing for a text node: a `contentEditable` div seeded
 *  once with the node's HTML (never reconciled by React while editing — the
 *  classic contentEditable+React trap), committing `innerHTML` on blur/Enter. */
const EditableHtml = React.memo(function EditableHtml({
  initial,
  className,
  onCommit,
  onCancel,
}: {
  initial: string;
  className: string;
  onCommit: (html: string) => void;
  onCancel: () => void;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const done = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = initial;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    onCommit(ref.current?.innerHTML ?? "");
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  return (
    <div
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-sui-editing="true"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      onBlur={commit}
    />
  );
});

function EmptyHint() {
  return (
    <span className="pointer-events-none inline-flex select-none px-2 py-1 text-xs text-base-content/40">
      Empty — insert something from the palette
    </span>
  );
}

/**
 * The floating formatting toolbar shown while a text block is being edited.
 * Uses `document.execCommand` — deprecated but still universally supported for
 * exactly this narrow case (bold/italic/link/list on a live selection inside a
 * `contentEditable`); a custom selection-and-DOM-mutation engine would be wildly
 * disproportionate for four buttons. Every button `onMouseDown`-preventDefaults
 * so clicking it never blurs the `contentEditable` (which would end the edit,
 * via `EditableHtml`'s `onBlur={commit}`, before the command could run).
 */
function TextFormatToolbar() {
  const cmd = (name: string, value?: string) => document.execCommand(name, false, value);
  const link = () => {
    const url = window.prompt("Link URL");
    if (url) cmd("createLink", url);
  };
  const item = (icon: IconName, title: string, onClick: () => void) => (
    <button
      type="button"
      className="btn btn-ghost btn-xs btn-square"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
  return (
    <div
      className="absolute -top-10 left-0 z-30 flex items-center gap-0.5 rounded-btn border border-base-300 bg-base-100 p-1 shadow-md"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {item("bold", "Bold (Ctrl/Cmd+B)", () => cmd("bold"))}
      {item("italic", "Italic (Ctrl/Cmd+I)", () => cmd("italic"))}
      {item("link", "Link", link)}
      {item("list", "Bullet list", () => cmd("insertUnorderedList"))}
    </div>
  );
}

function RenderText({ node, info, ctx }: { node: TextNode; info: NodeInfo; ctx: RenderCtx }) {
  const cls = `min-h-[1.5em] outline-none${decorations(node.id, ctx)}`;
  if (node.id === ctx.editingId) {
    return (
      <div className="relative">
        <TextFormatToolbar />
        <EditableHtml
          initial={node.html}
          className={cls}
          onCommit={(html) => ctx.onEditCommit(node.id, html)}
          onCancel={ctx.onEditCancel}
        />
      </div>
    );
  }
  return (
    <div
      className={cls}
      style={{
        textAlign: node.align,
        color: node.color,
        fontSize: node.fontSize,
        fontWeight: FONT_WEIGHT_CSS[node.fontWeight],
        lineHeight: `${node.lineHeight}px`,
      }}
      dangerouslySetInnerHTML={{ __html: node.html || "<span class='opacity-40'>Empty text</span>" }}
      {...interactionProps(info, ctx, true)}
    />
  );
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ede9fe'/%3E%3Cstop offset='1' stop-color='%23c7d2fe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g)'/%3E%3C/svg%3E";

function RenderImage({ node, info, ctx }: { node: ImageNode; info: NodeInfo; ctx: RenderCtx }) {
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  return (
    <div className={`flex${decorations(node.id, ctx)}`} style={{ justifyContent: justify }} {...interactionProps(info, ctx)}>
      <img
        src={node.src || PLACEHOLDER_IMG}
        alt={node.alt}
        style={{ width: node.width, maxWidth: "100%", display: "block" }}
        className="rounded-none"
      />
    </div>
  );
}

function RenderButton({ node, info, ctx }: { node: ButtonNode; info: NodeInfo; ctx: RenderCtx }) {
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  return (
    <div className={`flex${decorations(node.id, ctx)}`} style={{ justifyContent: justify }} {...interactionProps(info, ctx)}>
      <span
        style={{
          background: node.bg,
          color: node.color,
          borderRadius: node.radius,
          padding: `${node.paddingY}px ${node.paddingX}px`,
        }}
        className="inline-block text-sm font-bold no-underline"
      >
        {node.label || "Button"}
      </span>
    </div>
  );
}

function RenderDivider({ node, info, ctx }: { node: DividerNode; info: NodeInfo; ctx: RenderCtx }) {
  return (
    <div className={`py-1${decorations(node.id, ctx)}`} {...interactionProps(info, ctx)}>
      <hr style={{ border: "none", borderTop: `${node.thickness}px solid ${node.color}` }} />
    </div>
  );
}

function RenderSpacer({ node, info, ctx }: { node: SpacerNode; info: NodeInfo; ctx: RenderCtx }) {
  return (
    <div
      className={`bg-base-content/5${decorations(node.id, ctx)}`}
      style={{ height: node.height }}
      {...interactionProps(info, ctx)}
    />
  );
}

function RenderSocial({ node, info, ctx }: { node: SocialNode; info: NodeInfo; ctx: RenderCtx }) {
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  return (
    <div className={`flex${decorations(node.id, ctx)}`} style={{ justifyContent: justify, gap: node.gap }} {...interactionProps(info, ctx)}>
      {node.links.map((l, i) => (
        <span
          key={i}
          style={{
            width: node.iconSize,
            height: node.iconSize,
            lineHeight: `${node.iconSize}px`,
            background: SOCIAL_PLATFORM[l.platform].color,
            fontSize: Math.max(10, node.iconSize * 0.45),
          }}
          className="inline-block rounded-full text-center font-bold text-white"
        >
          {SOCIAL_PLATFORM[l.platform].label}
        </span>
      ))}
    </div>
  );
}

function RenderHtml({ node, info, ctx }: { node: HtmlNode; info: NodeInfo; ctx: RenderCtx }) {
  return (
    <div
      className={`rounded-field border border-dashed border-base-300 p-2${decorations(node.id, ctx)}`}
      {...interactionProps(info, ctx)}
    >
      <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-base-content/40">
        Custom HTML
      </span>
      <div dangerouslySetInnerHTML={{ __html: node.html }} />
    </div>
  );
}

function RenderVideo({ node, info, ctx }: { node: VideoNode; info: NodeInfo; ctx: RenderCtx }) {
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  return (
    <div className={`relative flex${decorations(node.id, ctx)}`} style={{ justifyContent: justify }} {...interactionProps(info, ctx)}>
      <div className="relative" style={{ width: node.width, maxWidth: "100%" }}>
        <img
          src={node.thumbnail || PLACEHOLDER_IMG}
          alt="Video thumbnail"
          style={{ width: "100%", display: "block" }}
        />
        {node.showPlayButton && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white">
            <Icon name="play" />
          </span>
        )}
      </div>
    </div>
  );
}

function RenderContent({
  node,
  parentId,
  index,
  ctx,
}: {
  node: ContentNode;
  parentId: string;
  index: number;
  ctx: RenderCtx;
}) {
  const info: NodeInfo = { id: node.id, parentId, index, node };
  switch (node.kind) {
    case "text":
      return <RenderText node={node} info={info} ctx={ctx} />;
    case "image":
      return <RenderImage node={node} info={info} ctx={ctx} />;
    case "button":
      return <RenderButton node={node} info={info} ctx={ctx} />;
    case "divider":
      return <RenderDivider node={node} info={info} ctx={ctx} />;
    case "spacer":
      return <RenderSpacer node={node} info={info} ctx={ctx} />;
    case "social":
      return <RenderSocial node={node} info={info} ctx={ctx} />;
    case "html":
      return <RenderHtml node={node} info={info} ctx={ctx} />;
    case "video":
      return <RenderVideo node={node} info={info} ctx={ctx} />;
  }
}

/** Render a list of content/columns children (a Section's or a Column's) with
 *  drop-line gaps interleaved. */
function renderChildren(children: LayoutChild[], parentId: string, ctx: RenderCtx): React.ReactNode {
  const gap = ctx.lineGap && ctx.lineGap.parentId === parentId ? ctx.lineGap.index : -1;
  const out: React.ReactNode[] = [];
  children.forEach((c, i) => {
    if (i === gap) out.push(<DropLine key={`drop-${i}`} />);
    out.push(
      c.kind === "columns" ? (
        <RenderColumns key={c.id} node={c} parentId={parentId} index={i} ctx={ctx} />
      ) : (
        <RenderContent key={c.id} node={c} parentId={parentId} index={i} ctx={ctx} />
      ),
    );
  });
  if (gap === children.length) out.push(<DropLine key="drop-end" />);
  return out;
}

function RenderColumn({
  node,
  parentId,
  index,
  ctx,
}: {
  node: ColumnNode;
  parentId: string;
  index: number;
  ctx: RenderCtx;
}) {
  const info: NodeInfo = { id: node.id, parentId, index, node };
  const empty = node.children.length === 0;
  return (
    <div
      className={`flex flex-col gap-2${empty ? " min-h-14 items-center justify-center bg-base-content/5" : ""}${decorations(node.id, ctx)}`}
      style={{ flex: ctx.mobile ? "1 1 100%" : `0 0 ${node.widthPct}%` }}
      {...interactionProps(info, ctx)}
    >
      {/* A column's children are LayoutChild too — a nested columns row (one
          level of column-in-column nesting) renders through the SAME dispatch
          renderChildren already gives a Section's body. */}
      {empty ? <EmptyHint /> : renderChildren(node.children, node.id, ctx)}
    </div>
  );
}

function RenderColumns({
  node,
  parentId,
  index,
  ctx,
}: {
  node: ColumnsNode;
  parentId: string;
  index: number;
  ctx: RenderCtx;
}) {
  const info: NodeInfo = { id: node.id, parentId, index, node };
  const stack = ctx.mobile && node.stackOnMobile;
  return (
    <div className={`flex gap-3${stack ? " flex-col" : ""}${decorations(node.id, ctx)}`} {...interactionProps(info, ctx)}>
      {node.children.map((c, i) => (
        <RenderColumn key={c.id} node={c} parentId={node.id} index={i} ctx={ctx} />
      ))}
    </div>
  );
}

function RenderSection({
  node,
  index,
  ctx,
  bodyId,
}: {
  node: SectionNode;
  index: number;
  ctx: RenderCtx;
  bodyId: string;
}) {
  const info: NodeInfo = { id: node.id, parentId: bodyId, index, node };
  const empty = node.children.length === 0;
  const bgStyle: React.CSSProperties = { padding: `${node.paddingY}px ${node.paddingX}px` };
  if (node.bgImage) {
    bgStyle.backgroundImage = `url(${node.bgImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else {
    bgStyle.background = node.bg;
  }
  return (
    <div
      className={`flex flex-col gap-3${empty ? " min-h-20 items-center justify-center" : ""}${decorations(node.id, ctx)}`}
      style={bgStyle}
      {...interactionProps(info, ctx)}
    >
      {empty ? <EmptyHint /> : renderChildren(node.children, node.id, ctx)}
    </div>
  );
}

function RenderBody({ node, ctx, width }: { node: EmailBody; ctx: RenderCtx; width: number }) {
  const gap = ctx.lineGap && ctx.lineGap.parentId === node.id ? ctx.lineGap.index : -1;
  return (
    <div
      className="mx-auto flex flex-col divide-y divide-base-content/10 shadow-[0_12px_40px_rgba(20,20,40,0.10)]"
      style={{ width, maxWidth: "100%", background: node.contentBg, fontFamily: node.fontFamily }}
    >
      {node.children.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <EmptyHint />
        </div>
      ) : (
        node.children.map((c, i) => (
          <React.Fragment key={c.id}>
            {i === gap && <DropLine />}
            <RenderSection node={c} index={i} ctx={ctx} bodyId={node.id} />
          </React.Fragment>
        ))
      )}
      {gap === node.children.length && <DropLine />}
    </div>
  );
}

export function EmailCanvas({ device = "desktop" }: { device?: string }) {
  const doc = useEmailDocument();
  const editor = useEmailEditor();
  const selectedId = useEmailSelection();
  const selectedNode = useEmailSelectedNode();
  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | undefined>(undefined);
  const [editingId, setEditingId] = React.useState<string | undefined>(undefined);
  const [draggingId, setDraggingId] = React.useState<string | undefined>(undefined);
  const [dropHint, setDropHint] = React.useState<
    { targetId: string; parentId: string | undefined; index: number; edge: DropEdge } | undefined
  >(undefined);
  const mobile = device === "mobile";
  const rootId = doc.root.id;

  const clearDrag = () => {
    setDropHint(undefined);
    setDraggingId(undefined);
  };

  /** Children count of a node id (for appending a moved node inside it). */
  const childCount = (id: string): number => {
    const n = editor.node(id);
    if (!n) return 0;
    return "children" in n ? (n.children as unknown[]).length : 0;
  };

  const placement = (info: NodeInfo, edge: DropEdge): { parentId: string; index?: number } => {
    if (edge === "inside") return { parentId: info.id };
    if (info.parentId == null) return { parentId: info.id };
    return { parentId: info.parentId, index: edge === "before" ? info.index : info.index + 1 };
  };

  const dnd: DndCtx = {
    draggingId,
    onDragStart: (id, e) => {
      e.dataTransfer.setData(DRAG_MIME, `move:${id}`);
      e.dataTransfer.effectAllowed = "move";
      setDraggingId(id);
    },
    onDragOver: (info, e) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const edge = computeEdge(e.clientY, rect, info.node);
      e.dataTransfer.dropEffect = draggingId ? "move" : "copy";
      setDropHint({ targetId: info.id, parentId: info.parentId, index: info.index, edge });
    },
    onDrop: (info, e) => {
      const raw = e.dataTransfer.getData(DRAG_MIME);
      const payload = decodeDrag(raw);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const edge = computeEdge(e.clientY, rect, info.node);
      clearDrag();
      if (!payload) return;
      const place = placement(info, edge);
      if (payload.kind === "insert") {
        const node = nodeForInsertKey(payload.key, editor.colorDefaults);
        if (node) editor.insert(node, place.parentId, place.index);
      } else {
        if (payload.id === place.parentId) return;
        editor.move(payload.id, place.parentId, place.index ?? childCount(place.parentId));
      }
    },
    onDragEnd: clearDrag,
  };

  // A drop over the canvas margin (outside any node): a NEW node inserts via
  // `insertRelative`'s no-selection fallback (append to body, or its last
  // section for non-Section kinds); an EXISTING node MOVES there via the same
  // fallback target (never `insertRelative` — that would stamp fresh ids and
  // duplicate it instead of relocating it).
  const onCanvasDrop = (e: React.DragEvent) => {
    const payload = decodeDrag(e.dataTransfer.getData(DRAG_MIME));
    clearDrag();
    if (!payload) return;
    if (payload.kind === "insert") {
      const node = nodeForInsertKey(payload.key, editor.colorDefaults);
      if (node) editor.insertRelative(node);
    } else {
      const node = editor.node(payload.id);
      const parentId = node && editor.fallbackParent(node);
      if (parentId && parentId !== payload.id) editor.move(payload.id, parentId, childCount(parentId));
    }
  };

  const insideId = dropHint?.edge === "inside" ? dropHint.targetId : undefined;
  const lineGap =
    dropHint && dropHint.edge !== "inside" && dropHint.parentId
      ? { parentId: dropHint.parentId, index: dropHint.edge === "before" ? dropHint.index : dropHint.index + 1 }
      : undefined;

  const ctx: RenderCtx = {
    selectedId,
    hoveredId,
    onSelect: (id) => editor.select(id),
    onHover: (id) => setHoveredId(id),
    editingId,
    onEditStart: (id) => {
      editor.select(id);
      setEditingId(id);
    },
    onEditCommit: (id, html) => {
      const node = editor.node(id);
      if (node && node.kind === "text" && node.html !== html) editor.update(id, { html });
      setEditingId(undefined);
    },
    onEditCancel: () => setEditingId(undefined),
    mobile,
    dnd,
    insideId,
    lineGap,
  };

  return (
    <div
      className="sui-email-canvas flex-1 min-h-0 overflow-auto bg-base-200 p-8"
      onClick={() => editor.select(undefined)}
      onMouseLeave={() => setHoveredId(undefined)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onCanvasDrop}
    >
      <div ref={boardRef} className="relative mx-auto" style={{ width: mobile ? 375 : doc.root.width + 40 }}>
        <RenderBody node={doc.root} ctx={ctx} width={mobile ? 375 : doc.root.width} />
        <SelectionOverlay
          boardRef={boardRef}
          selectedId={selectedId}
          label={selectedNode ? nodeName(selectedNode) : undefined}
          version={doc}
        />
      </div>
    </div>
  );
}
