import { test, expect, type Page } from "@playwright/test";

/**
 * The email builder's state-and-intent-out contract, driven through the REAL
 * React seam — the twin of `collab-ops.spec.ts`.
 *
 * Engine-level proofs (including convergence) live in `probe-email-ops.ts`. What
 * only a browser covers is the seam a host actually touches: ops reaching
 * `onChange` from genuine UI interaction, the handle surviving React's
 * lifecycle, and — the one that matters most — a remote op REPAINTING THE
 * CANVAS. An op that updates state but leaves the DOM stale looks identical to a
 * working implementation in any engine test.
 */

interface Bus {
  __ready?: boolean;
  __ops?: { kind: string; nodeId?: string; patch?: Record<string, unknown> }[];
  __lastMeta?: { baseSeq: number };
  __changeCount?: number;
  __emailHandle?: {
    applyRemoteOps(ops: unknown[]): { applied: number; dropped: unknown[] };
    replaceState(project: unknown, seq: number): void;
    ackSeq(seq: number): void;
  };
  __lastChange?: { templates: { id: string; document: { root: Record<string, unknown> } }[] };
}

async function ready(page: Page): Promise<void> {
  await page.goto("/?editor=email&persist=0");
  await page.waitForFunction(() => (window as Bus).__ready === true);
  await page.waitForSelector(".sui-email-canvas, [data-email-canvas], .sui-canvas");
}

const ops = (page: Page) => page.evaluate(() => (window as Bus).__ops ?? []);

/** The active template id + the first text node in it, read the way a
 *  collaborator's op would name them: by id, from state they already hold. */
async function target(page: Page) {
  return page.evaluate(() => {
    const proj = (window as Bus).__lastChange!;
    const t = proj.templates[0]!;
    const stack: Record<string, unknown>[] = [t.document.root];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.kind === "text") return { templateId: t.id, nodeId: n.id as string };
      for (const c of (n.children ?? []) as unknown[]) if (c && typeof c === "object") stack.push(c as Record<string, unknown>);
    }
    return null;
  });
}

/** Make one real edit so `__lastChange` is populated (the harness only records
 *  it on change, and we need node ids from the live project). */
async function seedAnEdit(page: Page): Promise<void> {
  await page.getByLabel("Subject").fill("Seeded subject");
  await page.getByLabel("Subject").blur();
  await page.waitForFunction(() => ((window as Bus).__changeCount ?? 0) > 0);
}

test("a real UI edit emits semantic ops, not just a new project", async ({ page }) => {
  await ready(page);
  await seedAnEdit(page);

  const emitted = await ops(page);
  const meta = emitted.filter((o) => o.kind === "template.setMeta");
  expect(meta.length).toBeGreaterThan(0);

  // meta rides along, starting at 0 before the host has acked anything.
  expect(await page.evaluate(() => (window as Bus).__lastMeta)).toEqual({ baseSeq: 0 });
});

test("a remote op repaints the canvas without a reload, and does not echo back", async ({ page }) => {
  await ready(page);
  await seedAnEdit(page);
  const t = await target(page);
  expect(t).not.toBeNull();

  const opsBefore = (await ops(page)).length;
  const changesBefore = await page.evaluate(() => (window as Bus).__changeCount ?? 0);

  const result = await page.evaluate((tt) => {
    return (window as Bus).__emailHandle!.applyRemoteOps([
      {
        target: { scope: "template", id: tt!.templateId },
        kind: "node.update",
        nodeId: tt!.nodeId,
        patch: { html: "Edited elsewhere" },
      },
    ]);
  }, t);

  expect(result.applied).toBe(1);
  expect(result.dropped).toHaveLength(0);

  // The whole point: the other author's edit is ON SCREEN, no reload.
  await expect(page.getByText("Edited elsewhere").first()).toBeVisible();

  // …and it did NOT come back out as a local edit, which would loop a host that
  // wires onChange straight to a broadcast.
  expect((await ops(page)).length).toBe(opsBefore);
  expect(await page.evaluate(() => (window as Bus).__changeCount ?? 0)).toBe(changesBefore);
});

test("a remote op is not undoable — local undo never reverts another author's work", async ({ page }) => {
  await ready(page);
  await seedAnEdit(page);
  const t = await target(page);

  await page.evaluate((tt) => {
    (window as Bus).__emailHandle!.applyRemoteOps([
      {
        target: { scope: "template", id: tt!.templateId },
        kind: "node.update",
        nodeId: tt!.nodeId,
        patch: { html: "Theirs" },
      },
    ]);
  }, t);
  await expect(page.getByText("Theirs").first()).toBeVisible();

  await page.keyboard.press("Control+z");

  // Local history was invalidated the moment their edit landed — a snapshot
  // taken before it would revert work this client never did.
  await expect(page.getByText("Theirs").first()).toBeVisible();
});

test("replaceState resyncs the canvas and records the sequence", async ({ page }) => {
  await ready(page);
  await seedAnEdit(page);

  const authoritative = await page.evaluate(() => {
    const proj = structuredClone((window as Bus).__lastChange!);
    const stack: Record<string, unknown>[] = [proj.templates[0]!.document.root];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.kind === "text") {
        n.html = "Server truth";
        break;
      }
      for (const c of (n.children ?? []) as unknown[]) if (c && typeof c === "object") stack.push(c as Record<string, unknown>);
    }
    return proj;
  });

  await page.evaluate((proj) => (window as Bus).__emailHandle!.replaceState(proj, 99), authoritative);
  await expect(page.getByText("Server truth").first()).toBeVisible();

  // The next outbound batch carries the server's sequence.
  await page.getByLabel("Subject").fill("After resync");
  await page.getByLabel("Subject").blur();
  await page.waitForFunction(() => (window as Bus).__lastMeta?.baseSeq === 99);
  expect(await page.evaluate(() => (window as Bus).__lastMeta)).toEqual({ baseSeq: 99 });
});
