/**
 * The duty officer's handover note.
 *
 * It is typed at 23:40 by someone about to go home, it names two vessels with
 * diacritics, it carries a phone number that is not in the system yet, and the
 * word that matters most is bold. All of that has to survive being saved and
 * read back by whoever comes on at midnight — a note that loses its "do **not**"
 * is worse than no note.
 *
 * Saved to our own store, because this is the one thing on the dashboard that is
 * written rather than fetched.
 */
import * as React from "react";
import { RichTextEditor } from "@wizeworks/silicaui-editor";
import { Badge } from "@wizeworks/silicaui-react";
import { HANDOVER_NOTE_HTML } from "./data";

const KEY = "kaiho:handover-note";

function load(): string {
  try {
    return window.localStorage.getItem(KEY) ?? HANDOVER_NOTE_HTML;
  } catch {
    return HANDOVER_NOTE_HTML;
  }
}

export function HandoverNotes() {
  const [html, setHtml] = React.useState<string>(() => load());
  const [saved, setSaved] = React.useState<number | undefined>(undefined);

  const save = React.useCallback((next: string) => {
    setHtml(next);
    try {
      window.localStorage.setItem(KEY, next);
      setSaved(Date.now());
    } catch {
      /* private mode: the note stays in memory for this session */
    }
  }, []);

  if (typeof window !== "undefined") window.__kaihoNote = () => html;

  return (
    <div className="flex flex-col gap-2">
      <RichTextEditor
        defaultValue={html}
        onValueChange={save}
        placeholder="What the next watch needs to know"
        contentClassName="min-h-40 text-base text-base-content"
      />
      <div className="flex items-center gap-2 text-base text-base-content">
        <Badge color={saved ? "success" : "neutral"} size="sm" data-testid="note-status">
          {saved ? `Saved ${new Date(saved).toLocaleTimeString("ja-JP")}` : "Not edited this watch"}
        </Badge>
        <span>{html.replace(/<[^>]*>/g, "").length} characters</span>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    __kaihoNote?: () => string;
  }
}
