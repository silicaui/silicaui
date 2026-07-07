import * as React from "react";
import { Select as BaseSelect } from "@base-ui-components/react/select";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

type PositionerProps = React.ComponentProps<typeof BaseSelect.Positioner>;
export type SelectSide = NonNullable<PositionerProps["side"]>;
export type SelectAlign = NonNullable<PositionerProps["align"]>;
export type SelectColor = SilicaColor;
export type SelectSize = SilicaSize;

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m18 15-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Composable parts
// ---------------------------------------------------------------------------

export interface SelectItemProps
  extends Omit<Styled<typeof BaseSelect.Item>, "children"> {
  /** The value stored when this item is chosen. */
  value: unknown;
  children?: React.ReactNode;
}

/** One option. Renders its own selected-check indicator. */
export function SelectItem({ className, children, ...rest }: SelectItemProps) {
  const sc = useSilicaClass();
  return (
    <BaseSelect.Item className={cx(sc("select-item"), className)} {...rest}>
      <BaseSelect.ItemIndicator className={cx(sc("select-item-indicator"))}>
        <CheckIcon />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

/** Groups related items; pair with a `SelectGroupLabel`. */
export function SelectGroup(props: React.ComponentProps<typeof BaseSelect.Group>) {
  return <BaseSelect.Group {...props} />;
}

/** A heading for a `SelectGroup` — MUST be rendered inside one. */
export function SelectGroupLabel({
  className,
  ...rest
}: Styled<typeof BaseSelect.GroupLabel>) {
  const sc = useSilicaClass();
  return (
    <BaseSelect.GroupLabel
      className={cx(sc("select-group-label"), className)}
      {...rest}
    />
  );
}

export function SelectSeparator({
  className,
  ...rest
}: Styled<typeof BaseSelect.Separator>) {
  const sc = useSilicaClass();
  return (
    <BaseSelect.Separator
      className={cx(sc("select-separator"), className)}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export interface SelectOptionData {
  label: React.ReactNode;
  value: unknown;
}
export type SelectItems =
  | Record<string, React.ReactNode>
  | ReadonlyArray<SelectOptionData>;

export interface SelectProps {
  /** Controlled value (array when `multiple`). */
  value?: unknown;
  /** Uncontrolled initial value. */
  defaultValue?: unknown;
  /** Fires with the newly-selected value. */
  onValueChange?: (value: unknown, eventDetails?: unknown) => void;
  /** Allow selecting multiple items (value becomes an array). */
  multiple?: boolean;
  /**
   * Value→label map used to render the trigger's selected label (and, if no
   * children are given, to auto-render the options). A record (`{value: label}`)
   * or an array (`[{ value, label }]`).
   */
  items?: SelectItems;
  /** Field name for form submission. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Shown on the trigger while nothing is selected. */
  placeholder?: React.ReactNode;
  /** Accent for the trigger border + focus ring (shares NativeSelect colors). */
  color?: SelectColor;
  /** Trigger height; matches same-size Inputs/Buttons. */
  size?: SelectSize;
  side?: SelectSide;
  align?: SelectAlign;
  sideOffset?: number;
  /** Overlay the selected item on the trigger (native-select style). Default false. */
  alignItemWithTrigger?: boolean;
  /** Class for the trigger button. */
  className?: string;
  /** Class for the popup surface. */
  popupClassName?: string;
  /**
   * Extra props spread onto the popup surface. The popup renders in a PORTAL at
   * document.body, so when the Select lives inside a scoped `[data-theme]` island
   * pass `popupProps={{ "data-theme": "…" }}` to re-establish the theme tokens
   * (custom props inherit through the DOM, not the portal boundary).
   */
  popupProps?: React.ComponentProps<typeof BaseSelect.Popup> & {
    [key: `data-${string}`]: string;
  };
  /** Accessible name when there's no associated visible label. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  id?: string;
  /** `SelectItem`/`SelectGroup`/`SelectSeparator`s. Omit to auto-render `items`. */
  children?: React.ReactNode;
}

/**
 * Silica Select — a fully-styled, keyboard-driven listbox (Base UI: typeahead,
 * roving focus, portalled popup, optional multi-select). The trigger matches
 * `NativeSelect` pixel-for-pixel; reach for `NativeSelect` only when you need a
 * bare platform `<select>`.
 *
 *   // items-driven (auto-renders options, powers the trigger label):
 *   <Select
 *     items={{ react: "React", vue: "Vue", svelte: "Svelte" }}
 *     value={fw} onValueChange={setFw} placeholder="Framework" color="primary"
 *   />
 *
 *   // composable:
 *   <Select value={fw} onValueChange={setFw} items={labels} placeholder="Framework">
 *     <SelectGroup>
 *       <SelectGroupLabel>Frontend</SelectGroupLabel>
 *       <SelectItem value="react">React</SelectItem>
 *       <SelectItem value="vue">Vue</SelectItem>
 *     </SelectGroup>
 *   </Select>
 */
export function Select({
  value,
  defaultValue,
  onValueChange,
  multiple,
  items,
  name,
  disabled,
  required,
  readOnly,
  placeholder,
  color,
  size = "md",
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignItemWithTrigger = false,
  className,
  popupClassName,
  popupProps,
  id,
  children,
  ...aria
}: SelectProps) {
  const sc = useSilicaClass();

  const autoItems =
    !children && items
      ? Array.isArray(items)
        ? items.map((it) => (
            <SelectItem key={String(it.value)} value={it.value}>
              {it.label}
            </SelectItem>
          ))
        : Object.entries(items).map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))
      : null;

  return (
    <BaseSelect.Root
      value={value as never}
      defaultValue={defaultValue as never}
      onValueChange={onValueChange as never}
      multiple={multiple as never}
      items={items as never}
      name={name}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
    >
      <BaseSelect.Trigger
        id={id}
        className={cx(
          sc("select"),
          color && sc(`select-${color}`),
          size !== "md" && sc(`select-${size}`),
          sc("select-trigger"),
          className,
        )}
        {...aria}
      >
        <BaseSelect.Value className={cx(sc("select-value"))} />
        {placeholder != null && (
          <span className={cx(sc("select-placeholder"))}>{placeholder}</span>
        )}
        <BaseSelect.Icon className={cx(sc("select-icon"))}>
          <ChevronDownIcon />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignItemWithTrigger={alignItemWithTrigger}
        >
          <BaseSelect.Popup {...popupProps} className={cx(sc("select-popup"), popupClassName)}>
            <BaseSelect.ScrollUpArrow
              className={cx(sc("select-scroll-arrow"))}
              data-direction="up"
            >
              <ChevronUpIcon />
            </BaseSelect.ScrollUpArrow>
            <BaseSelect.List>{children ?? autoItems}</BaseSelect.List>
            <BaseSelect.ScrollDownArrow
              className={cx(sc("select-scroll-arrow"))}
              data-direction="down"
            >
              <ChevronDownIcon />
            </BaseSelect.ScrollDownArrow>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
