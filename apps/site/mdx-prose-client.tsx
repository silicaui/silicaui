"use client";

import { Prose, type ProseProps } from "@wizeworks/silicaui-react";

// Client boundary for mdx-components.tsx's wrapper, same reasoning as
// app/providers.tsx: importing a silicaui-react component directly into
// Next's server-side metadata-collection path for an .mdx page hits the same
// createContext resolution mismatch `serverExternalPackages` normally avoids
// for page rendering — that config doesn't cover this code path.
export function MdxProse(props: ProseProps) {
  return <Prose {...props} />;
}
