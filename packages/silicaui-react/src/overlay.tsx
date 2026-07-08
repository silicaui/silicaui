import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";

export type OverlayPlacement = "top" | "bottom" | "full";
export type OverlayReveal = "always" | "hover";

export interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Where the scrim sits over the media. Default `"bottom"`. */
  placement?: OverlayPlacement;
  /** `"always"` (default) shows the scrim outright; `"hover"` fades it in on hover/focus. */
  reveal?: OverlayReveal;
  /** The scrim's content — a caption, badges, action buttons, … */
  overlay: React.ReactNode;
  /** The underlying media — an `<img>`, `<video>`, or any element to scrim over. */
  children: React.ReactNode;
}

/**
 * Silica Overlay — a contextual scrim anchored to a media element, for
 * presenting info/actions specific to what's behind it (a caption on a
 * photo, a "Play" button on a video thumbnail, hover actions on a gallery
 * grid item). Not a page-level interruption like `Dialog`/`Lightbox`.
 *
 *   <Overlay overlay={<h3>Mountain sunrise</h3>}>
 *     <img src={photo} alt="" />
 *   </Overlay>
 *
 *   <Overlay reveal="hover" placement="full" overlay={<Button>View</Button>}>
 *     <img src={thumbnail} alt="" />
 *   </Overlay>
 */
export const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>(
  function Overlay(
    { placement = "bottom", reveal = "always", overlay, children, className, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(sc("overlay"), className)}
        data-reveal={reveal}
        {...rest}
      >
        {children}
        <div className={cx(sc("overlay-scrim"))} data-placement={placement}>
          {overlay}
        </div>
      </div>
    );
  },
);
