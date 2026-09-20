---
"@wizeworks/silicaui-builder": patch
---

Every image in the site Navigator was one row saying "Image", and a separator that announced a floor it went straight through

**Images now name themselves.** The site Navigator's rule is written in its own
source — *"the layer name if the author set one, else the words the node actually
holds, else the name it declares, else its type. **Content leads** because that
is what a person recognizes when scanning"* — and the "name it declares" step
read `aria-label` and nothing else. An `<img>` has no text child and rarely has
`aria-label`, so every image in a tree fell through to its type: eleven rows
naming their content and a twelfth saying `Image`, which was the only one whose
alt text had been written to say what it is.

`alt` **is** an image's accessible name, which is exactly the argument that
function's own comment already made for `aria-label`. The email Navigator fixed
this months ago and quoted the site file while doing it; this is the neighbour it
left behind.

**And a separator no longer declares a minimum it can go past.** Making the rails
collapsible walked into an upstream bug: `react-resizable-panels` derives a
separator's range from the neighbour's `minSize` and never reads `collapsedSize`,
so pressing `Home` parked the rail at 0 while the separator still announced a
minimum of 12 — invalid, and on the desktop layout, where nothing had asked for
it.

Fixed at the source of the lie rather than by patching the attribute:
`collapsible` is on only at the width that needs it, so the wide layout is
byte-identical to what it was, and `minSize` is 0 alongside it because at that
width the rail really can be nothing. That makes the declared minimum **true**
rather than merely consistent — the distinction that decides whether a wrapper
should paper over an upstream bug or leave it alone.

The 240px rail floor is untouched: it is held by a pixel `min-width` while the
rail is shown, which is what was doing the work all along.

Also: the `silicaui` mark in the status bar is a link, and it was 52×16 — under
WCAG 2.2 SC 2.5.8's 24px minimum. It is 52×24 now, inside the same 28px bar.
