/**
 * Other editors' selections, drawn on the canvas.
 *
 * SELECTIONS, NOT CURSORS. A pixel cursor is the wrong primitive for this
 * editor — the document is a node tree with no x/y, which is the same reason
 * pixel nudge and alignment guides were declined. "Ana is in this block" is the
 * fact that matters, and the canvas already has a measured ring and a name tag
 * to say it with, so a peer reuses the local selection's chrome rather than
 * inventing a second visual language: same geometry, same corner-radius
 * matching, dashed and in the peer's own color so it never reads as your own.
 *
 * A host cannot draw this itself. The canvas owns its overlay layer and exposes
 * no seam to paint one node's chrome, and `select` is per-client by design (no
 * ops, nothing relayed), so there is nowhere to put another client's selection.
 *
 * One overlay per peer-selected node. That is N geometry subscriptions, which
 * the secondary-selection case deliberately avoids — but a peer ring cannot be
 * an inline outline class the way a secondary selection can: it carries a
 * per-peer color and a NAME, and the name is the entire point. Peers are a
 * handful of people, not a multi-select of forty nodes.
 */
import * as React from "react";
import { deriveContent } from "@wizeworks/silicaui-html";
import { SelectionOverlay } from "./SelectionOverlay";

export interface PeerMark {
  /** Peer id — stable, so React keys don't churn on every presence tick. */
  id: string;
  nodeId: string;
  name: string;
  color: string;
  /** How many OTHER peers are also on this node (for the "+2" suffix). */
  also: number;
}

/** Measured ink for a label sitting on `color` — the same contrast derivation the
 *  theme editor uses, so a host that passes a pale identity color gets dark text
 *  rather than white-on-yellow. Cached: the roster is small and stable. */
const inkCache = new Map<string, string>();
function labelInk(color: string): string {
  const hit = inkCache.get(color);
  if (hit) return hit;
  // An unparseable color (a `var()`, a named CSS color we can't measure) gets
  // white rather than a guess — the identity colors we generate are mid-tone, and
  // a host that passes something exotic still gets a legible label more often
  // than not. Nothing here is load-bearing enough to warrant a second pass.
  const ink = deriveContent(color)?.value ?? "oklch(100% 0 0)";
  inkCache.set(color, ink);
  return ink;
}

export function PeerOverlay({
  boardRef,
  marks,
  version,
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  marks: readonly PeerMark[];
  /** Changes when the board's content changes — forwarded so rings re-measure. */
  version: unknown;
}) {
  return (
    <>
      {marks.map((m) => (
        <SelectionOverlay
          key={`${m.id}:${m.nodeId}`}
          boardRef={boardRef}
          selectedId={m.nodeId}
          // The count, not a stack of rings: two peers on one node drawn as two
          // overlapping dashed rings is unreadable and says less than the number.
          label={m.also > 0 ? `${m.name} +${m.also}` : m.name}
          version={version}
          color={m.color}
          labelInk={labelInk(m.color)}
          dashed
          // Under the local ring (z-20). When you and someone else are on the
          // same node, yours is the one that has to stay readable.
          z={19}
        />
      ))}
    </>
  );
}
