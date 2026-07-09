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
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Input,
  ToggleGroup,
  ToggleGroupItem,
  EmptyState,
} from "@wizeworks/silicaui-react";
import type { Theme } from "@wizeworks/silicaui-html";
import { EmailEditor } from "../engine";
import type { EmailDocument } from "../schema";
import { toEmailHtml } from "../projector";
import { EmailEditorProvider, useEmailDocument, useEmailEditor, useEmailHistory } from "./editor-context";
import { ErrorBoundary } from "../../shared/react/ErrorBoundary";
import { RecoveryBanner } from "../../shared/react/RecoveryBanner";
import { DraftStore } from "../../shared/persistence";
import { useEmailEditorShortcuts } from "./use-shortcuts";
import { resolveEmailColorDefaults } from "./theme-defaults";
import { EmailCanvas } from "./Canvas";
import { EmailPreview } from "./EmailPreview";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Send test" — the builder can't send email itself (no SMTP/ESP credentials,
 * and shouldn't own that responsibility), so this is purely a host-delegated
 * hook: collect a recipient, hand `{ to, html, subject }` to `onSendTest`, and
 * reflect whatever the host's promise does (pending/sent/error). Disabled
 * entirely when the host didn't wire `onSendTest`, same pattern as the site
 * builder's `Publish` button without `onPublish`.
 */
function SendTestButton({
  studioTheme,
  onSendTest,
}: {
  studioTheme: string;
  onSendTest?: (payload: { to: string; html: string; subject: string }) => void | Promise<void>;
}) {
  const doc = useEmailDocument();
  const [open, setOpen] = React.useState(false);
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async () => {
    if (!onSendTest || !EMAIL_RE.test(to)) return;
    setStatus("sending");
    try {
      await onSendTest({ to, html: toEmailHtml(doc), subject: doc.subject });
      setStatus("sent");
      setTimeout(() => setOpen(false), 900);
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o: boolean) => {
        setOpen(o);
        if (!o) {
          setTo("");
          setStatus("idle");
        }
      }}
    >
      <DialogTrigger>
        <Button variant="outline" size="sm" disabled={!onSendTest}>
          <Icon name="send" /> Send test
        </Button>
      </DialogTrigger>
      <DialogContent data-theme={studioTheme} className="w-[min(420px,94vw)] p-5">
        <DialogTitle className="text-base font-semibold">Send a test email</DialogTitle>
        <DialogDescription className="text-sm text-base-content/60">
          Sends the current draft, exactly as it would export, to one address.
        </DialogDescription>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            type="email"
            size="sm"
            placeholder="you@example.com"
            value={to}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && send()}
          />
          <Button
            color="primary"
            size="sm"
            disabled={!EMAIL_RE.test(to) || status === "sending"}
            onClick={send}
          >
            {status === "sending" ? "Sending…" : status === "sent" ? "Sent!" : "Send"}
          </Button>
          {status === "error" && <p className="text-xs text-error">Couldn't send — try again.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Chrome({
  studioTheme,
  onExport,
  onSendTest,
}: {
  studioTheme: string;
  onExport?: (html: string) => void;
  onSendTest?: (payload: { to: string; html: string; subject: string }) => void | Promise<void>;
}) {
  const editor = useEmailEditor();
  const doc = useEmailDocument();
  const { canUndo, canRedo } = useEmailHistory();
  const [device, setDevice] = React.useState("desktop");
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");

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

        <ToggleGroup
          className="toggle-group-sm"
          aria-label="Edit or preview"
          value={[mode]}
          onValueChange={(v: string[]) => v.length && setMode(v[v.length - 1] as "edit" | "preview")}
        >
          <ToggleGroupItem value="edit"><Icon name="pencil" /> Edit</ToggleGroupItem>
          <ToggleGroupItem value="preview"><Icon name="eye" /> Preview</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex-1" />

        <span className="max-w-[220px] truncate text-sm text-base-content/55" title={doc.subject}>
          {doc.subject || "Untitled email"}
        </span>
        <SendTestButton studioTheme={studioTheme} onSendTest={onSendTest} />
        <Button color="primary" size="sm" onClick={exportHtml}>
          <Icon name="download" /> Export HTML
        </Button>
      </header>

      <div className={`grid flex-1 min-h-0 ${mode === "edit" ? "grid-cols-[240px_1fr_300px]" : "grid-cols-1"}`}>
        {mode === "edit" && (
          <aside className="flex flex-col min-h-0 bg-base-100 border-r border-base-300">
            <div className="flex items-center gap-1.5 h-10 flex-none px-3.5 border-b border-base-200 text-sm font-semibold">
              <Icon name="plus" /> Insert
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <EmailPalette />
            </div>
          </aside>
        )}

        <section className="flex flex-col min-w-0 min-h-0">
          <ErrorBoundary fallback={(error, reset) => <CanvasErrorFallback error={error} reset={reset} />}>
            {mode === "edit" ? <EmailCanvas device={device} /> : <EmailPreview device={device} />}
          </ErrorBoundary>
        </section>

        {mode === "edit" && (
          <aside className="flex flex-col min-h-0 bg-base-100 border-l border-base-300">
            <div className="flex items-center gap-1.5 h-10 flex-none px-3.5 border-b border-base-200 text-sm font-semibold">
              <Icon name="sliders" /> Design
            </div>
            <EmailInspector />
          </aside>
        )}
      </div>

      <footer className="flex items-center gap-2 h-7 flex-none px-3 border-t border-base-300 bg-base-100 text-xs text-base-content/55">
        <span className="capitalize">{device}</span>
        <span className="capitalize text-base-content/40">· {mode}</span>
        <span className="flex-1" />
        <span>{doc.root.width}px canvas</span>
      </footer>
    </>
  );
}

