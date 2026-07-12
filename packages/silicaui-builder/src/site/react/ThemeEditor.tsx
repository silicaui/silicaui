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
import {
  ColorPicker,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  Input,
  Button,
  Combobox,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Textarea,
} from "@wizeworks/silicaui-react";
import { useEditor, useTheme, useStudioTheme } from "./editor-context";
import { randomizePalette, themeToCss, isCustomRole, cssToTheme, sanitizeThemeName } from "../theme-ops";
import { Icon } from "../../shared/react/Icon";
import { googleFontsCatalog } from "./google-fonts-catalog";
import { loadGoogleFontPreview } from "./google-fonts-loader";

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

// Theme-overridable UI typefaces. A font PICK is one of: a system-safe stack (no
// webfont load), a Google Font (loaded live for editor preview via a <link>; the
// exact family + weights are also recorded on `theme.fonts` so a host can self-host
// the real files at publish time — see docs on `Theme.fonts`/`ThemeFontSelection`
// and @wizeworks/silicaui-fonts' selfHostGoogleFonts), or — for headings only — the
// "Match body" pseudo-pick that just points `--font-head` at `--font-sans`.
interface FontOption {
  label: string;
  source: "system" | "google";
  /** The full CSS `font-family` value to write into the theme token. */
  cssStack: string;
  /** Weights to load/self-host — only meaningful for a Google source. */
  weights?: number[];
}

