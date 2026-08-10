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
import { Button, ToggleGroup, Kbd, EmptyState, ImperativeAlertDialogProvider } from "@wizeworks/silicaui-react";
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@wizeworks/silicaui-panels";
import { Editor } from "../engine";
import type { HistoryDelegate, PageMeta, Peer } from "../engine";
import type { Op, OpMeta } from "../ops";
import { DraftStore } from "../../shared/persistence";
import { EditorProvider, StudioThemeProvider, useActiveTree, useEditingSymbol, useEditor, useHistory, usePages, useTheme } from "./editor-context";
import { HostProvider, useHost } from "./host-context";
import type { BuilderHost } from "./host";
import { ErrorBoundary } from "../../shared/react/ErrorBoundary";
import { RecoveryBanner } from "../../shared/react/RecoveryBanner";
import { useEditorShortcuts } from "./use-shortcuts";
import { ThemeEditor } from "./ThemeEditor";
import { ComponentBoard } from "./ComponentBoard";
import { ThemeLibrary } from "./ThemeLibrary";
import { Canvas } from "./Canvas";
import { PagesPanel } from "./PagesPanel";
import { LayoutsPanel } from "./LayoutsPanel";
import { ComponentsPanel } from "./ComponentsPanel";
import { NewComponentButton } from "./ComponentStarterDialog";
import { Navigator } from "./Navigator";
import { Palette } from "./Palette";
import { Inspector } from "./Inspector";
import { BreakpointProvider } from "./breakpoint-context";
import { useThemeWebfonts } from "./google-fonts-loader";
import { Icon } from "../../shared/react/Icon";
import { IconItem, PanelHead, PanelTabs } from "../../shared/react/chrome";
import type { PanelTabSpec } from "../../shared/react/chrome";
import { BuilderTooltipProvider, Hint, IconButton } from "../../shared/react/Hint";
import type { LayerDepth } from "../layer-tree";

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
              <Hint label="Roll back the edit that broke the canvas, then re-render">
                <Button size="sm" color="primary" onClick={() => { editor.undo(); reset(); }}>
                  Undo last change
                </Button>
              </Hint>
            )}
            <Hint label="Re-render without changing anything — your work is untouched">
              <Button size="sm" variant="outline" onClick={reset}>Try again</Button>
            </Hint>
          </>
        }
      />
    </div>
  );
}

/**
 * How much of the layer tree to list. Simple (the default) hides the layout-only
 * wrappers that make a document read like markup; pressed shows the full
 * structure — progressive disclosure over one tree, never a second panel.
 *
 * IT IS ONE ICON OFF THE END OF THE LAYERS/INSERT TAB STRIP, not a bar. It used to be a
 * full-width `Simple | Detailed` pill group on its own row, and that was wrong
 * twice over. It spent a whole 40px band of a rail whose only scarce resource is
 * vertical space, on a control most people set once; and two labelled halves
 * directly under the Layers/Insert tabs read as a SECOND navigation decision,
 * when this is a filter applied TO the tree those tabs already chose. Folding it
 * into the header says so structurally: it sits with the tab it modifies, and
 * costs nothing.
 *
 * The accessible name is fixed and the state is `aria-pressed` — a toggle whose
 * LABEL flips is a control that changes identity under a screen reader, and you
 * can never tell whether the words describe the current state or the next one.
 * The tooltip's `hint` line carries the plain-English version of both states.
 */
