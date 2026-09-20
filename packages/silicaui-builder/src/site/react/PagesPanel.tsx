/**
 * The Pages switcher — top of the left rail (Page/Layout mode). The current page
 * is chosen with a @wizeworks/silicaui `Select` (a real value-picker dropdown: built-in
 * chevron + selected-check, portalled themed popup); rename / add / delete sit
 * beside it as ghost icon `Button`s. Renaming swaps the Select for an `Input`
 * (Enter/blur commits, Esc cancels).
 *
 * ALL controls are @wizeworks/silicaui components — no hand-rolled triggers or utility-styled
 * buttons. The Select popup portals outside the chrome's `[data-theme]` island, so
 * `popupProps={{ "data-theme": … }}` re-establishes the studio tokens.
 */
import * as React from "react";
import { Select, SelectItem, Input, useImperativeAlertDialog } from "@wizeworks/silicaui-react";
import { useEditor, usePages, useStudioTheme } from "./editor-context";
import { IconButton } from "../../shared/react/Hint";

export function PagesPanel() {
  const { pages, activeId } = usePages();
  const editor = useEditor();
  const studioTheme = useStudioTheme();
  const confirm = useImperativeAlertDialog();
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  // The name field REPLACES the switcher, so committing or cancelling unmounts
  // the focused element and the browser drops focus on `document.body` — which
  // for a keyboard user means starting again from the top of the page, and for a
  // screen reader means losing its place entirely. Put focus back where it came
  // from (issues/059).
  // The button's accessible NAME, not the element. React unmounts these buttons
  // while the field is open and mounts fresh ones after, so a held element
  // reference is always stale — it points at a node that is no longer in the
  // document, and the fallback fires every time.
  const cameFrom = React.useRef<string | null>(null);
  const wantFocus = React.useRef(false);
  const panel = React.useRef<HTMLDivElement | null>(null);
  const switcher = React.useRef<HTMLDivElement | null>(null);
  const openNameField = () => {
    cameFrom.current = (window.document.activeElement as HTMLElement | null)?.getAttribute("aria-label") ?? null;
    setRenaming(true);
  };
  const closeNameField = (restore: boolean) => {
    wantFocus.current = restore;
    setRenaming(false);
  };
  // AFTER the re-render, not inside the handler: the buttons beside the field are
  // unmounted while it is open, so at the moment Enter is pressed there is
  // nothing on screen left to focus.
  React.useLayoutEffect(() => {
    if (renaming || !wantFocus.current) return;
    wantFocus.current = false;
    const name = cameFrom.current;
    cameFrom.current = null;
    const back = name ? panel.current?.querySelector<HTMLElement>(`[aria-label="${name}"]`) : null;
    // Back to the button she pressed; the switcher if that button is gone,
    // since it is the one control that is always there.
    (back ?? switcher.current?.querySelector<HTMLElement>("button"))?.focus();
  }, [renaming]);

  const active = pages.find((p) => p.id === activeId) ?? pages[0];
  const labels = React.useMemo(() => Object.fromEntries(pages.map((p) => [p.id, p.name])), [pages]);

  const startRename = () => {
    if (!active) return;
    setDraft(active.name);
    openNameField();
  };

  // Adding a page ALSO opens the name field, for two reasons.
  //
  // The first is that naming it is the next thing anyone does — `addPage` calls
  // the new one "Page 4", which is not a name, and the only way to change it was
  // to notice a second, separate pencil button.
  //
  // The second is the one that bit: focus used to stay on this button, so a
  // person who clicked "Add page" and then pressed Enter — expecting to confirm
  // a name — fired the button a SECOND time and silently got two pages. One
  // click plus one Enter produced "Page 3" and "Page 4". See issues/044.
  //
  // The draft starts empty rather than at "Page 4": she is naming the page, not
  // editing a placeholder. `renamePage` already ignores an empty value, so
  // pressing Enter or clicking away without typing keeps the generated name.
  const addAndName = () => {
    editor.addPage();
    setDraft("");
    openNameField();
  };
  // The same page again — a second class, a second location, a second
  // practitioner. Naming follows the copy for the reasons above (issues/072).
  const duplicateAndName = () => {
    if (!active) return;
    editor.duplicatePage(active.id);
    setDraft("");
    openNameField();
  };
  // `restore` is false on blur: focus has already gone somewhere the person
  // chose, and yanking it back would be worse than dropping it.
  const commitRename = (restore: boolean) => {
    if (active) editor.renamePage(active.id, draft);
    closeNameField(restore);
  };

  // Deleting a page takes the whole page tree with it, and the trash icon sits
  // one button away from Add — so it asks first. `AlertDialog`'s backdrop is
  // inert (you can't dismiss the decision by clicking away) and the dialog is
  // modal, so `active` can't change out from under the await.
  //
  // The copy names the page and says undo is there, because it is: `removePage`
  // is a recorded, invertible op. That's a reason to make the prompt calm, not
  // a reason to skip it — nothing on screen tells an author undo covers this,
  // and a page they didn't mean to delete is gone until they think to press it.
  //
  // It also COUNTS what points at the page. Deleting a page does not delete the
  // links to it — they stay, aimed at an address that is now nowhere, and a dead
  // link renders exactly like a working one. Marlene deleted the page her home
  // page and her nav both linked to, and nothing anywhere said so (issues/057).
  const deleteActive = async () => {
    if (!active) return;
    const incoming = editor.linksTo(active.slug, active.id);
    const ok = await confirm({
      title: `Delete “${active.name}”?`,
      description:
        incoming > 0
          ? `${incoming === 1 ? "One link" : `${incoming} links`} elsewhere on your site ${incoming === 1 ? "points" : "point"} at this page. ${incoming === 1 ? "It will be left" : "They will be left"} pointing at nothing. The page and everything on it is removed from the site. You can undo this.`
          : "The page and everything on it is removed from the site. You can undo this.",
      confirmLabel: "Delete page",
      color: "error",
    });
    if (ok) editor.removePage(active.id);
  };

  return (
    <div ref={panel} className="flex-none border-b border-base-200 p-2">
      <div className="flex items-center gap-1">
        {renaming ? (
          <Input
            autoFocus
            className="input-sm flex-1"
            // The email builder's twin of this field has always carried a name;
            // this one reached a screen reader as an unlabelled text box.
            aria-label="Page name"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commitRename(false)}
            onKeyDown={(e) => {
              // `preventDefault` matters here. Focus goes back to the button
              // she pressed, and that happens while this very keypress is still
              // being processed — so without this, Enter lands on "Add page"
              // and makes ANOTHER page. That is issues/044 coming back through
              // the fix for issues/059.
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename(true);
              } else if (e.key === "Escape") {
                e.preventDefault();
                closeNameField(true);
              }
            }}
          />
        ) : (
          <div ref={switcher} className="flex-1 min-w-0">
          <Select
            size="sm"
            className="w-full min-w-0"
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
          </div>
        )}

        {!renaming && (
          <>
            <IconButton icon="pencil" label="Rename page" size="sm" side="bottom" onClick={startRename} />
            <IconButton icon="copy" label="Duplicate page" size="sm" side="bottom" onClick={duplicateAndName} />
            <IconButton icon="plus" label="Add page" size="sm" side="bottom" onClick={addAndName} />
            <IconButton
              icon="trash"
              label="Delete page"
              // Says why it's dead rather than leaving a greyed button with no
              // explanation — the case a person is most likely to hover.
              hint={pages.length <= 1 ? "A site needs at least one page" : undefined}
              side="bottom"
              size="sm"
              disabled={pages.length <= 1}
              className="hover:text-error"
              onClick={() => void deleteActive()}
            />
          </>
        )}
      </div>
    </div>
  );
}
