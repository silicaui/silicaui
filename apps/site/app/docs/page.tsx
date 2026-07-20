import Link from "next/link";
import { COMPONENT_LINKS } from "@/lib/nav";

export default function DocsIndexPage() {
  const first = COMPONENT_LINKS[0];
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-base-content">Docs</h1>
      <p className="mt-4 text-base-content">
        SilicaUI is a Base UI behavior layer with CSS-first styling. Every
        component below has a live, interactive demo — pick one from the
        sidebar, or jump in with search (⌘K).
      </p>
      {first && (
        <Link href={first.href} className="btn btn-primary mt-6 inline-block">
          Browse components
        </Link>
      )}
    </div>
  );
}
