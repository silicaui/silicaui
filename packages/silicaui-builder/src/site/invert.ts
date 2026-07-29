/**
 * Op inversion — what to apply to undo a batch of ops (doc 139 §8).
 *
 * WHY THE ENGINE OWNS THIS. A collaborative host drives undo through
 * `setHistoryDelegate`, because the built-in snapshot stack is discarded on
 * every `applyRemoteOps` (a snapshot is only a truthful "before" while this
 * client is the document's only writer). That leaves the host computing each
 * action's inverse — and two op kinds cannot be inverted from outside:
 *
 *   - `symbol.set` that CREATES a symbol. Its inverse is `symbol.delete`, which
 *     carries a detach cascade of freshly-MINTED node ids. A host cannot mint
 *     them: independently-replayed detaches produce different ids on every peer
 *     and the documents diverge while looking identical. Only the engine can
 *     produce a cascade everyone agrees on (`planSymbolDelete`).
 *   - `node.setText`, which replaces `children` with a single string. The prior
 *     structure is simply not in the op, so no `setText` restores it. The fix is
 *     a structural op to invert INTO — `node.setChildren`.
 *
 * Having published `HistoryDelegate`, the engine implied a host could produce
 * inverses it could not. This closes that, and stops every host re-deriving the
 * same 20-odd cases and drifting from `applyOp`.
 *
 * THE `before` DOCUMENT. Most inverses need the prior value: undoing
 * `setClass` means restoring the class that was there, which the op doesn't
 * carry (ops state intent, never ambient state). So inversion reads `before` —
 * the document as it stood immediately BEFORE the batch. Given ops in causal
 * order, `before` is walked FORWARD as it goes, so each op is inverted against
 * the state it actually saw.
 *
 * HONEST ABOUT FAILURE. Returns `null` when a batch cannot be faithfully
 * inverted, rather than a best effort. A wrong undo is worse than a refused
 * one: it silently rewrites the document into a state the author never had.
 */
import { applyOverrides, stampTree, walk } from "@wizeworks/silicaui-html";
import type { Child, Node, Site } from "@wizeworks/silicaui-html";
import type { Op, OpTarget, SymbolDetachment } from "./ops";

/** The tree an op targets, within `site`. */
function treeFor(site: Site, target: OpTarget): Node | undefined {
  if (target.scope === "page") return site.pages.find((p) => p.id === target.id)?.root;
  // A named layout when the target carries an id, else the default shell — the
  // same resolution `Editor.rootFor` does, and it has to match or an edit to a
  // named layout inverts against the wrong tree.
  if (target.scope === "frame") return (target.id ? site.frames?.[target.id] : site.frame)?.root;
  if (target.scope === "symbol") return site.symbols?.[target.id]?.root;
  return undefined;
}

function findNode(root: Node | undefined, id: string): Node | undefined {
  if (!root) return undefined;
  let hit: Node | undefined;
  walk(root, (n) => {
    if (!hit && n.kind !== "outlet" && n.id === id) hit = n;
  });
  return hit;
}

/** The node's parent and its `ord`, needed to put a removed node back. */
function locateIn(root: Node | undefined, id: string): { parent: Node; node: Node } | undefined {
  if (!root) return undefined;
  let hit: { parent: Node; node: Node } | undefined;
  walk(root, (n) => {
    if (hit || n.kind === "outlet") return;
    for (const c of n.children ?? []) {
      if (typeof c !== "string" && c.kind !== "outlet" && c.id === id) hit = { parent: n, node: c };
    }
  });
  return hit;
}

/** Which keys a shallow patch touched, paired with their PRIOR values (`null`
 *  where the key was absent — the wire-safe "delete this key"). */
function inversePatch<T>(
  prior: Record<string, T> | undefined,
  patch: Record<string, unknown>,
): Record<string, T | null> {
  const out: Record<string, T | null> = {};
  for (const key of Object.keys(patch)) {
    out[key] = prior && key in prior ? (prior[key] as T) : null;
  }
  return out;
}

