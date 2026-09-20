# The Thornbury Dispatch

The deliverable from **P04 · Reuben Halloway** — the email builder's persona run.

## What is here

| | |
| --- | --- |
| `the-thornbury-dispatch.html` | The finished newsletter, composed through `toEmailHtml` — the same projection a host's send path calls. This is the file, byte for byte, that act 8's checks and act 9's phone pass were run against. |
| `images/` | The five pictures the email points at: the wordmark, the Warlight cover, and the three staff picks. |
| `serve.mjs` | A tiny static server, standing in for the shop's CDN. |

## Opening it

An email does not carry its pictures. It **points** at them, over the open
internet, and every client either fetches them or refuses to — so the composed
HTML references absolute URLs and something has to be serving them. That is not
an artifact limitation; it is how email works, and it is why "alt text when
images are blocked" is one of the things act 8 checks.

```
node serve.mjs 8032
```

then open `the-thornbury-dispatch.html` in a browser. Without the server the page
still renders completely — every image falls back to the alt text its author
wrote, which is exactly what a subscriber with images turned off sees.

## What it contains

Every item from the persona's build sheet:

- a masthead with a real logo image and a working "view in browser" link
- a greeting merged from `{{customer.firstName}}`, with a second greeting shown
  only when that reference is empty — so a subscriber with no name on file gets
  "Hello there," and never "Hello ,"
- the lead review: cover, a five-line quote with its curly quotation marks, the
  `£9.99`, and a button that is a table cell rather than a coloured word
- three staff picks, entirely clickable, including the CJK title
  `中国北方的情人` and a German title long enough to wrap
- three events, one of them shown only to Clifton customers
- the offer, carrying the corrected code `THORNBURY10`
- a complete footer: real address, real phone number, and a real unsubscribe link

## What was checked, and what was not

**Checked**, read straight out of this file: no merge token survives anywhere;
both calls to action are table cells with a painted background, real padding and
Word's own `mso-padding-alt`; every image has alt text and an absolute address
and none has an empty `src`; the unsubscribe is a real absolute link; the £, the
apostrophes, the curly quotes, the em dash and the CJK all survived; the layout
is table-based with no flex, no grid and one `<style>` block; at 360px it fits
without sideways scrolling, no text is under 14px, every line meets AA, and both
buttons are 46px tall.

**Not checked:** Outlook on Windows, Gmail web, and Apple Mail with dark mode on.
None can be driven on the machine this ran on. The markup shape those clients
need is asserted above; **how Word actually paints it is not known**, and no
screenshot exists for a client nobody opened.

The full run, act by act, is in
[docs/personas/04-thornbury-dispatch.md](../../04-thornbury-dispatch.md).
