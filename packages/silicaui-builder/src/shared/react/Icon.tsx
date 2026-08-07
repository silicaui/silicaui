/**
 * React wrapper over the baked Lucide inline-SVG set (../icons) — keeps the
 * builder's zero-runtime-dep icon story while rendering in React. The SVG is
 * `1em` and inherits `currentColor`, so size/color it with Tailwind text-* on an
 * ancestor; inside @wizeworks/silicaui components (`.btn`) their own `svg` rule sizes it.
 */
import * as React from "react";
import { icon, typeIcon } from "../icons";
import type { IconName } from "../icons";

/** `data-icon` names the glyph. Every icon here is inline SVG path data, so
 *  WHICH one rendered is otherwise unassertable and undebuggable — which is how
 *  a hardcoded plug stood in for a host's registered icon without any test
 *  noticing. It is builder chrome only; nothing here reaches a published page. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      className={className ? `inline-flex ${className}` : "inline-flex"}
      aria-hidden
      data-icon={name}
      dangerouslySetInnerHTML={{ __html: icon(name) }}
    />
  );
}

/** Icon for a node type-label (e.g. "Heading" → the heading glyph). */
export function TypeIcon({ type, className }: { type: string; className?: string }) {
  return <Icon name={typeIcon(type)} className={className} />;
}
