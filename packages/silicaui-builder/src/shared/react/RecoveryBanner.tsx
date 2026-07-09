/**
 * A slim, dismissible bar confirming a recovered local-draft session —
 * reassurance that work wasn't lost, with an escape hatch to start over from
 * the original document. Shared by both editors' `Builder` shells (paired with
 * `../persistence`'s `DraftStore`).
 */
import * as React from "react";
import { Icon } from "./Icon";

export function RecoveryBanner({
  at,
  onDismiss,
  onStartFresh,
}: {
  at: number;
  onDismiss: () => void;
  onStartFresh: () => void;
}) {
  // Auto-dismiss after a few seconds so it never lingers as chrome.
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 7000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      data-testid="recovery-banner"
      className="flex flex-none items-center gap-2 border-b border-base-300 bg-primary/10 px-3.5 py-1.5 text-xs text-base-content"
    >
      <Icon name="database" />
      <span>Restored your last session ({relativeTime(at)}).</span>
      <span className="flex-1" />
      <button type="button" className="btn btn-xs btn-ghost" onClick={onStartFresh}>
        Start fresh
      </button>
      <button type="button" className="btn btn-xs btn-ghost btn-square" aria-label="Dismiss" onClick={onDismiss}>
        <Icon name="close" />
      </button>
    </div>
  );
}

/** "just now" / "3 min ago" / "2 hr ago" — a coarse relative timestamp. */
function relativeTime(at: number): string {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}
