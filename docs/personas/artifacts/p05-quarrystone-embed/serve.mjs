/**
 * Quarrystone's static hosting, in miniature.
 *
 *   node serve.mjs 8033
 *
 * Serves `out/` and nothing else — no builder, no React, no bundler. The one
 * dynamic route is `POST /leads`, which is what our static host proxies through
 * to the API, so the enquiry form on a published plant page really does post
 * somewhere.
 *
 * A strict Content-Security-Policy, with no `'unsafe-inline'` for scripts,
 * because the whole claim being tested is that a published plant page needs no
 * script at all.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("out");
const PORT = Number(process.argv[2] ?? 8033);

const CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

/** Every lead this run received, so the check can prove the post landed. */
export const leads = [];

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "POST" && url.pathname === "/leads") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const fields = Object.fromEntries(new URLSearchParams(body));
    leads.push(fields);
    console.log("lead received:", JSON.stringify(fields));
    res.writeHead(303, { Location: "/tack/", "Content-Security-Policy": CSP });
    res.end();
    return;
  }

  if (url.pathname === "/tack/" || url.pathname === "/tack") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": CSP });
    res.end(
      `<!doctype html><html lang="sv"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<title>Tack — Quarrystone</title><link rel="stylesheet" href="/assets/site.css"></head>` +
        `<body class="p-8 text-base text-base-content bg-base-100">` +
        `<h1 class="text-2xl font-bold">Tack för din förfrågan</h1>` +
        `<p class="mt-2">Vi svarar inom en arbetsdag.</p></body></html>`,
    );
    return;
  }

  if (url.pathname === "/leads.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(leads));
    return;
  }

  let file = path.join(ROOT, url.pathname);
  if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
  if (!path.extname(file)) file = path.join(file, "index.html");
  if (!path.resolve(file).startsWith(ROOT)) {
    res.writeHead(403).end("no");
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
      "Content-Security-Policy": CSP,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": CSP });
    res.end("<!doctype html><title>404</title><p>Inte hittad.</p>");
  }
});

server.listen(PORT, () => console.log(`Quarrystone static host on http://localhost:${PORT}/`));
