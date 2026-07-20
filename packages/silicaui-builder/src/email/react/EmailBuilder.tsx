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
  EmptyState,
} from "@wizeworks/silicaui-react";
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@wizeworks/silicaui-panels";
import type { Theme } from "@wizeworks/silicaui-html";
import { EmailEditor } from "../engine";
import type { HistoryDelegate } from "../engine";
import type { Op, OpMeta } from "../ops";
import type { EmailDocument, EmailProject } from "../schema";
import { toEmailHtml } from "../projector";
import { EmailEditorProvider, useEmailDocument, useEmailEditor, useEmailHistory } from "./editor-context";
import { EmailHostProvider, useEmailHost } from "./host-context";
import type { EmailBuilderHost } from "./host";
import { ErrorBoundary } from "../../shared/react/ErrorBoundary";
import { RecoveryBanner } from "../../shared/react/RecoveryBanner";
import { DraftStore } from "../../shared/persistence";
import { useEmailEditorShortcuts } from "./use-shortcuts";
import { resolveEmailColorDefaults } from "./theme-defaults";
import { EmailCanvas } from "./Canvas";
import { EmailPreview } from "./EmailPreview";
import { EmailPalette } from "./Palette";
import { EmailInspector } from "./Inspector";
import { Navigator } from "./Navigator";
import { TemplatesPanel } from "./TemplatesPanel";
import { Icon } from "../../shared/react/Icon";
import { IconItem, PanelHead } from "../../shared/react/chrome";

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
 *  wiring; `onExport` (if given) additionally hands the host the same string.
 *  With a `resolver` (the host's `resolveBinding`/`resolveCollection`), the
 *  downloaded file carries real data too, same as the host's own copy — the
 *  Q25 "one projector" guarantee applies to every export path, not just the
 *  callback. */
function downloadHtml(doc: EmailDocument, resolver?: EmailBuilderHost): void {
  const html = toEmailHtml(doc, resolver);
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
  const host = useEmailHost();
  const [open, setOpen] = React.useState(false);
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async () => {
    if (!onSendTest || !EMAIL_RE.test(to)) return;
    setStatus("sending");
    try {
      // Resolved through the SAME projector + host as Export HTML (Q25) — a
      // test send shows exactly what a real recipient with real data would get.
      await onSendTest({ to, html: toEmailHtml(doc, host), subject: doc.subject });
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
  toolbarSlot,
}: {
  studioTheme: string;
  onExport?: (html: string) => void;
  onSendTest?: (payload: { to: string; html: string; subject: string }) => void | Promise<void>;
  toolbarSlot?: React.ReactNode;
}) {
  const editor = useEmailEditor();
  const doc = useEmailDocument();
  const host = useEmailHost();
  const { canUndo, canRedo } = useEmailHistory();
  const [device, setDevice] = React.useState("desktop");
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const [leftTab, setLeftTab] = React.useState<"layers" | "insert">("layers");

  useEmailEditorShortcuts();

  const exportHtml = () => {
    downloadHtml(doc, host);
    onExport?.(toEmailHtml(doc, host));
  };

  return (
    <>
      <header className="flex items-center gap-2 h-12 flex-none px-3 bg-base-100 border-b border-base-300">
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
          <IconItem value="desktop" icon="monitor">Desktop</IconItem>
          <IconItem value="mobile" icon="smartphone">Mobile</IconItem>
        </ToggleGroup>

        <ToggleGroup
          className="toggle-group-sm"
          aria-label="Edit or preview"
          value={[mode]}
          onValueChange={(v: string[]) => v.length && setMode(v[v.length - 1] as "edit" | "preview")}
        >
          <IconItem value="edit" icon="pencil">Edit</IconItem>
          <IconItem value="preview" icon="eye">Preview</IconItem>
        </ToggleGroup>

        <div className="flex-1" />

        {/* Subject/preview text live here (not just buried in the Settings
            tab) since every ESP treats them as the two things you set first —
            keyed on their own current value so a template switch or an undo
            refreshes the field without fighting the user's typing. */}
        <Input
          key={doc.subject}
          size="sm"
          className="w-36"
          placeholder="Subject"
          aria-label="Email subject"
          defaultValue={doc.subject}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => editor.setSubject(e.target.value)}
        />
        <Input
          key={doc.preheader}
          size="sm"
          className="w-36"
          placeholder="Preview text"
          aria-label="Email preview text"
          defaultValue={doc.preheader}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => editor.setPreheader(e.target.value)}
        />
        {toolbarSlot}
        <SendTestButton studioTheme={studioTheme} onSendTest={onSendTest} />
        <Button color="primary" size="sm" onClick={exportHtml}>
          <Icon name="download" /> Export HTML
        </Button>
      </header>

      {/* A resizable 3-pane layout in Edit mode — same widths persist locally
          per-browser via `autoSaveId`, same mechanism as the site builder.
          Preview mode drops the rails entirely (nothing to resize). */}
      {mode === "edit" ? (
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="silicaui-builder-email-rails"
          className="flex-1 min-h-0"
          style={{ border: "none", borderRadius: 0, backgroundColor: "transparent" }}
        >
          <ResizablePanel
            defaultSize={16}
            minSize={12}
            maxSize={30}
            className="flex flex-col min-h-0 overflow-hidden bg-base-100 border-r border-base-300"
          >
            {/* Templates sit above Layers/Insert — a navigation peer to the tree,
                same placement as the site builder's Pages switcher. */}
            <TemplatesPanel studioTheme={studioTheme} />
            <PanelHead>
              <ToggleGroup
                className="toggle-group-xs w-full"
                aria-label="Left panel"
                value={[leftTab]}
                onValueChange={(v: string[]) => v.length && setLeftTab(v[v.length - 1] as "layers" | "insert")}
              >
                <IconItem value="layers" icon="list" className="flex-1">Layers</IconItem>
                <IconItem value="insert" icon="plus" className="flex-1">Insert</IconItem>
              </ToggleGroup>
            </PanelHead>
            <div className="flex-1 min-h-0 overflow-auto">
              {leftTab === "layers" ? <Navigator /> : <EmailPalette />}
            </div>
          </ResizablePanel>
          <ResizeHandle />

          <ResizablePanel defaultSize={64} minSize={30} className="flex flex-col min-w-0 min-h-0 overflow-hidden">
            <ErrorBoundary fallback={(error, reset) => <CanvasErrorFallback error={error} reset={reset} />}>
              <EmailCanvas device={device} />
            </ErrorBoundary>
          </ResizablePanel>
          <ResizeHandle />

          <ResizablePanel
            defaultSize={20}
            minSize={14}
            maxSize={32}
            className="flex flex-col min-h-0 overflow-hidden bg-base-100 border-l border-base-300"
          >
            <PanelHead>
              <Icon name="sliders" /> Design
            </PanelHead>
            <EmailInspector />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <section className="flex flex-col min-w-0 min-h-0 flex-1">
          <ErrorBoundary fallback={(error, reset) => <CanvasErrorFallback error={error} reset={reset} />}>
            <EmailPreview device={device} />
          </ErrorBoundary>
        </section>
      )}

      <footer className="flex items-center gap-2 h-7 flex-none px-3 border-t border-base-300 bg-base-100 text-xs text-base-content/55">
        <span className="capitalize">{device}</span>
        <span className="capitalize text-base-content/40">· {mode}</span>
        <span className="flex-1" />
        <span>{doc.root.width}px canvas</span>
        <a
          href="https://silicaui.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold tracking-tight text-base-content/55 hover:text-base-content"
        >
          <span className="size-3 rounded-sm bg-linear-to-br from-primary to-secondary" />
          silicaui
        </a>
      </footer>
    </>
  );
}

