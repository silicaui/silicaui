# Quarrystone — the P05 artifact

A small real B2B app that **embeds the silicaui builder on one route**, built
from `docs/builder-contract.md` and nothing else. Not the harness; not a demo of
the builder. The builder is a panel inside somebody else's product, which is the
only way to find out whether the seam is real.

Quarrystone is a tool for quarry and aggregate operators. Their customers publish
plant pages: address, opening hours, a product list, and a **compliance
certificate the customer must not be able to edit**.

## Run it

```bash
pnpm install          # once, from this folder
npm run dev           # the app, on http://localhost:5192
```

Routes: `?route=editor` (the embed), `?route=twoup` (two plant pages at once),
`?route=plants`, `?route=compliance`.

## Publish a plant page and open it with nothing running

```bash
node publish.mjs      # reads published.json → writes out/
node serve.mjs 8033   # static files + the one POST route the lead form needs
```

Then `http://localhost:8033/hoganas-angelholmsvagen/`.

`published.json` is written by the evaluation run straight out of
`window.__quarrystone.lastPublish()` — what the builder's own **Publish** button
handed the host. Nothing in `out/` is typed by hand.

The static host serves under a real Content-Security-Policy with
**`script-src 'none'`**. That is the claim being tested, not a flourish: a
compliance certificate that needs JavaScript to appear is one that does not
appear.

## What is where

| File | What it is |
| --- | --- |
| `src/quarrystone-host.tsx` | the whole `BuilderHost` — host components, the class policy, the Compliance tab, the data sources and the resolver |
| `src/host-nodes.tsx` | the three host-owned blocks, plus the second account's plant the isolation check reaches for |
| `src/PlantPageEditor.tsx` | the one route that mounts `<Builder>`: our store, our presence, our toolbar slots |
| `src/presence.ts` | Quarrystone's own presence channel, handed to `<Builder peers>` unchanged |
| `src/publish-entry.tsx` | renders the same host-node components to static markup, for the deploy step |
| `publish.mjs` | the deploy step: fills every `data-sui-host` mount point, writes the pages and one stylesheet |
| `serve.mjs` | static hosting, a strict CSP, and `POST /leads` |

## Three things this build exists to prove

**A node the author cannot touch.** The compliance certificate is `pinned`, which
stamps a host lock the author cannot clear. Thirteen attacks on it, from the
canvas and the Layers list, are logged in the persona file.

**Storage that is ours and storage that is theirs.** Our `onChange` writes to our
backend; the builder's crash recovery writes to a key we named. Act 6 proves the
second works while the first is failing every save — measured, by checking our
store is empty at the moment the work comes back.

**The published page needs nothing.** `renderHostNode` is a canvas hook; a host
node reaches the published page as an empty `<div data-sui-host>`. Filling it is
ours, and `publish.mjs` does it at publish time so the page carries no script at
all.

## The rules this build follows

Every block is built from **silicaui components and Tailwind utilities**. The
first cut used inline `style` objects, which looked right everywhere except the
published page, where the CSP dropped all of them and the certificate rendered as
naked text. That is in the run log with the browser's own error quoted.
