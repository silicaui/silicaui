/**
 * Le serveur de la fondation, en miniature: des fichiers statiques et UNE
 * politique de sécurité stricte. Pas de 'unsafe-inline', ni pour les scripts
 * ni pour les styles. C'est la contrainte, pas une option.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("out");
const PORT = Number(process.argv[2] ?? 8030);

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
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(ROOT, rel);
  // Pas de sortie du dossier out/.
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("403");
    return;
  }
  try {
    const s = await stat(file);
    if (s.isDirectory()) {
      res.writeHead(302, { Location: rel + "/" }).end();
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
    res.writeHead(404, { "content-security-policy": CSP, "content-type": "text/html; charset=utf-8" });
    res.end("<!doctype html><title>404</title><p>Introuvable.</p>");
  }
}).listen(PORT, () => console.log(`out/ servi sur http://127.0.0.1:${PORT} sous CSP stricte`));
