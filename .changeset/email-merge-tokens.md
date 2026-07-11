---
"@wizeworks/silicaui-builder": minor
---

The email builder's `TextNode.html`, `ButtonNode.label`, `subject`, and `preheader` now resolve inline `{{ref}}` merge tokens against the host's `resolveBinding`, independent of any whole-field `data` bind on the same node — a sentence like "Hi {{customer.firstName}}, your order shipped" has no single field to bind wholesale, so each token resolves on its own. Typing `{{` in the Canvas's rich-text editor or the Inspector's Subject/Preview text/Button label fields now opens a filterable autocomplete sourced from the host's `dataSources()`. Tokens inside a `data-scope="collection"` repeat resolve per item, and `HtmlNode.html` is never token-substituted (raw passthrough stays raw).
