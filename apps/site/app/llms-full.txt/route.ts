import { buildLlmsFullTxt } from "@/lib/llms";

// Emitted as a static /llms-full.txt file by the static export.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
