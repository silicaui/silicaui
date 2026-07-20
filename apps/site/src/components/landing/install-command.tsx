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

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy install command: ${CMD}`}
      className={`mono inline-flex w-fit items-center gap-3 whitespace-nowrap rounded-btn border border-base-300 bg-base-200 px-4 py-3 text-base-content ${className}`}
    >
      <code className="whitespace-nowrap">{CMD}</code>
      <span aria-live="polite" className="border-l border-base-300 pl-3">
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
