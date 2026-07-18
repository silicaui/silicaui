import * as React from "react";
import { mergeProps, type Props } from "./merge-props";
import { warnRender } from "./dev";

/**
 * The single implementation behind every component's `render` prop.
 *
 * Returns the composed element, or `null` to mean "I can't compose this —
 * render your own default element instead". Callers must treat `null` as the
 * non-`render` path, so a malformed `render` degrades to a working (if less
 * semantic) element rather than taking the page down.
 *
 * Two distinct failure modes, both reachable only across an RSC boundary:
 *
 *   1. `render` isn't a usable element — `React.isValidElement` passes for an
 *      element whose `type` is `undefined`, and `cloneElement` on that throws
 *      React's opaque "Element type is invalid… got: undefined". We check
 *      `type` explicitly and bail out first.
 *   2. `render.props` reads as `undefined` — the element itself survived but
 *      its props didn't. Cloning still yields the right tag, so we compose
 *      anyway (see `mergeProps`) and warn that `href`/`target`/… are gone.
 */
export function composeRender(
  render: React.ReactElement | undefined,
  ownProps: Props,
  owner: string,
): React.ReactElement | null {
  if (!render) return null;

  const usable =
    React.isValidElement(render) &&
    (render as React.ReactElement).type != null;

  if (!usable) {
    warnRender(
      owner,
      "was given something that isn't a usable React element, so it rendered " +
        "its own default element instead.",
    );
    return null;
  }

  return React.cloneElement(
    render,
    mergeProps(ownProps, render.props as Props, owner),
  );
}