function LayerDepthToggle({ value, onChange }: { value: LayerDepth; onChange: (v: LayerDepth) => void }) {
  const detailed = value === "all";
  return (
    <IconButton
      icon="code"
      label="Show layout wrappers"
      hint={detailed ? "Showing every layer — click for the simple tree" : "Show every layer, including layout wrappers"}
      // Sits in the rail's 40px header; a top-side tooltip would cover the tab
      // strip this filter applies to.
      side="bottom"
      // A real component state, not a hand-mixed tint: ghost when off, and the
      // `soft` primary the rest of the chrome uses for "this filter is armed".
      variant={detailed ? "soft" : "ghost"}
      color={detailed ? "primary" : undefined}
      className="flex-none"
      aria-pressed={detailed}
      data-testid="layer-depth"
      onClick={() => onChange(detailed ? "simple" : "all")}
    />
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
        actions={
          <Hint label="Rebuild the chrome — your document and undo history survive">
            <Button size="sm" color="primary" onClick={reset}>Reload editor</Button>
          </Hint>
        }
      />
    </div>
  );
}

const last = (vals: string[], fallback: string): string => vals[vals.length - 1] ?? fallback;

function Chrome({
  onPublish,
  toolbarSlot,
  toolbarStatusSlot,
  statusBarSlot,
  dataToggle,
  initialMode,
  onModeChange,
}: {
  onPublish?: (payload: PublishPayload) => void | Promise<void>;
  toolbarSlot?: React.ReactNode;
  toolbarStatusSlot?: React.ReactNode;
  statusBarSlot?: React.ReactNode;
  dataToggle: boolean;
  initialMode: Mode;
  onModeChange?: (mode: Mode) => void;
}) {
  const editor = useEditor();
  const { canUndo, canRedo } = useHistory();
  const { activeId } = usePages();
  const editingSymbol = useEditingSymbol();
  const activeTree = useActiveTree();
  // Fetch whatever webfonts the ACTIVE theme names, however that theme arrived —
  // preset, saved theme, pasted CSS, host prop, restore, undo, remote op, or the
  // picker. Mounted here (the one root inside EditorProvider) so the canvas and
  // the component board can never render a font the page never fetched.
  const documentTheme = useTheme();
  useThemeWebfonts(documentTheme);
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [device, setDevice] = React.useState("desktop");
  const [appearance, setAppearance] = React.useState<Appearance>("light");
  // Canvas shows the host's REAL data, not authored placeholders. Default on —
  // "preview your real brand" is the whole point of a binding; off is the
  // escape hatch back to the placeholder that ships when data is absent.
  const [dataPreview, setDataPreview] = React.useState(true);
  const host = useHost();
  const resolvesData = Boolean(host?.resolveBinding || host?.resolveCollection);
  const [leftTab, setLeftTab] = React.useState<"layers" | "insert">("layers");
  // How much of the tree the Navigator lists. Lives HERE, not in the Navigator:
  // the Navigator is remounted on every page/mode switch, so component-local
  // state would silently reset the author's choice. A viewing preference — it
  // never enters the document.
  const [layerDepth, setLayerDepth] = React.useState<LayerDepth>("simple");
  const [publishing, setPublishing] = React.useState(false);

  // Component mode with no master open has no tree to list and nothing to insert
  // INTO, so Insert isn't offered — and if it was the open tab when the author
  // closed the component, the rail falls back to Layers rather than showing a
  // dead panel. (Theme mode has no node rails at all.)
  const showTree = mode !== "component" || Boolean(editingSymbol);
  const leftTabs: PanelTabSpec[] = showTree
    ? [{ id: "layers", label: "Layers", icon: "list" }, { id: "insert", label: "Insert", icon: "plus" }]
    : [{ id: "layers", label: "Layers", icon: "list" }];
  const activeLeftTab = leftTabs.some((t) => t.id === leftTab) ? leftTab : "layers";

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

  // …and the same for the OTHER tree a host can retarget the spine at directly:
  // `editor.setActiveTree("frame")` (how a host jumps to a finding in the header
  // or footer — selection is tree-scoped, so it has to switch the tree before it
  // can select a frame node at all). The mode has to FOLLOW, or the chrome lies:
  // the toggle still says Page, the left rail still lists Pages, and the
  // Navigator — keyed `${mode}:${activeId}` — isn't remounted, so it keeps the
  // page tree's expanded set and the newly-selected node can have no visible row.
  //
  // Keyed off a CHANGE of tree rather than the (tree, mode) pair, because the
  // pair is legitimately mismatched when the MODE moved and the tree didn't:
  // Component mode with no symbol yet ("create a component") leaves the tree on
  // the page body on purpose, and a pair test would yank the author straight
  // back out of it.
  //
  // Theme mode is exempt for the same reason `changeMode` leaves the tree alone
  // there: it edits tokens, so being in it is not a claim about any tree and
  // there is nothing stale on screen to correct — unlike Page mode, which
  // asserts you are looking at a page body. (A host's "jump to this node" while
  // the Theme editor is open therefore retargets the spine without moving the
  // author; nothing shows until they leave Theme.)
  const lastTree = React.useRef(activeTree);
  React.useEffect(() => {
    const prev = lastTree.current;
    lastTree.current = activeTree;
    if (activeTree === prev || mode === "theme") return;
    // "symbol" is already covered by the `editingSymbol` effect above.
    if (activeTree === "frame" && mode !== "layout") setMode("layout");
    else if (activeTree === "page" && mode !== "page") setMode("page");
  }, [activeTree, mode]);

  // `initialMode` names where the author LANDS, so it has to retarget the editing
  // spine once at mount — the same work `changeMode` does on a click. Without
  // this, opening on Layout would show the Layout chrome over the page tree.
  //
  // Mount-only on purpose: this is an INITIAL mode, not a controlled one. A prop
  // that re-applied on every parent render would yank the author back to it
  // mid-edit, which is the bug the same shape causes in `document`.
  const started = React.useRef(false);
  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (initialMode === "layout") editor.setActiveTree("frame");
    else if (initialMode === "component" && !editor.editingSymbol && editor.symbols[0]) {
      editor.enterSymbol(editor.symbols[0].id);
    }
  }, [editor, initialMode]);

  // Report the mode OUT, however it changed — a toolbar click, or the automatic
  // switch into Component mode above. A host mirrors this into its own URL so a
  // reload (or a shared link) comes back to the surface the author was on, which
  // is the whole reason `initialMode` exists.
  React.useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  return (
    // The device toggle is also the AUTHORING BREAKPOINT — the semantic
    // Inspector controls write the container variant that matches the width on
    // screen. One control, so "what I'm looking at" and "what I'm editing" can
    // never drift apart. See `breakpoint-context`.
    <BreakpointProvider device={device}>
      {/* header */}
      <header className="flex items-center gap-2 h-12 flex-none px-3 bg-base-100 border-b border-base-300">
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

        <IconButton
          icon="undo"
          label="Undo"
          shortcut="⌘Z"
          size="sm"
          shape={undefined}
          disabled={!canUndo}
          onClick={() => editor.undo()}
        />
        <IconButton
          icon="redo"
          label="Redo"
          shortcut="⇧⌘Z"
          size="sm"
          shape={undefined}
          disabled={!canRedo}
          onClick={() => editor.redo()}
        />

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

        {/* Data on/off — only when the host actually resolves something, else
            it's a dead control. ON by default: seeing real content is the point
            of binding. OFF is the escape hatch — the authored PLACEHOLDER is
            what ships when data is absent, so an author has to be able to see
            and edit it (and to work when a host's resolver is wrong or slow). */}
        {mode !== "theme" && resolvesData && dataToggle && (
          <IconButton
            icon={dataPreview ? "database" : "eyeOff"}
            // The NAME is fixed and the state rides on `aria-pressed` — a toggle
            // whose label flips changes identity under a screen reader, and you
            // can never tell whether the words describe the current state or the
            // next one. The `hint` carries the plain-English version of both.
            label="Preview data"
            hint={
              dataPreview
                ? "Showing the host's real data — click for the authored placeholders"
                : "Showing authored placeholders — click for the host's real data"
            }
            size="sm"
            shape={undefined}
            aria-pressed={dataPreview}
            data-testid="data-preview-toggle"
            className={dataPreview ? "btn-active" : undefined}
            onClick={() => setDataPreview((v) => !v)}
          />
        )}

        <div className="flex-1" />

        {/* STATUS, not actions. A host has two kinds of header chrome and they
            want different places: state ABOUT the session (who else is editing,
            saved/unsaved, an environment tag) reads wrong wedged between the
            engine's controls and the host's own buttons — it looks like a gap in
            a run of controls. So it lands here, at the head of the right cluster
            and off the end of the spacer, where nothing on either side of it is
            a control. `toolbarSlot` below stays what it was: actions, grouped
            with Publish.

            This is a real slot rather than something a host can reach with CSS
            `order` — the header is one flex container, so `order` only sorts
            against the WHOLE set (before the mode switcher, or after Publish);
            there is no value that lands mid-container. And moving a control
            visually without moving it in the DOM desyncs focus order from
            reading order (WCAG 2.4.3), which is exactly what a host would have
            to do to fake this. */}
        {toolbarStatusSlot}

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
        {/* Labelled, so the tooltip adds the CONSEQUENCE rather than repeating
            the word — and, when the host wired no `onPublish`, says why it's
            dead instead of leaving a greyed button with no explanation. */}
        <Hint
          label={
            !onPublish
              ? "Publishing isn't available here — this editor's host hasn't wired it up"
              : "Push every page live"
          }

        >
          <span className="inline-flex">
            <Button color="primary" size="sm" disabled={!onPublish || publishing} onClick={publish}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </span>
        </Hint>
      </header>

      {/* body — a resizable 3-pane layout (deep trees need the room); widths
          persist locally per-browser via `autoSaveId`, independent of the
          document itself. */}
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="silicaui-builder-site-rails"
        className="flex-1 min-h-0"
        style={{ border: "none", borderRadius: 0, backgroundColor: "transparent" }}
      >
        {/* left */}
        <ResizablePanel
          defaultSize={18}
          minSize={12}
          maxSize={32}
          className="flex flex-col min-h-0 overflow-hidden bg-base-100 border-r border-base-300"
        >
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
            /* Layers / Insert ARE this rail's header — the same first-class
               underline strip the Inspector uses on the right, not a pill group
               under a separate title bar. They are the two PAGES of the rail, and
               the switcher above them (Pages, Layouts, Components) belongs to the
               Layers page: it chooses which tree the layers show, so it is a
               child of that tab rather than a fixture that outranks both. */
            <PanelTabs
              tabs={leftTabs}
              value={activeLeftTab}
              onValueChange={(id) => setLeftTab(id as "layers" | "insert")}
              ariaLabel="Left panel"
              testIdPrefix="left-tab"
              actions={activeLeftTab === "layers" && showTree
                ? <LayerDepthToggle value={layerDepth} onChange={setLayerDepth} />
                : undefined}
            >
              {activeLeftTab === "layers" ? (
                <>
                  {mode === "component" ? <ComponentsPanel /> : mode === "layout" ? <LayoutsPanel /> : <PagesPanel />}
                  {/* Remount the Navigator on a Page/Layout/Component switch AND on
                      a page switch so its expanded set reseeds for the tree now in
                      view. In Component mode with nothing open there is no master
                      to list — the picker above is the whole panel. */}
                  {showTree && (
                    <div className="flex-1 min-h-0 overflow-auto py-1.5 text-sm">
                      <Navigator
                        key={mode === "component" ? `component:${editingSymbol!.id}` : `${mode}:${activeId}`}
                        depth={layerDepth}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 min-h-0 overflow-auto py-1.5 text-sm">
                  <Palette />
                </div>
              )}
            </PanelTabs>
          )}
        </ResizablePanel>
        <ResizeHandle />

        {/* center */}
        <ResizablePanel defaultSize={62} minSize={30} className="flex flex-col min-w-0 min-h-0 overflow-hidden">
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
              <Canvas device={device} dataPreview={dataPreview} />
            </ErrorBoundary>
          )}
        </ResizablePanel>
        <ResizeHandle />

        {/* right */}
        <ResizablePanel
          defaultSize={20}
          minSize={16}
          maxSize={34}
          className="flex flex-col min-h-0 overflow-hidden bg-base-100 border-l border-base-300"
        >
          {mode === "theme" ? (
            <>
              <PanelHead theme>Themes</PanelHead>
              <div className="flex-1 min-h-0 overflow-auto">
                <ThemeLibrary />
              </div>
            </>
          ) : (
            /* No `PanelHead` here on purpose: the Inspector's tab strip IS this
               rail's header. A fixed "Design" bar above it repeated the first
               tab's name and then went stale the moment you opened another. */
            <Inspector />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* footer — the STATUS BAR. Everything in it is a fact about the session
          (which surface, which width), never a control; that's why `mode` and
          `device` read here rather than beside the toggles that set them. A fact
          may DISCLOSE its own detail (see `statusBarSlot` / `StatusItem`); what
          it may not do is act. */}
      <footer className="flex items-center gap-2 h-7 flex-none px-3 border-t border-base-300 bg-base-100 text-xs text-base-content">
        <span className="text-primary font-semibold capitalize">{mode}</span>

        {/* Host STATE, next to the engine's own, reading left to right as one
            sentence about the session — a presence count, saved-but-not-live, a
            lock holder. The header's `toolbarStatusSlot` is the same kind of
            content one floor up, for a host that wants it at eye level; this is
            where status BELONGS, and the engine's own two children are the
            argument.
            Unreachable for a host otherwise — `<footer>` is engine-owned, so the
            alternatives are a second status bar stacked below `<Builder>` or a
            portal into our markup at a computed index (breaking the first time
            these children change). */}
        {statusBarSlot}

        <span className="flex-1" />
        <span className="capitalize">{device}</span>
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
    </BreakpointProvider>
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
   * pages, the site's saved-theme library…). View-only changes — selection,
   * page/mode switches — don't fire. The host debounces + stores; the builder
   * owns no backend.
   *
   * Three arguments, and which one you use decides your concurrency story:
   *
   *  - `site` — the whole document, as before. Storing it verbatim is correct
   *    for a single author and lossy for two: both hold a complete `Site`, so
   *    the last writer silently reverts the other's work on pages they never
   *    opened.
   *  - `ops` — what the author actually DID, in causal order, as semantic
   *    operations (see `Op`). Applying these instead lets two authors edit one
   *    site without erasing each other. Never empty when this fires.
   *  - `meta.baseSeq` — the sequence number this client last had applied, so a
   *    host can tell whether it was behind when it produced these ops and send
   *    back whatever it missed (via `applyRemoteOps`).
   *
   * The extra arguments are additive: a host that ignores them behaves exactly
   * as it did before.
   */
  onChange?: (site: Site, ops: readonly Op[], meta: OpMeta) => void;
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
   * Host ACTIONS rendered in the header, immediately before the Publish button —
   * a preview link, a page-settings drawer trigger, a pre-publish check, Save.
   * Grouped with Publish on purpose: actions want a stable neighbourhood a user
   * can build muscle memory for.
   *
   * For non-interactive state — a presence pill, saved/unsaved, an environment
   * tag — use `toolbarStatusSlot` instead. The builder has no opinion on either:
   * it knows about local edits, not whether the host's own `onChange`
   * persistence succeeded, failed, or is still in flight, so both are empty by
   * default.
   */
  toolbarSlot?: React.ReactNode;
  /**
   * Host STATUS rendered in the header, at the head of the right-hand cluster —
   * before the shortcut hint and the light/dark toggle, after the spacer that
   * ends the engine's own left-hand controls.
   *
   * Separate from `toolbarSlot` because status and actions are different kinds
   * of thing with different placement rules: status describes the session and
   * belongs somewhere it reads as state, actions belong grouped with other
   * actions. One slot forces a host to render one of them in the wrong place —
   * status wedged between the engine's buttons and the host's own reads as a gap
   * in a run of controls, not as state.
   *
   * Intended for non-interactive content, which is also why it costs nothing in
   * focus order: put a control here and it becomes a tab stop ahead of the theme
   * toggle, which is the same reading-order-vs-focus-order break (WCAG 2.4.3) a
   * host would cause faking this position with CSS `order`.
   */
  toolbarStatusSlot?: React.ReactNode;
  /**
   * Host STATUS rendered in the STATUS BAR — the footer strip, immediately after
   * the mode label and before the spacer, so a host's state reads left to right
   * as one sentence with the engine's own.
   *
   * The same content as `toolbarStatusSlot`, one floor down, and usually the
   * better home for it: the footer already carries exactly this kind of fact
   * (which surface you're on, which device width you're looking at) and nothing
   * else, so state read there isn't competing with a bar full of buttons. Use the
   * header slot for the one or two things that must be at eye level, this for the
   * rest — or this alone.
   *
   * Facts, not controls — but a fact MAY be a disclosure for its own detail.
   * Clicking "3 broken" to see which three is reading the same fact at more
   * depth, not a second action, and it is what every status bar in every IDE
   * does; the strip stops being a status bar the moment the number and the list
   * are two floors apart. What stays out is anything that ACTS — send, save,
   * publish, navigate away — which belongs in `toolbarSlot` beside Publish,
   * where a person looks for actions. `StatusItem` is that affordance in one
   * component: a `<span>` with no `onClick`, a ghost `btn-xs` (24px inside the
   * 28px strip, so the row height never moves) with one.
   *
   * A host can't reach this position any other way — `<footer>` is
   * engine-owned, and the alternatives are a second status bar stacked under
   * `<Builder>` or a portal into our markup at a computed index, which breaks
   * silently the first time the footer's children change.
   */
  statusBarSlot?: React.ReactNode;
  /**
   * The other people in this document, from whatever presence channel the host
   * already runs. Pass the full roster on every change; the engine diffs it.
   *
   * ```tsx
   * <Builder peers={[{ id: sock, name: 'Ana', selection: [nodeId], claim: [nodeId] }]} />
   * ```
   *
   * Two effects, and they are deliberately separable:
   *
   *  - `selection` is DRAWN — a named ring on the canvas and a marker in the
   *    Navigator. Pass it alone and the editor gains attribution and nothing
   *    else: co-editing already works, but two authors on one page watch a
   *    heading rewrite itself under the cursor with nothing on screen connecting
   *    that to a name in the toolbar.
   *  - `claim` is ENFORCED — the local editor greys that subtree, names the
   *    holder, and refuses to mutate anything inside it, while everything around
   *    it stays editable.
   *
   * A claim is advisory and the host owns its lifetime: start one on focus, end
   * it on blur or a timeout. It is not `setLocked` and not correctness
   * machinery — per-node last-write-wins, the op log and draft history already
   * keep the document right. It exists to stop two people making a mess they
   * then have to untangle by hand. Nothing is relayed and nothing lands on the
   * undo stack, so a claim can never be why a remote op was dropped.
   *
   * The engine has the same thing imperatively (`editor.setPeers`), which is
   * what this prop calls; use whichever matches how presence reaches you.
   */
  peers?: readonly Peer[];
  /**
   * Whether to show the canvas data on/off toggle. Defaults to true. A host whose
   * authors are non-technical can hide it: the control's effect is invisible on a
   * tree with no bindings, so it reads as a dead button to everyone who isn't
   * debugging a resolver.
   */
  dataToggle?: boolean;
  /**
   * Which editing surface the author LANDS on — Page (the default), Layout (the
   * shared frame), Component (a symbol master), or Theme.
   *
   * Initial, not controlled: it seeds the mode at mount and is never re-read, so
   * a parent re-render can't yank the author out of the surface they're working
   * in. Pair it with `onModeChange` to round-trip through a host's own URL.
   */
  initialMode?: "page" | "layout" | "component" | "theme";
  /**
   * Fires whenever the editing surface changes — a toolbar click, or the
   * automatic switch into Component mode when something opens a symbol master.
   * A view signal, like `onActivePageChange`: it changes no stored state, so it
   * is NOT a persistence hook.
   */
  onModeChange?: (mode: "page" | "layout" | "component" | "theme") => void;
}

