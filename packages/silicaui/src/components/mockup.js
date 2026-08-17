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
 * The dots are themed: close/minimize/zoom read `--color-error`, `--color-warning`
 * and `--color-success`, so any theme that registers those roles gets correct
 * traffic lights for free. `.mockup-plain` restores neutral, colorless dots.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function mockup(prefix = "") {
  const win = (suffix = "") => `.${prefix}mockup-window${suffix}`;
  const browser = (suffix = "") => `.${prefix}mockup-browser${suffix}`;
  const code = (suffix = "") => `.${prefix}mockup-code${suffix}`;
  const phone = (suffix = "") => `.${prefix}mockup-phone${suffix}`;
  const plain = `.${prefix}mockup-plain`;

  // Traffic-light geometry, single-sourced. Both frames derive their titlebar
  // padding from these, so the dots and the content beside them cannot drift
  // out of alignment the way a hand-tuned `padding-inline-start` did.
  const DOT_SIZE = "0.6rem";
  const DOT_STEP = "1rem"; // center-to-center
  const DOT_INSET = "1rem"; // from the frame's inline start
  // The cluster is one element plus two box-shadow copies, so it spans
  // 2 steps + one dot beyond the inset: 1 + 2 + 0.6 = 3.6rem.
  const DOT_SPAN = `calc(${DOT_INSET} + 2 * ${DOT_STEP} + ${DOT_SIZE})`;
  const TITLEBAR_H = "2.25rem";

  // Named once here so a frame can retint them without reaching into the
  // pseudo-element, and so `.mockup-plain` is a three-line override.
  const dotColors = {
    "--mockup-dot-1": "var(--color-error)",
    "--mockup-dot-2": "var(--color-warning)",
    "--mockup-dot-3": "var(--color-success)",
  };

  // Three faux traffic-light dots, drawn as one element repeated via box-shadow
  // (each shadow carries its own color). Callers set `top` — the two frames
  // center them against different boxes.
  const dots = {
    content: '""',
    position: "absolute",
    insetInlineStart: DOT_INSET,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: "9999px",
    backgroundColor: "var(--mockup-dot-1)",
    boxShadow: `${DOT_STEP} 0 0 var(--mockup-dot-2), calc(${DOT_STEP} * 2) 0 0 var(--mockup-dot-3)`,
  };

  return {
    // ---- Window ------------------------------------------------------------
    [win()]: {
      ...dotColors,
      position: "relative",
      overflow: "hidden",
      width: "100%",
      paddingTop: TITLEBAR_H,
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
        height: TITLEBAR_H,
        backgroundColor: "var(--color-base-200)",
        borderBottom: "1px solid var(--color-base-300)",
      },
      // Traffic-light dots. The dots hang off the window box, not the titlebar
      // strip (which is itself a pseudo-element), so center them by hand.
      "&::after": {
        ...dots,
        top: `calc((${TITLEBAR_H} - ${DOT_SIZE}) / 2)`,
      },
    },

    // ---- Browser -----------------------------------------------------------
    [browser()]: {
      ...dotColors,
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
      // Clear the dot cluster, plus a gutter. Derived so a taller toolbar or a
      // resized dot can't leave the address bar sitting on top of the dots.
      paddingInlineStart: `calc(${DOT_SPAN} + 1rem)`,
      paddingInlineEnd: "1rem",
      backgroundColor: "var(--color-base-200)",
      borderBottom: "1px solid var(--color-base-300)",

      // Centered against the toolbar itself, so custom `toolbar` content that
      // grows the bar keeps the dots on the address bar's centerline.
      "&::before": {
        ...dots,
        top: "50%",
        transform: "translateY(-50%)",
      },
    },
    // Faux address bar inside the toolbar.
    [browser("-input")]: {
      display: "flex",
      alignItems: "center",
      flex: "1 1 0%",
      minHeight: "1.75rem",
      paddingInline: "0.875rem",
      fontSize: "0.8125rem",
      // A URL is meant to be read — real ink, not a faded one.
      color: "var(--color-base-content)",
      backgroundColor: "var(--color-base-100)",
      borderRadius: "9999px",
      border: "1px solid var(--color-base-300)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    // Opt back out of the colored traffic lights — neutral dots, as before.
    [plain]: {
      "--mockup-dot-1": "color-mix(in oklab, currentColor 30%, transparent)",
      "--mockup-dot-2": "color-mix(in oklab, currentColor 30%, transparent)",
      "--mockup-dot-3": "color-mix(in oklab, currentColor 30%, transparent)",
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
