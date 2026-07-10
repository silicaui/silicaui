/**
 * The Builder shell — the embeddable editor chrome.
 *
 * STYLING RULE (hard): every visual is a Tailwind utility or a @wizeworks/silicaui component
 * class, and every glyph is a baked `<Icon>`. There is NO bespoke `.sui-*`
 * stylesheet. @wizeworks/silicaui is a Tailwind v4 plugin, so the chrome IS @wizeworks/silicaui —
 * surfaces (`bg-base-100`, `border-base-300`), text (`text-base-content`), accents
 * (`text-primary`), and real @wizeworks/silicaui-react components carry their own classes. The
 * shell is its own `[data-theme="studio"]` island, isolated from the host page and
 * from the canvas/board document theme.
 */
import * as React from "react";
import type { Document as SuiDocument, RenderedPage, Site } from "@wizeworks/silicaui-html";
import { renderSite } from "@wizeworks/silicaui-html";
import { Button, ToggleGroup, ToggleGroupItem, Kbd, EmptyState } from "@wizeworks/silicaui-react";
import { Editor } from "../engine";
import type { PageMeta } from "../engine";
import { DraftStore } from "../../shared/persistence";
import { EditorProvider, StudioThemeProvider, useEditingSymbol, useEditor, useHistory, usePages } from "./editor-context";
import { HostProvider } from "./host-context";
import type { BuilderHost } from "./host";
import { ErrorBoundary } from "../../shared/react/ErrorBoundary";
import { RecoveryBanner } from "../../shared/react/RecoveryBanner";
import { useEditorShortcuts } from "./use-shortcuts";
import { ThemeEditor } from "./ThemeEditor";
import { ComponentBoard } from "./ComponentBoard";
import { ThemeLibrary } from "./ThemeLibrary";
import { Canvas } from "./Canvas";
import { PagesPanel } from "./PagesPanel";
import { ComponentsPanel } from "./ComponentsPanel";
import { NewComponentButton } from "./ComponentStarterDialog";
import { Navigator } from "./Navigator";
import { Palette } from "./Palette";
import { Inspector } from "./Inspector";
import { Icon } from "../../shared/react/Icon";
import type { IconName } from "../../shared/icons";

type Mode = "page" | "layout" | "component" | "theme";
type Appearance = "light" | "dark";

/** Recoverable canvas fallback — a bad node/atom threw while rendering. Offers to
 *  undo the offending edit (then remounts the canvas), so the whole builder stays
 *  usable. Rails + header keep working since only the canvas is wrapped. */
function CanvasErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const editor = useEditor();
  const { canUndo } = useHistory();
  return (
    <div className="grid flex-1 min-h-0 place-items-center bg-base-200 p-8">
      <EmptyState
        icon={<Icon name="warning" />}
        title="Couldn't render the canvas"
        description={error.message || "An element failed to render."}
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

/** Top-level backstop — if the chrome itself throws, show a themed message rather
 *  than a blank screen. Rendered inside the studio theme island, so it's styled. */
function ChromeErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid h-full place-items-center bg-base-100 p-8 text-base-content">
      <EmptyState
        icon={<Icon name="warning" />}
        title="The builder hit an error"
        description={error.message || "Something went wrong."}
        actions={<Button size="sm" color="primary" onClick={reset}>Reload editor</Button>}
      />
    </div>
  );
}

const last = (vals: string[], fallback: string): string => vals[vals.length - 1] ?? fallback;

/** Toggle item with a leading icon — a flex row so icon + label align. */
function IconItem({ value, icon: name, children }: { value: string; icon: IconName; children: React.ReactNode }) {
  return (
    <ToggleGroupItem value={value}>
      <span className="inline-flex items-center gap-1.5">
        <Icon name={name} /> {children}
      </span>
    </ToggleGroupItem>
  );
}

