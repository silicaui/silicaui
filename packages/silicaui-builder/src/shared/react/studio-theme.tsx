/**
 * The chrome's `[data-theme]` value, shared by BOTH builder shells.
 *
 * Base UI popups (dropdowns, dialogs, tooltips) render in a PORTAL at
 * `document.body` — outside the chrome's theme island — so a portaled popup must
 * re-stamp this on its own root to recover the studio tokens (else base/primary
 * resolve to nothing). Threaded through context so any chrome popup can read it
 * without every intermediate component having to forward a `studioTheme` prop.
 *
 * Lived in the site builder's `editor-context.tsx` until tooltips arrived: the
 * email builder needs the same stamp on the same portaled surfaces, and hand-
 * threading it through every panel is exactly the drift this context exists to
 * prevent. `editor-context.tsx` re-exports both symbols, so site imports are
 * unchanged.
 */
import * as React from "react";

const StudioThemeContext = React.createContext<string>("studio");

export function StudioThemeProvider({ value, children }: { value: string; children: React.ReactNode }) {
  return <StudioThemeContext.Provider value={value}>{children}</StudioThemeContext.Provider>;
}

/** The chrome's `[data-theme]` name — stamp it on portaled popups to keep tokens. */
export function useStudioTheme(): string {
  return React.useContext(StudioThemeContext);
}
