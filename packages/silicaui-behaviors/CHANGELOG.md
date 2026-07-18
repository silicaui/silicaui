# @wizeworks/silicaui-behaviors

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

### Minor Changes

- 79822a8: Host nodes (live code-component embeds) + two-tier node locking — two orthogonal, universal primitives so an authored page can carry a live, host-owned functional region (checkout, search, cart, a data grid) pinned in place. Design authority: `docs/host-nodes-and-node-locking.md`.

  - **Node locking** — new `NodeBase.locked?: "host" | "author"` (presence encodes locked; the value encodes the owner). The editing spine refuses `remove`/`move`/reparent on any locked node, `duplicate` yields an unlocked copy, and a new tier-blind `setLocked(id, owner)` primitive is undoable. The Inspector's Settings tab gains a Lock row (an author toggle, or a read-only "Locked by host" indicator with no unlock — only the host clears a host lock); the Navigator shows an owner-aware lock/shield glyph. Generalizes the outlet/root protection; no projection reads `locked`.

  - **Host nodes** — new `HostNode { kind: "host"; component; props }` in the node union (+ a `host()` kit helper). `toHtml` projects an **empty** `<div data-sui-host="…" data-sui-host-props="…">` mount point — never live framework code, preserving the framework-neutral projection promise — into which a host mounts its real component (client or SSR), the same trust model as behavior-marker hydration and `rawHtml`. Every traversal (`stampTree`/`walk`/`flattenSymbols`/`resolveTree`) passes a host node through untouched.

  - **`@wizeworks/silicaui-behaviors`** — new optional `mountHostNodes(registry, root?)` helper, the client-side companion to the mount points (symmetric with `hydrate()`); host components stay host-owned.

  - **Builder** — `BuilderHost` gains `hostComponents()` (Insert-palette entries, `pinned` inserts host-locked) and `renderHostNode()` (live canvas preview, with a labeled placeholder fallback), plus `HostComponentDef`/`HostPropDef`/`HostRenderCtx`. The engine treats a host node as a selectable **leaf** — drop-_beside_, never drop-_into_ — and `setProp` writes host props. The Inspector renders a Host panel from the component's declared props.

## 0.21.0

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

### Minor Changes

- 970bb4b: Add assignable element animations: `sui-animate-*` (on load), `sui-reveal-*` (on scroll), and `sui-hover-*` presets in `silicaui`, plus `sui-duration-*`/`sui-delay-*` modifiers — all reduced-motion aware. `silicaui-behaviors` gains a `reveal` handler (IntersectionObserver-driven, mirrors `counter`) for the scroll trigger, matched by a new `reveal` `BehaviorType` in `silicaui-html`. The site builder's Inspector (`silicaui-builder`) gets a new Animate section (Trigger/Preset/Speed/Delay) for assigning these to any element; the edit canvas shows the final state while editing, and scroll-triggered reveals actually play in Preview and the published site.

  `silicaui-mcp`'s catalog is regenerated to include the new classes and behavior. Along the way, fixed a latent bug in its generator-arg detection that silently produced wrong class names for any `(prefix)`-only component (`card`, `skeleton`, and now `animations`).

## 0.10.1

## 0.10.0

## 0.9.0

### Minor Changes

- e8bd507: Toolbar: add `size` ("sm"/"md"/"lg"), `variant` ("muted"), `dividers` ("top"/"bottom"/"both"), and a `ToolbarCenter` region for start/center/end layouts (e.g. centered tabs with actions on either side).

  Email builder: add a Navigator (layers) panel to the left rail, mirroring the site builder's tree view; text blocks gain a `fontWeight` control and the color palette now exposes the full set of semantic roles (secondary/accent/neutral/info/success/warning/error), not just primary/base.

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.2

## 0.5.1

## 0.5.0

## 0.4.0
