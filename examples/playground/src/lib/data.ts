import type { ButtonColor, ButtonVariant } from "silicaui-react";

/**
 * The full color roster the playground exercises. The last three
 * (`brand` / `silica` / `brand-duck`) are USER-defined colors registered in
 * `styles.css` — proof that a consumer's own colors get the identical treatment
 * (variants, auto-content) as the built-in semantic set.
 */
export const COLORS: ButtonColor[] = [
    "primary",
    "secondary",
    "accent",
    "neutral",
    "info",
    "success",
    "warning",
    "error",
    "brand",
    "silica",
    "brand-duck",
];

/** The style axis, orthogonal to color. `solid` is the default (bare `.btn`). */
export const VARIANTS: ButtonVariant[] = [
    "solid",
    "outline",
    "soft",
    "ghost",
    "link",
    "dash",
];

/** The density/size ladder shared by field-tier controls. */
export const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
