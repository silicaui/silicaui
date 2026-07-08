/**
 * The Chat suite — a higher-level layer over the `chat`/`chat-bubble`
 * primitives (chat.js): a scrollable message layout, a composer, and the
 * small extras a real conversation needs (system dividers, grouped
 * metadata, a collapsible tool-call detail). `ChatMessage` itself composes
 * the existing `.chat`/`.chat-image`/`.chat-header`/`.chat-bubble` classes
 * rather than repainting them — this module only adds what those don't
 * already cover.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function chatSuite(prefix = "") {
  const sel = (name, suffix = "") => `.${prefix}${name}${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    // ---- Layout ---------------------------------------------------------
    [sel("chat-layout")]: {
      display: "flex",
      flexDirection: "column",
      minHeight: "0",
      height: "100%",
    },
    [sel("chat-layout-messages")]: {
      display: "flex",
      flexDirection: "column",
      // `flex-end` bottom-anchors the thread: a short conversation sits right
      // above the composer (like every real chat app) instead of pinned to
      // the top with a dead gap below it. Once content overflows, this has no
      // effect on scrolling — it only matters while there's leftover space.
      justifyContent: "flex-end",
      gap: "0.25rem",
      flex: "1 1 auto",
      minHeight: "0",
      overflowY: "auto",
      padding: "1rem",
    },

    // ---- Composer ---------------------------------------------------------
    [sel("chat-composer")]: {
      display: "flex",
      alignItems: "flex-end",
      gap: "0.5rem",
      padding: "0.75rem",
      borderTop: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
    },
    [sel("chat-composer-field")]: {
      flex: "1 1 auto",
      minWidth: "0",
      resize: "none",
      maxHeight: "10rem",
      overflowY: "auto",
    },
    [sel("chat-composer-actions")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      flexShrink: "0",
    },

    // ---- System message (centered divider, e.g. "Today", "Ada joined") ----
    [sel("chat-system-message")]: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      margin: "0.5rem 0",
      fontSize: "0.75rem",
      color: muted(60),
      "&::before, &::after": {
        content: '""',
        flex: "1 1 auto",
        height: "1px",
        backgroundColor: "var(--color-base-300)",
      },
    },

    // ---- Standalone message metadata (grouped/consecutive messages that
    // skip their own header — reuses `.chat-footer`'s type treatment but
    // works outside a `.chat` grid too). -------------------------------------
    [sel("chat-message-metadata")]: {
      fontSize: "0.75rem",
      color: muted(60),
    },

    // ---- Tool calls (collapsible detail; wraps the existing Collapsible) --
    [sel("chat-tool-calls")]: {
      width: "fit-content",
      maxWidth: "min(42rem, 100%)",
      padding: "0.5rem 0.75rem",
      borderRadius: "var(--radius-box, 0.75rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-200)",
      fontSize: "0.8125rem",
    },
    [`${sel("chat-tool-calls")} ${sel("collapsible-trigger")}`]: {
      fontWeight: "500",
      fontSize: "0.8125rem",
      color: muted(80),
    },
    [`${sel("chat-tool-calls")} ${sel("collapsible-content")}`]: {
      fontFamily: "var(--font-mono, monospace)",
      fontSize: "0.75rem",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },

    // ---- Typing indicator (three dots inside a real `.chat-bubble`, so it
    // sits exactly where the next message will land) -----------------------
    [sel("chat-typing")]: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      padding: "0.15rem 0",
    },
    [sel("chat-typing-dot")]: {
      width: "0.375rem",
      height: "0.375rem",
      borderRadius: "9999px",
      backgroundColor: "currentColor",
      opacity: "0.4",
      // A live status signal (the assistant is actively responding right
      // now), not decoration — kept animating under `prefers-reduced-motion`
      // on purpose, same call as Loading's spinner.
      animation: "silica-typing-bounce 1.2s ease-in-out infinite",
    },
    [`${sel("chat-typing-dot")}:nth-child(2)`]: { animationDelay: "0.15s" },
    [`${sel("chat-typing-dot")}:nth-child(3)`]: { animationDelay: "0.3s" },
  };
}
