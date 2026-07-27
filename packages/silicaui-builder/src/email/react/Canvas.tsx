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
 * A host `EmailFrame` (see `frame.ts`) renders here too — its header/footer
 * sections go through the SAME per-kind renderers, inside the same body
 * wrapper, but with a `readOnly` ctx: no `data-sui-id`, no selection, no drag,
 * no inline edit, and no authoring chrome (see `RenderCtx.readOnly`). That's
 * the whole enforcement; the frame never enters the document, so the engine has
 * nothing to guard.
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
import { useEmailHost } from "./host-context";
import { SelectionOverlay } from "../../shared/react/SelectionOverlay";
import { Icon } from "../../shared/react/Icon";
import type { IconName } from "../../shared/icons";
import { DRAG_MIME, decodeDrag } from "../../shared/dnd";
import type { DropEdge } from "../../shared/dnd";
import { nodeName, SOCIAL_PLATFORM } from "../node-display";
import { EMAIL_PALETTE, emailPaletteItemByKey, mergeEmailCatalog } from "../palette";
import type { EmailPaletteItem } from "../palette";
import { getSavedBlockNode } from "./saved-blocks";
import type { EmailEditor } from "../engine";
import { FONT_WEIGHT_CSS, bodyFontStack, fontFaceCss, withLinkColor } from "../projector";
import { frameLabel } from "../frame";
import type { EmailFrame } from "../frame";
import { emailScopeAt, flattenEmailSources } from "../resolve";
import { filterTokenOptions, matchTokenQuery } from "./token-query";
import type { TokenMatch } from "./token-query";
import type {
  ButtonNode,
  ColumnNode,
  ColumnsNode,
  ContentNode,
  DataSource,
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
 *  re-stamps fresh ids regardless); any other key looks up the HOST-MERGED
 *  catalog (`items`), so a key from a host-extended block resolves too — not
 *  just the static default 8. */
function nodeForInsertKey(key: string, colors: EmailColorDefaults, items: readonly EmailPaletteItem[]): EmailNode | undefined {
  if (key.startsWith("saved:")) {
    const node = getSavedBlockNode(key.slice("saved:".length));
    return node ? structuredClone(node) : undefined;
  }
  return emailPaletteItemByKey(key, items)?.make(colors);
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
  /**
   * Render for DISPLAY ONLY — no selection, no drag, no inline editing. This is
   * what makes a host `EmailFrame` inert: its sections go through the exact same
   * render functions the body does (so they can't quietly look different from
   * what sends), but every interaction hook is withheld, and — critically — so
   * is `data-sui-id`, since a frame node is not in the document and no id of
   * it would resolve.
   *
   * It also withholds AUTHORING CHROME, which is the subtler half. Several
   * renderers draw marks that are about the editor rather than the email — the
   * raw-HTML block's "Custom HTML" label, the empty-container "insert
   * something" prompt and its tinted drop well, the image placeholder gradient,
   * the spacer's visibility band. Every one of those is a stand-in for work an
   * author still has to do; painted over host chrome that is already finished,
   * they misreport it as unfinished. (A real report: a composed legal footer
   * read for two days as an empty developer placeholder because the HTML chip
   * sat on top of it.) The rule is therefore general, not per-kind: nothing in
   * a frame region wears body-editor chrome. Each site is marked below.
   */
  readOnly?: boolean;
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
  // Inert rendering wears no decoration, ever. `frameCtx` already clears every
  // id this reads, so this is belt-and-braces — but it's the one place the rule
  // can be stated once, next to `interactionProps`'s matching early return.
  if (ctx.readOnly) return "";
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
  const { id } = info;
  // A read-only render contributes NOTHING — not even `data-sui-id`. One early
  // return here is what keeps every per-kind renderer below unaware that inert
  // rendering exists.
  if (ctx.readOnly) return {};
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
 *  classic contentEditable+React trap), committing `innerHTML` on blur/Enter.
 *  When `tokenSources` is given (the host has `dataSources()`, Q23), typing
 *  `{{` opens a merge-token autocomplete sibling — it never touches the
 *  editable's own children, only reads the live `Selection`/`Range`, so the
 *  contentEditable+React invariant above still holds. */
