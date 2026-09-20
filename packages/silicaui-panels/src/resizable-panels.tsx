import * as React from "react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  type PanelGroupProps,
  type PanelProps,
  type PanelResizeHandleProps,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { cx, useSilicaClass } from "@wizeworks/silicaui-react";

/**
 * One arrow press moves the divider by this much, as a percentage of the group.
 *
 * The underlying library defaults to 10, which on a 1,500px split is 156px a
 * press and leaves a keyboard user choosing between six positions in the whole
 * range. A pointer has pixel precision; an arrow key should at least be a nudge.
 * Travel is already covered without a coarse step: Home and End go to the ends,
 * and Shift with an arrow jumps the whole way.
 */
const KEYBOARD_STEP = 1;

/**
 * ResizablePanelGroup — the container. Pass `direction="horizontal"` (side-by-
 * side) or `"vertical"` (stacked); size the group yourself (it fills its box).
 *
 * Arrow keys move the divider 1% at a time; pass `keyboardResizeBy` to change
 * that.
 */
export function ResizablePanelGroup({ className, keyboardResizeBy, ...rest }: PanelGroupProps) {
  const sc = useSilicaClass();
  return (
    <PanelGroup
      className={cx(sc("resizable-group"), className)}
      keyboardResizeBy={keyboardResizeBy ?? KEYBOARD_STEP}
      {...rest}
    />
  );
}

/**
 * ResizablePanel — one region. Takes `defaultSize`/`minSize`/`maxSize`
 * (percentages), `collapsible`, imperative `ref`, etc. (passthrough).
 *
 * `forwardRef` and not a plain function, because the sentence above was only
 * true on React 19. This package's peer range is `react >= 18`, and on 18 a
 * `ref` handed to a plain function component is stripped before it can reach
 * `...rest` — so `panelRef.current` was null, `.collapse()` was never called,
 * and nothing anywhere said why. `PanelProps` did not declare `ref` either, so
 * the type checker called it a mistake on React 19 as well, where it would have
 * worked. The comment promised an imperative handle that no consumer could get.
 * (docs/personas/issues/104)
 */
export const ResizablePanel = React.forwardRef<ImperativePanelHandle, PanelProps>(
  function ResizablePanel({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <Panel ref={ref} className={cx(sc("resizable-panel"), className)} {...rest} />;
  },
);

export interface ResizeHandleProps extends PanelResizeHandleProps {}

/**
 * ResizeHandle — the draggable divider between two panels. Renders a centered
 * grip by default; pass `children` to supply your own. Orientation is inferred
 * from the parent group's direction.
 */
export function ResizeHandle({
  className,
  children,
  ...rest
}: ResizeHandleProps) {
  const sc = useSilicaClass();
  return (
    <PanelResizeHandle className={cx(sc("resizable-handle"), className)} {...rest}>
      {children ?? (
        <span className={cx(sc("resizable-handle-grip"))} aria-hidden="true" />
      )}
    </PanelResizeHandle>
  );
}
