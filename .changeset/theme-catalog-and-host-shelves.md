---
"@wizeworks/silicaui-builder": minor
"@wizeworks/silicaui-html": minor
---

Twenty real themes instead of four hue swaps, and a `themes()` seam so a platform can
offer its own.

**The preset catalog is now twenty complete looks.** The four shipped presets varied the
brand and status HUES over one shared neutral ramp, so picking a theme changed the color
of a button and nothing else — twenty variations of a single design. Each preset now
carries a palette, a type pairing, and a shape language (`--radius-selector`/`-field`/
`-box`, `--border`, `--depth`), because whether an interface reads as sharp and technical
or soft and friendly is decided by radius and line weight at least as much as by hue. A
preset states only the scalars it actually changes; the rest inherit @wizeworks/silicaui's
defaults. `quartz` deliberately inherits the default UI stack and is otherwise unchanged,
so a site already on it sees nothing move.

Presets are assembled through a `defineTheme` whose signature is the fix: `dark` is a full
palette, not a partial override bag. Three of the four shipped presets quietly stopped
short of restating theirs — `ocean` never restated a brand role at all, `grape` and
`sunset` restated only `primary` — and every unstated role fell THROUGH to its light
value, so `ocean` in dark mode painted a 38%-lightness neutral fill onto a 21% surface.
Requiring the whole palette makes that a type error rather than something you notice in a
screenshot.

`verify-theme-presets.mjs` (now in `pnpm verify`) pins what no role check reaches:
completeness in both modes, body text on the full surface ramp against WCAG AA
(`base-content` is not a role, so `contrastWarnings` never measured it — a theme could
pass every role check with unreadable prose), that the ramp steps in one direction rather
than doubling back, that shape and type live only in the light bag, and that every font
row matches the builder's real Google catalog. That last one matters because `FACE` in
`themes.ts` hardcodes the stack and weights the theme editor's Google option produces —
the catalog lives DOWNSTREAM in the builder and the schema package must not import it, so
the duplication is deliberate and this is what keeps it honest.

**`BuilderHost.themes()` — the third shelf.** The Themes panel had two tiers and a
platform could reach neither: "This site" is `site.savedThemes`, real document data one
click from deletion and scoped to a single site, and the presets shelf was a hard import
of `THEME_PRESETS`. A host embedding the builder across many tenants, with a brand catalog
it maintains centrally, had nowhere to put it — seeding `savedThemes` is the wrong shelf
twice over, handing the author a delete button on the platform's brand and copying the
catalog into every site.

`themes()` takes the same merge shape as `catalog()`: `extend` adds labeled shelves,
rendered above the shipped presets and apply-only; `hide` prunes SHIPPED entries by preset
name, by the shipped shelf key (`SHIPPED_THEMES_KEY`), or `HIDE_ALL_SHIPPED` (`"*"`) for
the white-label case. `hide` never touches the host's own `extend` — a host passing `"*"`
means "only mine", and having that erase its own catalog would be an absurd reading. A
host theme whose name matches a shipped preset shadows it (host wins, logged once): the
name IS the `[data-theme]` value, so two token bags cannot share one, and dropping a row
silently is the class of degradation that reads as a mystery later.

Applying COPIES the theme into the document, so a site that adopts a host preset holds a
snapshot and later upstream edits do not reach it. That is deliberate — the author can
edit an applied theme and a live overwrite would discard their work mid-session — but a
host's own UI must not promise propagation, so it is stated in `docs/builder-contract.md`
rather than left to be discovered.

`themeShelves`, `shippedThemeGroups`, `SHIPPED_THEMES_KEY`, `HIDE_ALL_SHIPPED` and the
`ThemeGroup`/`ThemeContribution` types are exported from `@wizeworks/silicaui-builder`;
`probe-themes.ts` (`pnpm verify:themes`) pins the merge rules and the harness host carries
a demo shelf the `host-seam` e2e drives end to end.
