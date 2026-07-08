import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type AlertColor = SilicaColor;

export type AlertSize = SilicaSize;

export type AlertVariant = "solid" | "soft" | "outline" | "dash";

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

export interface AlertProps
  // Omit the native string `color` so our token union wins.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /** Semantic color; maps to `alert-<color>`. Omit for a neutral surface. */
  color?: AlertColor;
  /** Visual style. Default `solid`. */
  variant?: AlertVariant;
  /** Default `md`. */
  size?: AlertSize;
  /** Full-bleed "page banner" placement — edge to edge, no rounding. */
  banner?: boolean;
  /** Show a dismiss (×) button and animate the alert away on close. */
  dismissible?: boolean;
  /** Controlled open state (only meaningful with `dismissible`). */
  open?: boolean;
  /** Uncontrolled initial open state. Default `true`. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fires when the dismiss button is clicked (before `onOpenChange`). */
  onDismiss?: () => void;
}

/**
 * Silica Alert — a feedback surface, from an inline notice to a page banner.
 * Compose it from parts, like Card:
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
 *   // Dismissible, full-bleed page banner
 *   <Alert color="warning" banner dismissible onDismiss={() => setShown(false)}>
 *     Scheduled maintenance tonight at 10pm PT.
 *   </Alert>
 *
 * A leading `<svg>` child is sized automatically. Defaults to `role="alert"`
 * (assertive); pass `role="status"` for a quieter, non-interrupting announcement.
 *
 * For progressively-disclosed detail (e.g. "3 files failed ▾"), nest the
 * existing `Collapsible`/`CollapsibleTrigger`/`CollapsiblePanel` inside
 * `AlertContent` — Alert doesn't need its own bespoke disclosure.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    color,
    variant = "solid",
    size = "md",
    banner,
    dismissible,
    open,
    defaultOpen = true,
    onOpenChange,
    onDismiss,
    className,
    children,
    ...rest
  },
  forwardedRef,
) {
  const sc = useSilicaClass();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const [mounted, setMounted] = React.useState(isOpen);

  React.useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  function close() {
    onDismiss?.();
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  }

  const classes = cx(
    sc("alert"),
    color && sc(`alert-${color}`),
    variant !== "solid" && sc(`alert-${variant}`),
    size !== "md" && sc(`alert-${size}`),
    banner && sc("alert-banner"),
    className,
  );

  if (!dismissible) {
    return (
      <div ref={forwardedRef} role="alert" className={classes} {...rest}>
        {children}
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div
      className={cx(sc("alert-dismiss"))}
      data-closed={isOpen ? undefined : ""}
      onTransitionEnd={(e) => {
        if (e.propertyName === "opacity" && !isOpen) setMounted(false);
      }}
    >
      <div className={cx(sc("alert-dismiss-inner"))}>
        <div ref={forwardedRef} role="alert" className={classes} {...rest}>
          {children}
          <button
            type="button"
            className={cx(sc("alert-close"))}
            aria-label="Dismiss"
            onClick={close}
          >
            <XIcon />
          </button>
        </div>
      </div>
    </div>
  );
});

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
