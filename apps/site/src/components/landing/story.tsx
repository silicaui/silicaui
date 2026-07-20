"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Calendar,
  ColorPicker,
  Combobox,
  Dropzone,
  Input,
  Kbd,
  MultiSelect,
  NativeSelect,
  PinInput,
  Progress,
  Status,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from "@wizeworks/silicaui-react";
import { Reveal } from "./reveal";

/**
 * The middle of the landing page, told as a sequence of problems a developer
 * has actually hit — not a feature list.
 *
 * Every section follows the same discipline: name the wall you run into with
 * the tools you already like, then demonstrate the fix with live components
 * rather than asserting it in prose. Nothing here is a screenshot or a mock;
 * if a claim can't be shown working, it doesn't get a section.
 *
 * VISUAL LANGUAGE: light editorial column, dark product panel. Every demo is a
 * `data-theme="dark"` island floating on a light section — which is the reason
 * the components read as a product surface instead of specimens pinned to a
 * white page. It also means each panel is a live proof of theme islands: the
 * markup inside is identical to what a light page would use, and the palette
 * swap costs no per-theme CSS.
 *
 * Tone matters. These are good tools with real trade-offs, and the reader
 * probably likes them — the copy names the trade-off, never the tool as a
 * mistake.
 */

function StorySection({
  id,
  surfaceClass,
  heading,
  problem,
  solution,
  demo,
  flip = false,
}: {
  id: string;
  /** A LITERAL class string, never composed. Tailwind's scanner only sees
      literals, so `bg-${surface}` would compile to nothing and the section
      would render unstyled — the same trap the builder's canvas hit. */
  surfaceClass: string;
  heading: string;
  problem: string;
  solution: string;
  demo: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden border-t border-base-300 ${surfaceClass}`}
    >
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-28 md:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className={`flex flex-col gap-5 ${flip ? "lg:order-2" : ""}`}>
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-tight text-base-content md:text-5xl">
              {heading}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="text-xl text-base-content">{problem}</p>
          </Reveal>
          <Reveal delay={140}>
            <p className="text-base-content">{solution}</p>
          </Reveal>
        </div>
        <div className={flip ? "lg:order-1" : ""}>
          <Reveal delay={120}>{demo}</Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * The dark product panel every demo lives in.
 *
 * `title` is app chrome — the label on a panel in a real product — not an
 * eyebrow introducing the section's heading, which lives in the other column
 * entirely.
 */
function DemoPanel({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="dark"
      className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 border-b border-base-300 bg-base-200 px-5 py-3">
        <span className="font-semibold text-base-content">{title}</span>
        {meta}
      </div>
      <div className="flex flex-col gap-5 p-6">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   0. Framing. Names the shared experience before making any claim, so the
      sections that follow read as answers rather than as a feature list.
   --------------------------------------------------------------------------- */

export function TheWall() {
  return (
    <section className="border-t border-base-300 bg-base-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center md:py-28">
        <h2 className="text-3xl font-semibold tracking-tight text-base-content md:text-4xl">
          The first five minutes are always great
        </h2>
        <p className="mt-5 text-lg text-base-content">
          Then you need a combobox with real keyboard support. Or your brand color, on a component
          that never heard of it. Or the same card inside a sidebar, where the breakpoints are
          suddenly wrong. None of that is in the quickstart, and all of it lands in your codebase.
        </p>
        <p className="mt-4 text-lg text-base-content">
          SilicaUI is what happened after hitting those walls enough times to treat them as one
          problem. Here are four of them, each with the fix running live on this page.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   1. The behavior gap — the honest critique of CSS-only libraries.
   --------------------------------------------------------------------------- */

/** What Base UI handles here, itemised — the concrete measure of the section. */
const HANDLED = [
  "Typeahead filtering with roving focus",
  "Escape and outside-click to dismiss",
  "aria-activedescendant on the live option",
  "Selection announced to a screen reader",
];

const REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-central-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
  "sa-east-1", "ca-central-1",
];

export function BehaviorGap() {
  const [region, setRegion] = useState<string | null>("eu-west-2");

  return (
    <StorySection
      id="behavior"
      surfaceClass="bg-base-200"
      heading="CSS-only libraries stop right where the hard part starts"
      problem="A class-based library gives you a beautiful combobox — as styles. The typeahead, the roving focus, the aria-activedescendant bookkeeping and the dismiss behavior are still yours to write, or you bolt on a second headless library and maintain two vocabularies that disagree about everything."
      solution="SilicaUI ships the styles and the behavior as one thing. Interaction comes from Base UI — the part you shouldn't have to take our word for — under classes that stay plain CSS. Type in the field beside this and drive it entirely from the keyboard."
      demo={
        <DemoPanel title="Deploy to region" meta={<Badge color="success">Live</Badge>}>
          <Combobox
            items={REGIONS}
            value={region}
            onValueChange={(v) => setRegion(v as string | null)}
            placeholder="Search regions…"
            color="primary"
          />

          {/* The concrete payoff, itemised rather than asserted. */}
          <ul className="flex flex-col gap-2 border-t border-base-300 pt-5">
            {HANDLED.map((h) => (
              <li key={h} className="flex items-center gap-3">
                <Status color="success" label="Handled" />
                <span className="text-base-content">{h}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <Kbd>&uarr;</Kbd>
            <Kbd>&darr;</Kbd>
            <Kbd>Enter</Kbd>
            <Kbd>Esc</Kbd>
            <span className="text-base-content">none of it wired by you</span>
          </div>
        </DemoPanel>
      }
    />
  );
}

/* ---------------------------------------------------------------------------
   2. The custom-color ceiling. Demonstrated with `brand`, a color invented by
      this site in app/globals.css — not one of silicaui's own roles.
   --------------------------------------------------------------------------- */

/**
 * One-click brand presets — the fast path beside the sliders' fine control,
 * on the SAME axis (a single `--color-brand`, never a whole-theme swap, which
 * is what would have made this muddy). Each swatch sets its own `--color-brand`
 * and paints via `bg-brand`, so it's a real brand island rather than a raw hex
 * fill — the mechanism demonstrating itself, one more time.
 */
const BRAND_PRESETS = [
  "oklch(0.58 0.24 320)",
  "oklch(0.58 0.20 250)",
  "oklch(0.62 0.17 155)",
  "oklch(0.68 0.19 55)",
  "oklch(0.58 0.24 25)",
];

export function BrandColor() {
  // Local, and deliberately so: the color the picker sets must only affect
  // what's ON SCREEN while you drag it. An earlier version themed the whole
  // page from here, which meant the payoff happened in sections you couldn't
  // see — inert in the moment, then a surprise on scroll. Everything this
  // state touches lives inside the panel below.
  const [brand, setBrand] = useState("oklch(0.58 0.24 320)");

  return (
    <StorySection
      id="color"
      surfaceClass="bg-base-100"
      flip
      heading="Pick a color. Watch it cascade."
      problem="Most systems ship a fixed palette. Adding your own color means a config entry, a rebuild, and then discovering the utility half exists but the component half doesn't — your brand gets a background utility but no button variant, or the reverse. So you hardcode a hex, and it stops responding to dark mode."
      solution="Drag the sliders and watch every component in the panel re-tint at once — the button variants, the badge, the ink, the border and the progress fill, all reading one token. No rebuild, no recompile. This isn't a video; it's the library running."
      demo={
        // Scoped here: --color-brand is set on this wrapper, so only the
        // components inside it follow the picker. Nothing off-screen moves.
        <div style={{ "--color-brand": brand } as React.CSSProperties}>
          <DemoPanel
            title="brand"
            meta={<span className="mono text-base-content">{brand}</span>}
          >
            {/* Fast path: one-click presets, same axis as the sliders. */}
            <div className="flex flex-wrap items-center gap-2">
              {BRAND_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Set brand to ${preset}`}
                  aria-pressed={brand === preset}
                  onClick={() => setBrand(preset)}
                  style={{ "--color-brand": preset } as React.CSSProperties}
                  className={`bg-brand size-8 rounded-field border-2 transition ${
                    brand === preset ? "border-base-content" : "border-transparent"
                  }`}
                />
              ))}
            </div>

            {/* The OKLCH editor — a real perceptual color space, not a
                native sRGB swatch dialog — for fine control. */}
            <ColorPicker value={brand} onValueChange={(v) => setBrand(v)} />

            <div className="flex flex-wrap items-center gap-2 border-t border-base-300 pt-5">
              <Button color="brand">btn-brand</Button>
              <Button color="brand" variant="outline">
                outline
              </Button>
              <Button color="brand" variant="soft">
                soft
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge color="brand">badge-brand</Badge>
              <span className="mono font-semibold text-brand">text-brand</span>
              <span className="mono rounded-field border-2 border-brand px-2 py-1 text-base-content">
                border-brand
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-base-content">Rollout to brand tier</span>
              <Progress value={64} max={100} color="brand" />
            </div>
          </DemoPanel>
        </div>
      }
    />
  );
}

