import { test, expect, type Page } from "@playwright/test";

/**
 * Other editors — the half a headless probe cannot reach.
 *
 * `probe-peers.ts` already proves the engine: every mutation refuses inside a
 * claimed subtree, remote ops still land, nothing touches the document. What it
 * cannot prove is the reason the feature exists at all — that the author can SEE
 * it. Co-editing worked before any of this; what it lacked was a heading
 * rewriting itself under your cursor with anything on screen connecting that to
 * a name.
 *
 * So these tests are about attribution and affordance: a named ring on the
 * canvas, a marker in the tree, a rail that says who has it, and write gestures
 * that are gone rather than silently ignored.
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

/** Push a roster the way a host's relay socket would. */
async function setPeers(page: Page, peers: unknown[]): Promise<void> {
  await page.evaluate(
    (p) => (window as unknown as { __setPeers: (x: unknown[]) => void }).__setPeers(p),
    peers,
  );
}

/** The id of the first heading on the canvas — a real node to put someone on. */
async function headingId(page: Page): Promise<string> {
  const id = await page.locator(".sui-canvas h1[data-sui-id]").first().getAttribute("data-sui-id");
  expect(id).toBeTruthy();
  return id!;
}

test("a peer's selection is drawn on the canvas, named, and under the local ring", async ({ page }) => {
  await ready(page);
  const id = await headingId(page);

  await setPeers(page, [{ id: "sock_ana", name: "Ana", selection: [id] }]);

  // The name is the whole point — a ring with no name says "something is
  // happening" and leaves the author to guess who.
  const label = page.locator(".sui-canvas").getByText("Ana", { exact: true });
  await expect(label).toBeVisible();

  // Dashed, so a peer's ring never reads as your own selection, and BELOW the
  // local ring's z-20 for when you're both on the same node.
  const ring = label.locator("xpath=..");
  const style = await ring.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, z: cs.zIndex };
  });
  expect(style).toEqual({ style: "dashed", z: "19" });

  // Presence is not document state: drawing someone's selection must not look
  // like an edit to the host.
  expect(await page.evaluate(() => (window as unknown as { __changeCount: number }).__changeCount)).toBe(0);

  await setPeers(page, []);
  await expect(page.locator(".sui-canvas").getByText("Ana", { exact: true })).toHaveCount(0);
});

test("a claimed subtree loses its write affordances and says who has it", async ({ page }) => {
  await ready(page);
  const id = await headingId(page);
  const node = page.locator(`.sui-canvas [data-sui-id="${id}"]`);

  // Before: a normal, draggable, double-click-to-edit node.
  await expect(node).toHaveAttribute("draggable", "true");

  await setPeers(page, [{ id: "sock_ana", name: "Ana", selection: [id], claim: [id] }]);

  await expect(node).toHaveAttribute("data-sui-claimed", "");
  // Not draggable, and the cursor says so before the author commits to a
  // gesture — the point of doing this in the chrome as well as the engine.
  await expect(node).toHaveAttribute("draggable", "false");
  expect(await node.evaluate((el) => getComputedStyle(el).cursor)).toBe("not-allowed");

  // Still SELECTABLE. You can look at what someone else is editing, and the
  // Inspector is where the author finds out why nothing they type is landing.
  await node.click();
  await expect(page.getByTestId("claim-notice")).toContainText("Ana");

  // Double-click, which normally opens in-place editing, does nothing.
  await node.dblclick();
  await expect(node).not.toHaveAttribute("contenteditable", "true");

  // And the engine agrees: a write through the public API is a no-op, so the
  // host never sees a change it would have to reconcile.
  const before = await node.textContent();
  await page.evaluate(
    (nodeId) => (window as unknown as { __editor: { setText(id: string, t: string): void } }).__editor.setText(nodeId, "Hijacked"),
    id,
  );
  await expect(node).toHaveText(before ?? "");
  expect(await page.evaluate(() => (window as unknown as { __changeCount: number }).__changeCount)).toBe(0);

  // Releasing is just a roster without the claim — no reload, no reconciliation.
  await setPeers(page, [{ id: "sock_ana", name: "Ana" }]);
  await expect(node).toHaveAttribute("draggable", "true");
  await expect(page.getByTestId("claim-notice")).toHaveCount(0);
});

test("the Navigator marks the held row, and refuses to rename inside it", async ({ page }) => {
  await ready(page);
  const id = await headingId(page);

  await setPeers(page, [{ id: "sock_ana", name: "Ana", claim: [id] }]);

  // The row carries a dot titled with the holder — the tree and the canvas have
  // to agree, or "who is that?" needs a third lookup.
  const marker = page.locator('[title="Ana is editing this"]');
  await expect(marker.first()).toBeVisible();

  // A held row is not renamable. `setLabel` is refused by the engine anyway;
  // taking the affordance away is how the author finds out before typing.
  await page.locator(`.sui-canvas [data-sui-id="${id}"]`).click();
  // The row the dot is ON, not every ancestor row that contains it.
  const row = marker.first().locator('xpath=ancestor::*[@role="treeitem"][1]');
  await row.dblclick();
  await expect(row.locator("input")).toHaveCount(0);
});
