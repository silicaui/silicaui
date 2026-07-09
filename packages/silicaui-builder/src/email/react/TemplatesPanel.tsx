/**
 * The Templates switcher — top of the left rail, mirroring the site builder's
 * `PagesPanel` control-for-control: a @wizeworks/silicaui `Select` for the current
 * template, with rename / add / delete as ghost icon `Button`s beside it.
 * Renaming swaps the Select for an `Input` (Enter/blur commits, Esc cancels).
 * This is the fix for the email builder's missing multi-template support — an
 * email project can now hold more than one template, same as a site holds
 * more than one page.
 */
import * as React from "react";
import { Button, Select, SelectItem, Input } from "@wizeworks/silicaui-react";
import { useEmailEditor, useEmailTemplates } from "./editor-context";
import { Icon } from "../../shared/react/Icon";

export function TemplatesPanel({ studioTheme }: { studioTheme: string }) {
  const { templates, activeId } = useEmailTemplates();
  const editor = useEmailEditor();
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const active = templates.find((t) => t.id === activeId) ?? templates[0];
  const labels = React.useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t.name])), [templates]);

  const startRename = () => {
    if (!active) return;
    setDraft(active.name);
    setRenaming(true);
  };
  const commitRename = () => {
    if (active) editor.renameTemplate(active.id, draft);
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e: React.KeyboardEvent) => {
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
        )}

        {!renaming && (
          <>
            <Button variant="ghost" size="sm" shape="square" aria-label="Rename template" onClick={startRename}>
              <Icon name="pencil" />
            </Button>
            <Button variant="ghost" size="sm" shape="square" aria-label="Add template" onClick={() => editor.addTemplate()}>
              <Icon name="plus" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              shape="square"
              aria-label="Delete template"
              disabled={templates.length <= 1}
              className="hover:text-error"
              onClick={() => active && editor.removeTemplate(active.id)}
            >
              <Icon name="trash" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