/**
 * The inverse of ONE op, against the document as it stood before it.
 * `undefined` means "not invertible" — the caller turns that into a `null` batch.
 *
 * Most inverses are a single op, and say so; a few need several (undoing a
 * symbol delete has to restore the master AND swap every detached clone back).
 * `invertOp` normalizes both shapes to an array, so only the cases that
 * genuinely need a list pay for one.
 */
function invertOne(op: Op, before: Site): Op | Op[] | undefined {
  const t = op.target;
  switch (op.kind) {
    // ── tree structure ───────────────────────────────────────────────────────
    case "node.insert":
      return { target: t, kind: "node.remove", nodeId: nodeIdOf(op.node) ?? "" };

    case "node.remove": {
      // Put it back exactly where it was — the subtree, its parent, and its
      // `ord`. All three come from `before`; the op itself carries only the id,
      // which is why inversion needs the prior document at all.
      const found = locateIn(treeFor(before, t), op.nodeId);
      if (!found) return undefined;
      const ord = found.node.kind === "outlet" ? undefined : found.node.ord;
      const parentId = nodeIdOf(found.parent);
      if (!ord || !parentId) return undefined;
      return { target: t, kind: "node.insert", parentId, ord, node: structuredClone(found.node) };
    }

    case "node.move": {
      const found = locateIn(treeFor(before, t), op.nodeId);
      const parentId = found && nodeIdOf(found.parent);
      const ord = found && found.node.kind !== "outlet" ? found.node.ord : undefined;
      if (!parentId || !ord) return undefined;
      return { target: t, kind: "node.move", nodeId: op.nodeId, parentId, ord };
    }

    // ── shallow merges: restore exactly the keys this patch touched ──────────
    case "node.setProps": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || (node.kind !== "component" && node.kind !== "host")) return undefined;
      return { target: t, kind: "node.setProps", nodeId: op.nodeId, patch: inversePatch(node.props, op.patch) };
    }
    case "node.setAttrs": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind !== "element") return undefined;
      return { target: t, kind: "node.setAttrs", nodeId: op.nodeId, patch: inversePatch(node.attrs, op.patch) };
    }

    // ── whole-value writes: restore the prior value ──────────────────────────
    case "node.setClass": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind === "outlet") return undefined;
      return { target: t, kind: "node.setClass", nodeId: op.nodeId, class: node.class ?? null };
    }

    case "node.setText":
    case "node.setChildren": {
      // Both invert into `setChildren`: a text write flattens `children` to one
      // string, so the only faithful undo is to restore the child list — which
      // is exactly why `node.setChildren` exists. A COMPONENT's text lives in a
      // prop, so that case inverts into `setProps` instead.
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind === "outlet") return undefined;
      if (op.kind === "node.setText" && node.kind === "component") {
        const props = node.props ?? {};
        const key = "label" in props ? "label" : "text";
        return { target: t, kind: "node.setProps", nodeId: op.nodeId, patch: { [key]: key in props ? props[key] : null } };
      }
      if (node.kind === "host") return undefined; // a leaf — no children to restore
      return { target: t, kind: "node.setChildren", nodeId: op.nodeId, children: structuredClone(node.children ?? []) as Child[] };
    }

    case "node.setTag": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind !== "element") return undefined;
      return { target: t, kind: "node.setTag", nodeId: op.nodeId, tag: node.tag };
    }
    case "node.setBinding": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind === "outlet") return undefined;
      return { target: t, kind: "node.setBinding", nodeId: op.nodeId, binding: node.data ?? null };
    }
    case "node.setBehavior": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind === "outlet") return undefined;
      return { target: t, kind: "node.setBehavior", nodeId: op.nodeId, behavior: node.behavior ?? null };
    }
    case "node.setLocked": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind === "outlet") return undefined;
      return { target: t, kind: "node.setLocked", nodeId: op.nodeId, locked: node.locked ?? null };
    }
    case "node.rename": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind === "outlet") return undefined;
      return { target: t, kind: "node.rename", nodeId: op.nodeId, name: node.label ?? null };
    }
    case "node.setOverride": {
      const node = findNode(treeFor(before, t), op.nodeId);
      if (!node || node.kind === "outlet") return undefined;
      const prior = node.overrides?.[op.masterNodeId];
      return {
        target: t,
        kind: "node.setOverride",
        nodeId: op.nodeId,
        masterNodeId: op.masterNodeId,
        override: prior ? structuredClone(prior) : null,
      };
    }

    // ── pages ────────────────────────────────────────────────────────────────
    case "page.create":
      return { target: t, kind: "page.delete", pageId: op.page.id };
    case "page.delete": {
      const page = before.pages.find((p) => p.id === op.pageId);
      if (!page) return undefined;
      // `page.create` appends, so restoring the page alone would silently move
      // it to the end of the roster. The reorder puts it back where it was.
      return [
        { target: t, kind: "page.create", page: structuredClone(page) },
        { target: t, kind: "page.reorder", pageIds: before.pages.map((p) => p.id) },
      ];
    }
    case "page.rename": {
      const page = before.pages.find((p) => p.id === op.pageId);
      if (!page) return undefined;
      return { target: t, kind: "page.rename", pageId: op.pageId, name: page.name };
    }
    case "page.setSlug": {
      const page = before.pages.find((p) => p.id === op.pageId);
      if (!page) return undefined;
      return { target: t, kind: "page.setSlug", pageId: op.pageId, slug: page.slug };
    }
    case "page.reorder":
      return { target: t, kind: "page.reorder", pageIds: before.pages.map((p) => p.id) };
    case "page.setFrame": {
      const page = before.pages.find((p) => p.id === op.pageId);
      if (!page) return undefined;
      // The tri-state again: ABSENT is not `null`, so read presence, not value.
      return {
        target: t,
        kind: "page.setFrame",
        pageId: op.pageId,
        frameId: "frameId" in page ? page.frameId : undefined,
      };
    }

    // ── symbols ──────────────────────────────────────────────────────────────
    case "symbol.set": {
      const prior = before.symbols?.[op.symbol.id];
      // A REPLACE (rename, master edit) inverts to setting the old one back.
      if (prior) return { target: t, kind: "symbol.set", symbol: structuredClone(prior) };
      // A CREATE inverts to a delete — the case a host could never build, and
      // the reason "undo save-as-component" used to drop the history.
      //
      // The cascade is computed against `before`, where the symbol does not yet
      // exist, so it is normally EMPTY — and that is correct, not a shortcut:
      // the instances are created by later ops in the same action, and an
      // inverse batch runs in reverse, so they are already gone by the time this
      // delete lands. Scanning anyway (rather than hardcoding `[]`) keeps it
      // right for a host that hands over a symbol.set on its own.
      return planSymbolDeleteAgainst(before, op.symbol.id, op.symbol.root);
    }
    case "symbol.delete": {
      const prior = before.symbols?.[op.symbolId];
      if (!prior) return undefined;
      // BOTH halves. Restoring the master alone leaves every instance as the
      // independent clone the cascade swapped in — the symbol would come back
      // with nothing pointing at it, which looks like it worked and isn't what
      // was undone.
      //
      // Each detachment is reversed in place: drop the clone, put the instance
      // node back at its `ord`. The clone's id comes from the op; the instance
      // node itself comes from `before`, the only place it still exists.
      const out: Op[] = [{ target: t, kind: "symbol.set", symbol: structuredClone(prior) }];
      for (const d of op.detach) {
        const found = locateIn(treeFor(before, d.target), d.nodeId);
        const parentId = found && nodeIdOf(found.parent);
        const ord = found && found.node.kind !== "outlet" ? found.node.ord : undefined;
        const cloneId = nodeIdOf(d.node);
        if (!found || !parentId || !ord || !cloneId) return undefined;
        out.push({ target: d.target, kind: "node.remove", nodeId: cloneId });
        out.push({ target: d.target, kind: "node.insert", parentId, ord, node: structuredClone(found.node) });
      }
      return out;
    }

    // ── site-level ───────────────────────────────────────────────────────────
    case "theme.set":
      return { target: t, kind: "theme.set", theme: structuredClone(before.theme) };
    case "savedThemes.set":
      return { target: t, kind: "savedThemes.set", savedThemes: structuredClone(before.savedThemes ?? []) };
    case "frame.setEditable": {
      const frame = t.scope === "frame" && t.id ? before.frames?.[t.id] : before.frame;
      return frame ? { target: t, kind: "frame.setEditable", editable: frame.editable } : undefined;
    }
    case "frame.create":
      return { target: t, kind: "frame.delete", frameId: op.frameId, reassign: [] };
    case "frame.rename": {
      const frame = before.frames?.[op.frameId];
      if (!frame) return undefined;
      return { target: t, kind: "frame.rename", frameId: op.frameId, name: frame.name ?? op.frameId };
    }
    case "frame.delete": {
      const frame = before.frames?.[op.frameId];
      if (!frame) return undefined;
      // Restore the layout AND re-point every page the delete reassigned. The op
      // carries that list precisely so the undo doesn't have to guess which
      // pages used to use it — after the delete, nothing records that.
      return [
        { target: t, kind: "frame.create", frameId: op.frameId, frame: structuredClone(frame) },
        ...op.reassign.map(
          (pageId): Op => ({ target: { scope: "site" }, kind: "page.setFrame", pageId, frameId: op.frameId }),
        ),
      ];
    }
    case "site.replace":
      return {
        target: t,
        kind: "site.replace",
        pages: structuredClone(before.pages),
        frame: before.frame ? structuredClone(before.frame) : undefined,
        symbols: structuredClone(before.symbols ?? {}),
        theme: structuredClone(before.theme),
        savedThemes: structuredClone(before.savedThemes ?? []),
      };
  }
}

