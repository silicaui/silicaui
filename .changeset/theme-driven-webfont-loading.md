---
"@wizeworks/silicaui-builder": patch
---

Webfont loading follows the active THEME, so a preset's heading font actually changes.

The editor fetched a Google face from the theme editor's font picker — the click, not the
result. That covered exactly one of the eight ways a theme arrives. Applying one of the shipped
presets, a saved theme, pasted theme CSS, a host-supplied theme at mount, crash-recovery restore,
undo, or a remote editor's op all wrote a perfectly correct `--font-head: "Syne", sans-serif` onto
the island against a font the page had never requested. The token resolved, the browser fell back
to the generic, and the component board's Typography specimen showed headings in the body face:
*the heading font doesn't change when I switch themes.*

The load now hangs off the theme itself — `useThemeWebfonts`, mounted once at the editor root —
so it watches the result rather than the cause and every route is covered by construction,
including routes added later. `theme.fonts` is preferred for the family and its exact weights
(the unambiguous provenance record the picker and the presets both write); the raw token is the
fallback, which is what makes pasted CSS work with no `fonts` record at all. A stack leading with
a generic keyword, a `var()`, or a face the shipped system stacks name on purpose resolves to
nothing to fetch.

Two silent degradations around it now say so once, on the affordance rather than at each call
site: a family the theme names that isn't in the catalog (nowhere to fetch it from), and a face
whose `<link>` fails — offline, a blocked CDN, a CSP without `fonts.googleapis.com`. Both paint a
fallback and look merely *wrong* rather than broken, which is worth knowing before a screenshot.

Pasting theme CSS also stops dropping the `fonts` record for a token the paste changed. Dropping
it left the theme naming a webfont with nothing for the publish-time self-hosting step
(`selfHostGoogleFonts`) to act on, so the published page shipped `--font-head: "Fraunces"` with no
`@font-face` behind it — the preview lying about the output. The record is re-derived from the
pasted token instead, by the same catalog match the editor uses to preview it. A family we can't
source records nothing, which is the honest answer.

Guarded by e2e that asserts the `<link>`, not the token: a token on the island was exactly the
evidence that made this invisible, and `document.fonts.check` is no better — it reports true for a
family with no matching `@font-face` at all.
