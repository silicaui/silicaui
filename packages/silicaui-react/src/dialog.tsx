import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

// Props of a styled Base UI part: its own props but with a plain-string className.
type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const asRender = (el: React.ReactElement) =>
  el as React.ReactElement<Record<string, unknown>>;

export type DialogProps = React.ComponentProps<typeof BaseDialog.Root>;

/**
 * Silica Dialog — a modal, from Base UI (focus trap + scroll lock + dismissal).
 *
 *   <Dialog>
 *     <DialogTrigger><Button>Delete…</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogTitle>Delete project?</DialogTitle>
 *       <DialogDescription>This can't be undone.</DialogDescription>
 *       <div className="mt-4 flex justify-end gap-2">
 *         <DialogClose><Button variant="ghost">Cancel</Button></DialogClose>
 *         <DialogClose><Button color="error">Delete</Button></DialogClose>
 *       </div>
 *     </DialogContent>
 *   </Dialog>
 *
 * Pass `modal="trap-focus"` for a non-scroll-locking dialog, or control it with
 * `open`/`onOpenChange`.
 */
export const Dialog = BaseDialog.Root;

/** Wraps its single child element as the element that opens the dialog. */
export function DialogTrigger({ children }: { children: React.ReactElement }) {
  return <BaseDialog.Trigger render={asRender(children)} />;
}

/** Wraps its single child element as an element that closes the dialog. */
export function DialogClose({ children }: { children: React.ReactElement }) {
  return <BaseDialog.Close render={asRender(children)} />;
}

export interface DialogContentProps
  extends Omit<Styled<typeof BaseDialog.Popup>, "children"> {
  children?: React.ReactNode;
  /** Class for the backdrop layer. */
  backdropClassName?: string;
}

/** Portals + backdrop + the centered popup surface in one. */
export function DialogContent({
  className,
  backdropClassName,
  children,
  ...rest
}: DialogContentProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BaseDialog.Portal container={portalContainer}>
      <BaseDialog.Backdrop
        className={cx(sc("dialog-backdrop"), backdropClassName)}
      />
      <BaseDialog.Popup className={cx(sc("dialog-popup"), className)} {...rest}>
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...rest }: Styled<typeof BaseDialog.Title>) {
  const sc = useSilicaClass();
  return <BaseDialog.Title className={cx(sc("dialog-title"), className)} {...rest} />;
}

export function DialogDescription({
  className,
  ...rest
}: Styled<typeof BaseDialog.Description>) {
  const sc = useSilicaClass();
  return (
    <BaseDialog.Description
      className={cx(sc("dialog-description"), className)}
      {...rest}
    />
  );
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pin this bar in place while the rest of the content scrolls. */
  sticky?: boolean;
}

/**
 * A docking bar for `DialogContent` — not position-locked. Put it anywhere
 * (top, bottom, between scrollable sections); it bleeds to the popup's edges
 * when it lands at one.
 */
export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  function DialogHeader({ sticky, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(sc("dialog-header"), sticky && sc("dialog-header-sticky"), className)}
        {...rest}
      />
    );
  },
);

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pin this bar in place while the rest of the content scrolls. */
  sticky?: boolean;
}

/** Right-aligned action row for `DialogContent`; stacks full-width on narrow viewports. */
export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  function DialogFooter({ sticky, className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(sc("dialog-footer"), sticky && sc("dialog-footer-sticky"), className)}
        {...rest}
      />
    );
  },
);
