/**
 * ResizablePanels chrome — the visual surface for react-resizable-panels.
 *
 * react-resizable-panels owns the layout + drag math (it sets flex direction,
 * panel sizes, and the handle's `data-resize-handle-state`); this styles the
 * bordered group frame and the resize handle (a thin bar with a centered grip
 * that lights up on hover/drag). Orientation comes from the group's
 * `data-panel-group-direction`, so one rule set covers both axes. The React
 * wrappers (in the optional `@wizeworks/silicaui-panels` package) hang these classes on the
 * library's components.
 *
 * Colorless: the hovered/dragged handle + grip read `--color-primary`.
 *
 * @param {string} [prefix] - prepended verbatim to every class (e.g. `sx-`)
 */
export function resizablePanels(prefix = "") {
  const sel = (suffix = "") => `.${prefix}resizable${suffix}`;
  const muted = (pct) =>
    `color-mix(in oklab, var(--color-base-content) ${pct}%, transparent)`;

  return {
    [sel("-group")]: {
      width: "100%",
      height: "100%",
      borderRadius: "var(--radius-box, 0.5rem)",
      border: "var(--border, 1px) solid var(--color-base-300)",
      backgroundColor: "var(--color-base-100)",
      color: "var(--color-base-content)",
      overflow: "hidden",
    },

    // A panel: let its content scroll, allow flex shrink below content size.
    [sel("-panel")]: {
      overflow: "auto",
      minWidth: "0",
      minHeight: "0",
    },

    // The drag handle bar.
    [sel("-handle")]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: "0",
      position: "relative",
      backgroundColor: "var(--color-base-200)",
      transition: "background-color 0.12s ease",
      "&:focus-visible": {
        outline: "2px solid var(--color-primary)",
        outlineOffset: "-2px",
      },
    },
    // Orientation from the group direction (handles are direct group children).
    [`${sel("-group")}[data-panel-group-direction="horizontal"] > ${sel("-handle")}`]:
      { width: "0.6rem", cursor: "col-resize" },
    [`${sel("-group")}[data-panel-group-direction="vertical"] > ${sel("-handle")}`]:
      { height: "0.6rem", cursor: "row-resize" },
    [`${sel("-handle")}[data-resize-handle-state="hover"], ${sel("-handle")}[data-resize-handle-state="drag"]`]:
      {
        backgroundColor: "color-mix(in oklab, var(--color-primary) 14%, var(--color-base-200))",
      },

    // The centered grip pill.
    [sel("-handle-grip")]: {
      borderRadius: "9999px",
      backgroundColor: muted(30),
      transition: "background-color 0.12s ease",
    },
    [`${sel("-group")}[data-panel-group-direction="horizontal"] > ${sel("-handle")} ${sel("-handle-grip")}`]:
      { width: "3px", height: "1.7rem" },
    [`${sel("-group")}[data-panel-group-direction="vertical"] > ${sel("-handle")} ${sel("-handle-grip")}`]:
      { width: "1.7rem", height: "3px" },
    [`${sel("-handle")}[data-resize-handle-state="hover"] ${sel("-handle-grip")}, ${sel("-handle")}[data-resize-handle-state="drag"] ${sel("-handle-grip")}`]:
      { backgroundColor: "var(--color-primary)" },
  };
}
