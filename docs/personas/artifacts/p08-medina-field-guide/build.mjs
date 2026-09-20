/**
 * Le générateur du Medina Field Guide.
 *
 *   node build.mjs
 *
 * Un arbre de nœuds entre, du HTML sort. Pas de React, pas de bundler, pas de
 * runtime côté serveur. `@wizeworks/silicaui-behaviors` est chargé sur la page
 * publiée pour rendre l'accordéon, les onglets et le carrousel vivants — un
 * seul <script src>, jamais de script inline, parce que la CSP l'interdit.
 */

import { mkdir, writeFile, rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { atom, toHtml } from "@wizeworks/silicaui-html";
import { ENTRIES } from "./content/entries.js";

const OUT = path.resolve("out");

/** Un élément brut. `el("p", "text-md", ["…"])` */
const el = (tag, cls, children, attrs) => ({
  kind: "element",
  tag,
  ...(cls ? { class: cls } : {}),
  ...(attrs ? { attrs } : {}),
  ...(children ? { children } : {}),
});

/**
 * L'inconnu, affiché comme inconnu.
 *
 * `built: null` ne veut pas dire 1970 et ne veut pas dire « ». Le tiret cadratin
 * est une MARQUE, pas une valeur: il porte un `title` et un `aria-label` pour
 * qu'un lecteur d'écran dise « date inconnue » au lieu de lire un tiret.
 */
const unknown = () =>
  el("span", "text-base-content", ["—"], {
    title: "Date inconnue",
    "aria-label": "Date inconnue",
    "data-unknown": "true",
  });

const builtCell = (built) => (built ? el("span", "tabular-nums", [built]) : unknown());

/** Le nom d'une entrée porte de l'arabe et du français dans la MÊME ligne.
 *  `dir="auto"` laisse le navigateur choisir la direction par le premier
 *  caractère fort de chaque segment — c'est la seule façon correcte de mélanger
 *  les deux sans découper la chaîne à la main. */
const title = (tag, cls, text) => el(tag, cls, [text], { dir: "auto" });

const TYPES = [...new Set(ENTRIES.map((e) => e.type))].sort();
const QUARTERS = [...new Set(ENTRIES.map((e) => e.quarter))].sort();

// ── le gabarit de page ──────────────────────────────────────────────────────
function page({ title: pageTitle, description, body, depth }) {
  // Chemins RELATIFS, sans « ./ » — c'est ce qu'un générateur statique écrit.
  const up = depth === 0 ? "" : "../".repeat(depth);
  const head = [
    `<!doctype html>`,
    `<html lang="fr" dir="ltr" data-theme="dune">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeText(pageTitle)}</title>`,
    `<meta name="description" content="${escapeText(description)}">`,
    `<link rel="stylesheet" href="${up}assets/guide.css">`,
    `</head>`,
    `<body class="min-h-screen bg-base-100">`,
  ].join("\n");
  // UN SEUL script, avec src. Jamais d'inline: la CSP n'a pas de 'unsafe-inline'.
  const tail = [`<script type="module" src="${up}assets/boot.js"></script>`, `</body>`, `</html>`, ``].join("\n");
  return head + "\n" + toHtml(body) + "\n" + tail;
}

function escapeText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── l'index ─────────────────────────────────────────────────────────────────
function indexTree() {
  // Tabs est un CONTENEUR: TabsTab et TabsPanel appariés par POSITION, pas une
  // liste `items`. Mon premier essai passait `{ items: [...] }` — une prop que
  // le macro ne connaît pas — et il a rendu `<div class="tabs">` VIDE, sans un
  // mot. Un nom de composant inconnu, lui, lève une erreur. Voir le journal.
  const tabs = atom("Tabs", "tabs", undefined, [
    atom(
      "TabsList",
      "tabs-list",
      undefined,
      // Encore un conteneur: le libellé est un ENFANT, pas une prop `label`.
      // Deuxième fois que j'invente une prop et que le macro rend un élément
      // VIDE sans rien dire. Voir le journal, acte 5.
      TYPES.map((t, i) => atom("TabsTab", "tabs-tab", { selected: i === 0 }, [t])),
    ),
    ...TYPES.map((t, i) =>
      atom("TabsPanel", "tabs-panel", { selected: i === 0 }, [
        el(
          "ul",
          "flex flex-col gap-2 pt-3",
          ENTRIES.filter((e) => e.type === t).map((e) =>
            el("li", null, [
              el("a", "link text-md", [e.title], { href: `entree/${e.slug}/`, dir: "auto" }),
            ]),
          ),
        ),
      ]),
    ),
  ]);

  return el("main", "mx-auto w-full max-w-3xl px-4 py-10", [
    el("header", "mb-10", [
      el("h1", "text-4xl font-semibold text-base-content", ["Medina Field Guide"]),
      el("p", "mt-3 text-lg text-base-content", [
        "Guide du patrimoine des médinas de Rabat et de Salé, publié par la fondation. ",
        `${ENTRIES.length} entrées.`,
      ]),
    ]),

    el("section", "mb-10", [
      el("h2", "text-2xl font-semibold text-base-content", ["Par type"]),
      el("div", "divider mt-2 mb-4"),
      tabs,
    ]),

    ...QUARTERS.map((q) =>
      el("section", "mb-10", [
        el("h2", "text-2xl font-semibold text-base-content", [q]),
        el("div", "divider mt-2 mb-4"),
        el(
          "ul",
          "flex flex-col gap-5",
          ENTRIES.filter((e) => e.quarter === q).map((e) =>
            el("li", null, [
              el("article", null, [
                title("h3", "text-md font-semibold text-base-content", e.title),
                el("p", "mt-1 text-md text-base-content", [
                  el("span", "badge badge-neutral badge-sm mr-2", [e.type]),
                  "Construit : ",
                  builtCell(e.built),
                ]),
                // href RELATIF NU — « entree/bab-er-rouah/ », sans « ./ ».
                el("p", "mt-2", [
                  el("a", "link text-md", ["Lire la notice"], { href: `entree/${e.slug}/` }),
                ]),
              ]),
            ]),
          ),
        ),
      ]),
    ),
  ]);
}

// ── une notice ──────────────────────────────────────────────────────────────
function entryTree(entry) {
  const hours = atom("Collapse", "details", {
    title: "Horaires de visite",
    content: entry.hours ?? "Horaires non communiqués à la fondation.",
  });

  // Même leçon que pour Tabs: Carousel est un conteneur de CarouselItem.
  const photos = atom(
    "Carousel",
    "carousel",
    undefined,
    [1, 2, 3].map((n) =>
      atom("CarouselItem", "carousel-item", undefined, [
        el("figure", null, [
          // Chemin relatif NU — « photos/… » depuis deux niveaux, sans « ./ ».
          el("img", "w-full rounded-box", null, {
            src: `../../photos/placeholder-${n}.svg`,
            alt: `${entry.title} — vue ${n}`,
            width: 1200,
            height: 800,
            loading: "lazy",
          }),
          el("figcaption", "mt-2 text-md text-base-content", [`Vue ${n} — `, { kind: "element", tag: "span", attrs: { dir: "auto" }, children: [entry.title] }]),
        ]),
      ]),
    ),
  );

  return el("main", "mx-auto w-full max-w-2xl px-4 py-10", [
    el("nav", "mb-6", [el("a", "link text-md", ["← Toutes les entrées"], { href: "../../" })]),

    el("article", null, [
      title("h1", "text-3xl font-semibold text-base-content", entry.title),
      el("p", "mt-3 text-md text-base-content", [
        el("span", "badge badge-neutral mr-2", [entry.type]),
        el("span", "mr-2", [entry.quarter]),
        "Construit : ",
        builtCell(entry.built),
      ]),

      el("p", "mt-6 text-md text-base-content", [entry.body]),

      ...(entry.exhibition
        ? [
            el("p", "mt-6 text-md text-base-content", [
              el("strong", null, ["Exposition : "]),
              entry.exhibition.title,
              " — jusqu'au ",
              // Une VRAIE date, en <time datetime>. « 14th c. » n'en est pas une
              // et ne passe jamais par ici.
              el("time", "tabular-nums", [entry.exhibition.until], { datetime: "2026-12-31T23:59:00+01:00" }),
            ]),
          ]
        : []),

      el("section", "mt-8", [el("h2", "sr-only", ["Horaires"]), hours]),
      el("section", "mt-8", [
        el("h2", "text-xl font-semibold text-base-content mb-3", ["Photographies"]),
        photos,
      ]),
    ]),
  ]);
}

// ── écriture ────────────────────────────────────────────────────────────────
async function main() {
  // Regénérer dans le MÊME dossier deux fois de suite doit donner le même
  // résultat, pas un doublon. On efface d'abord.
  if (existsSync(OUT)) await rm(OUT, { recursive: true });
  await mkdir(path.join(OUT, "assets"), { recursive: true });

  await writeFile(
    path.join(OUT, "index.html"),
    page({
      title: "Medina Field Guide — Rabat et Salé",
      description: `Guide du patrimoine des médinas de Rabat et de Salé. ${ENTRIES.length} entrées.`,
      body: indexTree(),
      depth: 0,
    }),
    "utf8",
  );

  for (const entry of ENTRIES) {
    const dir = path.join(OUT, "entree", entry.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "index.html"),
      page({
        title: `${entry.title} — Medina Field Guide`,
        description: entry.body.slice(0, 150),
        body: entryTree(entry),
        depth: 2,
      }),
      "utf8",
    );
  }

  // Le runtime, copié tel quel. Un fichier, chargé par <script src>.
  const runtime = path.resolve("node_modules/@wizeworks/silicaui-behaviors/dist/index.js");
  if (existsSync(runtime)) {
    await cp(runtime, path.join(OUT, "assets", "behaviors.js"));
    await cp(path.resolve("src/boot.js"), path.join(OUT, "assets", "boot.js"));
  } else {
    console.warn("!! runtime introuvable:", runtime);
  }

  // les images, copiées telles quelles
  await cp(path.resolve("photos"), path.join(OUT, "photos"), { recursive: true });

  console.log(`écrit: 1 index + ${ENTRIES.length} notices → ${OUT}`);
}

await main();
