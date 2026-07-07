/**
 * RichTextEditor chrome — the visual shell around a TipTap editor.
 *
 * TipTap (ProseMirror) owns all editing behavior; this styles the frame: a
 * bordered box, a wrapping toolbar of toggle buttons (active state reads
 * `--color-primary`), and the editable content surface (`.ProseMirror`) with
 * sensible prose typography + a placeholder. The React `<RichTextEditor>` (in the
 * optional `silicaui-editor` package) drives TipTap and hangs these classes on
 * the markup.
 *
 * Colorless: the active/pressed toolbar button reads `--color-primary`, same
 * orthogonal-accent approach as the rest of Silica.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function richTextEditor(prefix = "") {
  const sel = (suffix = "") => `.${prefix}rich-text-editor${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel()]: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      overflow: "hidden",
    },

    // Toolbar.
    [sel("-toolbar")]: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "0.15rem",
      padding: "0.35rem",
      borderBottom: "var(--border, 1px) solid var(--color-base-200)",
      backgroundColor: "var(--color-base-200)",
    },
    [sel("-btn")]: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "1.9rem",
      height: "1.9rem",
      paddingInline: "0.4rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      border: "0",
      background: "none",
      color: "inherit",
      font: "inherit",
      fontSize: "0.85rem",
      fontWeight: "600",
      lineHeight: "1",
      cursor: "pointer",
      transition: "background-color 0.12s ease, color 0.12s ease",
      "&:hover": { backgroundColor: muted(10) },
      "&:disabled": { opacity: "0.4", cursor: "not-allowed" },
      "& svg": { width: "1.05rem", height: "1.05rem", flexShrink: "0" },
    },
    [`${sel("-btn")}[data-active]`]: {
      backgroundColor: "color-mix(in oklab, var(--color-primary) 16%, transparent)",
      color: "var(--color-primary)",
    },
    [sel("-sep")]: {
      alignSelf: "stretch",
      width: "1px",
      marginInline: "0.25rem",
      marginBlock: "0.2rem",
      backgroundColor: "var(--color-base-300)",
    },

    // Editable content surface.
    [sel("-content")]: {
      padding: "0.85rem 1rem",
      minHeight: "8rem",
      maxHeight: "24rem",
      overflowY: "auto",
      fontSize: "0.9rem",
      lineHeight: "1.6",
      "& .ProseMirror": { outline: "none" },
      "& .ProseMirror > * + *": { marginTop: "0.6em" },
      "& .ProseMirror:focus": { outline: "none" },
    },

    // Prose typography inside the editor.
    [`${sel("-content")} h1`]: {
      fontSize: "1.5rem",
      fontWeight: "700",
      lineHeight: "1.25",
    },
    [`${sel("-content")} h2`]: {
      fontSize: "1.2rem",
      fontWeight: "700",
      lineHeight: "1.3",
    },
    [`${sel("-content")} h3`]: {
      fontSize: "1.05rem",
      fontWeight: "600",
    },
    [`${sel("-content")} ul`]: {
      listStyle: "disc",
      paddingInlineStart: "1.4rem",
    },
    [`${sel("-content")} ol`]: {
      listStyle: "decimal",
      paddingInlineStart: "1.4rem",
    },
    [`${sel("-content")} li > * + *`]: { marginTop: "0.2em" },
    [`${sel("-content")} blockquote`]: {
      borderInlineStart: "3px solid var(--color-base-300)",
      paddingInlineStart: "0.9rem",
      color: muted(75),
      fontStyle: "italic",
    },
    [`${sel("-content")} a`]: {
      color: "var(--color-primary)",
      textDecoration: "underline",
      cursor: "pointer",
    },
    [`${sel("-content")} code`]: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "0.85em",
      padding: "0.1em 0.35em",
      borderRadius: "var(--radius-selector, 0.25rem)",
      backgroundColor: muted(10),
    },
    [`${sel("-content")} pre`]: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "0.85em",
      padding: "0.75rem 0.9rem",
      borderRadius: "var(--radius-field, 0.25rem)",
      backgroundColor: "var(--color-base-200)",
      overflowX: "auto",
    },
    [`${sel("-content")} pre code`]: {
      padding: "0",
      background: "none",
    },
    [`${sel("-content")} hr`]: {
      border: "0",
      borderTop: "var(--border, 1px) solid var(--color-base-300)",
      margin: "0.4em 0",
    },

    // Placeholder (TipTap Placeholder extension marks the empty first node).
    [`${sel("-content")} .ProseMirror p.is-editor-empty:first-child::before`]: {
      content: "attr(data-placeholder)",
      float: "left",
      height: "0",
      pointerEvents: "none",
      color: muted(45),
    },

    [`${sel()}[data-disabled]`]: {
      opacity: "0.6",
      pointerEvents: "none",
    },
  };
}
