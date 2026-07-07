#!/usr/bin/env node
import { main } from "../dist/server.js";

main().catch((err) => {
  console.error("[silicaui-mcp] fatal:", err);
  process.exit(1);
});
