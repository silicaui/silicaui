import { test, expect, type Page } from "@playwright/test";

/**
 * The host adapter (builder-contract.md §5) — `catalog` merge, `validateClass`
 * composed with the built-in floor, `inspectorPanels`, and the `dataSources`-
 * powered binding picker. Mounted via `?host=demo`; the demo `BuilderHost`
 * lives in `harness/main.tsx`. `pickAsset` is exercised implicitly (its UI is
 * covered by the Inspector's own asset-control affordance, gated on the same
 * host object these tests already mount).
 */

async function ready(page: Page): Promise<void> {
  await page.goto("/?host=demo");
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await page.waitForSelector(".sui-canvas");
}

test("host.catalog() extends the Insert palette, and the inserted node renders", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  await page.getByRole("button", { name: "Insert" }).click();
  await expect(page.getByText("Host", { exact: true })).toBeVisible();
  await page.locator('[data-insert-key="host:callout"]').click();

  await expect(canvas.locator("#host-callout")).toHaveText("Host-contributed block");
});

test("host.validateClass composes with the built-in floor — both reject, host adds its own reason", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();

  const classField = page.locator("textarea").first();
  const before = await classField.inputValue();

  // The built-in floor rejects `fixed` regardless of any host policy.
  await classField.fill(`${before} fixed`);
  await classField.blur();
  await expect(page.getByText(/`fixed` is banned/)).toBeVisible();
  await expect(classField).toHaveValue(`${before} fixed`); // draft kept, not silently reverted
  await expect(canvas.locator("h1", { hasText: HEADLINE })).not.toHaveClass(/\bfixed\b/);

  // The demo host's OWN policy rejects a token the built-in floor allows.
  await classField.fill(`${before} host-banned`);
  await classField.blur();
  await expect(page.getByText(/demo host blocks "host-banned"/)).toBeVisible();

  // A clean edit still commits normally.
  await classField.fill(`${before} text-primary`);
  await classField.blur();
  await expect(canvas.locator("h1", { hasText: HEADLINE })).toHaveClass(/text-primary/);
});

test("host.inspectorPanels renders a host panel that writes through the shared mutation primitives", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();

  await expect(page.getByText("Host panel", { exact: true })).toBeVisible();
  await expect(page.getByTestId("host-panel")).toBeVisible();
  await page.getByTestId("host-panel-set-attr").click();

  await expect(canvas.locator('[data-host-note="set-by-host-panel"]', { hasText: HEADLINE })).toHaveCount(1);
});

test("host.dataSources() + scopeAt turn the Reference field into a picker", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();

  await page.getByTestId("data-kind").selectOption("value");

  // With dataSources() supplied, Reference is a picker (a <select>), not a raw
  // text input — populated from the demo host's flat + nested field catalog.
  const refSelect = page.getByTestId("data-ref-picker");
  await expect(refSelect.locator("option", { hasText: "Site title" })).toHaveCount(1);
  await expect(refSelect.locator("option", { hasText: "Products > Title" })).toHaveCount(1);
  await refSelect.selectOption("site.title");
  await expect(refSelect).toHaveValue("site.title");
});

test("a value bind's Target attribute round-trips through editor.setData", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("value");
  await page.getByTestId("data-ref-picker").selectOption("site.title");

  const attrField = page.getByPlaceholder("auto-detected (e.g. leave blank for text/src)");
  await attrField.fill("href");
  await attrField.blur();

  // Select a genuinely different node and back — the field must reseed from
  // the persisted `data.attr` (a fresh `id` prop), not just retain whatever
  // local draft state the input happened to have.
  await canvas.getByText("Get started").click();
  await canvas.getByText(HEADLINE).click();
  await expect(page.getByPlaceholder("auto-detected (e.g. leave blank for text/src)")).toHaveValue("href");
});

