"use client";

import { useCallback, useEffect, useState } from "react";

const CMD = "npm i @wizeworks/silicaui-react";

/**
 * A click-to-copy install command. For a dev-tool page this outperforms a
 * second heavy button as the hero's secondary action: it's a CTA that also
 * proves the thing is real and installable. Mono, hairline-bordered — not a
 * filled button, so it doesn't compete with the primary CTA.
 */
export function InstallCommand({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CMD);
      setCopied(true);
    } catch {
      // Clipboard can reject (permissions, insecure origin). Staying silent
      // would leave the button looking broken, so fall back to selecting the
      // text — the user can still copy it manually.
      setCopied(false);
    }
  }, []);

  // `min-w-0 max-w-full` rather than a bare `w-fit`: at 360px this control's content
  // is ~366px, and as an un-shrinkable sibling in the hero's CTA column it used to set
  // that column's width — pushing the primary "Get started" button off the right edge,
  // where the section's `overflow-hidden` silently clipped both. The command scrolls
  // inside itself instead, and `copy` never shrinks, because it was the first thing to
  // disappear and it is the whole point of the control.
  // See docs/personas/issues/004.
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy install command: ${CMD}`}
      className={`mono inline-flex w-fit min-w-0 max-w-full items-center gap-3 rounded-btn border border-base-300 bg-base-200 px-4 py-3 text-base-content ${className}`}
    >
      <code className="min-w-0 overflow-x-auto whitespace-nowrap">{CMD}</code>
      <span aria-live="polite" className="shrink-0 border-l border-base-300 pl-3">
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
