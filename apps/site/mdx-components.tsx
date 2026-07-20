import type { MDXComponents } from "mdx/types";
import { MdxProse } from "./mdx-prose-client";

// Required by @next/mdx for the app router. MDX prose doesn't need a
// per-element component map — `Prose` (packages/silicaui-react/src/prose.tsx,
// wrapped here via mdx-prose-client.tsx for its client boundary) already
// themes raw h1/p/a/code/etc. via CSS, the same as a Markdown renderer's
// output would. Mapping the special "wrapper" key runs every compiled .mdx
// page's content through it automatically.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: ({ children }) => (
      <MdxProse className="mx-auto max-w-3xl px-6 py-10">{children}</MdxProse>
    ),
    ...components,
  };
}
