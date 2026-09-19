# CLAUDE.md — Silica UI persona testing

**Version:** 1.0
**Author:** Brandon Korous
**Last Updated:** 2026-09-18

Binding for anything under `docs/personas/`. Where it is silent, the repo's root
[CLAUDE.md](../../CLAUDE.md) applies — and its three rules (silicaui-first, no
eyebrows, soft-is-a-signal) are **load-bearing here**, because breaking one of them is
a defect a run must file and fix, not a style opinion.

This folder is not documentation about testing. It **is** the test: 9 real customers,
each with a person behind them, each starting from "never heard of it" and working
until their job works or breaks. A persona file is both the **script** and the
**log** — you read it to know what to do, and you write to it as you do it.

---

## RULE #1 — judge it as the customer, not as an engineer

**Drive the screen.** Click it, type into it, read what comes back, and decide what a
person would do next. Every defect worth finding here passed typecheck, lint, build
and 24 green probes first.

**Never prove a feature works from the source, the MCP or a probe.** A green
`verify:themes` says nothing about whether Nia could find the theme editor. The MCP
catalog, the verify probes and the golden files are for **confirming what the screen
already claimed** — never for doing the work the screen was supposed to do. If the
docs cannot teach you to install it, that is the finding; reading `theme-plugin.js` to
work it out and carrying on erases it.

**Silica UI has two different customers and the verdict is whichever one is running.**

| | Who they are | What breaks them |
| --- | --- | --- |
| **The developer** | installs the packages into their own project | a docs page that shows a prop but not the import; a token that resolves in light and not dark |
| **The business user** | drives the embedded builder inside somebody else's app | a rail labelled with a word only we use; a control that only appears on hover |

Each persona file says at the top which one it is. A jargon word is a nit for
Dilnoza and a blocker for Marlene, and that difference is the whole point of running
both.

**The verdict is theirs, not the code's:**

| Technically | But as the customer | Verdict |
| --- | --- | --- |
| works | they could not find it, or did not know it was there | broken |
| works | it took nine taps and two screens they did not understand | broken |
| works | the word on the button is not a word they use | broken |
| works | it told them nothing happened, and something did | broken |
| works | it looked right in light and became unreadable ink in dark | broken |
| an edge case | it is Tuesday and they do this every Tuesday | major |

So write findings in their terms. **"Marlene could not tell which rail her page was
in"** is the finding; "the mode switch and the left-tab state are separate atoms" is
the cause, and it belongs further down the same file. An issue whose title only a
developer can read has recorded the symptom from the wrong end.

Three things a customer never does, so you must not do them either:

- **Read the source to find out whether something works.** Look at the screen. Read
  code only once you are fixing what the screen already proved.
- **Know what the software is called underneath.** If you needed to know the package
  split, the node kind, or that a pane is called "Navigator" in the source, that is a
  finding.
- **Try again in a different way because the first way failed.** The first way
  failing IS the result. Record it, then try the second way as a separate note.

The tell that you have drifted: you are reading a probe's output instead of a screen,
or you are pleased that something works when you could not have found it.

## RULE #2 — real data, never placeholder data

The names, copy, prices, colors and numbers in each persona file **are the test data**.
Type them as written. No `Test Product 1`, no lorem, no `a@b.com`, no `123`, and no
`Lorem ipsum` in a hero you are about to judge.

Placeholder data hides exactly the defects real data finds: an apostrophe in
`Marlene's`, an accent in `Tomás`, a 68-character section heading, a price with cents,
a phone number with a `+`, a paragraph that wraps to five lines at 360px, a page list
long enough to scroll. A persona whose site is three sections called Test has not
tested a page.

Where a file says "at least N", N is a floor, not a target.

## RULE #3 — file it, fix it, then prove the fix from the same screen

**Stop and fix.** A defect is not logged and left; it is repaired the moment it is
found, and then the step that found it is **done again as the persona** to confirm the
repair. Five beats, in this order, every time:

