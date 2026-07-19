import * as React from "react";
import { PreviewCard as BasePreviewCard } from "@base-ui-components/react/preview-card";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import { usePortalContainer } from "./portal-container";

// Derive side/align straight from Base UI so they never drift.
type PositionerProps = React.ComponentProps<typeof BasePreviewCard.Positioner>;
export type PreviewCardSide = NonNullable<PositionerProps["side"]>;
export type PreviewCardAlign = NonNullable<PositionerProps["align"]>;

export interface PreviewCardProps {
  /** The trigger (usually a link). Base UI merges hover/focus behavior onto it. */
  children: React.ReactElement;
  /** The card body shown on hover/focus. */
  content: React.ReactNode;
  /** Preferred side. Default `bottom` (flips to avoid collisions). */
  side?: PreviewCardSide;
  /** Alignment along that side. Default `center`. */
  align?: PreviewCardAlign;
  /** Gap between trigger and card, in px. Default `8`. */
  sideOffset?: number;
  /** Hover-open delay in ms. */
  delay?: number;
  /** Close delay in ms. */
  closeDelay?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the little arrow. Default `false`. */
  arrow?: boolean;
  /** Extra class on the card surface. */
  className?: string;
}

/**
 * Silica PreviewCard — a hover/focus link preview (hovercard). Behavior from
 * Base UI, look from Silica's `.preview-card` CSS.
 *
 *   <PreviewCard content={<UserPreview user={u} />}>
 *     <Link href={u.url}>@{u.handle}</Link>
 *   </PreviewCard>
 */
export function PreviewCard({
  children,
  content,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  delay,
  closeDelay,
  open,
  defaultOpen,
  onOpenChange,
  arrow = false,
  className,
}: PreviewCardProps) {
  const sc = useSilicaClass();
  const portalContainer = usePortalContainer();
  return (
    <BasePreviewCard.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <BasePreviewCard.Trigger
        // children is any valid element; Base UI's render wants its props typed
        // as an index — a safe cast, not a behavior change.
        render={children as React.ReactElement<Record<string, unknown>>}
        delay={delay}
        closeDelay={closeDelay}
      />
      <BasePreviewCard.Portal container={portalContainer}>
        <BasePreviewCard.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BasePreviewCard.Popup className={cx(sc("preview-card"), className)}>
            {arrow && (
              <BasePreviewCard.Arrow className={cx(sc("preview-card-arrow"))} />
            )}
            {content}
          </BasePreviewCard.Popup>
        </BasePreviewCard.Positioner>
      </BasePreviewCard.Portal>
    </BasePreviewCard.Root>
  );
}
