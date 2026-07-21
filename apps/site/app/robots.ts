import type { MetadataRoute } from "next";
import { SITE_URL, url } from "@/lib/site";

/**
 * robots.txt. We WANT to be crawled and quoted — by classic search and by the
 * AI answer engines especially — so nothing is disallowed. The explicit
 * per-agent `allow` entries are a positive signal (and a guard against a future
 * blanket restriction accidentally shutting the AI crawlers out): being the
 * source an answer engine lifts text from is the entire point of AEO.
 */
const AI_AND_SEARCH_AGENTS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google (Gemini/AI Overviews training) + classic
  "Google-Extended",
  "Googlebot",
  // Apple Intelligence, Amazon, Microsoft, Meta, Cohere, Common Crawl
  "Applebot-Extended",
  "Applebot",
  "Amazonbot",
  "Bingbot",
  "meta-externalagent",
  "cohere-ai",
  "CCBot",
  "DuckDuckBot",
];

// Bake to a static /robots.txt at build time (required by `output: export`).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_AND_SEARCH_AGENTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: url("/sitemap.xml"),
    host: SITE_URL,
  };
}