1. **File** the issue in [issues/](issues/) — before the fix, so a defect that turns
   out to be two defects does not lose one of them.
2. **Fix** it properly, at the single point of change. Not a call-site patch. On this
   product that has a sharp edge: memory note
   `silicaui-in-production-harden-accordingly` says **fix the affordance, not the call
   site**, and `n-color-reach-all-components` is what it looks like when 35 private
   copies of one loop get unified instead of patched one at a time. A defect found on
   one component is almost always a defect in a **class** of components — say in the
   issue whether you checked the siblings.
3. **Re-run the exact step**, as the persona, on the screen, with the same data. Not a
   typecheck, not a probe, not a golden file.
4. **Record the confirmation** in the issue: `Status: fixed`, `Fixed:` stamped, and
   one line on how it was proved — the screen, the data, what you saw.
5. **Re-score the screen** in [rating.md](rating.md) if the fix moved it, keeping both
   numbers (`5 → 8`).

Then continue the act. A run is a sequence of repairs, not a survey.

**Why this and not "log it and keep going":** a defect list written on Tuesday gets
fixed in a batch on Friday by somebody re-deriving what the sentence meant, and the
fix never gets driven through the screen that found it. The confirmation is the part
that keeps getting skipped, so it is a numbered beat.

**When a fix genuinely cannot be made now**, say so explicitly in the issue and keep
going — this is the exception, not the escape hatch. It applies to exactly these:

| Situation | Do |
| --- | --- |
| It needs a **breaking change** to a published class name, token name or component prop | silicaui is in production. `Status: open`, `Blocked on: decision`, state the options and what a changeset would say |
| It needs a product decision that is Brandon's | `Status: open`, `Blocked on: decision`, state the options |
| The fix is larger than the surface under test | `Status: open`, `Blocked on: scope`, say what it would take |
| Fixing it needs a dev server restarted | Restart it yourself, and **write the restart into the run log** — a screen that only works after a restart is a finding |

Anything not in that table gets fixed now. A bad experience is never parked as
somebody else's call because it is awkward.

**Design failures are defects and are fixed the same way.** On this product they have
names, from the root CLAUDE.md:

- **A hex, or an inline `style`, painting a control.** It cannot answer to light/dark,
  so it is wrong even where it looked right.
- **An eyebrow** — a kicker, a label, a `01 / 02`, an uppercase micro-cap, or a
  `<Badge>` doing the same job — above a heading.
- **`soft` / `muted` / `/opacity` ink on text a person is meant to READ**, or `bg-soft`
  used as the theme rather than as the one accent that earned it.
- **Anything that is neither silicaui nor a Tailwind utility** without Brandon's
  approval asked for up front.

File, fix, look again. `Severity: design`. These are not nits here — they are the
rules the product sells.

**Copy that is FALSE is not a copy defect, it is a major one.** Any sentence promising
something this product does not do, naming a component it does not have, or giving a
count that is wrong, is wrong rather than off-voice. There is a live candidate: the
`/about` stat tiles, the README and the code disagree about how many components ship.
**P01 checks it on the screen.**

## RULE #4 — never present absence as measurement

If you did not check something, write **"not checked"**. Not "fine", not "presumably
works", not silence. A run that reports seven of eleven acts and does not say which
four are missing reads as a clean run, and that is worse than an obviously partial one.

The same applies inside a run: a doc page that would not load is unknown, not empty. A
component you could not find in the docs is "not found by me", not "does not exist" —
until you have searched the sidebar, the palette and the command palette and said so.

## RULE #5 — the spine is verified once, then trusted

There is no signup here. The spine every single customer walks is:

> **silicaui.com `/` → `/docs` → `/docs/getting-started` → install into their own
> project → first component on screen in the right theme.**

**P01 is the deep baseline** and verifies it properly, act by act: the promise on the
home page, the index, the install instructions followed literally with nothing added,
and the first component rendering — in both themes — inside a real Next.js build.