const nodeIdOf = (node: Node | undefined): string | undefined =>
  node && node.kind !== "outlet" ? node.id : undefined;

/**
 * `planSymbolDelete`, but against an arbitrary document rather than the live one
 * — inversion runs over `before`, not over current state.
 *
 * `masterOverride` covers the create case, where the symbol is not in `site` yet
 * and the master has to come from the op itself.
 */
function planSymbolDeleteAgainst(site: Site, symbolId: string, masterOverride?: Node): Op | undefined {
  const master = masterOverride ?? site.symbols?.[symbolId]?.root;
  if (!master) return undefined;
  const detach: SymbolDetachment[] = [];
  const scan = (root: Node, target: OpTarget): void =>
    walk(root, (n) => {
      const kids = n.kind !== "outlet" ? n.children : undefined;
      if (!kids) return;
      for (const c of kids) {
        if (c && typeof c !== "string" && c.kind !== "outlet" && c.instanceOf === symbolId && c.id) {
          const detached = stampTree(applyOverrides(structuredClone(master), c.overrides));
          if (detached.kind !== "outlet") detached.ord = c.ord;
          detach.push({ target, nodeId: c.id, node: detached });
        }
      }
    });
  for (const p of site.pages) scan(p.root, { scope: "page", id: p.id });
  if (site.frame) scan(site.frame.root, { scope: "frame" });
  for (const [id, sym] of Object.entries(site.symbols ?? {})) scan(sym.root, { scope: "symbol", id });
  return { target: { scope: "site" }, kind: "symbol.delete", symbolId, detach };
}

/**
 * The ops that undo `op`, against the document as it stood immediately before
 * it — or `undefined` when it cannot be faithfully inverted.
 *
 * The LOOP lives on the `Editor` (`Editor.inverseOf`), not here, because walking
 * the cursor forward between ops requires `applyOp`, which is the engine's. That
 * split is deliberate: this module owns "what is the inverse of X", the engine
 * owns "and then what did the document look like" — so an inverse can never
 * drift from the applier that has to accept it.
 */
export function invertOp(op: Op, before: Site): Op[] | undefined {
  const result = invertOne(op, before);
  if (!result) return undefined;
  return Array.isArray(result) ? result : [result];
}
