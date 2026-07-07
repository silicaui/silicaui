import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui-components/react/combobox";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

type PositionerProps = React.ComponentProps<typeof BaseCombobox.Positioner>;
export type ComboboxSide = NonNullable<PositionerProps["side"]>;
export type ComboboxAlign = NonNullable<PositionerProps["align"]>;
export type ComboboxColor = SilicaColor;
export type ComboboxSize = SilicaSize;

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

/** Label for an item that's either a bare string or a `{ value, label }` object. */
function defaultLabel(item: unknown): React.ReactNode {
  if (item != null && typeof item === "object" && "label" in item) {
    return (item as { label: React.ReactNode }).label;
  }
  return String(item);
}

export interface ComboboxItemProps
  extends Omit<Styled<typeof BaseCombobox.Item>, "children"> {
  value: unknown;
  children?: React.ReactNode;
  /** Show the leading selected-check (default true). */
  indicator?: boolean;
}

/** One option row within a Combobox. */
export function ComboboxItem({
  className,
  children,
  indicator = true,
  ...rest
}: ComboboxItemProps) {
  const sc = useSilicaClass();
  return (
    <BaseCombobox.Item className={cx(sc("select-item"), className)} {...rest}>
      {indicator && (
        <BaseCombobox.ItemIndicator className={cx(sc("select-item-indicator"))}>
          <CheckIcon />
        </BaseCombobox.ItemIndicator>
      )}
      {children}
    </BaseCombobox.Item>
  );
}

export interface ComboboxProps {
  /** The full option set (strings or `{ value, label }`); Base UI filters it. */
  items: readonly unknown[];
  /** Controlled selected value. */
  value?: unknown;
  /** Uncontrolled initial value. */
  defaultValue?: unknown;
  /** Fires with the newly-selected value. */
  onValueChange?: (value: unknown, eventDetails?: unknown) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Shown in the popup when nothing matches the query. */
  emptyMessage?: React.ReactNode;
  /** Accent for the input border + focus ring (shares Input colors). */
  color?: ComboboxColor;
  /** Input height; matches same-size Inputs. */
  size?: ComboboxSize;
  /** Show the clear (×) button (default true). */
  clearable?: boolean;
  side?: ComboboxSide;
  align?: ComboboxAlign;
  sideOffset?: number;
  /** Class for the text input. */
  className?: string;
  /** Class for the popup surface. */
  popupClassName?: string;
  /** For object items, map an item to its display string (default: `.label`). */
  itemToStringLabel?: (item: unknown) => string;
  /** Override how each filtered item renders. */
  renderItem?: (item: unknown, index: number) => React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  id?: string;
}

/**
 * Silica Combobox — a searchable, filtered listbox (Base UI: typeahead filtering,
 * roving focus, portalled popup). Type to narrow `items`; pick to select. The
 * input matches the field tier like `Input`.
 *
 *   <Combobox
 *     items={["Alabama", "Alaska", "Arizona", "Arkansas"]}
 *     value={state} onValueChange={setState}
 *     placeholder="Search states…"
 *   />
 *
 *   // object items:
 *   <Combobox
 *     items={[{ value: "us", label: "United States" }, { value: "ca", label: "Canada" }]}
 *     placeholder="Country" color="primary"
 *   />
 */
export function Combobox({
  items,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  required,
  placeholder,
  emptyMessage = "No results.",
  color,
  size = "md",
  clearable = true,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  className,
  popupClassName,
  itemToStringLabel,
  renderItem,
  id,
  ...aria
}: ComboboxProps) {
  const sc = useSilicaClass();
  return (
    <BaseCombobox.Root
      items={items as never}
      value={value as never}
      defaultValue={defaultValue as never}
      onValueChange={onValueChange as never}
      name={name}
      disabled={disabled}
      required={required}
      itemToStringLabel={itemToStringLabel as never}
    >
      <div className={cx(sc("combobox-control"))}>
        <BaseCombobox.Input
          id={id}
          placeholder={placeholder}
          className={cx(
            sc("input"),
            color && sc(`input-${color}`),
            size !== "md" && sc(`input-${size}`),
            sc("combobox-input"),
            className,
          )}
          {...aria}
        />
        {clearable && (
          <BaseCombobox.Clear
            className={cx(sc("combobox-clear"))}
            aria-label="Clear"
          >
            <XIcon />
          </BaseCombobox.Clear>
        )}
        <BaseCombobox.Trigger
          className={cx(sc("combobox-trigger"))}
          aria-label="Open"
        >
          <ChevronDownIcon />
        </BaseCombobox.Trigger>
      </div>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner side={side} align={align} sideOffset={sideOffset}>
          <BaseCombobox.Popup className={cx(sc("select-popup"), popupClassName)}>
            <BaseCombobox.Empty className={cx(sc("combobox-empty"))}>
              {emptyMessage}
            </BaseCombobox.Empty>
            <BaseCombobox.List>
              {(item: unknown, index: number) =>
                renderItem ? (
                  renderItem(item, index)
                ) : (
                  <ComboboxItem key={index} value={item}>
                    {defaultLabel(item)}
                  </ComboboxItem>
                )
              }
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
