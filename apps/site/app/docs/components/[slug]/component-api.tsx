import { COMPONENT_API, type PropRow } from "@/lib/catalog-api";

/**
 * The half of a component page that was missing: how to actually use it — on each of
 * the three paths the component exists on.
 *
 * Two issues live here. #008: every page used to be a heading and a row of rendered
 * components, with no code block, no prop table and not one character a reader could
 * type. #009: the first fix for that documented only React, which turned silence into
 * a wrong answer for anyone with no bundler.
 *
 * Stacked, not tabbed, on purpose: tabs need client JavaScript, and a page documenting
 * a CSP-clean no-JS path should not require JS to read about it.
 *
 * A Server Component. `@/lib/catalog-api` carries ~240KB of demo sources across the
 * catalogue; rendered here it becomes prerendered HTML on one page, never a client
 * bundle every page pays for.
 */
export function ComponentApiSection({ slug, title }: { slug: string; title: string }) {
  const api = COMPONENT_API[slug];
  if (!api) return null;
  const { css, react, html } = api;
  if (!css && !react && !html) return null;

  return (
    <div className="mt-16 flex flex-col gap-14 border-t border-base-300 pt-12">
      <div>
        <h2 className="text-2xl font-semibold text-base-content">Using {title}</h2>
        <p className="mt-2 max-w-2xl text-md text-base-content">
          Silica ships one design system through three paths. They share a class
          vocabulary but are not interchangeable — pick the one that matches what you are
          building.
        </p>
      </div>

      {css && css.classes.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold text-base-content">
            Plain HTML — CSS classes
          </h3>
          <p className="mt-2 max-w-2xl text-md text-base-content">
            The Tailwind v4 plugin. Works in any framework or none — Rails, Django, PHP,
            Go, a static file.{" "}
            <strong className="font-semibold">This path ships no JavaScript</strong>, so a
            component that needs interaction is styled but inert. For behavior with no
            framework, use the node-tree path below.
          </p>
          <CodeBlock className="mt-4">{`/* in your CSS */\n@import "tailwindcss";\n@plugin "@wizeworks/silicaui";`}</CodeBlock>
          <p className="mt-6 text-md text-base-content">
            {css.root ? (
              <>
                Root class <Code>{css.root}</Code>, with {css.classes.length - 1} modifier
                {css.classes.length - 1 === 1 ? "" : "s"}:
              </>
            ) : (
              <>Classes in this family:</>
            )}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {css.classes.map((c) => (
              <li key={c}>
                <Code>.{c}</Code>
              </li>
            ))}
          </ul>
        </section>
      )}

      {react?.importLine && (
        <section>
          <h3 className="text-xl font-semibold text-base-content">React</h3>
          <p className="mt-2 max-w-2xl text-md text-base-content">
            Typed components over those same classes, with behavior and accessibility
            from Base UI.
          </p>
          <CodeBlock className="mt-4">{`npm i ${react.packageName}`}</CodeBlock>
          <CodeBlock className="mt-3">{react.importLine}</CodeBlock>

          {react.props.length > 0 && <PropsTable rows={react.props} />}

          {react.source && (
            <>
              <h4 className="mt-8 text-md font-semibold text-base-content">
                Source of the demo above
              </h4>
              {/*
                Labelled as the demo's source, NOT as a usage snippet, and the sentence
                below says why: it imports this site's own helpers, so "here's how to
                use it" would be a promise the reader cannot keep. What it IS good for
                is that it cannot drift from what is rendered above it.
              */}
              <p className="mt-2 max-w-2xl text-md text-base-content">
                The exact file that renders the examples above, so it can never drift
                from them. It imports a few of this site&rsquo;s own layout helpers
                (<Code>../lib/…</Code>), so read it for the component calls rather than
                copying it whole.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer rounded-field px-3 py-2 text-base-content hover:bg-base-200">
                  Show source
                </summary>
                <CodeBlock className="mt-3">{react.source}</CodeBlock>
              </details>
            </>
          )}
        </section>
      )}

      {html && (
        <section>
          <h3 className="text-xl font-semibold text-base-content">
            Vanilla — node tree to HTML
          </h3>
          <p className="mt-2 max-w-2xl text-md text-base-content">
            {html.doc ?? `The framework-neutral form of ${title}.`} Build a node tree,
            project it with <Code>toHtml()</Code>, and let the zero-dependency runtime
            hydrate it. This is the path for generated or user-authored documents — a
            site builder, CMS output, a static export.
          </p>
          <CodeBlock className="mt-4">
            {`npm i @wizeworks/silicaui-html @wizeworks/silicaui-behaviors`}
          </CodeBlock>
          {/*
            `atom(component, className, props, children)`. The second argument is a
            CLASS STRING, and on this path that is where the styling lives — there is
            no `color` prop here, the way there is in React. Both facts were got wrong
            first time and only caught by running the snippet: passing props second
            renders a class-less element, and `color: "primary"` produced a bare
            `<button>` with no `btn` class at all. See docs/personas/issues/010.
          */}
          <CodeBlock className="mt-3">
            {`import { atom, toHtml } from "@wizeworks/silicaui-html";\n\n` +
              `const node = atom(${JSON.stringify(html.name)}, ` +
              (css?.root ? JSON.stringify(css.root) : "undefined") +
              `, { /* props */ }` +
              (html.container ? `, [/* children */]` : ``) +
              `);\n` +
              `const markup = toHtml(node);`}
          </CodeBlock>
          <p className="mt-3 max-w-2xl text-md text-base-content">
            Styling on this path is the class string in the second argument — the same
            classes as the Plain HTML section above. There is no <Code>color</Code> prop
            here; write <Code>{`"${css?.root ?? "…"} ${css?.root ?? "…"}-primary"`}</Code>{" "}
            rather than passing a colour as a prop.
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-md font-semibold text-base-content">Takes children</dt>
              <dd className="text-md text-base-content">{html.container ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt className="text-md font-semibold text-base-content">
                Hydrated by
              </dt>
              <dd className="text-md text-base-content">
                {html.behaviors.length > 0 ? (
                  html.behaviors.map((b, i) => (
                    <span key={b}>
                      {i > 0 && ", "}
                      <Code>{b}</Code>
                    </span>
                  ))
                ) : (
                  <>nothing — this one is static markup</>
                )}
              </dd>
            </div>
          </dl>
          {html.behaviors.length > 0 && (
            <p className="mt-4 max-w-2xl text-md text-base-content">
              Load <Code>@wizeworks/silicaui-behaviors</Code> on the page or this markup
              renders correctly and does nothing.
            </p>
          )}
        </section>
      )}

      <p className="text-md text-base-content">
        The full API for <Code>{title}</Code>, on every path, is available through the
        Silica MCP server.
      </p>
    </div>
  );
}

