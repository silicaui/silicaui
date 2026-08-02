import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface TreeNode {
  /** Stable identity (React key + selection/expansion id). */
  id: string;
  /** Row label. */
  label: React.ReactNode;
  /**
   * Plain-text name, used to seed inline rename. `label` may be rich (badges,
   * status glyphs), so it can't be edited directly — this is the part that is
   * actually the node's name. Required for a `renamable` row.
   */
  name?: string;
  /** Whether this row can be renamed in place (needs `onRename` on the tree). */
  renamable?: boolean;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  /** Child nodes; presence makes the node expandable. */
  children?: TreeNode[];
  disabled?: boolean;
}

/** Where, relative to the row a drag is released over, the dragged node lands. */
export type TreeDropEdge = "before" | "after" | "inside";

export interface TreeViewProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect"> {
  /** The node forest. */
  items: TreeNode[];
  /** Controlled set of expanded node ids. */
  expanded?: string[];
  /** Uncontrolled initial expanded ids. */
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** Controlled selected node id. */
  selected?: string;
  /** Uncontrolled initial selected id. */
  defaultSelected?: string;
  onSelectedChange?: (id: string) => void;
  /** Fires with the full node when one is selected. */
  onSelect?: (node: TreeNode) => void;
  /**
   * Enables row drag-to-reorder/-reparent (rows become `draggable`) and fires
   * once a drag is released over a valid row: `edge` is "before"/"after" a
   * sibling or "inside" (append as a child). TreeView only guards against
   * dropping a node onto itself or its own descendant (which the geometry
   * already knows); it does NOT know which nodes are valid containers, so the
   * consumer's own move logic is the source of truth for the rest — an
   * "inside" drop onto something that can't hold children should just no-op.
   */
  onMove?: (id: string, targetId: string, edge: TreeDropEdge) => void;
  /**
   * Enables inline rename on rows marked `renamable` (double-click the row, or
   * F2 on a focused one) and fires ONCE on commit — Enter or blur, never per
   * keystroke, so a consumer with an undo stack gets one entry per rename
   * rather than one per character. Escape cancels without firing. An empty
   * value is passed through: for most trees that means "clear the name and go
   * back to the derived one", which only the consumer can decide.
   */
  onRename?: (id: string, value: string) => void;
}

interface Flat {
  node: TreeNode;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
  parentId?: string;
}

function flatten(
  nodes: TreeNode[],
  level: number,
  expandedSet: Set<string>,
  parentId: string | undefined,
  out: Flat[],
): Flat[] {
  for (const node of nodes) {
    const hasChildren = !!node.children?.length;
    const isExpanded = expandedSet.has(node.id);
    out.push({ node, level, hasChildren, expanded: isExpanded, parentId });
    if (hasChildren && isExpanded) {
      flatten(node.children as TreeNode[], level + 1, expandedSet, node.id, out);
    }
  }
  return out;
}

const Chevron = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children && findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

/** `node`'s id plus every descendant's — the set no drag of `node` may land on. */
function subtreeIds(node: TreeNode, out: Set<string> = new Set()): Set<string> {
  out.add(node.id);
  node.children?.forEach((child) => subtreeIds(child, out));
  return out;
}

/** Which edge of a row at `rect` a drag release at `clientY` targets. */
function computeDropEdge(clientY: number, rect: DOMRect): TreeDropEdge {
  const y = clientY - rect.top;
  const band = Math.min(rect.height * 0.3, 10);
  if (y < band) return "before";
  if (y > rect.height - band) return "after";
  return "inside";
}

/**
 * TreeView — a hierarchical tree with full keyboard support (↑/↓ move,
 * →/← expand-or-descend / collapse-or-ascend, Home/End, Enter selects, Space
 * toggles). Feed it a `TreeNode[]` forest; control expansion via
 * `expanded`/`onExpandedChange` and selection via `selected`/`onSelectedChange`,
 * or run uncontrolled with the `default*` props.
 */
