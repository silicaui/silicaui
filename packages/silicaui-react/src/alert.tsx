import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type AlertColor = SilicaColor;

export type AlertSize = SilicaSize;

export type AlertVariant = "solid" | "soft" | "outline" | "dash";

export interface AlertProps
  // Omit the native string `color` so our token union wins.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** Semantic color; maps to `alert-<color>`. Omit for a neutral surface. */
  color?: AlertColor;
  /** Visual style. Default `solid`. */
  variant?: AlertVariant;
  /** Default `md`. */
  size?: AlertSize;
}

/**
 * Silica Alert — a feedback surface. Compose it from parts, like Card:
 *
 *   // One-liner: icon + message
 *   <Alert color="success"><CheckIcon /> Your changes were saved.</Alert>
 *
 *   // Structured: title + description + trailing actions
 *   <Alert color="error">
 *     <XIcon />
 *     <AlertContent>
 *       <AlertTitle>Upload failed</AlertTitle>
 *       <AlertDescription>The file exceeds the 5 MB limit.</AlertDescription>
 *     </AlertContent>
 *     <AlertActions>
 *       <Button size="sm" color="error" variant="soft">Retry</Button>
 *     </AlertActions>
 *   </Alert>
 *
 * A leading `<svg>` child is sized automatically. Defaults to `role="alert"`
 * (assertive); pass `role="status"` for a quieter, non-interrupting announcement.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert({ color, variant = "solid", size = "md", className, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("alert"),
      color && sc(`alert-${color}`),
      variant !== "solid" && sc(`alert-${variant}`),
      size !== "md" && sc(`alert-${size}`),
      className,
    );
    return <div ref={ref} role="alert" className={classes} {...rest} />;
  },
);

/** Growing middle column of an Alert — holds the title + description. */
export const AlertContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function AlertContent({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <div ref={ref} className={cx(sc("alert-content"), className)} {...rest} />
  );
});

/** Bold heading line of an Alert. */
export const AlertTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function AlertTitle({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <div ref={ref} className={cx(sc("alert-title"), className)} {...rest} />
  );
});

/** Secondary message line under an AlertTitle. */
export const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function AlertDescription({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <div
      ref={ref}
      className={cx(sc("alert-description"), className)}
      {...rest}
    />
  );
});

/** Trailing action group (buttons, links) at the end of an Alert row. */
export const AlertActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function AlertActions({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <div ref={ref} className={cx(sc("alert-actions"), className)} {...rest} />
  );
});
