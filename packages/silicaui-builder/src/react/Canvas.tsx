/**
 * The Canvas (center in Page/Layout mode) — renders the live node tree to real
 * DOM inside the document's `[data-theme]` island, so preview == production
 * structurally (it walks the SAME node shape `toHtml` does). Every rendered
 * element carries `data-sui-id`; a click selects that node, and the selected /
 * hovered node gets a non-layout `outline` ring. No iframe — the frame is a plain
 * element whose width drives the block's `@container` queries, so switching device
 * re-flows the design instead of opening a second mobile editor.
 *
 * The canvas is also the drop surface: every node is a drag source (reorder) and a
 * drop target. A drop lands BEFORE / AFTER / INSIDE the hovered node depending on
 * where the pointer sits — shown live by a drop-line between siblings or a dashed
 * ring on a container. Palette drags insert a new node; node drags move an
 * existing one (the engine cycle-guards moves).
 *
 * STYLING RULE (hard): Tailwind utilities + silicaui classes only, and every
 * class here is a LITERAL string so the harness's `@source` scan safelists it.
 */
import * as React from "react";
import type { Child, Node, Theme } from "silicaui-html";
import { rolesOf } from "silicaui-html";
import { useDocument, useEditor, useSelection } from "./editor-context";
import { acceptsChildren } from "../engine";
import { customColorCss } from "../color-cascade";
import { DRAG_MIME, decodeDrag } from "../dnd";
import type { DropEdge } from "../dnd";
import { paletteItemByKey } from "../palette";

/** Document theme tokens → inline CSS vars for the island (mirrors the board). */
function themeVars(theme: Theme): React.CSSProperties {
  const tokens: Record<string, string> = { ...theme.tokens, ...(theme.mode === "dark" ? theme.dark : undefined) };
  const style: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) if (k.startsWith("--")) style[k] = String(v);
  return style as React.CSSProperties;
}

/** Canvas frame width per device — the container the block's `@`-queries read. */
const DEVICE_WIDTH: Record<string, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

/** Component atoms that render as a plain tag carrying class + children. */
const ATOM_TAG: Record<string, string> = {
  Text: "p",
  Badge: "span",
  Card: "div",
  Section: "section",
  Container: "div",
  Grid: "div",
  Stack: "div",
};

const RATIO_CLASS: Record<string, string> = {
  wide: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

const VOID = new Set(["img", "hr", "br", "input", "source", "track", "wbr", "col", "embed"]);

/** A node located in the render pass, with the context a drop needs. */
interface NodeInfo {
  id: string;
  parentId: string | undefined;
  index: number;
  node: Node;
}

/** The drag/drop wiring the whole tree shares (owned by the Canvas component). */
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
  dnd: DndCtx;
  /** The container currently showing a dashed drop-inside ring. */
  insideId: string | undefined;
  /** Where a drop-line renders: at `index` among `parentId`'s children. */
  lineGap: { parentId: string; index: number } | undefined;
}

/** Which edge of the hovered node a pointer at `clientY` targets. */
function computeEdge(clientY: number, rect: DOMRect, node: Node): DropEdge {
  const y = clientY - rect.top;
  if (acceptsChildren(node)) {
    const band = Math.min(rect.height * 0.3, 22);
    if (y < band) return "before";
    if (y > rect.height - band) return "after";
    return "inside";
  }
  return y < rect.height / 2 ? "before" : "after";
}

/** The selection/hover affordance — outline never disturbs layout. */
function ring(id: string | undefined, ctx: RenderCtx): string {
  if (id && id === ctx.selectedId) return " outline outline-2 outline-primary -outline-offset-2";
  if (id && id === ctx.hoveredId) return " outline outline-1 outline-primary/50 -outline-offset-1";
  return "";
}

/** The full decoration suffix: drag-ghost dimming + drop-inside ring wins over selection. */
function decorations(id: string | undefined, ctx: RenderCtx): string {
  let s = "";
  if (id && id === ctx.dnd.draggingId) s += " opacity-40";
  if (id && id === ctx.insideId) return s + " outline outline-2 outline-dashed outline-accent -outline-offset-2";
  return s + ring(id, ctx);
}

/** A thin accent bar shown between siblings at the pending drop index. */
function DropLine() {
  return <div className="pointer-events-none h-0.5 w-full rounded-full bg-accent" aria-hidden />;
}

