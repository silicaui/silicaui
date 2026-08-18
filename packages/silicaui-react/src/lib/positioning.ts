import * as React from "react";
import type { Popover } from "@base-ui/react/popover";

type BasePositionerProps = React.ComponentProps<typeof Popover.Positioner>;

/**
 * The anchor-positioning surface every Base UI `*.Positioner` shares
 * (`UseAnchorPositioningSharedParameters`) — minus `side`/`align`/`sideOffset`,
 * which each Silica `*Content` declares itself because they carry Silica defaults.
 *
 * Every floating component (Popover, Tooltip, DropdownMenu, Select, Combobox,
 * ContextMenu, …) extends this and forwards it to its Positioner, so a popup is
 * never confined to the element that opened it.
 *
 * Each member's TYPE is read off Base UI's own Positioner so it tracks upstream
 * instead of drifting from a hand-copy.
 */
export interface PositioningProps {
  /**
   * What to position against. Defaults to the component's own trigger. Accepts
   * an element, a ref, a function returning either, or a VIRTUAL element —
   * anything with `getBoundingClientRect()` — which is how you pin a popup to a
   * pointer, a text caret, or a spot on a canvas that has no DOM node.
   *
   *   <PopoverContent anchor={rowRef} />
   *   <PopoverContent anchor={{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }} />
   */
  anchor?: BasePositionerProps["anchor"];
  /** `absolute` (default) or `fixed`. Use `fixed` to escape a clipping ancestor. */
  positionMethod?: BasePositionerProps["positionMethod"];
  /** Offset along the alignment axis, in px. Pairs with `align`. */
  alignOffset?: BasePositionerProps["alignOffset"];
  /**
   * The element the popup must stay inside. Defaults to the viewport — set it to
   * a scroll container so the popup collides with the panel, not the window.
   */
  collisionBoundary?: BasePositionerProps["collisionBoundary"];
  /** Inset from the collision boundary, in px. */
  collisionPadding?: BasePositionerProps["collisionPadding"];
  /** Which collision strategy runs per axis (`flip`, `shift`, `none`). */
  collisionAvoidance?: BasePositionerProps["collisionAvoidance"];
  /** Keep the popup glued to the anchor while it scrolls out of view. */
  sticky?: BasePositionerProps["sticky"];
  /** Minimum distance from the popup's corner to the arrow, in px. */
  arrowPadding?: BasePositionerProps["arrowPadding"];
  /** Stop re-measuring when the anchor moves. Cheaper, but goes stale. */
  disableAnchorTracking?: BasePositionerProps["disableAnchorTracking"];
}

const POSITIONING_KEYS = [
  "anchor",
  "positionMethod",
  "alignOffset",
  "collisionBoundary",
  "collisionPadding",
  "collisionAvoidance",
  "sticky",
  "arrowPadding",
  "disableAnchorTracking",
] as const satisfies readonly (keyof PositioningProps)[];

/**
 * Split a `*Content` prop bag into the bits the Positioner owns and the bits the
 * Popup owns. Keys absent from `props` stay absent from the result, so Base UI's
 * own defaults still apply — passing `undefined` explicitly is not the same
 * thing for `collisionAvoidance`.
 */
export function splitPositioning<T extends Partial<PositioningProps>>(
  props: T,
): [PositioningProps, Omit<T, keyof PositioningProps>] {
  const positioning: Record<string, unknown> = {};
  const popup: Record<string, unknown> = { ...props };
  for (const key of POSITIONING_KEYS) {
    if (key in popup) {
      positioning[key] = popup[key];
      delete popup[key];
    }
  }
  return [
    positioning as PositioningProps,
    popup as Omit<T, keyof PositioningProps>,
  ];
}
