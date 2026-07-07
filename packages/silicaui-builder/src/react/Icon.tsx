/**
 * React wrapper over the baked Lucide inline-SVG set (../icons) — keeps the
 * builder's zero-runtime-dep icon story while rendering in React. The SVG is
 * `1em` and inherits `currentColor`, so size/color it with Tailwind text-* on an
 * ancestor; inside silicaui components (`.btn`) their own `svg` rule sizes it.
 */
import * as React from "react";
import { icon, typeIcon } from "../icons";
import type { IconName } from "../icons";

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      className={className ? `inline-flex ${className}` : "inline-flex"}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: icon(name) }}
    />
  );
}

/** Icon for a node type-label (e.g. "Heading" → the heading glyph). */
export function TypeIcon({ type, className }: { type: string; className?: string }) {
  return <Icon name={typeIcon(type)} className={className} />;
}
