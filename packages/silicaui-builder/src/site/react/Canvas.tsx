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
 * STYLING RULE (hard): Tailwind utilities + @wizeworks/silicaui classes only, and every
 * class here is a LITERAL string so the harness's `@source` scan safelists it.
 */
import * as React from "react";
import type { Child, ElementNode, Node, Theme } from "@wizeworks/silicaui-html";
import { applyOverrides, expandComponent, rolesOf, walk } from "@wizeworks/silicaui-html";
import { useActiveRoot, useActiveTree, useDocument, useEditor, useSelectedNode, useSelection } from "./editor-context";
import { acceptsChildren } from "../engine";
import type { Editor } from "../engine";
import { customColorCss } from "../color-cascade";
import { DRAG_MIME, decodeDrag } from "../../shared/dnd";
import type { DropEdge } from "../../shared/dnd";
import { paletteItemByKey } from "../palette";
import { editableText, inlineEditable, nodeName } from "../node-display";
import { SelectionOverlay } from "../../shared/react/SelectionOverlay";

/** Resolve a palette drag key to the node to insert: a `symbol:<id>` key builds a
 *  linked instance (through the engine), any other key is a static catalog item. */
function nodeForInsertKey(editor: Editor, key: string): Node | undefined {
  if (key.startsWith("symbol:")) return editor.makeInstanceNode(key.slice("symbol:".length));
  return paletteItemByKey(key)?.make();
}

/** A composite selection/edit key that targets a node INSIDE an instance. */
const COMPOSITE = "::";
function isComposite(key: string | undefined): key is string {
  return !!key && key.includes(COMPOSITE);
}
/** Split `instanceId::masterId`. */
function splitComposite(key: string): { instanceId: string; masterId: string } {
  const at = key.indexOf(COMPOSITE);
  return { instanceId: key.slice(0, at), masterId: key.slice(at + COMPOSITE.length) };
}
/** The MASTER node a composite key points at (for inline-edit + default text). */
function masterNodeOf(editor: Editor, key: string): Node | undefined {
  const { instanceId, masterId } = splitComposite(key);
  const inst = editor.node(instanceId);
  const symbolId = inst && inst.kind !== "outlet" ? inst.instanceOf : undefined;
  const root = symbolId ? editor.symbol(symbolId)?.root : undefined;
  if (!root) return undefined;
  let hit: Node | undefined;
  walk(root, (n) => {
    if (!hit && n.kind !== "outlet" && n.id === masterId) hit = n;
  });
  return hit;
}

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

const VOID = new Set(["img", "hr", "br", "input", "source", "track", "wbr", "col", "embed"]);

/** A neutral placeholder class so an empty Icon (a span with no size) still reads
 *  on the canvas — production has no such class, so this is canvas-only. */
const ICON_PLACEHOLDER = "inline-block size-4 rounded bg-base-content/20";

/**
 * Reveal-safe positioning for the MODAL-family panels/backdrops (Dialog,
 * Drawer, AlertDialog, Lightbox, CommandPalette — the ones `component.ts`
 * documents as sharing one `modal` behavior shape). Their real CSS is
 * `position: fixed` (Lightbox's is full-viewport `inset: 0`) — correct in
 * production, but on the canvas a revealed one (see `canvasAttrs`'s
 * `data-sui-part` reveal) permanently blankets the WHOLE APP (palette,
 * inspector, everything), since there's no dismiss affordance the way there
 * is at runtime. Forcing `absolute` docks it to the board (`position:
 * relative`) instead — bounded, still fully visible/editable. Deliberately
 * scoped to these LITERAL classes, not a generic `[data-sui-part="panel"]`
 * selector — Tabs/Accordion/Collapsible/Wizard panels also carry `part:
 * "panel"` but render in normal document flow; forcing `absolute` on THOSE
 * pulls them out of flow and collapses/overlaps sibling content (a real
 * regression caught by `catalog-gap.spec.ts`'s Wizard test).
 */
const FIXED_POSITION_OVERLAY_CLASSES = [
  "dialog-popup", "dialog-backdrop",
  "drawer-popup", "drawer-backdrop",
  "lightbox-popup", "lightbox-backdrop",
  "command-palette-popup", "command-palette-backdrop",
];
const REVEALED_PANEL_CSS = `
.sui-canvas ${FIXED_POSITION_OVERLAY_CLASSES.map((c) => `.${c}`).join(", .sui-canvas ")} {
  position: absolute !important;
}
`.trim();

