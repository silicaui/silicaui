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

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path
      d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      strokeLinejoin="round"
    />
    <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m15 9-6 6M9 9l6 6" strokeLinecap="round" />
  </svg>
);

// Built-in icon per known toast `type`, matching Alert's leading-icon look.
// A `type` outside this set (or none) renders no icon — same as a neutral Alert.
const TYPE_ICONS: Record<string, React.FC> = {
  success: CheckIcon,
  error: ErrorIcon,
  warning: WarnIcon,
  info: InfoIcon,
};

/** Renders the toasts from the manager into a fixed corner viewport. */
function ToastList() {
  const { toasts } = BaseToast.useToastManager();
  const sc = useSilicaClass();
  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className={cx(sc("toast-viewport"))}>
        {toasts.map((toast) => {
          const Icon = toast.type ? TYPE_ICONS[toast.type] : undefined;
          // Base UI's `data` is a free-form per-toast extension point (there's
          // no `className` on ToastObject itself, since toasts are fired
          // imperatively via `add()`, not authored as JSX) — Silica reads a
          // `className` off it so a caller can request e.g. `glass` per toast:
          // `toast.add({ title: "Saved", data: { className: "glass" } })`.
          const data = toast.data as { className?: string } | undefined;
          return (
            <BaseToast.Root key={toast.id} toast={toast} className={cx(sc("toast"), data?.className)}>
              {Icon && <Icon />}
              <div className={cx(sc("toast-content"))}>
                <BaseToast.Title className={cx(sc("toast-title"))} />
                <BaseToast.Description className={cx(sc("toast-description"))} />
              </div>
              <BaseToast.Close className={cx(sc("toast-close"))} aria-label="Close">
                <CloseIcon />
              </BaseToast.Close>
            </BaseToast.Root>
          );
        })}
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
 *
 * For a glass toast, pass a `className` through `data` (there's no direct
 * `className` on the imperative `add()` call):
 *
 *   toast.add({ title: "Saved", data: { className: "glass" } });
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
