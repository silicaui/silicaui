---
"@wizeworks/silicaui-builder": patch
---

Theme Component board: fix the Typography specimen's inverted, compressed ramp

The board's Typography card carried hardcoded `text-*` utilities on its type
components — `text-xl` on the `<h1>` and `text-3xl` on the `<Display>`. Those
magic sizes overrode each component's designed step, so "Heading one" rendered at
20px (**below** the 24px "Heading three"), the display barely cleared the
headings, and the broken hierarchy made a picked heading font look like it wasn't
applying at all — even though it was.

Removed the overrides so every step carries its real ramp size, weight, and
tracking (and the theme's `--font-head`), and set the display to `size={1}` so it
reads as the head of the ramp in the narrow, container-queried card. The specimen
now descends cleanly (display › h1 › h3 › body) and truthfully reflects the
theme's type + heading font. Added an e2e regression asserting both the rendered
heading font and the descending order — the prior test only checked the token
landed in the island's `style`, never that anything rendered with it.
