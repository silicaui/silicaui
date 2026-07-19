import * as React from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui-components/react/alert-dialog";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";
import { Button, type ButtonProps } from "./button";

export { DialogHeader as AlertDialogHeader, DialogFooter as AlertDialogFooter } from "./dialog";
export type {
  DialogHeaderProps as AlertDialogHeaderProps,
  DialogFooterProps as AlertDialogFooterProps,
} from "./dialog";

// Props of a styled Base UI part: its own props but with a plain-string className.
type Styled<T extends React.ElementType> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "className"
> & { className?: string };

const asRender = (el: React.ReactElement) =>
  el as React.ReactElement<Record<string, unknown>>;

export type AlertDialogProps = React.ComponentProps<typeof BaseAlertDialog.Root>;

/**
 * Silica AlertDialog — a confirmation modal from Base UI. Unlike `Dialog`, its
 * backdrop is inert: clicking outside will NOT dismiss it, so the user can't
 * lose the decision by tapping away (Escape still cancels, per the ARIA alert
 * dialog pattern). Reach for it on destructive or consequential actions; reuses
 * the Dialog surface styling.
 *
 *   <AlertDialog>
 *     <AlertDialogTrigger><Button color="error">Delete account</Button></AlertDialogTrigger>
 *     <AlertDialogContent>
 *       <AlertDialogTitle>Delete account?</AlertDialogTitle>
 *       <AlertDialogDescription>This permanently removes your data.</AlertDialogDescription>
 *       <div className="mt-4 flex justify-end gap-2">
 *         <AlertDialogClose><Button variant="ghost">Cancel</Button></AlertDialogClose>
 *         <AlertDialogClose><Button color="error" onClick={destroy}>Delete</Button></AlertDialogClose>
 *       </div>
 *     </AlertDialogContent>
 *   </AlertDialog>
 */
export const AlertDialog = BaseAlertDialog.Root;

/** Wraps its single child element as the element that opens the dialog. */
export function AlertDialogTrigger({
  children,
}: {
  children: React.ReactElement;
}) {
  return <BaseAlertDialog.Trigger render={asRender(children)} />;
}

/** Wraps its single child element as an element that closes the dialog. */
export function AlertDialogClose({
  children,
}: {
  children: React.ReactElement;
}) {
  return <BaseAlertDialog.Close render={asRender(children)} />;
}

/** Alias of {@link AlertDialogClose} — the semantic name for a "no, don't do this" button. */
export const AlertDialogCancel = AlertDialogClose;

export interface AlertDialogActionProps extends ButtonProps {}

/**
 * A styled button that fires its own `onClick` and then closes the dialog —
 * for the confirming ("yes, do this") action.
 *
 *   <AlertDialogAction color="error" onClick={destroy}>Delete</AlertDialogAction>
 */
export function AlertDialogAction({ children, ...rest }: AlertDialogActionProps) {
  return (
    <BaseAlertDialog.Close render={asRender(<Button {...rest}>{children}</Button>)} />
  );
}

export interface AlertDialogContentProps
  extends Omit<Styled<typeof BaseAlertDialog.Popup>, "children"> {
  children?: React.ReactNode;
  /** Class for the backdrop layer. */
  backdropClassName?: string;
}

/** Portals + backdrop + the centered popup surface in one (shares Dialog styles). */
export function AlertDialogContent({
  className,
  backdropClassName,
  children,
  ...rest
}: AlertDialogContentProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BaseAlertDialog.Portal container={portalContainer}>
      <BaseAlertDialog.Backdrop
        className={cx(sc("dialog-backdrop"), backdropClassName)}
      />
      <BaseAlertDialog.Popup
        className={cx(sc("dialog-popup"), className)}
        {...rest}
      >
        {children}
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  );
}

export function AlertDialogTitle({
  className,
  ...rest
}: Styled<typeof BaseAlertDialog.Title>) {
  const sc = useSilicaClass();
  return (
    <BaseAlertDialog.Title
      className={cx(sc("dialog-title"), className)}
      {...rest}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...rest
}: Styled<typeof BaseAlertDialog.Description>) {
  const sc = useSilicaClass();
  return (
    <BaseAlertDialog.Description
      className={cx(sc("dialog-description"), className)}
      {...rest}
    />
  );
}
