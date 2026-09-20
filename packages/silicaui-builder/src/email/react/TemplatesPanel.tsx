/**
 * The Templates switcher — top of the left rail, mirroring the site builder's
 * `PagesPanel` control-for-control: a @wizeworks/silicaui `Select` for the current
 * template, with rename / add / delete as ghost `IconButton`s beside it.
 * Renaming swaps the Select for an `Input` (Enter/blur commits, Esc cancels).
 * This is the fix for the email builder's missing multi-template support — an
 * email project can now hold more than one template, same as a site holds
 * more than one page.
 */
import * as React from "react";
import { Select, SelectItem, Input } from "@wizeworks/silicaui-react";
import { useEmailEditor, useEmailTemplates } from "./editor-context";
import { IconButton } from "../../shared/react/Hint";
import { NewEmailButton } from "./EmailStarterDialog";

export function TemplatesPanel({ studioTheme }: { studioTheme: string }) {
  const { templates, activeId } = useEmailTemplates();
  const editor = useEmailEditor();
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  // The name field REPLACES the switcher, so committing or cancelling unmounts
  // the focused element and the browser drops focus on `document.body` — a
  // keyboard user starts again from the top of the page, a screen reader loses
  // its place. Same defect and same fix as the site builder's Pages panel
  // (issues/059).
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
  // AFTER the re-render: the buttons beside the field are unmounted while it is
  // open, so at the moment Enter is pressed there is nothing left to focus.
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

  const active = templates.find((t) => t.id === activeId) ?? templates[0];
  const labels = React.useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t.name])), [templates]);

  const startRename = () => {
    if (!active) return;
    setDraft(active.name);
    openNameField();
  };
  // `restore` is false on blur: focus has already gone somewhere the person
  // chose, and yanking it back would be worse than dropping it.
  const commitRename = (restore: boolean) => {
    if (active) editor.renameTemplate(active.id, draft);
    closeNameField(restore);
  };

  // Adding a template ALSO opens the name field — same reasoning, and the same
  // defect, as the site builder's Pages panel: focus used to stay on the button,
  // so one click plus one Enter silently made two. `renameTemplate` ignores an
  // empty value, so Enter or a click away keeps the generated "Email 4".
  // See issues/044.
  // The starter picker creates the template; this only opens the name field on
  // whatever it just made. Kept separate so the two concerns do not tangle.
  const nameAfterAdd = () => {
    setDraft("");
    openNameField();
  };

  return (
    <div ref={panel} className="flex-none border-b border-base-200 p-2">
      <div className="flex items-center gap-1">
        {renaming ? (
          <Input
            autoFocus
            className="input-sm flex-1"
            aria-label="Template name"
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            onBlur={() => commitRename(false)}
            onKeyDown={(e: React.KeyboardEvent) => {
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
            onValueChange={(v) => editor.setActiveTemplate(v as string)}
            popupProps={{ "data-theme": studioTheme }}
            aria-label="Current template"
          >
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </Select>
          </div>
        )}

        {!renaming && (
          <>
            <IconButton icon="pencil" label="Rename template" size="sm" side="bottom" onClick={startRename} />
            {/* The same email again, for another shop / region / list — the
                normal way a second send comes into being. Without it the only
                route was a starter plus retyping every word (issues/072).
                Naming follows the copy, exactly as it follows an add. */}
            <IconButton
              icon="copy"
              label="Duplicate template"
              size="sm"
              side="bottom"
              onClick={() => {
                if (!active) return;
                editor.duplicateTemplate(active.id);
                nameAfterAdd();
              }}
            />
            {/* Add opens the starter picker rather than minting a blank email —
                picking a layout is what "new email" means to somebody who sends
                one every week (issues/063). Naming still follows the pick, so
                the add-then-name flow issues/044 established is unchanged. */}
            <NewEmailButton
              studioTheme={studioTheme}
              onPicked={() => nameAfterAdd()}
              trigger={<IconButton icon="plus" label="Add template" size="sm" side="bottom" />}
            />
            <IconButton
              icon="trash"
              label="Delete template"
              // Says why it's dead rather than leaving a greyed button with no
              // explanation — the case a person is most likely to hover.
              hint={templates.length <= 1 ? "A project needs at least one template" : undefined}
              side="bottom"
              size="sm"
              disabled={templates.length <= 1}
              className="hover:text-error"
              onClick={() => active && editor.removeTemplate(active.id)}
            />
          </>
        )}
      </div>
    </div>
  );
}