/** A component is a macro: expand it to the element (sub)tree a projection renders.
 *  The canvas draws that element through its normal element path — so a new
 *  component needs a def, not a render branch here. The expansion root always is an
 *  element (the 12 atoms lower to one); a non-element root falls back to a div. */
function asElement(node: Node): ElementNode {
  if (node.kind !== "component") return node as ElementNode;
  const ex = expandComponent(node);
  return ex.kind === "element" ? ex : { kind: "element", tag: "div", class: node.class };
}

/** The concrete HTML tag a text node renders as — the expansion's own tag, so
 *  inline editing edits the SAME element the user sees. */
function textTag(node: Node): string {
  if (node.kind === "element") return node.tag;
  if (node.kind === "component") return asElement(node).tag;
  return "div";
}

/**
 * In-place text editing for a canvas text node. Renders the node's real tag as a
 * `contentEditable` element and — crucially — passes NO React children: the seed
 * text is written into the DOM once on mount, so React never reconciles the inner
 * content and typing is never clobbered by an unrelated parent re-render (the
 * classic contentEditable+React trap). Commits `textContent` on blur or Enter;
 * Escape cancels. The commit is guarded to fire exactly once (blur can race Enter).
 */
const EditableText = React.memo(function EditableText({
  tag,
  className,
  initial,
  onCommit,
  onCancel,
}: {
  tag: string;
  className: string;
  initial: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const done = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = initial;
    el.focus();
    // Select all so the first keystroke replaces the placeholder text.
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
    onCommit(ref.current?.textContent ?? "");
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  return React.createElement(tag, {
    ref,
    className,
    contentEditable: true,
    suppressContentEditableWarning: true,
    "data-sui-editing": "true",
    // Keep clicks/drag-starts inside the field from reaching the canvas (which
    // would deselect) or the node (which would start a drag).
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    },
    onBlur: commit,
  });
});

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
  /** The text node currently being edited in place (contentEditable), if any. */
  editingId: string | undefined;
  /** Enter in-place edit for a text node. */
  onEditStart: (id: string) => void;
  /** Commit edited text (compared against current — a no-op edit adds no history). */
  onEditCommit: (id: string, text: string) => void;
  /** Abandon the in-place edit, keeping the original text. */
  onEditCancel: () => void;
  /** The container currently showing a dashed drop-inside ring. */
  insideId: string | undefined;
  /** Where a drop-line renders: at `index` among `parentId`'s children. */
  lineGap: { parentId: string; index: number } | undefined;
  /**
   * What an Outlet renders: the OTHER layer's tree, and whether it shows inert
   * (context) or live (editable). In Page mode the frame is context and the page
   * inside the Outlet is editable; in Layout mode it's the reverse.
   */
  outlet?: { tree: Node; preview: boolean };
  /** True while rendering the inert (non-editable) context layer. */
  preview?: boolean;
  /** Resolve a symbol id → its master tree, so an instance node expands in place. */
  symbolRoot?: (id: string) => Node | undefined;
  /** The chain of symbol ids currently being expanded — breaks a self-referential
   *  instance (a symbol dropped into its own master) instead of recursing forever. */
  symbolPath?: readonly string[];
  /** Set while rendering INSIDE an instance's expanded master: selection/edit keys
   *  become composite (`instanceId::masterId`) and edits route to overrides. */
  instance?: { id: string };
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

/**
 * The hover affordance — a light layout-safe outline. Selection is drawn by the
 * `SelectionOverlay` (focus ring + label), so the selected node gets no inline
 * ring; we also suppress the hover ring on it so the two don't stack.
 */