export interface EmailBuilderProps {
  document?: EmailDocument;
  studioTheme?: string;
  /**
   * A @wizeworks/silicaui brand `Theme` (the same shape the site builder edits) —
   * resolved to hex and used as the default colors for a fresh document AND for
   * every new Button/Text/Divider/Section a user inserts afterward, so emails
   * come out on-brand instead of a generic neutral gray. Purely a DEFAULT: any
   * color stays freely editable per-node once inserted. Omit it for the
   * built-in neutral palette.
   */
  theme?: Theme;
  /** Fires after every committed edit, with the whole document to persist. The
   *  builder stores nothing itself (beyond the local crash-recovery draft below)
   *  — the host owns real persistence. */
  onChange?: (doc: EmailDocument) => void;
  /** Fires (in addition to the built-in client-side download) when the user
   *  clicks Export HTML, with the projected HTML string. */
  onExport?: (html: string) => void;
  /**
   * Fires when the user sends a test email — the builder never sends mail
   * itself (no SMTP/ESP credentials, and shouldn't own that), so this hands
   * the host the recipient + the exact projected HTML + subject. May be async
   * (the dialog shows Sending…/Sent!/an error until it settles). Omit it and
   * the "Send test" button is disabled.
   */
  onSendTest?: (payload: { to: string; html: string; subject: string }) => void | Promise<void>;
  /**
   * Local crash-recovery. When set (the default), every edit is autosaved to a
   * durable LOCAL store (IndexedDB + a synchronous localStorage flush on unload)
   * under this key, and restored on the next load — so work survives a reload,
   * closed tab, or power cut even with no host backend. Pass `null` to disable.
   * Independent of `onChange`. Distinct default key from the site builder's, so
   * the two never collide in the same host page.
   */
  persistKey?: string | null;
}

const DEFAULT_PERSIST_KEY = "@wizeworks/silicaui-builder-email";

/** The full email builder. Mount it anywhere; it fills its host container. */
export function EmailBuilder({
  document,
  studioTheme = "studio",
  theme,
  onChange,
  onExport,
  onSendTest,
  persistKey = DEFAULT_PERSIST_KEY,
}: EmailBuilderProps) {
  const store = React.useMemo(() => (persistKey ? new DraftStore<EmailDocument>(persistKey) : null), [persistKey]);
  const docRef = React.useRef(document);
  const colorsRef = React.useRef(theme);
  // `gen` bumps on every editor swap (start-fresh) so the whole subtree remounts
  // — no stale canvas DOM (e.g. a contentEditable edit) survives a restore.
  const [current, setCurrent] = React.useState<
    { editor: EmailEditor; recoveredAt: number | null; gen: number } | null
  >(null);
  const editor = current?.editor ?? null;

  // Boot: restore a saved draft if one exists, else seed from the `document` prop.
  // `colorDefaults` seeds a FRESH document's colors; a restored draft already
  // has its own, but still needs the current theme resolved for FUTURE inserts.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const snap = store ? await store.load() : undefined;
      if (cancelled) return;
      const colors = resolveEmailColorDefaults(colorsRef.current);
      setCurrent({ editor: new EmailEditor(snap?.data ?? docRef.current, colors), recoveredAt: snap?.savedAt ?? null, gen: 0 });
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Autosave (local durable store) + relay edits to the host. A final flush runs
  // on tab-hide / pagehide / unmount so the very last edit always lands.
  React.useEffect(() => {
    if (!editor) return;
    const relay = () => {
      const doc = editor.extract();
      store?.save(doc);
      onChange?.(doc);
    };
    const unsub = editor.subscribe((e) => {
      if (e.kind !== "selection") relay();
    });
    const flush = () => store?.flush();
    window.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      unsub();
      window.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
      store?.flush();
    };
  }, [editor, store, onChange]);

  // "Start fresh" — discard the recovered draft and reseed from the prop document.
  const startFresh = React.useCallback(() => {
    void store?.clear();
    const colors = resolveEmailColorDefaults(colorsRef.current);
    setCurrent((c) => ({ editor: new EmailEditor(docRef.current, colors), recoveredAt: null, gen: (c?.gen ?? 0) + 1 }));
  }, [store]);

  const dismissBanner = React.useCallback(() => setCurrent((c) => (c ? { ...c, recoveredAt: null } : c)), []);

  if (!editor || !current) {
    return (
      <div className="grid h-full place-items-center bg-base-100 text-base-content" data-theme={studioTheme}>
        <Icon name="loading" />
      </div>
    );
  }

  return (
    <EmailEditorProvider key={current.gen} editor={editor}>
      <div className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased" data-theme={studioTheme}>
        <ErrorBoundary fallback={(error, reset) => <ChromeErrorFallback error={error} reset={reset} />}>
          {current.recoveredAt !== null && (
            <RecoveryBanner at={current.recoveredAt} onDismiss={dismissBanner} onStartFresh={startFresh} />
          )}
          <Chrome studioTheme={studioTheme} onExport={onExport} onSendTest={onSendTest} />
        </ErrorBoundary>
      </div>
    </EmailEditorProvider>
  );
}
