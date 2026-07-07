import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaSize } from "./lib/tokens";

export type KbdSize = SilicaSize;

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Default `md`. Scales the (em-based) keycap with the surrounding text. */
  size?: KbdSize;
}

/**
 * Silica Kbd — an inline keyboard-key cap.
 *
 *   Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search.
 */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  function Kbd({ size = "md", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <kbd
        ref={ref}
        className={cx(sc("kbd"), size !== "md" && sc(`kbd-${size}`), className)}
        {...rest}
      />
    );
  },
);