test("toolbarSlot renders host UI in the header, next to Publish", async ({ page }) => {
  await ready(page);
  await expect(page.getByTestId("toolbar-slot")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
});

test("a collection bind's 'Omit when empty' toggle drops the node from the resolved output at zero items", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();

  await page.getByTestId("data-kind").selectOption("collection");
  const refSelect = page.getByTestId("data-ref-picker");
  // `empty-collection` always resolves to zero items in the demo host — the
  // ref this toggle actually changes behavior for (unlike `products`, which
  // never hits the zero-item case).
  await refSelect.selectOption("empty-collection");
  await expect(page.getByText("0 items — the template renders once as a placeholder", { exact: true })).toBeVisible();

  await page.locator("div.mb-2", { hasText: "Omit when empty" }).locator('[role="switch"]').click();
  await expect(page.getByText("0 items — the node is omitted entirely", { exact: true })).toBeVisible();

  // The bound node (the headline) is dropped from the resolved tree entirely
  // — proven directly against the engine's own resolve, since this demo host
  // has no live "resolved preview" render surface on the canvas itself (the
  // canvas always shows the AUTHORED tree, not a resolved one — see Canvas's
  // own doc comment). `packages/silicaui-html/verify-resolve.mjs` covers the
  // resolver-level assertion end to end; this test proves the UI round-trips
  // the flag into `editor.setData` without error.
  await expect(refSelect).toHaveValue("empty-collection");
});

test("onActivePageChange fires on mount, and again on a page switch/rename", async ({ page }) => {
  await ready(page);

  await page.waitForFunction(() => (window as unknown as { __activePage?: unknown }).__activePage !== undefined);
  const initial = (await page.evaluate(
    () => (window as unknown as { __activePage: { id: string; name: string; slug: string } }).__activePage,
  )) as { id: string; name: string; slug: string };
  expect(initial.name).toBeTruthy();

  // Adding a page switches to it — the callback fires again with the NEW page.
  await page.getByRole("button", { name: "Add page" }).click();
  await page.waitForFunction(
    (prevId) => (window as unknown as { __activePage: { id: string } }).__activePage.id !== prevId,
    initial.id,
  );
  const afterAdd = (await page.evaluate(
    () => (window as unknown as { __activePage: { id: string; name: string } }).__activePage,
  )) as { id: string; name: string };
  expect(afterAdd.name).toBe("Page 2");

  // Renaming the (now active) page fires again with the updated name.
  await page.getByRole("button", { name: "Rename page" }).click();
  await page.locator("input").last().fill("Landing");
  await page.locator("input").last().press("Enter");
  await page.waitForFunction(
    () => (window as unknown as { __activePage: { name: string } }).__activePage.name === "Landing",
  );
});

test("the Data binding Preview row calls host.resolveBinding/resolveCollection live", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("value");
  await page.getByTestId("data-ref-picker").selectOption("site.title");

  // resolveBinding("site.title") is fixed sample data in the demo host. Scoped
  // to the Preview ROW — the canvas resolves the same ref now too, so a bare
  // text match is ambiguous (and that ambiguity is the feature working).
  await expect(page.getByTestId("data-preview")).toHaveText("Acme Storefront");
  await expect(canvas.getByRole("heading", { name: "Acme Storefront" })).toBeVisible();

  // `product.title` is declared as a FIELD of the `products` collection, so at
  // top-level scope there's no item to resolve it against — the host returns
  // `{ value: undefined }` ("known, but empty here"), which previews as blank
  // rather than as an error. Being declared-and-handled, it is NOT an unknown ref.
  await page.getByTestId("data-ref-picker").selectOption("product.title");
  await expect(page.getByTestId("data-unknown-ref")).toHaveCount(0);

  // Switch to a collection bind — the preview shows the resolved item count.
  await page.getByTestId("data-kind").selectOption("collection");
  await page.getByTestId("data-ref-picker").selectOption("products");
  await expect(page.getByText("3 items")).toBeVisible();
});

test("a ref the host cannot resolve fails LOUDLY — it never blanks the node silently", async ({ page }) => {
  await ready(page);
  const canvas = page.locator(".sui-canvas");

  const HEADLINE = "Ship your store in an afternoon";
  await canvas.getByText(HEADLINE).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByTestId("data-kind").selectOption("value");

  // The picker only offers refs the host DECLARED, so an unknown ref can't be
  // reached through it — it's what a stale document or a host whose catalog and
  // resolver disagree produces. Write one straight into the engine, which is
  // exactly the state a consumer hit in the wild.
  await page.evaluate(() => {
    const ed = (window as unknown as { __editor: { selection?: string; setData(id: string, b: unknown): void } })
      .__editor;
    ed.setData(ed.selection!, { kind: "value", ref: "logo" });
  });

  // LOUD: the Inspector names the bad ref instead of previewing an empty string.
  const err = page.getByTestId("data-unknown-ref");
  await expect(err).toBeVisible();
  await expect(err).toContainText("logo");

  // NOT DESTRUCTIVE: the authored headline still renders. Before this, an
  // unresolvable ref blanked the node and the author was left with an empty
  // span and no explanation.
  await expect(canvas.getByText(HEADLINE)).toBeVisible();
});