/** A panel header bar (left/right rails). */
function PanelHead({ children, theme }: { children: React.ReactNode; theme?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 h-10 flex-none px-3.5 border-b border-base-200 text-sm font-semibold ${
        theme ? "bg-linear-to-r from-primary/12 to-transparent" : ""
      }`}
    >
      {children}
    </div>
  );
}

function Chrome({
  onPublish,
  toolbarSlot,
}: {
  onPublish?: (payload: PublishPayload) => void | Promise<void>;
  toolbarSlot?: React.ReactNode;
}) {
  const editor = useEditor();
  const { canUndo, canRedo } = useHistory();
  const { activeId } = usePages();
  const editingSymbol = useEditingSymbol();
  const [mode, setMode] = React.useState<Mode>("page");
  const [device, setDevice] = React.useState("desktop");
  const [appearance, setAppearance] = React.useState<Appearance>("light");
  const [leftTab, setLeftTab] = React.useState<"layers" | "insert">("layers");
  const [publishing, setPublishing] = React.useState(false);

  // Publish = hand the host the whole site: the structured `Site` (to store +
  // re-open) AND every page composed to production HTML (to deploy). The builder
  // stores nothing itself — the host owns persistence (backend-agnostic).
  const publish = async () => {
    if (!onPublish || publishing) return;
    setPublishing(true);
    try {
      const site = editor.extractSite();
      await onPublish({ site, pages: renderSite(site) });
    } finally {
      setPublishing(false);
    }
  };

  // Table-stakes keys (delete / undo-redo / duplicate / copy-paste / deselect),
  // off in Theme mode where there's no node selection.
  useEditorShortcuts(mode !== "theme");

  // Page ↔ Layout ↔ Component retargets the whole editing spine at the page body,
  // the site frame, or a component master. Done synchronously here (not in an
  // effect) so the active tree is already switched by the time the rails re-render.
  // Theme mode edits tokens, not nodes, so it leaves the active tree alone.
  const changeMode = (next: Mode) => {
    setMode(next);
    if (next === "page") editor.setActiveTree("page");
    else if (next === "layout") editor.setActiveTree("frame");
    else if (next === "component") {
      // Land in an editor: keep the open component, else open the first one. With
      // none, the canvas shows the "create a component" empty state.
      if (!editor.editingSymbol && editor.symbols[0]) editor.enterSymbol(editor.symbols[0].id);
    }
  };

  // "Edit component" (from an instance's Inspector or a palette row) opens a master
  // via the engine directly — pull the chrome into Component mode to match, so the
  // mode toggle + rails always reflect what's actually being edited.
  React.useEffect(() => {
    if (editingSymbol && mode !== "component" && mode !== "theme") setMode("component");
  }, [editingSymbol, mode]);

  return (
    <>
      {/* header */}
      <header className="flex items-center gap-2 h-12 flex-none px-3 bg-base-100 border-b border-base-300">
        <div className="flex items-center gap-2 font-semibold tracking-tight mr-1">
          <span className="size-4 rounded-md bg-linear-to-br from-primary to-secondary" />
          @wizeworks/silicaui <span className="text-base-content/45 font-medium">builder</span>
        </div>

        <ToggleGroup
          className="toggle-group-sm toggle-group-primary"
          aria-label="Editor mode"
          value={[mode]}
          onValueChange={(v: string[]) => v.length && changeMode(last(v, mode) as Mode)}
        >
          {/* Widest scope → narrowest: whole-site theme, shared layout, one page,
              one reusable component. */}
          <IconItem value="theme" icon="theme">Theme</IconItem>
          <IconItem value="layout" icon="layout">Layout</IconItem>
          <IconItem value="page" icon="page">Page</IconItem>
          <IconItem value="component" icon="box">Component</IconItem>
        </ToggleGroup>

        <Button variant="ghost" size="sm" aria-label="Undo" disabled={!canUndo} onClick={() => editor.undo()}>
          <Icon name="undo" />
        </Button>
        <Button variant="ghost" size="sm" aria-label="Redo" disabled={!canRedo} onClick={() => editor.redo()}>
          <Icon name="redo" />
        </Button>

        {mode !== "theme" && (
          <ToggleGroup
            className="toggle-group-sm"
            aria-label="Canvas device width"
            value={[device]}
            onValueChange={(v: string[]) => v.length && setDevice(last(v, device))}
          >
            <IconItem value="desktop" icon="monitor">Desktop</IconItem>
            <IconItem value="tablet" icon="tablet">Tablet</IconItem>
            <IconItem value="mobile" icon="smartphone">Mobile</IconItem>
          </ToggleGroup>
        )}

        <div className="flex-1" />

        <Kbd size="sm">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="command" /> /
          </span>
        </Kbd>
        <ToggleGroup
          className="toggle-group-sm"
          aria-label="Appearance"
          value={[appearance]}
          onValueChange={(v: string[]) => {
            if (!v.length) return;
            const next = last(v, appearance) as Appearance;
            setAppearance(next);
            editor.setThemeMode(next);
          }}
        >
          <IconItem value="light" icon="sun">Light</IconItem>
          <IconItem value="dark" icon="moon">Dark</IconItem>
        </ToggleGroup>
        {toolbarSlot}
        <Button color="primary" size="sm" disabled={!onPublish || publishing} onClick={publish}>
          {publishing ? "Publishing…" : "Publish"}
        </Button>
      </header>

      {/* body */}
      <div className="grid flex-1 min-h-0 grid-cols-[264px_1fr_320px]">
        {/* left */}
        <aside className="flex flex-col min-h-0 bg-base-100 border-r border-base-300">
          {mode === "theme" ? (
            <>
              <PanelHead theme>
                <Icon name="theme" /> Theme editor
                <span className="ml-auto font-medium text-base-content/45">whole site</span>
              </PanelHead>
              <div className="flex-1 min-h-0 overflow-auto">
                <ThemeEditor />
              </div>
            </>
          ) : mode === "component" ? (
            <>
              {/* The component library sits above Layers/Insert; the tree tools show
                  only once a component is open (there's a master to edit). */}
              <ComponentsPanel />
              {editingSymbol && (
                <>
                  <PanelHead>
                    <ToggleGroup
                      className="toggle-group-xs"
                      aria-label="Left panel"
                      value={[leftTab]}
                      onValueChange={(v: string[]) => v.length && setLeftTab(last(v, leftTab) as "layers" | "insert")}
                    >
                      <IconItem value="layers" icon="list">Layers</IconItem>
                      <IconItem value="insert" icon="plus">Insert</IconItem>
                    </ToggleGroup>
                  </PanelHead>
                  <div className="flex-1 min-h-0 overflow-auto py-1.5 text-sm">
                    {leftTab === "layers" ? <Navigator key={`component:${editingSymbol.id}`} /> : <Palette />}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Pages sit above Layers/Insert — a navigation peer to the tree. */}
              <PagesPanel />
              <PanelHead>
                <ToggleGroup
                  className="toggle-group-xs"
                  aria-label="Left panel"
                  value={[leftTab]}
                  onValueChange={(v: string[]) => v.length && setLeftTab(last(v, leftTab) as "layers" | "insert")}
                >
                  <IconItem value="layers" icon="list">Layers</IconItem>
                  <IconItem value="insert" icon="plus">Insert</IconItem>
                </ToggleGroup>
              </PanelHead>
              <div className="flex-1 min-h-0 overflow-auto py-1.5 text-sm">
                {/* Remount the Navigator on a Page/Layout switch AND on a page
                    switch so its expanded set reseeds for the tree now in view. */}
                {leftTab === "layers" ? <Navigator key={`${mode}:${activeId}`} /> : <Palette />}
              </div>
            </>
          )}
        </aside>

        {/* center */}
        <section className="flex flex-col min-w-0 min-h-0">
          {mode === "theme" ? (
            <ComponentBoard />
          ) : mode === "component" && !editingSymbol ? (
            <div className="grid flex-1 min-h-0 place-items-center bg-base-200 p-8">
              <EmptyState
                icon={<Icon name="box" />}
                title="No component open"
                description="Pick a component on the left, create a new one, or select an element on a page and save it as a component."
                actions={
                  <NewComponentButton
                    trigger={
                      <Button size="sm" color="primary">
                        <Icon name="plus" /> New component
                      </Button>
                    }
                  />
                }
              />
            </div>
          ) : (
            <ErrorBoundary fallback={(error, reset) => <CanvasErrorFallback error={error} reset={reset} />}>
              <Canvas device={device} />
            </ErrorBoundary>
          )}
        </section>

        {/* right */}
        <aside className="flex flex-col min-h-0 bg-base-100 border-l border-base-300">
          {mode === "theme" ? (
            <>
              <PanelHead theme>Themes</PanelHead>
              <div className="flex-1 min-h-0 overflow-auto">
                <ThemeLibrary />
              </div>
            </>
          ) : (
            <>
              <PanelHead>
                <Icon name="sliders" /> Design
              </PanelHead>
              <div className="flex flex-col flex-1 min-h-0">
                <Inspector />
              </div>
            </>
          )}
        </aside>
      </div>

      {/* footer */}
      <footer className="flex items-center gap-2 h-7 flex-none px-3 border-t border-base-300 bg-base-100 text-xs text-base-content/55">
        <span className="text-primary font-semibold capitalize">{mode}</span>
        <span className="flex-1" />
        <span className="capitalize">{device}</span>
      </footer>
    </>
  );
}

/** What the host receives on Publish: the structured site to STORE, and every
 *  page composed to production HTML to DEPLOY. The builder persists neither. */
export interface PublishPayload {
  site: Site;
  pages: RenderedPage[];
}

export interface BuilderProps {
  /** A single page (`Document`) or a whole multi-page site (`Site`) — the `Editor`
   *  accepts either natively, so hosts that already have a `Site` on hand don't
   *  need to cast or wrap it. */
  document: SuiDocument | Site;
  studioTheme?: string;
  /**
   * The domain-specific seam (builder-contract.md §5) — everything about what a
   * binding means, what the palette/inspector offer beyond the defaults, and the
   * class-string policy. Every field is optional; omit it entirely for a
   * static-site builder off the default catalog. Read once at mount / at each
   * "start fresh" reseed (same lifecycle as `document`), not re-read live.
   */
  host?: BuilderHost;
  /**
   * Fires after every edit that changes stored state (theme, structure, text,
   * pages…), with the whole `Site` to persist. View-only changes — selection,
   * page/mode switches, the local theme library — don't fire. The host debounces
   * + stores; the builder owns no backend.
   */
  onChange?: (site: Site) => void;
  /**
   * Fires on mount and whenever the ACTIVE page's identity changes — a page
   * switch, or a rename/slug edit of the page currently open — with that page's
   * `{id, name, slug}`. This is a UI-focus signal, not a persistence hook: it's
   * how a host keys its own page-scoped side panel (e.g. an SEO/metadata drawer
   * rendered in `toolbarSlot`) to whichever page the author is looking at. Page
   * domain data itself doesn't belong on `Page` (deliberately flat — see
   * builder-contract.md) — the host already gets the full page roster via
   * `onChange` and owns its own metadata storage keyed by page id.
   */
  onActivePageChange?: (page: PageMeta) => void;
  /**
   * Fires when the user clicks Publish, with the site + rendered HTML per page.
   * May be async (the button shows a pending state until it settles). Omit it and
   * the Publish button is disabled.
   */
  onPublish?: (payload: PublishPayload) => void | Promise<void>;
  /**
   * Local crash-recovery. When set (the default), every edit is autosaved to a
   * durable LOCAL store (IndexedDB + a synchronous localStorage flush on unload)
   * under this key, and restored on the next load — so work survives a reload,
   * closed tab, or power cut even with no host backend. Pass `null` to disable
   * (e.g. a host that is fully server-authoritative). Independent of `onChange`.
   */
  persistKey?: string | null;
  /**
   * Arbitrary host UI rendered in the header, immediately before the Publish
   * button — e.g. a save-status badge, a "last saved" timestamp, an environment
   * tag. The builder has no opinion on save/publish status: it only knows about
   * local edits, not whether the host's own `onChange` persistence succeeded,
   * failed, or is still in flight, so it renders nothing here by default.
   */
  toolbarSlot?: React.ReactNode;
}

const DEFAULT_PERSIST_KEY = "@wizeworks/silicaui-builder";

/** The full builder. Mount it anywhere; it fills its host container. */
export function Builder({
  document,
  studioTheme = "studio",
  host,
  onChange,
  onActivePageChange,
  onPublish,
  persistKey = DEFAULT_PERSIST_KEY,
  toolbarSlot,
}: BuilderProps) {
  const store = React.useMemo(() => (persistKey ? new DraftStore<Site>(persistKey) : null), [persistKey]);
  const docRef = React.useRef(document);
  // Seeded once, same lifecycle as `docRef` — a policy change mid-session takes
  // effect on the next "start fresh" / boot, not live (matches BuilderProps.host's doc).
  const hostRef = React.useRef(host);
  // The editor is created only after we've checked storage, so a recovered draft
  // seeds it directly (no editor-swap flash). `gen` bumps on every editor swap so
  // the whole subtree remounts — no stale canvas DOM (e.g. a contentEditable edit)
  // survives a restore / start-fresh. `recoveredAt` drives the banner.
  const [current, setCurrent] = React.useState<{ editor: Editor; recoveredAt: number | null; gen: number } | null>(
    null,
  );
  const editor = current?.editor ?? null;

  // Boot: restore a saved draft if one exists, else seed from the `document` prop.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const snap = store ? await store.load() : undefined;
      if (cancelled) return;
      setCurrent({
        editor: new Editor(snap?.data ?? docRef.current, { validateClass: hostRef.current?.validateClass }),
        recoveredAt: snap?.savedAt ?? null,
        gen: 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Autosave (local durable store) + relay stored-state edits to the host. Selection
  // / active page-or-tree switches and the saved-theme library are view concerns
  // that don't alter the extracted Site, so they're filtered out. A final flush runs
  // on tab-hide / pagehide / unmount so the very last edit always lands.
  React.useEffect(() => {
    if (!editor) return;
    const relay = () => {
      const site = editor.extractSite();
      store?.save(site);
      onChange?.(site);
    };
    const unsub = editor.subscribe((e) => {
      if (e.kind !== "selection" && e.kind !== "active" && e.kind !== "library") relay();
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

  // Notify the host of the ACTIVE page's identity — mount + every switch/rename —
  // so it can key its own page-scoped UI (e.g. a `toolbarSlot` settings drawer)
  // without a new mutation API or any `Page` schema change. Deduped against the
  // last-sent value so an unrelated page's rename ("page" fires for any page)
  // doesn't trigger a spurious callback.
  React.useEffect(() => {
    if (!editor || !onActivePageChange) return;
    let last: PageMeta | null = null;
    const notify = () => {
      const { pages, activeId } = editor.pagesView;
      const page = pages.find((p) => p.id === activeId) ?? pages[0];
      if (!page) return;
      if (last && last.id === page.id && last.name === page.name && last.slug === page.slug) return;
      last = page;
      onActivePageChange(page);
    };
    notify();
    return editor.subscribe((e) => {
      if (e.kind === "active" || e.kind === "page") notify();
    });
  }, [editor, onActivePageChange]);

  // "Start fresh" — discard the recovered draft and reseed from the prop document.
  // Bumping `gen` remounts the subtree so no stale canvas DOM carries over.
  const startFresh = React.useCallback(() => {
    void store?.clear();
    setCurrent((c) => ({
      editor: new Editor(docRef.current, { validateClass: hostRef.current?.validateClass }),
      recoveredAt: null,
      gen: (c?.gen ?? 0) + 1,
    }));
  }, [store]);

  const dismissBanner = React.useCallback(() => setCurrent((c) => (c ? { ...c, recoveredAt: null } : c)), []);

  if (!editor || !current) {
    return (
      <div
        className="grid h-full place-items-center bg-base-100 text-base-content"
        data-theme={studioTheme}
      >
        <Icon name="loading" />
      </div>
    );
  }

  return (
    <HostProvider host={host}>
      <EditorProvider key={current.gen} editor={editor}>
        <StudioThemeProvider value={studioTheme}>
          <div
            className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased"
            data-theme={studioTheme}
          >
            <ErrorBoundary fallback={(error, reset) => <ChromeErrorFallback error={error} reset={reset} />}>
              {current.recoveredAt !== null && (
                <RecoveryBanner at={current.recoveredAt} onDismiss={dismissBanner} onStartFresh={startFresh} />
              )}
              <Chrome onPublish={onPublish} toolbarSlot={toolbarSlot} />
            </ErrorBoundary>
          </div>
        </StudioThemeProvider>
      </EditorProvider>
    </HostProvider>
  );
}
