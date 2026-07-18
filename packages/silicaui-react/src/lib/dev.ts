/**
 * Shared dev-diagnostics helpers for the `render` composition path.
 *
 * `process` is declared locally rather than pulling in `@types/node` — this is
 * a browser package. Bundlers replace `process.env.NODE_ENV` with a literal so
 * the verbose guidance is dropped from production builds; the `typeof` guard
 * covers unbundled ESM where `process` genuinely doesn't exist.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

export const isDev =
  typeof process !== "undefined" && process?.env?.NODE_ENV !== "production";

/**
 * Both `render` failure modes are silent — one drops the element's props, the
 * other swaps the rendered tag — so each produces a page that looks right and
 * behaves wrong. That's worth a `console.error` in every environment; only the
 * remediation detail is dev-gated.
 */
export function warnRender(owner: string, summary: string): void {
  console.error(
    `[silicaui] <${owner} render={…}> ${summary}` +
      (isDev
        ? `\n@wizeworks/silicaui-react is a "use client" module, so an element created in a ` +
          `React Server Component is serialized across the boundary and arrives unusable.\n` +
          `Fix: style the element directly instead of composing it, using the class builder ` +
          `from the server-safe entry point —\n` +
          `  import { buttonClasses } from "@wizeworks/silicaui-react/server";\n` +
          `  <a href="/docs" className={buttonClasses({ color: "brand" })}>Docs</a>\n` +
          `Or mark the calling component "use client" if it genuinely needs interactivity.`
        : ""),
  );
}
