# 080 — The builder wrote to a `localStorage` key the host never gave it, and kept writing after being told to store nothing

**Status:** fixed
**Severity:** high
**Found by:** P05 · Arvid Lindqvist · act 1, and the standing boundary check
**Surface:** `<Builder>` and `<EmailBuilder>` — the resizable rails
**Filed:** 2026-09-19
**Fixed:** 2026-09-19
**Confirmed by:** see below
**Blocked on:** —

## What happened

The standing check for this persona is, verbatim: *"confirm the builder writes
nothing to storage under a key they did not give it."*

Arvid wrote that check because it already happened to them once. From the
persona file:

> They have integrated two "embeddable editors" before; one of them could not be
> made to stop writing to `localStorage` under their key.

Quarrystone mounts the builder with `persistKey="quarrystone:plant-page:recovery"`
and nothing else. After a fresh load, before a single edit:

```
what the builder wrote to storage
  · localStorage keys — ["react-resizable-panels:silicaui-builder-site-rails"]
  ✗ nothing is stored under a key we did not give it
        — react-resizable-panels:silicaui-builder-site-rails
```

One key, hard-coded, in the host's origin, under a name the host has never seen.

## Why it matters

Three separate problems, and the third is the one that makes it a defect rather
than untidiness.

**It is not the host's key.** A host that audits its own storage — and this one
does, because it has been burned — finds a name belonging to a library it
embedded, next to its own. There is no way to find out what wrote it except to
read someone else's source.

**Two documents in one origin shared one set of rail widths.** Quarrystone has
90 accounts with 3–20 plant pages each. Every one of them is the same origin.
The rails are a per-browser preference, so sharing them is arguably fine — but it
was never a decision, it was a constant.

**`persistKey={null}` did not stop it.** That prop's entire documented job is
"store nothing; this host is server-authoritative". It correctly disables the
document draft and the view store, and the rails kept writing anyway. A host that
asked for no storage and got some has no remaining lever.

## The sibling

Identical line in the email builder, with a comment saying so:

```tsx
/* … widths persist locally per-browser via `autoSaveId`, same mechanism as the
   site builder. */
autoSaveId="silicaui-builder-email-rails"
```

The mechanism travelled; the containment never did. Both fixed together.

## Where it lives

[packages/silicaui-builder/src/site/react/Builder.tsx](../../../packages/silicaui-builder/src/site/react/Builder.tsx) — `railsKey`
[packages/silicaui-builder/src/email/react/EmailBuilder.tsx](../../../packages/silicaui-builder/src/email/react/EmailBuilder.tsx) — the same

## The fix

The rails key is **derived from the host's `persistKey`**, and absent when the
host passed `null`:

```ts
function railsKey(persistKey: string | null): string | undefined {
  return persistKey ? `${persistKey}:rails` : undefined;
}
```

`undefined` disables persistence in `react-resizable-panels`, so the rails still
resize — they just start at their defaults every mount, which is exactly what
"persist nothing" has to mean.

This matches the shape already used for the view store (`${persistKey}:view`), so
every key the builder writes now carries the host's own prefix.

## Confirmed by

The same app, same mount, after the fix:

```
what the builder wrote to storage
  · localStorage keys — ["react-resizable-panels:quarrystone:plant-page:recovery:rails"]
  ✓ nothing is stored under a key we did not give it
```

**That prefix is the library's, and it is named here rather than glossed over.**
`react-resizable-panels` namespaces its own entries, so the shape is
`react-resizable-panels:<your persistKey>:rails`. The host's own prefix is in the
middle of it, which is the part that matters: an audit can attribute the key
without reading somebody else's source. What is gone is the key with no trace of
the host in it at all.

And with `persistKey={null}`:

```
  · localStorage keys — []
  ✓ a host that asked for no storage gets none
```

Three e2e tests driving a real mount and reading `window.localStorage`: the site
builder writes only under the host's prefix, `persistKey={null}` writes nothing
at all, and the email builder honours the same rule. The first carries the
negative control — the rails must still BE remembered — because a fix that
quietly broke the resize would be worse than the defect.

**Deliberately broken to watch them fail** before restoring: the constant key put
back: three red, and the two pre-existing persistence tests still green.

## Also recorded, not fixed

**The rail widths no longer survive a reload when `persistKey` is `null`.** That
is the correct behaviour and it is a real loss for a server-authoritative host
whose author liked their layout. If it ever matters, the answer is a separate
opt-in prop for chrome preferences — not a constant key, and not a silent write.
Named here so the trade-off is on the record rather than discovered later.

## Rating effect

None directly — this is storage hygiene, not a screen. It is the strongest single
answer to "is this actually embeddable", which is what P05 scores.
