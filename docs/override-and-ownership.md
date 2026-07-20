# Override & Ownership — How Far Can You Push SilicaUI?

**Version:** 1.0
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-18
**Status:** Positioning + contract doc. Answers the "shadcn owns the code, you don't" argument with the actual mechanics.

> **Purpose.** The strongest argument against library-delivered components — the one that made shadcn/ui the default for "serious" apps — is ownership: *"when I need to change something, I open the file and change it; with a library I fight it."* This doc states, precisely, what you can change in SilicaUI at each depth, why the fight never happens, and where the honest limits are. It exists because the complaint is legitimate against most component libraries (daisyUI's override story is specificity wars and the occasional `!important`) and we engineered specifically so it would not be legitimate against us.

---

## 1. The core guarantee: your utilities always win

Every Silica component class (`btn`, `card`, `input`, …) is emitted into **Tailwind's `base` layer** (via the plugin's `addBase`). Tailwind utilities live in the `utilities` layer, which by definition beats `base` — so:

```html
<button class="btn btn-primary rounded-none px-8">Ship it</button>
```

`rounded-none` and `px-8` override the button's corner and padding **with zero specificity ceremony**. No `!important`, ever. No "undo the framework" step. This is structural, not a convention we ask you to follow: the cascade layering makes a specificity war *impossible*, which is the difference between us and any library that emits its components as ordinary rules.

The class set on a node is exactly two tiers — semantic classes (what it is) + raw utilities (how this one differs) — and both tiers are plain strings you own in your markup. There is no third, hidden tier.

## 2. The escalation ladder

Each rung is available at any time, per component, without leaving the previous rungs behind:

| Depth | Mechanism | You own |
|---|---|---|
| 1. Instance tweak | append utilities (`btn rounded-none`) | that one element |
| 2. Theme | CSS-first tokens: OKLCH color roles, `--radius-*`, `--font-*`, spacing — plus **N-color**: declare *any number* of named colors and every one gets full utility + variant parity (`btn-brand`, `text-brand`, `soft`, `glass` — generated, not hand-listed) | the whole design language |
| 3. Restyle a component | write your own CSS against the same class names — components are **thin visual wrappers**; the behavior layer (Base UI in React, `data-sui-*` hydration in vanilla) never depends on our visual CSS | a component's entire look |
| 4. Replace a component | keep the behavior, drop the class: Base UI parts / behavior markers accept any className; the semantic class is a convenience, not a requirement | look *and* structure |
| 5. Read/fork the source | every CSS module is a small readable `.js` file (one component per file, plain style objects); the MCP serves any component's source on demand (`get_component`); MIT-licensed — vendor any file into your repo and the rest of the system keeps working | everything |

Rung 5 **is** the shadcn model, available on demand — the difference is you're never *forced* down to it just to change a border radius, and until you take it, updates keep flowing.

## 3. What shadcn's model actually costs (the trade we didn't make)

Copy-paste ownership means every component you touch is frozen at copy time: no upstream fixes, no a11y patches, no new variants without manual diffing. That's a fine trade for a team building a bespoke design system. It's a bad default for everyone else — and it's the *only* mode shadcn offers. SilicaUI's default is npm-delivered (fixes and additions flow with `pnpm up`), with rungs 1–4 absorbing the customizations that push shadcn users into their fork, and rung 5 there when you genuinely want to own a file.

Also unlike shadcn, none of this is React-gated: rungs 1–5 apply identically to the static-HTML + vanilla-behaviors path (Rails, Django, Laravel, plain sites).

## 4. Honest limits

- **A component's DOM structure is its contract.** `card-title` expects to sit inside `card`. You can restructure by composing elements yourself (rung 4), but you can't hand an existing macro a different skeleton and expect its CSS to follow.
- **Behavior parameters are the API.** The vanilla runtime's behaviors expose their tuning via `data-sui-behavior-params`; behavior *logic* changes mean forking that behavior (small, single-file — but a fork).
- **Class names are the interface.** If you prefix (`sx-btn`) the interface shifts with you, but renaming `btn` to `button` is not supported short of rung 5.

## 5. Where to say this publicly

The comparison page should carry rungs 1–2 as the headline ("customize without fighting — your utilities always win, your palette is unlimited") and rung 5 as the closer ("and if you ever do want to own the file, it's MIT and one file per component — the shadcn move is available, not mandatory").
