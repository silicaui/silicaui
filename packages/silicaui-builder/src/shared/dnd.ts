/**
 * The drag-and-drop payload protocol shared by the Insert palette (drag source)
 * and the Canvas (drop target). One custom MIME type so a stray file/text drag
 * from outside the builder is ignored, and a tiny `kind:value` wire format so the
 * two sides never disagree on how a drag is read back.
 */

/** The dataTransfer type carrying a builder drag. */
export const DRAG_MIME = "application/x-sui-node";

export type DragPayload =
  | { kind: "insert"; key: string } // a NEW node from the palette catalog
  | { kind: "move"; id: string }; // an EXISTING node being repositioned

/** Serialize a drag for `dataTransfer.setData`. */
export function encodeDrag(p: DragPayload): string {
  return p.kind === "insert" ? `insert:${p.key}` : `move:${p.id}`;
}

/** Parse a drag read from `dataTransfer.getData`; undefined if malformed. */
export function decodeDrag(raw: string): DragPayload | undefined {
  const at = raw.indexOf(":");
  if (at < 0) return undefined;
  const kind = raw.slice(0, at);
  const rest = raw.slice(at + 1);
  if (kind === "insert" && rest) return { kind: "insert", key: rest };
  if (kind === "move" && rest) return { kind: "move", id: rest };
  return undefined;
}

/** Where, relative to the hovered node, a drop lands. */
export type DropEdge = "before" | "after" | "inside";

/** Which way a node's SIBLINGS flow: `y` = they stack, `x` = they sit side by side. */
export type Axis = "x" | "y";

/**
 * Marks the canvas insertion marker's own element. `measuredAxis` walks real DOM
 * siblings, and the marker is already in the DOM by the time the next dragover
 * fires — reading its zero-size rect as if it were content would make the axis
 * flip-flop under the pointer.
 */
export const DROP_MARK = "data-sui-drop";

/**
 * Compare a node against a real sibling: two boxes sharing a vertical span are
 * laid out ACROSS, not down. Used when the parent's `display` doesn't answer it
 * outright (normal flow, inline flow, grid).
 */
function measuredAxis(el: Element): Axis {
  const r = el.getBoundingClientRect();
  for (const sib of [el.previousElementSibling, el.nextElementSibling]) {
    if (!sib || sib.hasAttribute(DROP_MARK)) continue;
    const b = sib.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) continue; // collapsed — tells us nothing
    const overlap = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
    return overlap > Math.min(r.height, b.height) / 2 ? "x" : "y";
  }
  // No sibling to compare against. An inline box sits beside whatever comes
  // next; a block box stacks under it.
  return getComputedStyle(el).display.startsWith("inline") ? "x" : "y";
}

/**
 * Which axis separates `el` from its siblings — the axis a drop's BEFORE/AFTER
 * is decided on, and the one the insertion marker draws across.
 *
 * Without this, both canvases read `clientY` for every drop: correct for a
 * stacked column, meaningless in a flex row, where the whole height of every
 * sibling is "before" at the top and "after" at the bottom and the pointer's
 * actual horizontal position — the only thing the author is aiming with — is
 * thrown away.
 */
export function siblingAxis(el: Element): Axis {
  const parent = el.parentElement;
  if (parent) {
    const cs = getComputedStyle(parent);
    if (cs.display === "flex" || cs.display === "inline-flex") {
      return cs.flexDirection.startsWith("row") ? "x" : "y";
    }
  }
  return measuredAxis(el);
}

/**
 * Which edge of the hovered node a pointer targets. A container reserves a band
 * at each end for BEFORE/AFTER and takes the middle as INSIDE; a leaf splits in
 * half. Both canvases share this so a drop means the same thing in each.
 */
export function edgeFor(
  point: { clientX: number; clientY: number },
  rect: DOMRect,
  axis: Axis,
  container: boolean,
): DropEdge {
  const pos = axis === "x" ? point.clientX - rect.left : point.clientY - rect.top;
  const size = axis === "x" ? rect.width : rect.height;
  if (container) {
    const band = Math.min(size * 0.3, 24);
    if (pos < band) return "before";
    if (pos > size - band) return "after";
    return "inside";
  }
  return pos < size / 2 ? "before" : "after";
}
