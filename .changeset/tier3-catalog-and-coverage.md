---
"@wizeworks/silicaui-html": minor
"@wizeworks/silicaui-mcp": patch
"@wizeworks/silicaui-react": patch
---

Coverage and catalog honesty — what the library says about itself.

**The MCP catalog described a component that does not exist.** `Typography`
had a row in silicaui-react's README component table but is not exported from
anywhere. The generator resolved the name through its kebab-case fallback to a
real file (`typography.tsx`), parsed it, and published a fully-formed entry —
with `HeadingProps` attached. An assistant querying the catalog was told to
write `<Typography level={2}>`, complete with prop documentation, for a
component that cannot be imported. The row is gone, and the generator now
treats a README name with no matching export as an **error**: it drops the
entry from the emitted data and exits non-zero, because a phantom entry is
worse than a missing one — a consumer acts on it.

**Six real components were missing from the catalog.** The generator's
existing check ran one direction only and at file granularity: a file with at
least one documented export was exempted wholesale, on the assumption that its
other exports were Base-UI-style sub-parts. That assumption holds for ~150
genuine sub-parts, but it also silently swallowed `DateRangePicker` (in
`date-picker.tsx` beside documented `DatePicker`), `ClickableCard`,
`SelectableCard`, `FloatingLabel`, `CheckboxOption`, and `RadioOption`. The
check is now per-export, and a sub-part is identified by being name-prefixed
by a documented sibling in either direction (`DialogTrigger` ⊃ `Dialog`;
`Steps` ⊃ `Step`) rather than by sharing a file.

**Five components became authorable outside React.** `Link`, `FileInput`,
`FloatingLabel`, `SelectableCard`, and `MockupCodeLine` existed only in
silicaui-react, so a static or Sparx-rendered page could not author them at
all — `Link` most glaringly, since a projection with no link component made
every link a hand-written raw element node.

**`<input accept>` was silently dropped from all static output.** The raw
element sanitizer's allowlist for `input` included `multiple` but not
`accept`, so every static file input lost its file-type filter. Nothing
errored; the picker just opened unfiltered. This predates the `FileInput`
macro and affected hand-authored element nodes too — adding the macro is only
what surfaced it. `accept` is an inert hint string with no URL or script
surface.

**React↔HTML parity is now enforced rather than assumed.** A component that
exists only in silicaui-react is invisible to every non-React consumer. That's
legitimate for some, but it has to be a decision. The generator now warns on
any React component with no `-html` macro unless it appears in an explicit
`HTML_EXEMPT` map with a stated reason — imperative APIs (`ToastProvider`),
pure class-applicators (`Validator`), names already covered under a different
one (`NativeSelect` → `-html`'s `Select`), and interactive components still
owed a behavior handler. It also warns when an exemption goes stale, so the
list can't rot into fiction once a macro lands.

The five new macros and the `accept` fix are locked in the byte-identical HTML
golden fixture.