export const TreeView = React.forwardRef<HTMLUListElement, TreeViewProps>(
  function TreeView(
    {
      items,
      expanded,
      defaultExpanded,
      onExpandedChange,
      selected,
      defaultSelected,
      onSelectedChange,
      onSelect,
      onMove,
      onRename,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const sc = useSilicaClass();

    const expandedControlled = expanded !== undefined;
    const [expandedInternal, setExpandedInternal] = React.useState<Set<string>>(
      () => new Set(defaultExpanded ?? []),
    );
    // Memoized because the `flatten` useMemo below depends on it: building the
    // Set inline made a new object every render, so in the CONTROLLED case that
    // memo never hit and the whole tree re-flattened on every render.
    const expandedSet = React.useMemo(
      () => (expandedControlled ? new Set(expanded) : expandedInternal),
      [expandedControlled, expanded, expandedInternal],
    );

    const selectedControlled = selected !== undefined;
    const [selectedInternal, setSelectedInternal] = React.useState<
      string | undefined
    >(defaultSelected);
    const selectedId = selectedControlled ? selected : selectedInternal;

    const flat = React.useMemo(
      () => flatten(items, 0, expandedSet, undefined, []),
      [items, expandedSet],
    );

    const [focusedId, setFocusedId] = React.useState<string | undefined>();
    const activeId = focusedId ?? flat[0]?.node.id;
    const nodeRefs = React.useRef(new Map<string, HTMLLIElement>());

    const [draggingId, setDraggingId] = React.useState<string | undefined>();
    const [dropHint, setDropHint] = React.useState<
      { id: string; edge: TreeDropEdge } | undefined
    >();
    // Every id a node currently being dragged may NOT land on (itself + its
    // own descendants — dropping there would orphan the subtree).
    const blockedIds = React.useMemo(() => {
      if (!draggingId) return undefined;
      const node = findNode(items, draggingId);
      return node && subtreeIds(node);
    }, [items, draggingId]);
    const clearDrag = () => {
      setDraggingId(undefined);
      setDropHint(undefined);
    };

    const commitExpanded = (next: Set<string>) => {
      if (!expandedControlled) setExpandedInternal(next);
      onExpandedChange?.([...next]);
    };
    const toggleExpand = (id: string) => {
      const next = new Set(expandedSet);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      commitExpanded(next);
    };
    const setExpand = (id: string, open: boolean) => {
      if (expandedSet.has(id) === open) return;
      const next = new Set(expandedSet);
      if (open) next.add(id);
      else next.delete(id);
      commitExpanded(next);
    };

    const selectNode = (node: TreeNode) => {
      if (node.disabled) return;
      if (!selectedControlled) setSelectedInternal(node.id);
      onSelectedChange?.(node.id);
      onSelect?.(node);
    };

    const focusId = (id: string) => {
      setFocusedId(id);
      nodeRefs.current.get(id)?.focus();
    };

    const [renamingId, setRenamingId] = React.useState<string | undefined>();
    // Whether the active rename has already been committed or cancelled by a
    // key, so the blur it triggers is a no-op. Reset on every entry, so a
    // rename that ends without a blur can't poison the next one.
    const settledRef = React.useRef(false);
    const canRename = (node: TreeNode) => !!onRename && !!node.renamable && !node.disabled;
    const startRename = (node: TreeNode) => {
      if (!canRename(node)) return;
      settledRef.current = false;
      setRenamingId(node.id);
    };
    /** Leave rename mode and hand focus back to the row, so ↑/↓ keep working. */
    const endRename = (id: string, value?: string) => {
      setRenamingId(undefined);
      if (value !== undefined) onRename?.(id, value);
      focusId(id);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, id: string) => {
      const idx = flat.findIndex((f) => f.node.id === id);
      const entry = flat[idx];
      if (!entry) return;
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = flat[idx + 1];
          if (next) focusId(next.node.id);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = flat[idx - 1];
          if (prev) focusId(prev.node.id);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (flat[0]) focusId(flat[0].node.id);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = flat[flat.length - 1];
          if (last) focusId(last.node.id);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (!entry.hasChildren) break;
          if (!entry.expanded) setExpand(entry.node.id, true);
          else {
            const child = flat[idx + 1];
            if (child && child.parentId === entry.node.id) focusId(child.node.id);
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (entry.hasChildren && entry.expanded) setExpand(entry.node.id, false);
          else if (entry.parentId) focusId(entry.parentId);
          break;
        }
        case "Enter": {
          e.preventDefault();
          selectNode(entry.node);
          if (entry.hasChildren) toggleExpand(entry.node.id);
          break;
        }
        case " ": {
          e.preventDefault();
          if (entry.hasChildren) toggleExpand(entry.node.id);
          else selectNode(entry.node);
          break;
        }
        case "F2": {
          if (!canRename(entry.node)) break;
          e.preventDefault();
          startRename(entry.node);
          break;
        }
      }
    };

    /**
     * The in-place name field. Uncontrolled — the consumer owns the committed
     * name and the draft only has to survive until Enter/Escape/blur. Written
     * as a function returning an element, NOT a nested component: a nested
     * component would be a fresh type every render, so any unrelated re-render
     * would remount the field and drop what the user had typed.
     */
    const renameField = (node: TreeNode) => (
      <input
        className={cx(sc("tree-rename"))}
        defaultValue={node.name ?? ""}
        aria-label="Rename"
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        // The row beneath handles click-to-select and dblclick-to-rename, so
        // without these, clicking into the field re-toggles the row.
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onBlur={(e) => {
          // Enter and Escape have already settled it; the blur they cause by
          // handing focus back to the row must not commit a second time.
          if (settledRef.current) return;
          endRename(node.id, e.currentTarget.value.trim());
        }}
        onKeyDown={(e) => {
          // Arrows/Home/End would otherwise walk the tree instead of the text.
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            settledRef.current = true;
            endRename(node.id, e.currentTarget.value.trim());
          } else if (e.key === "Escape") {
            e.preventDefault();
            settledRef.current = true;
            endRename(node.id);
          }
        }}
      />
    );

    const renderNodes = (nodes: TreeNode[], level: number): React.ReactNode => (
      <>
        {nodes.map((node) => {
          const hasChildren = !!node.children?.length;
          const isExpanded = expandedSet.has(node.id);
          const renaming = renamingId === node.id;
          return (
            <li
              key={node.id}
              className={cx(sc("tree-item"))}
              role="treeitem"
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-selected={selectedId === node.id}
              aria-disabled={node.disabled || undefined}
              tabIndex={activeId === node.id ? 0 : -1}
              ref={(el) => {
                if (el) nodeRefs.current.set(node.id, el);
                else nodeRefs.current.delete(node.id);
              }}
              onFocus={(e) => {
                if (e.target === e.currentTarget) setFocusedId(node.id);
              }}
              onKeyDown={(e) => onKeyDown(e, node.id)}
            >
              <div
                className={cx(sc("tree-node"))}
                style={{ "--tree-depth": level } as React.CSSProperties}
                data-selected={selectedId === node.id || undefined}
                data-disabled={node.disabled || undefined}
                data-dragging={draggingId === node.id || undefined}
                data-drag-over={dropHint?.id === node.id ? dropHint.edge : undefined}
                // Dragging while renaming would turn selecting text in the
                // field into a row drag.
                draggable={!!onMove && !node.disabled && !renaming}
                onClick={() => {
                  if (renaming) return;
                  selectNode(node);
                  if (hasChildren) toggleExpand(node.id);
                  focusId(node.id);
                }}
                onDoubleClick={() => startRename(node)}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", node.id);
                  setDraggingId(node.id);
                }}
                onDragOver={(e) => {
                  if (!draggingId || blockedIds?.has(node.id)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  const edge = computeDropEdge(e.clientY, e.currentTarget.getBoundingClientRect());
                  setDropHint((prev) =>
                    prev?.id === node.id && prev.edge === edge ? prev : { id: node.id, edge },
                  );
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) {
                    setDropHint((prev) => (prev?.id === node.id ? undefined : prev));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = draggingId;
                  const edge = dropHint?.id === node.id ? dropHint.edge : undefined;
                  clearDrag();
                  if (from && edge) onMove?.(from, node.id, edge);
                }}
                onDragEnd={clearDrag}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className={cx(sc("tree-toggle"))}
                    data-expanded={isExpanded || undefined}
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.id);
                    }}
                  >
                    {Chevron}
                  </button>
                ) : (
                  <span className={cx(sc("tree-toggle-spacer"))} />
                )}
                {node.icon && (
                  <span className={cx(sc("tree-node-icon"))}>{node.icon}</span>
                )}
                {renaming ? (
                  renameField(node)
                ) : (
                  <span className={cx(sc("tree-node-label"))}>{node.label}</span>
                )}
              </div>
              {hasChildren && isExpanded && (
                <ul className={cx(sc("tree-group"))} role="group">
                  {renderNodes(node.children as TreeNode[], level + 1)}
                </ul>
              )}
            </li>
          );
        })}
      </>
    );

    return (
      <ul
        ref={forwardedRef}
        className={cx(sc("tree"), className)}
        role="tree"
        {...rest}
      >
        {renderNodes(items, 0)}
      </ul>
    );
  },
);
