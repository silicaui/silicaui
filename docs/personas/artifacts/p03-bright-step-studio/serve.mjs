/**
 * Marlene's hosting, in miniature: static files and a strict Content-Security-
 * Policy. No `'unsafe-inline'`, for scripts or styles — that is the constraint,
 * not an option, and it is why the published markup carries behaviour MARKERS
 * that one external script hydrates rather than inline handlers.
 *
 *   node serve.mjs 8031
 *
 * Nothing here knows about the builder. That is the point of act 8.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("out");
const PORT = Number(process.argv[2] ?? 8031);

export const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join("; ");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    } catch {
      // A clean URL with no trailing slash — `/fees` — is the form the nav emits.
      file = path.join(ROOT, decodeURIComponent(url.pathname), "index.html");
    }
    if (!path.resolve(file).startsWith(ROOT)) {
      res.writeHead(403).end("no");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
      "content-security-policy": CSP,
      "x-content-type-options": "nosniff",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end("<h1>Not found</h1>");
  }
}).listen(PORT, () => console.log(`Bright Step Studio on http://localhost:${PORT}`));
