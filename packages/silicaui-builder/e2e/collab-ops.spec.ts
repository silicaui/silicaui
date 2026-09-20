import { test, expect, type Page } from "@playwright/test";

/**
 * The state-and-intent-out host contract, driven through the REAL React seam —
 * `onChange(site, ops, meta)` out, the `BuilderHandle` ref in.
 *
 * The engine-level proofs live in `probe-ops.ts` (including the convergence
 * test). What only a browser can cover is the seam a host actually touches: that
 * ops reach `onChange` from genuine UI interaction rather than direct engine
 * calls, that the handle survives React's lifecycle, and — the one that matters
 * most — that a remote op REPAINTS THE CANVAS. An op that updates state but
 * leaves the DOM stale is indistinguishable from a working implementation in
 * any engine-level test, and is exactly the "collaborators' edits render without
 * a reload" requirement.
 */

interface Bus {
  __ready?: boolean;
  __ops?: { kind: string; nodeId?: string; text?: string; class?: string }[];
  __lastMeta?: { baseSeq: number };
  __changeCount?: number;
  __handle?: {
    applyRemoteOps(ops: unknown[]): { applied: number; dropped: unknown[] };
    replaceState(site: unknown, seq: number): void;
    ackSeq(seq: number): void;
  };
  __editor?: { extractSite(): unknown; selection?: string };
}

async function ready(page: Page): Promise<void> {
  await page.goto("/?persist=0");
  await page.waitForFunction(() => (window as Bus).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

const ops = (page: Page) => page.evaluate(() => (window as Bus).__ops ?? []);

test("a real UI edit emits semantic ops, not just a new Site", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Select a heading on the canvas and retag it through the Inspector.
  await canvas.locator("h1, h2").first().click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("settings-tag").selectOption("h3");

  const emitted = await ops(page);
  expect(emitted.length).toBeGreaterThan(0);
  const retag = emitted.filter((o) => o.kind === "node.setTag");
  expect(retag.length).toBe(1);
  expect(retag[0]!.nodeId).toBeTruthy();

  // meta rides along, starting at 0 before the host has acked anything.
  const meta = await page.evaluate(() => (window as Bus).__lastMeta);
  expect(meta).toEqual({ baseSeq: 0 });
});

test("view-only interaction emits no ops and does not relay", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await canvas.locator("h1, h2").first().click(); // a selection
  const before = await page.evaluate(() => ({
    ops: (window as Bus).__ops?.length ?? 0,
    changes: (window as Bus).__changeCount ?? 0,
  }));

  await canvas.locator("p").first().click(); // another selection
  await canvas.locator("h1, h2").first().click();

  const after = await page.evaluate(() => ({
    ops: (window as Bus).__ops?.length ?? 0,
    changes: (window as Bus).__changeCount ?? 0,
  }));
  expect(after.ops).toBe(before.ops);
  expect(after.changes).toBe(before.changes);
});

test("a remote op repaints the canvas without a reload, and does not echo back", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  // Ask the live document which node to target — the same way a collaborator's
  // op would name it: by id, from state the other author already has.
  const target = await page.evaluate(() => {
    const site = (window as Bus).__editor!.extractSite() as {
      pages: { id: string; root: unknown }[];
    };
    const page0 = site.pages[0]!;
    const stack: Record<string, unknown>[] = [page0.root as Record<string, unknown>];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.kind === "element" && (n.tag === "h1" || n.tag === "h2")) {
        return { pageId: page0.id, nodeId: n.id as string };
      }
      for (const c of (n.children ?? []) as unknown[]) {
        if (c && typeof c === "object") stack.push(c as Record<string, unknown>);
      }
    }
    return null;
  });
  expect(target).not.toBeNull();

  const opsBefore = (await ops(page)).length;
  const changesBefore = await page.evaluate(() => (window as Bus).__changeCount ?? 0);

  const result = await page.evaluate((t) => {
    return (window as Bus).__handle!.applyRemoteOps([
      { target: { scope: "page", id: t!.pageId }, kind: "node.setText", nodeId: t!.nodeId, text: "Edited elsewhere" },
      { target: { scope: "page", id: t!.pageId }, kind: "node.setClass", nodeId: t!.nodeId, class: "text-5xl font-bold" },
    ]);
  }, target);

  expect(result.applied).toBe(2);
  expect(result.dropped).toHaveLength(0);

  // The whole point: the other author's edit is ON SCREEN, with no reload.
  await expect(canvas.locator("h1, h2").first()).toHaveText("Edited elsewhere");
  await expect(canvas.locator("h1, h2").first()).toHaveClass(/text-5xl/);

  // …and it did NOT come back out as a local edit, which would loop a host that
  // wires onChange straight to a broadcast.
  expect((await ops(page)).length).toBe(opsBefore);
  expect(await page.evaluate(() => (window as Bus).__changeCount ?? 0)).toBe(changesBefore);
});

