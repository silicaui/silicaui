---
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-builder": patch
"@wizeworks/silicaui-mcp": patch
---

Deleting a page asks first.

It didn't. The trash icon in the Pages panel called `removePage` straight off the
click, and it sits one button away from Add — the same 24px square, the same ghost
treatment, in the same run of three. A mis-click took the page and its entire node
tree off the canvas with nothing on screen to stop it or explain what just
happened. The op has always been invertible, but undo being available is not the
same as an author knowing to reach for it: nothing in the editor says a deleted
page is recoverable, so the honest read of that click is "gone".

The button now awaits the shared `AlertDialog`, which names the page, labels its
confirming action `Delete page` rather than a bare `Confirm`, and says undo covers
it. `AlertDialog`'s backdrop is inert by design, so the decision can't be lost by
clicking away; Escape still cancels, per the ARIA alert-dialog pattern.

**`ImperativeAlertDialogProvider` gained `popupProps`**, which is what made this
reusable rather than a one-off. The popup portals to `document.body` — outside any
`[data-theme]` island the provider sits in — so a confirm raised from inside a
themed region (an editor shell, a pane, a dark section) resolved its tokens
against the host page instead of that region, and came back wearing the wrong
palette. `popupProps` re-stamps the theme on the portalled surface, the same
escape hatch `Select` already exposes for the identical reason. It also accepts
`data-*` keys explicitly, because TypeScript waives excess-property checks for
hyphenated names in JSX position only, never in an object literal.

The builder mounts that provider once at the root inside its studio island, so
this is now infrastructure: any panel can raise a themed confirm by calling
`useImperativeAlertDialog()`, with no per-call-site dialog state and no bespoke
markup.

Covered by a new `e2e/pages.spec.ts`: cancel keeps the page, Escape keeps the
page, confirm removes it and undo restores it to the switcher, the last remaining
page stays undeletable, and the popup actually resolves the studio theme — the
test asserts a non-transparent computed background, not just the attribute, since
the attribute being present is exactly what a broken portal would also show.
