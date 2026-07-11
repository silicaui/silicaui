/**
 * Publish-time Google Fonts self-hosting. Node-only, server-side — a host's
 * backend calls this after `onPublish` fires (see @wizeworks/silicaui-builder's
 * `PublishPayload.site.theme.fonts`), never the builder itself. Published output
 * must not hotlink Google's CDN directly (EU courts have fined sites for the
 * visitor-IP leak this causes without consent) — this fetches the real font
 * files once so a host can serve them from its own origin instead. The builder's
 * OWN live editor preview loads Google's CDN directly (see silicaui-builder's
 * `google-fonts-loader.ts`) — that's a fine, unrelated use, since it's an
 * internal tool, not published output.
 */
import type { ThemeFontSelection } from "@wizeworks/silicaui-html";

export interface SelfHostedFont {
  /** The original Google-hosted URL this file came from — a stable identity you
   *  can use for caching/dedup across publishes. */
  googleUrl: string;
  /** A reasonable filename derived from the Google URL, e.g. "inter-latin-400.woff2". */
  filename: string;
  bytes: Uint8Array;
}

export interface SelfHostGoogleFontsResult {
  /** @font-face CSS ready to embed in your document's <head> (as a <style> or a
   *  file you serve). Its `url(...)` references point at whatever `mapUrl`
   *  returned for each file — or Google's original URLs if `mapUrl` was omitted. */
  css: string;
  files: SelfHostedFont[];
}

export interface SelfHostGoogleFontsOptions {
  /**
   * Called once per downloaded font file — return the URL it will be served from
   * once you've stored `bytes` at your own destination (S3, a public dir, a CDN).
   * That URL is what gets written into the returned CSS's `src: url(...)`. Omit
   * to keep Google's original file URLs in the CSS — fine for editor-time use,
   * but defeats the purpose for published output (see the module doc above).
   */
  mapUrl?: (googleUrl: string, bytes: Uint8Array) => string;
  /** Forwarded as the User-Agent on the css2 API request — Google varies which
   *  font format it returns by UA; the default gets modern woff2 files. */
  userAgent?: string;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const GSTATIC_URL = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;

/**
 * Fetch Google's css2 API for the given theme font selections, download every
 * referenced font file, and return ready-to-embed `@font-face` CSS + the raw
 * file bytes. Non-Google selections (system stacks) are ignored — nothing to
 * self-host there. Returns `{css: "", files: []}` if nothing needs hosting.
 */
export async function selfHostGoogleFonts(
  selections: readonly ThemeFontSelection[],
  opts: SelfHostGoogleFontsOptions = {},
): Promise<SelfHostGoogleFontsResult> {
  const googleSelections = selections.filter((s) => s.source === "google");
  if (googleSelections.length === 0) return { css: "", files: [] };

  const familyParams = googleSelections
    .map((s) => {
      const weights = s.weights?.length ? [...new Set(s.weights)].sort((a, b) => a - b) : undefined;
      const suffix = weights ? `:wght@${weights.join(";")}` : "";
      return `family=${encodeURIComponent(s.family)}${suffix}`;
    })
    .join("&");
  const cssUrl = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;

  const cssRes = await fetch(cssUrl, { headers: { "User-Agent": opts.userAgent ?? DEFAULT_USER_AGENT } });
  if (!cssRes.ok) throw new Error(`Google Fonts css2 request failed (${cssRes.status}): ${cssUrl}`);
  const rawCss = await cssRes.text();

  const files: SelfHostedFont[] = [];
  const finalUrlByGoogleUrl = new Map<string, string>();

  for (const match of rawCss.matchAll(GSTATIC_URL)) {
    const googleUrl = match[1]!;
    if (finalUrlByGoogleUrl.has(googleUrl)) continue;

    const fileRes = await fetch(googleUrl);
    if (!fileRes.ok) throw new Error(`Font file fetch failed (${fileRes.status}): ${googleUrl}`);
    const bytes = new Uint8Array(await fileRes.arrayBuffer());
    const filename = googleUrl.split("/").pop() || `${crypto.randomUUID()}.woff2`;

    files.push({ googleUrl, filename, bytes });
    finalUrlByGoogleUrl.set(googleUrl, opts.mapUrl ? opts.mapUrl(googleUrl, bytes) : googleUrl);
  }

  let css = rawCss;
  for (const [googleUrl, finalUrl] of finalUrlByGoogleUrl) css = css.split(googleUrl).join(finalUrl);

  return { css, files };
}
