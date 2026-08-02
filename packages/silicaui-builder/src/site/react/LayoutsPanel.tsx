/**
 * The Layout header — top of the left rail in LAYOUT mode, the peer of
 * `PagesPanel` in Page mode.
 *
 * A site has exactly ONE shell (`Site.frame`), so there is nothing to switch
 * between and this is a label, not a control. It exists to answer "what am I
 * editing right now" — Layout mode swaps the whole tree under the Navigator, and
 * a rail that said nothing would leave that change unannounced.
 */
import * as React from "react";

export function LayoutsPanel() {
  return (
    <div className="flex-none border-b border-base-200 p-2">
      <p className="px-1 text-sm font-medium text-base-content" data-testid="layout-name">
        Layout
      </p>
      <p className="mt-1 px-1 text-xs text-base-content">Wraps every page on the site.</p>
    </div>
  );
}
