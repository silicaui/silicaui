/**
 * The fleet table and the handover notes, side by side, with a divider the duty
 * officer can move.
 *
 * Two things this has to get right, and they pull against each other:
 *
 *  - On the wall screen, 800 rows want room and the note wants to stay visible,
 *    so where the divider sits is a real preference a person forms over a shift.
 *    It is persisted.
 *  - On a phone, a side-by-side split of a 360px screen is two 170px slivers,
 *    which is worse than not splitting at all. Below 900px the group turns and
 *    stacks, so the divider still exists and still does something useful.
 */
import * as React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@wizeworks/silicaui-panels";

/** The width below which a side-by-side split stops being a split. */
const SIDE_BY_SIDE = "(min-width: 900px)";

function useSideBySide(): boolean {
  // Read AFTER the first paint, not in a lazy initializer: an initializer still
  // runs during a server render and there is no `matchMedia` there.
  const [wide, setWide] = React.useState(true);
  React.useEffect(() => {
    const mq = window.matchMedia(SIDE_BY_SIDE);
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return wide;
}

export function FleetSplit({ table, notes }: { table: React.ReactNode; notes: React.ReactNode }) {
  const wide = useSideBySide();
  return (
    <ResizablePanelGroup
      // The saved layout is keyed by direction. A percentage split that made
      // sense side by side is not the same split stacked, and reusing one for
      // the other is how a phone inherits a wall screen's divider.
      key={wide ? "wide" : "stacked"}
      autoSaveId={wide ? "kaiho:split-wide" : "kaiho:split-stacked"}
      direction={wide ? "horizontal" : "vertical"}
      className="min-h-[32rem] flex-1"
    >
      <ResizablePanel defaultSize={68} minSize={30} order={1}>
        <div className="h-full min-w-0 overflow-auto pr-1">{table}</div>
      </ResizablePanel>
      <ResizeHandle aria-label="Resize the fleet table against the handover notes" />
      <ResizablePanel defaultSize={32} minSize={20} collapsible order={2}>
        <div className="h-full min-w-0 overflow-auto pl-1">{notes}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