function ring(id: string | undefined, ctx: RenderCtx): string {
  if (id && id === ctx.hoveredId && id !== ctx.selectedId) {
    return " outline outline-1 outline-primary/40 -outline-offset-1";
  }
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

/**
 * A container with no visible content. Such a node collapses to zero height in
 * real layout, leaving nothing to aim a drop at — so on the CANVAS (only) we give
 * it a minimum drop area + a faint fill + this label. None of it touches
 * `node.class`, so the exported markup stays exactly what the user authored.
 */
function isEmptyContainer(node: Node): boolean {
  if (!acceptsChildren(node)) return false;
  const kids = node.kind === "outlet" ? [] : node.children ?? [];
  return !kids.some((c) => (typeof c === "string" ? c.trim().length > 0 : true));
}

/** Canvas-only decoration that makes an empty container a real drop target. */
const EMPTY_DECOR = " min-h-14 bg-base-content/5";

/** The placeholder shown inside an empty container (pointer-transparent so drops
 *  land on the container, not the hint). */
function EmptyHint() {
  return (
    <span className="pointer-events-none inline-flex select-none px-2 py-1 text-xs text-base-content/40">
      Empty — drop something here
    </span>
  );
}

/** The corner chip that marks a node on the canvas as a symbol INSTANCE (a linked
 *  copy — edit its master to change every instance). Shown on hover/selection so
 *  it doesn't clutter; pointer-transparent so it never eats a click. */
function SymbolBadge({ name }: { name: string }) {
  return (
    <span className="pointer-events-none absolute right-0 top-0 z-10 inline-flex items-center gap-1 rounded-bl-md bg-secondary px-1.5 py-0.5 text-xs font-medium leading-none text-secondary-content">
      <span aria-hidden>◆</span>
      <span className="max-w-[120px] truncate">{name}</span>
    </span>
  );
}

/** Shown when an instance references a symbol that no longer exists (defensive —
 *  delete detaches instances, so this normally never appears). */
function MissingSymbol() {
  return (
    <span className="inline-flex select-none px-2 py-1 text-xs text-error">
      Missing component
    </span>
  );
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
    // The Outlet is where the two layers meet: it renders the OTHER tree. When
    // that tree is the context layer it's inert + badged (edit it in the other
    // mode); when it's the active layer it renders live so you edit the page body
    // sitting inside the real frame chrome. `outlet: undefined` in the child ctx
    // stops a nested page's own Outlet (if any) from recursing.
    if (ctx.outlet) {
      const { tree, preview } = ctx.outlet;
      const childCtx: RenderCtx = { ...ctx, preview, outlet: undefined };
      const inner = <CanvasNode node={tree} parentId={undefined} index={0} ctx={childCtx} />;
      if (preview) {
        return (
          <div className="pointer-events-none relative">
            <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-selector bg-base-content/10 px-2 py-0.5 text-xs text-base-content/50">
              Page content
            </span>
            {inner}
          </div>
        );
      }
      // Editable page body inside the (inert) frame chrome — re-enable pointer
      // events so clicks/drags reach the page even though a frame ancestor is inert.
      return <div className="pointer-events-auto">{inner}</div>;
    }
    return (
      <div className="rounded-field border border-dashed border-base-300 p-4 text-center text-sm text-base-content/40">
        Layout outlet — page content renders here
      </div>
    );
  }

  const id = node.id;
  // Inside an instance we're rendering a clone of the master, whose nodes carry the
  // MASTER's ids — shared across every instance. So the selection/edit KEY is
  // composite (`instanceId::masterId`), unique per instance and the same key an
  // override is stored under. Outside an instance the key is just the node id.
  const inInstance = ctx.instance;
  const key = inInstance && id ? `${inInstance.id}::${id}` : id;
  const empty = !ctx.preview && !inInstance && isEmptyContainer(node);
  const deco = ctx.preview ? "" : decorations(key, ctx);

  // In-place text editing: this node's own tag becomes a contentEditable field.
  // Short-circuit here so it renders as the raw element (no atom sugar, no drag
  // wiring) for the duration of the edit. `outline-none` drops the browser's focus
  // ring — the SelectionOverlay already frames it. Inside an instance, committing
  // writes a per-instance OVERRIDE (routed by the composite key), not a master edit.
  if (key && !ctx.preview && key === ctx.editingId && inlineEditable(node)) {
    return (
      <EditableText
        tag={textTag(node)}
        className={`${node.class ?? ""} outline-none`}
        initial={editableText(node) ?? ""}
        onCommit={(text) => ctx.onEditCommit(key, text)}
        onCancel={ctx.onEditCancel}
      />
    );
  }

  // Interaction props. Suppressed under `preview` (inert context layer).
  const inter: Record<string, unknown> = {};
  if (key && !ctx.preview) {
    if (inInstance) {
      // Inside an instance the whole instance is the selectable UNIT — click/hover
      // an inner node targets the INSTANCE. Double-clicking text drills in to edit
      // it in place, which writes a per-instance OVERRIDE (routed by the composite
      // key), never a master edit. Inner nodes are never draggable (structure is
      // the master's).
      inter.onClick = (e: React.MouseEvent) => ctx.onSelect(inInstance.id, e);
      inter.onMouseOver = (e: React.MouseEvent) => ctx.onHover(inInstance.id, e);
      if (inlineEditable(node)) {
        inter.onDoubleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          ctx.onEditStart(key);
        };
      }
    } else if (id) {
      const info: NodeInfo = { id, parentId, index, node };
      const draggable = parentId !== undefined; // the root can't be moved
      inter["data-sui-id"] = id;
      inter.draggable = draggable;
      inter.onClick = (e: React.MouseEvent) => ctx.onSelect(id, e);
      inter.onMouseOver = (e: React.MouseEvent) => ctx.onHover(id, e);
      if (inlineEditable(node)) {
        inter.onDoubleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          ctx.onEditStart(id);
        };
      }
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
  }

  // A symbol INSTANCE — expand it to a fresh render of its master, INERT inside
  // (the master is edited via its own mode, not through the instance), so the
  // whole instance selects/drags/deletes as one unit. Output flattens the wrapper
  // away; here it's the selection host + carries the ◆ badge. A dangling ref shows
  // a "missing" marker rather than a broken tree.
  if (node.instanceOf) {
    const cyclic = (ctx.symbolPath ?? []).includes(node.instanceOf);
    const rawMaster = cyclic ? undefined : ctx.symbolRoot?.(node.instanceOf);
    // Bake this instance's per-instance overrides over a clone of the master, so a
    // customized instance reads its own text on the canvas (output flattens the same).
    const master = rawMaster ? applyOverrides(structuredClone(rawMaster), node.overrides) : undefined;
    // Drill-in: a TOP-LEVEL instance on the editable surface renders its master
    // INTERACTIVE (click to select an inner node, double-click text to override it
    // in place). Nested instances, or an instance in an inert context layer, render
    // the master read-only (preview) — no drilling deeper than one level.
    const canDrill = !ctx.preview && !inInstance;
    const innerCtx: RenderCtx = {
      ...ctx,
      preview: !canDrill,
      instance: canDrill && id ? { id } : ctx.instance,
      outlet: undefined,
      symbolPath: [...(ctx.symbolPath ?? []), node.instanceOf],
    };
    const inner = master ? (
      <CanvasNode node={master} parentId={undefined} index={0} ctx={innerCtx} />
    ) : (
      <MissingSymbol />
    );
    const badge = id && (id === ctx.selectedId || id === ctx.hoveredId);
    const cls = `relative block ${node.class ?? ""}${deco}`.trim();
    return React.createElement(
      "div",
      { className: cls || undefined, ...inter },
      badge ? <SymbolBadge name={node.label ?? "Component"} /> : null,
      inner,
    );
  }

  // A component is a macro — expand it to its element (sub)tree and render THAT
  // through the SAME element path a hand-authored element takes (the expansion
  // carries the node's class + children). Interaction wiring (`inter`) stays bound
  // to the component node's id, so the whole macro selects/drags as one unit. This
  // is why a new component costs a def, never a render branch here.
  const el = asElement(node);
  // An empty Icon expands to a bare <span> with no size — fall back to a visible
  // placeholder when the assembled class is empty (canvas-only; production has none).
  const isIcon = node.kind === "component" && node.component === "Icon";
  const cls =
    ((el.class ?? "") + deco + (empty ? EMPTY_DECOR : "")) || (isIcon ? ICON_PLACEHOLDER : "");
  const attrs = canvasAttrs(el);

  if (VOID.has(el.tag)) {
    return React.createElement(el.tag, { className: cls || undefined, ...attrs, ...inter });
  }
  // <textarea> can't take children in React — surface its value as defaultValue so
  // the canvas preview stays uncontrolled + warning-free (production uses children).
  if (el.tag === "textarea") {
    const text = textOf(el.children);
    if (text) attrs.defaultValue = text;
    return React.createElement(el.tag, { className: cls || undefined, ...attrs, ...inter });
  }
  return React.createElement(
    el.tag,
    { className: cls || undefined, ...attrs, ...inter },
    empty ? <EmptyHint /> : renderChildren(el.children, id ?? "", ctx),
  );
}

