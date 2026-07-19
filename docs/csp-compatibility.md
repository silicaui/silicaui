# CSP Compatibility — Audit & Policy

**Version:** 1.0
**Author:** Brandon Korous / WizeWorks
**Last Updated:** 2026-07-18
**Status:** AUDITED — one violation found & fixed (Embed iframe inline style). Policy codified below.

> **Purpose.** A published SilicaUI site (static `toHtml` output + `silicaui-behaviors` hydration) must run under a strict Content-Security-Policy — specifically `style-src` **without** `'unsafe-inline'` and `script-src` without `'unsafe-eval'` — with zero degradation. This is a real competitive edge: daisyUI's countdown/radial-progress require `style="--value:…"` inline attributes and the maintainer closed the CSP request as not-planned ([daisyui#4475](https://github.com/saadeghi/daisyui/issues/4475)). We can guarantee what a CSS-only library structurally cannot.

---

## 1. The rules (what CSP actually blocks)

| Mechanism | Blocked by strict CSP? | Notes |
|---|---|---|
| `style="…"` attribute in served HTML | ❌ Blocked by `style-src` w/o `'unsafe-inline'` | Hashes don't apply to attributes (only `'unsafe-hashes'`, rarely granted) |
| `<style>` element w/o nonce | ❌ Blocked | |
| External stylesheet (`<link>`) | ✅ Allowed | The silicaui plugin's compiled CSS — always fine |
| JS CSSOM writes (`el.style.prop = …`) | ✅ Allowed | Not subject to `style-src` |
| `el.setAttribute("style", …)` | ❌ Blocked | Treated as inline style |
| `eval` / `new Function` | ❌ Blocked by `script-src` w/o `'unsafe-eval'` | |

## 2. Policy

1. **Static output (`silicaui-html` `toHtml`/`renderSite`) emits ZERO `style` attributes and ZERO `<style>` elements.** Continuous values must be bucketed to literal utility classes (the existing Progress bucketed-width and RadialProgress 21-step techniques are the canonical pattern — [component.ts](../packages/silicaui-html/src/component.ts) documents both).
2. **`silicaui-behaviors` may only write styles via CSSOM** (`el.style.prop = …`). Never `setAttribute("style", …)`, never injected `<style>` tags, never `innerHTML` containing `style="…"`.
3. **No `eval`/`new Function`** anywhere in shipped runtime code.
4. The **builder** (editor surface) is exempt: it injects a runtime `<style>` for the color cascade ([color-cascade.ts](../packages/silicaui-builder/src)). The builder is an authoring app the site owner runs, not published output — its host page sets its own CSP. Published output never includes builder code.
5. **React SSR caveat (documented, not a violation):** 10 `style={{…}}` usages across 7 `silicaui-react` components carry genuinely continuous/dynamic values (color-picker thumb position & OKLCH swatches, outline/tree depth indent, overflow-list measured gap, table overflow, hero background-image *example*). Server-rendering these under a strict CSP loses those styles until hydration. This is the React-ecosystem norm; consumers needing strict-CSP SSR should use the static `toHtml` path (which is clean) or grant `'unsafe-hashes'`. Do **not** add new `style` props to React components when a class can express the value.

## 3. Audit results (2026-07-18)

| Surface | Result |
|---|---|
| `silicaui-html/src` (all static emission incl. blocks) | ✅ Clean after fix. **One violation found & fixed:** Embed's macro-built iframe carried `style="position:absolute;inset:0;…"` — replaced with `class="absolute inset-0 h-full w-full border-0"`, which rides the same consumer scan as the wrapper's macro-added `relative`/ratio utilities. All verify probes pass. |
| `silicaui-behaviors/src` (all 30 behaviors + runtime) | ✅ Clean. No `<style>` creation, no `setAttribute("style")`, no style-bearing `innerHTML` (calendar's `innerHTML = ""` is a clear, safe). All dynamic styling is CSSOM. |
| `eval`/`new Function` (behaviors + html) | ✅ None. |
| `silicaui` core plugin CSS | ✅ Compiled stylesheet — no CSP surface. No component's *contract* requires an inline style from the consumer (unlike daisyUI countdown/radial-progress). |
| `silicaui-react` | ⚠️ SSR-only caveat, see policy #5. |

## 4. Enforcement

A regression probe (`verify-csp.mjs` in `silicaui-html`) renders every ComponentDef + every block through `toHtml` and fails on any `style="` or `<style` in output. Wire into the package `verify` script alongside the existing probes.

## 5. Marketing note

"Runs under strict CSP out of the box" belongs on the comparison page — it is a concrete, checkable claim daisyUI cannot make, and enterprise consumers (the audience the shadcn comparison content says we lose) are exactly who cares.
