"use client";

import { DEMOS } from "@wizeworks/silicaui-demos";

// Client boundary for the live demo: `Demo` components use hooks, so this
// can't render inside the Server Component that owns `generateStaticParams`.
// Looking `slug` back up to its `DemoEntry` here (rather than passing the
// component down as a prop) avoids passing a function across the server/
// client boundary, which isn't serializable. Same pattern as app/providers.tsx.
export function DemoView({ slug }: { slug: string }) {
  const entry = DEMOS.find((d) => d.id === slug);
  if (!entry) return null;
  const { Demo } = entry;
  return <Demo />;
}
