/**
 * The EmailBuilder shell — the embeddable email editor chrome, structurally a
 * peer of the site `Builder` (header + left rail + canvas + right rail) but
 * over the closed email schema: no Page/Layout/Component mode switch (an email
 * has no pages or symbols, and its `frame` is host-owned rather than an
 * editable surface — see the `frame` prop), no Theme mode (colors are per-node,
 * not a site-wide token set) — just Insert (left) + Canvas (center) + Design
 * (right).
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
import type { EmailFrame } from "../frame";
import { EmailEditorProvider, useEmailDocument, useEmailEditor, useEmailHistory } from "./editor-context";
import { EmailHostProvider, useEmailHost } from "./host-context";
import type { EmailBuilderHost } from "./host";
import { SavedBlocksProvider } from "./saved-blocks";
import type { SavedBlock, SavedBlockChange } from "./saved-blocks";
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
function downloadHtml(doc: EmailDocument, resolver?: EmailBuilderHost, frame?: EmailFrame): void {
  const html = toEmailHtml(doc, { resolver, frame });
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
  frame,
}: {
  studioTheme: string;
  onSendTest?: (payload: { to: string; html: string; subject: string }) => void | Promise<void>;
  frame?: EmailFrame;
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
      // Resolved through the SAME projector + host + frame as Export HTML
      // (Q25) — a test send shows exactly what a real recipient with real data
      // would get, chrome included.
      await onSendTest({ to, html: toEmailHtml(doc, { resolver: host, frame }), subject: doc.subject });
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
  toolbarStatusSlot,
  statusBarSlot,
  frame,
}: {
  studioTheme: string;
  onExport?: (html: string) => void;
  onSendTest?: (payload: { to: string; html: string; subject: string }) => void | Promise<void>;
  toolbarSlot?: React.ReactNode;
  toolbarStatusSlot?: React.ReactNode;
  statusBarSlot?: React.ReactNode;
  frame?: EmailFrame;
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
    downloadHtml(doc, host, frame);
    onExport?.(toEmailHtml(doc, { resolver: host, frame }));
  };

  return (
    <>
      <header className="flex items-center gap-2 h-12 flex-none px-3 bg-base-100 border-b border-base-300">
        {/* Same left-cluster order as the site builder's toolbar: the mode
            switcher leads (and carries `toggle-group-primary`, since it's the
            one control that changes what everything else means), then history,
            then canvas width. */}
        <ToggleGroup
          className="toggle-group-sm toggle-group-primary"
          aria-label="Edit or preview"
          value={[mode]}
          onValueChange={(v: string[]) => v.length && setMode(v[v.length - 1] as "edit" | "preview")}
        >
          <IconItem value="edit" icon="pencil">Edit</IconItem>
          <IconItem value="preview" icon="eye">Preview</IconItem>
        </ToggleGroup>

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

        <div className="flex-1" />

        {/* Host STATUS leads the right cluster, the same split the site builder
            makes: state about the session (a lock holder, a send window, an
            environment tag) sits off the end of the spacer with no control
            beside it, while `toolbarSlot` stays actions grouped with Send
            test/Export. */}
        {toolbarStatusSlot}

        {/* Subject and preview text are document fields, not toolbar controls:
            they live on the root's Settings tab (Inspector → Email → Settings →
            Content) where they're `TokenTextField`s with merge-token
            autocomplete. A second, token-less copy up here duplicated the field
            in its WORSE form and ate ~300px of a bar that also has to fit the
            host's own `toolbarSlot`. */}
        {toolbarSlot}
        <SendTestButton studioTheme={studioTheme} onSendTest={onSendTest} frame={frame} />
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
              <EmailCanvas device={device} frame={frame} />
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
            <EmailPreview device={device} frame={frame} />
          </ErrorBoundary>
        </section>
      )}

      {/* footer — the STATUS BAR, same contract as the site builder's: facts
          about the session (which width, edit-or-preview, the canvas width),
          never controls. */}
      <footer className="flex items-center gap-2 h-7 flex-none px-3 border-t border-base-300 bg-base-100 text-xs text-base-content">
        <span className="capitalize">{device}</span>
        <span className="capitalize">· {mode}</span>

        {/* Host STATE beside the engine's own, reading as one sentence about the
            session — a send window, a lock holder, saved/unsaved. Same split and
            same non-interactive contract as the site builder's `statusBarSlot`;
            `toolbarStatusSlot` is the header twin for whatever has to sit at eye
            level. */}
        {statusBarSlot}

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
  /**
   * Fixed host chrome composed AROUND the authored email — a brand bar above,
   * a legal footer below (see `EmailFrame`).
   *
   * It is NOT part of the document and never becomes part of it: it isn't
   * persisted, isn't in `onChange`, isn't on the undo stack, and the engine is
   * never told it exists. On the canvas it renders at full fidelity but inert —
   * no selection, no drag, no inline edit — so an author designs against the
   * real thing without being able to delete or reorder it. Preview, Export HTML
   * and Send test all project through it, via the same `composeEmailDocument`
   * a host should use in its own send path.
   *
   * Two guarantees follow from it living outside the document, and both are the
   * reason it isn't just a locked section:
   *   1. A compliance footer can't be removed, because there is no node to
   *      remove.
   *   2. The chrome always reflects the CURRENT brand — it's re-supplied on
   *      every mount and every send, never frozen into a six-month-old draft.
   *
   * Use `EmailNode.locked` instead for content that genuinely belongs to the
   * saved document but must not be deleted or moved.
   */
  frame?: EmailFrame;
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
   * The author's saved-block library (the Insert palette's "Saved" section),
   * host-owned. Supply it and the builder becomes CONTROLLED: it renders exactly
   * this array and writes nothing to browser storage, so the library can be an
   * account-level, server-backed one that follows a user across devices and can
   * be shared between them. Omit it (the default) and saved blocks stay in this
   * browser's `localStorage` — durable across reloads and documents, but not
   * across a device or user change.
   *
   * Controlled means controlled: pair it with `onSavedBlocksChange` and render
   * the result back down, exactly as with an `<input value>`. Supplying
   * `savedBlocks` without `onSavedBlocksChange` gives a read-only library — the
   * palette still inserts from it, but Save/rename/delete go nowhere.
   *
   * To adopt this without orphaning blocks an author already saved locally, call
   * `readLocalSavedBlocks()` once, upload what it returns, then
   * `clearLocalSavedBlocks()`.
   */
  savedBlocks?: readonly SavedBlock[];
  /**
   * Fires when the author saves, renames, or deletes a saved block — only in
   * controlled mode (with `savedBlocks` supplied).
   *
   *  - `next` — the resulting list. Apply it to your own state immediately to
   *    keep the palette responsive while the server call is in flight; the
   *    builder holds no copy of its own, so until the prop updates the palette
   *    still shows the previous list.
   *  - `change` — what the author actually DID, so a host can persist one row
   *    instead of diffing two arrays.
   *
   * A failed save needs no special handling: don't apply `next`, and the palette
   * simply never showed the block.
   */
  onSavedBlocksChange?: (next: SavedBlock[], change: SavedBlockChange) => void;
  /**
   * Host ACTIONS rendered in the header, immediately before the Send
   * test/Export HTML buttons — or (per the site `<Builder toolbarSlot>` this
   * mirrors) a host's own lifecycle strip (template switch/new/fork/publish)
   * that would otherwise have to render OUTSIDE the builder entirely, stacking
   * a second header above it.
   *
   * For non-interactive state — a save-status badge, a "last saved" timestamp,
   * a send window — use `toolbarStatusSlot`. The builder has no opinion on
   * either: it only knows about local edits, not whether the host's own
   * `onChange` persistence succeeded, failed, or is still in flight, so both
   * are empty by default.
   */
  toolbarSlot?: React.ReactNode;
  /**
   * Host STATUS rendered at the head of the header's right-hand cluster, before
   * `toolbarSlot`'s actions. Same split (and same reasoning) as the site
   * `<Builder toolbarStatusSlot>`: status and actions want different placement,
   * and one slot forces a host to render one of them in the wrong place.
   * Intended for non-interactive content, so it adds no tab stop.
   */
  toolbarStatusSlot?: React.ReactNode;
  /**
   * Host STATUS rendered in the STATUS BAR — the footer strip, after the engine's
   * own device/mode labels and before the spacer. Same content as
   * `toolbarStatusSlot`, one floor down, and usually the better home for it: the
   * footer carries only facts about the session, so state read there isn't
   * competing with a bar full of buttons. Mirrors the site
   * `<Builder statusBarSlot>` exactly.
   *
   * Non-interactive content only — the strip is 28px tall and the engine's own
   * children are plain text.
   */
  statusBarSlot?: React.ReactNode;
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
  frame,
  host,
  studioTheme = "studio",
  theme,
  onChange,
  onExport,
  onSendTest,
  persistKey = DEFAULT_PERSIST_KEY,
  savedBlocks,
  onSavedBlocksChange,
  toolbarSlot,
  toolbarStatusSlot,
  statusBarSlot,
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

  // Controlled saved blocks. `null` (no `savedBlocks` prop) leaves the browser-
  // local store live — the presence of the prop, not its emptiness, is what
  // hands the library to the host, so a host with an empty account library
  // correctly shows an empty Saved section rather than falling back to local.
  const savedBlocksController = React.useMemo(
    () => (savedBlocks ? { blocks: savedBlocks, onChange: onSavedBlocksChange } : null),
    [savedBlocks, onSavedBlocksChange],
  );

  if (!editor || !current) {
    return (
      <div className="grid h-full place-items-center bg-base-100 text-base-content" data-theme={studioTheme}>
        <Icon name="loading" />
      </div>
    );
  }

  return (
    <EmailHostProvider host={host}>
      <SavedBlocksProvider value={savedBlocksController}>
        <EmailEditorProvider key={current.gen} editor={editor}>
          <div className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased" data-theme={studioTheme}>
            <ErrorBoundary fallback={(error, reset) => <ChromeErrorFallback error={error} reset={reset} />}>
              {current.recoveredAt !== null && (
                <RecoveryBanner at={current.recoveredAt} onDismiss={dismissBanner} onStartFresh={startFresh} />
              )}
              <Chrome
                studioTheme={studioTheme}
                onExport={onExport}
                onSendTest={onSendTest}
                toolbarSlot={toolbarSlot}
                toolbarStatusSlot={toolbarStatusSlot}
                statusBarSlot={statusBarSlot}
                frame={frame}
              />
            </ErrorBoundary>
          </div>
        </EmailEditorProvider>
      </SavedBlocksProvider>
    </EmailHostProvider>
  );
});
