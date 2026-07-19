import * as React from "react";

/**
 * Silica PortalContainer — tells every portalled surface below it (dropdown
 * menus, selects, dialogs, tooltips, toasts, …) which element to portal into.
 *
 * By default Base UI portals into `document.body` — and `document` is the
 * document of the window that LOADED the JavaScript. That is the right answer
 * until an app renders part of its React tree into another browser window
 * (`window.open` + `createPortal`, the standard multi-window/popout pattern):
 * a menu opened from the child window then appears in the parent window,
 * because the trigger's document and `document.body` are no longer the same
 * document.
 *
 *   <PortalContainerProvider container={childWindowDocument.body}>
 *     …panes living in the child window…
 *   </PortalContainerProvider>
 *
 * The container is any `HTMLElement`, not just a document body — pointing it at
 * an ordinary in-page element scopes portalled surfaces to that element instead
 * of the document. That is how a pane, workspace, or module region gets its
 * dialogs and menus to inherit its own theme island:
 *
 *   <PortalContainerProvider container={paneEl}>
 *     …the pane's contents…
 *   </PortalContainerProvider>
 *
 * A dialog portalled into the pane resolves `--color-*` against the pane's
 * `[data-theme]` ancestor with no per-instance styling. Two caveats that do not
 * apply when portalling to a body: the container must not establish a
 * containing block for fixed positioning (`transform`, `filter`, `contain`,
 * `backdrop-filter` on it or an ancestor) or the centered popup positions
 * against the pane rather than the viewport, and it must not clip
 * (`overflow: hidden`) or the popup is cut off at the pane's edge. A plain
 * `position: relative` wrapper is safe.
 *
 * Single-window apps never need this: with no provider (or `container={null}`)
 * every component keeps Base UI's default behaviour. Nesting works the way
 * context always works — the nearest provider wins, so a subtree portalled to
 * a second window or scoped to a pane carries its own provider while the rest
 * of the app keeps the default.
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

export interface PortalContainerProviderProps {
  /** The element portalled surfaces should append to — another window's
   *  `document.body` for popouts, or any in-page element to scope surfaces to
   *  a pane. `null` restores the default behaviour. */
  container: HTMLElement | null;
  children?: React.ReactNode;
}

export function PortalContainerProvider({
  container,
  children,
}: PortalContainerProviderProps) {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
}

/**
 * The container portalled surfaces should render into, or `undefined` when no
 * provider is set — `undefined` (not `null`) so it can be spread straight into
 * a Base UI `<X.Portal container={…}>` without disturbing the default.
 */
export function usePortalContainer(): HTMLElement | undefined {
  return React.useContext(PortalContainerContext) ?? undefined;
}