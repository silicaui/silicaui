/**
 * The Canvas (center in Page/Layout mode) — renders the live node tree to real
 * DOM inside the document's `[data-theme]` island, so preview == production
 * structurally (it walks the SAME node shape `toHtml` does). Every rendered
 * element carries `data-sui-id`; a click selects that node, and the selected /
 * hovered node gets a non-layout `outline` ring. No iframe — the frame is a plain
 * element whose width drives the block's `@container` queries, so switching device
 * re-flows the design instead of opening a second mobile editor.
 *
 * STYLING RULE (hard): Tailwind utilities + silicaui classes only, and every
 * class here is a LITERAL string so the harness's `@source` scan safelists it.
 */
import * as React from "react";
import type { Child, Node, Theme } from "silicaui-html";
import { rolesOf } from "silicaui-html";
import { useDocument, useEditor, useSelection } from "./editor-context";
import { customColorCss } from "../color-cascade";

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

interface RenderCtx {
  selectedId: string | undefined;
  hoveredId: string | undefined;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onHover: (id: string | undefined, e: React.MouseEvent) => void;
}

/** The selection/hover affordance — outline never disturbs layout. */
function ring(id: string | undefined, ctx: RenderCtx): string {
  if (id && id === ctx.selectedId) return " outline outline-2 outline-primary -outline-offset-2";
  if (id && id === ctx.hoveredId) return " outline outline-1 outline-primary/50 -outline-offset-1";
  return "";
}

/** Interaction props shared by every rendered node (select + hover, no navigation). */
function interactions(id: string | undefined, ctx: RenderCtx): React.HTMLAttributes<HTMLElement> {
  if (!id) return {};
  return {
    "data-sui-id": id,
    onClick: (e) => ctx.onSelect(id, e),
    onMouseOver: (e) => ctx.onHover(id, e),
  } as React.HTMLAttributes<HTMLElement> & { "data-sui-id": string };
}

function renderChildren(children: Child[] | undefined, ctx: RenderCtx): React.ReactNode {
  if (!children) return null;
  return children.map((c, i) =>
    typeof c === "string" ? (
      <React.Fragment key={i}>{c}</React.Fragment>
    ) : (
      <CanvasNode key={(c.kind !== "outlet" && c.id) || i} node={c} ctx={ctx} />
    ),
  );
}

/** One node → one React element, mirroring the atom registry's tag/class choices. */
function CanvasNode({ node, ctx }: { node: Node; ctx: RenderCtx }): React.ReactElement | null {
  if (node.kind === "outlet") {
    return (
      <div className="rounded-field border border-dashed border-base-300 p-4 text-center text-sm text-base-content/40">
        Layout outlet — page content renders here
      </div>
    );
  }

  const cls = (node.class ?? "") + ring(node.id, ctx);
  const inter = interactions(node.id, ctx);

  if (node.kind === "component") {
    const props = node.props ?? {};
    // Button — <a> when it carries an href, else <button>; label is sugar for text.
    if (node.component === "Button") {
      const label = props.label as string | undefined;
      const inner = node.children?.length ? renderChildren(node.children, ctx) : label;
      if (props.href != null) {
        return <a className={cls} href="#" {...inter}>{inner}</a>;
      }
      return <button type="button" className={cls} {...inter}>{inner}</button>;
    }
    // Image — self-closing <img>; ratio maps to an aspect utility.
    if (node.component === "Image") {
      const ratio = typeof props.ratio === "string" ? RATIO_CLASS[props.ratio] ?? "" : "";
      const full = [node.class, ratio].filter(Boolean).join(" ") + ring(node.id, ctx);
      const src = (props.src as string | undefined) ?? PLACEHOLDER_IMG;
      return <img className={full} src={src} alt={(props.alt as string) ?? ""} {...inter} />;
    }
    // Heading — <h1>…<h6> from props.level.
    if (node.component === "Heading") {
      const raw = Number(props.level ?? 2);
      const level = Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 2;
      const Tag = `h${level}` as "h1";
      const inner = node.children?.length ? renderChildren(node.children, ctx) : (props.text as string);
      return <Tag className={cls} {...inter}>{inner}</Tag>;
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
    const inner = node.children?.length ? renderChildren(node.children, ctx) : (props.text as string | undefined);
    return <Tag className={cls} {...inter}>{inner}</Tag>;
  }

  // element
  const attrs = sanitizeAttrs(node.attrs);
  if (VOID.has(node.tag)) {
    return React.createElement(node.tag, { className: cls || undefined, ...attrs, ...inter });
  }
  return React.createElement(
    node.tag,
    { className: cls || undefined, ...attrs, ...inter },
    renderChildren(node.children, ctx),
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
  const theme = doc.theme;
  const customCss = React.useMemo(() => customColorCss(theme, ".sui-canvas"), [theme]);
  // Every named role reaches the canvas the same way it reaches the board.
  void rolesOf(theme);

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
  };

  return (
    <div
      className="sui-canvas flex-1 min-h-0 overflow-auto p-8 bg-base-200 text-base-content"
      data-theme={theme.name}
      style={themeVars(theme)}
      onClick={() => editor.select(undefined)}
      onMouseLeave={() => setHoveredId(undefined)}
    >
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <div
        className="mx-auto min-h-[440px] rounded-box border border-base-300 bg-base-100 shadow-[0_12px_40px_rgba(20,20,40,0.10)] transition-[max-width] duration-200"
        style={{ maxWidth: DEVICE_WIDTH[device] ?? "100%" }}
      >
        <CanvasNode node={doc.root} ctx={ctx} />
      </div>
    </div>
  );
}
