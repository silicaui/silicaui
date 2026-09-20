/**
 * The subject, on screen, from the first moment.
 *
 * P04 act 2, recorded and not fixed at the time:
 *
 * > getting to the subject at all takes knowing that a tree row called `Email`
 * > holds it — two clicks, and until then **nothing on screen mentions a subject
 * > line**. For a marketing lead the subject is the *first* thing he writes.
 *
 * That is a DISCOVERABILITY defect, not an editing one, and the difference
 * decides the shape of the fix. `EmailBuilder`'s toolbar already carries a
 * written decision against the obvious answer:
 *
 * > Subject and preview text are document fields, not toolbar controls… A
 * > second, token-less copy up here duplicated the field in its WORSE form and
 * > ate ~300px of a bar that also has to fit the host's own `toolbarSlot`.
 *
 * Right, and it still is. So this is not a second editor. It is a **read-out
 * that takes you to the one editor there is** — which also sidesteps a real bug
 * two editors of one field would have: `TokenTextField` seeds its local state
 * from `defaultValue` at mount and never re-syncs, so two of them would drift
 * apart inside a single session and the last one blurred would win.
 *
 * What it adds is the part that was missing: the words "Subject" on the screen,
 * the subject itself if there is one, and **an empty state that says there is
 * not** — which is the case that most needs saying, since an email with no
 * subject is the one that goes out wrong.
 */
import * as React from "react";
import { useEmailDocument, useEmailEditor } from "./editor-context";
import { useInspectorFocus } from "./inspector-focus";

/** Inboxes start cutting a subject around here. Not a limit — a fact. */
const SUBJECT_CUTS_AT = 60;

export function SubjectBar() {
  const editor = useEmailEditor();
  // The live document, so this re-reads on every committed edit — the subject
  // changes from the Inspector, from Find-and-replace, and from a collaborator.
  const doc = useEmailDocument();
  const focus = useInspectorFocus();

  const subject = doc.subject;
  const preheader = doc.preheader;

  const open = () => {
    // Both halves matter. The root is the node that HOLDS the subject, and
    // `settings` is the tab it is on — selecting without the tab lands them on
    // Design, which is the right rail and the wrong page of it.
    editor.select(editor.root.id);
    focus?.request("settings");
  };

  return (
    <div className="@container/subject flex-none flex items-baseline gap-2 px-4 py-2 border-b border-base-300 bg-base-100">
      <span className="flex-none font-semibold text-base-content">Subject</span>
      <button
        type="button"
        data-testid="subject-bar"
        onClick={open}
        className="min-w-0 flex-1 text-left truncate rounded-btn px-2 py-0.5 text-base-content hover:bg-base-200 focus-visible:bg-base-200"
      >
        {subject ? (
          subject
        ) : (
          // An email with no subject is the one that goes out wrong, so the
          // empty state says what is missing and what to do, rather than
          // rendering as a slightly shorter line of nothing.
          <span className="italic">No subject yet — most people write this first</span>
        )}
      </button>
      {subject.length > SUBJECT_CUTS_AT && (
        <span className="flex-none text-base-content" data-testid="subject-length">
          {subject.length} characters — inboxes start cutting around {SUBJECT_CUTS_AT}
        </span>
      )}
      {preheader && (
        <span className="hidden @3xl/subject:block min-w-0 flex-1 truncate text-base-content" data-testid="subject-preheader">
          Preview text: {preheader}
        </span>
      )}
    </div>
  );
}
