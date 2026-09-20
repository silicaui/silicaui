/**
 * Where the Dispatch's images live.
 *
 * An email does not carry its pictures — it points at them, and every client
 * fetches them over the open internet or refuses to. So the covers and the
 * wordmark are served from here, exactly as a real shop's CDN would serve
 * them, and the composed HTML references absolute URLs. Nothing here knows
 * about the builder.
 *
 *   node serve.mjs 8032
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(".");
const PORT = Number(process.argv[2] ?? 8032);

const TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".html": "text/html; charset=utf-8",
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const file = path.resolve(ROOT, rel);
  // Never serve outside the artifact folder, whatever the request says.
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      // Mail clients and their proxies cache aggressively; say so honestly.
      "Cache-Control": "public, max-age=3600",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => console.log(`Dispatch images on http://localhost:${PORT}/`));
