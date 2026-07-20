"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@wizeworks/silicaui-react";
import { ComponentWall } from "./component-wall";

/**
 * The theme control + the wall it drives.
 *
 * `data-theme` sits on the wrapper around the wall, so one attribute change
 * recolors every component inside — no per-theme CSS, no re-render of anything
 * but the attribute. Each preset here is a real one from
 * packages/silicaui-html/src/themes.ts, declared in globals.css.
 */
const THEMES = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Quartz" },
  { id: "ocean", label: "Ocean" },
  { id: "grape", label: "Grape" },
  { id: "sunset", label: "Sunset" },
] as const;

export function ThemeControl({
  theme,
  onThemeChange,
}: {
  theme: string;
  onThemeChange: (t: string) => void;
}) {
  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={(v: unknown) => {
        const next = Array.isArray(v) ? v[0] : v;
        if (typeof next === "string" && next) onThemeChange(next);
      }}
      className="toggle-group-sm w-fit"
      aria-label="Preview theme"
    >
      {THEMES.map((t) => (
        <ToggleGroupItem key={t.id} value={t.id}>
          {t.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function useThemePreview() {
  return useState<string>("dark");
}

export function ThemedWall({ theme }: { theme: string }) {
  return (
    <div data-theme={theme} className="transition-colors">
      <ComponentWall />
    </div>
  );
}
