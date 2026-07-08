/**
 * Theme operations for the Theme-mode surfaces — export-to-CSS and a tasteful
 * "randomize" that rerolls the brand hues over a coherent ramp. Framework-neutral;
 * operate on the `@wizeworks/silicaui-html` `Theme` model.
 */
import type { Theme } from "@wizeworks/silicaui-html";
import { SEMANTIC_ROLES } from "@wizeworks/silicaui-html";

/** Emit the theme as the same `[data-theme="name"]` block @wizeworks/silicaui's plugin uses. */
export function themeToCss(theme: Theme): string {
  const block = (sel: string, bag: Record<string, string>): string => {
    const decls = Object.entries(bag)
      .filter(([k]) => k.startsWith("--"))
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");
    return `${sel} {\n${decls}\n}`;
  };
  const name = theme.name || "custom";
  const light = block(`[data-theme="${name}"]`, theme.tokens);
  if (!theme.dark || Object.keys(theme.dark).length === 0) return light;
  const dark = block(`[data-theme="${name}"]`, theme.dark)
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
  return `${light}\n\n@media (prefers-color-scheme: dark) {\n${dark}\n}`;
}

/**
 * Reroll the brand roles (primary/secondary/accent) around a fresh base hue while
 * keeping surfaces, neutral, and the status colors stable — random but legible.
 * Edits the ACTIVE mode's token bag. (Math.random is fine in the browser.)
 */
export function randomizePalette(theme: Theme): Theme {
  const h = Math.floor(Math.random() * 360);
  const brand: Record<string, string> = {
    "--color-primary": `oklch(58% 0.23 ${h})`,
    "--color-secondary": `oklch(66% 0.2 ${(h + 60) % 360})`,
    "--color-accent": `oklch(72% 0.18 ${(h + 180) % 360})`,
  };
  const next = structuredClone(theme);
  if (theme.mode === "dark") next.dark = { ...(next.dark ?? {}), ...brand };
  else next.tokens = { ...next.tokens, ...brand };
  return next;
}

/** Whether a role name is one @wizeworks/silicaui defines by default (vs. user-added). */
export function isCustomRole(name: string): boolean {
  return !(SEMANTIC_ROLES as readonly string[]).includes(name);
}
