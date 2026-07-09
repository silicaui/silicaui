---
"@wizeworks/silicaui-builder": minor
---

Add a first email editor, a peer of the site builder (new `@wizeworks/silicaui-builder/email` + `/email/react` entry points): a closed node schema (body → section → columns/column → text/image/button/divider/spacer), an `EmailEditor` engine (insert/move/duplicate/undo-redo), a `toEmailHtml` projector that emits real table-based, fully inline-styled markup with Outlook MSO conditional fallbacks and mobile column-stacking, and an `EmailBuilder` React chrome (click-to-insert palette, a live-DOM-approximation canvas with inline text editing, and a per-block-kind Inspector). Extracted a shared `SelectionOverlay` (used by both editors' canvases) and added the email-related baked icons.
