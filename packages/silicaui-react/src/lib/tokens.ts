/**
 * Shared token unions used across Silica components.
 *
 * `SilicaColor` lists the built-in semantic colors for autocomplete but also
 * accepts any custom color string (the `(string & {})` trick keeps the literal
 * suggestions while still allowing arbitrary user-defined colors registered via
 * `@plugin "@wizeworks/silicaui" { colors: … }`).
 */
export type SilicaColor =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  // `string & {}` keeps the literal union's autocomplete while still accepting
  // any custom color registered with the plugin. (`ban-types` was removed in
  // typescript-eslint v8, so no disable directive is needed.)
  | (string & {});

export type SilicaSize = "xs" | "sm" | "md" | "lg" | "xl";
