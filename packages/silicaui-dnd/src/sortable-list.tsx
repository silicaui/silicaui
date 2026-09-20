import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cx, useSilicaClass } from "@wizeworks/silicaui-react";

/**
 * Props a consumer spreads onto its drag-handle element (or the whole row).
 *
 * This carries a `className` — the handle's own Silica class, which supplies the
 * grab/grabbing cursors, the hover ink and the focus ring. Spreading these props
 * and THEN setting `className` yourself replaces it; merge instead:
 * `className={cx(ctx.handleProps.className, "ml-1")}`.
 */
export type SortableHandleProps = React.HTMLAttributes<HTMLElement>;

export interface SortableItemContext {
  /** True while this row is the one being dragged. */
  isDragging: boolean;
  /** Spread onto your drag handle when `handle`, else already on the row. */
  handleProps: SortableHandleProps;
}

export interface SortableListProps<T> {
  /** The ordered items. */
  items: T[];
  /** Stable id for each item (drag identity + React key). */
  getItemId: (item: T) => string | number;
  /**
   * What to CALL an item out loud.
   *
   * Everything a person who is not using a mouse learns about a reorder comes
   * from here: "Kaihō Maru picked up, position 3 of 9." Without it the only name
   * an item has is its id, and `getItemId` returns keys, not names — so the
   * announcements degrade to "v-5 moved over v-8", which is unusable. Provide it
   * whenever the ids are not already human words.
   */
  getItemLabel?: (item: T) => string;
  /** Called with the reordered array after a drag or keyboard move. */
  onReorder: (items: T[]) => void;
  /**
   * Render a row's CONTENTS.
   *
   * The `<li>` around them is already a styled flex row — border, surface,
   * padding and radius, from the `sortable-item` class — so return the pieces
   * that go inside it (a handle, a label, a badge), not another bordered box.
   * A single returned element is stretched to fill the row.
   */
  renderItem: (item: T, ctx: SortableItemContext) => React.ReactNode;
  /**
   * Drag only via a handle element you render with `ctx.handleProps` (rather
   * than the whole row). Default `false` (the whole row is draggable).
   */
  handle?: boolean;
  /** Added to the `<ul>`. */
  className?: string;
  /** Added to every row `<li>`, alongside the row's own class. */
  itemClassName?: string;
}

interface RowProps<T> {
  id: string | number;
  item: T;
  handle: boolean;
  itemClassName?: string;
  renderItem: SortableListProps<T>["renderItem"];
}

function SortableRow<T>({ id, item, handle, itemClassName, renderItem }: RowProps<T>) {
  const sc = useSilicaClass();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  // dnd-kit's attributes (role/tabindex/aria) + listeners (pointer/keyboard) —
  // their loose types don't line up with React's handler unions, so bridge them
  // with a single localized cast rather than leaking `any` to consumers. The
  // handle's own class rides along, so the documented usage is styled without
  // the consumer having to know the class name (which is prefix-dependent and
  // therefore not something they could hardcode anyway).
  const handleProps = {
    ...attributes,
    ...(listeners ?? {}),
    className: cx(sc("sortable-handle")) || undefined,
  } as SortableHandleProps;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      className={cx(sc("sortable-item"), itemClassName)}
      style={style}
      data-dragging={isDragging || undefined}
      {...(handle ? {} : handleProps)}
    >
      {renderItem(item, { isDragging, handleProps: handle ? handleProps : {} })}
    </li>
  );
}

const INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "To reorder, press space bar or enter to pick up an item. " +
    "Use the arrow keys to move it. Press space bar or enter again to drop it in its new position, " +
    "or press escape to leave it where it was.",
};

/**
 * SortableList — a drag-to-reorder list over dnd-kit.
 *
 * Give it `items`, a `getItemId`, and a `renderItem`; it fires `onReorder` with
 * the new order after a pointer drag or keyboard move (Space to pick up, arrows
 * to move, Space to drop, Escape to cancel). Set `handle` to drag only from a
 * grip you wire with `ctx.handleProps`.
 *
 * **The list and its rows come styled.** The `<ul>` carries `sortable-list` and
 * each `<li>` carries `sortable-item` — a flex row with a border, a surface,
 * padding and a radius, plus a lifted look while it is being dragged. So
 * `renderItem` returns the row's CONTENTS, not a second box. Add to the row with
 * `itemClassName`.
 *
 * **Name your items.** Pass `getItemLabel` so the live announcements say what
 * moved. Without it the announcements fall back to the ids from `getItemId`.
 */
export function SortableList<T>({
  items,
  getItemId,
  getItemLabel,
  onReorder,
  renderItem,
  handle = false,
  className,
  itemClassName,
}: SortableListProps<T>) {
  const sc = useSilicaClass();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map(getItemId);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => getItemId(i) === active.id);
    const newIndex = items.findIndex((i) => getItemId(i) === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  // What a person hears. dnd-kit's defaults read the drag identity out loud —
  // "Draggable item v-5 was moved over droppable area v-8" — which is a database
  // key and a position nobody can count to. These say the item's name and where
  // it now is, out of how many.
  const announcements = React.useMemo<Announcements>(() => {
    const nameOf = (id: UniqueIdentifier | undefined) => {
      if (id === undefined) return "";
      const item = items.find((i) => getItemId(i) === id);
      if (!item) return String(id);
      return getItemLabel ? getItemLabel(item) : String(id);
    };
    const positionOf = (id: UniqueIdentifier | undefined) => {
      const at = items.findIndex((i) => getItemId(i) === id);
      return at === -1 ? "" : `position ${at + 1} of ${items.length}`;
    };
    return {
      onDragStart: ({ active }) =>
        `Picked up ${nameOf(active.id)}, ${positionOf(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `${nameOf(active.id)} moved to ${positionOf(over.id)}.`
          : `${nameOf(active.id)} is not over the list.`,
      onDragEnd: ({ active, over }) =>
        over
          ? `${nameOf(active.id)} dropped in ${positionOf(over.id)}.`
          : `${nameOf(active.id)} was put back where it was.`,
      onDragCancel: ({ active }) =>
        `Reordering cancelled. ${nameOf(active.id)} is back in ${positionOf(active.id)}.`,
    };
  }, [items, getItemId, getItemLabel]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: INSTRUCTIONS }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cx(sc("sortable-list"), className)}>
          {items.map((item) => (
            <SortableRow
              key={getItemId(item)}
              id={getItemId(item)}
              item={item}
              handle={handle}
              itemClassName={itemClassName}
              renderItem={renderItem}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
