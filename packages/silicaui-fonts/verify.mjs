// Runnable proof of selfHostGoogleFonts against the REAL Google Fonts API — no
// mocks, since the whole point is fetching real files. Requires network access;
// if this environment can't reach fonts.googleapis.com, verify manually instead.
// Run against the built output: `pnpm build && node verify.mjs`.
import { selfHostGoogleFonts } from "./dist/index.js";

let failures = 0;
function check(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

// ── no Google selections: zero network calls, empty result ─────────────────
{
  const result = await selfHostGoogleFonts([{ family: "System", source: "system" }]);
  check("system-only selections: no CSS, no files", result.css === "" && result.files.length === 0);
}

// ── a real Google Font: fetches css2 + downloads the actual files ──────────
{
  const result = await selfHostGoogleFonts([{ family: "Inter", source: "google", weights: [400, 700] }]);
  check("returns non-empty @font-face CSS", result.css.includes("@font-face"));
  check("downloaded at least one file per weight", result.files.length >= 2);
  check("every file has real bytes", result.files.every((f) => f.bytes.byteLength > 1000));
  check("CSS references the font family", result.css.includes("Inter"));
  check(
    "each file's googleUrl is a real gstatic.com identity, regardless of mapUrl",
    result.files.every((f) => f.googleUrl.startsWith("https://fonts.gstatic.com/")),
  );
}

// ── mapUrl rewrites the CSS to the host's own destination ──────────────────
{
  const result = await selfHostGoogleFonts([{ family: "Roboto", source: "google", weights: [400] }], {
    mapUrl: (googleUrl) => `https://cdn.example.com/fonts/${googleUrl.split("/").pop()}`,
  });
  check("CSS is rewritten to the mapped URL", result.css.includes("cdn.example.com/fonts/"));
  check("CSS no longer references the original gstatic URL", !result.css.includes("fonts.gstatic.com"));
}

console.log(failures === 0 ? "\nAll selfHostGoogleFonts checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
