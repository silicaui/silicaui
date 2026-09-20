# Bright Step Studio — a dance studio's website

The artifact from **[P03](../../03-bright-step-studio.md)** — Marlene
Okonkwo-Bright, 58, who has run a dance studio in Leeds for 22 years and had never
seen a developer tool before this.

Seven pages, built by driving the real site builder, then published and opened with
the builder shut down.

```bash
npm install
npm run build        # HTML from the published payload, then CSS, then behaviours
npm run serve        # http://localhost:8031
```

## What is in here

| | |
| --- | --- |
| `site.json` | the structured `Site` the builder handed the host — what it would store and re-open |
| `site/*.fragment.html` | every page composed to production HTML — what it would deploy |
| `build.mjs` | the host half of `onPublish`, at its smallest: wrap each fragment in a document |
| `serve.mjs` | static files under a strict CSP — **no `'unsafe-inline'`**, for scripts or styles |
| `out/` | the result, which is the thing to actually look at |

**Nothing in `site.json` or `site/` was typed by hand.** Both come straight out of
`window.__published` at the end of the run. If they look wrong, the builder produced
them that way.

## What it proves

A person who does not know what a node is built this, and a visitor can read it with
no builder running anywhere:

```
slug                   status  h1                     table  real links  styled  under AA  errors
/                      200     Bright Step Studio       0        4        true      0        0
/classes-timetable     200     Classes & timetable     12        4        true      0        0
/fees                  200     Fees                     0        4        true      0        0
/our-teachers          200     Our teachers             0        4        true      0        0
/term-dates-2026-27    200     Term dates 2026/27       0        4        true      0        0
/marlenes-story        200     Marlene's story          0        4        true      0        0
/find-us               200     Find us                  0        4        true      0        0
```

The timetable is eleven rows and four columns, including the 58-character
`Adult Beginners' Ballet (absolutely no experience required)`. The phone number is a
real `tel:` link. Worst text contrast anywhere on the site is **7.98:1**.

Scanned against the three house rules as it is served: **0 eyebrows, 0 inline hex on a
control, 0 faded ink on text meant to be read.** The last of those was 6 until
[issue 062](../../issues/062-the-builder-handed-her-faded-body-text-and-a-timetable-below-the-floor.md)
— the lead paragraph of every page arrived faded from the builder's own page template,
and her timetable shipped at 14px, under the 16px body floor. Both were things the
builder handed her, not choices she made.

## Things worth knowing before you change anything

**The apostrophe is load-bearing.** `Marlene's story` had to survive being typed, shown
in the page list, shown in the Navigator, turned into an address and exported. Its
address is `/marlenes-story` — [issue 050](../../issues/050-every-page-she-made-had-the-address-page-5.md)
is why it is not `/marlene-s-story`, which reads as three words one of which is the
letter s.

**Every page address came from its name.** Before that issue, all seven were `/page-2`
through `/page-7`, because renaming a page changed only its label. If you rebuild this
against an older build, check the slugs first — a site of `/page-N` is the symptom.

**The fees page says £7.50 because act 9 says so.** The run's last act is her coming
back tired and fixing a typo — she had typed the class price as `£7.05`. The site was
built, published, the browser was closed, and a second session found and fixed it in
thirteen actions. If you rebuild this, that is why the money is right.

**28 links per page still point at `#`.** That is the seed frame's demo footer and the
header's Sign in / Get started. Replacing them is authoring work Marlene would do, not
a defect — but a published site carrying 28 dead links with nothing counting them is
worth remembering when someone asks what a "before you publish" check would be for.

**The CSP is the constraint, not a setting.** `serve.mjs` sends
`script-src 'self'; style-src 'self'` with no inline anything. The published markup
carries `data-sui-behavior` markers that one external module hydrates, which is what
makes that possible — the header's menu opens on a phone without a single inline
handler.

**The theme is whatever the run left in `site.json`.** `build.mjs` reads
`theme.tokens` and emits the matching `@plugin ".../theme"` block, so the page's
`data-theme` always has rules behind it. Hardcoding a theme name here would be the
failure [issue 030](../../issues/030-data-theme-marble-renders-the-default-and-says-nothing.md)
describes: a `[data-theme]` that renders the default and says nothing.

## Not done

The **360px / phone / dark** pass, deferred by agreement during the run. The site is
measured at 1280px in light only. Everything above is a desktop-light number and
should be read as one.
