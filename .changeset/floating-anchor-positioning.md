---
"@wizeworks/silicaui-react": minor
"@wizeworks/silicaui-mcp": patch
---

Floating components can be anchored to something other than their own trigger

Every Silica component that renders a Base UI `Positioner` forwarded exactly three of its props — `side`, `align`, `sideOffset` — and dropped the rest. The most consequential omission was `anchor`, which meant a popup could physically only sit against the element that opened it. Anchoring a panel to a table row, a chart mark, a text caret, or the pointer was not merely undocumented; it was unreachable through the wrapper, and passing `anchor` was a type error.

This forwards the whole shared positioning surface on all twelve of them: `Popover`, `Tooltip`, `DropdownMenu`, `Menubar`, `ContextMenu`, `Select`, `Combobox`, `MultiSelect`, `Autocomplete`, `NavigationMenu`, `PreviewCard`, and `DatePicker`/`DateRangePicker`.

```tsx
// anchor to a different element entirely
<PopoverContent anchor={rowRef} side="right">…</PopoverContent>

// a virtual element — anything with getBoundingClientRect() — pins a popup
// to a point that has no DOM node of its own
<PopoverContent anchor={{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }}>…</PopoverContent>

// stay inside a scroll container instead of colliding with the viewport
<DropdownMenuContent collisionBoundary={scrollerRef.current} collisionPadding={8}>…</DropdownMenuContent>
```

New on each: `anchor`, `positionMethod`, `alignOffset`, `collisionBoundary`, `collisionPadding`, `collisionAvoidance`, `sticky`, `arrowPadding`, `disableAnchorTracking`. `ContextMenuContent` additionally gained `side`/`align`/`sideOffset`, which it forwarded none of — those stay undefaulted there so Base UI's pointer anchoring is unchanged.

### One definition, not twelve

The set lives in a single `PositioningProps` interface, with each member's type read off Base UI's own Positioner rather than hand-copied, so it tracks upstream. Twelve private copies of a positioning prop list is how this drifts back apart — the same reasoning behind the shared `COLOR_VARIANTS` table.

Props are split by key rather than passed through blindly, and keys absent from a call stay absent from the Positioner: for `collisionAvoidance`, an explicit `undefined` is not the same as omitting it and would have overridden Base UI's default.

### Additive

`side`, `align`, and `sideOffset` keep their Silica defaults and behavior. Nothing was renamed or removed, and every existing probe passes unchanged.

### Verified in a browser, not a compiler

Positioning is a layout claim, and jsdom reports every element as a zero rect — "the popup moved to the anchor" and "the popup never moved" are indistinguishable there, which is precisely the failure being defended against. `examples/playground/e2e/popover-anchor.spec.ts` drives real Chromium: it asserts the popup's box sits against the anchor's box and is centred on a line the trigger is demonstrably *not* on, then clicks an arbitrary point and asserts a virtual element pins the popup there. Both were confirmed to fail when the forwarding is reverted.

The MCP catalog now inlines shared props interfaces into the components that extend them. Without that it reported `extends PositioningProps` and stopped, so an agent reading the catalog to check what a popup accepts would have concluded — correctly, before this change, and wrongly after it — that there is no way to anchor one.
