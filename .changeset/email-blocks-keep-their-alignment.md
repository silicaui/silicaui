---
"@wizeworks/silicaui-builder": patch
---

An email button, social row or image set to "left" now lands at the left in the inbox, as the canvas shows it.

A section's cell is centered unless the author changes it, and browsers read its
`align="center"` as `text-align: -webkit-center`, which centers block children too.
A left block said "left" only through `margin: 0`, so `toEmailHtml` drew it in the
middle. Each of these blocks now sits in a full-width, one-cell table whose cell
carries the block's own alignment. That cell is the nearest one, so it wins in
browsers, and it is also how Outlook's Word engine places a block (it ignores the
`margin: auto` the right and center cases used). `e2e/email-block-alignment.spec.ts`
measures every block at every alignment in sections of every alignment, and goes red
on the old markup.
