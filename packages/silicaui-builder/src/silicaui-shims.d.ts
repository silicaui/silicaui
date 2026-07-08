/**
 * Type shims for @wizeworks/silicaui's pure JS generator subpaths (the package ships as
 * source with no `.d.ts`). Only the flat rule-map shape the runtime cascade needs.
 */
type RuleMap = Record<string, Record<string, string>>;

declare module "@wizeworks/silicaui/button" {
  /** `.btn-<name>` color var-setters for the given colors. */
  export function buttonColorVars(colors: string[], prefix?: string): RuleMap;
}

declare module "@wizeworks/silicaui/color-utilities" {
  /** `.text-`/`.bg-`/`.border-<name>` var-setters for the given token names. */
  export function colorUtilityRules(names: string[], prefix?: string): RuleMap;
  /** The full build-time utility set (surfaces + colors + `-content`). */
  export function colorUtilities(colors: string[], prefix?: string): RuleMap;
}
