/**
 * Editor-time Google Font preview — injects a <link> into document.head so the
 * live canvas (no iframe, so this reaches the real page) shows a picked webfont
 * immediately. Editor-only: published output must never hotlink Google's CDN
 * (see @wizeworks/silicaui-fonts' selfHostGoogleFonts for the publish-time path).
 */
const LINK_ID_PREFIX = "silicaui-google-font-preview-";

function linkId(family: string): string {
  return LINK_ID_PREFIX + family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function loadGoogleFontPreview(family: string, weights: readonly number[]): void {
  if (typeof document === "undefined") return;
  const id = linkId(family);
  if (document.getElementById(id)) return; // already loaded this session
  const query = `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weights.join(";")}&display=swap`;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${query}`;
  document.head.appendChild(link);
}
