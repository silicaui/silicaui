import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, collectionSchema } from "@/lib/schema";
import { COMPONENT_LINKS } from "@/lib/nav";

const DESCRIPTION =
  "Browse every SilicaUI component with a live, interactive demo — buttons, inputs, selects, dialogs, calendars, data tables and more. CSS-first, tokened with OKLCH, accessible via Base UI, and available in React, framework-neutral HTML, and vanilla JS.";

export const metadata: Metadata = {
  title: "Components & Documentation",
  description: DESCRIPTION,
  alternates: { canonical: "/docs" },
  openGraph: {
    type: "website",
    title: "SilicaUI Components & Documentation",
    description: DESCRIPTION,
    url: "/docs",
  },
};

export default function DocsIndexPage() {
  const first = COMPONENT_LINKS[0];
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Docs", path: "/docs" }]),
          collectionSchema({
            name: "SilicaUI Components",
            description: DESCRIPTION,
            path: "/docs",
            items: COMPONENT_LINKS.map((l) => ({ title: l.title, path: l.href })),
          }),
        ]}
      />
      <h1 className="text-3xl font-semibold text-base-content">Docs</h1>
      <p className="mt-4 text-base-content">
        SilicaUI is a CSS-first Tailwind component library built on Base UI
        behavior and OKLCH design tokens. Every one of the{" "}
        {COMPONENT_LINKS.length} components below has a live, interactive demo —
        pick one from the sidebar, or jump in with search (⌘K).
      </p>
      {first && (
        <Link href={first.href} className="btn btn-primary mt-6 inline-block">
          Browse components
        </Link>
      )}
    </div>
  );
}
