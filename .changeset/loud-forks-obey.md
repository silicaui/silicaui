---
"@wizeworks/silicaui-react": minor
---

`mergeProps` (the merge behind every component's `render` prop) now tolerates a `theirs` of `undefined`, so passing a Server Component's client-component element through `render` degrades gracefully instead of throwing — crossing that boundary serializes the element as a lazy client reference whose `.props` reads as `undefined`. `Validator`/`FloatingLabel`'s direct `children.props` reads get the same treatment.

Also export `buttonClasses`, `badgeClasses`, and `clickableCardClasses` — the class-string logic behind `Button`, `Badge`, and `ClickableCard`, as standalone functions with no React context dependency. A Server Component can now style a plain element directly (e.g. `<Link className={buttonClasses({ color: "neutral", variant: "ghost" })}>`) instead of needing the client-side `render` composition.
