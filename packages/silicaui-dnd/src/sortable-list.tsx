import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cx, useSilicaClass } from "silicaui-react";

/** Props a consumer spreads onto its drag-handle element (or the whole row). */
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
  /** Called with the reordered array after a drag or keyboard move. */
  onReorder: (items: T[]) => void;
  /** Render a row; `ctx.handleProps` wires the drag handle (or is a no-op). */
  renderItem: (item: T, ctx: SortableItemContext) => React.ReactNode;
  /**
   * Drag only via a handle element you render with `ctx.handleProps` (rather
   * than the whole row). Default `false` (the whole row is draggable).
   */
  handle?: boolean;
  className?: string;
}

interface RowProps<T> {
  id: string | number;
  item: T;
  handle: boolean;
  renderItem: SortableListProps<T>["renderItem"];
}

function SortableRow<T>({ id, item, handle, renderItem }: RowProps<T>) {
  const sc = useSilicaClass();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  // dnd-kit's attributes (role/tabindex/aria) + listeners (pointer/keyboard) —
  // their loose types don't line up with React's handler unions, so bridge them
  // with a single localized cast rather than leaking `any` to consumers.
  const handleProps = {
    ...attributes,
    ...(listeners ?? {}),
  } as SortableHandleProps;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      className={cx(sc("sortable-item"))}
      style={style}
      data-dragging={isDragging || undefined}
      {...(handle ? {} : handleProps)}
    >
      {renderItem(item, { isDragging, handleProps: handle ? handleProps : {} })}
    </li>
  );
}

/**
 * SortableList — a drag-to-reorder list over dnd-kit. Give it `items`, a
 * `getItemId`, and a `renderItem`; it fires `onReorder` with the new order after
 * a pointer drag or keyboard move (Space to pick up, arrows to move, Space to
 * drop). Set `handle` to drag only from a grip you wire with `ctx.handleProps`.
 */
export function SortableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  handle = false,
  className,
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cx(sc("sortable-list"), className)}>
          {items.map((item) => (
            <SortableRow
              key={getItemId(item)}
              id={getItemId(item)}
              item={item}
              handle={handle}
              renderItem={renderItem}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
