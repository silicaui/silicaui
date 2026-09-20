# 067 — The button is a coloured word in Outlook, and the code said so itself

**Status:** fixed
**Severity:** critical
**Found by:** P04 · Reuben Halloway · act 4, the lead review and the button
**Surface:** the email projector — `renderButton`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Act 4 ends *"Done when: the button is a button."* Reuben's whole reason for being
here is in the persona file:

> **What he is nervous about.** Outlook. He has 4,100 subscribers and knows from
> the click data that a big share of them open it in Outlook on Windows, where
> his last newsletter's buttons became underlined blue text.

Here is what the projector delivered for his Buy button:

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0"><tr>
<td align="center" bgcolor="#374f6a" style="border-radius:8px;background:#374f6a">
<a href="https://thornburybooks.co.uk/shop/warlight-ondaatje" target="_blank"
   style="display:inline-block;padding:8px 16px;color:#f6f9fb;text-decoration:none;font-weight:bold;border-radius:8px">Buy Warlight — £9.99</a>
</td></tr></table>
```

**Every pixel of padding is on the `<a>`.** The cell has none.

Outlook on Windows renders through Word, which drops `padding` and
`display:inline-block` on an inline `<a>`. So the cell kept the colour and lost
the size, and the button became a rectangle of paint hugging the label — a
clickable coloured word.

## The part that makes this a good find

**The code's own comment, three lines above the markup, names the exact
constraint the markup then breaks:**

> `// "Bulletproof" button: a table cell carries the background so Outlook (which`
> `// ignores border-radius/padding on <a>) still renders a solid, sized target.`

Somebody knew. They wrote it down. They fixed the *background* half — `bgcolor`
on the `<td>` — and left the *padding* half on the one element the sentence they
had just written says Outlook ignores it on. "A solid, sized target" was half
true: solid, not sized.

And the file is not naive about Outlook anywhere else. It reaches for MSO
conditionals in three other places:

| | |
| --- | --- |
| `renderColumns` | `<!--[if mso]><table><tr>` — Outlook cannot lay out inline-block columns |
| `renderSection` | a real VML `<v:rect>` + `<v:fill>` for a background image |
| the document head | `<o:OfficeDocumentSettings><o:PixelsPerInch>96` |

Four places needed Outlook handling. Three got it. The one that did not is the
one an author is most afraid of, and the only one the roster has a persona for.

## What should have happened

The button has the same size in Outlook as everywhere else.

## How to reproduce

1. `http://localhost:5178/?editor=email` → any template → select a Button.
2. Export. Before the fix, the `<td>` carries `bgcolor` and no padding of any
   kind, and the `<a>` carries `padding:8px 16px`.

## Why it matters

A button is the one element in a marketing email with a job. Reuben's issue has
exactly one, and its label is `Buy Warlight — £9.99`. If it arrives as a coloured
word in the client a large share of his 4,100 subscribers use, the issue does not
work — and **nothing in the builder, the Preview pane or a browser would ever
show him**, because every CSS-following renderer draws it correctly. It is only
wrong in the place he cannot look.

That is this framework's **"invisible in the other theme"** shape with the theme
swapped for a rendering engine: correct at rest, wrong where it counts, and
identical in every check anybody runs.

## Where it lives

[packages/silicaui-builder/src/email/projector.ts](../../../packages/silicaui-builder/src/email/projector.ts) — `renderButton`

## The fix

`mso-padding-alt` on the cell, matching the anchor's padding:

```ts
})}><tr><td align="center"${outline ? "" : ` bgcolor="${node.bg}"`}${styleAttr({
  "border-radius": `${node.radius}px`,
  background: outline ? "transparent" : node.bg,
  border,
  // Outlook-only, and the whole reason this button has a size there.
  "mso-padding-alt": `${node.paddingY}px ${node.paddingX}px`,
})}>` +
```

`mso-padding-alt` is Word's own property, invented for this, and ignored by every
other client. So:

- **every other client** is byte-for-byte unaffected — the `<a>` keeps its real
  padding, so the whole padded area stays clickable
- **Outlook** reads the cell's padding instead, so nothing doubles up

**Known and accepted, and written into the code rather than left to be
rediscovered:** Word ignores `border-radius` outright, so the button is **square
in Outlook**. It is a button with the right size, colour, label and target; the
corners are the part worth losing. Rounding them needs a VML `<v:roundrect>`
carrying a duplicated colour, which is a materially bigger trade and belongs in
its own change.

## Confirmed by

**This machine cannot run Outlook, and no claim here says it did.** What was
measured is the real markup the projector emits, before and after, through the
one documented Word behaviour the projector's own comment already names —
`padding`/`display:inline-block` dropped on an `<a>`, `border-radius` dropped,
`mso-padding-alt` honoured as the cell's padding.

```
=== a client that follows CSS (Gmail, Apple Mail, everything but Outlook) ===
  before the fix        button 195×34px   space around the words: 0px across, 0px down
  after the fix         button 195×34px   space around the words: 0px across, 0px down
  unchanged for these clients: true

=== the same markup through the Word engine's documented rules ===
  before the fix        button 163×18px   space around the words: 0px across, 1px down
  after the fix         button 195×34px   space around the words: 16px across, 9px down
```

Before: **163×18px, no padding at all** — a coloured word.
After: **195×34px**, identical to every other client.
And the fix is invisible to clients that were already correct, which is the
property that matters most in a projector.

Two checks added to `probe-email.ts`, **deliberately broken to watch them fail**
before being restored:

```
  ✗ a button carries mso-padding-alt on the CELL, matching the anchor's padding
  ✗ the cell's mso padding sits beside the background, not instead of it
  ❌ 3 check(s) failed
          … restored …
  ✅ email engine: all checks passed
```

`pnpm verify` exit 0 workspace-wide (including `silicaui-html`'s byte-identical
golden fixture), builder e2e **202 passed**, typecheck clean.

## Not checked, and it stays that way

**Outlook itself.** Act 8's three-client pass cannot be validated on this
machine, by agreement. This issue therefore claims a markup fix measured against
documented behaviour, not a rendering confirmed in Outlook. That distinction is
the whole of RULE #4 and it is not being blurred here: when the clients can be
driven, this is the first thing to open.

## Rating effect

`Email builder › Preview` and the email output as a whole in [rating.md](../rating.md),
once the email screens are scored.
