/**
 * The Themes library (right panel in Theme mode). Three sections, matching how a
 * site theme actually lives: THIS SITE — the saved-theme library you snapshot the
 * current edit into (apply / delete); SILICAUI PRESETS — the shipped starting
 * points; OUTPUT — export the active theme as the same `[data-theme]` CSS silicaui
 * emits. Styled ONLY with Tailwind + silicaui classes; every glyph is a baked
 * `<Icon>`. Applying/saving routes through the engine so editor + board repaint.
 */
import * as React from "react";
import type { Theme } from "silicaui-html";
import { THEME_PRESETS, colorValue } from "silicaui-html";
import { useEditor, useTheme, useSavedThemes } from "./editor-context";
import { themeToCss } from "../theme-ops";
import { Icon } from "./Icon";

/** Four identity dots for a theme (primary/secondary/accent + a surface). */
function dots(theme: Theme): string[] {
  const pick = (n: string) => colorValue(theme, n, "light") ?? "transparent";
  return [pick("primary"), pick("secondary"), pick("accent"), pick("base-200")];
}

const SUBHEAD = "flex items-center gap-1.5 px-3.5 pt-3.5 pb-1.5 text-xs font-bold uppercase tracking-wider text-base-content/45";

/** A theme row — dot swatches + name + trailing slot (check / delete). */
function ThemeRow({
  theme, active, onApply, trailing,
}: {
  theme: Theme; active: boolean; onApply: () => void; trailing?: React.ReactNode;
}) {
  return (
    <div
      className={`group flex items-center gap-2.5 rounded-lg pr-1.5 ${active ? "bg-primary/10" : "hover:bg-base-200"}`}
    >
      <button type="button" onClick={onApply} className="flex flex-1 items-center gap-2.5 px-2.5 py-2 text-left">
        <span className="grid grid-cols-2 gap-0.5">
          {dots(theme).map((c, i) => (
            <i key={i} className="size-2.5 rounded-[2px] border border-black/10" style={{ background: c }} />
          ))}
        </span>
        <span className={`text-sm capitalize ${active ? "font-semibold text-primary" : ""}`}>{theme.name}</span>
      </button>
      {trailing}
    </div>
  );
}

export function ThemeLibrary() {
  const editor = useEditor();
  const theme = useTheme();
  const saved = useSavedThemes();
  const [copied, setCopied] = React.useState(false);

  // "Dirty" when the current edit differs from its saved snapshot (or was never
  // saved) — compare the token bags, ignoring the light/dark preview toggle.
  const sameBag = (a: Record<string, string> = {}, b: Record<string, string> = {}) => {
    const ak = Object.keys(a);
    return ak.length === Object.keys(b).length && ak.every((k) => a[k] === b[k]);
  };
  const snapshot = saved.find((t) => t.name === theme.name);
  const dirty = !snapshot || !sameBag(snapshot.tokens, theme.tokens) || !sameBag(snapshot.dark, theme.dark);

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
    <div className="pb-6">
      <div className={SUBHEAD}>
        <Icon name="theme" /> This site
        <button
          type="button"
          onClick={() => editor.saveTheme()}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold normal-case tracking-normal text-primary hover:bg-primary/10"
        >
          <Icon name={dirty ? "plus" : "check"} /> {dirty ? "Save current" : "Saved"}
        </button>
      </div>
      <div className="px-2">
        {saved.map((t) => (
          <ThemeRow
            key={t.name}
            theme={t}
            active={theme.name === t.name}
            onApply={() => editor.applySavedTheme(t.name)}
            trailing={
              saved.length > 1 ? (
                <button
                  type="button"
                  onClick={() => editor.deleteSavedTheme(t.name)}
                  aria-label={`Delete ${t.name}`}
                  title={`Delete ${t.name}`}
                  className="inline-flex rounded p-1 text-base-content/40 opacity-0 hover:bg-base-300 hover:text-error group-hover:opacity-100"
                >
                  <Icon name="close" />
                </button>
              ) : undefined
            }
          />
        ))}
      </div>

      <div className={SUBHEAD}>silicaui presets</div>
      <div className="px-2">
        {THEME_PRESETS.map((p) => (
          <ThemeRow
            key={p.name}
            theme={p}
            active={theme.name === p.name}
            onApply={() => editor.setTheme({ ...structuredClone(p), mode: theme.mode })}
            trailing={theme.name === p.name ? <Icon name="check" className="mr-1 text-primary" /> : undefined}
          />
        ))}
      </div>

      <div className={SUBHEAD}>Output</div>
      <button
        type="button"
        onClick={exportCss}
        className="mx-3.5 flex h-9 w-[calc(100%-1.75rem)] items-center justify-center gap-2 rounded-lg border border-base-300 bg-base-200 text-sm font-semibold text-base-content/80 hover:border-primary hover:text-primary"
      >
        <Icon name={copied ? "check" : "download"} /> {copied ? "Copied to clipboard" : "Export theme as CSS"}
      </button>
      <div className="mx-3.5 mt-2 text-xs leading-relaxed text-base-content/45">
        OKLCH <code className="font-mono text-base-content/60">--color-*</code> custom properties on{" "}
        <code className="font-mono text-base-content/60">[data-theme]</code>. Sparx emits them directly.
      </div>
    </div>
  );
}
