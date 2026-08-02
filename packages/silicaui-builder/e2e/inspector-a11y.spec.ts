import { test, expect, type Page } from "@playwright/test";

/**
 * Two rules for the site Inspector's rail, both invisible on screen and both
 * only checkable here.
 *
 * 1. EVERY control has a name. A row was a plain `<div>` with a `<span>` above
 *    the field — which looks like a label and isn't one. Every single-control
 *    row in Settings (Name, ID, Content, ARIA label, Role, Tab index, DOM id,
 *    Title, and the custom-attribute pairs) announced as a bare "edit".
 *
 * 2. No `<label>` wraps more than one control. A `<label>` names the FIRST
 *    labelable element it wraps, and `<button>` is labelable — so wrapping a
 *    chip row in one hands the row's whole text to whichever chip comes first
 *    and leaves every other chip with no context. Those rows are `role="group"`
 *    + `aria-labelledby` instead, which names the set without taking a member's
 *    name. (The same pair of rules governs the email Inspector; see
 *    `email-inspector-a11y.spec.ts`.)
 *
 * Swept across node kinds and both tabs, because rows are per-kind — a field
 * that only appears for an Image would otherwise never be checked.
 */

const CONTROLS = "button, input:not([type=hidden]), select, textarea, [contenteditable=true]";

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

/** Audit the Inspector rail — scoped to the tab PANEL belonging to the
 *  "Inspector tab" strip, so the Navigator and toolbar aren't swept in. */
async function audit(page: Page, sel: string) {
  return page.evaluate((sel) => {
    let up = document.querySelector('[role="tablist"][aria-label="Inspector tab"]') as HTMLElement | null;
    while (up && !up.querySelector('[role="tabpanel"]')) up = up.parentElement;
    const rail = up?.querySelector('[role="tabpanel"]') as HTMLElement | null;
    if (!rail) return { total: -1, unnamed: [] as string[], hijacked: [] as string[] };

    const describe = (c: Element): string => {
      const tag = `${c.tagName.toLowerCase()}${c.getAttribute("type") ? `[${c.getAttribute("type")}]` : ""}`;
      const hint = c.getAttribute("placeholder") ?? "";
      let row = "";
      for (let el = c.parentElement, i = 0; el && i < 4; el = el.parentElement, i++) {
        const t = (el.textContent ?? "").trim();
        if (t && t.length < 50) row = t.slice(0, 40);
      }
      return `${tag}${hint ? ` ph="${hint}"` : ""}${row ? ` under "${row}"` : ""}`;
    };

    const unnamed: string[] = [];
    for (const c of Array.from(rail.querySelectorAll(sel))) {
      const named =
        c.getAttribute("aria-label") ||
        c.getAttribute("title") ||
        c.getAttribute("aria-labelledby") ||
        (c.textContent ?? "").trim() ||
        (c.id && document.querySelector(`label[for="${c.id}"]`)) ||
        c.closest("label");
      if (!named) unnamed.push(describe(c));
    }

    const hijacked: string[] = [];
    for (const label of Array.from(rail.querySelectorAll("label"))) {
      const controls = Array.from(label.querySelectorAll(sel));
      if (controls.length > 1) {
        hijacked.push(`"${(label.textContent ?? "").trim().slice(0, 45)}" → ${controls.length} controls`);
      }
      // A <label> inside a <label> is invalid HTML and leaves which one names
      // the control up to the browser — same class of defect, different shape.
      if (label.querySelector("label")) {
        hijacked.push(`"${(label.textContent ?? "").trim().slice(0, 45)}" → nested <label>`);
      }
    }
    return { total: rail.querySelectorAll(sel).length, unnamed, hijacked };
  }, sel);
}

/** Select a canvas node, then sweep both Inspector tabs. */
async function sweep(page: Page, where: string, out: { unnamed: string[]; hijacked: string[] }) {
  for (const tab of ["Design", "Settings"]) {
    const t = page.getByRole("tab", { name: tab, exact: true });
    if (!(await t.count())) continue;
    await t.click();
    const r = await audit(page, CONTROLS);
    expect(r.total, `the Inspector rail was not found for ${where}/${tab}`).toBeGreaterThan(0);
    out.unnamed.push(...r.unnamed.map((u) => `${where}/${tab}: ${u}`));
    out.hijacked.push(...r.hijacked.map((h) => `${where}/${tab}: ${h}`));
  }
}

test("every Inspector control has a name, and no label wraps a control set", async ({ page }) => {
  await ready(page);
  const out = { unnamed: [] as string[], hijacked: [] as string[] };

  // Everything inside `main` — the editable PAGE body. The frame chrome around
  // it is the inert context layer in Page mode, so clicking it just deselects.
  const targets: [string, string][] = [
    ["section", ".sui-canvas main [data-sui-id]"],
    ["heading", ".sui-canvas main h1, .sui-canvas main h2"],
    ["image", ".sui-canvas main img"],
    ["button", ".sui-canvas main .btn"],
    ["paragraph", ".sui-canvas main p"],
  ];
  for (const [name, sel] of targets) {
    const node = page.locator(sel).first();
    if (!(await node.count())) continue;
    await node.click({ force: true });
    await sweep(page, name, out);
  }

  expect(out.hijacked, `a <label> wrapping a control SET — the first control inherits the row's whole text:\n  ${out.hijacked.join("\n  ")}`).toEqual([]);
  expect(out.unnamed, `controls with no accessible name of any kind:\n  ${out.unnamed.join("\n  ")}`).toEqual([]);
});
