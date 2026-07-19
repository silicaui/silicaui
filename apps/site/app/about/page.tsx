import { pageBody, stamp, THEME_PRESETS, toHtml, type Template } from "@wizeworks/silicaui-html";
import { contentProse, ctaBand, navbar } from "@wizeworks/silicaui-html/blocks";
import { fillSlots, type SlotContent } from "@/lib/fill-slots";
import { siteFooter, statsSection } from "@/lib/home-sections";

export const metadata = {
  title: "About — SilicaUI",
  description: "Why SilicaUI exists.",
};

const theme = THEME_PRESETS[0]!; // "quartz"

function build(template: Template, content: SlotContent) {
  const { root } = stamp(template, theme);
  return fillSlots(root, content);
}

const GITHUB_URL = "https://github.com/silicaui/silicaui";
const NPM_URL = "https://www.npmjs.com/package/@wizeworks/silicaui";

const ABOUT: Record<string, SlotContent> = {
  navbar: {
    brand: "SilicaUI",
    link1: { label: "Docs", href: "/docs" },
    link2: { label: "Components", href: "/docs/components/button" },
    link3: { label: "About", href: "/about" },
    link4: { label: "npm", href: NPM_URL },
    secondary: { label: "GitHub", href: GITHUB_URL },
    cta: { label: "Get started", href: "/docs/getting-started" },
  },
  prose: {
    eyebrow: "Why SilicaUI",
    heading: "Own your tooling, own your gaps",
    body1: "SilicaUI is a Base UI behavior layer with CSS-first styling: accessible primitives underneath, real Tailwind utility classes on top, and no config object standing between you and your own design tokens.",
    body2: "This site is built with SilicaUI's own component, block, and theming pipeline — the same one an external adopter would use. Building it this way is how we find the real gaps in our own tooling before anyone else does.",
  },
  ctaBand: {
    headline: "Come build with us.",
    subhead: "Install the package, bring your tokens, ship.",
    primary: { label: "Read the docs", href: "/docs" },
    secondary: { label: "Star on GitHub", href: GITHUB_URL },
  },
};

export default function AboutPage() {
  const root = pageBody([
    build(navbar, ABOUT.navbar!),
    build(contentProse, ABOUT.prose!),
    statsSection(),
    build(ctaBand, ABOUT.ctaBand!),
    siteFooter(),
  ]);
  const html = toHtml(root);
  // eslint-disable-next-line react/no-danger -- toHtml() output is SilicaUI's
  // own sanitized projection, the same one silicaui-behaviors hydrates below.
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