/** Concatenate a node's direct string children (a control's text value). */
function textOf(children: Child[] | undefined): string {
  if (!children) return "";
  return children.filter((c): c is string => typeof c === "string").join("");
}

/** HTML attribute → the camelCase name React requires (warns on the raw form). */
const REACT_ATTR: ReadonlyArray<readonly [string, string]> = [
  ["tabindex", "tabIndex"],
  ["readonly", "readOnly"],
  ["maxlength", "maxLength"],
  ["minlength", "minLength"],
  ["colspan", "colSpan"],
  ["rowspan", "rowSpan"],
  ["for", "htmlFor"],
  ["autocomplete", "autoComplete"],
  ["autofocus", "autoFocus"],
  ["spellcheck", "spellCheck"],
  ["crossorigin", "crossOrigin"],
  ["srcset", "srcSet"],
  ["novalidate", "noValidate"],
  ["enctype", "encType"],
  ["inputmode", "inputMode"],
];

/**
 * The render-ready attributes for a canvas element: the expansion's own attrs,
 * plus a canvas-only stand-in `src` so an unset Image still has presence on the
 * design surface (production markup — via `toHtml` — omits it). `<a href>` is
 * neutralized to "#" by `sanitizeAttrs` so a canvas click never navigates away.
 */
function canvasAttrs(el: ElementNode): Record<string, string | number | boolean> {
  const attrs = sanitizeAttrs(el.attrs);
  // React demands certain HTML attributes in camelCase and warns on the raw
  // lowercase DOM name. Authored nodes carry standard HTML names (what `toHtml`
  // emits), so normalize the common set here — canvas-only; production markup is
  // unchanged. `aria-*`/`data-*`/`role`/`hidden` are already correct lowercase.
  for (const [dom, react] of REACT_ATTR) rename(attrs, dom, react);
  if (el.tag === "img" && attrs.src == null) attrs.src = PLACEHOLDER_IMG;
  // Form controls: render UNCONTROLLED on the design surface. React warns if a
  // form field gets `value`/`checked` without an `onChange`; the canvas is a static
  // preview, so map them to their default* forms (production HTML keeps value/checked).
  // Scoped to the controls themselves — an `<option value>` is a plain attribute,
  // not controlled state, and must keep its `value` (React infers from it otherwise).
  if (el.tag === "input" || el.tag === "select") {
    rename(attrs, "value", "defaultValue");
    rename(attrs, "checked", "defaultChecked");
  }
  // `<option selected>` (e.g. PhoneInput's country picker authors this
  // directly) has no uncontrolled equivalent the way input/select do — React
  // only recognizes `selected` via the PARENT <select>'s `value`/`defaultValue`,
  // not a per-option prop (there's no real `defaultSelected`). Simplest correct
  // canvas-only fix: drop it. Production `toHtml` is untouched (this never
  // touches `node.attrs`, just the ephemeral render-time copy) — canvas is
  // already an approximation, and the option's own text still reads fine
  // unselected.
  if (el.tag === "option") delete attrs.selected;
  // Behavior parts (a disclosure/tabs/menu `panel`) ship `hidden` so they don't
  // flash open before the runtime hydrates. The canvas has no runtime, so a hidden
  // panel would be un-editable — reveal it here, exactly as the runtime's preview
  // mode does (§9.8). Canvas-only: toHtml still emits `hidden` for production.
  if (el.part === "panel" && (attrs.hidden === true || attrs.hidden === "")) {
    delete attrs.hidden;
  }
  // Canvas-only debug hook, mirroring what production `toHtml` already emits
  // (to-html.ts) — NOT what `REVEALED_PANEL_CSS` below keys off (that targets
  // specific known-fixed-position classes; a generic `part="panel"` selector
  // would also catch Tabs/Accordion/Wizard's normal-flow panels and break
  // their layout by yanking them out of flow).
  if (el.part) attrs["data-sui-part"] = el.part;
  return attrs;
}

