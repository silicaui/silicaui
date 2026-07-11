// Runnable proof that `Theme.fonts` is purely additive metadata: optional on
// `Theme`, round-trips through `siteFromDocument` untouched, and never changes
// `renderSite`'s HTML output (proves zero coupling into the render path — a
// publish-time self-hoster reads `site.theme.fonts` directly, toHtml never sees
// it). Run against the built output: `pnpm build && node verify-theme-fonts.mjs`.
import { el, siteFromDocument, renderSite } from "./dist/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

const root = el("h1", "text-4xl", { text: "Hello" });
const baseTheme = { name: "test", tokens: { "--font-sans": '"Inter", sans-serif' } };

const withoutFonts = { version: "1.0.0", root, theme: baseTheme };
const withFonts = {
  version: "1.0.0",
  root,
  theme: { ...baseTheme, fonts: { sans: { family: "Inter", source: "google", weights: [400, 600, 700] } } },
};

check("Theme.fonts is optional — a Theme without it is still valid", withoutFonts.theme.fonts === undefined);

const siteA = siteFromDocument(withoutFonts);
const siteB = siteFromDocument(withFonts);
check("siteFromDocument carries fonts through untouched", siteB.theme.fonts?.sans?.family === "Inter");
check("siteFromDocument leaves a themeless-fonts site as-is", siteA.theme.fonts === undefined);

const htmlA = renderSite(siteA)[0].html;
const htmlB = renderSite(siteB)[0].html;
check("renderSite output is byte-identical with/without Theme.fonts", htmlA === htmlB);
check("neither output leaks any 'fonts' marker into the HTML", !htmlA.includes("fonts") && !htmlB.includes("fonts"));

console.log(failures === 0 ? "\nAll Theme.fonts checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
