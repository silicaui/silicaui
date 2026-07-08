/**
 * The Theme editor (left panel in Theme mode). A 4-up COLOR TILE grid (surfaces +
 * every role from `rolesOf`, so N named colors flow in) whose tiles open
 * @wizeworks/silicaui-react's OKLCH `ColorPicker`; discrete RADIUS pickers; EFFECTS toggles
 * (Depth/Noise); and a Field-size step. Styled ONLY with Tailwind + @wizeworks/silicaui
 * classes; every control is a real @wizeworks/silicaui-react component; every glyph is a
 * baked `<Icon>`. Writes the whole theme through `editor.setTheme` so the canvas +
 * board repaint live.
 */
import * as React from "react";
import type { Theme } from "@wizeworks/silicaui-html";
import { SURFACE_TOKENS, rolesOf, colorValue, presetByName } from "@wizeworks/silicaui-html";
import { ColorPicker, Switch, ToggleGroup, ToggleGroupItem, Input, Button } from "@wizeworks/silicaui-react";
import { useEditor, useTheme } from "./editor-context";
import { randomizePalette, themeToCss, isCustomRole } from "../theme-ops";
import { Icon } from "../../shared/react/Icon";

type Mode = "light" | "dark";

const DEFAULT_PRESET = presetByName("quartz");

/** Contrast-checked ink painted on `value` (relative-color, like autoContent). */
const inkOn = (value: string): string =>
  value === "transparent" ? "currentColor" : `oklch(from ${value} clamp(0, (0.62 - l) * 1000, 1) 0 0)`;

/**
 * A color's effective value, falling back to @wizeworks/silicaui's default palette. Presets
 * intentionally omit `-content` tokens (see `themes.ts`), so a `name-content`
 * with no explicit override anywhere falls back to an auto-derived ink on top of
 * its paired base color — mirroring the runtime's `contentVar` fallback.
 */
function resolveColor(theme: Theme, name: string, mode: Mode): string {
  const explicit =
    colorValue(theme, name, mode) ?? (DEFAULT_PRESET ? colorValue(DEFAULT_PRESET, name, mode) : undefined);
  if (explicit) return explicit;
  const base = /^(.+)-content$/.exec(name)?.[1];
  return base ? inkOn(resolveColor(theme, base, mode)) : "transparent";
}

function withColor(theme: Theme, name: string, value: string, mode: Mode): Theme {
  const key = `--color-${name}`;
  const next = structuredClone(theme);
  if (mode === "dark") next.dark = { ...(next.dark ?? {}), [key]: value };
  else next.tokens = { ...next.tokens, [key]: value };
  return next;
}
function withToken(theme: Theme, key: string, value: string): Theme {
  const next = structuredClone(theme);
  next.tokens = { ...next.tokens, [key]: value };
  return next;
}

const GROUP = "mt-5 mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-base-content/45";

function ColorTile({
  name, value, active, custom, showLetter = true, letterColor, onClick,
}: {
  name: string;
  value: string;
  active: boolean;
  custom?: boolean;
  /** Set false for a plain swatch with no ink preview (the base role tile). */
  showLetter?: boolean;
  /** Explicit ink for the letter — used by `-content` tiles to show the real
   * paired token instead of a computed guess. Defaults to `inkOn(value)`. */
  letterColor?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} title={name} className="flex flex-col gap-1.5">
      <span
        className={`relative grid place-items-center aspect-[1/0.9] rounded-[10px] border border-black/10 font-extrabold text-md ${
          active ? "outline outline-2 outline-primary outline-offset-2" : ""
        }`}
        style={{ background: value, color: letterColor ?? inkOn(value) }}
      >
        {showLetter && "A"}
        {custom && <span className="absolute top-0.5 right-1 text-xs opacity-80">★</span>}
      </span>
      <span className="text-xs font-semibold text-center truncate text-base-content/55">{name}</span>
    </button>
  );
}

// Radius options include each token's real default (from SCALAR_TOKENS) so the
// current value always lights up; `dflt` is the fallback when the theme omits it.
const RADIUS_ROWS: Array<{ key: string; label: string; dflt: string; opts: string[] }> = [
  { key: "--radius-box", label: "Boxes", dflt: "0.5rem", opts: ["0", "0.25rem", "0.5rem", "1rem"] },
  { key: "--radius-field", label: "Fields", dflt: "0.25rem", opts: ["0", "0.25rem", "0.5rem", "0.875rem"] },
  { key: "--radius-selector", label: "Selectors", dflt: "1rem", opts: ["0", "0.5rem", "1rem", "999px"] },
];

const SIZE_STEPS: Array<{ label: string; value: string }> = [
  { label: "xs", value: "0.2rem" },
  { label: "sm", value: "0.225rem" },
  { label: "md", value: "0.25rem" },
  { label: "lg", value: "0.3rem" },
];

