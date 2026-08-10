/**
 * Tooltips for the builder chrome — the ONE way a button in either shell says
 * what it does on hover.
 *
 * Why a wrapper rather than `<Tooltip>` at every call site:
 *
 *  1. THEME. Base UI portals the popup to `document.body`, which is outside the
 *     chrome's `[data-theme]` island — so the popup resolves `--color-*` against
 *     nothing and renders unstyled. Every other portaled surface in the builders
 *     already re-stamps the studio theme (`DialogContent data-theme=…`,
 *     `popupProps={{ "data-theme": … }}`); this reads the same value from
 *     context so no call site can forget.
 *  2. NAMING. A tooltip is not an accessible name — it is a hover affordance a
 *     screen reader never reaches and a keyboard user only sees on focus. An
 *     icon-only button needs BOTH, and the two must agree. `IconButton` takes
 *     one `label` and emits both, which is the only way they stay in sync.
 *  3. `title` IS NOT A TOOLTIP. The native attribute has a ~1s unconfigurable
 *     delay, no styling, no theme, no touch support, and is announced
 *     inconsistently (often twice, once as the name and once as the
 *     description). Everything here replaces a `title`, never doubles it —
 *     a `title` alongside a real tooltip shows both, staggered.
 *
 * A DISABLED button still gets its tooltip: "why can't I click this" is exactly
 * when a person hovers. Base UI's trigger drops pointer events on a disabled
 * button, so `IconButton` renders the trigger on a wrapper span in that case
 * (see below) rather than silently losing the hint on the buttons that need it
 * most.
 */
import * as React from "react";
import { Button, Tooltip, TooltipProvider } from "@wizeworks/silicaui-react";
import type { ButtonProps } from "@wizeworks/silicaui-react";
import { Icon } from "./Icon";
import type { IconName } from "../icons";
import { useStudioTheme } from "./studio-theme";

/**
 * Shares one hover delay across the whole chrome, so moving along a toolbar
 * shows each tooltip instantly instead of re-waiting per button. Mounted once
 * per shell, at the root of the theme island.
 *
 * 400ms rather than Base UI's 600: this is a dense tool UI whose controls are
 * mostly icons, so the hint is the label — waiting two-thirds of a second to
 * find out what a button does is the papercut this whole change exists to fix.
 */
export function BuilderTooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={400} closeDelay={0}>
      {children}
    </TooltipProvider>
  );
}

/**
 * Extends `HTMLAttributes` rather than declaring an index signature: everything
 * a `DialogTrigger`/`PopoverTrigger` injects (the open handler, `aria-*`, the
 * ref) is forwarded to `children`, and the named props below keep their real
 * types — an index signature would widen all of them to `unknown`.
 */
export interface HintProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** What the control does, in plain English. Sentence case, no trailing period. */
  label: React.ReactNode;
  /** Preferred side. Default `top`; rails and panel headers usually want otherwise. */
  side?: "top" | "right" | "bottom" | "left";
  /** The trigger. A single element that forwards props (any Silica component does). */
  children: React.ReactElement;
  /** Skip the tooltip without changing the tree (e.g. a row whose label is already visible). */
  disabled?: boolean;
}

/**
 * Wraps any control in a themed tooltip. Use directly when the trigger isn't a
 * plain icon button (a swatch, a chip, a tab); use `IconButton` when it is.
 *
 * TRANSPARENT BY DESIGN. Base UI's composition model is `render`-based: a
 * `DialogTrigger`/`PopoverTrigger` CLONES its child element to attach the open
 * handler and its ARIA wiring. If that child is a component which quietly drops
 * unknown props, the clone lands on nothing and the trigger silently stops
 * working — a dialog whose button no longer opens it, with no error anywhere.
 * (That is exactly what happened the first time this shipped: four dialogs went
 * dead the moment their buttons were tooltipped.)
 *
 * So `Hint` forwards every prop it doesn't recognise — and its `ref` — down to
 * `children`, which makes it safe in any slot that expects a real element.
 */
export const Hint = React.forwardRef<HTMLElement, HintProps>(function Hint(
  { label, side = "top", children, disabled, ...rest },
  ref,
) {
  const studioTheme = useStudioTheme();
  // Props injected from above (a Dialog/Popover trigger's handler + ARIA) have
  // to reach the real element whether or not a tooltip is rendered.
  const trigger =
    Object.keys(rest).length || ref
      ? React.cloneElement(children, { ...rest, ref } as Record<string, unknown>)
      : children;
  if (disabled || label === null || label === undefined || label === "") return trigger;
  return (
    <Tooltip
      content={label}
      side={side}
      sideOffset={6}
      disabled={disabled}
      popupProps={{ "data-theme": studioTheme }}
    >
      {trigger}
    </Tooltip>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, "children" | "aria-label" | "title"> {
  icon: IconName;
  /**
   * The control's name — used for BOTH the tooltip and `aria-label`, so they can
   * never disagree. Keep it a verb phrase ("Delete page"), not a noun.
   */
  label: string;
  /**
   * Extra detail shown in the tooltip only, on a second line — the "why" behind
   * a destructive or non-obvious action ("unlinks every instance"), or the
   * reason a control is disabled. The accessible name stays `label` alone.
   */
  hint?: React.ReactNode;
  /** Keyboard shortcut to show after the label, e.g. `⌘Z`. Display only. */
  shortcut?: string;
  /** Tooltip side. Default `top`. */
  side?: HintProps["side"];
}

/**
 * An icon-only chrome button: Silica `Button` + a themed tooltip + a matching
 * `aria-label`, from one `label`.
 *
 * Defaults are the chrome's house style (ghost, square, `xs`) — override per
 * call site as usual. Nothing here paints anything: color comes from `color`/
 * `variant` props resolving to real `btn-*` classes.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    label,
    hint,
    shortcut,
    side,
    variant = "ghost",
    size = "xs",
    shape = "square",
    type = "button",
    disabled,
    ...rest
  },
  ref,
) {
  const content =
    hint || shortcut ? (
      <span className="flex flex-col gap-0.5">
        <span>
          {label}
          {shortcut && <span className="ml-2 opacity-70">{shortcut}</span>}
        </span>
        {hint && <span className="opacity-70">{hint}</span>}
      </span>
    ) : (
      label
    );

  const button = (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      shape={shape}
      aria-label={label}
      disabled={disabled}
      {...rest}
    >
      <Icon name={icon} />
    </Button>
  );

  // A disabled <button> emits no pointer events, so Base UI's trigger never sees
  // the hover and the tooltip silently never opens — on exactly the controls
  // whose state most needs explaining. Wrapping the trigger in a span restores
  // hover for that case; `inline-flex` so the wrapper takes the button's own box
  // and can't disturb the toolbar's layout. Only when disabled: an extra span in
  // the common path would swallow a Dialog/Popover trigger's handler.
  return disabled ? (
    <Hint label={content} side={side}>
      <span className="inline-flex">{button}</span>
    </Hint>
  ) : (
    <Hint label={content} side={side}>
      {button}
    </Hint>
  );
});
