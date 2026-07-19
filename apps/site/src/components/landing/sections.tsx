"use client";

import Link from "next/link";
import { Button } from "@wizeworks/silicaui-react";
import { InstallCommand } from "./install-command";
import { ThemeControl, ThemedWall, useThemePreview } from "./hero-demo";
import { PropsDemo } from "./props-demo";

const GITHUB_URL = "https://github.com/silicaui/silicaui";
const NPM_URL = "https://www.npmjs.com/package/@wizeworks/silicaui";

/* ---------------------------------------------------------------------------
   Nav
   --------------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "Components", href: "/docs/components/button" },
  { label: "About", href: "/about" },
];

export function SiteNav() {
  return (
    // Dark on purpose, matching the hero it sits on — a light bar against the
    // dark hero reads as a seam between two unrelated pages.
    <header
      data-theme="dark"
      className="sticky top-0 z-50 border-b border-base-300 bg-base-100"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="text-base font-semibold tracking-tight text-base-content">
          SilicaUI
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-base-content">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a href={GITHUB_URL} className="hidden text-base-content sm:inline">
            GitHub
          </a>
          <Button render={<Link href="/docs/getting-started" />} color="primary" size="sm">
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------------
   Hero — a dark theme island, so the product panel reads as the lit thing on
   the page.
   --------------------------------------------------------------------------- */

export function Hero() {
  const [theme, setTheme] = useThemePreview();

  return (
    <section data-theme="dark" className="overflow-hidden bg-base-100">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 pb-20 pt-16 md:pb-24 md:pt-20 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-5xl font-semibold tracking-tight text-base-content md:text-6xl">
            Ship components, not decisions.
          </h1>

          <p className="max-w-md text-lg text-base-content">
            A Base UI behavior layer with CSS-first styling. Bring your own design tokens, keep
            accessible primitives underneath.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button render={<Link href="/docs/getting-started" />} color="accent" size="lg">
              Get started
            </Button>
            <InstallCommand />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <p className="max-w-md text-base-content">
              Every component beside this is real and rendering live. Change the theme &mdash;
              their markup and classes never change, because a theme is a pure token swap.
            </p>
            <ThemeControl theme={theme} onThemeChange={setTheme} />
          </div>
        </div>

        <ThemedWall theme={theme} />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Differentiators
   --------------------------------------------------------------------------- */

const PILLARS = [
  {
    title: "CSS-first, no config object",
    body: "One Tailwind v4 plugin and a CSS block. Colors are real, overridable CSS variables — declare your own and every component follows, no rebuild step and no theme file to keep in sync.",
  },
  {
    title: "Base UI underneath",
    body: "Keyboard interaction, focus management and ARIA semantics come from Base UI rather than being reimplemented. SilicaUI supplies the look; the behavior is the part you shouldn't have to trust us on.",
  },
  {
    title: "Container-query responsive",
    body: "Components respond to the container they're placed in, not the viewport — the same card is correct in a sidebar, a bento cell and a full-width row without a breakpoint fork.",
  },
];

export function Pillars() {
  return (
    <section className="bg-base-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-base-content md:text-4xl">
          Everything you&rsquo;d expect, nothing you&rsquo;d fight
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-base-content">{p.title}</h3>
              <p className="text-base-content">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Props → classes, driven by the visitor. The one section where the API itself
   is the subject.
   --------------------------------------------------------------------------- */

export function PropsSection() {
  return (
    <section className="border-t border-base-300 bg-base-200">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-base-content md:text-4xl">
          Props in, real classes out
        </h2>
        <p className="mt-4 max-w-xl text-base-content">
          <code className="mono text-base-content">color</code> and{" "}
          <code className="mono text-base-content">variant</code> aren&rsquo;t a styling layer
          bolted on top &mdash; they resolve to the plugin&rsquo;s own classes, which is why the
          same two props work the same way on every component. Change them and watch both sides.
        </p>

        <div className="mt-12">
          <PropsDemo />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Breadth — real counts, each linking somewhere real.
   --------------------------------------------------------------------------- */

const ECOSYSTEM = [
  { name: "silicaui", desc: "Tailwind v4 plugin — the CSS system and tokens." },
  { name: "silicaui-react", desc: "React components on Base UI primitives." },
  { name: "silicaui-html", desc: "Framework-neutral node tree and HTML projection." },
  { name: "silicaui-behaviors", desc: "Vanilla runtime that hydrates static markup." },
  { name: "silicaui-charts", desc: "Token-themed charts (ECharts)." },
  { name: "silicaui-table", desc: "Data tables (TanStack Table)." },
  { name: "silicaui-editor", desc: "Rich text editing (TipTap)." },
  { name: "silicaui-builder", desc: "The visual site builder." },
];

export function Ecosystem({ componentCount }: { componentCount: number }) {
  return (
    // Alternates surfaces with the section above it so the page has rhythm
    // rather than one undifferentiated expanse.
    <section className="border-t border-base-300 bg-base-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-base-content md:text-4xl">
          {componentCount} components across 13 packages
        </h2>
        <p className="mt-4 max-w-xl text-base-content">
          Heavy dependencies live in opt-in siblings, so the core stays lean &mdash; install only
          the surface you actually use.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM.map((p) => (
            <div
              key={p.name}
              className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-5"
            >
              <p className="font-semibold text-base-content">{p.name}</p>
              <p className="text-sm text-base-content">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-8">
          <Button render={<Link href="/docs/components/button" />} variant="outline" size="sm">
            Browse all components
          </Button>
          <Button render={<a href={NPM_URL} />} variant="ghost" size="sm">
            View on npm
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Close + footer
   --------------------------------------------------------------------------- */

export function ClosingCta() {
  return (
    <section data-theme="dark" className="bg-base-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center md:py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-base-content md:text-4xl">
          Start with one line.
        </h2>
        <p className="text-base-content">Install the package, bring your tokens, ship.</p>
        <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row">
          <InstallCommand />
          <Button render={<Link href="/docs" />} color="accent" size="lg">
            Read the docs
          </Button>
        </div>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "Components", href: "/docs/components/button" },
  { label: "About", href: "/about" },
  { label: "GitHub", href: GITHUB_URL },
  { label: "npm", href: NPM_URL },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-semibold tracking-tight text-base-content">SilicaUI</p>
          <p className="text-base-content">A component library that stays out of your way.</p>
        </div>
        <ul className="flex flex-wrap gap-x-7 gap-y-2">
          {FOOTER_LINKS.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="text-base-content">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-6xl border-t border-base-300 px-6 py-6">
        <p className="text-base-content">MIT licensed &mdash; open source.</p>
      </div>
    </footer>
  );
}
