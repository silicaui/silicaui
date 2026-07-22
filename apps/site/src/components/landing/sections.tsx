"use client";

import Link from "next/link";
import { Badge, Button, Rating } from "@wizeworks/silicaui-react";
import { InstallCommand } from "./install-command";
import { ElementCard } from "./element-card";
import { PropsDemo } from "./props-demo";
import { Reveal } from "./reveal";

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
   Hero — a dark theme island, so the Si·14 element tile reads as the lit thing
   on the page. The live component wall it used to hold now has its own act
   directly below (see ThemeWall), where a scoped theme toggle can drive it.
   --------------------------------------------------------------------------- */

export function Hero() {
  return (
    <section data-theme="dark" className="relative overflow-hidden bg-base-100">
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 pb-24 pt-20 md:pb-28 md:pt-24 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-6xl font-semibold leading-[0.95] tracking-tight text-base-content md:text-7xl">
            Ship components, not decisions.
          </h1>

          <p className="max-w-md text-lg text-base-content">
            A Base UI behavior layer with CSS-first styling. Bring your own design tokens, keep
            accessible primitives underneath.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* primary, not brand: this is the site's real conversion button
                and its default palette (Quartz `primary`). `brand` is the
                demo token the picker drives further down — it must never own
                the main CTA, or a visitor's experiment could turn it garish. */}
            <Button render={<Link href="/docs/getting-started" />} color="primary" size="lg">
              Get started
            </Button>
            <InstallCommand />
          </div>
        </div>

        <ElementCard />
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
    <section className="border-t border-base-300 bg-base-100">
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
   The claim no one else in this category can make.

   `generatedHtml` is produced at build time by running the real
   `silicaui-html` node tree through the real `toHtml()` — see app/page.tsx.
   It is not a hand-written sample of what the output "would" look like, which
   is the whole reason the section is worth having: it cannot drift from what
   the package actually emits, because it IS what the package actually emits.
   --------------------------------------------------------------------------- */

export function NoFramework({ generatedHtml }: { generatedHtml: string }) {
  return (
    <section data-theme="dark" className="bg-base-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-base-content md:text-4xl">
          The same components, with no framework at all
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-base-content">
          React is one output, not the product. The node tree also projects to plain HTML that a
          zero-dependency runtime hydrates &mdash; real keyboard handling and focus management on a
          static page, with no bundler and no framework on the client.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-base-content">Authored once</span>
            <div className="mockup-code overflow-x-auto text-sm">
              <pre data-prefix="1">
                <code>{'atom("Switch", undefined, {'}</code>
              </pre>
              <pre data-prefix="2">
                <code>{'  color: "accent",'}</code>
              </pre>
              <pre data-prefix="3">
                <code>{"  defaultChecked: true,"}</code>
              </pre>
              <pre data-prefix="4">
                <code>{"})"}</code>
              </pre>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-base-content">Emitted by toHtml()</span>
            <div className="mockup-code overflow-x-auto text-sm">
              {generatedHtml.split("\n").map((line, i) => (
                <pre key={i} data-prefix={String(i + 1)}>
                  <code>{line}</code>
                </pre>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-box border border-base-300 bg-base-200 p-6">
          <Badge color="success">CSP-clean</Badge>
          <span className="text-base-content">
            No <code className="mono text-base-content">style</code> attributes and no inline
            script in the static output &mdash; verified by a probe on every build.
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Counts. Real, and checked against the repo rather than remembered.
   --------------------------------------------------------------------------- */

const STATS: { value: string; label: string }[] = [
  { value: "113", label: "Documented components" },
  { value: "34", label: "Vanilla behaviors" },
  { value: "13", label: "Published packages" },
  { value: "MIT", label: "Licensed, open source" },
];

export function StatsBand() {
  return (
    <section className="relative overflow-hidden border-t border-base-300 bg-base-200">
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-2 gap-10 px-6 py-24 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <div className="flex flex-col gap-2">
              {/* Deliberately NOT text-brand. A brand color used as a SURFACE
                  gets auto-derived contrast ink for free, so it stays legible
                  whatever the visitor picks; the same color used as ink on a
                  neutral surface has no such protection — drag lightness to
                  the top and these numerals vanish into the background. Scale
                  carries them instead, and the brand field below is where the
                  color earns its keep. */}
              <span className="text-6xl font-semibold tracking-tight text-base-content md:text-7xl">
                {s.value}
              </span>
              <span className="text-base-content">{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Breadth — real counts, each linking somewhere real.
   --------------------------------------------------------------------------- */

// The lean core — everything you get without pulling in a third-party engine.
const CORE: { name: string; desc: string }[] = [
  { name: "silicaui", desc: "The Tailwind v4 plugin — CSS system, tokens, one design language." },
  { name: "silicaui-react", desc: "React components on Base UI primitives." },
  { name: "silicaui-html", desc: "Framework-neutral node tree and HTML projection." },
  { name: "silicaui-behaviors", desc: "Zero-dependency runtime that hydrates static markup." },
];

// Opt-in siblings — each one is the ONLY place its heavy dependency lives, so
// the core never pays for a feature you didn't ask for. Naming the engine is
// the point: it's what you're choosing to take on when you add the package.
const OPT_IN: { name: string; engine: string }[] = [
  { name: "silicaui-charts", engine: "ECharts" },
  { name: "silicaui-table", engine: "TanStack Table" },
  { name: "silicaui-editor", engine: "TipTap" },
  { name: "silicaui-dnd", engine: "dnd-kit" },
  { name: "silicaui-panels", engine: "resizable-panels" },
  { name: "silicaui-builder", engine: "the visual builder" },
];

export function Ecosystem({ components }: { components: { id: string; title: string }[] }) {
  return (
    <section className="border-t border-base-300 bg-base-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 md:py-28">
        <Reveal>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-base-content md:text-5xl">
            {components.length} components across 13 packages
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-4 max-w-2xl text-lg text-base-content">
            Thirteen packages, but you install four. The core carries no third-party runtime; every
            heavy dependency lives in an opt-in sibling you add only when you reach for it.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr]">
          {/* Core — the four you actually install, emphasised. */}
          <Reveal>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-base-content">
                The core &mdash; installed together
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CORE.map((p) => (
                  <div
                    key={p.name}
                    className="flex flex-col gap-2 rounded-box border-2 border-primary/40 bg-base-100 p-4 shadow-sm"
                  >
                    <p className="mono font-semibold text-primary">{p.name}</p>
                    <p className="text-base-content">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Opt-in — lighter weight, each naming the engine it carries. */}
          <Reveal delay={120}>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-base-content">
                Opt-in power &mdash; add only what you need
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {OPT_IN.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between gap-2 rounded-box border border-base-300 bg-base-200 px-4 py-3"
                  >
                    <span className="mono text-base-content">{p.name}</span>
                    <Badge color="neutral" variant="soft">
                      {p.engine}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* The number, made real: every one of the 113 is a live, linked doc
            page. A claim becomes something a visitor can scan and click. */}
        <div className="mt-16 border-t border-base-300 pt-12">
          <Reveal>
            <h3 className="text-2xl font-semibold tracking-tight text-base-content md:text-3xl">
              Every one has a live page. Here are all {components.length}.
            </h3>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6 flex flex-wrap gap-2">
              {components.map((c) => (
                <Link
                  key={c.id}
                  href={`/docs/components/${c.id}`}
                  className="inline-flex items-center rounded-field border border-base-300 bg-base-100 px-3 py-1 text-sm text-base-content transition hover:border-primary hover:text-primary"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="flex flex-wrap gap-3 pt-12">
          <Button render={<Link href="/docs/components/button" />} color="primary" size="md">
            Browse the docs
          </Button>
          <Button render={<a href={NPM_URL} />} variant="outline" size="md">
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
    // A flat, full-bleed field of the product's real color (Quartz `primary`),
    // not the demo `brand` — the closing statement should wear the product's
    // identity, not a color a visitor was experimenting with two sections up.
    // `bg-primary` sets --u-accent-content to an auto-derived legible ink, so
    // the type stays readable on it without a hand-picked foreground.
    <section className="bg-primary">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7 px-6 py-32 text-center">
        <Reveal>
          {/* The ink class goes on the heading ITSELF, not the section: the
              plugin's global type ramp sets an explicit color on h1-h6, which
              beats inheritance — setting it only on the wrapper would leave the
              heading at base-content. */}
          <h2 className="text-5xl font-semibold leading-[1.0] tracking-tight text-[var(--u-accent-content)] md:text-7xl">
            Start with one line.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-xl text-[var(--u-accent-content)]">
            Install the package, bring your tokens, ship.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
            <InstallCommand />
            <Button render={<Link href="/docs" />} color="neutral" size="lg">
              Read the docs
            </Button>
          </div>
        </Reveal>
        <div className="flex items-center gap-3 pt-2">
          <Rating defaultValue={5} readOnly />
          <span className="text-[var(--u-accent-content)]">
            MIT licensed &mdash; free forever.
          </span>
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
