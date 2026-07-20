import * as React from "react";
import { Button } from "./button";
import type { ButtonColor, ButtonVariant } from "./button";

export interface ThemeControllerProps {
  /** The themes to cycle through. Default `["light", "dark"]`. */
  themes?: string[];
  /** Controlled current theme. */
  value?: string;
  /** Uncontrolled initial theme (falls back to stored value, then the target's
   *  current `data-theme`, then the first theme). */
  defaultValue?: string;
  /** Called with the new theme when it changes. */
  onValueChange?: (theme: string) => void;
  /**
   * @deprecated Use `onValueChange`. `onChange` is reserved for the native DOM
   * handler on components that wrap a real form element; still honored here so
   * this isn't a breaking change.
   */
  onChange?: (theme: string) => void;
  /** Element to set `data-theme` on. Default `document.documentElement`. */
  target?: HTMLElement | null | (() => HTMLElement | null);
  /** localStorage key for persistence; `null` disables it. Default `"silica-theme"`. */
  storageKey?: string | null;
  /** Show the current theme name next to the icon. */
  labels?: boolean;
  /** Button variant. Default `ghost`. */
  variant?: ButtonVariant;
  /** Button color. Default `neutral`. */
  color?: ButtonColor;
  className?: string;
  "aria-label"?: string;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.5 1.8-1.5H16a6 6 0 0 0 6-6c0-4.4-4.5-8-10-8Z" />
    </svg>
  );
}

/**
 * Silica ThemeController — a control that switches the active `data-theme`.
 *
 *   <ThemeController />                         // light ⇄ dark toggle
 *   <ThemeController themes={["light","dark","dim"]} labels />
 *
 * Applies the theme to `document.documentElement` (or a `target`) and persists
 * it to localStorage. Cycles to the next theme on click; a plain light/dark pair
 * shows a sun/moon toggle.
 */
export function ThemeController({
  themes = ["light", "dark"],
  value,
  defaultValue,
  onValueChange,
  onChange,
  target,
  storageKey = "silica-theme",
  labels = false,
  variant = "ghost",
  color = "neutral",
  className,
  "aria-label": ariaLabel,
}: ThemeControllerProps) {
  const getTarget = React.useCallback((): HTMLElement | null => {
    if (typeof target === "function") return target();
    if (target) return target;
    return typeof document !== "undefined" ? document.documentElement : null;
  }, [target]);

  // Start from a value the SERVER can also compute — never read localStorage or
  // the DOM in the initializer. Doing so makes the client's pre-hydration render
  // disagree with the server's: the server has no storage, resolves "light", and
  // emits a Moon; a client with "dark" stored emits a Sun. React then warns and
  // the wrong icon can stick. The effect below adopts the persisted value right
  // after mount instead. Same rule as `useTheme` / `useMediaQuery`.
  const [internal, setInternal] = React.useState<string>(
    () => defaultValue ?? themes[0] ?? "light",
  );
  const current = value ?? internal;

  // Post-mount: adopt the stored / already-applied theme. Controlled callers
  // own the value, so this only runs for the uncontrolled case.
  const adopted = React.useRef(false);
  React.useEffect(() => {
    if (adopted.current || value !== undefined) return;
    adopted.current = true;
    if (storageKey) {
      const stored = window.localStorage.getItem(storageKey);
      if (stored && themes.includes(stored)) {
        setInternal(stored);
        return;
      }
    }
    const attr = getTarget()?.dataset.theme;
    if (attr && themes.includes(attr)) setInternal(attr);
    // `themes` is a fresh array literal on most renders; the `adopted` guard is
    // what makes this run once, so it deliberately isn't a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, storageKey, getTarget]);

  // Keep the target in sync with the current theme.
  React.useEffect(() => {
    const el = getTarget();
    if (el) el.dataset.theme = current;
  }, [current, getTarget]);

  const apply = (next: string) => {
    if (value === undefined) setInternal(next);
    const el = getTarget();
    if (el) el.dataset.theme = next;
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, next);
    }
    (onValueChange ?? onChange)?.(next);
  };

  const cycle = () => {
    const i = themes.indexOf(current);
    const next = themes[(i + 1) % themes.length] ?? themes[0] ?? current;
    apply(next);
  };

  const isLightDarkPair =
    themes.length === 2 &&
    themes.includes("light") &&
    themes.includes("dark");
  const icon = isLightDarkPair ? (
    current === "dark" ? (
      <SunIcon />
    ) : (
      <MoonIcon />
    )
  ) : (
    <PaletteIcon />
  );

  return (
    <Button
      type="button"
      variant={variant}
      color={color}
      onClick={cycle}
      className={className}
      aria-label={ariaLabel ?? `Switch theme (current: ${current})`}
      title={`Theme: ${current}`}
    >
      {icon}
      {labels && <span className="capitalize">{current}</span>}
    </Button>
  );
}
