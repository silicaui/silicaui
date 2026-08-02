/**
 * Type shims for @wizeworks/silicaui's pure JS generator subpaths (the package
 * ships as source with no `.d.ts`). Only the flat rule-map shape `theme.ts`
 * needs — kept in sync with the identical file in @wizeworks/silicaui-builder.
 */
type RuleMap = Record<string, Record<string, string>>;

declare module "@wizeworks/silicaui/color-variants" {
  /** `.<root>-<name>` component variants for ONE registered component. */
  export function colorVariantRules(key: string, colors: string[], prefix?: string): RuleMap;
  /** The same, for EVERY colored component — the full cascade for a set of colors. */
  export function allColorVariantRules(colors: string[], prefix?: string): RuleMap;
}

declare module "@wizeworks/silicaui/color-utilities" {
  /** `.text-`/`.bg-`/`.border-<name>` var-setters for the given token names. */
  export function colorUtilityRules(names: string[], prefix?: string): RuleMap;
  /** The full build-time utility set (surfaces + colors + `-content`). */
  export function colorUtilities(colors: string[], prefix?: string): RuleMap;
}
