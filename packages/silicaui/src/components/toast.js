/**
 * The Toast component — transient notifications (Base UI behavior).
 *
 * Base UI owns the queue, timeout, focus management, and swipe-to-dismiss; we
 * lay the toasts out in a fixed corner viewport (a simple flex stack — reliable
 * across browsers) and animate them in/out via `[data-starting-style]` /
 * `[data-ending-style]`. A left accent bar is keyed off `data-type` so
 * `success` / `error` / `warning` / `info` toasts read at a glance.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function toast(prefix = "") {
  const sel = (suffix = "") => `.${prefix}toast${suffix}`;

  const typeBar = (name) => ({
    [`${sel()}[data-type="${name}"]`]: {
      borderInlineStartWidth: "3px",
      borderInlineStartColor: `var(--color-${name})`,
    },
  });

  return {
    [sel("-viewport")]: {
      position: "fixed",
      insetBlockEnd: "1rem",
      insetInlineEnd: "1rem",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column-reverse",
      gap: "0.5rem",
      width: "22rem",
      maxWidth: "calc(100vw - 2rem)",
      outline: "none",
    },

    [sel()]: {
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      paddingBlock: "0.875rem",
      paddingInline: "1rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.35)",
      transform:
        "translate(var(--toast-swipe-movement-x, 0), var(--toast-swipe-movement-y, 0))",
      transition: "transform 0.3s ease, opacity 0.3s ease",

      "&[data-swiping]": { transition: "none" },
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "translateX(110%)",
      },
    },

    ...typeBar("success"),
    ...typeBar("error"),
    ...typeBar("warning"),
    ...typeBar("info"),

    [sel("-content")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.15rem",
      flex: "1 1 0%",
      minWidth: "0",
    },
    [sel("-title")]: {
      fontWeight: "600",
      fontSize: "0.9rem",
      lineHeight: "1.3",
    },
    [sel("-description")]: {
      fontSize: "0.85rem",
      lineHeight: "1.4",
      color: "color-mix(in oklab, var(--color-base-content) 75%, transparent)",
    },
    [sel("-close")]: {
      flexShrink: "0",
      display: "inline-flex",
      padding: "0.15rem",
      border: "0",
      background: "none",
      borderRadius: "var(--radius-field, 0.25rem)",
      color: "inherit",
      opacity: "0.5",
      cursor: "pointer",
      transition: "opacity 0.15s",

      "&:hover": { opacity: "1" },
      "& svg": { width: "1rem", height: "1rem", display: "block" },
    },
  };
}
