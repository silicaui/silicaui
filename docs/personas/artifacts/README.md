# The builds

One folder per persona, named `p0N-slug` — **lowercase**, matching the persona file.

Lowercase because npm refuses it otherwise: `create-next-app` rejected
`P01-peregrine-ops-console` with *"name can no longer contain capital letters"*. Any
scaffolder that writes a `package.json` will do the same, so the convention is
lowercase throughout.

**These are committed on purpose.** They are the deliverable, not scratch work
(CLAUDE.md RULE #8). A run is not `done` until its build exists here, complete against
the inventory in its persona file, and working.

| Persona | Folder | What it is |
| --- | --- | --- |
| P01 | `p01-peregrine-ops-console/` | Next.js ops console — `silicaui-react` |
| P02 | `p02-casa-ferreiro-menu/` | Django menu + booking — CSS plugin only |
| P03 | `p03-bright-step-studio/` | the exported dance-studio site — site builder |
| P04 | `p04-thornbury-dispatch/` | the composed newsletter + a screenshot per mail client |
| P05 | `p05-quarrystone-embed/` | a host app embedding the builder |
| P06 | `p06-nias-atelier-brand-kit/` | a live brand kit — three custom palettes |
| P07 | `p07-kaiho-analytics-dashboard/` | a dashboard on all five composite packages |
| P08 | `p08-medina-field-guide/` | a static generator + its generated `out/` |
| P09 | `p09-pike-tackle-migration/` | a daisyUI shop admin, before and after |

## Rules for what goes in a folder

**A one-line README at minimum**, saying how to run it. A build a stranger cannot
start is not a working build.

**No `node_modules`, no build output that can be regenerated** — except P08's `out/`,
which IS the deliverable there and is committed for that reason.

**Nine builds, not one build nine times.** Different structures, different looks,
different themes, different feature mixes. If they come out looking like siblings, the
token engine was never exercised — which is the single most important thing this
product claims (CLAUDE.md RULE #8).

## Not part of the workspace

These are not pnpm workspace packages and must not become them. `pnpm-workspace.yaml`
covers `packages/*`, `apps/*` and `examples/*`; nothing here is picked up by
`pnpm -r build`, `pnpm -r typecheck` or `pnpm verify`, and it should stay that way. A
persona's build is a customer's project that happens to live in this repo — it is not
one of ours, and it must be installable and runnable the way a customer's project
would be.