/* ---------------------------------------------------------------------------
   3. Vocabulary consistency — the papercut class, stated plainly.
   --------------------------------------------------------------------------- */

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
type Size = (typeof SIZES)[number];

export function SizeVocabulary() {
  const [size, setSize] = useState<Size>("lg");

  return (
    <StorySection
      id="vocabulary"
      surfaceClass="bg-base-200"
      heading={'"size" should mean the same thing everywhere'}
      problem="You learn that size=“sm” works on the button, so you reach for it on the empty state — and nothing happens. Or the select supports three sizes and the input supports five. These gaps are invisible until you hit one, and they cost you a trip to the source to find out which components opted in."
      solution="Every sized component here implements the same five steps, and a probe fails the build if one of them goes missing. Change the size once and watch every component below move together — including the ones that historically wouldn't have."
      demo={
        <DemoPanel
          title="Density"
          meta={
            <ToggleGroup
              value={[size]}
              onValueChange={(v: unknown) => {
                const next = Array.isArray(v) ? v[0] : v;
                if (typeof next === "string" && next) setSize(next as Size);
              }}
              className="toggle-group-sm w-fit"
              aria-label="Component size"
            >
              {SIZES.map((s) => (
                <ToggleGroupItem key={s} value={s}>
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button color="primary" size={size}>
              Deploy
            </Button>
            <Badge color="primary" size={size}>
              Live
            </Badge>
            <Switch color="primary" size={size} defaultChecked />
            <Status color="success" size={size} label="Online" />
          </div>
          <Input placeholder="Search deployments" size={size} />
          <NativeSelect size={size} defaultValue="Production">
            <option>Production</option>
            <option>Staging</option>
          </NativeSelect>
        </DemoPanel>
      }
    />
  );
}

/* ---------------------------------------------------------------------------
   3b. The components you'd otherwise lose a sprint to.

   Buttons and badges are table stakes — every library has had them for years,
   and showing them off proves nothing. These four are where a component
   library is actually worth paying for: a date grid with correct month
   arithmetic, multi-select with chip removal and keyboard editing, a
   drag-and-drop zone with real rejection reasons, and a segmented pin field
   that handles paste. All live, all keyboard-operable.
   --------------------------------------------------------------------------- */

const FRAMEWORKS = ["Next.js", "Remix", "Astro", "SvelteKit", "Nuxt", "SolidStart"];

export function Showpieces() {
  const [date, setDate] = useState<Date | null>(null);
  const [stacks, setStacks] = useState<string[]>(["Next.js", "Astro"]);
  const [dropped, setDropped] = useState<string[]>([]);

  return (
    <section
      id="showpieces"
      className="relative overflow-hidden border-t border-base-300 bg-base-200"
    >
      <div className="relative mx-auto w-full max-w-6xl px-6 py-28 md:py-32">
        <Reveal>
          <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-base-content md:text-5xl">
            The components you&rsquo;d otherwise lose a sprint to
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-5 max-w-2xl text-xl text-base-content">
            Anyone can ship a button. These are the ones that quietly eat a week &mdash; month
            arithmetic, chip editing, drop rejection, paste handling. Every one below is live on
            this page right now, and every one is keyboard-operable.
          </p>
        </Reveal>

        {/* Stable, distinct colors — NOT brand. This section is separate from
            the picker, so tying it to that state would recolor these panels
            off-screen. Four real semantic colors also read as more alive than
            one repeated accent. */}
        <div className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <Reveal>
            <DemoPanel title="Calendar" meta={<Badge color="primary">month math</Badge>}>
              <Calendar value={date} onValueChange={(v) => setDate(v as Date)} color="primary" />
            </DemoPanel>
          </Reveal>

          <Reveal delay={90}>
            <DemoPanel title="Multi-select" meta={<Badge color="secondary">chips</Badge>}>
              <MultiSelect
                items={FRAMEWORKS}
                value={stacks}
                onValueChange={(v) => setStacks(v as string[])}
                placeholder="Add a framework…"
                color="secondary"
              />
              <p className="text-base-content">
                Backspace removes the last chip; type to filter what&rsquo;s left.
              </p>
            </DemoPanel>
          </Reveal>

          <Reveal delay={180}>
            <DemoPanel title="Dropzone" meta={<Badge color="accent">drag &amp; drop</Badge>}>
              <Dropzone
                accept="image/*"
                maxSize={2 * 1024 * 1024}
                hint="PNG or JPG, up to 2MB"
                onFiles={(fs) => setDropped(fs.map((f) => f.name))}
              />
              {dropped.length > 0 && (
                <p className="text-base-content">Accepted: {dropped.join(", ")}</p>
              )}
            </DemoPanel>
          </Reveal>

          <Reveal delay={270}>
            <DemoPanel title="Pin input" meta={<Badge color="success">paste-aware</Badge>}>
              <PinInput length={6} color="success" />
              <p className="text-base-content">
                Paste a six-digit code and it distributes across the fields.
              </p>
            </DemoPanel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   4. Container queries. The demo IS the argument: identical markup, two
      widths, different layouts — with no viewport breakpoint involved.
   --------------------------------------------------------------------------- */

function ReflowCard() {
  return (
    // @container makes this card measure ITSELF. The @sm: prefix below is a
    // container query, not a viewport breakpoint — which is why the two copies
    // of this exact markup lay out differently side by side.
    <div className="@container rounded-box border border-base-300 bg-base-200 p-4">
      <div className="flex flex-col gap-3 @sm:flex-row @sm:items-center @sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-base-content">Production</span>
          <span className="text-base-content">Deployed 4m ago</span>
        </div>
        <Badge color="success">Healthy</Badge>
      </div>
    </div>
  );
}

export function ContainerQueries() {
  return (
    <StorySection
      id="responsive"
      surfaceClass="bg-base-100"
      flip
      heading="Breakpoints are the wrong unit inside a sidebar"
      problem="A card built with viewport breakpoints is only correct in the place you first built it. Drop that same card into a sidebar, a bento cell or a two-column split and it thinks it has the whole window — so you fork it, or thread a size prop through every level to fake what CSS already knows."
      solution="SilicaUI components respond to their container instead. The two cards beside this are the exact same markup and the exact same classes, rendered at two widths in one viewport. Nothing was forked and no prop was passed."
      demo={
        <DemoPanel title="One card, two containers" meta={<Kbd>same markup</Kbd>}>
          <div className="flex flex-col gap-2">
            <span className="text-base-content">In a 16rem sidebar</span>
            <div className="w-64 max-w-full">
              <ReflowCard />
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-base-300 pt-5">
            <span className="text-base-content">In a full-width row</span>
            <ReflowCard />
          </div>
        </DemoPanel>
      }
    />
  );
}
