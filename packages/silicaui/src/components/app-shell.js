/**
 * AppShell — the outer page skeleton: sidebar + header + main + footer, any
 * combination. A single CSS Grid with named areas handles every layout
 * ("sidebar+top+footer", "top+footer", "sidebar only", …) — an area simply
 * collapses to zero size when its slot isn't rendered, so there's no variant
 * prop to pick; just render the slots you need. Each slot is a thin
 * `grid-area` wrapper; the real chrome inside it is BYO (`Sidebar`, `Navbar`,
 * `Footer`, or anything else).
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function appShell(prefix = "") {
  const sel = (suffix = "") => `.${prefix}app-shell${suffix}`;

  return {
    [sel()]: {
      display: "grid",
      // Fills its container (a bounded demo panel, a route wrapper, whatever
      // hosts it) — NOT hardcoded to the full viewport, so it composes
      // correctly nested anywhere. For a true full-page shell, size the host
      // chain to the viewport (e.g. `html, body, #root { height: 100% }`) and
      // this inherits it; or pass `100dvh` via `className` for a one-off root shell.
      height: "100%",
      minHeight: "0",
      gridTemplateColumns: "auto 1fr",
      gridTemplateRows: "auto 1fr auto",
      gridTemplateAreas: '"sidebar header" "sidebar main" "sidebar footer"',
    },

    [sel("-sidebar")]: {
      gridArea: "sidebar",
      minHeight: "0",
      overflowY: "auto",
    },
    [sel("-header")]: {
      gridArea: "header",
      minWidth: "0",
    },
    [sel("-main")]: {
      gridArea: "main",
      minWidth: "0",
      minHeight: "0",
      overflowY: "auto",
    },
    [sel("-footer")]: {
      gridArea: "footer",
      minWidth: "0",
    },
  };
}
