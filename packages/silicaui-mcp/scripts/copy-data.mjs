// Copies the generated catalog JSON into dist/ after a tsup build, since it's
// read from disk at runtime rather than bundled.
import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, "..", "src", "data");
const dest = path.join(root, "..", "dist", "data");

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[@wizeworks/silicaui-mcp] copied catalog data → dist/data");
