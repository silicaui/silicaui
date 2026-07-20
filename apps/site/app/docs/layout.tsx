import { COMPONENT_LINKS } from "@/lib/nav";
import { DocsShell } from "./docs-shell";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell componentLinks={COMPONENT_LINKS}>{children}</DocsShell>;
}
