/**
 * The type ladder every sized component uses, in ONE place.
 *
 * Sixteen components used to hardcode their own, and there were NINE different
 * ladders among them. That is how `md` came to mean 14px in a button, 13px in a
 * toggle-group and 12px in a badge — and how the system's default size came to
 * sit under RULE #3's 16px body floor without anyone choosing that.
 *
 *   before   button 11/12/14/16/18   badge 10/11/12/14/16   toggle-group 11/12/13/15/17
 *   after    all of them             12/14/16/18/20
 *
 * `md` is 16px, so the size a consumer gets without asking clears the floor, and
 * the five steps stay distinct so `sm` still means something. A consumer who
 * wants 14px asks for `sm` rather than discovering that `md` was already small.
 *
 * This is the same shape `TYPE_SCALE` has for the `text-*` utilities: declared
 * once so the MCP catalog documents what the plugin actually emits and the two
 * cannot drift. `scripts/verify-component-type.mjs` holds every component to it.
 *
 * Three components are deliberately NOT on this ladder, and the probe knows
 * their names and reasons rather than pattern-matching them.
 */
export const COMPONENT_TYPE = {
  xs: "0.75rem", // 12
  sm: "0.875rem", // 14
  md: "1rem", // 16 — the floor, and the default
  lg: "1.125rem", // 18
  xl: "1.25rem", // 20
};

/** The 16px body floor, as a number of rem, for anything that holds words. */
export const TYPE_FLOOR_REM = 1;
