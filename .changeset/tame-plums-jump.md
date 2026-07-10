---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": minor
---

`DataBinding`'s `value` kind gains an optional `attr?: string`. When set, `resolveTree`'s `fillValue` writes the resolved value onto exactly that attribute (element) or prop (component) — e.g. a product card's own `<a>` binding `href` — instead of relying on the auto-detected primary slot (which only ever covered `img`/`source`→`src`, `input`→`value`, and a component's `label`/`text`/`src`). Omitting `attr` keeps today's auto-detection unchanged.

The site builder's Inspector gains a "Target attribute" field on `value` bindings, next to the existing kind/reference picker, following the same pattern as the `action` kind's "Fallback href".
