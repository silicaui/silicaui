# silicaui-react

## 0.2.0

### Minor Changes

- Add a `silicaui-react/server` entry exporting `cx` and `mergeProps` — pure, React-free utilities safe to import directly into a Server Component. The main `silicaui-react` entry is a single `"use client"` bundle, so importing `cx` from it inside a Server Component hands back an inert client reference instead of a callable function; import from `silicaui-react/server` there instead.

## 0.1.1

### Patch Changes

- Fix missing `"use client"` directive in the published bundle. Every component in silicaui-react is a client component (state, context, or Base UI under the hood), but the build never marked the entry as such — importing any component into a Next.js Server Component threw at render time. `dist/index.js` now starts with `"use client";`.
