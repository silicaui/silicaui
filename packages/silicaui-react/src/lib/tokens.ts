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
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export type SilicaSize = "xs" | "sm" | "md" | "lg" | "xl";
