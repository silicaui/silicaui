export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizeHandle,
} from "./resizable-panels";
export type { ResizeHandleProps } from "./resizable-panels";

// Re-export the underlying primitives + imperative handles/types for advanced
// use (programmatic resize/collapse, layout persistence) without a separate
// react-resizable-panels install.
export {
  getPanelElement,
  getPanelGroupElement,
  getResizeHandleElement,
} from "react-resizable-panels";
export type {
  PanelGroupProps,
  PanelProps,
  PanelResizeHandleProps,
  ImperativePanelHandle,
  ImperativePanelGroupHandle,
  PanelGroupStorage,
  PanelOnResize,
  PanelOnCollapse,
  PanelOnExpand,
} from "react-resizable-panels";