const EditableHtml = React.memo(function EditableHtml({
  initial,
  className,
  tokenSources,
  onCommit,
  onCancel,
}: {
  initial: string;
  className: string;
  tokenSources?: readonly DataSource[];
  onCommit: (html: string) => void;
  onCancel: () => void;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const done = React.useRef(false);
  const [match, setMatch] = React.useState<TokenMatch | undefined>(undefined);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [popoverPos, setPopoverPos] = React.useState<{ top: number; left: number } | undefined>(undefined);

  const flatSources = React.useMemo(() => flattenEmailSources(tokenSources ?? []), [tokenSources]);
  const options = match ? filterTokenOptions(flatSources, match.query) : [];

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

  /** Reads the LIVE caret (not a cached one) — so a popover-option click,
   *  whose `onMouseDown` deliberately preserves focus/selection (see below),
   *  still resolves against exactly where typing left off, and a stale ref
   *  can never drift out of sync with the actual DOM. */
  const currentMatch = (): { range: Range; match: TokenMatch } | undefined => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return undefined;
    const range = sel.getRangeAt(0);
    if (range.startContainer.nodeType !== Node.TEXT_NODE) return undefined;
    const text = range.startContainer.textContent ?? "";
    const m = matchTokenQuery(text, range.startOffset);
    return m ? { range, match: m } : undefined;
  };

  const syncPopover = () => {
    if (!tokenSources) return;
    const found = currentMatch();
    if (!found) {
      setMatch(undefined);
      return;
    }
    setMatch(found.match);
    setActiveIndex(0);
    const caretRect = found.range.getBoundingClientRect();
    const wrapperRect = ref.current?.parentElement?.getBoundingClientRect();
    if (wrapperRect) setPopoverPos({ top: caretRect.bottom - wrapperRect.top + 4, left: caretRect.left - wrapperRect.left });
  };

  const pick = (value: string) => {
    const found = currentMatch();
    if (!found) return;
    const r = document.createRange();
    r.setStart(found.range.startContainer, found.match.start);
    r.setEnd(found.range.startContainer, found.range.startOffset);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    document.execCommand("insertText", false, `{{${value}}}`);
    setMatch(undefined);
    ref.current?.focus();
  };

  return (
    <>
      <div
        ref={ref}
        className={className}
        contentEditable
        suppressContentEditableWarning
        data-sui-editing="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          syncPopover();
        }}
        onInput={syncPopover}
        onKeyUp={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") syncPopover();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (match && options.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => (i + 1) % options.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => (i - 1 + options.length) % options.length);
              return;
            }
            if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              pick(options[activeIndex]!.value);
              return;
            }
          }
          if (e.key === "Escape" && match) {
            e.preventDefault();
            setMatch(undefined);
            return;
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onBlur={() => {
          // A popover-option's `onMouseDown` preventDefaults, so a pick never
          // fires this — a real blur (clicking away) closes the popover too.
          setMatch(undefined);
          commit();
        }}
      />
      {match && options.length > 0 && popoverPos && (
        <div
          className="absolute z-30 max-h-48 w-56 overflow-auto rounded-btn border border-base-300 bg-base-100 py-1 shadow-md"
          style={{ top: popoverPos.top, left: popoverPos.left }}
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
    </>
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
  const host = useEmailHost();
  const editor = useEmailEditor();
  const cls = `min-h-[1.5em] outline-none${decorations(node.id, ctx)}`;
  if (node.id === ctx.editingId) {
    // Scoped the SAME way the Inspector's Data binding Reference picker is
    // (`emailScopeAt` off this node's ancestors) — only computed while
    // actually editing, since the demo/real host's `dataSources()` may
    // allocate a fresh array per call.
    const tokenSources = host?.dataSources ? emailScopeAt(host.dataSources(), editor.ancestorsOf(node.id)) : undefined;
    return (
      <div className="relative">
        <TextFormatToolbar />
        <EditableHtml
          initial={node.html}
          className={cls}
          tokenSources={tokenSources}
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
      dangerouslySetInnerHTML={{
        __html: node.html
          ? node.linkColor
            ? // The projector's OWN rewrite, not a lookalike — an author who
              // sets a link color has to see on canvas exactly what sends.
              withLinkColor(node.html, node.linkColor)
            : node.html
          : // "Empty text" is an authoring prompt, not content. Inert chrome has
            // no author to prompt, and the projector emits nothing here either.
            ctx.readOnly
            ? ""
            : "<span class='opacity-40'>Empty text</span>",
      }}
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
        // The gradient placeholder is an authoring stand-in for "you haven't
        // picked an image yet". Inert chrome shows the projector's own truth:
        // whatever `src` the host gave, even if that's nothing.
        src={ctx.readOnly ? node.src : node.src || PLACEHOLDER_IMG}
        alt={node.alt}
        style={{ width: node.width, maxWidth: "100%", display: "block" }}
        className="rounded-none"
      />
    </div>
  );
}

function RenderButton({ node, info, ctx }: { node: ButtonNode; info: NodeInfo; ctx: RenderCtx }) {
  const justify = node.align === "center" ? "center" : node.align === "right" ? "flex-end" : "flex-start";
  // Mirrors `renderButton` in the projector: outline drops the fill so the
  // section behind shows through, and defaults to a 1px border.
  const outline = node.variant === "outline";
  const borderWidth = node.borderWidth ?? (outline ? 1 : 0);
  return (
    <div className={`flex${decorations(node.id, ctx)}`} style={{ justifyContent: justify }} {...interactionProps(info, ctx)}>
      <span
        style={{
          background: outline ? "transparent" : node.bg,
          color: node.color,
          borderRadius: node.radius,
          padding: `${node.paddingY}px ${node.paddingX}px`,
          border: borderWidth > 0 ? `${borderWidth}px solid ${node.borderColor ?? node.bg}` : undefined,
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
  // The faint band is how an author SEES an otherwise invisible block well
  // enough to click it. Nothing in inert chrome is clickable, and the projector
  // emits a transparent gap — so inert renders the gap, not the band.
  return (
    <div
      className={ctx.readOnly ? "" : `bg-base-content/5${decorations(node.id, ctx)}`}
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
  // The dashed box and the "Custom HTML" label are the AUTHORING affordance for
  // a block whose rendered output gives a pointer nothing to aim at — they mark
  // "there is an editable raw-HTML node here". In inert host chrome there is no
  // such node to mark, and painting the label over a real, fully-composed legal
  // footer reads it as an unfilled developer placeholder. So inert renders the
  // markup and nothing else — exactly what `renderHtml` passes through.
  if (ctx.readOnly) return <div dangerouslySetInnerHTML={{ __html: node.html }} />;
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
  // `empty` drives DROP-TARGET scaffolding (a minimum height and a tinted well
  // so there's something to aim at) plus the "insert something" prompt. Inert
  // chrome takes neither: an empty frame column is simply empty, as it sends.
  const empty = node.children.length === 0 && !ctx.readOnly;
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
  // Same rule as `RenderColumn` — empty-state scaffolding is authoring chrome.
  const empty = node.children.length === 0 && !ctx.readOnly;
  const borderWidth = node.borderWidth ?? 0;
  const bgStyle: React.CSSProperties = {
    padding: `${node.paddingY}px ${node.paddingX}px`,
    // The projector lowers these to a nested-table card; on canvas plain CSS
    // gets the same picture. `margin` here is the real outer inset, so the
    // body's own background shows through it exactly as it will when sent.
    borderRadius: node.radius || undefined,
    border: borderWidth > 0 ? `${borderWidth}px solid ${node.borderColor ?? node.bg}` : undefined,
    margin: node.marginX || node.marginY ? `${node.marginY ?? 0}px ${node.marginX ?? 0}px` : undefined,
    textAlign: node.align && node.align !== "center" ? node.align : undefined,
  };
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

/**
 * One inert host-chrome region (an `EmailFrame`'s header or footer), rendered
 * INSIDE the body wrapper so it inherits the same width, content background,
 * and font stack the sections around it get — which is also exactly where
 * `composeEmailDocument` puts it in the sent markup.
 *
 * Full fidelity, deliberately: chrome an author can't edit is still chrome they
 * have to design around, so it is not dimmed or ghosted. Dimming would say
 * "unfinished"; the true message is "real, and not yours to edit here".
 *
 * So the region is marked POSITIVELY and PERSISTENTLY: a hairline dashed
 * boundary plus a locked tag carrying the host's own `frame.label`, pinned to
 * the composed email's outer edge (top for the header, bottom for the footer)
 * rather than the seam against the body. Both are always visible — an
 * affordance that only exists on hover can't answer "what is this?" for an
 * author who never hovers — and the boundary strengthens on hover to tie the
 * tag to the region it names.
 */
function FrameRegion({
  where,
  sections,
  label,
  ctx,
}: {
  where: "header" | "footer";
  sections: readonly SectionNode[];
  label: string;
  ctx: RenderCtx;
}) {
  return (
    <div
      className="group relative outline outline-1 outline-dashed outline-base-content/15 -outline-offset-1 hover:outline-base-content/40"
      data-sui-frame={where}
      // Drops are refused outright rather than falling through to the canvas's
      // margin handler — landing a block "somewhere near where I aimed" is
      // worse than an honest no.
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "none";
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="pointer-events-none select-none">
        {sections.map((s, i) => (
          <RenderSection key={s.id || `${where}-${i}`} node={s} index={i} ctx={ctx} bodyId={`frame-${where}`} />
        ))}
      </div>
      {/* Full ink on a real surface, not a faded overlay — this is text meant to
          be READ. Both position variants are spelled out as whole literal class
          strings so the harness's `@source` scan safelists them. */}
      <span
        className={
          where === "header"
            ? "pointer-events-none absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded-btn border border-base-300 bg-base-100 px-1.5 py-0.5 text-xs font-medium text-base-content shadow-sm"
            : "pointer-events-none absolute bottom-1.5 right-1.5 z-20 inline-flex items-center gap-1 rounded-btn border border-base-300 bg-base-100 px-1.5 py-0.5 text-xs font-medium text-base-content shadow-sm"
        }
        data-testid={`email-frame-tag-${where}`}
      >
        <Icon name="lock" /> {label}
      </span>
    </div>
  );
}

function RenderBody({
  node,
  ctx,
  width,
  frame,
}: {
  node: EmailBody;
  ctx: RenderCtx;
  width: number;
  frame?: EmailFrame;
}) {
  const gap = ctx.lineGap && ctx.lineGap.parentId === node.id ? ctx.lineGap.index : -1;
  // The document's `@font-face` rules, injected into the canvas so an author
  // picking a brand face SEES it while composing — same generator the projector
  // emits into the sent `<head>`, and the same resolved stack on the wrapper, so
  // the canvas can't quietly show a different font than the email will.
  const fonts = node.webFonts ?? [];
  // The frame renders through a ctx stripped of every interaction hook — see
  // `RenderCtx.readOnly`. Built once here so both regions share it.
  const frameCtx: RenderCtx = {
    ...ctx,
    readOnly: true,
    selectedId: undefined,
    hoveredId: undefined,
    editingId: undefined,
    insideId: undefined,
    lineGap: undefined,
  };
  const label = frameLabel(frame);
  return (
    <div
      className="mx-auto flex flex-col divide-y divide-base-content/10 shadow-[0_12px_40px_rgba(20,20,40,0.10)]"
      style={{ width, maxWidth: "100%", background: node.contentBg, fontFamily: bodyFontStack(node) }}
    >
      {fonts.length > 0 && <style>{fontFaceCss(fonts)}</style>}
      {frame?.header?.length ? (
        <FrameRegion where="header" sections={frame.header} label={label} ctx={frameCtx} />
      ) : null}
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
      {frame?.footer?.length ? (
        <FrameRegion where="footer" sections={frame.footer} label={label} ctx={frameCtx} />
      ) : null}
    </div>
  );
}

export function EmailCanvas({ device = "desktop", frame }: { device?: string; frame?: EmailFrame }) {
  const doc = useEmailDocument();
  const editor = useEmailEditor();
  const host = useEmailHost();
  const catalogItems = React.useMemo(() => mergeEmailCatalog(EMAIL_PALETTE, host?.catalog?.()), [host]);
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
        const node = nodeForInsertKey(payload.key, editor.colorDefaults, catalogItems);
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
      const node = nodeForInsertKey(payload.key, editor.colorDefaults, catalogItems);
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
      if (node && node.kind === "text" && node.html !== html) editor.update<TextNode>(id, { html });
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
        <RenderBody node={doc.root} ctx={ctx} width={mobile ? 375 : doc.root.width} frame={frame} />
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
