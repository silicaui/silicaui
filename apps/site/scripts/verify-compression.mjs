/** Probe: nginx compresses text assets, and the image pre-compresses them for gzip_static. */
import { readFileSync } from "node:fs";

const conf = readFileSync(new URL("../nginx.conf", import.meta.url), "utf8");
const docker = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
const checks = [
  ["gzip on", /^\s*gzip\s+on;/m.test(conf)],
  ["gzip_static on", /^\s*gzip_static\s+on;/m.test(conf)],
  ["gzip_vary on", /^\s*gzip_vary\s+on;/m.test(conf)],
  ["gzip_proxied any (Caddy adds Via)", /^\s*gzip_proxied\s+any;/m.test(conf)],
  ["gzip_types has css", /gzip_types[^;]*text\/css/.test(conf)],
  ["Dockerfile pre-compresses css", /gzip -9 -k[^\n]*/.test(docker) && /\*\.css/.test(docker)],
  ["Dockerfile drops back to uid 101", /USER 101\s*$/m.test(docker)],
];
console.log("Docs site compression");
for (const [name, ok] of checks) console.log(`  ${ok ? "✓" : "✗"} ${name}`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
