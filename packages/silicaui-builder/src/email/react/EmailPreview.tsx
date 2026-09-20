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
 *
 * WHO it renders as is a separate question from WHAT it renders, and the second
 * one used to have no answer. See `EmailBuilderHost.previewAudiences`.
 */
import * as React from "react";
import { NativeSelect } from "@wizeworks/silicaui-react";
import { useEmailDocument } from "./editor-context";
import { useEmailHost } from "./host-context";
import { toEmailHtml } from "../projector";
import type { EmailFrame } from "../frame";

export function EmailPreview({ device = "desktop", frame }: { device?: string; frame?: EmailFrame }) {
  const doc = useEmailDocument();
  const host = useEmailHost();
  const audiences = React.useMemo(() => host?.previewAudiences?.() ?? [], [host]);
  const [who, setWho] = React.useState<string | undefined>(undefined);
  // The first audience is the default, and a host that reorders or renames its
  // samples must not strand the picker on a key that no longer exists.
  const current = audiences.find((a) => a.key === who) ?? audiences[0];

  // Resolved through the SAME host as Export/Send (Q25), and composed with the
  // SAME frame the canvas shows — this iframe shows exactly what a real
  // recipient with real data would get, not a static approximation with
  // unresolved bindings or missing chrome.
  const html = React.useMemo(
    () => toEmailHtml(doc, { resolver: host, frame, scope: current?.scope }),
    [doc, host, frame, current],
  );
  const width = device === "mobile" ? 375 : doc.root.width + 40;

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-base-200 p-8">
      <div className="mx-auto flex flex-col gap-3" style={{ width }}>
        {audiences.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-base-content">
            <span className="flex-none">Showing what this subscriber gets</span>
            <NativeSelect
              size="sm"
              value={current?.key ?? ""}
              data-testid="preview-audience"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWho(e.target.value)}
            >
              {audiences.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </NativeSelect>
          </label>
        )}
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
