/**
 * Build-time Open Graph image generation. Runs BEFORE `next build` (see the
 * site's `build` script), emitting one 1200×630 PNG per page into `public/og/`,
 * which the static export then copies verbatim into `out/`.
 *
 * Why a prebuild script and not an edge `opengraph-image` route: this site is a
 * static export (`output: "export"`), so the edge `ImageResponse` runtime isn't
 * available. satori (HTML-ish → SVG) + resvg (SVG → PNG) are pure JS, need no
 * browser, and run in any CI in milliseconds per image. Both are build-only
 * devDependencies — nothing here ships to a library consumer.
 *
 * The card leads with the brand's signature Si·14 periodic-element tile
 * (silicon → silica → SilicaUI), the page title on the left, and a row of real,
 * vibrantly-colored components across the bottom — the color × variant story
 * the library actually sells. Flat color only, no gradients.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { DEMO_META } from "@wizeworks/silicaui-demos/meta";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "og");
mkdirSync(outDir, { recursive: true });

const fontRegular = readFileSync(join(here, "fonts", "inter-400.woff"));
const fontBold = readFileSync(join(here, "fonts", "inter-700.woff"));

// Literal hex is correct here: an OG image is rasterized outside the document
// and can't resolve CSS custom properties — the sanctioned literal-color
// context (CLAUDE.md). The vibrant chips stand in for the OKLCH token system.
const BG = "#0B1017";
const PANEL = "#141C27";
const SLATE = "#33475F";
const INK = "#F5F8FB";
const MUTED = "#8DA0B5";
const ACCENT = "#5FD3E4";

// The component showcase — one styled "button" per palette role, exactly the
// color × variant story the library sells. Solid, bright, with real labels.
const SWATCHES = [
  { label: "Primary", bg: "#3B82F6", fg: "#ffffff" },
  { label: "Secondary", bg: "#8B5CF6", fg: "#ffffff" },
  { label: "Accent", bg: "#06B6D4", fg: "#062a30" },
  { label: "Success", bg: "#10B981", fg: "#04241b" },
  { label: "Warning", bg: "#F59E0B", fg: "#3d2a02" },
  { label: "Danger", bg: "#EF4444", fg: "#ffffff" },
];

/** Tiny hyperscript for satori's React-element-shaped nodes. Falsy children are
 *  dropped; a lone child is passed directly (satori treats an array child —
 *  even length 1 — as "multiple children" and then demands display:flex). */
function h(type, props = {}, ...children) {
  const kids = children.flat().filter(Boolean);
  return { type, props: { ...props, children: kids.length === 1 ? kids[0] : kids } };
}

function pill({ label, bg, fg, outline }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "64px",
        padding: "0 26px",
        borderRadius: "15px",
        fontSize: "25px",
        fontWeight: 600,
        color: outline ? INK : fg,
        backgroundColor: outline ? "transparent" : bg,
        border: outline ? "2px solid #33414F" : "none",
        boxShadow: outline ? "none" : "0 10px 28px rgba(0,0,0,0.35)",
      },
    },
    label,
  );
}

/** The signature mark as a real periodic-table element cell: atomic number,
 *  symbol, name, and standard atomic weight for silicon (element 14). */
function elementCard() {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "300px",
        height: "340px",
        padding: "26px",
        borderRadius: "28px",
        backgroundColor: SLATE,
        border: `2px solid ${ACCENT}55`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
      },
    },
    h("div", { style: { display: "flex", fontSize: "30px", fontWeight: 600, color: ACCENT } }, "14"),
    h(
      "div",
      { style: { display: "flex", justifyContent: "center", fontSize: "150px", fontWeight: 700, color: INK, lineHeight: 1 } },
      "Si",
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "4px" } },
      h("div", { style: { display: "flex", fontSize: "34px", fontWeight: 700, color: INK } }, "Silicon"),
      h("div", { style: { display: "flex", fontSize: "23px", color: MUTED } }, "28.09"),
    ),
  );
}

/** The card: title + wordmark on the left, the Si·14 element tile on the right,
 *  and the vibrant component row across the bottom. */
function card({ title, subtitle }) {
  return h(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: BG,
        padding: "64px",
        fontFamily: "Inter",
      },
    },
    // Top: left text column + right element tile.
    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "18px", width: "700px" } },
        h("div", { style: { display: "flex", fontSize: "34px", fontWeight: 700, color: MUTED } }, "SilicaUI"),
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: title.length > 24 ? "62px" : "84px",
              fontWeight: 700,
              color: INK,
              lineHeight: 1.03,
              letterSpacing: "-0.025em",
            },
          },
          title,
        ),
        h(
          "div",
          { style: { display: "flex", fontSize: "29px", color: MUTED, lineHeight: 1.3 } },
          subtitle,
        ),
      ),
      elementCard(),
    ),
    // Bottom: the color × variant showcase on a subtle panel.
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "15px",
          padding: "20px",
          borderRadius: "22px",
          backgroundColor: PANEL,
        },
      },
      ...SWATCHES.map((s) => pill(s)),
      pill({ label: "Outline", outline: true }),
    ),
  );
}

async function render(node) {
  const svg = await satori(node, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
      { name: "Inter", data: fontBold, weight: 700, style: "normal" },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

async function write(name, node) {
  writeFileSync(join(outDir, `${name}.png`), await render(node));
}

async function main() {
  await write(
    "default",
    card({
      title: "The CSS-first Tailwind component library",
      subtitle: "Base UI behavior · OKLCH tokens · React, HTML & vanilla JS.",
    }),
  );

  let n = 0;
  for (const c of DEMO_META) {
    await write(
      c.id,
      // No eyebrow over the title (CLAUDE.md RULE #2).
      card({
        title: c.title,
        subtitle: "Every color, variant, size & shape — from tokens.",
      }),
    );
    n++;
  }
  console.log(`gen-og: wrote ${n + 1} OG images to public/og/`);
}

main().catch((err) => {
  console.error("gen-og failed:", err);
  process.exit(1);
});
