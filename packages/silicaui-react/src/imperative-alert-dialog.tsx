import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./alert-dialog";
import { Button, type ButtonColor } from "./button";

export interface ConfirmOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  /** Accent for the confirm button — e.g. `"error"` for a destructive action. Default `"primary"`. */
  color?: ButtonColor;
}

/** Resolves `true` if the user confirmed, `false` if they cancelled or dismissed. */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ImperativeAlertDialogContext = React.createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

export interface ImperativeAlertDialogProviderProps {
  children: React.ReactNode;
}

/**
 * Mounts the singleton confirm dialog `useImperativeAlertDialog` talks to.
 * Wrap your app once, near the root (alongside `SilicaProvider`/`ToastProvider`).
 *
 *   <ImperativeAlertDialogProvider>
 *     <App />
 *   </ImperativeAlertDialogProvider>
 */
export function ImperativeAlertDialogProvider({ children }: ImperativeAlertDialogProviderProps) {
  const [pending, setPending] = React.useState<PendingConfirm | null>(null);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function settle(result: boolean) {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }

  return (
    <ImperativeAlertDialogContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={pending != null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <AlertDialogContent>
          {pending?.title != null && (
            <AlertDialogHeader>
              <AlertDialogTitle>{pending.title}</AlertDialogTitle>
            </AlertDialogHeader>
          )}
          {pending?.description != null && (
            <AlertDialogDescription>{pending.description}</AlertDialogDescription>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button variant="ghost" color="neutral" onClick={() => settle(false)}>
                {pending?.cancelLabel ?? "Cancel"}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction color={pending?.color ?? "primary"} onClick={() => settle(true)}>
              {pending?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ImperativeAlertDialogContext.Provider>
  );
}

/**
 * Silica useImperativeAlertDialog — a `window.confirm()`-style async confirm,
 * but styled and non-blocking. Requires `ImperativeAlertDialogProvider`
 * somewhere above in the tree.
 *
 *   const confirm = useImperativeAlertDialog();
 *   async function handleDelete() {
 *     const ok = await confirm({ title: "Delete project?", description: "This can't be undone.", confirmLabel: "Delete", color: "error" });
 *     if (ok) deleteProject();
 *   }
 */
export function useImperativeAlertDialog(): ConfirmFn {
  const ctx = React.useContext(ImperativeAlertDialogContext);
  if (!ctx) {
    throw new Error(
      "useImperativeAlertDialog must be used within an <ImperativeAlertDialogProvider>.",
    );
  }
  return ctx;
}