// Remaining real theme scalars (see SCALAR_TOKENS) — form chrome + feedback. Each
// step maps to a concrete token value; the board's inputs/focus/disabled preview
// them live.
const SCALAR_ROWS: Array<{ key: string; label: string; dflt: string; opts: Array<{ label: string; value: string }> }> = [
  {
    key: "--border", label: "Border width", dflt: "1px",
    opts: [{ label: "0", value: "0px" }, { label: "1", value: "1px" }, { label: "2", value: "2px" }],
  },
  {
    key: "--focus-width", label: "Focus ring", dflt: "2px",
    opts: [{ label: "off", value: "0px" }, { label: "2", value: "2px" }, { label: "4", value: "4px" }],
  },
  {
    key: "--disabled-opacity", label: "Disabled", dflt: "0.5",
    opts: [{ label: "40%", value: "0.4" }, { label: "50%", value: "0.5" }, { label: "70%", value: "0.7" }],
  },
];

// Theme-overridable UI typefaces (system-safe stacks — no webfont load). The
// picker writes `--font-sans`; headings either match the body or take a serif
// contrast via `--font-head` (which typography falls back from to --font-sans).
const FONT_STACKS: Array<{ label: string; value: string }> = [
  { label: "System", value: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { label: "Serif", value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: "Mono", value: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  { label: "Rounded", value: '"SF Pro Rounded", ui-rounded, "Hiragino Maru Gothic ProN", "Quicksand", system-ui, sans-serif' },
];
const SERIF_STACK = FONT_STACKS[1]!.value;

const last = (vals: string[], fallback: string): string => vals[vals.length - 1] ?? fallback;

export function ThemeEditor() {
  const editor = useEditor();
  const theme = useTheme();
  const mode: Mode = theme.mode === "dark" ? "dark" : "light";

  const [openColor, setOpenColor] = React.useState<string | null>(null);
  const [newColor, setNewColor] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const roles = rolesOf(theme);
  const surfaces = [...SURFACE_TOKENS];

  const setColor = (name: string, v: string) => editor.setTheme(withColor(theme, name, v, mode));
  const setToken = (key: string, v: string) => editor.setTheme(withToken(theme, key, v));
  const tokenOf = (key: string, dflt: string) => theme.tokens[key] ?? dflt;

  const addColor = () => {
    const name = newColor.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    if (!name) return;
    editor.setTheme(withColor(theme, name, "oklch(0.62 0.16 260)", mode));
    setNewColor("");
    setOpenColor(name);
  };

  const exportCss = async () => {
    try {
      await navigator.clipboard.writeText(themeToCss(theme));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="p-3.5 pb-8">
      <Input
        value={theme.name}
        onChange={(e) => editor.setTheme({ ...structuredClone(theme), name: e.target.value })}
        aria-label="Theme name"
        className="w-full font-semibold"
      />
      <div className="mt-2 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => editor.setTheme(randomizePalette(theme))}>
          <Icon name="shuffle" /> Random
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={exportCss}>
          <Icon name={copied ? "check" : "download"} /> {copied ? "Copied" : "CSS"}
        </Button>
      </div>

      <div className={GROUP}>
        <Icon name="droplet" /> Colors
        <span className="ml-auto normal-case tracking-normal font-medium text-xs">roles · contrast-safe</span>
      </div>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {surfaces.map((name) => {
          const isInk = name === "base-content";
          return (
            <ColorTile
              key={name}
              name={name}
              value={isInk ? resolveColor(theme, "base-100", mode) : resolveColor(theme, name, mode)}
              letterColor={isInk ? resolveColor(theme, name, mode) : undefined}
              showLetter={isInk}
              active={openColor === name}
              onClick={() => setOpenColor(openColor === name ? null : name)}
            />
          );
        })}
        {roles.map((name) => {
          const contentName = `${name}-content`;
          const baseValue = resolveColor(theme, name, mode);
          return (
            <React.Fragment key={name}>
              <ColorTile
                name={name}
                value={baseValue}
                active={openColor === name}
                custom={isCustomRole(name)}
                showLetter={false}
                onClick={() => setOpenColor(openColor === name ? null : name)}
              />
              <ColorTile
                name={contentName}
                value={baseValue}
                letterColor={resolveColor(theme, contentName, mode)}
                active={openColor === contentName}
                onClick={() => setOpenColor(openColor === contentName ? null : contentName)}
              />
            </React.Fragment>
          );
        })}
        <input
          className="w-full min-h-[44px] rounded-[10px] border border-dashed border-base-300 bg-transparent px-1 text-center text-xs font-semibold text-base-content/50 outline-none focus:border-solid focus:border-primary focus:text-base-content"
          placeholder="+ color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addColor();
            }
          }}
        />
      </div>

      {openColor && (
        <div className="mt-3 rounded-box border border-base-300 bg-base-100 p-2.5">
          <div className="mb-2.5 flex items-center gap-2 text-sm capitalize">
            <span
              className="size-[18px] rounded-md border border-black/15"
              style={{ background: resolveColor(theme, openColor, mode) }}
            />
            <b>{openColor}</b>
            <button
              type="button"
              onClick={() => setOpenColor(null)}
              aria-label="Close"
              className="ml-auto inline-flex rounded p-1 text-base-content/45 hover:bg-base-200 hover:text-base-content"
            >
              <Icon name="close" />
            </button>
          </div>
          <ColorPicker
            value={resolveColor(theme, openColor, mode)}
            format="oklch"
            onValueChange={(v) => setColor(openColor, v)}
          />
        </div>
      )}

      <div className={GROUP}>
        <Icon name="box" /> Radius
      </div>
      {RADIUS_ROWS.map((r) => (
        <div key={r.key} className="mb-2.5 flex items-center gap-2.5">
          <span className="w-[62px] text-sm text-base-content/70">{r.label}</span>
          <div className="flex gap-1.5">
            {r.opts.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setToken(r.key, o)}
                title={o === "0" ? "square" : o}
                className={`size-[30px] border bg-base-200 cursor-pointer ${
                  tokenOf(r.key, r.dflt) === o ? "border-primary ring-1 ring-inset ring-primary" : "border-base-300"
                }`}
                style={{ borderTopLeftRadius: o === "999px" ? "14px" : o }}
              />
            ))}
          </div>
        </div>
      ))}

      <div className={GROUP}>
        <Icon name="sliders" /> Effects
      </div>
      {[
        { key: "--depth", dflt: "1", tt: "Depth", ts: "3D depth on fields & selectors" },
        { key: "--noise", dflt: "0", tt: "Noise", ts: "Grain on surfaces" },
      ].map((e) => (
        <div key={e.key} className="flex items-center justify-between py-2.5 border-b border-base-200">
          <div>
            <div className="text-sm">{e.tt}</div>
            <div className="text-xs text-base-content/48">{e.ts}</div>
          </div>
          <Switch
            checked={tokenOf(e.key, e.dflt) !== "0"}
            onCheckedChange={(on: boolean) => setToken(e.key, on ? "1" : "0")}
          />
        </div>
      ))}

      <div className={GROUP}>
        <Icon name="sliders" /> Sizes
      </div>
      <div className="mb-1.5 text-sm font-semibold text-base-content/70">Field base size</div>
      <ToggleGroup
        className="toggle-group-sm"
        value={[tokenOf("--size-field", "0.25rem")]}
        onValueChange={(v: string[]) => v.length && setToken("--size-field", last(v, "0.25rem"))}
      >
        {SIZE_STEPS.map((s) => (
          <ToggleGroupItem key={s.label} value={s.value}>
            {s.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className={GROUP}>
        <Icon name="box" /> Form &amp; feedback
      </div>
      {SCALAR_ROWS.map((row) => (
        <div key={row.key} className="mb-2.5 flex items-center gap-2.5">
          <span className="w-[74px] text-sm text-base-content/70">{row.label}</span>
          <ToggleGroup
            className="toggle-group-sm"
            value={[tokenOf(row.key, row.dflt)]}
            onValueChange={(v: string[]) => v.length && setToken(row.key, last(v, row.dflt))}
          >
            {row.opts.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value}>
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ))}

      <div className={GROUP}>
        <Icon name="text" /> Type
      </div>
      <div className="mb-1.5 text-sm font-semibold text-base-content/70">Typeface</div>
      <ToggleGroup
        className="toggle-group-sm"
        value={[FONT_STACKS.find((f) => f.value === tokenOf("--font-sans", ""))?.label ?? "System"]}
        onValueChange={(v: string[]) => {
          if (!v.length) return;
          const pick = FONT_STACKS.find((f) => f.label === last(v, "System")) ?? FONT_STACKS[0]!;
          setToken("--font-sans", pick.value);
        }}
      >
        {FONT_STACKS.map((f) => (
          <ToggleGroupItem key={f.label} value={f.label}>
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="mt-3 mb-1.5 text-sm font-semibold text-base-content/70">Headings</div>
      <ToggleGroup
        className="toggle-group-sm"
        value={[/serif/.test(tokenOf("--font-head", "")) && !/var\(/.test(tokenOf("--font-head", "")) ? "Serif" : "Match"]}
        onValueChange={(v: string[]) => {
          if (!v.length) return;
          setToken("--font-head", last(v, "Match") === "Serif" ? SERIF_STACK : "var(--font-sans)");
        }}
      >
        <ToggleGroupItem value="Match">Match body</ToggleGroupItem>
        <ToggleGroupItem value="Serif">Serif</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