/** Move `attrs[from]` to `attrs[to]` if present (canvas prop normalization). */
function rename(
  attrs: Record<string, string | number | boolean>,
  from: string,
  to: string,
): void {
  if (from in attrs) {
    attrs[to] = attrs[from] as string | number | boolean;
    delete attrs[from];
  }
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
  const selectedNode = useSelectedNode();
  const activeTree = useActiveTree();
  const root = useActiveRoot();
  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | undefined>(undefined);
  const [editingRaw, setEditingRaw] = React.useState<string | undefined>(undefined);
  const [draggingId, setDraggingId] = React.useState<string | undefined>(undefined);
  const [dropHint, setDropHint] = React.useState<
    { targetId: string; parentId: string | undefined; index: number; edge: DropEdge } | undefined
  >(undefined);
  const theme = doc.theme;
  // Drops on the canvas margin append to the ACTIVE tree's root (the editable one).
  const rootId = root.kind === "outlet" ? undefined : root.id;
  // The canvas always renders the composed site: when a frame exists it's the
  // shell, with the page in its Outlet; only which layer is editable flips with
  // the mode. With no frame, the page renders bare (Layout mode mints one).
  // Editing a symbol master: the canvas renders THAT tree bare (no frame/outlet
  // composition) — it's a component in isolation, not a page. `root` is the live
  // master (via useActiveRoot). Otherwise render the composed site as before.
  const symbolEditing = activeTree === "symbol";
  const frameRoot = symbolEditing ? undefined : doc.frame?.root;
  const shellNode = symbolEditing ? root : frameRoot ?? doc.root;
  const editingPage = activeTree === "page";
  const shellPreview = frameRoot ? editingPage : false;
  const outlet = frameRoot ? { tree: doc.root, preview: !editingPage } : undefined;
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
        const node = nodeForInsertKey(editor, payload.key);
        if (node) editor.insert(node, place.parentId, place.index);
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
      const node = nodeForInsertKey(editor, payload.key);
      if (node) editor.insert(node, rootId);
    } else {
      editor.move(payload.id, rootId, childCount(rootId));
    }
  };

  const insideId = dropHint?.edge === "inside" ? dropHint.targetId : undefined;
  const lineGap =
    dropHint && dropHint.edge !== "inside" && dropHint.parentId
      ? { parentId: dropHint.parentId, index: dropHint.edge === "before" ? dropHint.index : dropHint.index + 1 }
      : undefined;

  // Resolve the edit target against the LIVE tree: a page/layout switch, or an
  // undo that removed the node, silently ends the edit (no dangling contentEditable).
  // A composite key (editing INSIDE an instance) resolves to its master node.
  const editingNode = editingRaw
    ? isComposite(editingRaw)
      ? masterNodeOf(editor, editingRaw)
      : editor.node(editingRaw)
    : undefined;
  const editingId = editingNode && inlineEditable(editingNode) ? editingRaw : undefined;

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
    editingId,
    onEditStart: (id) => {
      // Drilling into an instance keeps the INSTANCE selected (the atomic unit);
      // the edit target is the composite key, tracked separately in editingRaw.
      editor.select(isComposite(id) ? splitComposite(id).instanceId : id);
      setEditingRaw(id);
    },
    onEditCommit: (id, text) => {
      if (isComposite(id)) {
        // Editing inside an instance → write a per-instance override. Text equal to
        // the master default (or empty) clears the override instead of pinning it.
        const { instanceId, masterId } = splitComposite(id);
        const master = masterNodeOf(editor, id);
        const def = master ? editableText(master) : undefined;
        editor.setInstanceOverrideText(instanceId, masterId, text === "" || text === def ? undefined : text);
        setEditingRaw(undefined);
        return;
      }
      const node = editor.node(id);
      const current = node ? editableText(node) : undefined;
      if (text !== current) editor.setText(id, text);
      setEditingRaw(undefined);
    },
    onEditCancel: () => setEditingRaw(undefined),
    insideId,
    lineGap,
    outlet,
    preview: shellPreview,
    symbolRoot: (sid) => editor.symbol(sid)?.root,
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
      <style dangerouslySetInnerHTML={{ __html: REVEALED_PANEL_CSS }} />
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div
        ref={boardRef}
        className="relative mx-auto min-h-[440px] rounded-box border border-base-300 bg-base-100 shadow-[0_12px_40px_rgba(20,20,40,0.10)] transition-[max-width] duration-200"
        style={{ maxWidth: DEVICE_WIDTH[device] ?? "100%" }}
      >
        <CanvasNode node={shellNode} parentId={undefined} index={0} ctx={ctx} />
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
