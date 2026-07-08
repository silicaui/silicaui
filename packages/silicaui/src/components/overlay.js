/**
 * Overlay — a contextual scrim over a media element (image/video/card),
 * presenting info or actions specific to what's behind it. Distinct from
 * `Lightbox` (a full-viewport viewer) and `Dialog` (an interruptive modal) —
 * this stays anchored to its media, either always visible or revealed on
 * hover/focus (`data-reveal="hover"`), for gallery grids and media cards.
 *
 * Colorless: the scrim is a black gradient/wash + white text, independent of
 * the page theme (matches media conventions — captions read over any photo).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function overlay(prefix = "") {
  const sel = (suffix = "") => `.${prefix}overlay${suffix}`;

  return {
    [sel()]: {
      position: "relative",
      display: "block",
      overflow: "hidden",
      borderRadius: "inherit",
      "& > img, & > video": {
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
      },
    },

    [sel("-scrim")]: {
      position: "absolute",
      inset: "0",
      display: "flex",
      padding: "1rem",
      color: "#fff",
      transitionProperty: "opacity",
      transitionDuration: "0.15s",
      transitionTimingFunction: "ease",
      pointerEvents: "none",
      "& > *": { pointerEvents: "auto" },
    },
    // The global typography defaults stamp headings/paragraphs with their own
    // `color` (even at :where() zero specificity, an explicit declaration
    // always beats plain inheritance) — reassert white here so captions stay
    // legible over the scrim regardless of the page's theme.
    [`${sel("-scrim")} :where(h1, h2, h3, h4, h5, h6, p)`]: {
      color: "inherit",
    },
    [`${sel("-scrim")}[data-placement="bottom"]`]: {
      alignItems: "flex-end",
      background: "linear-gradient(to top, rgb(0 0 0 / 0.75), transparent 65%)",
    },
    [`${sel("-scrim")}[data-placement="top"]`]: {
      alignItems: "flex-start",
      background: "linear-gradient(to bottom, rgb(0 0 0 / 0.75), transparent 65%)",
    },
    [`${sel("-scrim")}[data-placement="full"]`]: {
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      backgroundColor: "rgb(0 0 0 / 0.55)",
    },

    // Revealed only on hover/focus (e.g. a gallery grid) — hidden otherwise.
    [`${sel()}[data-reveal="hover"] ${sel("-scrim")}`]: { opacity: "0" },
    [`${sel()}[data-reveal="hover"]:hover ${sel("-scrim")}, ${sel()}[data-reveal="hover"]:focus-within ${sel("-scrim")}`]:
      { opacity: "1" },
  };
}
