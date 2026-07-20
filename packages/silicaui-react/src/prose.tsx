import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaSize } from "./lib/tokens";

export type ProseSize = SilicaSize;

export interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Default `md`. Rescales the whole block by one root font-size. */
  size?: ProseSize;
}

/**
 * Silica Prose — typographic defaults for a block of rich/markdown content.
 * Wrap raw HTML (or a Markdown renderer's output) and it gets themed headings,
 * lists, quotes, code, tables, and rhythm — scoped to this block only.
 *
 *   <Prose>
 *     <h1>Title</h1>
 *     <p>Body copy with a <a href="#">link</a> and <code>inline code</code>.</p>
 *   </Prose>
 *
 *   <Prose dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
 *
 * Caps width at 65ch for readability — add `max-w-none` to remove.
 */
export const Prose = React.forwardRef<HTMLDivElement, ProseProps>(
  function Prose({ size = "md", className, ...rest }, ref) {
    const sc = useSilicaClass();
    return (
      <div
        ref={ref}
        className={cx(
          sc("prose"),
          size !== "md" && sc(`prose-${size}`),
          className,
        )}
        {...rest}
      />
    );
  },
);
