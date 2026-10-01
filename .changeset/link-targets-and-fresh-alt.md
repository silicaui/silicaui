---
"@wizeworks/silicaui-builder": minor
---

Links and pictures in the site Inspector.

- New `BuilderHost.linkTargets()`: places a link may point that are not builder
  pages (a host's policy pages, products, collections). The link field offers them
  by name after the site's own pages. The field stays free text.
- The link field is labeled "Links to" instead of "URL".
- Picking a new picture for an image now replaces its alt text with the host's
  alt, or clears it. It used to keep the old picture's alt, which described the
  wrong picture and passed an alt-text check.
