"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@wizeworks/silicaui-react";
import { ComponentWall } from "./component-wall";
import { Reveal } from "./reveal";

/**
 * The component wall, promoted out of the hero into its own act directly below
 * it — and given back the theme toggle it used to carry, now scoped to THIS
 * section alone.
 *
 * Scoping is the whole point. `data-theme` sits on this section's wrapper, so
 * switching it re-tints only the components a visitor is looking at — including
 * the toggle itself, which is a live silicaui component that re-themes with the
 * rest. An earlier version themed the whole page from a control like this, which
 * meant the payoff happened in sections you'd scrolled past; scoping it here
 * keeps cause and effect in the same frame.
 *
 * Every theme in the switcher is a real preset from the plugin
 * (`app/globals.css` / `packages/silicaui-html/src/themes.ts`) — no per-theme
 * component CSS, because every color class is a var-setter.
 */
const THEMES: { value: string; label: string }[] = [
  { value: "light", label: "Quartz" },
  { value: "dark", label: "Dark" },
  { value: "ocean", label: "Ocean" },
  { value: "grape", label: "Grape" },
  { value: "sunset", label: "Sunset" },
];

export function ThemeWall() {
  // Starts on the shipped Quartz light default — the real product palette out
  // of the box — and gives the dark hero above it a clean light break; the
  // toggle reveals dark and the other presets.
  const [theme, setTheme] = useState("light");

  return (
    <section
      data-theme={theme}
      className="border-t border-base-300 bg-base-100 transition-colors"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <div className="flex max-w-2xl flex-col gap-5">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-tight text-base-content md:text-5xl">
              Same components. Any theme.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-lg text-base-content">
              Every tile below is a live SilicaUI component &mdash; the exact markup you&rsquo;d
              ship, not a screenshot. Switch the theme and watch them re-tint together: one token
              swap, no per-theme CSS, no rebuild.
            </p>
          </Reveal>
        </div>

        <div className="mt-12">
          <ComponentWall />
        </div>

        {/* The control sits UNDER the wall it drives — a visitor watches the
            components, then reaches for the theme. It re-themes with them. */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <span className="text-base-content">Theme these components</span>
          <ToggleGroup
            value={[theme]}
            onValueChange={(v: unknown) => {
              const next = Array.isArray(v) ? v[0] : v;
              if (typeof next === "string" && next) setTheme(next);
            }}
            className="w-fit"
            aria-label="Theme for these components"
          >
            {THEMES.map((t) => (
              <ToggleGroupItem key={t.value} value={t.value}>
                {t.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </section>
  );
}
