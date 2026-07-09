/**
 * The real-HTML preview — renders the ACTUAL projected `toEmailHtml` output in
 * a sandboxed iframe via `srcDoc`, at desktop/mobile widths. This is the
 * answer to the Canvas's live-DOM-approximation tradeoff (see `Canvas.tsx`'s
 * doc comment): the Canvas is fast to edit but flexbox-approximates the
 * projector's tables; this shows what you'll ACTUALLY ship, rendered by a real
 * browser engine. Still not a substitute for testing in Outlook/Gmail/Apple
 * Mail — no single browser renders the way every client does — but it's the
 * closest local check available, and it's what `pnpm verify:email` also
 * exercises structurally (this just makes it visual).
 */
import * as React from "react";
import { useEmailDocument } from "./editor-context";
import { toEmailHtml } from "../projector";

export function EmailPreview({ device = "desktop" }: { device?: string }) {
  const doc = useEmailDocument();
  const html = React.useMemo(() => toEmailHtml(doc), [doc]);
  const width = device === "mobile" ? 375 : doc.root.width + 40;

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-base-200 p-8">
      <div className="mx-auto" style={{ width }}>
        <iframe
          title="Email preview"
          srcDoc={html}
          sandbox=""
          className="w-full rounded-box border border-base-300 bg-base-100 shadow-[0_12px_40px_rgba(20,20,40,0.10)]"
          style={{ height: "calc(100vh - 220px)", minHeight: 480 }}
        />
      </div>
    </div>
  );
}
