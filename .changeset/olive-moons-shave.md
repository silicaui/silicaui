---
"@wizeworks/silicaui": patch
---

A scrollbar thumb you could not see in any theme the system ships, and a carousel dot under the bar in half of them

P07 noticed both faded "the same way the drag handle did", tried to measure it in
a browser, could not pin down that page's theme state, and **refused to publish a
figure it could not stand behind**. That was the right call, and the reason the
browser was the wrong instrument: the question is not "is it visible in one
page's theme" but "is it visible in every theme a consumer can pick".

Computed instead from the declared tokens of all 20 shipped themes, in both
modes, over all three surfaces — 120 combinations, the same corpus the builder's
chrome-ink check uses for text. The bar is **3:1**, WCAG 2.1 SC 1.4.11 Non-text
Contrast, which is what applies to a control rather than to words:

```
.scroll-area-thumb        25% ink   worst 1.60:1   under 3:1 in 120 of 120
.scroll-area-thumb:hover  40% ink   worst 2.22:1   under 3:1 in  60 of 120
.carousel-dot (inactive)  45% ink   worst 2.49:1   under 3:1 in  57 of 120
```

**The thumb failed in all 120.** The scrollbar is `opacity: 0` until you hover or
scroll, so it faded *in* to 1.60:1 — a scroll affordance you still cannot see
once it has arrived. And the dot is the control that changes slide; "inactive"
there means *not the current slide*, not *disabled*, so 1.4.11's
inactive-component exception does not apply.

| | before | after | worst |
| --- | --- | --- | --- |
| `.scroll-area-thumb` | 25% | **55%** | 1.60 → **3.22:1** |
| `.scroll-area-thumb:hover` | 40% | **70%** | 2.22 → **4.77:1** |
| `.carousel-dot` inactive | 45% | **55%** | 2.49 → **3.22:1** |

53% is the lowest alpha that clears 3:1 in all 120; 55% is that floor with
margin. The active dot is untouched — it is `--color-primary` and three times as
wide, so it carries hue and size, neither of which depended on the others being
faint.

A probe now guards the class, wired into the root `verify` chain: it composites
every faded-ink background in every component over all 120 surfaces. Default
strict, exempt by review — the two exemptions are hover tints and are named in
the file with the reason, because a hover highlight is not information needed to
identify a control when the pointer is already on it. It proves its own
arithmetic before judging anything (black-on-white must read 21.0, white-on-white
1.0) and was shown to fail before it was trusted.
