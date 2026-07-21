import { buildLlmsTxt } from "@/lib/llms";

// Emitted as a static /llms.txt file by the static export. `force-static` is
// required so `output: export` can bake it at build time.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
