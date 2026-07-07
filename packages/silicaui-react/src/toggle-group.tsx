import * as React from "react";
import { ToggleGroup as BaseToggleGroup } from "@base-ui-components/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui-components/react/toggle";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

export type ToggleGroupProps = Styled<typeof BaseToggleGroup>;
export type ToggleGroupItemProps = Styled<typeof BaseToggle>;

/**
 * Silica ToggleGroup — a segmented control (single- or multi-select). Behavior
 * from Base UI (roving focus, pressed state); look from Silica. This is the
 * button-based control — for an on/off switch use `Toggle`.
 *
 *   <ToggleGroup defaultValue={["list"]}>
 *     <ToggleGroupItem value="list">List</ToggleGroupItem>
 *     <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
 *   </ToggleGroup>
 */
export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <BaseToggleGroup
        ref={ref}
        className={cx(sc("toggle-group"), className)}
        {...rest}
      />
    );
  },
);

/** One selectable button within a ToggleGroup. */
export const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(function ToggleGroupItem({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <BaseToggle
      ref={ref}
      className={cx(sc("toggle-group-item"), className)}
      {...rest}
    />
  );
});