test("a remote op is not undoable — local undo never reverts another author's work", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const target = await page.evaluate(() => {
    const site = (window as Bus).__editor!.extractSite() as { pages: { id: string; root: unknown }[] };
    const page0 = site.pages[0]!;
    const stack: Record<string, unknown>[] = [page0.root as Record<string, unknown>];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.kind === "element" && (n.tag === "h1" || n.tag === "h2")) return { pageId: page0.id, nodeId: n.id as string };
      for (const c of (n.children ?? []) as unknown[]) if (c && typeof c === "object") stack.push(c as Record<string, unknown>);
    }
    return null;
  });

  // A local edit first, so there IS something to undo.
  await canvas.locator("p").first().click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("settings-tag").selectOption("h6");

  await page.evaluate((t) => {
    (window as Bus).__handle!.applyRemoteOps([
      { target: { scope: "page", id: t!.pageId }, kind: "node.setText", nodeId: t!.nodeId, text: "Theirs" },
    ]);
  }, target);
  await expect(canvas.locator("h1, h2").first()).toHaveText("Theirs");

  await page.keyboard.press("Control+z");

  // The remote author's text survives. Local history was invalidated the moment
  // their edit landed — a whole-document snapshot taken before it would revert
  // work this client never did. This is the data-loss path the whole contract
  // exists to close, and it is NOT fixed by simply keeping remote ops off the
  // stack: the danger is the snapshots already on it.
  await expect(canvas.locator("h1, h2").first()).toHaveText("Theirs");
});

test("replaceState resyncs the canvas and records the sequence", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const authoritative = await page.evaluate(() => {
    const site = (window as Bus).__editor!.extractSite() as {
      pages: { id: string; name: string; root: Record<string, unknown> }[];
    };
    // The server's version of the document, differing in one visible way.
    const stack: Record<string, unknown>[] = [site.pages[0]!.root];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.kind === "element" && (n.tag === "h1" || n.tag === "h2")) {
        n.children = ["Server truth"];
        break;
      }
      for (const c of (n.children ?? []) as unknown[]) if (c && typeof c === "object") stack.push(c as Record<string, unknown>);
    }
    return site;
  });

  await page.evaluate((site) => (window as Bus).__handle!.replaceState(site, 99), authoritative);

  await expect(canvas.locator("h1, h2").first()).toHaveText("Server truth");

  // The next outbound batch carries the server's sequence, so the host can tell
  // what this client had seen when it produced them.
  await canvas.locator("p").first().click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("settings-tag").selectOption("h6");

  const meta = await page.evaluate(() => (window as Bus).__lastMeta);
  expect(meta).toEqual({ baseSeq: 99 });
});

test("the handle survives across editor swaps", async ({ page }) => {
  await ready(page);
  // ackSeq is the cheapest observable proof the handle is bound to the CURRENT
  // editor rather than a stale closure from mount.
  await page.evaluate(() => (window as Bus).__handle!.ackSeq(5));

  const canvas = page.locator(".sui-canvas");
  await canvas.locator("p").first().click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByTestId("settings-tag").selectOption("h6");

  expect(await page.evaluate(() => (window as Bus).__lastMeta)).toEqual({ baseSeq: 5 });
});

/**
 * A default the EDITOR conjures has to be the same default in every window.
 *
 * Two people open one plant page. Neither document carries a frame, so each
 * editor materializes one — and with minted ids those two frames have different
 * node names, so a frame op relayed between them addresses an id the other side
 * has never seen. It is dropped, silently and forever, while a page op in the
 * same batch lands. Found by P05 act 5 (docs/personas/issues/083).
 */
test("two windows on the same document conjure the SAME default frame", async ({ page, context }) => {
  await ready(page);
  const second = await context.newPage();
  await second.goto("/?persist=0");
  await second.waitForFunction(() => (window as Bus).__ready === true);
  await second.waitForSelector(".sui-canvas");

  const frameIds = (p: Page) =>
    p.evaluate(() => {
      const site = (window as Bus).__editor!.extractSite() as { frame?: { root: unknown } };
      const ids: string[] = [];
      const walk = (n: unknown): void => {
        if (!n || typeof n !== "object") return;
        const node = n as { id?: string; children?: unknown[] };
        if (node.id) ids.push(node.id);
        for (const c of node.children ?? []) walk(c);
      };
      walk(site.frame?.root);
      return ids;
    });

  const a = await frameIds(page);
  const b = await frameIds(second);
  expect(a.length).toBeGreaterThan(0);
  expect(b).toEqual(a);

  // The control that matters: an op minted in one window APPLIES in the other.
  // Without it this test passes on two windows that both conjure nothing.
  const op = {
    target: { scope: "frame" },
    kind: "node.setText",
    nodeId: a[a.length - 1],
    text: "Relayed",
  };
  const got = await second.evaluate((o) => (window as Bus).__handle!.applyRemoteOps([o]), op);
  expect(got).toEqual({ applied: 1, dropped: [] });
  await second.close();
});

/**
 * `replaceState` sets `this.site` on the other path, and has to establish the
 * same two invariants the constructor does. With no frame, Layout mode falls
 * through to the PAGE root: the author edits one page believing they are
 * editing the shared shell.
 */
test("a resync that carries no frame and no pages still leaves a whole site", async ({ page }) => {
  await ready(page);
  await page.evaluate(() =>
    (window as Bus).__handle!.replaceState({ version: "1", theme: { name: "quartz", tokens: {} }, pages: [] }, 1),
  );

  const after = await page.evaluate(() => {
    const site = (window as Bus).__editor!.extractSite() as {
      frame?: { root?: { id?: string } };
      pages: { id: string }[];
    };
    return { frame: site.frame?.root?.id, pages: site.pages.map((p) => p.id) };
  });
  expect(after.frame).toBe("sui-frame-0");
  expect(after.pages).toEqual(["sui-home-page"]);
});
