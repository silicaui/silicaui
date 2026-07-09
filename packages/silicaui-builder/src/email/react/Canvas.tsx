/**
 * The email Canvas — renders the node tree as a LIVE DOM APPROXIMATION of the
 * email, not the literal table markup the projector emits. Email clients don't
 * share a rendering model (Outlook's Word engine vs WebKit vs Gmail's stripped
 * `<style>`), so there's no single "real" DOM to preview 1:1 the way the site
 * canvas can (browsers render what browsers render); this canvas optimizes for
 * fast, honest-enough WYSIWYG editing — flexbox stands in for the projector's
 * tables, closely enough that structure/spacing/alignment read correctly. The
 * `pnpm verify:email` probe is what guarantees the actual exported HTML is
 * correct, independent of this preview.
 *
 * The schema is closed and shallow (body → section → columns/column → content),
 * so — unlike the site canvas's generic recursive walker over an open element
 * tree — this is explicit per-kind render functions. Every node wrapper carries
 * `data-sui-id`; the shared `SelectionOverlay` draws the selection chrome.
 *
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes only, and every
 * class here is a LITERAL string so the harness's `@source` scan safelists it.
 */
import * as React from "react";
import { useEmailDocument, useEmailEditor, useEmailSelectedNode, useEmailSelection } from "./editor-context";
import { SelectionOverlay } from "../../shared/react/SelectionOverlay";
import { nodeName } from "../node-display";
import type {
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  ContentNode,
  DividerNode,
  EmailBody,
  ImageNode,
  SectionChild,
  SectionNode,
  SpacerNode,
  TextNode,
} from "../schema";

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
}

/** The hover/selection decoration suffix for a node's wrapper class. */
function decorations(id: string, ctx: RenderCtx): string {
  if (id === ctx.hoveredId && id !== ctx.selectedId) {
    return " outline outline-1 outline-primary/40 -outline-offset-1";
  }
  return "";
}

function interactionProps(id: string, ctx: RenderCtx, editable = false) {
  return {
    "data-sui-id": id,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ctx.onSelect(id, e);
    },
    onMouseOver: (e: React.MouseEvent) => {
      e.stopPropagation();
      ctx.onHover(id, e);
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

function RenderText({ node, ctx }: { node: TextNode; ctx: RenderCtx }) {
  const cls = `min-h-[1.5em] outline-none${decorations(node.id, ctx)}`;
  if (node.id === ctx.editingId) {
    return (
      <EditableHtml
        initial={node.html}
        className={cls}
        onCommit={(html) => ctx.onEditCommit(node.id, html)}
        onCancel={ctx.onEditCancel}
      />
    );
  }
  return (
    <div
      className={cls}
      style={{ textAlign: node.align, color: node.color, fontSize: node.fontSize, lineHeight: `${node.lineHeight}px` }}
      dangerouslySetInnerHTML={{ __html: node.html || "<span class='opacity-40'>Empty text</span>" }}
      {...interactionProps(node.id, ctx, true)}
    />
  );
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ede9fe'/%3E%3Cstop offset='1' stop-color='%23c7d2fe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g)'/%3E%3C/svg%3E";

function RenderImage({ node, ctx }: { node: ImageNode; ctx: RenderCtx }) {
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  return (
    <div className={`flex${decorations(node.id, ctx)}`} style={{ justifyContent: justify }} {...interactionProps(node.id, ctx)}>
      <img
        src={node.src || PLACEHOLDER_IMG}
        alt={node.alt}
        style={{ width: node.width, maxWidth: "100%", display: "block" }}
        className="rounded-none"
      />
    </div>
  );
}

function RenderButton({ node, ctx }: { node: ButtonNode; ctx: RenderCtx }) {
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  return (
    <div className={`flex${decorations(node.id, ctx)}`} style={{ justifyContent: justify }} {...interactionProps(node.id, ctx)}>
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

function RenderDivider({ node, ctx }: { node: DividerNode; ctx: RenderCtx }) {
  return (
    <div className={`py-1${decorations(node.id, ctx)}`} {...interactionProps(node.id, ctx)}>
      <hr style={{ border: "none", borderTop: `${node.thickness}px solid ${node.color}` }} />
    </div>
  );
}

function RenderSpacer({ node, ctx }: { node: SpacerNode; ctx: RenderCtx }) {
  return (
    <div
      className={`bg-base-content/5${decorations(node.id, ctx)}`}
      style={{ height: node.height }}
      {...interactionProps(node.id, ctx)}
    />
  );
}

function RenderContent({ node, ctx }: { node: ContentNode; ctx: RenderCtx }) {
  switch (node.kind) {
    case "text":
      return <RenderText node={node} ctx={ctx} />;
    case "image":
      return <RenderImage node={node} ctx={ctx} />;
    case "button":
      return <RenderButton node={node} ctx={ctx} />;
    case "divider":
      return <RenderDivider node={node} ctx={ctx} />;
    case "spacer":
      return <RenderSpacer node={node} ctx={ctx} />;
  }
}

function RenderColumn({ node, ctx }: { node: ColumnNode; ctx: RenderCtx }) {
  const empty = node.children.length === 0;
  return (
    <div
      className={`flex flex-col gap-2${empty ? " min-h-14 items-center justify-center bg-base-content/5" : ""}${decorations(node.id, ctx)}`}
      style={{ flex: ctx.mobile ? "1 1 100%" : `0 0 ${node.widthPct}%` }}
      {...interactionProps(node.id, ctx)}
    >
      {empty ? <EmptyHint /> : node.children.map((c) => <RenderContent key={c.id} node={c} ctx={ctx} />)}
    </div>
  );
}

function RenderColumns({ node, ctx }: { node: ColumnsNode; ctx: RenderCtx }) {
  const stack = ctx.mobile && node.stackOnMobile;
  return (
    <div
      className={`flex gap-3${stack ? " flex-col" : ""}${decorations(node.id, ctx)}`}
      {...interactionProps(node.id, ctx)}
    >
      {node.children.map((c) => (
        <RenderColumn key={c.id} node={c} ctx={ctx} />
      ))}
    </div>
  );
}

function RenderSectionChild({ node, ctx }: { node: SectionChild; ctx: RenderCtx }) {
  return node.kind === "columns" ? <RenderColumns node={node} ctx={ctx} /> : <RenderContent node={node} ctx={ctx} />;
}

function RenderSection({ node, ctx }: { node: SectionNode; ctx: RenderCtx }) {
  const empty = node.children.length === 0;
  return (
    <div
      className={`flex flex-col gap-3${empty ? " min-h-20 items-center justify-center" : ""}${decorations(node.id, ctx)}`}
      style={{ background: node.bg, padding: `${node.paddingY}px ${node.paddingX}px` }}
      {...interactionProps(node.id, ctx)}
    >
      {empty ? <EmptyHint /> : node.children.map((c) => <RenderSectionChild key={c.id} node={c} ctx={ctx} />)}
    </div>
  );
}

function RenderBody({ node, ctx, width }: { node: EmailBody; ctx: RenderCtx; width: number }) {
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
        node.children.map((c) => <RenderSection key={c.id} node={c} ctx={ctx} />)
      )}
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
  const mobile = device === "mobile";

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
  };

  return (
    <div
      className="sui-email-canvas flex-1 min-h-0 overflow-auto bg-base-200 p-8"
      onClick={() => editor.select(undefined)}
      onMouseLeave={() => setHoveredId(undefined)}
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
