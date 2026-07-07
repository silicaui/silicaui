import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui-components/react/scroll-area";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which scrollbars to render. Default `vertical`. */
  orientation?: ScrollAreaOrientation;
}

/**
 * Silica ScrollArea — a panel with custom overlay scrollbars.
 *
 *   <ScrollArea className="h-64 w-72">
 *     <div className="p-4">…long content…</div>
 *   </ScrollArea>
 *
 * Give it a bounded size (via `className`/`style`); the content scrolls inside
 * and the overlay scrollbars fade in on hover. Use `orientation="both"` for a
 * two-axis panel.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea({ orientation = "vertical", className, children, ...rest }, ref) {
    const sc = useSilicaClass();
    const showV = orientation === "vertical" || orientation === "both";
    const showH = orientation === "horizontal" || orientation === "both";
    return (
      <BaseScrollArea.Root
        ref={ref}
        className={cx(sc("scroll-area"), className)}
        {...rest}
      >
        <BaseScrollArea.Viewport className={cx(sc("scroll-area-viewport"))}>
          <BaseScrollArea.Content className={cx(sc("scroll-area-content"))}>
            {children}
          </BaseScrollArea.Content>
        </BaseScrollArea.Viewport>
        {showV && (
          <BaseScrollArea.Scrollbar
            orientation="vertical"
            className={cx(sc("scroll-area-scrollbar"))}
          >
            <BaseScrollArea.Thumb className={cx(sc("scroll-area-thumb"))} />
          </BaseScrollArea.Scrollbar>
        )}
        {showH && (
          <BaseScrollArea.Scrollbar
            orientation="horizontal"
            className={cx(sc("scroll-area-scrollbar"))}
          >
            <BaseScrollArea.Thumb className={cx(sc("scroll-area-thumb"))} />
          </BaseScrollArea.Scrollbar>
        )}
        {orientation === "both" && (
          <BaseScrollArea.Corner className={cx(sc("scroll-area-corner"))} />
        )}
      </BaseScrollArea.Root>
    );
  },
);