export interface EmailBuilderProps {
  /**
   * Seeds a single-template project (back-compat with a builder that predates
   * multi-template support). Ignored if `project` is also given.
   */
  document?: EmailDocument;
  /**
   * Seeds the FULL multi-template project — the shape a host should actually
   * persist and hand back on the next mount, since `onChange` below hands back
   * the whole project too (an email builder can hold more than one template,
   * the same way the site builder holds more than one page). Takes precedence
   * over `document` when both are given.
   */
  project?: EmailProject;
  /**
   * The domain-specific seam (builder-contract.md §5) — the email twin of the
   * site `<Builder host={...}>` prop. Every field optional; a static/
   * marketing-only host omits it entirely and nothing here changes. See
   * `email/react/host.ts` for the full interface (`resolveBinding`/
   * `resolveCollection` for bound content, `catalog()` for host-added blocks,
   * `dataSources()` for a real binding picker, `inspectorPanels()` for
   * host-contributed panels like a merge-tag picker).
   */
  host?: EmailBuilderHost;
  studioTheme?: string;
  /**
   * A @wizeworks/silicaui brand `Theme` (the same shape the site builder edits) —
   * resolved to hex and used as the default colors for a fresh document, for
   * every new Button/Text/Divider/Section a user inserts, AND live: unlike
   * most props here (read once at mount), this one is re-read on every
   * change, so an email open in one tab picks up a theme edited in another
   * (whatever the host uses to deliver that — sync it in, the builder just
   * needs the new `Theme` object as a prop). Only fields still on their
   * default repaint — the moment someone picks a custom color for a field it
   * freezes, so a live theme update never clobbers a deliberate choice.
   * There's no `[data-theme]`/CSS-custom-property mechanism in email HTML
   * (Outlook/Gmail don't support it), so this is the only path theme changes
   * reach an email at all. Omit `theme` for the built-in neutral palette.
   */
  theme?: Theme;
  /**
   * Fires after every committed edit. The builder stores nothing itself (beyond
   * the local crash-recovery draft below) — the host owns real persistence.
   *
   *  - `project` — the WHOLE project (every template, not just the active one),
   *    as before. Storing it verbatim is correct for a single author and lossy
   *    for two: both hold a complete project, so the last writer silently
   *    reverts the other's work on templates they never opened.
   *  - `ops` — what the author actually DID, in causal order (see `Op`).
   *    Applying these instead lets two authors edit one project without erasing
   *    each other. Never empty when this fires.
   *  - `meta.baseSeq` — the sequence number this client last had applied.
   *
   * The extra arguments are additive: a host that ignores them behaves exactly
   * as it did before.
   */
  onChange?: (project: EmailProject, ops: readonly Op[], meta: OpMeta) => void;
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
  /**
   * Arbitrary host UI rendered in the header, immediately before the Send
   * test/Export HTML buttons — e.g. a save-status badge, a "last saved"
   * timestamp, or (per the site `<Builder toolbarSlot>` this mirrors) a
   * host's own lifecycle strip (template switch/new/fork/publish) that would
   * otherwise have to render OUTSIDE the builder entirely, stacking a second
   * header above it. The builder has no opinion on save/publish status: it
   * only knows about local edits, not whether the host's own `onChange`
   * persistence succeeded, failed, or is still in flight, so it renders
   * nothing here by default.
   */
  toolbarSlot?: React.ReactNode;
}

