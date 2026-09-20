/**
 * The "New email" starter picker — a modal gallery of ways to begin: blank, or a
 * ready-made newsletter / announcement / offer to then replace.
 *
 * The site builder's twin is `ComponentStarterDialog`, and this deliberately
 * mirrors it control for control — same layout, same search, same card, same
 * `starter:<key>` test id — so the two do not become two different ideas of the
 * same gesture. Found by P04 (issues/063): the Templates panel offered nothing
 * to start FROM, only a roster of emails already made.
 *
 * The Dialog portals to `document.body`, outside the chrome's `[data-theme]`
 * island, so `DialogContent` re-stamps the studio theme.
 */
import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, Input } from "@wizeworks/silicaui-react";
import { useEmailEditor } from "./editor-context";
import { useEmailHost } from "./host-context";
import { Icon } from "../../shared/react/Icon";
import { Hint } from "../../shared/react/Hint";
import { emailStarterGroups } from "../starters";
import type { EmailStarter } from "../starters";
import { defaultMakeId } from "@wizeworks/silicaui-html";

/** A "new email" button that opens the starter picker. The caller supplies the
 *  trigger element so it fits the panel head, and is told which name to use. */
export function NewEmailButton({
  trigger,
  studioTheme,
  onPicked,
}: {
  trigger: React.ReactElement;
  studioTheme: string;
  /** Called with the new template's id once it is created, so the panel can put
   *  the name field straight on it (the same add-then-name flow the site builder
   *  uses — see issues/044). */
  onPicked?: (id: string) => void;
}) {
  const editor = useEmailEditor();
  const host = useEmailHost();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const groups = React.useMemo(() => emailStarterGroups(host?.emailStarters?.()), [host]);

  const query = q.trim().toLowerCase();
  const matches = (i: EmailStarter) =>
    !query || i.label.toLowerCase().includes(query) || i.hint.toLowerCase().includes(query);
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter(matches) }))
    .filter((g) => g.items.length > 0);

  const pick = (item: EmailStarter) => {
    // "Blank" keeps the engine's auto-name ("Email 3"); a real starter carries
    // its own, because "Newsletter" is a more useful thing to see in the
    // switcher than "Email 3".
    const doc = item.make(defaultMakeId, editor.colorDefaults);
    const id = editor.addTemplate(item.key === "blank" ? undefined : item.label, doc);
    setOpen(false);
    setQ("");
    onPicked?.(id);
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setQ(""); }}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent
        data-theme={studioTheme}
        className="w-[min(720px,94vw)] max-h-[82vh] overflow-hidden flex flex-col p-0"
      >
        <div className="flex-none px-5 pt-5 pb-3 border-b border-base-200">
          <DialogTitle className="text-base font-semibold">New email</DialogTitle>
          <DialogDescription className="text-sm text-base-content">
            Start blank, or from a layout you can then replace with your own.
          </DialogDescription>
          <div className="relative mt-3">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content"
            />
            <Input
              autoFocus
              type="search"
              className="w-full pl-8"
              size="sm"
              placeholder="Search layouts…"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5">
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-base-content">No layouts match “{q}”.</p>
          ) : (
            visible.map((g) => (
              <div key={g.key} className="mb-5 last:mb-0">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content">
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
function StarterCard({ item, onPick }: { item: EmailStarter; onPick: () => void }) {
  return (
    // The card already shows the label AND the hint, so the tooltip says the one
    // thing neither does: what pressing it produces.
    <Hint label={`Create a new email starting from ${item.label}`}>
      <button
        type="button"
        data-testid={`starter:${item.key}`}
        onClick={onPick}
        className="group flex items-start gap-3 rounded-box border border-base-300 bg-base-100 p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
      >
        <span className="grid size-8 flex-none place-items-center rounded-field bg-base-200 text-base-content group-hover:bg-primary group-hover:text-primary-content">
          <Icon name={item.icon} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{item.label}</span>
          <span className="block truncate text-xs text-base-content">{item.hint}</span>
        </span>
      </button>
    </Hint>
  );
}