The rest walk it at speed and report spine behaviour only where it **differs** — a
different package, a different framework, no build step at all. Their value is their
own surface, not another re-verification of `pnpm add`. If the spine breaks for one
and not another, that difference IS the finding.

**Step four is where this product's "it said it worked and nothing happened" lives.**
A CSS-first plugin imported wrongly renders a completely unstyled page with no error.
P01 must find out what that failure looks like and whether anything tells you.

## RULE #6 — every screen gets a design score and an ease score

Working is the floor, not the result. **Rate every screen you open**, on two axes, in
[rating.md](rating.md). The axes and the bands are in that file.

**The two come apart, and both are reported.** A beautiful screen nobody can operate
is not an 8, and a plain screen that gets the job done in two taps is not a 4. When a
single number is wanted, quote the lower one.

**A screen is not scored until you have seen it in light AND dark and at 360px.** Not
once per run — per screen. A score taken in one theme at one width is a guess about
the other three, and on a token-engine product that guess is exactly the defect class
the whole system exists to prevent.

**The score is not the point — the deductions are.** Every row carries a **gap to
10**: the specific thing that would raise it. That column is the worklist, and
anything in it that is a real defect becomes an issue and gets fixed under RULE #3
rather than sitting in a table as a number.

**Re-score after a fix**, keeping both values (`5 → 8`). Screens no persona reached
stay `—`; an unrated screen is unrated, never assumed fine (RULE #4). 142 screens and
9 runs means most of the component doc pages will still read `—` at the end. **That is
correct and it is the answer to "what has nobody ever looked at?"**

## RULE #7 — the boundaries must hold, and fixes travel

Silica UI has **no accounts and no tenants**, so the classic "see somebody else's
data" check has nothing to point at. It is narrowed rather than kept, because a rule
nobody can follow teaches everybody that rules are optional. What it becomes is the
same defect class in this product's terms: **a boundary that is supposed to hold.**

### Every persona tries once to cross a boundary it should not

Pick the one that applies to that persona's surface; the persona file names which:

- **A locked node.** Select it and try to move, retype, restyle and delete it. Two
  tiers exist (`locked` and host-lock) — try both, and try from the Navigator as well
  as the Canvas, because a rule enforced in one renderer and not its sibling has
  shipped before.
- **A host-owned node.** A `host` node is the host app's, not the author's. Try to
  edit its insides.
- **A peer's claim.** With a second editor holding a node, try to edit it anyway and
  watch what `applyRemoteOps` does with the collision.
- **Untrusted HTML.** Put a `<script>`, an `onerror=`, and an `<iframe>` into a
  `rawHtml` field and into a merge token, and confirm the host sanitizer eats them and
  that `toHtml`'s allowlist holds.
- **A theme island.** Nest a `data-theme` inside another and confirm the inner one
  wins for everything inside it and nothing outside it.

The expected result is nothing: refused, stripped, or ignored. **A breach here is a
`blocker` and stops the run** — it is the one defect class where continuing to test is
the wrong thing to do.

### A fix made in one run must not break an earlier one

This is the cost of fixing inside the run (RULE #3), and on this product it is the
larger half of the rule. The token engine, the class vocabulary and the shared
`COLOR_VARIANTS` table are under **every** persona at once.

After repairing anything in the **plugin, the token engine, the shared class
vocabulary, or a screen two personas both open**, reopen the earliest persona it could
touch and do one real job there. Record it on the issue as a second confirmation line.
A P07 fix that quietly unstyles P02's menu is otherwise found by nobody, because
nobody goes back.

## RULE #8 — the build is the deliverable, not a step in the run

**Each persona ends with a real, complete, working build.** Not a demonstration, not
the getting-started snippet with the words changed, not "four components and done".
Something a stranger could use without ever knowing it was a test.

Builds live in `docs/personas/artifacts/P0N-slug/`, self-contained, with a one-line
README saying how to run it.

Each persona file carries **its own inventory** under "The build". That list is the
definition of done: if an item on it is missing, stock, or still wearing template
copy, the run is not finished. Enumerate before you start; re-check before you say
done.

### What "fully featured" means, on every one of the 9

- **Complete** — every screen or section its inventory names, with real content in
  this customer's voice, not lorem and not the demo's copy.
- **Right in both themes.** Every surface and every ink, light and dark. Not "it has a
  toggle" — actually looked at.
- **Holds at 360px** with no horizontal scroll and no control out of thumb reach.
- **Reachable by keyboard**, with a visible focus ring the whole way and Escape
  closing what it opened.
- **On-system** — silicaui components and Tailwind utilities only, no hex on a
  control, no eyebrow, no `soft` ink on readable text. It is built with the product,
  so it is held to the product's own rules.
- **The thing it exists for works end to end from the outside** — the form submits,
  the email renders in a real client, the static export hydrates with no console
  error, the dashboard's chart redraws when the theme flips.

### The 9 must not be one build 9 times

Different structures, different looks, different feature mixes, different themes. Nine
that are the getting-started page with swapped nouns have tested one path nine times
and told you nothing. **If they come out looking like siblings, the token engine was
never exercised** — which is the single most important thing this product claims.

---

## Standing checks — every run, every persona

These are not acts. They are the things a real person does that the scripted acts do
not, and each persona file names its own concrete instance of each.

**Wrong moves.** At least three per run, named in the persona file. Delete a component
other pages still place. Undo past the start, then redo past the end. Paste 5,000
characters into a heading. Drop a section into itself. Import the same block twice.
Double-click Publish. Close the tab mid-edit and come back. Upload a 40 MB image where
a logo goes. **What you are judging:** did it refuse clearly and keep the work intact,
or did it half-succeed? A half-succeeded wrong move is the worst outcome and the least
tested.

**Reload, deep link, restore.** Press F5 with a node selected and a panel open — is
the selection still there? Copy the address bar and open it in a new window: does it
land in the same place, or does the builder have no address at all for where you were?
A screen you cannot link to is a screen nobody can be sent to — not by a colleague,
not by support, not by a link in an email.

**Time and dates.** Check the boundary, not the middle: a Countdown at 0 and at 1
second past, a Timestamp at 23:59 and at the first of the next month, a Calendar over
a leap day, a scheduled send across a daylight-saving change. **Say which timezone the
machine is in when you record the result.** Half the date defects ever found were a
timezone the reader assumed.

**Contrast and token math at the edges.** This product's irreversible number is not
money, it is **color**. Not the happy default — the composition:

- A `-content` ink on a `soft` surface, in dark, at the smallest size that ink is used.
- Two `color-mix`es stacking — a `soft` background inside a theme island inside a
  `glass` panel.
- A live-invented N-color role against a declared one: they must resolve identically
  (memory note `n-color-full-reach-mechanism`).
- A custom theme whose brand color is nearly the same lightness as its surface.
- The type scale at its two ends: `text-xs` on a faded surface, and `display-1` where
  it has to wrap at 360px.

**Compute or measure it first, then look.** Read the computed style back out of the
page; do not trust the swatch. Where they disagree, the software is wrong until proved
otherwise.

**The other side of the delivery.** Every run ends as the person on the receiving end,
not the author. The visitor loading the published page. The recipient opening the
email in a real client. The developer who `npm install`s what was built. Can they use
it without the builder? A product where somebody can author once and the result never
reaches anybody is broken in a way every author-side check would pass.

**Without a mouse.** One full job per run driven by keyboard alone, with the focus
ring visible the whole way — and the builder's own shortcuts are part of it. And with
thumbs: tap targets, reach, and whether anything needs hover to be discoverable. **A
control that only appears on hover does not exist on a phone.**

## What every run records

In the persona file's **Verification** block, as numbers, not adjectives:

| Record | Why |
| --- | --- |
| Minutes from landing on silicaui.com to first component on screen | The spine's real cost, measured once per path |
| Screens opened, and of those, screens scored in **both** themes at 360px | A scored-in-one-theme screen is not scored (RULE #6) |
| Design-rule breaches found — hexes on controls, eyebrows, `soft` ink on readable text | The product's own rules, counted |
| Components they went looking for and could not find in the docs | The gap between what ships and what is reachable |
| Console errors and warnings during the run, with the count | Zero is a claim; write the number |
| What was **not checked** | RULE #4 |

---

## Where things run

| Surface | Port | Start command | What you use it for |
| --- | --- | --- | --- |
| silicaui.com | 4011 | `pnpm site:dev` | the marketing promise, the docs, all 121 site screens |
| Playground | 5173 | `pnpm dev` | every demo on one page — the developer's smoke surface |
| Builder harness | 5178 | `pnpm --filter @wizeworks/silicaui-builder harness` | both builders. `?editor=email` for email, `?host=demo` for the host contract, `?persist=1` to keep local persistence on under webdriver |

**Start at silicaui.com `/` every time.** Landing straight on `/docs/getting-started`
skips the promise the product makes, and half the defects worth finding are the
product failing to keep it.

**Dev servers are the run's to start and stop.** Brandon confirmed this on 2026-09-18:
a run may start any of the three above, restart one, and stop it when it is finished.
No need to ask.

Two conditions come with that. **Leave nothing running** at the end of a run — a
stray 5178 is the next run's mystery. And **say in the run log when you restarted
one**, because a restart hides state-loss defects: if a screen only works after a
restart, that is the finding, not the fix.

**Drive the screens with the Playwright CLI, not an MCP browser** (memory note
`verify-with-playwright-cli-not-mcp`): `packages/silicaui-builder` owns the config and
the specs, and `examples/playground` owns its own. And where a run turns on
bleeding-edge CSS, **look at it in Brandon's own browser too** — Chromium passing is
not the user's browser passing (memory note
`verify-css-in-users-browser-not-just-playwright`).

### Environment traps, learned the hard way in P01

Each of these cost real time and none of them is a product defect.

| Trap | What happens | What to do |
| --- | --- | --- |
| **Screenshot coordinates are scaled** | A screenshot comes back 1232px wide while the CSS viewport is 1438px. Clicking at an element's `getBoundingClientRect()` x/y **misses**. Doing the arithmetic yourself misses too — that was tried twice in act 5, on a nav link that was demonstrably a real `<a>`, and both clicks silently did nothing. | **Never compute the scale.** `find` the element, then click it by its `ref`. Coordinates are for reading a screenshot, not for aiming at one. |
| **An iframe inherits the parent's `color-scheme`** | Testing dark in a 360px iframe reported `prefers-color-scheme: dark === false` while the top page said `true`. Not a bug — the embedder's used `color-scheme` flows in. | Clear `data-theme` on the parent document before mounting the test iframe. |
| **An iframe's scrollbar eats some width** | A 360px-wide iframe gives a narrower viewport — 345px once, 356px another time. The amount is **not a constant**, so a remembered figure is worse than none. | Oversize the iframe, then **assert** `documentElement.clientWidth === 360` and adjust until it does. Never report a width you did not assert. |
| **`TaskStop` leaves the server running** | It kills the `pnpm` wrapper; `next dev` keeps the port. The next start fails `EADDRINUSE` and **exits 0**, so it looks fine while the OLD build serves. | Kill by port, then confirm the port is free before restarting. |
| **Plugin and CSS changes need a cold build** | Editing `packages/silicaui/src/**` or a `@plugin` option does not hot-reload. The browser keeps serving the previous CSS and your fix "does not work". | Stop the server, `rm -rf apps/site/.next`, restart. Verify by grepping the served stylesheet, not the source. |
| **`npm` refuses `--allow-scripts`** | `create-next-app` fails with `EALLOWSCRIPTS` because `~/.npmrc` carries `allow-scripts=@stripe/cli`. Brandon's machine config — **do not edit it**. | Scaffold with `--skip-install`, then run `npm install` separately. |
| **Next 16 writes `CLAUDE.md` and `AGENTS.md`** | Into every project root, on every dev start. A stray binding instruction file inside this repo. Deleting it lasts until the next start. | Set `agentRules: false` in the artifact's `next.config.ts`. |
| **npm rejects capitals in a package name** | `create-next-app P01-…` is refused outright. | Artifact folders are lowercase: `p01-…`. |
| **This session's MCP server holds the old build** | After rebuilding `silicaui-mcp`, the live `mcp__silicaui__*` tools keep answering from the code they started with. A fix looks like it did nothing. | Drive the built server over stdio (`packages/silicaui-mcp/verify.mjs`) — it spawns a fresh process. Say plainly that the live connection was not the proof. |
| **A synthetic `KeyboardEvent` proves nothing** | `dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))` did not close a Drawer that closes fine for a person. Untrusted events miss handlers. | Press real keys through the browser tool. A synthetic event that fails is **not checked**, never a defect. |

## Accounts

**There are none.** No signup, no password, no inbox, no database. A run that reports
"signed up successfully" has recorded something that cannot have happened.

What each persona does have instead is a **project of their own**, started from
nothing, in `docs/personas/artifacts/P0N-slug/`. Never continue another persona's —
the whole point is starting from nothing, with their own framework, their own theme
and their own copy.

## Reading what was actually delivered

There is no dev mail server, because silicaui does not send mail — it **builds** it.
The equivalent question is "did what the author made actually come out right at the
other end", and it has three real answers:

- **The email builder's output.** `composeEmailDocument` is the same path sparx's send
  uses (memory note `email-frame-and-locking-shipped`). Render it and open the HTML in
  a real client, not just the in-builder Preview pane. Outlook is the one that finds
  the defect; that is why the one-`<a>`-wrapper projection was rejected.
- **The static projection.** `pnpm --filter @wizeworks/silicaui-html golden` is the
  golden file, and the built HTML opened in a browser with `silicaui-behaviors` loaded
  is the actual answer.
- **The published page.** Whatever the builder exported, opened cold, with no builder
  running.

**Absence is still not measurement (RULE #4).** If you did not go and look at the
output, write "not checked". What must never happen is a run reporting that an email
is fine because the Preview pane looked fine.

## Verifying what the UI claimed

Read-only, and only to confirm what the screen said it did:

```bash
pnpm --filter @wizeworks/silicaui-builder verify     # 24 named probes
pnpm --filter @wizeworks/silicaui-html golden        # the projection golden files
pnpm verify                                          # the whole workspace gate
node docs/personas/gen-screens.mjs --check           # the screen denominator still matches the code
```

Plus the silicaui MCP (`list_components`, `get_component`, `list_classes`,
`get_theme`) as a **read-only catalog** — to confirm that a component a persona could
not find does or does not exist, after they have already failed to find it on screen.

**Never run a probe in place of opening the screen**, and never let a green probe
overturn what a person saw. The probes are why the defects that remain are the ones
probes are structurally blind to.

---

## Issue files

Name: `NNN-short-kebab-slug.md`, a flat global sequence starting at `001-`. Global
rather than per-persona, because most defects live in the token engine or the shared
class vocabulary, and numbering them by who happened to find one implies an ownership
that is not real.

Use [issues/_TEMPLATE.md](issues/_TEMPLATE.md). The header block is fixed:

```
**Status:** open · fixed · wontfix · duplicate of #NNN
**Severity:** blocker · major · minor · design · copy
**Found by:** P03 · Marlene Okonkwo-Bright · act 4
**Surface:** Site builder › Inspector › Design
**Filed:** 2026-09-18
**Fixed:** —
**Confirmed by:** re-ran P03 act 4 — <what you did and saw>
**Blocked on:** — (decision · scope, only when the fix could not be made)
```

**Title it the way the customer would say it.** The cause goes in **Where it lives**,
not in the heading (RULE #1).

| Severity | Means |
| --- | --- |
| blocker | cannot proceed · work lost · a boundary breached · output that would ship broken |
| major | a real job cannot be finished the way a person would do it, or a sentence on screen is FALSE |
| minor | friction, confusion, a wrong count, an ugly edge |
| design | breaks a binding rule in the root CLAUDE.md — a hex on a control, an eyebrow, `soft` ink on readable text, a non-sanctioned dependency |
| copy | off-voice, jargon, wrong vocabulary — true, but the wrong words |

**Say whether the siblings have it too.** On this product a defect found on one
component is usually a defect in a class of them (memory notes
`silicaui-beat-daisyui-papercuts`, `piggles-second-consumer-app`). The issue template
has a line for it and leaving it blank is not allowed.

**When an issue is fixed, it stays.** Set `Status: fixed`, stamp `Fixed:`, and record
what the fix was, where it landed, and **how it was confirmed from the screen**. A fix
with no confirmation line is not fixed. This is a defect ledger, not a queue.

There is deliberately **no index of issues**. `ls issues/` is the index, and a
hand-maintained table would be wrong within two runs.

## What is out of scope on a run

Fixing what the run finds is the job (RULE #3). These are the edges of it:

- **Redesigning a screen you are only passing through.** A screen you did not open as
  the persona gets no score and no rewrite.
- **A fix bigger than the surface under test.** File it, mark `Blocked on: scope`, say
  what it would take, and keep the run moving.
- **A breaking change to a published API.** silicaui is in production. File it,
  `Blocked on: decision`, and say what the changeset would have to say.
- ~~Restarting a dev server.~~ **In scope** — see "Where things run". Start, restart
  and stop them freely; leave nothing running, and log every restart.
- **Committing or pushing.** Only when Brandon asks. A second agent works this same
  tree (memory note `concurrent-agent-on-builder`), so **stage by file — never
  `git add -A`** — and **never append a `Co-Authored-By` trailer** to a commit in this
  repo (memory note `feedback-no-co-authored-by-trailer`).
- **Editing another repo.** sparx and piggles are downstream consumers. Approval here
  does not extend to them (memory note
  `feedback-dont-edit-other-repos-without-asking`).
- **Resizing the browser window.** Check 360px in device emulation, never by resizing
  Brandon's actual window.

## How to run one

1. Read the persona file top to bottom before touching anything.
2. Set `Status: in progress` and stamp the date in **Run log**.
3. Work the acts in order. Each act names its jobs and what "done" means.
4. Fill in the **Project** block as soon as the build has a home on disk. A run nobody
   can revisit is a run nobody can confirm.
5. **On every screen you open**: score it in [rating.md](rating.md) in light and dark
   and at 360px, and write its gap to 10 (RULE #6).
6. **On every defect**: file, fix, re-run the step as the persona, confirm in the
   issue, re-score the screen (RULE #3). Do not carry it to the end of the run.
7. Work the **standing checks** as you go. The persona file names its own instance of
   each.
8. Complete **Verification** honestly at the end, including what you skipped.
9. Set `Status: done` only when every act has a recorded outcome — including "blocked
   on a decision, issue #012". Silence is not an outcome.

## Definition of done — the whole exercise

- All 9 persona files at `Status: done`, every act with a recorded outcome
- Every defect in `issues/` carrying a status, and every `fixed` one carrying a
  confirmation line naming the screen it was re-proved on
- [rating.md](rating.md) scored for every screen the runs opened, each with a gap to
  10, and the unreached ones still visibly `—`
- **9 complete builds** in `docs/personas/artifacts/` — every item in every persona's
  inventory built, working in both themes at 360px, and looking like its own thing
  rather than one template nine times

9 scripts and no runs is nothing. 8 runs and one stock persona is an unfinished
deliverable that reads as finished. 9 runs with a hundred logged defects and no fixes
is a survey, which is not what this is.
