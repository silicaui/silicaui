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
  };
}
