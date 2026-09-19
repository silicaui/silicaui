import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 writes an AGENTS.md and a CLAUDE.md into the project root on every dev
  // start. Inside this repo that is a hazard: a stray CLAUDE.md is a binding
  // instruction file, and this one is Next's boilerplate about Next, not Brandon's.
  // Turned off rather than deleted, because deleting it only lasted until the next
  // `next dev`.
  agentRules: false,
};

export default nextConfig;
