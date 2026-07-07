/**
 * The Prose component — typographic defaults for a block of rich/markdown
 * content (Silica's answer to `@tailwindcss/typography`).
 *
 * Tailwind's Preflight strips headings, lists, quotes, code, and tables to
 * nothing (it won't impose a look); this puts a considered, theme-aware look
 * back — but ONLY inside `.prose`, so it never leaks into the app chrome. Every
 * color is a Silica token (base-content text, primary links, base-200/300
 * surfaces + rules), so it tracks the active theme automatically.
 *
 * Colorless in the variant sense (no per-color classes). Inner sizing is in
 * `em`, so the size modifiers (`-sm`/`-lg`/`-xl`) rescale the whole block by
 * changing one root font-size. Caps at `65ch` for readability — add
 * `max-w-none` to remove.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function prose(prefix = "") {
  const sel = (suffix = "") => `.${prefix}prose${suffix}`;
  const muted = "color-mix(in oklab, var(--color-base-content) 70%, transparent)";
  const mono =
    'var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace)';

  return {
    [sel()]: {
      color: "var(--color-base-content)",
      maxWidth: "65ch",
      fontSize: "1rem",
      lineHeight: "1.75",

      // ---- Headings --------------------------------------------------------
      "& h1": {
        fontSize: "2.25em",
        fontWeight: "800",
        lineHeight: "1.1",
        letterSpacing: "-0.02em",
        marginTop: "0",
        marginBottom: "0.8em",
      },
      "& h2": {
        fontSize: "1.5em",
        fontWeight: "700",
        lineHeight: "1.3",
        letterSpacing: "-0.01em",
        marginTop: "1.6em",
        marginBottom: "0.6em",
      },
      "& h3": {
        fontSize: "1.25em",
        fontWeight: "600",
        lineHeight: "1.4",
        marginTop: "1.4em",
        marginBottom: "0.5em",
      },
      "& h4": {
        fontSize: "1em",
        fontWeight: "600",
        lineHeight: "1.5",
        marginTop: "1.2em",
        marginBottom: "0.4em",
      },

      // ---- Flow text -------------------------------------------------------
      "& p": { marginTop: "0", marginBottom: "1.25em" },
      "& a": {
        color: "var(--color-primary)",
        fontWeight: "500",
        textDecorationLine: "underline",
        textDecorationThickness: "1px",
        textUnderlineOffset: "2px",
      },
      "& a:hover": { textDecorationThickness: "2px" },
      "& strong": { fontWeight: "700", color: "inherit" },
      "& mark": {
        backgroundColor:
          "color-mix(in oklab, var(--color-warning) 40%, transparent)",
        color: "inherit",
        padding: "0 0.15em",
        borderRadius: "0.2em",
      },
      "& small": { fontSize: "0.875em" },

      // ---- Lists -----------------------------------------------------------
      "& ul, & ol": {
        marginTop: "0",
        marginBottom: "1.25em",
        paddingInlineStart: "1.5em",
      },
      "& ul": { listStyleType: "disc" },
      "& ol": { listStyleType: "decimal" },
      "& li": { marginTop: "0.35em", marginBottom: "0.35em" },
      "& li::marker": { color: muted },
      "& li > ul, & li > ol": { marginTop: "0.35em", marginBottom: "0.35em" },

      // ---- Blockquote ------------------------------------------------------
      "& blockquote": {
        marginTop: "0",
        marginBottom: "1.25em",
        paddingInlineStart: "1em",
        borderInlineStart: "0.25rem solid var(--color-base-300)",
        color: muted,
        fontStyle: "italic",
      },

      // ---- Code ------------------------------------------------------------
      "& code": {
        fontFamily: mono,
        fontSize: "0.875em",
        backgroundColor: "var(--color-base-200)",
        padding: "0.15em 0.4em",
        borderRadius: "var(--radius-field, 0.25rem)",
      },
      "& pre": {
        marginTop: "0",
        marginBottom: "1.25em",
        overflowX: "auto",
        padding: "1em 1.25em",
        borderRadius: "var(--radius-box, 0.5rem)",
        backgroundColor: "var(--color-base-200)",
        color: "var(--color-base-content)",
        fontFamily: mono,
        fontSize: "0.875em",
        lineHeight: "1.6",
      },
      // Inline-code styling shouldn't double up inside a code block.
      "& pre code": {
        backgroundColor: "transparent",
        padding: "0",
        borderRadius: "0",
        fontSize: "inherit",
        color: "inherit",
      },

      // ---- Rule / media ----------------------------------------------------
      "& hr": {
        marginTop: "2em",
        marginBottom: "2em",
        border: "0",
        borderTop: "var(--border, 1px) solid var(--color-base-300)",
      },
      "& img, & video": {
        marginTop: "1.5em",
        marginBottom: "1.5em",
        maxWidth: "100%",
        height: "auto",
        borderRadius: "var(--radius-box, 0.5rem)",
      },

      // ---- Tables ----------------------------------------------------------
      "& table": {
        width: "100%",
        marginTop: "0",
        marginBottom: "1.5em",
        borderCollapse: "collapse",
        fontSize: "0.875em",
        textAlign: "left",
      },
      "& thead th": {
        fontWeight: "600",
        padding: "0.5em 0.75em",
        borderBottom: "var(--border, 1px) solid var(--color-base-300)",
      },
      "& tbody td": {
        padding: "0.5em 0.75em",
        borderBottom: "var(--border, 1px) solid var(--color-base-200)",
      },
      "& tbody tr:last-child td": { borderBottom: "0" },

      // Trim the outer edges so a .prose block sits flush in its container.
      "& > :first-child": { marginTop: "0" },
      "& > :last-child": { marginBottom: "0" },
    },

    // ---- Sizes (rescale the em base) ---------------------------------------
    [sel("-sm")]: { fontSize: "0.875rem", lineHeight: "1.7" },
    [sel("-lg")]: { fontSize: "1.125rem", lineHeight: "1.8" },
    [sel("-xl")]: { fontSize: "1.25rem", lineHeight: "1.8" },
  };
}
