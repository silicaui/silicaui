import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type MetadataListLayout = "row" | "stack";

export interface MetadataListProps extends React.HTMLAttributes<HTMLDListElement> {
  /** `"row"` (default): label left, value right. `"stack"`: label above value. */
  layout?: MetadataListLayout;
}

/**
 * Silica MetadataList — a key/value property list (a real `<dl>`). Compose it
 * from `MetadataItem`s, which each render a `<dt>`/`<dd>` pair as direct grid
 * children of the list.
 *
 *   <MetadataList>
 *     <MetadataItem label="Created">Jan 1, 2026</MetadataItem>
 *     <MetadataItem label="Owner">Ada Lovelace</MetadataItem>
 *     <MetadataItem label="Status"><Badge color="success">Active</Badge></MetadataItem>
 *   </MetadataList>
 */
export const MetadataList = React.forwardRef<HTMLDListElement, MetadataListProps>(
  function MetadataList({ layout = "row", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <dl
        ref={ref}
        className={cx(sc("metadata-list"), className)}
        data-layout={layout}
        {...rest}
      />
    );
  },
);

export interface MetadataItemProps {
  label: React.ReactNode;
  children: React.ReactNode;
  /** Class for the `<dt>`. */
  labelClassName?: string;
  /** Class for the `<dd>`. */
  className?: string;
}

/** One `<dt>`/`<dd>` row within a `MetadataList`. */
export function MetadataItem({ label, children, labelClassName, className }: MetadataItemProps) {
  const sc = useSilicaClass();
  return (
    <>
      <dt className={cx(sc("metadata-list-label"), labelClassName)}>{label}</dt>
      <dd className={cx(sc("metadata-list-value"), className)}>{children}</dd>
    </>
  );
}
