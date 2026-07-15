---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
---

Media, icons, and rich-text/embed support for the framework-neutral renderer.

- **Video / audio**: `<video>` and `<audio>` now render through `toHtml` (added to the raw-element floor with their full attribute set — `poster`, `controls`, `autoplay`, `muted`, `loop`, `playsinline`, `preload`, sizing, `crossorigin`; `<source>` kept). New first-class **Video** component (palette + Inspector). Previously both coerced to `<div>`.
- **Icons on static pages**: `toHtml` now inlines an SVG glyph for `Icon` (`data-icon`) spans via a new `icons` resolver that **defaults to a bundled Lucide set**, so a published page is self-contained (no icon runtime/font). Pass a custom `Record<name, markup>` / function to override, or `icons: false` for the bare span. Core stays icon-agnostic; the builder canvas uses the same resolver (preview == production). Exported: `LUCIDE_ICONS`, `iconSvg`, `IconResolver`.
- **Data-bound trusted HTML**: new `DataBinding` kind `{ kind: "html"; ref }` and **RichText** component for CMS long-form / rich text. `resolveTree` fills a render-time `rawHtml` that `toHtml` emits unescaped — the host sanitizes the value at its data boundary (same trust model as `dangerouslySetInnerHTML`). Unresolved binds lower to an inert `data-sui-html` marker.
- **Embed**: new curated **Embed** component (YouTube / Vimeo / Google Maps) that emits a sandboxed `<iframe>` to an allowlisted host only, normalizing share URLs to their embed form; unknown hosts fall back to a link. `<iframe>` is still not in the raw-element floor — arbitrary authored iframes continue to downgrade to `<div>`.
- **Broader inline-SVG allowlist**: pasted logos/illustrations survive — added `defs`, `use`, `symbol`, `title`, `desc`, `ellipse`, `text`, `tspan`, `clipPath`, `mask`, `pattern`, `linearGradient`, `radialGradient`, `stop`, `image`, plus a shared presentation-attribute set. Security is unchanged: `script`/`style`/`foreignObject` still downgrade, `on*` fails closed, inline `style` is stripped, and `use`/gradient/pattern `href` is restricted to internal fragment references.
