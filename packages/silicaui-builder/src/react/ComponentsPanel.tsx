/**
 * The Components library — top of the left rail in COMPONENT mode. Lists every
 * saved component (symbol); clicking one opens it for editing (the canvas + spine
 * retarget to its master). New creates a blank component; per-row rename / delete
 * manage the library. Deleting is SAFE — every instance is detached into a real
 * copy (no content loss), so no confirm is needed.
 *
 * ALL controls are silicaui components / Tailwind utilities + baked <Icon>.
 */
import * as React from "react";
import { Button, Input } from "silicaui-react";
import { useEditingSymbol, useEditor, useSymbols } from "./editor-context";
import { Icon } from "./Icon";

export function ComponentsPanel() {
  const editor = useEditor();
  const symbols = useSymbols();
  const editing = useEditingSymbol();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  const startRename = (id: string, name: string) => {
    setDraft(name);
    setRenamingId(id);
  };
  const commitRename = (id: string) => {
    editor.renameSymbol(id, draft);
    setRenamingId(null);
  };

  return (
    <div className="flex-none border-b border-base-200">
      <div className="flex items-center gap-1.5 h-10 px-3.5 border-b border-base-200 text-sm font-semibold">
        <Icon name="box" /> Components
        <span className="ml-auto" />
        <Button
          variant="ghost"
          size="sm"
          shape="square"
          aria-label="New component"
          data-testid="new-component"
          onClick={() => editor.createBlankSymbol()}
        >
          <Icon name="plus" />
        </Button>
      </div>

      {symbols.length === 0 ? (
        <p className="px-3.5 py-3 text-xs text-base-content/45">
          No components yet. Create one, or select an element on a page and “Save as component”.
        </p>
      ) : (
        <ul className="max-h-52 overflow-auto py-1">
          {symbols.map((s) => {
            const open = editing?.id === s.id;
            if (renamingId === s.id) {
              return (
                <li key={s.id} className="px-2 py-0.5">
                  <Input
                    autoFocus
                    className="input-sm w-full"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commitRename(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(s.id);
                      else if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                </li>
              );
            }
            return (
              <li key={s.id} className="group flex items-center gap-0.5 px-2">
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm flex-1 min-w-0 justify-start gap-2 font-normal ${
                    open ? "btn-active text-primary" : ""
                  }`}
                  data-testid={`component-open:${s.id}`}
                  onClick={() => editor.enterSymbol(s.id)}
                >
                  <Icon name="box" className={open ? "text-primary" : "text-secondary"} />
                  <span className="truncate">{s.name}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs flex-none opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Rename"
                  onClick={() => startRename(s.id, s.name)}
                >
                  <Icon name="pencil" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs flex-none text-error opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete component (unlinks every instance)"
                  data-testid={`component-delete:${s.id}`}
                  onClick={() => editor.deleteSymbol(s.id)}
                >
                  <Icon name="trash" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
