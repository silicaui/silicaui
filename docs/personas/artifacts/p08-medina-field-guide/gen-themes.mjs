// Les tokens des deux thèmes, écrits en CSS depuis le paquet lui-même.
import { writeFile } from "node:fs/promises";
import { presetByName, resolveThemeTokens } from "@wizeworks/silicaui-html";

const block = (name, mode, extra) => {
  const t = resolveThemeTokens(presetByName(name), mode);
  const lines = Object.entries(t).map(([k, v]) => `  ${k}: ${v};`);
  return [`@plugin "@wizeworks/silicaui/theme" {`, `  name: ${name};`,
    `  color-scheme: ${mode};`, ...extra, ...lines, `}`].join("\n");
};

await writeFile("src/themes.css",
  [block("dune", "light", ["  default: true;"]),
   "",
   block("obsidian", "dark", ["  prefersdark: true;"]),
   ""].join("\n"), "utf8");
console.log("src/themes.css écrit");
