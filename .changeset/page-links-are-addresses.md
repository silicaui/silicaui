---
"@wizeworks/silicaui-builder": patch
---

Page links in the site Inspector are addresses.

- The link field offers each builder page as an address ("/contact", and "/" for
  Home) instead of its bare slug. A bare slug is a relative link: "contact" on a
  page at /blog/a-post goes to /blog/contact.
- Record templates ("/products/:handle") are no longer offered as link targets;
  their address has a hole in it.
- `Editor.linksTo(slug)` counts a link by the address it points at, so "/contact"
  counts for a page whose slug is "contact" (the delete prompt said 0 links).
- New exports: `pageHref`, `isTemplateSlug`, `linksToPage`.
