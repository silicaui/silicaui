---
"@wizeworks/silicaui-builder": minor
---

`EmailBuilder`'s `theme` prop is now live, not read-once-at-mount: every Text/Button/Divider/Section/Body color that's still on its brand default repaints when the host hands down an updated `Theme` (e.g. a theme edited in the site builder elsewhere), so an open email stays on-brand instead of drifting. A field freezes the moment a user picks its own color, so a live theme update never clobbers a deliberate choice. Also moves the email's Subject and Preview text fields into the toolbar (previously buried in a truncated label) and swaps the header/footer branding for a `silicaui.com` link, matching the site builder's chrome.
