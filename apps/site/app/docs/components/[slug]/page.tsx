import { notFound } from "next/navigation";
import { DEMO_META } from "@wizeworks/silicaui-demos/meta";
import { DemoView } from "./demo-view";

// DEMO_META is plain data (no component imports reachable from it), so it's
// safe to read here in a Server Component. The full DEMOS array (actual
// components) is only ever imported from demo-view.tsx, a real "use client"
// file — see packages/silicaui-demos/tsup.config.ts for why the split exists.
export function generateStaticParams() {
  return DEMO_META.map((d) => ({ slug: d.id }));
}

export default async function ComponentDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = DEMO_META.find((d) => d.id === slug);
  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-base-content">{entry.title}</h1>
      <div className="mt-8 flex flex-col gap-8">
        <DemoView slug={slug} />
      </div>
    </div>
  );
}
