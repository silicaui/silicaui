/**
 * Peer identity colors — the one place a person's ring/label color is decided.
 *
 * DELIBERATELY NOT A THEME ROLE. Every other color in this editor comes from the
 * token system, and this is the exception that proves the rule: a peer painted
 * `primary` vanishes into a document that is mostly primary, and two peers
 * painted from an 8-role palette collide as soon as there are more than a few
 * people. Peer color is IDENTITY — it has to stay distinguishable against
 * whatever palette the tenant happens to be editing, including a tenant whose
 * brand is the same hue.
 *
 * So the default is derived from the peer's own id: a fixed hue wheel in OKLCH
 * (not hex — the same reason nothing else here is hex: OKLCH's lightness is
 * perceptual, so every hue on the wheel reads at the same weight, which a hex
 * wheel does not). A host that tracks its own presence colors passes
 * `Peer.color` and wins.
 */
import { walk } from "@wizeworks/silicaui-html";
import type { Node } from "@wizeworks/silicaui-html";
import type { Peer } from "./engine";

/**
 * Every node id inside the subtrees `peers` are holding — the claim roots and
 * all their descendants, flattened.
 *
 * Flattened rather than "is an ancestor of this claimed?" because the canvas and
 * the Navigator ask about every node they draw, and a per-node ancestor walk on
 * a page of hundreds is work done hundreds of times for an answer that changes
 * once. A marker on the claim root ALONE would be worse than either: every child
 * would look free while every edit to it was refused.
 *
 * Reads the tree it is handed (never the engine), so a caller memoizing on the
 * active root is correct without a second invalidation signal — an insert under
 * a claimed node changes this set with no presence tick at all.
 */
export function claimedNodeIds(root: Node, peers: readonly Peer[]): Map<string, Peer> {
  const held = new Map<string, Peer>();
  for (const peer of peers) {
    for (const nodeId of peer.claim ?? []) {
      const claimRoot = nodeById(root, nodeId);
      if (!claimRoot) continue; // a claim on another tree, or on a node since deleted
      walk(claimRoot, (n) => {
        // First holder wins, matching the engine's own index — a contested claim
        // is a host bug, and a stable answer beats two names flickering.
        if (n.kind !== "outlet" && n.id && !held.has(n.id)) held.set(n.id, peer);
      });
    }
  }
  return held;
}

/** Depth-first id lookup in an extracted tree (view-side; the engine owns writes). */
export function nodeById(root: Node, id: string): Node | undefined {
  let hit: Node | undefined;
  walk(root, (n) => {
    if (!hit && n.kind !== "outlet" && n.id === id) hit = n;
  });
  return hit;
}

/**
 * Six hues at one lightness/chroma — far enough apart to tell apart at the width
 * of a 2px ring, and mid-lightness so the same value reads on a white page and a
 * dark one without a per-mode variant.
 */
const PEER_HUES = [12, 68, 142, 196, 262, 322];

/** A small, stable, order-independent hash — same peer, same color, every
 *  session and every client, without the host having to assign one. */
function hueIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % PEER_HUES.length;
}

/** The color to paint a peer's ring, label and Navigator marker with. */
export function peerColor(peer: Peer): string {
  return peer.color ?? `oklch(62% 0.17 ${PEER_HUES[hueIndex(peer.id)]})`;
}

/**
 * Which peers have each node selected, flattened for the canvas — one pass over
 * the roster instead of a scan per node, since the canvas asks about every node
 * it renders.
 *
 * A node selected by several people maps to several peers, in roster order. The
 * canvas draws the first and counts the rest rather than stacking rings nobody
 * can tell apart.
 */
export function peerSelectionIndex(peers: readonly Peer[]): Map<string, Peer[]> {
  const index = new Map<string, Peer[]>();
  for (const peer of peers) {
    for (const id of peer.selection ?? []) {
      const at = index.get(id);
      if (at) at.push(peer);
      else index.set(id, [peer]);
    }
  }
  return index;
}
