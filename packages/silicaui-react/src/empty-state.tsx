import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type EmptyStateSize = "sm" | "md";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Icon/illustration shown in the chip above the title. */
  icon?: React.ReactNode;
  /** Headline (e.g. "No orders yet"). */
  title?: React.ReactNode;
  /** Supporting copy under the title. */
  description?: React.ReactNode;
  /** Action buttons/links rendered below the copy. */
  actions?: React.ReactNode;
  /** `"md"` (default) or the more compact `"sm"`. */
  size?: EmptyStateSize;
}

/**
 * The centered "nothing here yet" placeholder — icon, title, description, and an
 * action row. Drop it into an empty list, a table body, a card, or a panel.
 * Slots are optional; `children` renders between the description and the actions
 * for custom content.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    { icon, title, description, actions, size = "md", className, children, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(
          sc("empty-state"),
          size === "sm" && sc("empty-state-sm"),
          className,
        )}
        {...rest}
      >
        {icon != null && <div className={cx(sc("empty-state-icon"))}>{icon}</div>}
        {title != null && (
          <div className={cx(sc("empty-state-title"))}>{title}</div>
        )}
        {description != null && (
          <div className={cx(sc("empty-state-description"))}>{description}</div>
        )}
        {children}
        {actions != null && (
          <div className={cx(sc("empty-state-actions"))}>{actions}</div>
        )}
      </div>
    );
  },
);
