import { test, expect, type Page } from "@playwright/test";
import { toEmailHtml } from "../src/email/projector";
import type { Align, ContentNode, EmailDocument, SectionNode } from "../src/email/schema";

/**
 * A block lands in the inbox where the canvas shows it. The canvas places a
 * left button at the left; the projected HTML used to draw it centered, because
 * the section's cell says `align="center"` (browsers read it as
 * `text-align: -webkit-center`, which centers block children, tables included)
 * and the button's own table said "left" only as `margin: 0`. Found by sparx
 * persona P01, act 10 (issue 155): "Book a winter check" sat left on the canvas
 * and centered in "Preview & check".
 *
 * This renders the projector's real output in a browser and measures each
 * block against the section's content edges, for every alignment, inside a
 * section of every alignment.
 */

const PAD = 24;
const BODY = 600;
const ALIGNS: Align[] = ["left", "center", "right"];

function block(kind: "button" | "social" | "image" | "video", align: Align): ContentNode {
  const id = `${kind}-${align}`;
  switch (kind) {
    case "button":
      return { id, kind, label: id, href: "https://example.com/", bg: "#111827", color: "#ffffff", radius: 6, align, paddingX: 16, paddingY: 14 };
    case "social":
      return { id, kind, links: [{ platform: "facebook", url: "https://example.com/" }], align, iconSize: 32, gap: 8 };
    case "image":
      // A linked image too: the link wraps it, and it still has to land in place.
      return { id, kind, src: "https://example.com/a.png", alt: id, width: 120, align, ...(align === "left" ? {} : { href: "https://example.com/" }) };
    case "video":
      return { id, kind, href: "https://example.com/", thumbnail: "https://example.com/v.png", width: 120, align, showPlayButton: false };
  }
}

function doc(sectionAlign: Align | undefined): EmailDocument {
  const section: SectionNode = {
    id: "s",
    kind: "section",
    bg: "#ffffff",
    paddingX: PAD,
    paddingY: PAD,
    ...(sectionAlign ? { align: sectionAlign } : {}),
    children: (["button", "social", "image", "video"] as const).flatMap((kind) => ALIGNS.map((a) => block(kind, a))),
  };
  return {
    version: "1",
    subject: "Alignment",
    preheader: "",
    root: { id: "b", kind: "body", width: BODY, bg: "#f4f4f5", contentBg: "#ffffff", fontFamily: "Arial", children: [section] },
  };
}

/** Each block's own box: the button's and social row's table, the image, the video's thumbnail. */
async function boxes(page: Page): Promise<Record<string, { left: number; right: number }>> {
  return page.evaluate(() => {
    const out: Record<string, { left: number; right: number }> = {};
    const put = (key: string, el: Element | null) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      out[key] = { left: r.left, right: r.right };
    };
    const body = document.querySelector(".sui-body")!;
    put("body", body);
    for (const a of ["left", "center", "right"]) {
      const button = [...document.querySelectorAll("a")].find((el) => el.textContent === `button-${a}`);
      put(`button-${a}`, button?.closest("table") ?? null);
      put(`image-${a}`, document.querySelector(`img[alt="image-${a}"]`));
    }
    // Social rows and video thumbnails carry no label of their own; they come in
    // document order, left, center, right.
    const socials = [...document.querySelectorAll("a")].filter((el) => el.textContent === "f").map((el) => el.closest("table"));
    const videos = [...document.querySelectorAll('img[alt="Video thumbnail"]')];
    ["left", "center", "right"].forEach((a, i) => {
      put(`social-${a}`, socials[i] ?? null);
      put(`video-${a}`, videos[i] ?? null);
    });
    return out;
  });
}

for (const sectionAlign of [undefined, "left", "center", "right"] as const) {
  test(`blocks land where they are aligned, in a section aligned ${sectionAlign ?? "(default)"}`, async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 1600 });
    await page.setContent(toEmailHtml(doc(sectionAlign)));
    const b = await boxes(page);
    const start = b.body!.left + PAD;
    const end = b.body!.right - PAD;
    const middle = (start + end) / 2;

    for (const kind of ["button", "social", "image", "video"]) {
      for (const a of ALIGNS) {
        const box = b[`${kind}-${a}`];
        expect(box, `${kind}-${a} rendered`).toBeDefined();
        const where = `${kind} aligned ${a}`;
        if (a === "left") expect.soft(box!.left, where).toBeCloseTo(start, 0);
        if (a === "right") expect.soft(box!.right, where).toBeCloseTo(end, 0);
        if (a === "center") expect((box!.left + box!.right) / 2, where).toBeCloseTo(middle, 0);
      }
    }
  });
}
