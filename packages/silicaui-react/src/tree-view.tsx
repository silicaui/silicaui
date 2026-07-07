import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export interface TreeNode {
  /** Stable identity (React key + selection/expansion id). */
  id: string;
  /** Row label. */
  label: React.ReactNode;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  /** Child nodes; presence makes the node expandable. */
  children?: TreeNode[];
  disabled?: boolean;
}

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
    const expandedSet = expandedControlled
      ? new Set(expanded)
      : expandedInternal;

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
      }
    };

    const renderNodes = (nodes: TreeNode[], level: number): React.ReactNode => (
      <>
        {nodes.map((node) => {
          const hasChildren = !!node.children?.length;
          const isExpanded = expandedSet.has(node.id);
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
                onClick={() => {
                  selectNode(node);
                  if (hasChildren) toggleExpand(node.id);
                  focusId(node.id);
                }}
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
                <span className={cx(sc("tree-node-label"))}>{node.label}</span>
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
