---
"@wizeworks/silicaui-builder": minor
---

`Builder` accepts a `dataToggle` prop to hide the canvas data on/off toggle. It defaults to `true`, so nothing changes for an existing host.

The toggle exists for the case where a host's resolver is wrong, slow, or absent and an author needs to see the authored placeholder. That's a debugging affordance. On a site whose authors are non-technical — or one whose trees carry no bindings at all — the control's effect is invisible, so it reads as a dead button to everyone who isn't debugging a resolver. `dataToggle={false}` lets such a host drop it without giving up `resolveData`.
