---
"@wizeworks/silicaui-builder": patch
---

builder/email: move Subject + preview text out of the toolbar, and align the header with the site builder

Subject and preview text had two homes: plain `Input`s in the email toolbar, and
`TokenTextField`s on the document root's Settings tab. The toolbar pair was the
worse of the two — no merge-token autocomplete, so `{{customer.firstName}}` in a
subject line meant going to the Inspector anyway — and it consumed roughly 300px
of a header that also has to fit the host's own `toolbarSlot`. The duplicates are
gone; the Inspector fields (Email → Settings → Content) are unchanged and remain
the way to set both.

The header's left cluster now runs in the same order as the site builder's —
mode switcher (carrying `toggle-group-primary`, as the one control that changes
what everything else means), then undo/redo, then canvas width — rather than the
reverse.

Also gives the template rename input an `aria-label`; it had no accessible name.
