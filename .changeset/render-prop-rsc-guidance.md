---
"@wizeworks/silicaui-react": patch
---

Make the `render` prop fail safely, and document that it's client-only.

Passing `render={<a href="…" />}` from a React Server Component either threw
React's opaque `Element type is invalid… got: undefined`, or silently produced
a styled element with none of its own props — a link that looks right and
navigates nowhere. The cause is structural: this package's main entry is a
single `"use client"` module, so the element is serialized across the boundary
and arrives with `type` and/or `props` missing.

- The three `render` implementations (`Button`, `Badge`, `ClickableCard`) now
  share one audited helper, `composeRender`. It validates the element before
  cloning it and falls back to the component's own native element when the
  element is unusable, so a bad `render` can no longer take a page down.
- Both failure modes now log an actionable `console.error` naming the
  component and pointing at `@wizeworks/silicaui-react/server`. They fire in
  production too — each mode is silent by nature, so a build that only warned
  in development would still ship dead links. The remediation detail is
  dev-gated and stripped from production bundles.
- `mergeProps` keeps its public contract: called with a single argument (its
  documented `/server` usage) it stays silent.
- The `render` JSDoc on all three components states the constraint and the
  fix, which also surfaces it in editor hover-hints and the `silicaui-mcp`
  catalog. The README gains a **Server Components** section covering the
  `"use client"` boundary and the `/server` class builders.
- New `pnpm --filter @wizeworks/silicaui-react verify` probe covers all of the
  above against the built bundle, in both `NODE_ENV` modes.
