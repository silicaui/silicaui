import { chromium } from "@playwright/test";

const URL = "http://localhost:5178/";
const out = { steps: [], errors: [] };
const log = (k, v) => out.steps.push({ [k]: v });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => { if (m.type() === "error") out.errors.push(m.text()); });
page.on("pageerror", (e) => out.errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });

const canvas = page.locator(".sui-canvas");
log("canvasPresent", await canvas.count());
log("heroHeadline", (await canvas.locator("h1").first().textContent())?.trim());

// 1) Switch the left rail to the Insert tab → the palette renders.
await page.locator("aside").first().getByText("Insert", { exact: true }).click();
await page.waitForTimeout(120);
log("paletteRows", await page.locator("button[data-insert-key]").count());
log("hasHeadingRow", await page.locator('button[data-insert-key="heading"]').count());
log("hasBlockRow", await page.locator('button[data-insert-key^="block:"]').count());

// 2) Click-insert appends to the page root (nothing selected) + selects the new node.
await canvas.click({ position: { x: 6, y: 6 } }); // click the canvas margin → deselect
const btnBefore = await canvas.locator("button").count();
await page.locator('button[data-insert-key="button"]').click();
await page.waitForTimeout(120);
const btnAfter = await canvas.locator("button").count();
log("buttonsBefore", btnBefore);
log("buttonsAfter", btnAfter);
log("insertedButtonText", await canvas.locator('button:has-text("Button")').count());

// Undo the insert.
await page.locator('header button[aria-label="Undo"]').click();
await page.waitForTimeout(120);
log("buttonsAfterUndo", await canvas.locator("button").count());

// A reusable synthetic HTML5 drag that carries a real DataTransfer across
// dragstart → dragover → drop (Playwright's dragTo doesn't preserve setData).
const fireDnD = ([srcSel, tgtSel, frac]) => {
  const src = document.querySelector(srcSel);
  const tgt = document.querySelector(tgtSel);
  if (!src || !tgt) return "missing";
  const dt = new DataTransfer();
  const r = tgt.getBoundingClientRect();
  const opts = (extra) => ({ bubbles: true, cancelable: true, composed: true, dataTransfer: dt, ...extra });
  src.dispatchEvent(new DragEvent("dragstart", opts()));
  const pt = { clientX: r.left + r.width / 2, clientY: r.top + r.height * frac };
  tgt.dispatchEvent(new DragEvent("dragover", opts(pt)));
  tgt.dispatchEvent(new DragEvent("drop", opts(pt)));
  src.dispatchEvent(new DragEvent("dragend", opts()));
  return "fired";
};

// 3) Drag-to-INSERT: drop a Heading onto the hero image, lower half → lands AFTER it.
const h2Before = await canvas.locator("h2").count();
log("dragInsertFire", await page.evaluate(fireDnD, ['button[data-insert-key="heading"]', ".sui-canvas img", 0.75]));
await page.waitForTimeout(150);
log("h2Before", h2Before);
log("h2After", await canvas.locator("h2").count());
log("insertedHeadingText", await canvas.locator('h2:has-text("Heading")').count());

// 4) Drag-to-REORDER: move the subhead <p> before the <h1> (upper half of h1).
log("dragMoveFire", await page.evaluate(fireDnD, [".sui-canvas p", ".sui-canvas h1", 0.2]));
await page.waitForTimeout(150);
log("h1PrevIsParagraph", await page.evaluate(() => {
  const h1 = document.querySelector(".sui-canvas h1");
  const prev = h1?.previousElementSibling;
  return prev ? prev.tagName.toLowerCase() : null;
}));

await page.screenshot({ path: "C:/Users/brand/AppData/Local/Temp/claude/g--code--wizeworks-silicaui/5d7b0096-d68e-4779-97a6-071a24cc02c8/scratchpad/insert-drag.png", fullPage: false });

console.log(JSON.stringify(out, null, 2));
await browser.close();
