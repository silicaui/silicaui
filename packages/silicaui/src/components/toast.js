import { contentVar } from "../lib/auto-content.js";

/**
 * The Toast component — transient notifications (Base UI behavior).
 *
 * Shares Alert's surface: a solid color-per-type background driven by
 * `--toast-bg`/`--toast-fg` (set via `[data-type]`, same orthogonal color
 * model as `.alert-<name>`), a top-aligned leading icon slot, and the same
 * radius/spacing/type scale — a toast is an Alert that floats and expires.
 * Base UI owns the queue, timeout, focus management, and swipe-to-dismiss on
 * top of that shared look; we lay the toasts out in a fixed corner viewport
 * (a simple flex stack — reliable across browsers) and animate them in/out
 * via `[data-starting-style]` / `[data-ending-style]`.
 *
 * @param {string[]} colors - color names to generate `[data-type="<name>"]` variants for
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function toast(colors, prefix = "") {
  const sel = (suffix = "") => `.${prefix}toast${suffix}`;

  const base = {
    [sel("-viewport")]: {
      position: "fixed",
      insetBlockEnd: "1rem",
      insetInlineEnd: "1rem",
      zIndex: "var(--z-toast, 90)",
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
      width: "100%",
      paddingInline: "calc(var(--size-field, 0.25rem) * 4)",
      paddingBlock: "calc(var(--size-field, 0.25rem) * 3)",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      borderRadius: "var(--radius-box, 0.5rem)",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "var(--toast-bg, var(--color-base-300))",
      backgroundColor: "var(--toast-bg, var(--color-base-200))",
      color: "var(--toast-fg, var(--color-base-content))",
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.35)",
      transform:
        "translate(var(--toast-swipe-movement-x, 0), var(--toast-swipe-movement-y, 0))",
      transition: "transform 0.3s ease, opacity 0.3s ease",

      // Leading type icon — see the matching comment in alert.js for why the
      // nudge exists: `align-items: flex-start` top-aligns the icon to the
      // line-box, which sits above the glyphs, so it's nudged down to meet
      // the first line's cap-height.
      "& > svg": {
        width: "1.25em",
        height: "1.25em",
        flexShrink: "0",
        transform: "translateY(0.2em)",
      },

      "&[data-swiping]": { transition: "none" },
      "&[data-starting-style], &[data-ending-style]": {
        opacity: "0",
        transform: "translateX(110%)",
      },
    },

    [sel("-content")]: {
      display: "flex",
      flexDirection: "column",
      gap: "0.15rem",
      flex: "1 1 0%",
      minWidth: "0",
    },
    // Title/description render as `<h2>`/`<p>` (Base UI) — reset the UA
    // heading/paragraph margin + font-size so they inherit `.toast`'s type
    // scale exactly like `.alert-title`/`.alert-description` (plain `<div>`s).
    [sel("-title")]: {
      margin: "0",
      fontSize: "inherit",
      fontWeight: "600",
      lineHeight: "1.3",
    },
    [sel("-description")]: {
      margin: "0",
      fontSize: "inherit",
      opacity: "0.9",
      lineHeight: "1.4",
    },
    // Optional trailing action button (`toast.add({ actionProps: {...} })`) —
    // an outlined pill using `currentColor`, so it inherits `--toast-fg` and
    // stays legible against every `data-type` background without its own
    // color vars. Sits between content and close; carries the same
    // auto-margin end-alignment `-close` does, so it still lands flush right
    // when no action is present (see the matching note on `-close`).
    [sel("-action")]: {
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: "1.75rem",
      paddingInline: "0.75rem",
      marginInlineStart: "auto",
      fontSize: "0.8125rem",
      fontWeight: "600",
      lineHeight: "1",
      whiteSpace: "nowrap",
      borderWidth: "var(--border, 1px)",
      borderStyle: "solid",
      borderColor: "currentColor",
      borderRadius: "var(--radius-field, 0.375rem)",
      background: "transparent",
      color: "inherit",
      opacity: "0.9",
      cursor: "pointer",
      transition: "opacity 0.15s, background-color 0.15s",

      "&:hover": {
        opacity: "1",
        backgroundColor: "color-mix(in oklab, currentColor 15%, transparent)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "1px",
      },
    },

    [sel("-close")]: {
      flexShrink: "0",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "1.5rem",
      height: "1.5rem",
      // `.toast-content` always has `flex: 1 1 0%` (unlike Alert, Toast's
      // content is never bare children), so this is belt-and-suspenders
      // rather than load-bearing — see the matching fix in alert.js for why
      // it matters there. Also a no-op (rather than harmful) when `-action`
      // precedes it: `-action`'s own auto-margin already claimed the row's
      // leftover space, so there's none left for this one to consume.
      marginInlineStart: "auto",
      border: "0",
      borderRadius: "9999px",
      background: "transparent",
      color: "inherit",
      opacity: "0.7",
      cursor: "pointer",
      transition: "opacity 0.15s, background-color 0.15s",

      "&:hover": {
        opacity: "1",
        backgroundColor: "color-mix(in oklab, currentColor 15%, transparent)",
      },
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "1px",
      },
      "& svg": { width: "1rem", height: "1rem", display: "block" },
    },
  };

  // ---- Color variants, keyed off Base UI's `data-type` (extensible) --------
  // Each color only assigns source vars, same orthogonal model as `.alert-<name>`.
  for (const name of colors) {
    base[`${sel()}[data-type="${name}"]`] = {
      "--toast-bg": `var(--color-${name})`,
      "--toast-fg": contentVar(name),
    };
  }

  return base;
}
