import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type TextareaColor = SilicaColor;

export type TextareaSize = SilicaSize;

export interface TextareaProps
  // Omit the native string `color` so our token union wins.
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "color"> {
  /** Accent color; maps to `textarea-<color>` (border + focus ring). */
  color?: TextareaColor;
  /** Default `md`. */
  size?: TextareaSize;
}

/**
 * Silica Textarea — a multi-line text field. Thin, presentational wrapper around
 * a native `<textarea>`, so all native attributes (`value`, `rows`, `onChange`,
 * `placeholder`, `disabled`, …) pass straight through.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ color, size = "md", className, ...rest }, ref) {
    const sc = useSilicaClass();
    const classes = cx(
      sc("textarea"),
      color && sc(`textarea-${color}`),
      size !== "md" && sc(`textarea-${size}`),
      className,
    );

    return <textarea ref={ref} className={classes} {...rest} />;
  },
);
