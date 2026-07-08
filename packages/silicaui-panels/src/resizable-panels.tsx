import * as React from "react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  type PanelGroupProps,
  type PanelProps,
  type PanelResizeHandleProps,
} from "react-resizable-panels";
import { cx, useSilicaClass } from "@wizeworks/silicaui-react";

/**
 * ResizablePanelGroup — the container. Pass `direction="horizontal"` (side-by-
 * side) or `"vertical"` (stacked); size the group yourself (it fills its box).
 */
export function ResizablePanelGroup({ className, ...rest }: PanelGroupProps) {
  const sc = useSilicaClass();
  return <PanelGroup className={cx(sc("resizable-group"), className)} {...rest} />;
}

/**
 * ResizablePanel — one region. Takes `defaultSize`/`minSize`/`maxSize`
 * (percentages), `collapsible`, imperative `ref`, etc. (passthrough).
 */
export function ResizablePanel({ className, ...rest }: PanelProps) {
  const sc = useSilicaClass();
  return <Panel className={cx(sc("resizable-panel"), className)} {...rest} />;
}

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
