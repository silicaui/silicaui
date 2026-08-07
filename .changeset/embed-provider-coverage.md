---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-builder": patch
---

Embed frames what it can play, links what it can't, and covers audio and podcasts

Seven gaps, all reported against rendered output. They look like seven bugs; they are three,
and the third is the one that made the rest inevitable.

### The frameable/not-frameable distinction was never actually drawn

`resolveEmbed` matched a provider by substring and then checked the result against a HOST
allowlist. `https://www.google.com/…` is on that allowlist, so an ordinary map page —
`/maps/place/…`, the URL anyone actually copies — passed the final "already a bare embed URL"
branch and got an `<iframe>`. Google serves those pages `X-Frame-Options: SAMEORIGIN`, so every
visitor's browser refused it and the page reserved a blank rectangle where a link used to be.
Framing a URL is a claim that it will render, and nothing was checking that claim.

The allowlist is now path-precise, and the same rule decides every provider: Bandcamp,
Simplecast and Megaphone address their players by an internal id that a shareable URL does not
carry, and `expand()` is pure and synchronous, so there is nothing to look it up with. Those
resolve only from the URL their own embed dialog produces. A share URL becomes a link that
works instead of a player that 404s.

### The parts of a URL that decide what plays were being dropped

The unlisted Vimeo hash is the sharp one: `vimeo.com/<id>/<hash>` resolved to
`player.vimeo.com/video/<id>`, which plays for the signed-in owner and 401s for everyone else.
That is invisible to the person who published it. SoundCloud's `/s-…` secret segment is the same
hazard, and Apple's `?i=` is a quieter version — drop it and the embed does not get smaller, it
plays the whole album instead of the track. `?t=` start times and `?list=` playlists were dropped
too.

Everything that addresses the media now survives the trip, and parsing goes through `URL` rather
than a substring match — so `youtube.com` has to BE the host, not merely appear in the string.

### Provider coverage was a list, and lists rot

`youtube.com/shorts/…` is what a phone's share sheet produces and it was not framed; neither was
`/live/`, `/v/`, `vimeo.com/channels/…` or `/groups/…`. So YouTube accepts every path form that
names a video, and Vimeo strips container prefixes and requires what remains to start with the
id — which also means a container naming NO video (`/channels/staffpicks`) correctly resolves to
nothing, because it is not a video.

Audio and podcasts join on the same terms: Spotify (including `show`/`episode`), SoundCloud,
Apple Music, Apple Podcasts, Bandcamp, Simplecast, Megaphone, Transistor, Buzzsprout.

Those players are fixed-height chrome rather than a picture, so `resolveEmbed` now returns the
provider's own height and the 16:9 box applies only to video — a 152px Spotify row in an
`aspect-video` frame is a strip of player stranded in a tall empty rectangle. The palette no
longer seeds `ratio: "wide"` on a new Embed, because an authored ratio overrides the provider
and that seed would have locked every audio embed into 16:9. The Inspector's ratio control leads
with `auto` to say so.

### And the one that was publishing builder copy to visitors

An Embed with no URL rendered `Add a YouTube, Vimeo, or Google Maps URL` — through `toHtml`, on
live pages, to the public. `verify.mjs` asserted that it did. Authoring affordances belong to the
authoring surface, which is how Image and Icon already work, so `toHtml` now renders nothing and
the canvas draws its own hint.

### Probe

`verify-embed.mjs` asserts the mapping directly — URL in, player URL out — rather than eyeballing
markup, because every failure here is the quiet kind: the author pastes a link, sees a player in
the builder, publishes, and the defect exists only for other people. It covers the three shapes
at once — not framed but should be, framed but must not be, framed but wrong — across 119 checks,
including look-alike hosts that a substring match would have accepted.
