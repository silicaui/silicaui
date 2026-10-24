---
"@wizeworks/silicaui-react": patch
---

Fix the dev-only check running in production: the guard now reads the literal `process.env.NODE_ENV`, so bundlers fold it and drop the "CSS plugin is not loaded" check from production builds.