function PropsTable({ rows }: { rows: PropRow[] }) {
  const groups = groupProps(rows);
  return (
    <>
      <h4 className="mt-8 text-md font-semibold text-base-content">Props</h4>
      {groups.map(({ iface, rows: r }) => (
        <div key={iface ?? "props"} className="mt-3">
          {groups.length > 1 && iface && (
            <h5 className="mono mb-2 text-sm text-base-content">{iface}</h5>
          )}
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="text-start">Prop</th>
                  <th className="text-start">Type</th>
                  <th className="text-start">Required</th>
                  <th className="text-start">Description</th>
                </tr>
              </thead>
              <tbody>
                {r.map((p) => (
                  <tr key={`${iface ?? ""}.${p.name}`}>
                    <td className="mono whitespace-nowrap align-top text-base-content">
                      {p.name}
                    </td>
                    <td className="mono align-top text-base-content">{p.type}</td>
                    <td className="align-top text-base-content">{p.required ? "yes" : "no"}</td>
                    <td className="align-top text-base-content">{p.doc ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="mono rounded-field bg-base-200 px-1.5 py-0.5 text-sm text-base-content">
      {children}
    </code>
  );
}

function CodeBlock({ children, className = "" }: { children: string; className?: string }) {
  return (
    <pre
      className={`mono overflow-x-auto rounded-box border border-base-300 bg-base-200 p-4 text-sm text-base-content ${className}`}
    >
      <code>{children}</code>
    </pre>
  );
}

/** Keep each interface's props together, in the order the catalog lists them. */
function groupProps(rows: PropRow[]): { iface: string | null; rows: PropRow[] }[] {
  const out: { iface: string | null; rows: PropRow[] }[] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.iface === r.iface) last.rows.push(r);
    else out.push({ iface: r.iface, rows: [r] });
  }
  return out;
}