const DEFAULT_PERSIST_KEY = "@wizeworks/silicaui-builder";

/**
 * The imperative handle a host uses to push state INTO a live builder — the
 * other half of the `onChange(site, ops, meta)` contract.
 *
 * It exists as a ref rather than a prop because `document` is read once at boot
 * by design (a prop that re-seeded the editor would blow away in-flight edits on
 * every parent render). These are explicit, host-timed calls.
 */
export interface BuilderHandle {
  /**
   * Render another author's edits in place, without a reload. Never lands on
   * the local undo stack and never echoes back out of `onChange`. Returns what
   * was applied and what was dropped — a drop means the op's subject was
   * already gone, which is benign under concurrency but worth surfacing.
   */
  applyRemoteOps(ops: readonly Op[]): { applied: number; dropped: Op[] };
  /**
   * Forced resync: replace the document wholesale at sequence `seq`, discarding
   * local undo/redo history (it describes a lineage that no longer applies).
   *
   * This is also the answer to the local-draft-vs-server question: let the
   * builder boot from its crash-recovery draft for instant paint, then call
   * this once the server's authoritative state arrives. The draft only ever
   * wins for that first moment. Note that it discards local edits made while
   * disconnected, which is what "server authoritative" means.
   */
  replaceState(site: Site, seq: number): void;
  /** Record the sequence number the host assigned to our last batch of ops;
   *  it rides out as `meta.baseSeq` on the next one. */
  ackSeq(seq: number): void;
  /**
   * Hand undo/redo to the host, for a collaborative session. A local undo stack
   * in a shared editor reverts other people's work; pass a delegate and the
   * toolbar drives the host's authoritative history instead. Pass `undefined`
   * to restore the local stack (correct for a single author).
   */
  setHistoryDelegate(delegate: HistoryDelegate | undefined): void;
}

