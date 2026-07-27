---
"@wizeworks/silicaui-builder": patch
---

Email canvas: a frame region no longer renders body-editor chrome, and marks itself as host-managed.

**Fix.** `EmailFrame` regions promised "full fidelity but inert", but several block
renderers still drew authoring marks inside them — most visibly the raw-HTML
block's "Custom HTML" label and dashed box, which painted a fully-composed host
legal footer as an unfilled developer placeholder. The rule is now general
rather than per-kind: nothing in `frame.header` / `frame.footer` wears chrome
that belongs to the editor. Also suppressed there: the empty-container "insert
something" prompt and its tinted drop well, the image placeholder gradient, the
spacer's visibility band, and the empty-text placeholder. Content-legitimate
marks are untouched (a Video block still shows its play overlay — the projector
emits one), and an author's own HTML block keeps its label as before.

**UX.** The region now marks itself positively and persistently: a hairline
dashed boundary plus a locked tag carrying `frame.label`, pinned to the composed
email's outer edge (top for the header, bottom for the footer). Previously the
tag appeared only on hover. The region is still not dimmed — fading it would
read as "unfinished" rather than "real, and not yours to edit here".
