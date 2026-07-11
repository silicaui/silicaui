# @wizeworks/silicaui-fonts

Publish-time Google Fonts self-hosting for sites built with `@wizeworks/silicaui-builder`.

The site builder's Theme editor lets an author pick from ~1900 Google Fonts. For
**live editor preview**, the builder loads the picked font straight from Google's
CDN — fine, since that's an internal tool, not published output. But **published
sites must not hotlink Google's CDN**: doing so leaks every visitor's IP to Google
without consent, and EU courts have fined sites for exactly that. This package is
the other half — a Node-only utility your own backend calls at publish/deploy time
to fetch the real font files and self-host them from your own origin instead.

## Usage

```ts
import { selfHostGoogleFonts } from "@wizeworks/silicaui-fonts";

// In your onPublish handler:
async function onPublish({ site, pages }) {
  const selections = [site.theme.fonts?.sans, site.theme.fonts?.head].filter(Boolean);
  const { css, files } = await selfHostGoogleFonts(selections, {
    // Store `bytes` wherever you like, then return the URL it'll be served from.
    mapUrl: (googleUrl, bytes) => uploadToYourCdn(bytes, googleUrl.split("/").pop()),
  });

  // `css` now contains @font-face rules pointing at YOUR URLs, not Google's.
  // Inject it into your document template's <head> alongside `pages[].html`.
}
```

`selections` with `source: "system"` are ignored (nothing to self-host — they're
already a plain CSS stack with no webfont). Passing no Google selections returns
`{css: "", files: []}` with zero network calls.

## Why not just use `mapUrl`-less mode and hotlink Google directly?

You can — omit `mapUrl` and the returned `css` still points at Google's original
file URLs — but that's the exact pattern this package exists to help you avoid for
real published sites. It's a reasonable choice ONLY for a non-public preview/staging
environment where the privacy consideration doesn't apply.