/** The full builder. Mount it anywhere; it fills its host container. */
export const Builder = React.forwardRef<BuilderHandle, BuilderProps>(function Builder({
  document,
  studioTheme = "studio",
  host,
  onChange,
  onActivePageChange,
  onPublish,
  persistKey = DEFAULT_PERSIST_KEY,
  toolbarSlot,
  toolbarStatusSlot,
  statusBarSlot,
  peers,
  dataToggle = true,
  initialMode = "page",
  onModeChange,
}: BuilderProps, handleRef) {
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

  // The handle is stable across editor swaps (restore, "start fresh"), so a host
  // that captured it at mount keeps a working reference. It reads the CURRENT
  // editor through a ref rather than closing over one.
  const editorRef = React.useRef<Editor | null>(null);
  editorRef.current = editor;
  React.useImperativeHandle<BuilderHandle, BuilderHandle>(
    handleRef,
    () => ({
      applyRemoteOps: (ops) => editorRef.current?.applyRemoteOps(ops) ?? { applied: 0, dropped: [...ops] },
      replaceState: (site, seq) => editorRef.current?.replaceState(site, seq),
      ackSeq: (seq) => editorRef.current?.ackSeq(seq),
      setHistoryDelegate: (delegate) => editorRef.current?.setHistoryDelegate(delegate),
    }),
    [],
  );

  // Presence, pushed into the engine so the canvas can draw it and the mutation
  // path can refuse a claimed subtree. Runs on every editor swap as well as
  // every roster change: a restore mints a NEW editor, and one that didn't know
  // who else was here would let the author edit straight into someone's claim.
  // `setPeers` diffs by content, so a heartbeat carrying no news is free.
  React.useEffect(() => {
    editor?.setPeers(peers ?? []);
  }, [editor, peers]);

  // Boot: restore a saved draft if one exists, else seed from the `document` prop.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const snap = store ? await store.load() : undefined;
      if (cancelled) return;
      setCurrent({
        editor: new Editor(snap?.data ?? docRef.current, { validateClass: hostRef.current?.validateClass, viewportVariants: hostRef.current?.viewportVariants }),
        recoveredAt: snap?.savedAt ?? null,
        gen: 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Autosave (local durable store) + relay stored-state edits to the host. Selection
  // and active page-or-tree switches are view concerns that don't alter the
  // extracted Site, so they're filtered out — the saved-theme library ("library")
  // DOES relay, since `site.savedThemes` is real site data now. A final flush runs
  // on tab-hide / pagehide / unmount so the very last edit always lands.
  React.useEffect(() => {
    if (!editor) return;
    // An action that recorded no ops changed no stored state, so there is
    // nothing to save or relay. That's a stronger test than a kind allowlist —
    // it's derived from what actually changed rather than from a list someone
    // has to remember to update, and it holds the engine to the rule that no
    // mutation is silent.
    const unsub = editor.subscribe((e) => {
      if (!e.ops.length) return;
      const site = editor.extractSite();
      store?.save(site);
      onChange?.(site, e.ops, { baseSeq: editor.baseSeq });
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
    // `kinds`, not `kind` — `createComponent` batches ["symbols", "active"], and
    // the stronger "symbols" would hide the "active" this listener exists for.
    return editor.subscribe((e) => {
      if (e.kinds.includes("active") || e.kinds.includes("page")) notify();
    });
  }, [editor, onActivePageChange]);

  // "Start fresh" — discard the recovered draft and reseed from the prop document.
  // Bumping `gen` remounts the subtree so no stale canvas DOM carries over.
  const startFresh = React.useCallback(() => {
    void store?.clear();
    setCurrent((c) => ({
      editor: new Editor(docRef.current, { validateClass: hostRef.current?.validateClass, viewportVariants: hostRef.current?.viewportVariants }),
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
          {/* The singleton confirm dialog every destructive control in the chrome
              awaits. Mounted here, at the one root inside the theme island, so a
              confirm can be raised from any panel without each one owning dialog
              state — and `popupProps` re-stamps the studio theme because the popup
              portals to document.body, outside the island (same fix PagesPanel's
              Select and ComponentStarterDialog's Dialog use). */}
          <ImperativeAlertDialogProvider popupProps={{ "data-theme": studioTheme }}>
            {/* One shared hover delay for the whole chrome, so running along a
                toolbar of icons shows each label instantly instead of
                re-waiting per button. */}
            <BuilderTooltipProvider>
            <div
              className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased"
              data-theme={studioTheme}
            >
              <ErrorBoundary fallback={(error, reset) => <ChromeErrorFallback error={error} reset={reset} />}>
                {current.recoveredAt !== null && (
                  <RecoveryBanner at={current.recoveredAt} onDismiss={dismissBanner} onStartFresh={startFresh} />
                )}
                <Chrome
                  onPublish={onPublish}
                  toolbarSlot={toolbarSlot}
                  toolbarStatusSlot={toolbarStatusSlot}
                  statusBarSlot={statusBarSlot}
                  dataToggle={dataToggle}
                  initialMode={initialMode}
                  onModeChange={onModeChange}
                />
              </ErrorBoundary>
            </div>
            </BuilderTooltipProvider>
          </ImperativeAlertDialogProvider>
        </StudioThemeProvider>
      </EditorProvider>
    </HostProvider>
  );
});
