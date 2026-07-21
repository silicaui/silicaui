/**
 * Builders for `/llms.txt` and `/llms-full.txt` — the emerging convention for
 * handing large language models a clean, structured, markdown map of a site
 * (see llmstxt.org). This is the AEO analogue of a sitemap: instead of making
 * an answer engine reverse-engineer the site from rendered HTML, we give it the
 * canonical facts and the full component index in the format it reads best.
 *
 * Generated from the same `DEMO_META` + site constants as the pages and the
 * sitemap, so it can never drift from what the site actually ships.
 */
import { DEMO_META } from "@wizeworks/silicaui-demos/meta";
import {
  GITHUB_URL,
  NPM_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  componentAbstract,
  componentDescription,
  url,
} from "./site";

const sortedComponents = [...DEMO_META].sort((a, b) =>
  a.title.localeCompare(b.title),
);

/** Concise index — the llms.txt spec shape: H1, blockquote summary, sections. */
export function buildLlmsTxt(): string {
  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SITE_TAGLINE}`);
  lines.push("");
  lines.push(SITE_DESCRIPTION);
  lines.push("");
  lines.push("## Documentation");
  lines.push(
    `- [Getting started](${url("/docs/getting-started")}): install SilicaUI, register the Tailwind plugin, and bring your own OKLCH tokens.`,
  );
  lines.push(
    `- [Components & documentation](${url("/docs")}): every component with a live, interactive demo.`,
  );
  lines.push(`- [About](${url("/about")}): why SilicaUI exists and how it is built.`);
  lines.push("");
  lines.push("## Components");
  for (const c of sortedComponents) {
    lines.push(
      `- [${c.title}](${url(`/docs/components/${c.id}`)}): ${componentAbstract(c.id, c.title)}`,
    );
  }
  lines.push("");
  lines.push("## Source & packages");
  lines.push(`- [GitHub repository](${GITHUB_URL})`);
  lines.push(`- [npm package @wizeworks/silicaui](${NPM_URL})`);
  lines.push("");
  return lines.join("\n");
}

/** Full feed — the same index but with each component's complete description,
 *  so an engine can answer "what is SilicaUI's X" without fetching the page. */
export function buildLlmsFullTxt(): string {
  const lines: string[] = [];
  lines.push(`# ${SITE_NAME} — full reference`);
  lines.push("");
  lines.push(`> ${SITE_TAGLINE}`);
  lines.push("");
  lines.push(SITE_DESCRIPTION);
  lines.push("");
  lines.push("## What makes it different");
  lines.push(
    "- CSS-first: components are styled with real, static CSS classes — no runtime CSS-in-JS, no per-render style injection.",
  );
  lines.push(
    "- OKLCH design tokens: every color class is a pure CSS-variable setter, so declaring one named color re-tints every variant and utility with no rebuild and no safelist.",
  );
  lines.push(
    "- Three synchronized layers: silicaui-react (React), silicaui-html (framework-neutral node tree + HTML projection), and silicaui-behaviors (zero-dependency vanilla runtime that hydrates the same markup).",
  );
  lines.push(
    "- Accessible by default: interactive components wrap Base UI, so focus management, keyboard support, and ARIA come built in.",
  );
  lines.push(
    "- Theme islands: nest data-theme on any wrapper and everything inside resolves against that theme's tokens, with no per-theme CSS.",
  );
  lines.push("");
  lines.push("## Components");
  lines.push("");
  for (const c of sortedComponents) {
    lines.push(`### ${c.title}`);
    lines.push(url(`/docs/components/${c.id}`));
    lines.push("");
    lines.push(componentDescription(c.id, c.title));
    lines.push("");
  }
  lines.push("## Source & packages");
  lines.push(`- GitHub: ${GITHUB_URL}`);
  lines.push(`- npm: ${NPM_URL}`);
  lines.push("");
  return lines.join("\n");
}
