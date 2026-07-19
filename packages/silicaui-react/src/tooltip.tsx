import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

// Derive the side/align unions straight from Base UI so they never drift.
type PositionerProps = React.ComponentProps<typeof BaseTooltip.Positioner>;
export type TooltipSide = NonNullable<PositionerProps["side"]>;
export type TooltipAlign = NonNullable<PositionerProps["align"]>;

export interface TooltipProps {
  /** The floating content. */
  content: React.ReactNode;
  /** The trigger element — Base UI merges hover/focus behavior onto it. */
  children: React.ReactElement;
  /** Which side of the trigger to prefer. Default `top` (flips to avoid collisions). */
  side?: TooltipSide;
  /** Alignment along that side. Default `center`. */
  align?: TooltipAlign;
  /** Gap between trigger and popup, in px. Default `8`. */
  sideOffset?: number;
  /** Hover-open delay in ms. Default `600` (Base UI). */
  delay?: number;
  /** Close delay in ms. Default `0`. */
  closeDelay?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disable the tooltip entirely. */
  disabled?: boolean;
  /** Show the little arrow. Default `true`. */
  arrow?: boolean;
  /** Extra class on the popup surface. */
  className?: string;
}

/**
 * Silica Tooltip — behavior from Base UI, look from Silica's `.tooltip` CSS.
 *
 *   <Tooltip content="Copy link">
 *     <Button variant="ghost">Copy</Button>
 *   </Tooltip>
 *
 * Wrap a subtree in <TooltipProvider> to share a delay across many tooltips
 * (adjacent ones then open instantly).
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
  delay,
  closeDelay,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  arrow = true,
  className,
}: TooltipProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BaseTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <BaseTooltip.Trigger
        // children is any valid element; Base UI's render wants the element's
        // props typed as an index — a safe cast, not a behavior change.
        render={children as React.ReactElement<Record<string, unknown>>}
        delay={delay}
        closeDelay={closeDelay}
      />
      <BaseTooltip.Portal container={portalContainer}>
        <BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset}>
          <BaseTooltip.Popup className={cx(sc("tooltip"), className)}>
            {arrow && <BaseTooltip.Arrow className={cx(sc("tooltip-arrow"))} />}
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export type TooltipProviderProps = React.ComponentProps<
  typeof BaseTooltip.Provider
>;

/** Shares a hover delay across the tooltips beneath it (adjacent open instantly). */
export function TooltipProvider(props: TooltipProviderProps) {
  return <BaseTooltip.Provider {...props} />;
}
