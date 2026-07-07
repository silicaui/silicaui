/**
 * The Mockup components — frames for showcasing UI and code in docs and
 * marketing pages.
 *
 * Colorless (the code frame paints itself with the neutral surface). Three
 * independent frames:
 *
 *   .mockup-window   — an app window with three faux traffic-light dots
 *   .mockup-browser  — a window plus a toolbar that holds a faux address bar
 *   .mockup-code     — a dark terminal/code block; each `<pre data-prefix>`
 *                      line renders its prefix (`$`, `>`, a line number…)
 *
 * The window titlebar and its dots are drawn with pseudo-elements so authors
 * just wrap their content — no chrome markup required. The browser toolbar is
 * real markup because it carries a URL.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function mockup(prefix = "") {
  const win = (suffix = "") => `.${prefix}mockup-window${suffix}`;
  const browser = (suffix = "") => `.${prefix}mockup-browser${suffix}`;
  const code = (suffix = "") => `.${prefix}mockup-code${suffix}`;
  const phone = (suffix = "") => `.${prefix}mockup-phone${suffix}`;

  // Three faux traffic-light dots, drawn as one element repeated via box-shadow.
  const dots = {
    content: '""',
    position: "absolute",
    top: "0.875rem",
    insetInlineStart: "1rem",
    width: "0.6rem",
    height: "0.6rem",
    borderRadius: "9999px",
    backgroundColor: "color-mix(in oklab, currentColor 30%, transparent)",
    boxShadow:
      "1rem 0 0 color-mix(in oklab, currentColor 30%, transparent), 2rem 0 0 color-mix(in oklab, currentColor 30%, transparent)",
  };

  return {
    // ---- Window ------------------------------------------------------------
    [win()]: {
      position: "relative",
      overflow: "hidden",
      width: "100%",
      paddingTop: "2.25rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",

      // Titlebar strip.
      "&::before": {
        content: '""',
        position: "absolute",
        insetInline: "0",
        top: "0",
        height: "2.25rem",
        backgroundColor: "var(--color-base-200)",
        borderBottom: "1px solid var(--color-base-300)",
      },
      // Traffic-light dots.
      "&::after": dots,
    },

    // ---- Browser -----------------------------------------------------------
    [browser()]: {
      overflow: "hidden",
      width: "100%",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "1px solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
    },
    [browser("-toolbar")]: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      minHeight: "2.75rem",
      paddingBlock: "0.5rem",
      // Leave room for the dots on the left.
      paddingInlineStart: "3.5rem",
      paddingInlineEnd: "1rem",
      backgroundColor: "var(--color-base-200)",
      borderBottom: "1px solid var(--color-base-300)",

      "&::before": dots,
    },
    // Faux address bar inside the toolbar.
    [browser("-input")]: {
      display: "flex",
      alignItems: "center",
      flex: "1 1 0%",
      minHeight: "1.75rem",
      paddingInline: "0.875rem",
      fontSize: "0.8125rem",
      color: "color-mix(in oklab, var(--color-base-content) 65%, transparent)",
      backgroundColor: "var(--color-base-100)",
      borderRadius: "9999px",
      border: "1px solid var(--color-base-300)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    // ---- Code --------------------------------------------------------------
    [code()]: {
      position: "relative",
      overflow: "auto hidden",
      width: "100%",
      minWidth: "18rem",
      paddingBlock: "1.25rem",
      borderRadius: "var(--radius-box, 0.5rem)",
      backgroundColor: "var(--color-neutral)",
      color: "var(--color-neutral-content)",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      fontSize: "0.875rem",
      lineHeight: "1.6",

      "& pre": {
        position: "relative",
        paddingInlineStart: "1.25rem",
        paddingInlineEnd: "1.25rem",
        whiteSpace: "pre",
      },
      // The prefix gutter (e.g. `$`, `>`, a line number).
      "& pre[data-prefix]::before": {
        content: "attr(data-prefix)",
        display: "inline-block",
        width: "2ch",
        marginInlineEnd: "0.75rem",
        textAlign: "end",
        opacity: "0.4",
        userSelect: "none",
      },
    },

    // ---- Phone -------------------------------------------------------------
    [phone()]: {
      position: "relative",
      display: "inline-block",
      padding: "0.7rem",
      borderRadius: "2.75rem",
      backgroundColor: "var(--color-neutral)",
      boxShadow:
        "0 0 0 1px color-mix(in oklab, var(--color-base-content) 20%, transparent), 0 14px 34px -14px rgba(0, 0, 0, 0.55)",

      // The camera notch — a rounded pill hanging from the top of the display.
      "&::before": {
        content: '""',
        position: "absolute",
        top: "0.7rem",
        insetInlineStart: "50%",
        transform: "translateX(-50%)",
        zIndex: "1",
        width: "40%",
        height: "1.1rem",
        backgroundColor: "var(--color-neutral)",
        borderEndStartRadius: "1rem",
        borderEndEndRadius: "1rem",
      },
    },
    [phone("-display")]: {
      overflow: "hidden",
      // Fixed phone proportions so page content can't stretch the screen out of
      // shape. Override `width` to resize; the aspect ratio holds.
      width: "15rem",
      aspectRatio: "9 / 19",
      borderRadius: "2.1rem",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      // A faint screen edge so the display reads against the (dark) bezel even
      // in dark themes, where base-100 and neutral sit close together.
      boxShadow:
        "inset 0 0 0 1px color-mix(in oklab, var(--color-base-content) 14%, transparent)",
    },
  };
}
