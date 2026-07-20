---
"@wizeworks/silicaui-mcp": patch
---

Report the live version, and restore the usage examples

`list_packages` advertised whatever version was current the last time someone
ran `pnpm gen` by hand — it had frozen at 0.26.0 while npm served 0.29.0 — and
the MCP server introduced itself as `0.1.0`, a literal unchanged since the
package was created. Neither number is baked into the catalog now: both are read
from the package's own `package.json` at startup. Every package in the family is
released in lockstep (they share one `fixed` group in the changesets config), so
that value is correct for all of them, and the drift is no longer possible
rather than merely fixed.

`get_component` also returned no `usageExample` for any of the 344 components.
The generator reads demos from disk, and they had moved to the new
`silicaui-demos` package; the per-component read tolerates a missing demo (most
components legitimately have none), so a stale directory degraded silently into
"nobody has an example" instead of failing. The path is corrected — 106
components carry an example again — and the directory is now asserted once up
front, where a future move fails loudly instead of quietly emptying the catalog.

Finally, `verify.mjs` asserted a hardcoded count of 30 behaviors, which broke
when a 31st was registered. It now compares against the `BehaviorType` union
itself and names any type that is genuinely missing.
