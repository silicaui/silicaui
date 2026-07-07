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
import type { Document as SuiDocument } from "silicaui-html";
import { Button, ToggleGroup, ToggleGroupItem, Kbd } from "silicaui-react";
import { Editor } from "../engine";
import { EditorProvider, useEditor, useHistory } from "./editor-context";
import { ThemeEditor } from "./ThemeEditor";
import { ComponentBoard } from "./ComponentBoard";
import { ThemeLibrary } from "./ThemeLibrary";
import { Canvas } from "./Canvas";
import { Navigator } from "./Navigator";
import { Inspector } from "./Inspector";
import { Icon } from "./Icon";
import type { IconName } from "../icons";

type Mode = "page" | "layout" | "theme";
type Appearance = "light" | "dark";

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

function Chrome() {
  const editor = useEditor();
  const { canUndo, canRedo } = useHistory();
  const [mode, setMode] = React.useState<Mode>("page");
  const [device, setDevice] = React.useState("desktop");
  const [appearance, setAppearance] = React.useState<Appearance>("light");

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
          value={[mode]}
          onValueChange={(v: string[]) => v.length && setMode(last(v, mode) as Mode)}
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
        <Button color="primary" size="sm">Publish</Button>
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
              <PanelHead>
                <Icon name="list" /> Navigator
              </PanelHead>
              <div className="flex-1 min-h-0 overflow-auto py-1.5 text-sm">
                <Navigator />
              </div>
            </>
          )}
        </aside>

        {/* center */}
        <section className="flex flex-col min-w-0 min-h-0">
          {mode === "theme" ? <ComponentBoard /> : <Canvas device={device} />}
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

export interface BuilderProps {
  document: SuiDocument;
  studioTheme?: string;
}

/** The full builder. Mount it anywhere; it fills its host container. */
export function Builder({ document, studioTheme = "studio" }: BuilderProps) {
  const [editor] = React.useState(() => new Editor(document));
  return (
    <EditorProvider editor={editor}>
      <div
        className="flex h-full min-h-0 flex-col bg-base-100 text-base-content text-sm antialiased"
        data-theme={studioTheme}
      >
        <Chrome />
      </div>
    </EditorProvider>
  );
}
