/**
 * Find a piece of text anywhere on the site, and change it everywhere at once.
 *
 * [073](docs/personas/issues/073) closed with a line it could not act on:
 * *"The site builder has no Find either."* The email builder got one; this is
 * the other half, and it is the reason the toolbar's `⌘ /` hint could be
 * removed honestly in [102](docs/personas/issues/102) rather than left pointing
 * at nothing.
 *
 * The count at the top is the point of the panel. It answers the question an
 * author cannot otherwise answer — **how many places is this?** — before they
 * start, and it is the same number the Change-all button acts on.
 *
 * Three places a site hides text that no screen shows you: the shared frame
 * (on every page, belonging to none), a saved component (behind a mode switch),
 * and the address behind a link (visible only once that link is selected).
 */
import * as React from "react";
import { Input, Button } from "@wizeworks/silicaui-react";
import { useEditor } from "./editor-context";
import type { SiteTextMatch } from "../find";

/** Re-read the site on every committed edit — a replace changes pages other
 *  than the open one, so watching the open page is not enough. */
function useSiteRevision(): number {
  const editor = useEditor();
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

/** A stable key for a group of hits — the tree they live in. */
function scopeKey(s: SiteTextMatch["scope"]): string {
  return s.kind === "page" ? `page:${s.pageId}` : s.kind === "symbol" ? `symbol:${s.symbolId}` : "frame";
}

export function FindPanel() {
  const editor = useEditor();
  const rev = useSiteRevision();
  const [find, setFind] = React.useState("");
  const [to, setTo] = React.useState("");
  // What the LAST change-all did, so the panel — whose list empties the moment
  // the work lands — can still say what happened.
  const [done, setDone] = React.useState<{ places: number; to: string } | undefined>(undefined);

  const hits = React.useMemo(() => editor.findText(find), [editor, find, rev]);
  // Only the ones a replace will actually touch, so the button's number and the
  // work it does are the same number. A slug is listed and never rewritten.
  const changeable = React.useMemo(() => hits.filter((h) => !h.readOnly), [hits]);

  const groups = React.useMemo(() => {
    const map = new Map<string, { name: string; hits: SiteTextMatch[] }>();
    for (const h of hits) {
      const k = scopeKey(h.scope);
      const g = map.get(k) ?? { name: h.scopeName, hits: [] };
      g.hits.push(h);
      map.set(k, g);
    }
    return [...map.entries()];
  }, [hits]);

  const goTo = (hit: SiteTextMatch) => {
    // Take them to the tree it is in FIRST — a hit in the frame or in a saved
    // component is on a surface they are not looking at, and selecting a node
    // that is not in the open tree would do nothing at all.
    if (hit.scope.kind === "page") {
      editor.setActivePage(hit.scope.pageId);
      editor.setActiveTree("page");
    } else if (hit.scope.kind === "frame") {
      editor.setActiveTree("frame");
    } else {
      editor.enterSymbol(hit.scope.symbolId);
    }
    if (hit.nodeId) editor.select(hit.nodeId);
  };

  const changeAll = () => {
    const places = editor.replaceText(find, to);
    // `find` deliberately stays put. The list empties, and an empty list for the
    // text they were hunting is the proof the job is done — they can read it
    // rather than take the panel's word for it.
    setDone({ places, to });
    setTo("");
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto p-3.5 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-base-content" htmlFor="sui-site-find">
          Find anywhere on this site
        </label>
        <Input
          id="sui-site-find"
          className="input-sm"
          data-testid="find-input"
          placeholder="A phone number, a price, a web address…"
          value={find}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFind(e.target.value);
            setDone(undefined);
          }}
        />
        <p className="text-xs text-base-content">
          Looks on every page, in the header and footer they share, and inside your saved components — including the web
          address behind a link. Finds the exact text, capital letters included.
        </p>
      </div>

      {find === "" ? null : hits.length === 0 ? (
        <p className="text-sm text-base-content" data-testid="find-count">
          {done
            ? `Changed ${plural(done.places, "place", "places")} to “${done.to}”. Nothing on this site says “${find}” any more.`
            : `Nothing on this site says “${find}”.`}
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-base-content" data-testid="find-count">
            {plural(hits.length, "place", "places")}
            {groups.length > 1 ? ` in ${groups.length} parts of your site` : ""}
          </p>

          {changeable.length === 0 ? (
            <p className="text-xs text-base-content">
              The only match is a page's web address, which is left alone on purpose — changing it would break every
              link that points at it.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-base-content" htmlFor="sui-site-replace">
                Change them all to
              </label>
              <div className="flex gap-1">
                <Input
                  id="sui-site-replace"
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
                  Change all {changeable.length}
                </Button>
              </div>
              <p className="text-xs text-base-content">One change. Undo puts every one of them back.</p>
            </div>
          )}

          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {groups.map(([key, group]) => (
              <li key={key} className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-base-content">{group.name}</p>
                <ul className="flex flex-col gap-1 list-none m-0 p-0">
                  {group.hits.map((hit, i) => (
                    <li key={`${hit.nodeId ?? "page"}-${hit.field}-${i}`}>
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
