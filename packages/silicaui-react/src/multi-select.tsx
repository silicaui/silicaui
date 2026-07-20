import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui-components/react/combobox";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

type PositionerProps = React.ComponentProps<typeof BaseCombobox.Positioner>;
export type MultiSelectSide = NonNullable<PositionerProps["side"]>;
export type MultiSelectAlign = NonNullable<PositionerProps["align"]>;
export type MultiSelectColor = SilicaColor;
export type MultiSelectSize = SilicaSize;

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

export interface MultiSelectItemProps
  extends Omit<Styled<typeof BaseCombobox.Item>, "children"> {
  value: unknown;
  children?: React.ReactNode;
}

/** One option row within a MultiSelect's dropdown. */
export function MultiSelectItem({ className, children, ...rest }: MultiSelectItemProps) {
  const sc = useSilicaClass();
  return (
    <BaseCombobox.Item className={cx(sc("select-item"), className)} {...rest}>
      <BaseCombobox.ItemIndicator className={cx(sc("select-item-indicator"))}>
        <CheckIcon />
      </BaseCombobox.ItemIndicator>
      {children}
    </BaseCombobox.Item>
  );
}

export interface MultiSelectProps {
  /** The full option set (strings or `{ value, label }`); Base UI filters it. */
  items: readonly unknown[];
  /** Controlled selected values. */
  value?: unknown[];
  /** Uncontrolled initial selected values. */
  defaultValue?: unknown[];
  /** Fires with the newly-selected value array. */
  onValueChange?: (value: unknown[], eventDetails?: unknown) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Shown in the popup when nothing matches the query. */
  emptyMessage?: React.ReactNode;
  /** Accent for the field border, focus ring, and chips. */
  color?: MultiSelectColor;
  /** Field height; matches same-size Inputs. */
  size?: MultiSelectSize;
  /** Show the clear-all (×) button (default true). */
  clearable?: boolean;
  side?: MultiSelectSide;
  align?: MultiSelectAlign;
  sideOffset?: number;
  /** Class for the field. */
  className?: string;
  /** Class for the popup surface. */
  popupClassName?: string;
  /** For object items, map an item to its display string (default: `.label`). */
  itemToStringLabel?: (item: unknown) => string;
  /** Override how each filtered dropdown item renders. */
  renderItem?: (item: unknown, index: number) => React.ReactNode;
  /** Override how each selected value's chip label renders (default: `.label`). */
  renderChipLabel?: (item: unknown) => React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  id?: string;
}

/**
 * Silica MultiSelect — a searchable listbox that picks *several* values from a
 * fixed option set, shown as removable chips in the field (Base UI Combobox in
 * `multiple` mode). Type to filter `items`; click or Enter to add; click a
 * chip's × or Backspace at the start of the field to remove.
 *
 *   <MultiSelect
 *     items={["React", "Vue", "Svelte", "Solid"]}
 *     value={frameworks} onValueChange={setFrameworks}
 *     placeholder="Frameworks…"
 *   />
 *
 *   // object items:
 *   <MultiSelect
 *     items={[{ value: "us", label: "United States" }, { value: "ca", label: "Canada" }]}
 *     placeholder="Countries" color="primary"
 *   />
 */
export function MultiSelect({
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
  renderChipLabel,
  id,
  ...aria
}: MultiSelectProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  const chipLabel = renderChipLabel ?? defaultLabel;

  return (
    <BaseCombobox.Root
      items={items as never}
      value={value as never}
      defaultValue={defaultValue as never}
      onValueChange={onValueChange as never}
      multiple
      name={name}
      disabled={disabled}
      required={required}
      itemToStringLabel={itemToStringLabel as never}
    >
      <div
        className={cx(
          sc("multi-select"),
          color && sc(`multi-select-${color}`),
          size !== "md" && sc(`multi-select-${size}`),
          className,
        )}
        data-disabled={disabled || undefined}
      >
        <BaseCombobox.Chips className={cx(sc("multi-select-chips"))}>
          <BaseCombobox.Value>
            {(selected: unknown) =>
              (selected as unknown[]).map((item, i) => (
                <BaseCombobox.Chip key={i} className={cx(sc("multi-select-chip"))}>
                  {chipLabel(item)}
                  <BaseCombobox.ChipRemove
                    className={cx(sc("multi-select-chip-remove"))}
                    aria-label={`Remove ${String(chipLabel(item))}`}
                  >
                    <XIcon />
                  </BaseCombobox.ChipRemove>
                </BaseCombobox.Chip>
              ))
            }
          </BaseCombobox.Value>
          <BaseCombobox.Input
            id={id}
            placeholder={placeholder}
            className={cx(sc("multi-select-input"))}
            {...aria}
          />
        </BaseCombobox.Chips>

        {clearable && (
          <BaseCombobox.Clear className={cx(sc("multi-select-clear"))} aria-label="Clear all">
            <XIcon />
          </BaseCombobox.Clear>
        )}
        <BaseCombobox.Trigger className={cx(sc("multi-select-trigger"))} aria-label="Open">
          <ChevronDownIcon />
        </BaseCombobox.Trigger>
      </div>

      <BaseCombobox.Portal container={portalContainer}>
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
                  <MultiSelectItem key={index} value={item}>
                    {defaultLabel(item)}
                  </MultiSelectItem>
                )
              }
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
