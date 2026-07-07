/**
 * The Builder shell — the embeddable editor chrome.
 *
 * STYLING RULE (hard): every visual is a Tailwind utility or a silicaui component
 * class, and every glyph is a baked `<Icon>`. There is NO bespoke `.sui-*`
 * stylesheet. silicaui is a Tailwind v4 plugin, so the chrome IS silicaui —
 * surfaces (`bg-base-100`, `border-base-300`), text (`text-base-content`), accents
 * (`text-primary`), and real silicaui-react components carry their own classes. The
 * shell is its own `[data-theme="studio"]` island, isolated from the host page and
 * from the canvas/board document theme.
 */
import * as React from "react";
import type { Document as SuiDocument, RenderedPage, Site } from "silicaui-html";
import { renderSite } from "silicaui-html";
import { Button, ToggleGroup, ToggleGroupItem, Kbd, EmptyState } from "silicaui-react";
import { Editor } from "../engine";
import { EditorProvider, StudioThemeProvider, useEditor, useHistory, usePages } from "./editor-context";
import { ErrorBoundary } from "./ErrorBoundary";
import { useEditorShortcuts } from "./use-shortcuts";
import { ThemeEditor } from "./ThemeEditor";
import { ComponentBoard } from "./ComponentBoard";
import { ThemeLibrary } from "./ThemeLibrary";
import { Canvas } from "./Canvas";
import { PagesPanel } from "./PagesPanel";
import { Navigator } from "./Navigator";
import { Palette } from "./Palette";
import { Inspector } from "./Inspector";
import { Icon } from "./Icon";
import type { IconName } from "../icons";

type Mode = "page" | "layout" | "theme";
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

function Chrome({ onPublish }: { onPublish?: (payload: PublishPayload) => void | Promise<void> }) {
  const editor = useEditor();
  const { canUndo, canRedo } = useHistory();
  const { activeId } = usePages();
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

  // Page ↔ Layout retargets the whole editing spine at the page body vs the site
  // frame. Done synchronously here (not in an effect) so the active tree is already
  // switched by the time the rails re-render — otherwise the Navigator would seed
  // its expansion from the old tree. Theme mode edits tokens, not nodes, so it
  // leaves the active tree alone.
  const changeMode = (next: Mode) => {
    setMode(next);
    if (next !== "theme") editor.setActiveTree(next === "layout" ? "frame" : "page");
  };

  return (
    <>
      {/* header */}
      <header className="flex items-center gap-2 h-12 flex-none px-3 bg-base-100 border-b border-base-300">
        <div className="flex items-center gap-2 font-semibold tracking-tight mr-1">
          <span className="size-4 rounded-md bg-linear-to-br from-primary to-secondary" />
          silicaui <span className="text-base-content/45 font-medium">builder</span>
        </div>

        <ToggleGroup
          className="toggle-group-sm"
          aria-label="Editor mode"
          value={[mode]}
          onValueChange={(v: string[]) => v.length && changeMode(last(v, mode) as Mode)}
        >
          <IconItem value="page" icon="page">Page</IconItem>
          <IconItem value="layout" icon="layout">Layout</IconItem>
          <IconItem value="theme" icon="theme">Theme</IconItem>
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
  document: SuiDocument;
  studioTheme?: string;
  /**
   * Fires after every edit that changes stored state (theme, structure, text,
   * pages…), with the whole `Site` to persist. View-only changes — selection,
   * page/mode switches, the local theme library — don't fire. The host debounces
   * + stores; the builder owns no backend.
   */
  onChange?: (site: Site) => void;
  /**
   * Fires when the user clicks Publish, with the site + rendered HTML per page.
   * May be async (the button shows a pending state until it settles). Omit it and
   * the Publish button is disabled.
   */
  onPublish?: (payload: PublishPayload) => void | Promise<void>;
}

/** The full builder. Mount it anywhere; it fills its host container. */
export function Builder({ document, studioTheme = "studio", onChange, onPublish }: BuilderProps) {
  const [editor] = React.useState(() => new Editor(document));

  // Persist-on-change: relay stored-state edits to the host. Selection / active
  // page-or-tree switches and the saved-theme library are view concerns that
  // don't alter the extracted Site, so they're filtered out (no redundant saves).
  React.useEffect(() => {
    if (!onChange) return;
    return editor.subscribe((e) => {
      if (e.kind !== "selection" && e.kind !== "active" && e.kind !== "library") {
        onChange(editor.extractSite());
      }
    });
  }, [editor, onChange]);

  return (
    <EditorProvider editor={editor}>
      <StudioThemeProvider value={studioTheme}>
        <div
          className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased"
          data-theme={studioTheme}
        >
          <ErrorBoundary fallback={(error, reset) => <ChromeErrorFallback error={error} reset={reset} />}>
            <Chrome onPublish={onPublish} />
          </ErrorBoundary>
        </div>
      </StudioThemeProvider>
    </EditorProvider>
  );
}
