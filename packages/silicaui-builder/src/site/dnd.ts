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
