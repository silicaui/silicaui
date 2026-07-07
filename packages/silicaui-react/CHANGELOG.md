# silicaui-react

## 0.1.1

### Patch Changes

- Fix missing `"use client"` directive in the published bundle. Every component in silicaui-react is a client component (state, context, or Base UI under the hood), but the build never marked the entry as such — importing any component into a Next.js Server Component threw at render time. `dist/index.js` now starts with `"use client";`.
