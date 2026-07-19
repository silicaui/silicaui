/**
 * Vanilla mirror of `@wizeworks/silicaui-react`'s `useImperativeAlertDialog` — a
 * `window.confirm()`-style async confirm for a host with no React. Builds
 * plain DOM using Silica's own CSS classes (`.dialog-*`, `.btn-*` from
 * `@wizeworks/silicaui`) so it matches `AlertDialog` pixel-for-pixel with zero
 * framework dependency: focus-trapped, Escape/backdrop cancel, restores focus
 * on close. Only one confirm can be open at a time (matches the React
 * provider's singleton model) — a call while one is open resolves `false`
 * immediately rather than stacking dialogs.
 *
 * `useControllableState` has no vanilla mirror here on purpose: a raw DOM
 * element already IS its own single source of truth (`.value`/`.checked`)
 * with no controlled/uncontrolled duality to bridge.
 */

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Suffix for the confirm button's color class (`btn-<color>`), e.g. `"error"` for a destructive action. Default `"primary"`. */
  color?: string;
}

let openDialog: (() => void) | null = null;

export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (openDialog) {
      resolve(false);
      return;
    }

    const {
      title = "Are you sure?",
      description,
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      color = "primary",
    } = options;

    const backdrop = document.createElement("div");
    backdrop.className = "dialog-backdrop";

    const popup = document.createElement("div");
    popup.className = "dialog-popup";
    popup.setAttribute("role", "alertdialog");
    popup.setAttribute("aria-modal", "true");
    popup.tabIndex = -1;

    const titleId = `silica-confirm-title-${Math.random().toString(36).slice(2)}`;
    popup.setAttribute("aria-labelledby", titleId);

    const titleEl = document.createElement("div");
    titleEl.className = "dialog-title";
    titleEl.id = titleId;
    titleEl.textContent = title;
    popup.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement("div");
      descEl.className = "dialog-description";
      descEl.textContent = description;
      popup.appendChild(descEl);
    }

    const footer = document.createElement("div");
    footer.className = "dialog-footer";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-ghost btn-neutral";
    cancelBtn.textContent = cancelLabel;

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = `btn btn-${color}`;
    confirmBtn.textContent = confirmLabel;

    footer.append(cancelBtn, confirmBtn);
    popup.appendChild(footer);

    document.body.append(backdrop, popup);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // APG alert dialog: initial focus goes to the LEAST destructive action —
    // an accidental Enter must cancel, never confirm.
    cancelBtn.focus();

    function focusables(): HTMLElement[] {
      return Array.from(popup.querySelectorAll<HTMLElement>("button"));
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        settle(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    function onBackdropClick() {
      settle(false);
    }
    function onCancel() {
      settle(false);
    }
    function onConfirm() {
      settle(true);
    }

    function settle(result: boolean) {
      document.removeEventListener("keydown", onKeyDown);
      backdrop.removeEventListener("click", onBackdropClick);
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
      backdrop.remove();
      popup.remove();
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
      openDialog = null;
      resolve(result);
    }

    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
    backdrop.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeyDown);

    openDialog = () => settle(false);
  });
}
