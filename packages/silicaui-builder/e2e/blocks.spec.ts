import { test, expect, type Page } from "@playwright/test";

/**
 * Block-library guard: every marketing block is a fully-editable composed tree
 * (real child nodes, not props). Inserting one from the palette must render its
 * content on the canvas through the normal element path — with zero per-block
 * Canvas code and zero React warnings. This locks the palette→insert→render chain
 * for the whole block catalog, and (because the harness builds Tailwind from
 * source) proves each block's utility classes survive the `@source` safelist scan.
 */

function trackErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
    page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
    });
    return errors;
}

async function ready(page: Page): Promise<void> {
    await page.goto("/");
    await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
    await page.waitForSelector(".sui-canvas");
}

async function insertBlock(page: Page, key: string): Promise<void> {
    await page.getByRole("button", { name: "Insert" }).click();
    await page.locator(`[data-insert-key="block:${key}"]`).click();
}

test("marketing blocks insert and render their content on the canvas", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    // A representative sweep across the library — chrome, social proof, pricing,
    // content, and the working form — asserting a distinctive string from each.
    await insertBlock(page, "navbar");
    await expect(canvas.getByText("SilicaUI").first()).toBeVisible();

    await insertBlock(page, "pricing_tiers");
    await expect(canvas.getByText("Simple, transparent pricing")).toBeVisible();
    await expect(canvas.getByText("$29")).toBeVisible();

    await insertBlock(page, "stats_band");
    await expect(canvas.getByText("99.99%")).toBeVisible();

    await insertBlock(page, "testimonials_grid");
    await expect(canvas.getByText("Loved by teams everywhere")).toBeVisible();

    await insertBlock(page, "cta_band");
    await expect(canvas.getByText("Ready to build something great?")).toBeVisible();

    await insertBlock(page, "footer");
    // The default frame already carries a footer, so the inserted one is the 2nd.
    await expect(canvas.getByText("© 2026 SilicaUI, Inc. All rights reserved.").first()).toBeVisible();

    expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The navbar FAMILY. Five layouts replaced one block plus an inert `navbar-start`
 * primitive that wore the same palette label — so the guard that matters is that
 * all five are real, distinct, and every one of them collapses. A header with no
 * mobile menu is broken on a phone, and shipping one beside four that work is the
 * exact confusion this family was built to end.
 */
test("every navbar layout renders, is distinct, and collapses to a mobile menu", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    for (const key of [
        "navbar",
        "navbar_center_links",
        "navbar_center_logo",
        "navbar_mega_menu",
        "navbar_floating_pill",
    ]) {
        await insertBlock(page, key);
    }

    // Each layout asserted by something only IT has, so a copy-paste regression
    // (five rows that all insert the same header) fails here.
    await expect(canvas.getByText("Sign up").first()).toBeVisible(); //     Center Links: the auth pair
    await expect(canvas.locator(".wordmark-lg")).toHaveCount(1); //         Center Logo: the oversized mark
    await expect(canvas.locator("header .glass")).toHaveCount(1); //        Floating Pill: the frosted capsule
    await expect(canvas.getByText("⌘K")).toBeVisible(); //                  Mega Menu: search affordance

    // Mega Menu's shelf renders IN FLOW below the bar. This is the assertion that
    // would fail if the shelf were ever re-done with the `menu` behavior: an
    // absolutely-positioned panel is force-revealed by the canvas and would
    // blanket everything under the header instead of pushing it down.
    await expect(canvas.getByText("Build", { exact: true })).toBeVisible();
    await expect(canvas.getByText("Publishing")).toBeVisible();

    // 7 panels on the canvas: one mobile menu per header (5 inserted + the
    // frame's own navbar) plus the mega shelf. At desktop width the mobile menus
    // are `@md:hidden`, so the shelf is the only one showing.
    const panels = canvas.locator('header [data-sui-part="panel"]');
    await expect(panels).toHaveCount(7);
    await expect(canvas.locator('header [data-sui-part="panel"]:visible')).toHaveCount(1);

    // Narrow the board: every mobile menu takes over (the canvas force-reveals
    // panels so they're editable) and the desktop-only shelf drops out.
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await expect(canvas.locator('header [data-sui-part="panel"]:visible')).toHaveCount(6);
    await expect(canvas.getByText("Publishing")).toBeHidden();
    // And the hamburgers that drive them are up — hidden at desktop, shown here.
    await expect(canvas.locator('header [data-sui-part="trigger"]:visible')).toHaveCount(6);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The hero FAMILY. Five layouts replaced one block plus a bare `.hero` primitive
 * that wore the same palette label, so the guard that matters is that all five
 * are real and DISTINCT — five rows that insert variations of one grid would be
 * the same confusion the split was meant to end.
 *
 * This also covers the one thing a unit test can't: the classes have to survive
 * the `@source` safelist scan. `.display-1` in particular is fluid via `cqi`, so
 * a headline that never grows is the visible symptom of CSS that didn't generate.
 */
test("every hero layout renders, is distinct, and sizes its headline off the container", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    for (const key of ["hero_split_cta", "hero_centered", "hero_spotlight", "hero_signup", "hero_statement"]) {
        await insertBlock(page, key);
    }

    // Each layout asserted by something only IT has.
    await expect(canvas.locator("section.hero .hero-overlay")).toHaveCount(1); //   Image Overlay: the scrim
    await expect(canvas.locator('section[data-theme="dark"]')).toHaveCount(1); //   ...and its theme island
    await expect(canvas.locator('form input[type="email"]')).toHaveCount(1); //     Email Capture: the field
    await expect(canvas.getByText("Already running on")).toBeVisible(); //          Centered: the logo strip
    await expect(canvas.getByText("Built in the open")).toBeVisible(); //           Bold Statement: a proof point
    // `.first()`: the harness boots with a Split CTA already on the canvas, so
    // the inserted one is the second — which is itself the proof that the block
    // the harness ships and the block the palette inserts are the same tree.
    await expect(canvas.getByText("Ship your store in an afternoon").first()).toBeVisible(); // Split CTA
    await expect(canvas.getByText("Ship your store in an afternoon")).toHaveCount(2);

    // The scrim must actually PAINT on the canvas. It is an empty div by design,
    // and the empty-container affordance's `bg-base-content/5` is a utility, so
    // it used to win over `.hero-overlay` and repaint the scrim as a 5% tint —
    // leaving light-on-light copy in the builder while the published HTML was
    // fine. Assert the real 50% black, not merely that the element exists.
    const scrimAlpha = await canvas
        .locator(".hero-overlay")
        .first()
        .evaluate((n) => {
            const bg = getComputedStyle(n).backgroundColor;
            return parseFloat(bg.match(/[\d.]+\s*\)$/)?.[0] ?? "1");
        });
    expect(scrimAlpha).toBeGreaterThan(0.3);

    // Bold Statement is the media-free one — the whole reason it exists.
    const statement = canvas.locator("section", { hasText: "Built in the open" }).last();
    await expect(statement.locator("img")).toHaveCount(0);

    // `.display-1` must actually resolve. A class that failed to generate leaves
    // the h1 at the browser's 2em default, so this catches a safelist miss that
    // a "does the text appear" assertion sails straight past.
    const centeredH1 = canvas.getByText("Everything your team needs, on one canvas");
    const size = await centeredH1.evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
    expect(size).toBeGreaterThan(40);

    // ...and it must be CONTAINER-driven, not viewport-driven: narrowing the
    // board has to shrink it. That distinction is the whole argument for the
    // display ramp over a `text-4xl @3xl:text-5xl` chain, so it gets asserted.
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await expect
        .poll(() => centeredH1.evaluate((n) => parseFloat(getComputedStyle(n).fontSize)))
        .toBeLessThan(size);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("interactive composites insert and reveal every panel on the canvas", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    // Tabs ship panels 2/3 `hidden` so only the first shows before hydration; the
    // canvas reveal rule must surface ALL panels so every one is editable in the
    // builder (there's no runtime to switch tabs on the design surface).
    await insertBlock(page, "tabs");
    await expect(canvas.getByText("A quick summary of what this product does and who it's for.")).toBeVisible();
    await expect(canvas.getByText("Straightforward plans that scale as your team grows.")).toBeVisible(); // authored hidden

    // Dropdown's menu panel ships `hidden`; revealed on canvas so its items edit.
    await insertBlock(page, "dropdown");
    await expect(canvas.getByText("Options")).toBeVisible(); // trigger
    await expect(canvas.getByText("Sign out")).toBeVisible(); // item inside the hidden panel

    // Accordion (multi-open disclosure) reveals every section body for editing.
    await insertBlock(page, "accordion");
    await expect(canvas.getByText("You're charged monthly and can change or cancel your plan anytime.")).toBeVisible(); // authored hidden

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("collapsed disclosure panels are revealed on the canvas so they're editable", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    // The FAQ block ships its 2nd/3rd answers `hidden` (so they don't flash before a
    // runtime hydrates). On the canvas there's no runtime, so the reveal-on-canvas
    // rule must surface every answer for editing — even the ones authored hidden.
    await insertBlock(page, "faq_accordion");
    await expect(canvas.getByText("Nope — everything is visual.")).toBeVisible(); // open by default
    await expect(canvas.getByText("Yes, connect any domain you already own.")).toBeVisible(); // authored hidden

    expect(errors, errors.join("\n")).toHaveLength(0);
});

test("the contact block lowers a real form with the wired control structure", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    await insertBlock(page, "contact_section");
    await expect(canvas.getByText("Get in touch")).toBeVisible();

    // The canvas renders the form's STRUCTURE (a <form> with two required inputs, a
    // textarea, and a submit button). The Phase-2 contract markers
    // (data-sui-behavior="form" / data-sui-action="contact") are a production-output
    // concern lowered by toHtml — locked by the golden fixture, not the canvas DOM.
    const form = canvas.locator("form").first();
    await expect(form).toBeVisible();
    await expect(form.locator("input[required]")).toHaveCount(2);
    await expect(form.locator("textarea")).toHaveCount(1);
    await expect(form.locator('button[type="submit"]')).toHaveCount(1);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The FOOTER family. Five layouts replaced one block plus an inert `.footer`
 * primitive that wore the same palette label, so the guard that matters is that
 * all five are real, distinct, and each one is an actual `contentinfo` landmark
 * rather than a `<section>` that merely looks like a footer.
 */
test("every footer layout renders, is distinct, and is a real footer landmark", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    for (const key of ["footer", "footer_minimal", "footer_newsletter", "footer_closing_cta", "footer_sitemap"]) {
        await insertBlock(page, key);
    }

    // Each layout asserted by something only IT has, so a copy-paste regression
    // (five rows that all insert the same footer) fails here.
    // `.first()`: the default frame already carries a Columns footer, so the
    // inserted one is the second — which is itself the proof that the block the
    // frame ships and the block the palette inserts are the same tree.
    await expect(canvas.getByText("Resources").first()).toBeVisible(); //         Columns: its third column
    await expect(canvas.getByText("Resources")).toHaveCount(2);
    await expect(canvas.getByText("Support", { exact: true })).toBeVisible(); //  Minimal: an inline link
    await expect(canvas.getByText("One email a month", { exact: false })).toBeVisible(); // Newsletter
    await expect(canvas.getByText("Your store is one afternoon away")).toBeVisible(); //    Closing CTA
    await expect(canvas.getByText("All systems operational")).toBeVisible(); //             Sitemap

    // Six `<footer>` elements: the five inserted plus the frame's own. A variant
    // built on `<section>` would still look right and would silently drop the
    // contentinfo landmark, which is why this counts TAGS and not classes.
    await expect(canvas.locator("footer")).toHaveCount(6);
    // Exactly one dark island, and it is the closer.
    await expect(canvas.locator('footer[data-theme="dark"]')).toHaveCount(1);
    // The theme toggle belongs to Minimal alone — a marketing page whose header
    // already has one does not want a second one in the footer. Matched by its
    // icon-only button rather than the behavior marker: the canvas renders
    // `data-sui-part` (Canvas.tsx) but not `data-sui-behavior`, since there is no
    // runtime on the design surface for the marker to drive. That the marker
    // reaches OUTPUT is asserted in silicaui-html's verify + golden fixture.
    await expect(canvas.locator("footer button.btn-square")).toHaveCount(1);
    // Newsletter is the only footer that submits.
    await expect(canvas.locator('footer form input[type="email"]')).toHaveCount(1);

    // Narrow the board: the Columns grid collapses from five tracks to one. This
    // is the assertion that proves the `@3xl:grid-cols-5` literal survived the
    // `@source` safelist scan — a class that never generated would report one
    // track at BOTH widths and look like a deliberate single-column footer.
    const columnsGrid = canvas.getByText("Resources").first().locator("xpath=ancestor::div[contains(@class,'grid')][1]");
    await expect
        .poll(() => columnsGrid.evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(" ").length))
        .toBeGreaterThan(1);
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await expect
        .poll(() => columnsGrid.evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(" ").length))
        .toBe(1);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The PRICING family. Five layouts where there used to be one, so the guard is
 * that they are five genuinely different ANSWERS — three tiers, a billing
 * switch, two plans, one plan, and a comparison matrix — rather than five
 * variations on a card grid.
 */
test("every pricing layout renders, is distinct, and the billing switch is real tabs", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    for (const key of ["pricing_tiers", "pricing_toggle", "pricing_duo", "pricing_single", "pricing_table"]) {
        await insertBlock(page, key);
    }

    await expect(canvas.getByText("Simple, transparent pricing")).toBeVisible(); //     Tiers
    await expect(canvas.getByText("Pay monthly, or save with annual")).toBeVisible(); // Billing Toggle
    await expect(canvas.getByText("$290")).toBeVisible(); //                             ...and its annual panel
    await expect(canvas.getByText("Two plans, no calculator")).toBeVisible(); //         Two Plans
    await expect(canvas.getByText("One price. Everything in it.")).toBeVisible(); //     Single Plan
    await expect(canvas.getByText("Compare every plan")).toBeVisible(); //               Comparison

    // Comparison is the only one that is a real <table>, which is the entire
    // reason it can express "which plan has this" to a screen reader at all.
    await expect(canvas.locator("table.table")).toHaveCount(1);
    await expect(canvas.locator('table th[scope="row"]')).toHaveCount(8);
    await expect(canvas.locator('table th[scope="col"]')).toHaveCount(3);

    // The billing switch is `tabs`: two tab parts, two panel parts. The canvas
    // force-reveals the authored-hidden annual panel so it stays editable, which
    // is why both price sets are visible here and only one would be in output.
    //
    // Scoped by the SECTION, not by `[data-sui-behavior="tabs"]`: the canvas
    // renders `data-sui-part` (Canvas.tsx) but deliberately does not render the
    // behavior marker — there is no runtime on the design surface for it to
    // drive. The marker is an output concern, locked by the golden fixture.
    const toggle = canvas.locator("section").filter({ hasText: "Pay monthly, or save with annual" }).first();
    await expect(toggle.locator('[data-sui-part="tab"]')).toHaveCount(2);
    await expect(toggle.locator('[data-sui-part="panel"]')).toHaveCount(2);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The CTA family. Five asks of escalating size — a slim inline bar, a boxed
 * card, a split with media, a form, and the filled band. The guard that matters
 * is the band's buttons: a `btn-primary` on `bg-primary` is invisible, and it
 * looks completely correct in source.
 */
test("every CTA layout renders, is distinct, and the filled band keeps its buttons visible", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    for (const key of ["cta_band", "cta_split", "cta_card", "cta_signup", "cta_inline"]) {
        await insertBlock(page, key);
    }

    await expect(canvas.getByText("Ready to build something great?")).toBeVisible(); //    Band
    await expect(canvas.getByText("See it running on your own catalog")).toBeVisible(); // Split Media
    await expect(canvas.getByText("Still deciding?")).toBeVisible(); //                    Boxed Card
    await expect(canvas.getByText("Get the next one in your inbox")).toBeVisible(); //     Email Capture
    await expect(canvas.getByText("Want this set up for your store?")).toBeVisible(); //   Inline Bar

    // Email Capture is the only CTA that submits.
    await expect(canvas.locator('form input[type="email"]')).toHaveCount(1);

    // The band's solid action must not resolve to the same fill as the band. This
    // compares COMPUTED colors rather than class names, so it also catches a
    // theme whose `primary` and default `btn` surfaces happen to collide.
    const band = canvas.locator("section.bg-primary").first();
    const bandBg = await band.evaluate((n) => getComputedStyle(n).backgroundColor);
    const btnBg = await band.locator("a.btn").first().evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(btnBg).not.toBe(bandBg);

    expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The FEATURES family. The load-bearing assertion here is the Bento's spans:
 * `@xl:col-span-2` and `@3xl:row-span-2` are written as literal classes because
 * the harness `@source`-scans the blocks directory, and a computed span would be
 * invisible to that scan, generate no CSS, and silently flatten the bento into a
 * plain three-up grid — which looks deliberate.
 */
test("every features layout renders, and the bento spans actually generate", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    for (const key of ["feature_grid", "feature_media", "feature_alternating", "feature_bento", "feature_checklist"]) {
        await insertBlock(page, key);
    }

    // By ROLE: the harness boots with a Split CTA whose lead copy starts
    // "Everything you need to sell online", so a text match is ambiguous.
    await expect(canvas.getByRole("heading", { name: "Everything you need", exact: true })).toBeVisible(); // Grid
    await expect(canvas.getByText("Design, publish, and iterate in one place")).toBeVisible(); // Media Split
    await expect(canvas.getByText("Built for the whole job, not the demo")).toBeVisible(); //    Alternating
    await expect(canvas.getByText("One platform, four fewer subscriptions")).toBeVisible(); //   Bento
    await expect(canvas.getByText("What's included, in full")).toBeVisible(); //                 Checklist

    // The Bento's lead cell spans two tracks at board width...
    const leadCell = canvas.getByText("A storefront that stays fast").locator("..");
    await expect.poll(() => leadCell.evaluate((n) => getComputedStyle(n).gridColumnEnd)).toBe("span 2");
    // ...and drops to one on a phone, where an asymmetric bento is just a stack.
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await expect.poll(() => leadCell.evaluate((n) => getComputedStyle(n).gridColumnEnd)).toBe("auto");

    expect(errors, errors.join("\n")).toHaveLength(0);
});

/**
 * The TESTIMONIAL family. Its distinctive guard is the Carousel: it is the first
 * block in the library to use the `carousel` behavior at all, so this is the
 * only place the macro's expansion (track / slides / prev / next / dots) is
 * exercised through the real palette→insert→render chain.
 */
test("every testimonial layout renders, and the carousel expands its full part set", async ({ page }) => {
    const errors = trackErrors(page);
    await ready(page);
    const canvas = page.locator(".sui-canvas");

    for (const key of [
        "testimonial_quote",
        "testimonials_grid",
        "testimonial_carousel",
        "testimonial_logos",
        "testimonial_portrait",
    ]) {
        await insertBlock(page, key);
    }

    await expect(canvas.getByText("doubled conversions", { exact: false })).toBeVisible(); //  Quote
    await expect(canvas.getByText("Loved by teams everywhere")).toBeVisible(); //              Grid
    await expect(canvas.getByText("In their words")).toBeVisible(); //                         Carousel
    await expect(canvas.getByText("The teams you'd expect, already here")).toBeVisible(); //   Logo Wall
    await expect(canvas.getByText("80%")).toBeVisible(); //                                    Portrait

    // Every layout binds its attribution with figure/figcaption — the only thing
    // that ties "Dana Whitfield" to the words above her for a screen reader.
    await expect(canvas.locator("figure figcaption").first()).toBeVisible();

    // The carousel's parts come from the `Carousel` macro, not hand-authored
    // nodes, so a regression in the macro surfaces here rather than nowhere.
    // Scoped by `.carousel-root` rather than the behavior marker: the canvas
    // renders `data-sui-part` (Canvas.tsx) but not `data-sui-behavior`, because
    // there is no runtime on the design surface for the marker to drive.
    const carousel = canvas.locator(".carousel-root").first();
    await expect(carousel.locator('[data-sui-part="track"]')).toHaveCount(1);
    await expect(carousel.locator('[data-sui-part="slide"]')).toHaveCount(3);
    await expect(carousel.locator('[data-sui-part="dot"]')).toHaveCount(3);
    await expect(carousel.locator('[data-sui-part="prev"]')).toHaveCount(1);
    await expect(carousel.locator('[data-sui-part="next"]')).toHaveCount(1);

    expect(errors, errors.join("\n")).toHaveLength(0);
});
