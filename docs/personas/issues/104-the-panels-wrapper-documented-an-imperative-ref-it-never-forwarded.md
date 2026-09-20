# 104 — `ResizablePanel` documented an imperative `ref` it did not forward

**Status:** fixed
**Severity:** major
**Found by:** P03 · Marlene Okonkwo-Bright · act 10, while fixing [103](103-below-600px-the-builder-is-two-rails-and-a-64px-sliver-of-the-page.md)
**Surface:** `@wizeworks/silicaui-panels`
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

Fixing 103 needs to collapse a rail from code. The package says that is supported,
in its own doc comment:

```tsx
/**
 * ResizablePanel — one region. Takes `defaultSize`/`minSize`/`maxSize`
 * (percentages), `collapsible`, imperative `ref`, etc. (passthrough).
 */
export function ResizablePanel({ className, ...rest }: PanelProps) {
  const sc = useSilicaClass();
  return <Panel className={cx(sc("resizable-panel"), className)} {...rest} />;
}
```

It is a plain function component, and `PanelProps` does not declare `ref`. So:

```
src/site/react/Builder.tsx(537,11): error TS2322:
  Property 'ref' does not exist on type 'IntrinsicAttributes & …'
```

Two separate failures behind one sentence:

| | |
| --- | --- |
| **React 18** | `ref` is stripped before it can reach `...rest`. `panelRef.current` stays `null`, `.collapse()` is never called, nothing throws. |
| **React 19** | `ref` IS a normal prop and would have arrived — but `PanelProps` never declared it, so the type checker rejects the call that would have worked. |

The package's peer range is `react: ">=18"`, so **both** halves are in scope and
there is no version of React on which the documented API could be used.

## Why it matters

It is the "a screen over a dead function" shape, in a library: a written,
published capability with no path to it. The comment is the only documentation
`ResizablePanel` has, so a consumer reading the source is told the handle exists,
writes the obvious code, and gets either a type error or — worse, on React 18 —
a silent no-op. Nothing logs. The panel simply does not collapse.

**And it hid inside a true statement.** `collapsible` really is a passthrough.
`defaultSize`, `minSize` and `maxSize` really are. The one item in that list that
was not is the only one that needs more than a spread to work.

`major` because it makes a shipped API unusable, and because the React 18 form of
the failure is silent.

## Where it lives

[packages/silicaui-panels/src/resizable-panels.tsx](../../../packages/silicaui-panels/src/resizable-panels.tsx)

The sibling exports were already right — `index.ts` re-exports
`ImperativePanelHandle` "for advanced use (programmatic resize/collapse …)
without a separate react-resizable-panels install". The type a consumer needs was
exported; the component that would accept it was not written to.

## How this gets fixed

`React.forwardRef<ImperativePanelHandle, PanelProps>`, which works on 18 and 19
alike, rather than relying on React 19's prop behaviour and narrowing the peer
range to match.

## Rating effect

None directly — this is a package, not a screen. It is what
[103](103-below-600px-the-builder-is-two-rails-and-a-64px-sliver-of-the-page.md)
was standing on.

## The fix

```tsx
export const ResizablePanel = React.forwardRef<ImperativePanelHandle, PanelProps>(
  function ResizablePanel({ className, ...rest }, ref) {
    const sc = useSilicaClass();
    return <Panel ref={ref} className={cx(sc("resizable-panel"), className)} {...rest} />;
  },
);
```

`forwardRef` rather than leaning on React 19's prop behaviour, because the peer
range is `react: ">=18"` and narrowing it to make the comment true would be
fixing the sentence instead of the component.

The doc comment now says which word was the lie and why, so the next person
reading it does not have to find out the way this did.

## Confirmed by

The failure and the fix are both compiler output, which is the whole point — this
one could never be seen on a screen:

```
before   src/site/react/Builder.tsx(537,11): error TS2322:
           Property 'ref' does not exist on type 'IntrinsicAttributes & …'
         src/site/react/Builder.tsx(631,11): error TS2322:  (the same, right rail)

after    tsc --noEmit    (no output)
```

And then from the browser, which is the part a type check cannot reach — the
handle is real and `.collapse()` / `.expand()` actually move the panel:

```
taps Layers        rail 240px    <- expand() reached the panel
taps Layers again  rail   1px    <- collapse() did too
```

That second line is the control. On React 18 the silent form of this bug leaves
`panelRef.current` null and `.collapse()` is a no-op — a rail that never closes
looks exactly like a rail nobody asked to close.

**The red run is the two TS2322s above**, hit while writing
[103](103-below-600px-the-builder-is-two-rails-and-a-64px-sliver-of-the-page.md)
rather than manufactured afterwards.

`@wizeworks/silicaui-panels` was rebuilt so the builder type-checks against the
emitted `.d.ts` rather than source — which is how the error survived the first
fix and is worth knowing about this workspace.

`pnpm verify` — exit 0.  Builder e2e — **217 passed**.  `tsc --noEmit` — clean.
