---
"@wizeworks/silicaui": minor
---

**Text you're meant to read now uses real ink (RULE #3).**

Faded ink had spread to 35 places it didn't belong. Each instance looked
defensible on its own, which is exactly how it accumulated — it compiles, it
renders, and it makes a screenshot look tidier. In aggregate it was draining
the signal out of the one thing de-emphasis exists for.

The worst of it:

- `.lead` — the **lead paragraph**, the most prominent body copy on a page —
  was rendered at 82%.
- `.accordion-content` and `.collapsible-content`, which are the entire reason
  those components exist, were at 80%.
- Every `-description` (`dialog`, `popover`, `drawer`, `field`, `empty-state`)
  sat between 65% and 75%.
- Data a user reads to make a decision — `meter-value`, `slider-value`,
  `color-picker-value-hex`, `timestamp`, `stat-title`/`-desc`,
  `data-table-pagination` — was faded.
- Empty-state messages (`combobox-empty`, `data-table-empty`) — the only text
  on screen at that moment — were the faintest thing on it.

Faded ink is retained where it's genuinely *not* meant to be read: disabled
controls, placeholders, the calendar's other-month days, transient
enter/exit animation states, icons and glyphs, structural punctuation (a date
field's `/`, a range separator), and the mockup browser's deliberately fake URL
bar.

Selection state was **not** treated as a reason to fade. `tabs-tab` and
`outline-link` already mark the active item with a real accent color, so the
fade on inactive items was redundant on top of a distinction that was already
doing the work correctly — which is what RULE #3 prescribes: hierarchy from
scale, weight, and color, not from fading text out.

Guarded by `packages/silicaui/scripts/verify-readable-ink.mjs`, which fails the
build on a muted `--color-base-content` ink outside the reviewed allowlist. The
probe earned its keep immediately: it caught two instances the initial sweep
missed, because it parses a selector-assignment form the sweep didn't. Verified
visually in a browser, light and dark, not just as compiled CSS.
