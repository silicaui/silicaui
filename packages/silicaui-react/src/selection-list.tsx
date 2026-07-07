import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { Checkbox } from "./checkbox";
import { Radio } from "./radio";

export interface SelectionListItem {
  /** Stable identity (React key + selection/focus id). */
  id: string;
  /** Row label. */
  label: React.ReactNode;
  /** Supporting copy under the label. */
  description?: React.ReactNode;
  /** Optional leading icon element. */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectionListProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect" | "defaultValue"> {
  /** The row data. */
  items: SelectionListItem[];
  /** Allow more than one row selected at once. Default `false` (single-select). */
  multiple?: boolean;
  /** Controlled array of selected ids. */
  value?: string[];
  /** Uncontrolled initial selected ids. */
  defaultValue?: string[];
  /** Fires with the new array of selected ids. */
  onValueChange?: (value: string[]) => void;
}

const noop = () => {};

/**
 * Silica SelectionList — a selectable list of rows (single- or multi-select),
 * each with a leading `Checkbox`/`Radio` indicator that mirrors row state. Full
 * keyboard support: ↑/↓ move focus, Home/End jump, Enter/Space toggles the
 * focused row (roving tabindex, ARIA `listbox`/`option` pattern).
 *
 *   <SelectionList
 *     items={[{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }]}
 *     multiple
 *     defaultValue={["a"]}
 *     onValueChange={setSelected}
 *   />
 */
export const SelectionList = React.forwardRef<HTMLUListElement, SelectionListProps>(
  function SelectionList(
    { items, multiple = false, value, defaultValue, onValueChange, className, ...rest },
    forwardedRef,
  ) {
    const sc = useSilicaClass();
    const controlled = value !== undefined;
    const [internal, setInternal] = React.useState<string[]>(defaultValue ?? []);
    const selected = controlled ? (value as string[]) : internal;

    const enabled = React.useMemo(() => items.filter((i) => !i.disabled), [items]);
    const [focusedId, setFocusedId] = React.useState<string | undefined>();
    const activeId = focusedId ?? enabled[0]?.id;
    const itemRefs = React.useRef(new Map<string, HTMLLIElement>());

    const commit = (next: string[]) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    };

    const toggle = (item: SelectionListItem) => {
      if (item.disabled) return;
      if (multiple) {
        const next = selected.includes(item.id)
          ? selected.filter((id) => id !== item.id)
          : [...selected, item.id];
        commit(next);
      } else {
        commit([item.id]);
      }
    };

    const focusId = (id: string) => {
      setFocusedId(id);
      itemRefs.current.get(id)?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, item: SelectionListItem) => {
      const idx = enabled.findIndex((i) => i.id === item.id);
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = enabled[idx + 1];
          if (next) focusId(next.id);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = enabled[idx - 1];
          if (prev) focusId(prev.id);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (enabled[0]) focusId(enabled[0].id);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = enabled[enabled.length - 1];
          if (last) focusId(last.id);
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          toggle(item);
          break;
        }
      }
    };

    return (
      <ul
        ref={forwardedRef}
        role="listbox"
        aria-multiselectable={multiple || undefined}
        className={cx(sc("selection-list"), className)}
        {...rest}
      >
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          const Indicator = multiple ? Checkbox : Radio;
          return (
            <li
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              role="option"
              aria-selected={isSelected}
              aria-disabled={item.disabled || undefined}
              tabIndex={item.disabled ? undefined : activeId === item.id ? 0 : -1}
              className={cx(sc("selection-list-item"))}
              onClick={() => {
                if (item.disabled) return;
                toggle(item);
                focusId(item.id);
              }}
              onFocus={(e) => {
                if (e.target === e.currentTarget && !item.disabled) setFocusedId(item.id);
              }}
              onKeyDown={(e) => onKeyDown(e, item)}
            >
              <Indicator
                checked={isSelected}
                disabled={item.disabled}
                tabIndex={-1}
                aria-hidden="true"
                onChange={noop}
                style={{ pointerEvents: "none" }}
              />
              {item.icon && (
                <span className={cx(sc("selection-list-item-icon"))}>{item.icon}</span>
              )}
              <span className={cx(sc("selection-list-item-body"))}>
                <span className={cx(sc("selection-list-item-label"))}>{item.label}</span>
                {item.description != null && (
                  <span className={cx(sc("selection-list-item-description"))}>
                    {item.description}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  },
);