const DEFAULT_PERSIST_KEY = "@wizeworks/silicaui-builder-email";

/**
 * The imperative handle a host uses to push state INTO a live email builder —
 * the other half of the `onChange(project, ops, meta)` contract. A ref rather
 * than a prop, because the seed document is read once at boot by design.
 */
export interface EmailBuilderHandle {
  /** Render another author's edits in place. Never lands on the local undo
   *  stack and never echoes back out of `onChange`. */
  applyRemoteOps(ops: readonly Op[]): { applied: number; dropped: Op[] };
  /** Forced resync: replace the project wholesale at `seq`, discarding local
   *  undo/redo (it describes a lineage that no longer applies). */
  replaceState(project: EmailProject, seq: number): void;
  /** Record the sequence number the host assigned to our last batch. */
  ackSeq(seq: number): void;
  /** Hand undo/redo to the host for a collaborative session; `undefined`
   *  restores the local stack. */
  setHistoryDelegate(delegate: HistoryDelegate | undefined): void;
}

/** The full email builder. Mount it anywhere; it fills its host container. */
export const EmailBuilder = React.forwardRef<EmailBuilderHandle, EmailBuilderProps>(function EmailBuilder({
  document,
  project,
  host,
  studioTheme = "studio",
  theme,
  onChange,
  onExport,
  onSendTest,
  persistKey = DEFAULT_PERSIST_KEY,
  toolbarSlot,
}: EmailBuilderProps, handleRef) {
  const store = React.useMemo(() => (persistKey ? new DraftStore<EmailProject>(persistKey) : null), [persistKey]);
  // `project` takes precedence over the legacy single-template `document`.
  const seedRef = React.useRef(project ?? document);
  // Boot-only: the theme at construction time. `theme` itself stays live in
  // scope below for the reactive effect and `startFresh` — only the INITIAL
  // resolve needs a ref (there's no editor yet to push a live update into).
  const initialThemeRef = React.useRef(theme);
  // `gen` bumps on every editor swap (start-fresh) so the whole subtree remounts
  // — no stale canvas DOM (e.g. a contentEditable edit) survives a restore.
  const [current, setCurrent] = React.useState<
    { editor: EmailEditor; recoveredAt: number | null; gen: number } | null
  >(null);
  const editor = current?.editor ?? null;

  // The handle is stable across editor swaps (restore, "start fresh"), so a host
  // that captured it at mount keeps a working reference. It reads the CURRENT
  // editor through a ref rather than closing over one.
  const editorRef = React.useRef<EmailEditor | null>(null);
  editorRef.current = editor;
  React.useImperativeHandle<EmailBuilderHandle, EmailBuilderHandle>(
    handleRef,
    () => ({
      applyRemoteOps: (ops) => editorRef.current?.applyRemoteOps(ops) ?? { applied: 0, dropped: [...ops] },
      replaceState: (proj, seq) => editorRef.current?.replaceState(proj, seq),
      ackSeq: (seq) => editorRef.current?.ackSeq(seq),
      setHistoryDelegate: (delegate) => editorRef.current?.setHistoryDelegate(delegate),
    }),
    [],
  );

  // Boot: restore a saved draft if one exists, else seed from the `project`/
  // `document` prop. `colorDefaults` seeds a FRESH document's colors; a
  // restored draft already has its own, but still needs the current theme
  // resolved for FUTURE inserts.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const snap = store ? await store.load() : undefined;
      if (cancelled) return;
      const colors = resolveEmailColorDefaults(initialThemeRef.current);
      setCurrent({ editor: new EmailEditor(snap?.data ?? seedRef.current, colors), recoveredAt: snap?.savedAt ?? null, gen: 0 });
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Live theme inheritance: whenever the host hands us an updated `theme`
  // (a new object — could be the SAME brand theme re-fetched, or a real
  // edit), re-resolve and repaint every node still tracking its default.
  // `setColorDefaults` itself no-ops when the resolved hex is unchanged, so
  // this is cheap even though it re-runs on every `theme` prop identity change.
  React.useEffect(() => {
    if (!editor) return;
    editor.setColorDefaults(resolveEmailColorDefaults(theme));
  }, [editor, theme]);

  // Autosave (local durable store) + relay edits to the host. A final flush runs
  // on tab-hide / pagehide / unmount so the very last edit always lands. The
  // WHOLE project is relayed (every template), not just the active one — a
  // template switch alone doesn't relay (no edit happened), but any commit
  // afterward captures the full current roster.
  React.useEffect(() => {
    if (!editor) return;
    // An action that recorded no ops changed no stored state, so there is
    // nothing to save or relay. A stronger test than a kind allowlist — derived
    // from what actually changed rather than a list someone must remember to
    // update, and it holds the engine to the rule that no mutation is silent.
    const unsub = editor.subscribe((e) => {
      if (!e.ops.length) return;
      const proj = editor.extractProject();
      store?.save(proj);
      onChange?.(proj, e.ops, { baseSeq: editor.baseSeq });
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

  // "Start fresh" — discard the recovered draft and reseed from the prop project/document.
  const startFresh = React.useCallback(() => {
    void store?.clear();
    const colors = resolveEmailColorDefaults(theme);
    setCurrent((c) => ({ editor: new EmailEditor(seedRef.current, colors), recoveredAt: null, gen: (c?.gen ?? 0) + 1 }));
  }, [store, theme]);

  const dismissBanner = React.useCallback(() => setCurrent((c) => (c ? { ...c, recoveredAt: null } : c)), []);

  if (!editor || !current) {
    return (
      <div className="grid h-full place-items-center bg-base-100 text-base-content" data-theme={studioTheme}>
        <Icon name="loading" />
      </div>
    );
  }

  return (
    <EmailHostProvider host={host}>
      <EmailEditorProvider key={current.gen} editor={editor}>
        <div className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased" data-theme={studioTheme}>
          <ErrorBoundary fallback={(error, reset) => <ChromeErrorFallback error={error} reset={reset} />}>
            {current.recoveredAt !== null && (
              <RecoveryBanner at={current.recoveredAt} onDismiss={dismissBanner} onStartFresh={startFresh} />
            )}
            <Chrome studioTheme={studioTheme} onExport={onExport} onSendTest={onSendTest} toolbarSlot={toolbarSlot} />
          </ErrorBoundary>
        </div>
      </EmailEditorProvider>
    </EmailHostProvider>
  );
});
