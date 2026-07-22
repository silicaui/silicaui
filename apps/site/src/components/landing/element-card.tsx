import { Card } from "@wizeworks/silicaui-react";

/**
 * The Si·14 element tile — the hero's single focal visual and the same motif
 * the OG social images carry, so the page, the favicon, and every share preview
 * read as one brand.
 *
 * It is a real composition of silicaui + Tailwind, not an inline-painted mark:
 * the surface is a `Card`, the accent details read the ambient theme's `accent`
 * token, and the type comes off the plugin's scale (`text-9xl`, never a magic
 * `text-[Npx]`). Dropped inside the hero's `data-theme="dark"` island it resolves
 * to dark surfaces and the dark accent with no per-theme CSS — the library's own
 * claim, made by the hero's centrepiece.
 */
export function ElementCard() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-md">
        {/* A soft, accent-tinted bloom behind the tile so it reads as lit on the
            dark hero rather than a hairline outline on the same surface.
            Decorative (aria-hidden), token-driven (`bg-accent`), so it re-tints
            with the theme like everything else — never a hardcoded glow color. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 rounded-box bg-accent opacity-40 blur-2xl"
        />
        <Card className="aspect-square w-full justify-between bg-base-200 p-8 shadow-2xl md:p-10">
        {/* Atomic number + electron shells — the accent-tinted data fields. */}
        <div className="flex items-start justify-between gap-4">
          <span className="text-5xl font-semibold leading-none tracking-tight text-accent md:text-6xl">
            14
          </span>
          <span className="mono text-base text-accent">2 · 8 · 4</span>
        </div>

        {/* The symbol, dominant. */}
        <div className="flex flex-1 items-center justify-center">
          <span className="text-9xl font-semibold leading-none tracking-tight text-base-content">
            Si
          </span>
        </div>

        {/* Name + atomic mass. */}
        <div className="flex items-end justify-between gap-4">
          <span className="text-2xl font-semibold tracking-tight text-base-content md:text-3xl">
            Silicon
          </span>
          <span className="mono text-lg text-base-content">28.09</span>
        </div>
        </Card>
      </div>

      <p className="max-w-sm text-center text-base-content">
        Element 14 &mdash; the stuff every chip is etched into, and the foundation this
        library is named for.
      </p>
    </div>
  );
}
