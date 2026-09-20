/**
 * Find a piece of text across every email in the project, and change it
 * everywhere at once.
 *
 * P04 act 7 (issues/073): an offer code went out wrong after the email had been
 * duplicated for three shops. It sat in twelve places — four per email — and six
 * of the twelve were on no screen he was looking at: the subject and preview
 * text live behind a tree row called "Email", and a button's web address is
 * only visible once that button is selected. The builder offered nothing for
 * finding a word, so "fix it everywhere" meant "remember everywhere".
 *
 * The count at the top is the point of the panel. It answers the question an
 * author cannot otherwise answer — how many places is this? — before he starts,
 * and it is the same number the Change-all button acts on.
 */
import * as React from "react";
import { Input, Button } from "@wizeworks/silicaui-react";
import { useEmailEditor } from "./editor-context";
import type { EmailTextMatch } from "../find";

/** Re-read the project on every committed edit — a replace changes templates
 *  other than the open one, so watching the open document is not enough. */
function useProjectRevision(): number {
  const editor = useEmailEditor();
  const rev = React.useRef(0);
  return React.useSyncExternalStore(
    React.useCallback(
      (onChange) =>
        editor.subscribe(() => {
          rev.current += 1;
          onChange();
        }),
      [editor],
    ),
    () => rev.current,
  );
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function FindPanel() {
  const editor = useEmailEditor();
  const rev = useProjectRevision();
  const [find, setFind] = React.useState("");
  const [to, setTo] = React.useState("");
  // What the LAST change-all did, so the panel — whose list empties the moment
  // the work lands — can still say what happened.
  const [done, setDone] = React.useState<{ places: number; to: string } | undefined>(undefined);
  // Clicking a hit swaps the whole document under him, and the template
  // switcher lives on the Layers page — so from here nothing would say which
  // email he had landed in. The list says it instead.
  const openId = editor.activeTemplate;

  const hits = React.useMemo(() => editor.findText(find), [editor, find, rev]);
  const byTemplate = React.useMemo(() => {
    const groups = new Map<string, { name: string; hits: EmailTextMatch[] }>();
    for (const h of hits) {
      const g = groups.get(h.templateId) ?? { name: h.templateName, hits: [] };
      g.hits.push(h);
      groups.set(h.templateId, g);
    }
    return [...groups.entries()];
  }, [hits]);

  const goTo = (hit: EmailTextMatch) => {
    editor.setActiveTemplate(hit.templateId);
    // Subject and preview text belong to the email itself, so the email's own
    // row is the right place to land — that is where its Settings are.
    editor.select(hit.nodeId ?? editor.root.id);
  };

  const changeAll = () => {
    const places = editor.replaceText(find, to);
    // `find` deliberately stays put. The list empties, and an empty list for
    // the text he was hunting is the proof the job is done — he can read it
    // rather than take the panel's word for it.
    setDone({ places, to });
    setTo("");
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto p-3.5 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-base-content" htmlFor="sui-email-find">
          Find in every email
        </label>
        <Input
          id="sui-email-find"
          className="input-sm"
          data-testid="find-input"
          placeholder="An offer code, a date, a web address…"
          value={find}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFind(e.target.value);
            setDone(undefined);
          }}
        />
        <p className="text-xs text-base-content">
          Looks in every email in this project, including the subject, the preview text, and the web address behind a
          button. Finds the exact text, capital letters included.
        </p>
      </div>

      {find === "" ? null : hits.length === 0 ? (
        <p className="text-sm text-base-content" data-testid="find-count">
          {done
            ? `Changed ${plural(done.places, "place", "places")} to “${done.to}”. Nothing says “${find}” any more.`
            : `Nothing in your emails says “${find}”.`}
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-base-content" data-testid="find-count">
            {plural(hits.length, "place", "places")} in {plural(byTemplate.length, "email", "emails")}
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-base-content" htmlFor="sui-email-replace">
              Change them all to
            </label>
            <div className="flex gap-1">
              <Input
                id="sui-email-replace"
                className="input-sm flex-1 min-w-0"
                data-testid="replace-input"
                value={to}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
              />
              <Button
                size="sm"
                color="primary"
                data-testid="replace-all"
                disabled={to === "" || to === find}
                onClick={changeAll}
              >
                Change all {hits.length}
              </Button>
            </div>
            <p className="text-xs text-base-content">One change. Undo puts every one of them back.</p>
          </div>

          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {byTemplate.map(([id, group]) => (
              <li key={id} className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-base-content">
                  {group.name}
                  {id === openId && <span className="font-normal"> — the one you have open</span>}
                </p>
                <ul className="flex flex-col gap-1 list-none m-0 p-0">
                  {group.hits.map((hit, i) => (
                    <li key={`${hit.nodeId ?? "doc"}-${hit.field}-${i}`}>
                      <button
                        type="button"
                        data-testid="find-hit"
                        className="w-full text-left rounded-btn px-2 py-1.5 hover:bg-base-200 focus-visible:bg-base-200"
                        onClick={() => goTo(hit)}
                      >
                        <span className="block text-sm text-base-content">{hit.where}</span>
                        <span className="block text-xs text-base-content">{hit.excerpt}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
