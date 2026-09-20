import * as React from "react";

/**
 * Commit an in-place text edit when the page is going away.
 *
 * Both canvases edit text in a `contentEditable` that holds the new characters
 * in the DOM and only writes them into the document on blur or Enter. The local
 * draft store persists the DOCUMENT, so until that commit happens the sentence
 * being typed right now exists nowhere durable — and the safety net whose whole
 * purpose is "never lose work to a closed tab" has a hole exactly where the
 * author's hands are.
 *
 * Found by P03 (issues/058): Marlene typed a full sentence, the tab closed, and
 * her seven pages came back without it.
 *
 * `visibilitychange` is listened for on **document**, not window, on purpose.
 * The event is dispatched at `document` and bubbles to `window`, so a document
 * listener runs BEFORE the Builder's window listener that flushes the draft —
 * and the text has to reach the document before the snapshot of it is written.
 * `pagehide` has no document target, so the Builder makes the ordering moot by
 * flushing synchronously once it knows the page is hiding.
 *
 * `commit` is expected to be idempotent: both canvases guard it with a `done`
 * ref, so a hide followed by the real blur commits exactly once.
 */
export function useCommitOnHide(commit: () => void): void {
  const latest = React.useRef(commit);
  latest.current = commit;
  React.useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") latest.current();
    };
    const onPageHide = () => latest.current();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);
}