const SYSTEM_OPTIONS: FontOption[] = [
  { label: "System", source: "system", cssStack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { label: "Serif", source: "system", cssStack: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: "Mono", source: "system", cssStack: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  { label: "Rounded", source: "system", cssStack: '"SF Pro Rounded", ui-rounded, "Hiragino Maru Gothic ProN", "Quicksand", system-ui, sans-serif' },
];
const MATCH_BODY_OPTION: FontOption = { label: "Match body", source: "system", cssStack: "var(--font-sans)" };

/** A CSS generic family to fall back on while a Google Font's real file loads. */
function genericFallback(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("mono")) return "monospace";
  if (c.includes("handwriting") || c.includes("script")) return "cursive";
  if (c.includes("serif") && !c.includes("sans")) return "serif";
  return "sans-serif";
}

/** Regular/semibold/bold when the family has them; else its first 3 weights. */
function pickWeights(available: readonly number[]): number[] {
  const desired = [400, 600, 700].filter((w) => available.includes(w));
  return desired.length ? desired : available.slice(0, 3);
}

// Computed once at module load — the catalog is a static import, not theme state.
const GOOGLE_OPTIONS: FontOption[] = googleFontsCatalog.map((f) => ({
  label: f.family,
  source: "google",
  cssStack: `"${f.family}", ${genericFallback(f.category)}`,
  weights: pickWeights(f.weights),
}));
const BODY_OPTIONS: FontOption[] = [...SYSTEM_OPTIONS, ...GOOGLE_OPTIONS];
const HEADING_OPTIONS: FontOption[] = [MATCH_BODY_OPTION, ...SYSTEM_OPTIONS, ...GOOGLE_OPTIONS];
const BODY_LABELS = BODY_OPTIONS.map((o) => o.label);
const HEADING_LABELS = HEADING_OPTIONS.map((o) => o.label);

/** The option a theme's current token/`fonts` selection resolves to. Prefers the
 *  structured `theme.fonts` record (unambiguous); falls back to matching the raw
 *  CSS token against the known system stacks for themes saved before that field
 *  existed; an unrecognized custom string shows as its own read-only label so it
 *  never crashes, it just won't highlight any option in the list. */
function currentFontOption(theme: Theme, key: "sans" | "head", cssVar: string, options: FontOption[]): FontOption {
  const picked = theme.fonts?.[key];
  if (picked) {
    const found = options.find((o) => o.source === "google" && o.label === picked.family);
    if (found) return found;
  }
  const raw = theme.tokens[cssVar] ?? "";
  const match = options.find((o) => o.cssStack === raw);
  if (match) return match;
  return raw ? { label: `Custom (${raw})`, source: "system", cssStack: raw } : options[0]!;
}

function withFont(theme: Theme, key: "sans" | "head", cssVar: string, option: FontOption): Theme {
  const next = structuredClone(theme);
  next.tokens = { ...next.tokens, [cssVar]: option.cssStack };
  const fonts = { ...(next.fonts ?? {}) };
  if (option.source === "google") fonts[key] = { family: option.label, source: "google", weights: option.weights };
  else delete fonts[key];
  next.fonts = Object.keys(fonts).length ? fonts : undefined;
  return next;
}

const last = (vals: string[], fallback: string): string => vals[vals.length - 1] ?? fallback;

export function ThemeEditor() {
  const editor = useEditor();
  const theme = useTheme();
  const studioTheme = useStudioTheme();
  const mode: Mode = theme.mode === "dark" ? "dark" : "light";

  const [openColor, setOpenColor] = React.useState<string | null>(null);
  const [newColor, setNewColor] = React.useState("");
  const [cssOpen, setCssOpen] = React.useState(false);
  const [cssText, setCssText] = React.useState("");
  const [cssError, setCssError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [applied, setApplied] = React.useState(false);

  const roles = rolesOf(theme);
  const surfaces = [...SURFACE_TOKENS];

  const setColor = (name: string, v: string) => editor.setTheme(withColor(theme, name, v, mode));
  const setToken = (key: string, v: string) => editor.setTheme(withToken(theme, key, v));
  const tokenOf = (key: string, dflt: string) => theme.tokens[key] ?? dflt;

  const setFont = (key: "sans" | "head", cssVar: string, option: FontOption) => {
    editor.setTheme(withFont(theme, key, cssVar, option));
    if (option.source === "google") loadGoogleFontPreview(option.label, option.weights ?? [400, 700]);
  };

  const addColor = () => {
    const name = newColor.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    if (!name) return;
    editor.setTheme(withColor(theme, name, "oklch(0.62 0.16 260)", mode));
    setNewColor("");
    setOpenColor(name);
  };

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(cssText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  const applyCss = () => {
    const result = cssToTheme(cssText);
    if (!result.ok) {
      setCssError(result.reason);
      return;
    }
    const fonts = { ...(theme.fonts ?? {}) };
    if (theme.tokens["--font-sans"] !== result.tokens["--font-sans"]) delete fonts.sans;
    if (theme.tokens["--font-head"] !== result.tokens["--font-head"]) delete fonts.head;
    editor.setTheme({
      ...structuredClone(theme),
      name: result.name,
      tokens: result.tokens,
      dark: result.dark,
      fonts: Object.keys(fonts).length ? fonts : undefined,
    });
    setCssError(null);
    setApplied(true);
    setTimeout(() => setApplied(false), 1400);
  };

  const resetCss = () => {
    setCssText(themeToCss(theme));
    setCssError(null);
  };

  return (
    <div className="p-3.5 pb-8">
      <Input
        value={theme.name}
        onChange={(e) => editor.setTheme({ ...structuredClone(theme), name: sanitizeThemeName(e.target.value) })}
        aria-label="Theme name"
        className="w-full font-semibold"
      />
      <div className="mt-2 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => editor.setTheme(randomizePalette(theme))}>
          <Icon name="shuffle" /> Random
        </Button>
        <Dialog
          open={cssOpen}
          onOpenChange={(o: boolean) => {
            setCssOpen(o);
            if (o) {
              setCssText(themeToCss(theme));
              setCssError(null);
            }
          }}
        >
          <DialogTrigger>
            <Button variant="outline" size="sm" className="flex-1">
              <Icon name="download" /> CSS
            </Button>
          </DialogTrigger>
          <DialogContent data-theme={studioTheme} className="w-[min(560px,94vw)] max-h-[82vh] overflow-hidden flex flex-col p-5">
            <DialogTitle>Theme CSS</DialogTitle>
            <DialogDescription>
              Custom-property declarations only — no other selectors, at-rules, or comments. Delete a line to remove that
              token from the theme.
            </DialogDescription>
            <Textarea
              value={cssText}
              onChange={(e) => {
                setCssText(e.target.value);
                setCssError(null);
              }}
              rows={16}
              spellCheck={false}
              className="mt-3 flex-1 font-mono text-xs resize-none"
              aria-label="Theme CSS"
            />
            {cssError && <p className="mt-2 text-xs text-error">{cssError}</p>}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={resetCss}>
                <Icon name="undo" /> Reset
              </Button>
              <Button variant="outline" size="sm" className="ml-auto" onClick={copyCss}>
                <Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" onClick={applyCss}>
                <Icon name={applied ? "check" : "upload"} /> {applied ? "Applied" : "Apply"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
        { key: "--depth", dflt: "1", tt: "Depth", ts: "Shadow on cards & buttons" },
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
        <span className="ml-auto normal-case tracking-normal font-medium text-xs">
          {GOOGLE_OPTIONS.length}+ Google Fonts
        </span>
      </div>
      <div className="mb-1.5 text-sm font-semibold text-base-content/70">Typeface</div>
      <Combobox
        size="sm"
        items={BODY_LABELS}
        value={currentFontOption(theme, "sans", "--font-sans", BODY_OPTIONS).label}
        onValueChange={(v) => {
          const pick = BODY_OPTIONS.find((o) => o.label === v);
          if (pick) setFont("sans", "--font-sans", pick);
        }}
        popupProps={{ "data-theme": studioTheme }}
        aria-label="Body typeface"
      />
      <div className="mt-3 mb-1.5 text-sm font-semibold text-base-content/70">Headings</div>
      <Combobox
        size="sm"
        items={HEADING_LABELS}
        value={currentFontOption(theme, "head", "--font-head", HEADING_OPTIONS).label}
        onValueChange={(v) => {
          const pick = HEADING_OPTIONS.find((o) => o.label === v);
          if (pick) setFont("head", "--font-head", pick);
        }}
        popupProps={{ "data-theme": studioTheme }}
        aria-label="Heading typeface"
      />
    </div>
  );
}
