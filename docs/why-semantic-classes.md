# Why Semantic Classes (And Why This Isn't Bootstrap Again)

**Version:** 1.0
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-18
**Status:** Positioning doc — the standing answer to "components-on-Tailwind is going full circle."

> **Purpose.** Every component library built on Tailwind gets the same objection, in the same words, for years on end: *"Tailwind existed to escape `.btn`. You've rebuilt the antithesis of Tailwind on Tailwind. At that point, why not just write CSS?"* It's the single most repeated criticism of daisyUI across four years of Hacker News threads, and we will inherit it verbatim. This doc is the answer we actually believe — written down once, so docs, the comparison page, and conference answers all say the same thing.

---

## 1. Concede the premise — it's correct

Utility-first won because *naming things is the failure mode*: inventing `.sidebar-inner-wrapper` per project produced unmaintainable one-off CSS. We are not relitigating that. Raw utilities remain the customization language of every Silica node (see [override-and-ownership.md](override-and-ownership.md)).

But "never name anything" overcorrects. A button is not a one-off. It appears hundreds of times per product, and encoding it as 15 repeated utilities means the design decision lives in *every call site* — change the design, touch every file. Tailwind's own answer is "extract a component" (a React component, a partial). That answer is correct **and framework-bound**: it only exists where you have a component system.

## 2. The actual position: the class IS the component — for surfaces that outlive a framework

SilicaUI's semantic class is not a shorthand for utilities you could have written. It is the **serialization format for a design decision** that has to survive contexts where a JSX abstraction can't follow:

- **Static HTML output.** A published site page (`silicaui-html` → `toHtml`) is markup, not a component tree. `class="btn btn-primary"` is how "this is our primary button" travels through serialization, storage, server rendering, and a vanilla-JS hydration pass — and remains one token to restyle globally later.
- **The visual builder.** An editor manipulating a node's *class set* can offer real semantic controls ("make this a ghost button") precisely because the vocabulary is finite and named. A bag of 15 utilities has no handle to grab; this constrained-vocabulary property is the builder's entire thesis.
- **Non-React stacks.** Rails/Django/Laravel/HTMX teams have no component layer to extract into. For them, the semantic class is the *only* available component abstraction. (Notably, even daisyUI's harshest critics concede it's the best option there.)
- **Agents and MCP.** A model composing UI reasons far better over `btn-primary` than over an unordered utility soup — the vocabulary is the API.

Where you *do* have React, the semantic class doesn't compete with the component — `<Button color="primary">` emits it. The class is the layer beneath, not a rival idiom.

## 3. Why this isn't Bootstrap

The "full circle" jab assumes named components must recreate Bootstrap's failure modes. Point by point:

| Bootstrap's actual sin | SilicaUI |
|---|---|
| Overriding meant fighting specificity (`!important` wars) | Components live in the **base layer**; any utility beats them, structurally ([details](override-and-ownership.md#1-the-core-guarantee-your-utilities-always-win)) |
| Theming = recompile Sass or accept the look | Runtime CSS-first tokens, OKLCH roles, **unlimited named colors** with generated utility/variant parity |
| Bolted-on jQuery behavior | Behavior is a separate, optional layer: Base UI (React) or `data-sui-*` hydration (vanilla) — the CSS never depends on it |
| Everything named, utilities an afterthought | Two-tier by design: a small semantic vocabulary + full Tailwind for everything else. The semantic tier is ~1 class per *component*, not per element |
| "Every Bootstrap site looks the same" | The class names carry zero fixed aesthetic — they're var-readers; the theme owns the look, and themes are cheap |

The honest one-line version: **Bootstrap's crime wasn't naming components — it was making the names hard to override and the theme hard to change. Keep the names, fix the cascade and the tokens, and the objection dissolves.**

## 4. And "why not just write CSS?"

Because "just CSS" re-creates per-project component sheets with none of this: no shared vocabulary across a builder, an MCP, static output, and React wrappers; no N-color generation; no behavior contract keyed to the same markup. The classes are the *interface* between all of those layers. Hand-rolled CSS gives you rung 5 of the ownership ladder for everything, all the time — we make it the escape hatch instead of the default.

## 5. Tone notes for public use

- Concede first ("utility-first won; here's the layer it doesn't cover"), never defend Bootstrap.
- daisyUI's maintainer wrote a similar rebuttal ("full circle") — ours differs in having *structural* receipts: base-layer override guarantee, N-color, and the framework-neutral output path. Lead with the receipts, not the philosophy.
- Never claim semantic classes are "faster to write" — that's not the argument and it invites the bike-shed. The argument is survivability of design decisions across serialization boundaries.