function renderChildren(children: Child[] | undefined, parentId: string, ctx: RenderCtx): React.ReactNode {
  const list = children ?? [];
  const gap = ctx.lineGap && ctx.lineGap.parentId === parentId ? ctx.lineGap.index : -1;
  const out: React.ReactNode[] = [];
  list.forEach((c, i) => {
    if (i === gap) out.push(<DropLine key={`drop-${i}`} />);
    out.push(
      typeof c === "string" ? (
        <React.Fragment key={i}>{c}</React.Fragment>
      ) : (
        <CanvasNode key={(c.kind !== "outlet" && c.id) || i} node={c} parentId={parentId} index={i} ctx={ctx} />
      ),
    );
  });
  if (gap === list.length) out.push(<DropLine key="drop-end" />);
  return out;
}

/** One node → one React element, mirroring the atom registry's tag/class choices. */
function CanvasNode({
  node,
  parentId,
  index,
  ctx,
}: {
  node: Node;
  parentId: string | undefined;
  index: number;
  ctx: RenderCtx;
}): React.ReactElement | null {
  if (node.kind === "outlet") {
    return (
      <div className="rounded-field border border-dashed border-base-300 p-4 text-center text-sm text-base-content/40">
        Layout outlet — page content renders here
      </div>
    );
  }

  const id = node.id;
  const cls = (node.class ?? "") + decorations(id, ctx);
  // Interaction + drag/drop props every node carries (needs a stamped id).
  const inter: Record<string, unknown> = {};
  if (id) {
    const info: NodeInfo = { id, parentId, index, node };
    const draggable = parentId !== undefined; // the root can't be moved
    inter["data-sui-id"] = id;
    inter.draggable = draggable;
    inter.onClick = (e: React.MouseEvent) => ctx.onSelect(id, e);
    inter.onMouseOver = (e: React.MouseEvent) => ctx.onHover(id, e);
    inter.onDragStart = (e: React.DragEvent) => {
      if (!draggable) return;
      e.stopPropagation();
      ctx.dnd.onDragStart(id, e);
    };
    inter.onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.dnd.onDragOver(info, e);
    };
    inter.onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.dnd.onDrop(info, e);
    };
    inter.onDragEnd = (e: React.DragEvent) => {
      e.stopPropagation();
      ctx.dnd.onDragEnd();
    };
  }

  if (node.kind === "component") {
    const props = node.props ?? {};
    // Button — <a> when it carries an href, else <button>; label is sugar for text.
    if (node.component === "Button") {
      const label = props.label as string | undefined;
      const inner = node.children?.length ? renderChildren(node.children, id ?? "", ctx) : label;
      if (props.href != null) {
        return (
          <a className={cls} href="#" {...inter}>
            {inner}
          </a>
        );
      }
      return (
        <button type="button" className={cls} {...inter}>
          {inner}
        </button>
      );
    }
    // Image — self-closing <img>; ratio maps to an aspect utility.
    if (node.component === "Image") {
      const ratio = typeof props.ratio === "string" ? RATIO_CLASS[props.ratio] ?? "" : "";
      const full = [node.class, ratio].filter(Boolean).join(" ") + decorations(id, ctx);
      const src = (props.src as string | undefined) ?? PLACEHOLDER_IMG;
      return <img className={full} src={src} alt={(props.alt as string) ?? ""} {...inter} />;
    }
    // Heading — <h1>…<h6> from props.level.
    if (node.component === "Heading") {
      const raw = Number(props.level ?? 2);
      const level = Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 2;
      const Tag = `h${level}` as "h1";
      const inner = node.children?.length ? renderChildren(node.children, id ?? "", ctx) : (props.text as string);
      return (
        <Tag className={cls} {...inter}>
          {inner}
        </Tag>
      );
    }
    // Icon — inert placeholder span (a runtime resolves the glyph downstream).
    if (node.component === "Icon") {
      return <span className={cls || "inline-block size-4 rounded bg-base-content/20"} aria-hidden {...inter} />;
    }
    if (node.component === "Divider") {
      return <hr className={cls} {...inter} />;
    }
    // Generic tag atoms (Text/Badge/Card/Section/…): tag + class + text/children.
    const Tag = (ATOM_TAG[node.component] ?? "div") as "div";
    const inner = node.children?.length ? renderChildren(node.children, id ?? "", ctx) : (props.text as string | undefined);
    return (
      <Tag className={cls} {...inter}>
        {inner}
      </Tag>
    );
  }

  // element
  const attrs = sanitizeAttrs(node.attrs);
  if (VOID.has(node.tag)) {
    return React.createElement(node.tag, { className: cls || undefined, ...attrs, ...inter });
  }
  return React.createElement(
    node.tag,
    { className: cls || undefined, ...attrs, ...inter },
    renderChildren(node.children, id ?? "", ctx),
  );
}

