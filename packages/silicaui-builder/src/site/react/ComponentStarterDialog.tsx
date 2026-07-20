/**
 * The "New component" starter picker — a modal gallery of ways to begin a
 * component: a blank shell, or a ready-made section (navbar, footer, content, …).
 * Picking one mints a component master from that starter and opens it for editing.
 *
 * The Dialog portals to document.body — OUTSIDE the chrome's `[data-theme]`
 * island — so `DialogContent` re-stamps the studio theme (same fix PagesPanel's
 * Select uses). Every control is a @wizeworks/silicaui component / utility + baked <Icon>.
 */
import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, Input } from "@wizeworks/silicaui-react";
import { useEditor, useStudioTheme } from "./editor-context";
import { useHost } from "./host-context";
import { Icon } from "../../shared/react/Icon";
import { componentStarterGroups } from "../component-starters";
import type { PaletteItem } from "../palette";

/** A New-component button that opens the starter picker. The caller supplies the
 *  trigger element (so it fits the panel head or the empty state), which the Dialog
 *  wires up to open the gallery. */
export function NewComponentButton({ trigger }: { trigger: React.ReactElement }) {
  const editor = useEditor();
  const host = useHost();
  const studioTheme = useStudioTheme();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const groups = React.useMemo(
    () =>
      componentStarterGroups({
        catalogExtend: host?.catalog?.().extend,
        starters: host?.componentStarters?.(),
      }),
    [host],
  );

  const query = q.trim().toLowerCase();
  const matches = (i: PaletteItem) =>
    !query || i.label.toLowerCase().includes(query) || (i.hint ?? "").toLowerCase().includes(query);
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter(matches) }))
    .filter((g) => g.items.length > 0);

  const pick = (item: PaletteItem) => {
    // "Blank" gets the engine's auto-name; a section starter carries its own name.
    editor.createComponent(item.key === "blank" ? undefined : item.label, item.make());
    setOpen(false);
    setQ("");
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setQ(""); }}>
      {/* Base UI clones the trigger element as the dialog opener. */}
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent
        data-theme={studioTheme}
        className="w-[min(720px,94vw)] max-h-[82vh] overflow-hidden flex flex-col p-0"
      >
        <div className="flex-none px-5 pt-5 pb-3 border-b border-base-200">
          <DialogTitle className="text-base font-semibold">New component</DialogTitle>
          <DialogDescription className="text-sm text-base-content/60">
            Start blank, or from a ready-made section you can then customize.
          </DialogDescription>
          <div className="relative mt-3">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/45"
            />
            <Input
              // A picker dialog: focus belongs in the search field on open.
              autoFocus
              type="search"
              className="w-full pl-8"
              size="sm"
              placeholder="Search starters…"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5">
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-base-content/45">No starters match “{q}”.</p>
          ) : (
            visible.map((g) => (
              <div key={g.key} className="mb-5 last:mb-0">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/45">
                  {g.label}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {g.items.map((item) => (
                    <StarterCard key={item.key} item={item} onPick={() => pick(item)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** One starter option — an icon + name + one-line hint. */
function StarterCard({ item, onPick }: { item: PaletteItem; onPick: () => void }) {
  return (
    <button
      type="button"
      data-testid={`starter:${item.key}`}
      onClick={onPick}
      className="group flex items-start gap-3 rounded-box border border-base-300 bg-base-100 p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
    >
      <span className="grid size-8 flex-none place-items-center rounded-field bg-base-200 text-base-content/70 group-hover:bg-primary group-hover:text-primary-content">
        <Icon name={item.icon} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{item.label}</span>
        {item.hint && <span className="block truncate text-xs text-base-content/50">{item.hint}</span>}
      </span>
    </button>
  );
}
