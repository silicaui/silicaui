/**
 * The Pages switcher — top of the left rail (Page/Layout mode). The current page
 * is chosen with a @wizeworks/silicaui `Select` (a real value-picker dropdown: built-in
 * chevron + selected-check, portalled themed popup); rename / add / delete sit
 * beside it as ghost icon `Button`s. Renaming swaps the Select for an `Input`
 * (Enter/blur commits, Esc cancels).
 *
 * ALL controls are @wizeworks/silicaui components — no hand-rolled triggers or utility-styled
 * buttons. The Select popup portals outside the chrome's `[data-theme]` island, so
 * `popupProps={{ "data-theme": … }}` re-establishes the studio tokens. The theme is
 * site-wide and the frame is shared, so this is the ONLY per-page surface —
 * switching re-composes the canvas with that page's body in the frame's Outlet.
 * Add/remove/rename are undoable; switching is a view concern (no history).
 */
import * as React from "react";
import { Button, Select, SelectItem, Input } from "@wizeworks/silicaui-react";
import { useEditor, usePages, useStudioTheme } from "./editor-context";
import { Icon } from "../../shared/react/Icon";

export function PagesPanel() {
  const { pages, activeId } = usePages();
  const editor = useEditor();
  const studioTheme = useStudioTheme();
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const active = pages.find((p) => p.id === activeId) ?? pages[0];
  const labels = React.useMemo(() => Object.fromEntries(pages.map((p) => [p.id, p.name])), [pages]);

  const startRename = () => {
    if (!active) return;
    setDraft(active.name);
    setRenaming(true);
  };
  const commitRename = () => {
    if (active) editor.renamePage(active.id, draft);
    setRenaming(false);
  };

  return (
    <div className="flex-none border-b border-base-200 p-2">
      <div className="flex items-center gap-1">
        {renaming ? (
          <Input
            autoFocus
            className="input-sm flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              else if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <Select
            size="sm"
            className="flex-1 min-w-0"
            value={activeId}
            items={labels}
            onValueChange={(v) => editor.setActivePage(v as string)}
            popupProps={{ "data-theme": studioTheme }}
            aria-label="Current page"
          >
            {pages.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </Select>
        )}

        {!renaming && (
          <>
            <Button variant="ghost" size="sm" shape="square" aria-label="Rename page" onClick={startRename}>
              <Icon name="pencil" />
            </Button>
            <Button variant="ghost" size="sm" shape="square" aria-label="Add page" onClick={() => editor.addPage()}>
              <Icon name="plus" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              shape="square"
              aria-label="Delete page"
              disabled={pages.length <= 1}
              className="hover:text-error"
              onClick={() => active && editor.removePage(active.id)}
            >
              <Icon name="trash" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
