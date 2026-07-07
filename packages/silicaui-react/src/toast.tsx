import * as React from "react";
import { Toast as BaseToast } from "@base-ui-components/react/toast";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type ToastProviderProps = React.ComponentProps<typeof BaseToast.Provider>;

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m18 6-12 12M6 6l12 12" strokeLinecap="round" />
  </svg>
);

/** Renders the toasts from the manager into a fixed corner viewport. */
function ToastList() {
  const { toasts } = BaseToast.useToastManager();
  const sc = useSilicaClass();
  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className={cx(sc("toast-viewport"))}>
        {toasts.map((toast) => (
          <BaseToast.Root key={toast.id} toast={toast} className={cx(sc("toast"))}>
            <div className={cx(sc("toast-content"))}>
              <BaseToast.Title className={cx(sc("toast-title"))} />
              <BaseToast.Description className={cx(sc("toast-description"))} />
            </div>
            <BaseToast.Close className={cx(sc("toast-close"))} aria-label="Close">
              <CloseIcon />
            </BaseToast.Close>
          </BaseToast.Root>
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

/**
 * Silica ToastProvider — wrap your app once, then call `useToast().add(...)`.
 *
 *   <ToastProvider>
 *     <App />
 *   </ToastProvider>
 *
 *   const toast = useToast();
 *   toast.add({ title: "Saved", description: "Your changes are saved.", type: "success" });
 */
export function ToastProvider({ children, ...rest }: ToastProviderProps) {
  return (
    <BaseToast.Provider {...rest}>
      {children}
      <ToastList />
    </BaseToast.Provider>
  );
}

/** Toast manager: `add`, `close`, `update`, and the live `toasts` list. */
export function useToast() {
  return BaseToast.useToastManager();
}
