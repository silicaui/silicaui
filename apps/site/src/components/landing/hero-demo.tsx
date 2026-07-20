"use client";

import { ComponentWall } from "./component-wall";

/**
 * The hero's component wall.
 *
 * This used to carry its own theme toggle (Dark / Quartz / Ocean / …), but
 * that made the hero a second color control competing with the brand picker
 * further down the page — two "change the color" affordances doing nearly the
 * same thing, with the weaker one first. The picker is now the page's single
 * color control, so the wall simply renders in the hero's dark island and
 * shows real, live components. The re-theming claim is made — and made
 * interactively — by the brand picker, which re-tints this hero along with
 * everything else.
 */
export function ThemedWall() {
  return <ComponentWall />;
}
