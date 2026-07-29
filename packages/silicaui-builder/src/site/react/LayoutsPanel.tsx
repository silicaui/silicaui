/**
 * The Layouts switcher — top of the left rail in LAYOUT mode, the exact peer of
 * `PagesPanel` in Page mode. Chooses which shell the spine edits: the site
 * Default, or one of the named layouts in `Site.frames`.
 *
 * WHY NAMED LAYOUTS NEED A SWITCHER AND PAGES DON'T NEED TWO. A page picks its
 * layout from the Pages panel (`Page.frameId`); this picks which layout is being
 * EDITED. They're different questions — "what wraps this page" vs "what am I
 * working on" — and collapsing them into one control is how you end up editing
 * the docs shell while looking at the marketing page.
 *
 * The Default layout can't be deleted: it's what every page falls back to, and
 * `Editor` materializes one at boot regardless, so a delete button would either
 * lie or immediately undo itself.
 *
 * ALL controls are @wizeworks/silicaui components, and the Select popup portals
 * out of the chrome's theme island, so `popupProps` re-establishes the studio
 * tokens — same rules as `PagesPanel`.
 */
import * as React from "react";
import { Button, Input, Select, SelectItem } from "@wizeworks/silicaui-react";
import { useEditor, useStudioTheme } from "./editor-context";
import { Icon } from "../../shared/react/Icon";

/** The `Select` value standing in for "the site default" — a `Select` value is a
 *  string, and the default layout's id is `undefined`. */
const DEFAULT_LAYOUT = "";

export function LayoutsPanel() {
  const editor = useEditor();
  const studioTheme = useStudioTheme();
  // Layouts live on the site, which the engine mutates in place, so re-read on
  // every committed change rather than caching a roster that would go stale.
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => editor.subscribe(() => bump()), [editor]);

  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const layouts = editor.layouts;
  const activeId = editor.editingLayoutId;
  const active = layouts.find((l) => l.id === activeId) ?? layouts[0]!;
  const isDefault = activeId === undefined;

  const items = Object.fromEntries(layouts.map((l) => [l.id ?? DEFAULT_LAYOUT, l.name]));

  const startRename = () => {
    setDraft(active.name);
    setRenaming(true);
  };
  const commitRename = () => {
    if (activeId) editor.renameLayout(activeId, draft);
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
            value={activeId ?? DEFAULT_LAYOUT}
            items={items}
            onValueChange={(v) => editor.editLayout((v as string) || undefined)}
            popupProps={{ "data-theme": studioTheme }}
            aria-label="Current layout"
            data-testid="layout-switcher"
          >
            {layouts.map((l) => (
              <SelectItem key={l.id ?? DEFAULT_LAYOUT} value={l.id ?? DEFAULT_LAYOUT}>
                {l.name}
              </SelectItem>
            ))}
          </Select>
        )}

        {!renaming && (
          <>
            <Button
              variant="ghost"
              size="sm"
              shape="square"
              aria-label="Rename layout"
              // The default layout has no name to edit — it's "Default" by
              // position, not by a label anyone stored.
              disabled={isDefault}
              onClick={startRename}
            >
              <Icon name="pencil" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              shape="square"
              aria-label="Add layout"
              data-testid="layout-add"
              onClick={() => editor.createLayout(`Layout ${layouts.length}`)}
            >
              <Icon name="plus" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              shape="square"
              aria-label="Delete layout"
              disabled={isDefault}
              className="hover:text-error"
              onClick={() => activeId && editor.deleteLayout(activeId)}
            >
              <Icon name="trash" />
            </Button>
          </>
        )}
      </div>

      <p className="mt-2 text-xs text-base-content">
        {isDefault
          ? "Wraps every page that doesn't pick another."
          : "Pages opt in from the Pages panel; deleting this returns them to Default."}
      </p>
    </div>
  );
}