/** Keep only render-safe HTML attributes; neutralize live navigation on <a>. */
function sanitizeAttrs(
  attrs: Record<string, string | number | boolean> | undefined,
): Record<string, string | number | boolean> {
  if (!attrs) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "href") out.href = "#"; // design surface — never navigate away
    else out[k] = v;
  }
  return out;
}

// A neutral gradient stand-in so an unset Image still has presence on the canvas.
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ede9fe'/%3E%3Cstop offset='1' stop-color='%23c7d2fe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g)'/%3E%3C/svg%3E";

export function Canvas({ device = "desktop" }: { device?: string }) {
  const doc = useDocument();
  const editor = useEditor();
  const selectedId = useSelection();
  const [hoveredId, setHoveredId] = React.useState<string | undefined>(undefined);
  const [draggingId, setDraggingId] = React.useState<string | undefined>(undefined);
  const [dropHint, setDropHint] = React.useState<
    { targetId: string; parentId: string | undefined; index: number; edge: DropEdge } | undefined
  >(undefined);
  const theme = doc.theme;
  const rootId = doc.root.kind === "outlet" ? undefined : doc.root.id;
  const customCss = React.useMemo(() => customColorCss(theme, ".sui-canvas"), [theme]);
  // Every named role reaches the canvas the same way it reaches the board.
  void rolesOf(theme);

  /** Children count of a node id (for appending a moved node inside it). */
  const childCount = (id: string): number => {
    const n = editor.node(id);
    return n && n.kind !== "outlet" ? n.children?.length ?? 0 : 0;
  };

  /** Resolve a hovered node + edge into a concrete (parentId, index?) placement. */
  const placement = (info: NodeInfo, edge: DropEdge): { parentId: string; index?: number } => {
    if (edge === "inside") return { parentId: info.id };
    if (info.parentId == null) return { parentId: info.id }; // root has no siblings
    return { parentId: info.parentId, index: edge === "before" ? info.index : info.index + 1 };
  };

  const clearDrag = () => {
    setDropHint(undefined);
    setDraggingId(undefined);
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
        const item = paletteItemByKey(payload.key);
        if (item) editor.insert(item.make(), place.parentId, place.index);
      } else {
        if (payload.id === place.parentId) return; // can't drop into itself
        editor.move(payload.id, place.parentId, place.index ?? childCount(place.parentId));
      }
    },
    onDragEnd: clearDrag,
  };

  // A drop over the canvas margin (outside any node) appends to the page root.
  const onCanvasDrop = (e: React.DragEvent) => {
    const payload = decodeDrag(e.dataTransfer.getData(DRAG_MIME));
    clearDrag();
    if (!payload || !rootId) return;
    if (payload.kind === "insert") {
      const item = paletteItemByKey(payload.key);
      if (item) editor.insert(item.make(), rootId);
    } else {
      editor.move(payload.id, rootId, childCount(rootId));
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
    onSelect: (id, e) => {
      e.preventDefault();
      e.stopPropagation();
      editor.select(id);
    },
    onHover: (id, e) => {
      e.stopPropagation();
      setHoveredId(id);
    },
    dnd,
    insideId,
    lineGap,
  };

  return (
    <div
      className="sui-canvas flex-1 min-h-0 overflow-auto p-8 bg-base-200 text-base-content"
      data-theme={theme.name}
      style={themeVars(theme)}
      onClick={() => editor.select(undefined)}
      onMouseLeave={() => setHoveredId(undefined)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onCanvasDrop}
    >
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div
        className="mx-auto min-h-[440px] rounded-box border border-base-300 bg-base-100 shadow-[0_12px_40px_rgba(20,20,40,0.10)] transition-[max-width] duration-200"
        style={{ maxWidth: DEVICE_WIDTH[device] ?? "100%" }}
      >
        <CanvasNode node={doc.root} parentId={undefined} index={0} ctx={ctx} />
      </div>
    </div>
  );
}
