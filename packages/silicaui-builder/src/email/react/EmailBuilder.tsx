/**
 * The EmailBuilder shell — the embeddable email editor chrome, structurally a
 * peer of the site `Builder` (header + left rail + canvas + right rail) but
 * over the closed email schema: no Page/Layout/Component mode switch (an email
 * has no pages, frame, or symbols), no Theme mode (colors are per-node, not a
 * site-wide token set) — just Insert (left) + Canvas (center) + Design (right).
 *
 * STYLING RULE (hard): every visual is a Tailwind utility or a @wizeworks/silicaui component
 * class, and every glyph is a baked `<Icon>`. The shell is its own
 * `[data-theme="studio"]` island, isolated from the host page.
 */
import * as React from "react";
import { Button, ToggleGroup, ToggleGroupItem, EmptyState } from "@wizeworks/silicaui-react";
import { EmailEditor } from "../engine";
import type { EmailDocument } from "../schema";
import { toEmailHtml } from "../projector";
import { EmailEditorProvider, useEmailDocument, useEmailEditor, useEmailHistory } from "./editor-context";
import { ErrorBoundary } from "../../shared/react/ErrorBoundary";
import { useEmailEditorShortcuts } from "./use-shortcuts";
import { EmailCanvas } from "./Canvas";
import { EmailPalette } from "./Palette";
import { EmailInspector } from "./Inspector";
import { Icon } from "../../shared/react/Icon";

function CanvasErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const editor = useEmailEditor();
  const { canUndo } = useEmailHistory();
  return (
    <div className="grid flex-1 min-h-0 place-items-center bg-base-200 p-8">
      <EmptyState
        icon={<Icon name="warning" />}
        title="Couldn't render the canvas"
        description={error.message || "A block failed to render."}
        actions={
          <>
            {canUndo && (
              <Button size="sm" color="primary" onClick={() => { editor.undo(); reset(); }}>
                Undo last change
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={reset}>Try again</Button>
          </>
        }
      />
    </div>
  );
}

function ChromeErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid h-full place-items-center bg-base-100 p-8 text-base-content">
      <EmptyState
        icon={<Icon name="warning" />}
        title="The email builder hit an error"
        description={error.message || "Something went wrong."}
        actions={<Button size="sm" color="primary" onClick={reset}>Reload editor</Button>}
      />
    </div>
  );
}

/** Client-side download of the exported HTML — works standalone with no host
 *  wiring; `onExport` (if given) additionally hands the host the same string. */
function downloadHtml(doc: EmailDocument): void {
  const html = toEmailHtml(doc);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = doc.subject.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "email";
  a.download = `${slug}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function Chrome({ onExport }: { onExport?: (html: string) => void }) {
  const editor = useEmailEditor();
  const doc = useEmailDocument();
  const { canUndo, canRedo } = useEmailHistory();
  const [device, setDevice] = React.useState("desktop");

  useEmailEditorShortcuts();

  const exportHtml = () => {
    downloadHtml(doc);
    onExport?.(toEmailHtml(doc));
  };

  return (
    <>
      <header className="flex items-center gap-2 h-12 flex-none px-3 bg-base-100 border-b border-base-300">
        <div className="flex items-center gap-2 font-semibold tracking-tight mr-1">
          <Icon name="mail" className="text-primary" />
          @wizeworks/silicaui <span className="text-base-content/45 font-medium">email</span>
        </div>

        <Button variant="ghost" size="sm" aria-label="Undo" disabled={!canUndo} onClick={() => editor.undo()}>
          <Icon name="undo" />
        </Button>
        <Button variant="ghost" size="sm" aria-label="Redo" disabled={!canRedo} onClick={() => editor.redo()}>
          <Icon name="redo" />
        </Button>

        <ToggleGroup
          className="toggle-group-sm"
          aria-label="Canvas device width"
          value={[device]}
          onValueChange={(v: string[]) => v.length && setDevice(v[v.length - 1]!)}
        >
          <ToggleGroupItem value="desktop"><Icon name="monitor" /> Desktop</ToggleGroupItem>
          <ToggleGroupItem value="mobile"><Icon name="smartphone" /> Mobile</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex-1" />

        <span className="max-w-[220px] truncate text-sm text-base-content/55" title={doc.subject}>
          {doc.subject || "Untitled email"}
        </span>
        <Button color="primary" size="sm" onClick={exportHtml}>
          <Icon name="download" /> Export HTML
        </Button>
      </header>

      <div className="grid flex-1 min-h-0 grid-cols-[240px_1fr_300px]">
        <aside className="flex flex-col min-h-0 bg-base-100 border-r border-base-300">
          <div className="flex items-center gap-1.5 h-10 flex-none px-3.5 border-b border-base-200 text-sm font-semibold">
            <Icon name="plus" /> Insert
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <EmailPalette />
          </div>
        </aside>

        <section className="flex flex-col min-w-0 min-h-0">
          <ErrorBoundary fallback={(error, reset) => <CanvasErrorFallback error={error} reset={reset} />}>
            <EmailCanvas device={device} />
          </ErrorBoundary>
        </section>

        <aside className="flex flex-col min-h-0 bg-base-100 border-l border-base-300">
          <div className="flex items-center gap-1.5 h-10 flex-none px-3.5 border-b border-base-200 text-sm font-semibold">
            <Icon name="sliders" /> Design
          </div>
          <EmailInspector />
        </aside>
      </div>

      <footer className="flex items-center gap-2 h-7 flex-none px-3 border-t border-base-300 bg-base-100 text-xs text-base-content/55">
        <span className="capitalize">{device}</span>
        <span className="flex-1" />
        <span>{doc.root.width}px canvas</span>
      </footer>
    </>
  );
}

export interface EmailBuilderProps {
  document?: EmailDocument;
  studioTheme?: string;
  /** Fires after every committed edit, with the whole document to persist. The
   *  builder stores nothing itself — the host owns persistence. */
  onChange?: (doc: EmailDocument) => void;
  /** Fires (in addition to the built-in client-side download) when the user
   *  clicks Export HTML, with the projected HTML string. */
  onExport?: (html: string) => void;
}

/** The full email builder. Mount it anywhere; it fills its host container. */
export function EmailBuilder({ document, studioTheme = "studio", onChange, onExport }: EmailBuilderProps) {
  const [editor] = React.useState(() => new EmailEditor(document));

  React.useEffect(() => {
    if (!onChange) return;
    return editor.subscribe((e) => {
      if (e.kind !== "selection") onChange(editor.extract());
    });
  }, [editor, onChange]);

  return (
    <EmailEditorProvider editor={editor}>
      <div className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased" data-theme={studioTheme}>
        <ErrorBoundary fallback={(error, reset) => <ChromeErrorFallback error={error} reset={reset} />}>
          <Chrome onExport={onExport} />
        </ErrorBoundary>
      </div>
    </EmailEditorProvider>
  );
}
