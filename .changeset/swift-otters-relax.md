---
"@wizeworks/silicaui-react": patch
---

`buttonClasses`, `badgeClasses`, and `clickableCardClasses` (added in 0.13.0) now actually work from a Server Component. They previously lived inside `button.tsx`/`badge.tsx`/`card.tsx`, part of the bundle `@wizeworks/silicaui-react`'s main entry stamps `"use client"` onto — importing them there handed a Server Component an unusable client reference, not a callable function. They now live in framework-agnostic `lib/` modules (no React dependency) exported from both the main entry and `@wizeworks/silicaui-react/server`, so `import { buttonClasses } from "@wizeworks/silicaui-react/server"` gets a real function.
