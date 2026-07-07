import * as React from "react";
import { Autocomplete as BaseAutocomplete } from "@base-ui-components/react/autocomplete";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

type PositionerProps = React.ComponentProps<typeof BaseAutocomplete.Positioner>;
export type AutocompleteSide = NonNullable<PositionerProps["side"]>;
export type AutocompleteAlign = NonNullable<PositionerProps["align"]>;
export type AutocompleteColor = SilicaColor;
export type AutocompleteSize = SilicaSize;
export type AutocompleteMode = "list" | "both" | "inline" | "none";

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

export interface AutocompleteItemProps
  extends Omit<Styled<typeof BaseAutocomplete.Item>, "children"> {
  value: unknown;
  children?: React.ReactNode;
}

/** One suggestion row within an Autocomplete. */
export function AutocompleteItem({
  className,
  children,
  ...rest
}: AutocompleteItemProps) {
  const sc = useSilicaClass();
  return (
    <BaseAutocomplete.Item
      className={cx(sc("select-item"), sc("combobox-item"), className)}
      {...rest}
    >
      {children}
    </BaseAutocomplete.Item>
  );
}

export interface AutocompleteProps {
  /** Suggestion set; filtered by the input value (in `list`/`both` modes). */
  items: readonly string[];
  /** Controlled input value. */
  value?: string;
  /** Uncontrolled initial input value. */
  defaultValue?: string;
  /** Fires with the new input string. */
  onValueChange?: (value: string, eventDetails?: unknown) => void;
  /** Suggestion behavior; `list` (default) filters the list as you type. */
  mode?: AutocompleteMode;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Shown in the popup when nothing matches the query. */
  emptyMessage?: React.ReactNode;
  /** Accent for the input border + focus ring (shares Input colors). */
  color?: AutocompleteColor;
  /** Input height; matches same-size Inputs. */
  size?: AutocompleteSize;
  /** Show the clear (×) button (default true). */
  clearable?: boolean;
  side?: AutocompleteSide;
  align?: AutocompleteAlign;
  sideOffset?: number;
  /** Class for the text input. */
  className?: string;
  /** Class for the popup surface. */
  popupClassName?: string;
  /** Override how each filtered suggestion renders. */
  renderItem?: (item: string, index: number) => React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  id?: string;
}

/**
 * Silica Autocomplete — a free-text input with a filtered suggestion list
 * (Base UI). Unlike `Combobox` (which selects a value from a fixed set), the
 * value here IS the typed string; suggestions just help complete it.
 *
 *   <Autocomplete
 *     items={["React", "React Native", "Redux", "Remix"]}
 *     value={q} onValueChange={setQ}
 *     placeholder="Search the docs…"
 *   />
 */
export function Autocomplete({
  items,
  value,
  defaultValue,
  onValueChange,
  mode = "list",
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
  renderItem,
  id,
  ...aria
}: AutocompleteProps) {
  const sc = useSilicaClass();
  return (
    <BaseAutocomplete.Root
      items={items as never}
      value={value as never}
      defaultValue={defaultValue as never}
      onValueChange={onValueChange as never}
      mode={mode}
      name={name}
      disabled={disabled}
      required={required}
    >
      <div className={cx(sc("combobox-control"))}>
        <BaseAutocomplete.Input
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
          <BaseAutocomplete.Clear
            className={cx(sc("combobox-clear"))}
            aria-label="Clear"
          >
            <XIcon />
          </BaseAutocomplete.Clear>
        )}
      </div>

      <BaseAutocomplete.Portal>
        <BaseAutocomplete.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseAutocomplete.Popup className={cx(sc("select-popup"), popupClassName)}>
            <BaseAutocomplete.Empty className={cx(sc("combobox-empty"))}>
              {emptyMessage}
            </BaseAutocomplete.Empty>
            <BaseAutocomplete.List>
              {(item: string, index: number) =>
                renderItem ? (
                  renderItem(item, index)
                ) : (
                  <AutocompleteItem key={index} value={item}>
                    {item}
                  </AutocompleteItem>
                )
              }
            </BaseAutocomplete.List>
          </BaseAutocomplete.Popup>
        </BaseAutocomplete.Positioner>
      </BaseAutocomplete.Portal>
    </BaseAutocomplete.Root>
  );
}
