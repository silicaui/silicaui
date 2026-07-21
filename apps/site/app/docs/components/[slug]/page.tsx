import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_META } from "@wizeworks/silicaui-demos/meta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, componentSchema } from "@/lib/schema";
import { componentDescription } from "@/lib/site";
import { DemoView } from "./demo-view";

// DEMO_META is plain data (no component imports reachable from it), so it's
// safe to read here in a Server Component. The full DEMOS array (actual
// components) is only ever imported from demo-view.tsx, a real "use client"
// file — see packages/silicaui-demos/tsup.config.ts for why the split exists.
export function generateStaticParams() {
  return DEMO_META.map((d) => ({ slug: d.id }));
}

// Per-page metadata: a unique title + description + canonical for every one of
// the ~113 component pages, so none reads as a thin duplicate to search or
// answer engines. The `%s · SilicaUI` template comes from the root layout.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = DEMO_META.find((d) => d.id === slug);
  if (!entry) return {};
  const description = componentDescription(entry.id, entry.title);
  const path = `/docs/components/${entry.id}`;
  return {
    title: `${entry.title} component`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${entry.title} — SilicaUI component`,
      description,
      url: path,
      images: [
        {
          url: `/og/${entry.id}.png`,
          width: 1200,
          height: 630,
          alt: `${entry.title} — SilicaUI component`,
        },
      ],
    },
    twitter: {
      title: `${entry.title} — SilicaUI`,
      description,
      images: [`/og/${entry.id}.png`],
    },
  };
}

export default async function ComponentDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = DEMO_META.find((d) => d.id === slug);
  if (!entry) notFound();

  const description = componentDescription(entry.id, entry.title);
  const path = `/docs/components/${entry.id}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Breadcrumb + article structured data — the machine-readable "where
          this page sits" and "what it's about" an answer engine reads. */}
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Docs", path: "/docs" },
            { name: "Components", path: "/docs/components/button" },
            { name: entry.title, path },
          ]),
          componentSchema({ title: entry.title, description, path }),
        ]}
      />
      <h1 className="text-3xl font-semibold text-base-content">{entry.title}</h1>
      {/* A real, factual sentence under the heading. Doubles as the line an
          answer engine quotes and the fix for a title-plus-demo-only page
          reading as thin content. */}
      <p className="mt-3 max-w-2xl text-md text-base-content">{description}</p>
      <div className="mt-8 flex flex-col gap-8">
        <DemoView slug={slug} />
      </div>
    </div>
  );
}
