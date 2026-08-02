---
"@wizeworks/silicaui-builder": patch
---

The site Inspector's rows now label what they label.

A row was a `<div>` with a `<span>` above the control — which looks exactly like
a label and is not one. Nothing associated the two, so every single-control row
in the Settings tab announced as a bare "edit": Name, ID, Content, ARIA label,
Role, Tab index, DOM id, Title, and the custom-attribute key/value pairs. (The
irony of an unnamed "ARIA label" field is the reason this is worth its own note.)

Rows are now real `<label>`s, which name the one control they wrap. Rows holding
a SET of controls — the 33 chip, swatch, focal-point, display, trigger, ID and
asset rows — are `role="group"` + `aria-labelledby` instead, because a `<label>`
names the first labelable element it wraps and `<button>` is labelable: wrapping
a chip row in one would hand "Padding X Auto 0 2 3 4 6 8…" to whichever chip came
first and leave the rest with no context at all. Group naming also gives the
Design tab's chips the row context they never had.

Both rules are enforced rather than remembered — `e2e/inspector-a11y.spec.ts`
sweeps the rail across node kinds and both tabs, failing on any control with no
accessible name, any `<label>` wrapping two controls, and any nested `<label>`.
Its email twin (`email-inspector-a11y.spec.ts`) does the same there.

Specs that located rows by their element (`div.mb-2`, `label`) now use the shared
`ROW` selector, which matches either shape — so a row gaining a second control
stops being a test-breaking change.
