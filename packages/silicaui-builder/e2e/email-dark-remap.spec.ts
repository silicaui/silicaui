import { test, expect } from "@playwright/test";
import { toEmailHtml } from "../src/email/projector";
import type { EmailDocument } from "../src/email/schema";

/**
 * Every surface the email paints can be recolored for dark mode by its `bgcolor`.
 *
 * Email HTML has no classes to hang a theme on, so a host's dark mode remaps by
 * VALUE: `[bgcolor="#e9ebee"]{background-color:#030507!important}` inside
 * `@media (prefers-color-scheme: dark)`. That works only where the projector
 * writes `bgcolor`. Sections, card sections and buttons did; the `<body>`, the
 * outer table and the `.sui-body` content table painted their color as inline
 * `background` only. In dark mode every block turned dark and the page under them
 * stayed light: dark cards on a light gray page. Found by sparx persona P01,
 * issue 160.
 *
 * This injects exactly that kind of value remap for every light color the
 * document uses and checks that nothing is left painted in one of them.
 */

const LIGHT = {
  page: "#e9ebee",
  content: "#f4f5f7",
  section: "#ffffff",
  card: "#fafafa",
  button: "#ce333c",
};
const DARK = "#000000";

function doc(): EmailDocument {
  return {
    version: "1",
    subject: "Dark",
    preheader: "",
    root: {
      id: "b",
      kind: "body",
      width: 600,
      bg: LIGHT.page,
      contentBg: LIGHT.content,
      fontFamily: "Arial",
      children: [
        {
          id: "plain",
          kind: "section",
          bg: LIGHT.section,
          paddingX: 24,
          paddingY: 24,
          children: [{ id: "t1", kind: "text", html: "A plain section", align: "left", color: "#111111", fontSize: 16, fontWeight: "normal", lineHeight: 24 }],
        },
        {
          id: "card",
          kind: "section",
          bg: LIGHT.card,
          paddingX: 24,
          paddingY: 24,
          marginX: 24,
          marginY: 12,
          radius: 12,
          children: [
            { id: "t2", kind: "text", html: "A card section", align: "left", color: "#111111", fontSize: 16, fontWeight: "normal", lineHeight: 24 },
            { id: "btn", kind: "button", label: "Book", href: "https://example.com/", bg: LIGHT.button, color: "#ffffff", radius: 6, align: "left", paddingX: 16, paddingY: 12 },
          ],
        },
      ],
    },
  };
}

test("a bgcolor remap reaches every surface the email paints", async ({ page }) => {
  const remap = Object.values(LIGHT)
    .map((hex) => `[bgcolor="${hex}"]{background-color:${DARK}!important}`)
    .join("");
  const html = toEmailHtml(doc(), { head: { css: remap } });
  await page.setContent(html);

  const leftLight = await page.evaluate((light) => {
    const toRgb = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
    };
    const lightRgb = new Map(Object.entries(light).map(([name, hex]) => [toRgb(hex), name]));
    const out: string[] = [];
    for (const el of [document.body, ...document.body.querySelectorAll("*")]) {
      const name = lightRgb.get(getComputedStyle(el).backgroundColor);
      if (name) out.push(`${el.tagName.toLowerCase()}${el.className ? "." + String(el.className) : ""} still ${name}`);
    }
    return out;
  }, LIGHT);

  expect(leftLight, "painted in a light color the dark remap could not reach").toEqual([]);
});
